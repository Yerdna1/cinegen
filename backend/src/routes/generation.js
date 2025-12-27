/**
 * Generation Routes
 *
 * API endpoints for AI-powered scene content and image generation.
 */

const express = require('express');
const router = express.Router();
const { getLLMProvider, getAvailableLLMProviders } = require('../services/llm-factory');
const { getImageProvider, getAvailableImageProviders } = require('../services/image-factory');

/**
 * GET /api/generation/providers
 * Get available LLM and image providers
 */
router.get('/providers', async (req, res, next) => {
  try {
    const [llmProviders, imageProviders] = await Promise.all([
      getAvailableLLMProviders(),
      getAvailableImageProviders()
    ]);

    res.json({
      llm: llmProviders,
      image: imageProviders
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

    // Generate content
    const generatedContent = await llmService.generateSceneContent(sceneContext, projectContext);

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
        const startImageResult = await imageService.generateImage(scene.startImagePrompt, {
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
        const endImageResult = await imageService.generateImage(scene.endImagePrompt, {
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

    const status = {
      sceneId: scene.id,
      sceneStatus: scene.status,
      startImageUrl: scene.startImageUrl,
      endImageUrl: scene.endImageUrl
    };

    // Check task status if task IDs provided
    if (startTaskId) {
      try {
        const startStatus = await imageService.getTaskStatus(startTaskId);
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
        const endStatus = await imageService.getTaskStatus(endTaskId);
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

module.exports = router;
