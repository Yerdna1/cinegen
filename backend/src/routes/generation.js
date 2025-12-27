/**
 * Generation Routes
 *
 * API endpoints for AI-powered scene content and image generation.
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const { getLLMProvider, getAvailableLLMProviders } = require('../services/llm-factory');
const { getImageProvider, getAvailableImageProviders } = require('../services/image-factory');
const { getAvailableTTSProviders, getAllVoices, generateSpeech } = require('../services/tts-factory');
const elevenlabsService = require('../services/elevenlabs');

/**
 * GET /api/generation/providers
 * Get available LLM, image, and TTS providers
 */
router.get('/providers', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Get user's ElevenLabs API key for TTS availability check
    const elevenlabsApiKey = await elevenlabsService.getUserApiKey(prisma, req.user.id);

    const [llmProviders, imageProviders, ttsProviders] = await Promise.all([
      getAvailableLLMProviders(),
      getAvailableImageProviders(),
      getAvailableTTSProviders({ elevenlabsApiKey })
    ]);

    res.json({
      llm: llmProviders,
      image: imageProviders,
      tts: ttsProviders
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generation/projects/:id/scenes/:sceneId/generate-content
 * Generate AI content (dialogue + image prompts) for a single scene
 */
router.post('/projects/:id/scenes/:sceneId/generate-content', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { llmProvider: overrideProvider } = req.body;

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

    const scene = project.scenes.find(s => s.id === req.params.sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Get LLM provider
    const providerName = overrideProvider || project.llmProvider || 'anthropic';
    const llmService = getLLMProvider(providerName);

    // Build context for LLM
    const projectContext = {
      genre: project.genre,
      setting: project.setting,
      plot: project.plot,
      characters: project.projectCharacters.map(pc => ({
        name: pc.character.name,
        description: pc.character.description,
        imageUrl: pc.character.imageUrl
      })),
      totalScenes: project.scenes.length,
      previousScenes: project.scenes
        .filter(s => s.sequenceNumber < scene.sequenceNumber)
        .map(s => ({
          dialogue: s.dialogue,
          actions: s.actions,
          startImagePrompt: s.startImagePrompt,
          endImagePrompt: s.endImagePrompt
        }))
    };

    const sceneContext = {
      sequenceNumber: scene.sequenceNumber,
      cameraAngle: scene.cameraAngle,
      emotions: scene.emotions,
      actions: scene.actions
    };

    // Get user's API key for the LLM provider
    const apiKey = await llmService.getUserApiKey(prisma, req.user.id);
    if (!apiKey) {
      return res.status(400).json({
        error: `Missing API key for ${providerName}. Please add your API key in Settings.`
      });
    }

    // Generate content
    const generatedContent = await llmService.generateSceneContent(apiKey, sceneContext, projectContext);

    // Update scene with generated content
    const updatedScene = await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: {
        dialogue: generatedContent.dialogue || scene.dialogue,
        startImagePrompt: generatedContent.startImagePrompt,
        endImagePrompt: generatedContent.endImagePrompt,
        emotions: generatedContent.emotions || scene.emotions,
        actions: generatedContent.actions || scene.actions
      }
    });

    res.json({
      success: true,
      scene: updatedScene,
      provider: providerName
    });
  } catch (error) {
    console.error('Scene content generation error:', error);
    next(error);
  }
});

/**
 * POST /api/generation/projects/:id/scenes/:sceneId/generate-images
 * Generate actual images from prompts for a scene
 */
