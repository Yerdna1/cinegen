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

    // Generate a mock MP4 file for the individual clip download
    const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-clip-${scene.sequenceNumber}.mp4`;

    // Create a minimal valid MP4 file (ftyp + moov boxes)
    // This is a tiny valid MP4 structure for testing purposes
    const mp4Header = Buffer.from([
      // ftyp box (file type)
      0x00, 0x00, 0x00, 0x14, // box size (20 bytes)
      0x66, 0x74, 0x79, 0x70, // 'ftyp'
      0x69, 0x73, 0x6F, 0x6D, // 'isom' brand
      0x00, 0x00, 0x02, 0x00, // version
      0x69, 0x73, 0x6F, 0x6D, // compatible brand 'isom'
      // moov box (movie header) - minimal
      0x00, 0x00, 0x00, 0x08, // box size (8 bytes)
      0x6D, 0x6F, 0x6F, 0x76, // 'moov'
    ]);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', mp4Header.length);
    res.send(mp4Header);
  } catch (error) {
    next(error);
  }
});

// POST /api/export/projects/:id/start-export
router.post('/projects/:id/start-export', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        scenes: {
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'COMPLETE') {
      return res.status(400).json({ error: 'Project is not complete' });
    }

    // Create an export generation job
    const job = await prisma.generationJob.create({
      data: {
        projectId: project.id,
        jobType: 'COMBINE',
        status: 'RUNNING',
        progressPercent: 0,
        startedAt: new Date()
      }
    });

    res.json({
      message: 'Export started',
      jobId: job.id,
      projectId: project.id,
      totalScenes: project.scenes.length,
      filename: `${project.name}-full-video.mp4`
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/export/projects/:id/export-progress
router.get('/projects/:id/export-progress', async (req, res, next) => {
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

    // Get the latest export job
    const job = await prisma.generationJob.findFirst({
      where: {
        projectId: req.params.id,
        jobType: 'COMBINE'
      },
      orderBy: { startedAt: 'desc' }
    });

    if (!job) {
      return res.status(404).json({ error: 'No export job found' });
    }

    // Simulate progress (in production, this would be updated by actual stitching process)
    let newProgress = job.progressPercent + 25;
    let status = job.status;

    if (newProgress >= 100) {
      newProgress = 100;
      status = 'COMPLETE';

      // Update job as complete
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          progressPercent: 100,
          status: 'COMPLETE',
          completedAt: new Date()
        }
      });
    } else {
      // Update progress
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { progressPercent: newProgress }
      });
    }

    res.json({
      jobId: job.id,
      status: status,
      progressPercent: newProgress,
      message: status === 'COMPLETE' ? 'Export ready for download' : 'Processing...'
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
      },
      include: {
        scenes: {
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'COMPLETE') {
      return res.status(400).json({ error: 'Project is not complete' });
    }

    // Check if export is complete
    const job = await prisma.generationJob.findFirst({
      where: {
        projectId: req.params.id,
        jobType: 'COMBINE',
        status: 'COMPLETE'
      },
      orderBy: { completedAt: 'desc' }
    });

    // Generate a mock MP4 file for download
    const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-full-video.mp4`;

    // Create a minimal valid MP4 file (ftyp + moov boxes)
    // This is a tiny valid MP4 structure for testing purposes
    const mp4Header = Buffer.from([
      // ftyp box (file type)
      0x00, 0x00, 0x00, 0x14, // box size (20 bytes)
      0x66, 0x74, 0x79, 0x70, // 'ftyp'
      0x69, 0x73, 0x6F, 0x6D, // 'isom' brand
      0x00, 0x00, 0x02, 0x00, // version
      0x69, 0x73, 0x6F, 0x6D, // compatible brand 'isom'
      // moov box (movie header) - minimal
      0x00, 0x00, 0x00, 0x08, // box size (8 bytes)
      0x6D, 0x6F, 0x6F, 0x76, // 'moov'
    ]);

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', mp4Header.length);
    res.send(mp4Header);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
