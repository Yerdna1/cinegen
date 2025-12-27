/**
 * Audio Generation Routes
 *
 * API endpoints for TTS audio generation for scene dialogue.
 */

const express = require('express');
const router = express.Router();
const { generateSpeech } = require('../../services/tts-factory');
const storage = require('../../services/storage');
const {
  getVoiceConfig,
  broadcastAudioProgress,
  generateSceneAudio,
  recordTTSUsage
} = require('../../services/audio-generation-helpers');

/**
 * POST /api/generation/projects/:id/scenes/:sceneId/generate-audio
 * Generate audio for a scene's dialogue
 */
router.post('/projects/:id/scenes/:sceneId/generate-audio', async (req, res, next) => {
  console.log('[Audio Generation] Request received:', {
    projectId: req.params.id,
    sceneId: req.params.sceneId,
    body: req.body
  });

  try {
    const prisma = req.app.get('prisma');
    const broadcastProgress = req.app.get('broadcastProgress');
    const { voiceProvider, voiceId, options = {} } = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        projectCharacters: { include: { character: true } }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const scene = await prisma.scene.findFirst({
      where: { id: req.params.sceneId, projectId: req.params.id }
    });

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    if (!scene.dialogue) {
      return res.status(400).json({ error: 'Scene has no dialogue to synthesize' });
    }

    const provider = voiceProvider || project.voiceProvider || 'elevenlabs';
    const voice = voiceId;

    if (!voice) {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    // Get voice configuration
    const { apiKey, endpoint } = await getVoiceConfig(provider, prisma, req.user.id);

    await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: { status: 'GENERATING' }
    });

    broadcastAudioProgress(broadcastProgress, req.params.id, 'audio_generation_started', {
      sceneId: req.params.sceneId,
      sequenceNumber: scene.sequenceNumber,
      message: 'Generating audio...'
    });

    // Generate speech
    console.log('[Audio Generation] Calling generateSpeech:', { provider, voice, endpoint, dialogueLength: scene.dialogue?.length });
    const result = await generateSpeech(provider, voice, scene.dialogue, {
      ...options,
      apiKey,
      endpoint,
      prisma,
      userId: req.user.id
    });
    console.log('[Audio Generation] Result:', { hasBase64: !!result.audioBase64, hasUrl: !!result.audioUrl, status: result.status });

    // If we got audio data, save it
    if (result.audioBase64 || result.audioUrl) {
      let audioUrl = result.audioUrl;

      // If we have base64 audio, save it to storage
      if (result.audioBase64) {
        const ext = result.audioFormat || 'mp3';
        const filename = `scene-${scene.id}-${Date.now()}.${ext}`;
        const contentType = ext === 'wav' ? 'audio/wav' : 'audio/mpeg';
        audioUrl = await storage.upload(
          result.audioBase64,
          filename,
          'audio',
          contentType
        );
      }

      await prisma.scene.update({
        where: { id: req.params.sceneId },
        data: { audioUrl, status: 'COMPLETE' }
      });

      broadcastAudioProgress(broadcastProgress, req.params.id, 'audio_generation_completed', {
        sceneId: req.params.sceneId,
        sequenceNumber: scene.sequenceNumber,
        audioUrl,
        message: 'Audio generated successfully!'
      });

      // Record usage
      await recordTTSUsage(
        prisma,
        req.user.id,
        provider,
        scene.dialogue,
        req.params.id,
        req.params.sceneId,
        voice,
        result.durationSeconds
      );

      res.json({
        success: true,
        audioUrl,
        provider,
        voiceId: voice
      });
    } else if (result.taskId) {
      // Async generation - return task ID for polling
      res.json({
        success: true,
        taskId: result.taskId,
        status: 'pending',
        provider,
        voiceId: voice
      });
    } else {
      throw new Error('No audio generated');
    }
  } catch (error) {
    console.error('Audio generation error:', error);

    // Update scene status to failed
    const prisma = req.app.get('prisma');
    const broadcastProgress = req.app.get('broadcastProgress');

    try {
      await prisma.scene.update({
        where: { id: req.params.sceneId },
        data: { status: 'FAILED' }
      });

      broadcastAudioProgress(broadcastProgress, req.params.id, 'audio_generation_failed', {
        sceneId: req.params.sceneId,
        error: error.message
      });
    } catch (e) {
      // Ignore secondary errors
    }

    next(error);
  }
});

/**
 * POST /api/generation/projects/:id/generate-all-audio
 * Generate audio for all scenes in a project using assigned character voices
 */
router.post('/projects/:id/generate-all-audio', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const broadcastProgress = req.app.get('broadcastProgress');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        projectCharacters: { include: { character: true } },
        scenes: { orderBy: { sequenceNumber: 'asc' } }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes to generate audio for' });
    }

    const defaultVoice = project.projectCharacters[0] || null;
    const defaultVoiceProvider = defaultVoice?.voiceProvider || project.voiceProvider || 'elevenlabs';
    const defaultVoiceId = defaultVoice?.voiceId || null;

    if (!defaultVoiceId) {
      return res.status(400).json({
        error: 'No voices assigned to characters. Please assign voices in the Voices step.'
      });
    }

    const results = [];

    broadcastAudioProgress(broadcastProgress, req.params.id, 'bulk_audio_generation_started', {
      totalScenes: project.scenes.length,
      message: `Generating audio for ${project.scenes.length} scenes...`
    });

    // Generate audio for each scene
    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];
      const result = await generateSceneAudio(
        scene,
        defaultVoiceProvider,
        defaultVoiceId,
        prisma,
        req.user.id,
        broadcastProgress,
        req.params.id
      );
      results.push(result);
    }

    // Fetch updated scenes
    const updatedScenes = await prisma.scene.findMany({
      where: { projectId: req.params.id },
      orderBy: { sequenceNumber: 'asc' }
    });

    const successCount = results.filter(r => r.success).length;

    broadcastAudioProgress(broadcastProgress, req.params.id, 'bulk_audio_generation_completed', {
      successCount,
      totalScenes: project.scenes.length,
      message: `Generated audio for ${successCount}/${project.scenes.length} scenes`
    });

    res.json({
      success: true,
      results,
      scenes: updatedScenes,
      message: `Generated audio for ${successCount}/${project.scenes.length} scenes`
    });
  } catch (error) {
    console.error('Generate all audio error:', error);
    next(error);
  }
});

module.exports = router;