router.post('/projects/:id/scenes/:sceneId/generate-images', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { imageProvider: overrideProvider, imageType } = req.body;
    // imageType: 'both' (default), 'start', 'end'

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { projectCharacters: { include: { character: true } } }
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

    const generateStart = imageType !== 'end';
    const generateEnd = imageType !== 'start';

    if (generateStart && !scene.startImagePrompt) {
      return res.status(400).json({
        error: 'Scene must have a start image prompt before generating start image'
      });
    }

    if (generateEnd && !scene.endImagePrompt) {
      return res.status(400).json({
        error: 'Scene must have an end image prompt before generating end image'
      });
    }

    // Get image provider
    const providerName = overrideProvider || project.imageProvider || 'kling';
    const imageService = getImageProvider(providerName);

    // Get endpoint/API key for the image provider
    let imageEndpoint = null;
    if (providerName === 'modal') {
      imageEndpoint = await imageService.getUserEndpoint(prisma, req.user.id);
      if (!imageEndpoint) {
        return res.status(400).json({
          error: 'Modal image endpoint not configured. Please add it in Settings.'
        });
      }
    }

    // Collect character reference images for consistency
    const referenceImages = project.projectCharacters
      .map(pc => pc.character.imageUrl)
      .filter(Boolean);

    // Mark scene as generating
    await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: { status: 'GENERATING' }
    });

    const tasks = {};

    // Generate start image
    if (generateStart && scene.startImagePrompt) {
      try {
        // Modal requires endpoint as first param, others don't
        const startImageResult = providerName === 'modal'
          ? await imageService.generateImage(imageEndpoint, scene.startImagePrompt, {
              aspectRatio: '16:9',
              referenceImages,
              style: 'cinematic'
            })
          : await imageService.generateImage(scene.startImagePrompt, {
              aspectRatio: '16:9',
              referenceImages,
              style: 'cinematic'
            });
        tasks.startImage = startImageResult.data?.task_id;

        // If synchronous result with URL
        if (startImageResult.data?.image_url) {
          await prisma.scene.update({
            where: { id: req.params.sceneId },
            data: { startImageUrl: startImageResult.data.image_url }
          });
          tasks.startImageUrl = startImageResult.data.image_url;
        }
      } catch (error) {
        console.error('Start image generation error:', error);
        tasks.startImageError = error.message;
      }
    }

    // Generate end image
    if (generateEnd && scene.endImagePrompt) {
      try {
        // Modal requires endpoint as first param, others don't
        const endImageResult = providerName === 'modal'
          ? await imageService.generateImage(imageEndpoint, scene.endImagePrompt, {
              aspectRatio: '16:9',
              referenceImages,
              style: 'cinematic'
            })
          : await imageService.generateImage(scene.endImagePrompt, {
              aspectRatio: '16:9',
              referenceImages,
              style: 'cinematic'
            });
        tasks.endImage = endImageResult.data?.task_id;

        // If synchronous result with URL
        if (endImageResult.data?.image_url) {
          await prisma.scene.update({
            where: { id: req.params.sceneId },
            data: { endImageUrl: endImageResult.data.image_url }
          });
          tasks.endImageUrl = endImageResult.data.image_url;
        }
      } catch (error) {
        console.error('End image generation error:', error);
        tasks.endImageError = error.message;
      }
    }

    // Update status based on results
    const hasErrors = tasks.startImageError || tasks.endImageError;
    const isComplete = tasks.startImageUrl && tasks.endImageUrl;

    if (isComplete) {
      await prisma.scene.update({
        where: { id: req.params.sceneId },
        data: { status: 'COMPLETE' }
      });
    } else if (hasErrors && !tasks.startImage && !tasks.endImage) {
      await prisma.scene.update({
        where: { id: req.params.sceneId },
        data: { status: 'FAILED' }
      });
    }

    res.json({
      success: true,
      message: 'Image generation started',
      provider: providerName,
      tasks
    });
  } catch (error) {
    console.error('Image generation error:', error);
    next(error);
  }
});

/**
 * GET /api/generation/projects/:id/scenes/:sceneId/image-status
 * Check image generation status
 */
