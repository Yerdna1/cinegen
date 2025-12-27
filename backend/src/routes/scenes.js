const express = require('express');

const router = express.Router();

// GET /api/projects/:id/scenes
router.get('/:id/scenes', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const scenes = await prisma.scene.findMany({
      where: { projectId: req.params.id },
      orderBy: { sequenceNumber: 'asc' }
    });

    res.json({ scenes });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/scenes
router.post('/:id/scenes', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { dialogue, cameraAngle, emotions, actions, insertAfter } = req.body;

    // Get current max sequence number
    const maxScene = await prisma.scene.findFirst({
      where: { projectId: req.params.id },
      orderBy: { sequenceNumber: 'desc' }
    });

    let sequenceNumber = (maxScene?.sequenceNumber || 0) + 1;

    // If inserting after a specific scene, shift others
    if (insertAfter !== undefined) {
      await prisma.scene.updateMany({
        where: {
          projectId: req.params.id,
          sequenceNumber: { gt: insertAfter }
        },
        data: {
          sequenceNumber: { increment: 1 }
        }
      });
      sequenceNumber = insertAfter + 1;
    }

    const scene = await prisma.scene.create({
      data: {
        projectId: req.params.id,
        sequenceNumber,
        dialogue: dialogue || '',
        cameraAngle: cameraAngle || 'medium',
        emotions: emotions || 'neutral',
        actions: actions || ''
      }
    });

    res.status(201).json({ scene });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id/scenes/reorder - MUST be before :sceneId route to avoid conflict
router.put('/:id/scenes/reorder', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { sceneOrder } = req.body; // Array of scene IDs in new order

    if (!Array.isArray(sceneOrder)) {
      return res.status(400).json({ error: 'sceneOrder must be an array of scene IDs' });
    }

    // Use a transaction to avoid unique constraint conflicts
    // First, set all sequence numbers to negative (temporary) values
    // Then, set them to the correct positive values
    await prisma.$transaction(async (tx) => {
      // Step 1: Set all sequences to negative values to avoid conflicts
      for (let i = 0; i < sceneOrder.length; i++) {
        await tx.scene.update({
          where: { id: sceneOrder[i] },
          data: { sequenceNumber: -(i + 1) }
        });
      }

      // Step 2: Set all sequences to correct positive values
      for (let i = 0; i < sceneOrder.length; i++) {
        await tx.scene.update({
          where: { id: sceneOrder[i] },
          data: { sequenceNumber: i + 1 }
        });
      }
    });

    const scenes = await prisma.scene.findMany({
      where: { projectId: req.params.id },
      orderBy: { sequenceNumber: 'asc' }
    });

    res.json({ scenes });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id/scenes/:sceneId
router.put('/:id/scenes/:sceneId', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { dialogue, cameraAngle, emotions, actions } = req.body;

    const scene = await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: {
        dialogue,
        cameraAngle,
        emotions,
        actions
      }
    });

    res.json({ scene });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id/scenes/:sceneId
router.delete('/:id/scenes/:sceneId', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const scene = await prisma.scene.findUnique({
      where: { id: req.params.sceneId }
    });

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Delete the scene
    await prisma.scene.delete({
      where: { id: req.params.sceneId }
    });

    // Reorder remaining scenes
    await prisma.scene.updateMany({
      where: {
        projectId: req.params.id,
        sequenceNumber: { gt: scene.sequenceNumber }
      },
      data: {
        sequenceNumber: { decrement: 1 }
      }
    });

    res.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/scenes/:sceneId/regenerate
router.post('/:id/scenes/:sceneId/regenerate', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify scene exists and belongs to project
    const scene = await prisma.scene.findFirst({
      where: {
        id: req.params.sceneId,
        projectId: req.params.id
      }
    });

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Mark scene as generating
    await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: { status: 'GENERATING' }
    });

    // TODO: In production, this would call the actual AI generation APIs
    // For now, simulate regeneration with placeholder URLs
    const timestamp = Date.now();
    const regeneratedContent = {
      startImageUrl: `/regenerated/start-${scene.sequenceNumber}-${timestamp}.png`,
      endImageUrl: `/regenerated/end-${scene.sequenceNumber}-${timestamp}.png`,
      videoUrl: `/regenerated/video-${scene.sequenceNumber}-${timestamp}.mp4`,
      audioUrl: `/regenerated/audio-${scene.sequenceNumber}-${timestamp}.mp3`
    };

    // Return regenerated content for preview (not yet saved to DB)
    res.json({
      message: 'Scene regeneration complete',
      scene: scene,
      regeneratedContent: regeneratedContent
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/scenes/:sceneId/accept-regeneration
router.post('/:id/scenes/:sceneId/accept-regeneration', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { startImageUrl, endImageUrl, videoUrl, audioUrl } = req.body;

    // Update scene with regenerated content
    const scene = await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: {
        startImageUrl,
        endImageUrl,
        videoUrl,
        audioUrl,
        status: 'COMPLETE'
      }
    });

    res.json({ message: 'Regeneration accepted', scene });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/scenes/:sceneId/reject-regeneration
router.post('/:id/scenes/:sceneId/reject-regeneration', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Reset scene status back to COMPLETE (keep original content)
    const scene = await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: { status: 'COMPLETE' }
    });

    res.json({ message: 'Regeneration rejected', scene });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
