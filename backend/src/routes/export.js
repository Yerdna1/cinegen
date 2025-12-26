const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// GET /api/export/projects/:id/clips/:clipId/download
router.get('/projects/:id/clips/:clipId/download', async (req, res, next) => {
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

    const scene = await prisma.scene.findFirst({
      where: {
        id: req.params.clipId,
        projectId: req.params.id
      }
    });

    if (!scene || !scene.videoUrl) {
      return res.status(404).json({ error: 'Clip not found or not generated' });
    }

    // TODO: Stream the actual video file
    // For now, return a placeholder response
    res.json({
      downloadUrl: scene.videoUrl,
      filename: `${project.name}-clip-${scene.sequenceNumber}.mp4`
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/export/projects/:id/download
router.get('/projects/:id/download', async (req, res, next) => {
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

    if (project.status !== 'COMPLETE') {
      return res.status(400).json({ error: 'Project is not complete' });
    }

    // TODO: Stitch all clips together and return combined video
    // For now, return placeholder
    res.json({
      message: 'Export started',
      projectId: project.id,
      filename: `${project.name}-full-video.mp4`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