router.get('/projects/:id/scenes/:sceneId/image-status', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { startTaskId, endTaskId } = req.query;

    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id }
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

    const providerName = project.imageProvider || 'kling';
    const imageService = getImageProvider(providerName);

    // Get endpoint for Modal if needed
    let imageEndpoint = null;
    if (providerName === 'modal') {
      imageEndpoint = await imageService.getUserEndpoint(prisma, req.user.id);
    }

    const status = {
      sceneId: scene.id,
      sceneStatus: scene.status,
      startImageUrl: scene.startImageUrl,
      endImageUrl: scene.endImageUrl
    };

    // Check task status if task IDs provided
    if (startTaskId) {
      try {
        const startStatus = providerName === 'modal'
          ? await imageService.getTaskStatus(imageEndpoint, startTaskId)
          : await imageService.getTaskStatus(startTaskId);
        status.startTask = startStatus.data;

        // Update scene if completed
        if (startStatus.data?.status === 'completed' && startStatus.data?.image_url) {
          await prisma.scene.update({
            where: { id: req.params.sceneId },
            data: { startImageUrl: startStatus.data.image_url }
          });
          status.startImageUrl = startStatus.data.image_url;
        }
      } catch (error) {
        status.startTaskError = error.message;
      }
    }

    if (endTaskId) {
      try {
        const endStatus = providerName === 'modal'
          ? await imageService.getTaskStatus(imageEndpoint, endTaskId)
          : await imageService.getTaskStatus(endTaskId);
        status.endTask = endStatus.data;

        // Update scene if completed
        if (endStatus.data?.status === 'completed' && endStatus.data?.image_url) {
          await prisma.scene.update({
            where: { id: req.params.sceneId },
            data: { endImageUrl: endStatus.data.image_url }
          });
          status.endImageUrl = endStatus.data.image_url;
        }
      } catch (error) {
        status.endTaskError = error.message;
      }
    }

    // Update scene status if both images complete
    if (status.startImageUrl && status.endImageUrl && scene.status === 'GENERATING') {
      await prisma.scene.update({
        where: { id: req.params.sceneId },
        data: { status: 'COMPLETE' }
      });
      status.sceneStatus = 'COMPLETE';
    }

    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/generation/projects/:id/scenes/:sceneId/prompts
 * Update image prompts for a scene (user edits)
 */
router.put('/projects/:id/scenes/:sceneId/prompts', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { startImagePrompt, endImagePrompt, dialogue } = req.body;

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existingScene = await prisma.scene.findFirst({
      where: { id: req.params.sceneId, projectId: req.params.id }
    });

    if (!existingScene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const updateData = {};
    if (startImagePrompt !== undefined) updateData.startImagePrompt = startImagePrompt;
    if (endImagePrompt !== undefined) updateData.endImagePrompt = endImagePrompt;
    if (dialogue !== undefined) updateData.dialogue = dialogue;

    const scene = await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: updateData
    });

    res.json({ success: true, scene });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generation/projects/:id/generate-all-content
 * Generate content for all scenes in a project
 */
router.post('/projects/:id/generate-all-content', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { llmProvider: overrideProvider } = req.body;

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
      return res.status(400).json({ error: 'No scenes to generate content for' });
    }

    // Get LLM provider
    const providerName = overrideProvider || project.llmProvider || 'anthropic';
    const llmService = getLLMProvider(providerName);

    const results = [];
    let generatedScenes = [];

    // Generate content for each scene sequentially (to maintain context)
    for (const scene of project.scenes) {
      const projectContext = {
        genre: project.genre,
        setting: project.setting,
        plot: project.plot,
        characters: project.projectCharacters.map(pc => ({
          name: pc.character.name,
          description: pc.character.description,
          imageUrl: pc.character.imageUrl
        })),
        totalScenes: project.scenes.length,
        previousScenes: generatedScenes
      };

      const sceneContext = {
        sequenceNumber: scene.sequenceNumber,
        cameraAngle: scene.cameraAngle,
        emotions: scene.emotions,
        actions: scene.actions
      };

      try {
        const generatedContent = await llmService.generateSceneContent(sceneContext, projectContext);

        const updatedScene = await prisma.scene.update({
          where: { id: scene.id },
          data: {
            dialogue: generatedContent.dialogue || scene.dialogue,
            startImagePrompt: generatedContent.startImagePrompt,
            endImagePrompt: generatedContent.endImagePrompt,
            emotions: generatedContent.emotions || scene.emotions,
            actions: generatedContent.actions || scene.actions
          }
        });

        generatedScenes.push({
          dialogue: updatedScene.dialogue,
          actions: updatedScene.actions,
          startImagePrompt: updatedScene.startImagePrompt,
          endImagePrompt: updatedScene.endImagePrompt
        });

        results.push({
          sceneId: scene.id,
          sequenceNumber: scene.sequenceNumber,
          success: true
        });
      } catch (error) {
        console.error(`Failed to generate content for scene ${scene.sequenceNumber}:`, error);
        results.push({
          sceneId: scene.id,
          sequenceNumber: scene.sequenceNumber,
          success: false,
          error: error.message
        });

        // Still add to context for next scene
        generatedScenes.push({
          dialogue: scene.dialogue,
          actions: scene.actions,
          startImagePrompt: scene.startImagePrompt,
          endImagePrompt: scene.endImagePrompt
        });
      }
    }

    // Fetch updated scenes
    const updatedScenes = await prisma.scene.findMany({
      where: { projectId: req.params.id },
      orderBy: { sequenceNumber: 'asc' }
    });

    res.json({
      success: true,
      provider: providerName,
      results,
      scenes: updatedScenes
    });
  } catch (error) {
    console.error('Generate all content error:', error);
    next(error);
  }
});

