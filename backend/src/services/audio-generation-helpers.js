/**
 * Audio Generation Helper Functions
 */

const elevenlabsService = require('./elevenlabs');
const modalTTSService = require('./modal-tts');
const storage = require('./storage');
const { createUsageService } = require('./usage');
const pricingService = require('./pricing');
const { generateSpeech } = require('./tts-factory');

/**
 * Get voice configuration (API key or endpoint) for a provider
 */
async function getVoiceConfig(provider, prisma, userId) {
  let apiKey = null;
  let endpoint = null;

  if (provider === 'elevenlabs') {
    apiKey = await elevenlabsService.getUserApiKey(prisma, userId);
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }
  } else if (provider === 'modal-chatterbox') {
    endpoint = await modalTTSService.getUserEndpoint(prisma, userId, 'chatterbox');
    if (!endpoint) {
      throw new Error('Chatterbox endpoint not configured. Please add it in Settings.');
    }
  } else if (provider === 'modal-f5tts' || provider === 'modal-coqui') {
    endpoint = await modalTTSService.getUserEndpoint(prisma, userId, 'f5tts');
    if (!endpoint) {
      throw new Error('F5-TTS/Coqui endpoint not configured. Please add it in Settings.');
    }
  }

  return { apiKey, endpoint };
}

/**
 * Broadcast audio generation progress
 */
function broadcastAudioProgress(broadcastProgress, projectId, type, data) {
  if (broadcastProgress) {
    broadcastProgress(projectId, { type, ...data });
  }
}

/**
 * Generate audio for a single scene
 */
async function generateSceneAudio(scene, voiceProvider, voiceId, prisma, userId, broadcastProgress, projectId) {
  if (!scene.dialogue) {
    return { success: false, error: 'No dialogue' };
  }

  try {
    // Mark scene as generating
    await prisma.scene.update({
      where: { id: scene.id },
      data: { status: 'GENERATING' }
    });

    broadcastAudioProgress(broadcastProgress, projectId, 'audio_generation_progress', {
      sceneId: scene.id,
      sequenceNumber: scene.sequenceNumber,
      message: `Generating audio for scene ${scene.sequenceNumber}...`
    });

    // Get voice configuration
    const { apiKey, endpoint } = await getVoiceConfig(voiceProvider, prisma, userId);

    // Generate speech
    const result = await generateSpeech(voiceProvider, voiceId, scene.dialogue, {
      apiKey,
      endpoint,
      prisma,
      userId
    });

    let audioUrl = result.audioUrl;

    // Save base64 audio to storage if needed
    if (result.audioBase64) {
      const ext = result.audioFormat || 'mp3';
      const filename = `scene-${scene.id}-${Date.now()}.${ext}`;
      const contentType = ext === 'wav' ? 'audio/wav' : 'audio/mpeg';
      audioUrl = await storage.upload(result.audioBase64, filename, 'audio', contentType);
    }

    if (audioUrl) {
      await prisma.scene.update({
        where: { id: scene.id },
        data: { audioUrl, status: 'COMPLETE' }
      });

      broadcastAudioProgress(broadcastProgress, projectId, 'audio_generation_completed', {
        sceneId: scene.id,
        sequenceNumber: scene.sequenceNumber,
        audioUrl
      });

      return {
        success: true,
        sceneId: scene.id,
        sequenceNumber: scene.sequenceNumber,
        audioUrl
      };
    }

    throw new Error('No audio generated');
  } catch (error) {
    // Mark scene as failed
    await prisma.scene.update({
      where: { id: scene.id },
      data: { status: 'FAILED' }
    }).catch(() => {});

    broadcastAudioProgress(broadcastProgress, projectId, 'audio_generation_failed', {
      sceneId: scene.id,
      sequenceNumber: scene.sequenceNumber,
      error: error.message
    });

    return {
      success: false,
      sceneId: scene.id,
      sequenceNumber: scene.sequenceNumber,
      error: error.message
    };
  }
}

/**
 * Record TTS usage
 */
async function recordTTSUsage(prisma, userId, provider, dialogue, projectId, sceneId, voiceId, durationSeconds) {
  const usageService = createUsageService(prisma);
  const characterCount = dialogue?.length || 0;
  const ttsCost = pricingService.calculateTTSCost(provider, characterCount);

  await usageService.recordTTSUsage(userId, {
    provider,
    operation: 'generate-scene-audio',
    durationSeconds: durationSeconds || Math.ceil(dialogue.length / 15),
    cost: ttsCost,
    metadata: { projectId, sceneId, voiceId, characterCount }
  });
}

module.exports = {
  getVoiceConfig,
  broadcastAudioProgress,
  generateSceneAudio,
  recordTTSUsage
};
