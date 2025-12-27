/**
 * Image Generation Routes
 *
 * API endpoints for AI-powered image generation, status checking, and prompt management.
 */

const express = require('express');
const router = express.Router();
const { getImageProvider } = require('../../services/image-factory');
const storage = require('../../services/storage');
const { createUsageService } = require('../../services/usage');
const pricingService = require('../../services/pricing');

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
    console.log('[Image Generation] Provider selection:', {
      overrideProvider,
      projectImageProvider: project.imageProvider,
      selectedProvider: providerName
    });
    const imageService = getImageProvider(providerName);

    // Get user preferences for model selection
    let userPrefs = await prisma.userPreferences.findUnique({
      where: { userId: req.user.id }
    });
    const selectedImageModel = userPrefs?.defaultImageModel || null;
    console.log('[Image Generation] Using model:', selectedImageModel);

    // Get endpoint/API key for the image provider
    let imageEndpoint = null;
    let imageApiKey = null;

    if (providerName === 'modal') {
      imageEndpoint = await imageService.getUserEndpoint(prisma, req.user.id);
      if (!imageEndpoint) {
        return res.status(400).json({
          error: 'Modal image endpoint not configured. Please add it in Settings.'
        });
      }
    } else if (providerName === 'nanobanana') {
      imageApiKey = await imageService.getUserApiKey(prisma, req.user.id);
      if (!imageApiKey) {
        return res.status(400).json({
          error: 'NanoBanana API key not configured. Please add it in Settings.'
        });
      }
    } else if (providerName === 'kling') {
      // Get user-specific Kling keys from database
      const { accessKey, secretKey } = await imageService.getUserApiKeys(prisma, req.user.id);
      if (!accessKey || !secretKey) {
        return res.status(400).json({
          error: 'Kling API keys not configured. Please add them in Settings.'
        });
      }
      // Set the keys for this request
      imageService.setKeys(accessKey, secretKey);
    }

    // Collect character reference images and descriptions for consistency
    const referenceImages = project.projectCharacters
      .map(pc => pc.character.imageUrl)
      .filter(Boolean);

    // Build character appearance descriptions for prompt enhancement
    const characterDescriptions = project.projectCharacters
      .map(pc => {
        const char = pc.character;
        return `- ${char.name}: ${char.description || 'Character in the scene'}`;
      })
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
        let startImageResult;
        if (providerName === 'modal') {
          // Modal requires endpoint as first param
          startImageResult = await imageService.generateImage(imageEndpoint, scene.startImagePrompt, {
            aspectRatio: '16:9',
            referenceImages,
            style: 'cinematic'
          });
        } else {
          // Other providers (kling, nanobanana) - pass API key and model in options
          startImageResult = await imageService.generateImage(scene.startImagePrompt, {
            aspectRatio: '16:9',
            referenceImages,
            characterDescriptions, // For character consistency
            style: 'cinematic',
            apiKey: imageApiKey,
            model: selectedImageModel, // For nanobanana (Gemini)
            modelName: selectedImageModel, // For kling
            imageSize: '4K' // Use 4K for best quality with Gemini 3 Pro Image
          });
        }
        tasks.startImage = startImageResult.data?.task_id;

        // If synchronous result with base64 image, save to storage
        if (startImageResult.data?.image_base64) {
          const ext = startImageResult.data.format || 'png';
          const filename = `scene-${req.params.sceneId}-start-${Date.now()}.${ext}`;
          const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
          const imageUrl = await storage.upload(
            startImageResult.data.image_base64,
            filename,
            'images',
            contentType
          );
          await prisma.scene.update({
            where: { id: req.params.sceneId },
            data: { startImageUrl: imageUrl }
          });
          tasks.startImageUrl = imageUrl;
        }
        // If synchronous result with URL
        else if (startImageResult.data?.image_url && !startImageResult.data.image_url.startsWith('data:')) {
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
        let endImageResult;
        if (providerName === 'modal') {
          // Modal requires endpoint as first param
          endImageResult = await imageService.generateImage(imageEndpoint, scene.endImagePrompt, {
            aspectRatio: '16:9',
            referenceImages,
            style: 'cinematic'
          });
        } else {
          // Other providers (kling, nanobanana) - pass API key and model in options
          endImageResult = await imageService.generateImage(scene.endImagePrompt, {
            aspectRatio: '16:9',
            referenceImages,
            characterDescriptions, // For character consistency
            style: 'cinematic',
            apiKey: imageApiKey,
            model: selectedImageModel, // For nanobanana (Gemini)
            modelName: selectedImageModel, // For kling
            imageSize: '4K' // Use 4K for best quality with Gemini 3 Pro Image
          });
        }
        tasks.endImage = endImageResult.data?.task_id;

        // If synchronous result with base64 image, save to storage
        if (endImageResult.data?.image_base64) {
          const ext = endImageResult.data.format || 'png';
          const filename = `scene-${req.params.sceneId}-end-${Date.now()}.${ext}`;
          const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
          const imageUrl = await storage.upload(
            endImageResult.data.image_base64,
            filename,
            'images',
            contentType
          );
          await prisma.scene.update({
            where: { id: req.params.sceneId },
            data: { endImageUrl: imageUrl }
          });
          tasks.endImageUrl = imageUrl;
        }
        // If synchronous result with URL
        else if (endImageResult.data?.image_url && !endImageResult.data.image_url.startsWith('data:')) {
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

    // Record image usage with cost
    const imagesGenerated = (tasks.startImageUrl ? 1 : 0) + (tasks.endImageUrl ? 1 : 0);
    if (imagesGenerated > 0) {
      const usageService = createUsageService(prisma);
      const imageCost = pricingService.calculateImageCost(providerName, imagesGenerated);
      await usageService.recordImageUsage(req.user.id, {
        provider: providerName,
        operation: 'generate-scene-images',
        count: imagesGenerated,
        cost: imageCost,
        metadata: { projectId: req.params.id, sceneId: req.params.sceneId }
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

module.exports = router;