/**
 * GET /api/generation/voices
 * Get all available voices from all TTS providers
 */
router.get('/voices', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Get user's ElevenLabs API key
    const elevenlabsApiKey = await elevenlabsService.getUserApiKey(prisma, req.user.id);

    const voices = await getAllVoices({ elevenlabsApiKey });

    res.json({ voices });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/generation/voices/:provider
 * Get voices from a specific TTS provider
 */
router.get('/voices/:provider', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { provider } = req.params;

    let voices = [];

    if (provider === 'elevenlabs') {
      const apiKey = await elevenlabsService.getUserApiKey(prisma, req.user.id);
      if (!apiKey) {
        return res.status(400).json({ error: 'ElevenLabs API key not configured' });
      }
      voices = await elevenlabsService.getVoices(apiKey);
    } else if (provider === 'modal-f5tts' || provider === 'modal-chatterbox') {
      const modalTTSService = require('../services/modal-tts');
      const model = provider === 'modal-f5tts' ? 'f5tts' : 'chatterbox';
      voices = await modalTTSService.getVoices(model);
    } else {
      return res.status(400).json({ error: 'Unknown TTS provider' });
    }

    res.json({ voices, provider });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generation/projects/:id/scenes/:sceneId/generate-audio
 * Generate audio for a scene's dialogue
 */
router.post('/projects/:id/scenes/:sceneId/generate-audio', async (req, res, next) => {
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

    // Determine voice provider and voice ID
    const provider = voiceProvider || project.voiceProvider || 'elevenlabs';
    const voice = voiceId;

    if (!voice) {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    // Get API key for ElevenLabs or endpoint for Modal providers
    let apiKey = null;
    let endpoint = null;

    if (provider === 'elevenlabs') {
      apiKey = await elevenlabsService.getUserApiKey(prisma, req.user.id);
      if (!apiKey) {
        return res.status(400).json({ error: 'ElevenLabs API key not configured' });
      }
    } else if (provider === 'modal-chatterbox' || provider === 'modal-f5tts' || provider === 'modal-coqui') {
      // Get Modal TTS endpoint from user preferences
      const modalTTSService = require('../services/modal-tts');
      const model = provider === 'modal-chatterbox' ? 'chatterbox' : 'f5tts';
      endpoint = await modalTTSService.getUserEndpoint(prisma, req.user.id, model);
      if (!endpoint) {
        return res.status(400).json({
          error: `${provider} endpoint not configured. Please add it in Settings.`
        });
      }
    }

    // Mark scene as generating and notify via WebSocket
    await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: { status: 'GENERATING' }
    });

    // Broadcast status update
    if (broadcastProgress) {
      broadcastProgress(req.params.id, {
        type: 'audio_generation_started',
        sceneId: req.params.sceneId,
        sequenceNumber: scene.sequenceNumber,
        message: 'Generating audio...'
      });
    }

    // Generate speech
    const result = await generateSpeech(provider, voice, scene.dialogue, {
      ...options,
      apiKey,
      endpoint,
      prisma,
      userId: req.user.id
    });

    // If we got audio data, save it
    if (result.audioBase64 || result.audioUrl) {
      let audioUrl = result.audioUrl;

      // If we have base64 audio, save it to a file
      if (result.audioBase64) {
        const uploadsDir = path.join(__dirname, '../../uploads/audio');
        await fs.mkdir(uploadsDir, { recursive: true });

        const ext = result.audioFormat || 'mp3';
        const filename = `scene-${scene.id}-${Date.now()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        await fs.writeFile(filepath, Buffer.from(result.audioBase64, 'base64'));
        audioUrl = `/uploads/audio/${filename}`;
      }

      // Update scene with audio URL and mark complete
      await prisma.scene.update({
        where: { id: req.params.sceneId },
        data: { audioUrl, status: 'COMPLETE' }
      });

      // Broadcast completion
      if (broadcastProgress) {
        broadcastProgress(req.params.id, {
          type: 'audio_generation_completed',
          sceneId: req.params.sceneId,
          sequenceNumber: scene.sequenceNumber,
          audioUrl,
          message: 'Audio generated successfully!'
        });
      }

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

      if (broadcastProgress) {
        broadcastProgress(req.params.id, {
          type: 'audio_generation_failed',
          sceneId: req.params.sceneId,
          error: error.message
        });
      }
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

    // Check if characters have voices assigned
    const voiceMap = new Map();
    for (const pc of project.projectCharacters) {
      if (pc.voiceId && pc.voiceProvider) {
        voiceMap.set(pc.character.name.toLowerCase(), {
          voiceId: pc.voiceId,
          voiceProvider: pc.voiceProvider
        });
      }
    }

    // Get ElevenLabs API key if needed
    let elevenlabsApiKey = null;
    const needsElevenlabs = project.projectCharacters.some(pc => pc.voiceProvider === 'elevenlabs');
    if (needsElevenlabs) {
      elevenlabsApiKey = await elevenlabsService.getUserApiKey(prisma, req.user.id);
    }

    // Get Modal TTS endpoints if needed
    const modalTTSService = require('../services/modal-tts');
    let chatterboxEndpoint = null;
    let f5ttsEndpoint = null;
    const needsChatterbox = project.projectCharacters.some(pc => pc.voiceProvider === 'modal-chatterbox');
    const needsF5tts = project.projectCharacters.some(pc => pc.voiceProvider === 'modal-f5tts' || pc.voiceProvider === 'modal-coqui');
    if (needsChatterbox) {
      chatterboxEndpoint = await modalTTSService.getUserEndpoint(prisma, req.user.id, 'chatterbox');
    }
    if (needsF5tts) {
      f5ttsEndpoint = await modalTTSService.getUserEndpoint(prisma, req.user.id, 'f5tts');
    }

    // Default voice if no character match
    const defaultVoice = project.projectCharacters[0] || null;
    const defaultVoiceProvider = defaultVoice?.voiceProvider || project.voiceProvider || 'elevenlabs';
    const defaultVoiceId = defaultVoice?.voiceId || null;

    if (!defaultVoiceId) {
      return res.status(400).json({
        error: 'No voices assigned to characters. Please assign voices in the Voices step.'
      });
    }

    const results = [];
    const uploadsDir = path.join(__dirname, '../../uploads/audio');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Broadcast start of bulk generation
    if (broadcastProgress) {
      broadcastProgress(req.params.id, {
        type: 'bulk_audio_generation_started',
        totalScenes: project.scenes.length,
        message: `Generating audio for ${project.scenes.length} scenes...`
      });
    }

    // Generate audio for each scene
    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];

      if (!scene.dialogue) {
        results.push({
          sceneId: scene.id,
          sequenceNumber: scene.sequenceNumber,
          success: false,
          error: 'No dialogue'
        });
        continue;
      }

      try {
        // Broadcast progress for this scene
        if (broadcastProgress) {
          broadcastProgress(req.params.id, {
            type: 'audio_generation_progress',
            sceneId: scene.id,
            sequenceNumber: scene.sequenceNumber,
            current: i + 1,
            total: project.scenes.length,
            message: `Generating audio for scene ${scene.sequenceNumber}...`
          });
        }

        // Mark scene as generating
        await prisma.scene.update({
          where: { id: scene.id },
          data: { status: 'GENERATING' }
        });

        // Use default voice for now (could parse dialogue to detect speaker)
        const voiceProvider = defaultVoiceProvider;
        const voiceId = defaultVoiceId;

        let apiKey = null;
        let endpoint = null;

        if (voiceProvider === 'elevenlabs') {
          apiKey = elevenlabsApiKey;
          if (!apiKey) {
            throw new Error('ElevenLabs API key not configured');
          }
        } else if (voiceProvider === 'modal-chatterbox') {
          endpoint = chatterboxEndpoint;
          if (!endpoint) {
            throw new Error('Chatterbox endpoint not configured. Please add it in Settings.');
          }
        } else if (voiceProvider === 'modal-f5tts' || voiceProvider === 'modal-coqui') {
          endpoint = f5ttsEndpoint;
          if (!endpoint) {
            throw new Error('F5-TTS/Coqui endpoint not configured. Please add it in Settings.');
          }
        }

        const result = await generateSpeech(voiceProvider, voiceId, scene.dialogue, { apiKey, endpoint, prisma, userId: req.user.id });

        let audioUrl = result.audioUrl;

        if (result.audioBase64) {
          const ext = result.audioFormat || 'mp3';
          const filename = `scene-${scene.id}-${Date.now()}.${ext}`;
          const filepath = path.join(uploadsDir, filename);
          await fs.writeFile(filepath, Buffer.from(result.audioBase64, 'base64'));
          audioUrl = `/uploads/audio/${filename}`;
        }

        if (audioUrl) {
          await prisma.scene.update({
            where: { id: scene.id },
            data: { audioUrl, status: 'COMPLETE' }
          });
        }

        // Broadcast scene completion
        if (broadcastProgress) {
          broadcastProgress(req.params.id, {
            type: 'audio_generation_completed',
            sceneId: scene.id,
            sequenceNumber: scene.sequenceNumber,
            audioUrl,
            current: i + 1,
            total: project.scenes.length
          });
        }

        results.push({
          sceneId: scene.id,
          sequenceNumber: scene.sequenceNumber,
          success: true,
          audioUrl
        });
      } catch (error) {
        console.error(`Failed to generate audio for scene ${scene.sequenceNumber}:`, error);

        // Mark scene as failed
        await prisma.scene.update({
          where: { id: scene.id },
          data: { status: 'FAILED' }
        });

        // Broadcast failure
        if (broadcastProgress) {
          broadcastProgress(req.params.id, {
            type: 'audio_generation_failed',
            sceneId: scene.id,
            sequenceNumber: scene.sequenceNumber,
            error: error.message,
            current: i + 1,
            total: project.scenes.length
          });
        }

        results.push({
          sceneId: scene.id,
          sequenceNumber: scene.sequenceNumber,
          success: false,
          error: error.message
        });
      }
    }

    // Fetch updated scenes
    const updatedScenes = await prisma.scene.findMany({
      where: { projectId: req.params.id },
      orderBy: { sequenceNumber: 'asc' }
    });

    const successCount = results.filter(r => r.success).length;

    // Broadcast completion
    if (broadcastProgress) {
      broadcastProgress(req.params.id, {
        type: 'bulk_audio_generation_completed',
        successCount,
        totalScenes: project.scenes.length,
        message: `Generated audio for ${successCount}/${project.scenes.length} scenes`
      });
    }

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

/**
 * PUT /api/generation/projects/:id/characters/:characterId/voice
 * Assign a voice to a character
 */
router.put('/projects/:id/characters/:characterId/voice', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { voiceId, voiceProvider, voiceName } = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Find the project character
    const projectCharacter = await prisma.projectCharacter.findFirst({
      where: {
        projectId: req.params.id,
        characterId: req.params.characterId
      }
    });

    if (!projectCharacter) {
      return res.status(404).json({ error: 'Character not found in project' });
    }

    // Update the voice assignment
    const updated = await prisma.projectCharacter.update({
      where: { id: projectCharacter.id },
      data: {
        voiceId,
        voiceProvider,
        voiceName
      },
      include: { character: true }
    });

    res.json({
      success: true,
      projectCharacter: updated
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
