/**
 * Video Generation Routes
 *
 * API endpoints for AI-powered video generation from scene frames.
 */

const express = require('express');
const router = express.Router();
const storage = require('../../services/storage');
const { createUsageService } = require('../../services/usage');
const pricingService = require('../../services/pricing');

/**
 * POST /api/generation/projects/:id/scenes/:sceneId/generate-video
 * Generate video from scene's start and end frames using PiAPI + Claude SDK
 */
router.post('/projects/:id/scenes/:sceneId/generate-video', async (req, res, next) => {
  console.log('[Video Generation] Request received:', {
    projectId: req.params.id,
    sceneId: req.params.sceneId
  });

  try {
    const prisma = req.app.get('prisma');
    const broadcastProgress = req.app.get('broadcastProgress');

    // Get user preferences for video model and mode
    const userPrefs = await prisma.userPreferences.findUnique({
      where: { userId: req.user.id }
    });

    // PiAPI requires 'pro' mode for first/last frame (image_tail_url) feature
    // Use user preferences or request body or defaults
    const {
      duration = 5,
      mode = userPrefs?.defaultVideoMode || 'pro',
      version = userPrefs?.defaultVideoModel || '2.5'
    } = req.body;

    console.log('[Video Generation] Using settings:', { version, mode, duration });

    // Verify project ownership
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

    // Check if both images exist
    if (!scene.startImageUrl || !scene.endImageUrl) {
      return res.status(400).json({
        error: 'Scene must have both start and end images before generating video'
      });
    }

    // Get full public URLs for images (handles both local and Vercel Blob URLs)
    const startImageUrl = storage.getPublicUrl(scene.startImageUrl);
    const endImageUrl = storage.getPublicUrl(scene.endImageUrl);

    // Mark scene as generating
    await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: { status: 'GENERATING' }
    });

    // Broadcast status
    if (broadcastProgress) {
      broadcastProgress(req.params.id, {
        type: 'video_generation_started',
        sceneId: req.params.sceneId,
        sequenceNumber: scene.sequenceNumber,
        message: 'Generating video prompt with AI...'
      });
    }

    // Step 1: Generate video prompt using Claude SDK
    const claudeSDK = require('../../services/claude-sdk');
    await claudeSDK.getUserApiKey(prisma, req.user.id); // Set up auth

    const sceneContext = {
      sequenceNumber: scene.sequenceNumber,
      dialogue: scene.dialogue,
      emotions: scene.emotions,
      actions: scene.actions,
      cameraAngle: scene.cameraAngle,
      startImagePrompt: scene.startImagePrompt,
      endImagePrompt: scene.endImagePrompt
    };

    const projectContext = {
      genre: project.genre,
      setting: project.setting
    };

    console.log('[Video Generation] Generating video prompt with Claude SDK...');
    const videoPrompt = await claudeSDK.generateVideoPrompt(sceneContext, projectContext);
    console.log('[Video Generation] Generated prompt:', videoPrompt);

    // Broadcast progress
    if (broadcastProgress) {
      broadcastProgress(req.params.id, {
        type: 'video_generation_progress',
        sceneId: req.params.sceneId,
        message: 'Starting video generation with PiAPI...',
        videoPrompt
      });
    }

    // Step 2: Generate video using PiAPI
    const piapi = require('../../services/piapi');
    const videoResult = await piapi.generateVideoFromFrames(
      startImageUrl,
      endImageUrl,
      videoPrompt,
      { duration, mode, version, aspectRatio: '16:9' }
    );

    console.log('[Video Generation] PiAPI Response:', videoResult);

    if (videoResult.code !== 200 && videoResult.code !== 0) {
      throw new Error(videoResult.message || 'PiAPI video generation failed');
    }

    const taskId = videoResult.data?.task_id;
    if (!taskId) {
      throw new Error('No task ID returned from PiAPI');
    }

    // Broadcast task started
    if (broadcastProgress) {
      broadcastProgress(req.params.id, {
        type: 'video_generation_task_started',
        sceneId: req.params.sceneId,
        taskId,
        message: 'Video generation in progress...'
      });
    }

    // Record video generation usage with cost
    const usageService = createUsageService(prisma);
    const videoCost = pricingService.calculateVideoCost('piapi', mode, 1);
    await usageService.recordVideoUsage(req.user.id, {
      provider: 'piapi',
      operation: 'generate-scene-video',
      count: 1,
      cost: videoCost,
      metadata: { projectId: req.params.id, sceneId: req.params.sceneId, taskId, duration, mode }
    });

    res.json({
      success: true,
      message: 'Video generation started',
      taskId,
      videoPrompt,
      status: 'pending'
    });
  } catch (error) {
    console.error('[Video Generation] Error:', error);

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
          type: 'video_generation_failed',
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
 * GET /api/generation/projects/:id/scenes/:sceneId/video-status
 * Check video generation task status
 */
router.get('/projects/:id/scenes/:sceneId/video-status', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { taskId } = req.query;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

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

    // Check task status with PiAPI
    const piapi = require('../../services/piapi');
    const taskStatus = await piapi.getTaskStatus(taskId);

    console.log('[Video Status] PiAPI Response:', taskStatus);

    const status = {
      taskId,
      status: taskStatus.data?.status || 'unknown',
      progress: taskStatus.data?.progress || 0,
      videoUrl: null
    };

    // If completed, extract video URL and save to scene
    if (taskStatus.data?.status === 'completed' || taskStatus.data?.status === 'success') {
      const videoUrl = taskStatus.data?.output?.video_url ||
                       taskStatus.data?.video_url ||
                       taskStatus.data?.output?.url;

      if (videoUrl) {
        await prisma.scene.update({
          where: { id: req.params.sceneId },
          data: { videoUrl, status: 'COMPLETE' }
        });
        status.videoUrl = videoUrl;
        status.status = 'completed';
      }
    } else if (taskStatus.data?.status === 'failed') {
      await prisma.scene.update({
        where: { id: req.params.sceneId },
        data: { status: 'FAILED' }
      });
      status.error = taskStatus.data?.error || 'Video generation failed';
    }

    res.json(status);
  } catch (error) {
    console.error('[Video Status] Error:', error);
    next(error);
  }
});

module.exports = router;
