const express = require('express');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              projects: true,
              characters: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        characters: {
          select: {
            id: true,
            name: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            projects: true,
            characters: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    const [
      totalUsers,
      totalProjects,
      projectsByStatus,
      totalCharacters,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.project.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.character.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          createdAt: true
        }
      })
    ]);

    const statusCounts = projectsByStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count;
      return acc;
    }, {});

    res.json({
      stats: {
        totalUsers,
        totalProjects,
        totalCharacters,
        projectsByStatus: statusCounts,
        completedVideos: statusCounts.complete || 0
      },
      recentUsers
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
