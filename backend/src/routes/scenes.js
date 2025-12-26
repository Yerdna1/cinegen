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

// PUT /api/projects/:id/scenes/reorder
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

    // Update each scene's sequence number
    for (let i = 0; i < sceneOrder.length; i++) {
      await prisma.scene.update({
        where: { id: sceneOrder[i] },
        data: { sequenceNumber: i + 1 }
      });
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

    // Mark scene as generating
    await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: { status: 'GENERATING' }
    });

    // TODO: Trigger regeneration pipeline

    res.json({ message: 'Scene regeneration started' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
