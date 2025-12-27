const express = require('express');

const router = express.Router();

// GET /api/projects
router.get('/', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { status, search } = req.query;

    const where = { userId: req.user.id };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (search) {
      // SQLite doesn't support mode: 'insensitive', so we use contains only
      where.name = { contains: search };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        projectCharacters: {
          include: { character: true }
        },
        _count: { select: { scenes: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects
router.post('/', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { name, durationSeconds, genre, setting, plot } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Validate durationSeconds if provided
    if (durationSeconds !== undefined && durationSeconds !== null) {
      const duration = parseInt(durationSeconds);
      if (isNaN(duration)) {
        return res.status(400).json({ error: 'Duration must be a valid number' });
      }
      if (duration < 6) {
        return res.status(400).json({ error: 'Duration must be at least 6 seconds' });
      }
      if (duration > 3600) {
        return res.status(400).json({ error: 'Duration cannot exceed 3600 seconds (1 hour)' });
      }
    }

    const project = await prisma.project.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        durationSeconds: durationSeconds ? parseInt(durationSeconds) : null,
        genre: genre || null,
        setting: setting || null,
        plot: plot || null
      }
    });

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        projectCharacters: {
          include: { character: true }
        },
        scenes: {
          orderBy: { sequenceNumber: 'asc' }
        },
        generationJobs: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { name, durationSeconds, genre, setting, plot, characterIds, voiceAssignments } = req.body;

    // Validate durationSeconds if provided
    if (durationSeconds !== undefined && durationSeconds !== null) {
      const duration = parseInt(durationSeconds);
      if (isNaN(duration)) {
        return res.status(400).json({ error: 'Duration must be a valid number' });
      }
      if (duration < 6) {
        return res.status(400).json({ error: 'Duration must be at least 6 seconds' });
      }
      if (duration > 3600) {
        return res.status(400).json({ error: 'Duration cannot exceed 3600 seconds (1 hour)' });
      }
    }

    // Check ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || existing.name,
        durationSeconds: durationSeconds !== undefined ? parseInt(durationSeconds) : existing.durationSeconds,
        genre: genre !== undefined ? genre : existing.genre,
        setting: setting !== undefined ? setting : existing.setting,
        plot: plot !== undefined ? plot : existing.plot
      }
    });

    // Update character assignments if provided
    if (characterIds && Array.isArray(characterIds)) {
      // Remove existing assignments
      await prisma.projectCharacter.deleteMany({
        where: { projectId: req.params.id }
      });

      // Add new assignments
      for (const charId of characterIds) {
        await prisma.projectCharacter.create({
          data: {
            projectId: req.params.id,
            characterId: charId,
            voiceId: voiceAssignments?.[charId] || null
          }
        });
      }
    }

    // Fetch updated project with relations
    const updatedProject = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        projectCharacters: {
          include: { character: true }
        }
      }
    });

    res.json({ project: updatedProject });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Check ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/generate-scenes
router.post('/:id/generate-scenes', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        projectCharacters: {
          include: { character: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate number of scenes (6 seconds per scene)
    const numScenes = Math.ceil((project.durationSeconds || 60) / 6);

    // TODO: Integrate with AI service to generate scenes
    // For now, create placeholder scenes
    const scenes = [];
    for (let i = 1; i <= numScenes; i++) {
      const scene = await prisma.scene.create({
        data: {
          projectId: project.id,
          sequenceNumber: i,
          dialogue: `Scene ${i} dialogue placeholder`,
          cameraAngle: 'medium',
          emotions: 'neutral',
          actions: 'standing'
        }
      });
      scenes.push(scene);
    }

    res.json({ scenes, message: `Generated ${numScenes} scenes` });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/start-generation
router.post('/:id/start-generation', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update project status
    await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'GENERATING' }
    });

    // Create generation job
    const job = await prisma.generationJob.create({
      data: {
        projectId: project.id,
        jobType: 'IMAGE',
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    // TODO: Start actual generation pipeline
    // This would be handled by a background worker

    res.json({ job, message: 'Generation started' });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/progress
router.get('/:id/progress', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        generationJobs: {
          orderBy: { startedAt: 'desc' },
          take: 1
        },
        scenes: {
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const latestJob = project.generationJobs[0];
    const completedScenes = project.scenes.filter(s => s.status === 'COMPLETE').length;
    const totalScenes = project.scenes.length;

    res.json({
      status: project.status,
      job: latestJob,
      progress: {
        completedScenes,
        totalScenes,
        percentage: totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
