const express = require('express');
const router = express.Router();

/**
 * GET /api/gallery
 * Get all public gallery items (no auth required)
 */
router.get('/', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { page = 1, limit = 20, type, sort = 'newest' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      isPublic: true,
      ...(type && { mediaType: type.toUpperCase() })
    };

    const orderBy = sort === 'popular'
      ? [{ likes: 'desc' }, { createdAt: 'desc' }]
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.galleryItem.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          mediaType: true,
          mediaUrl: true,
          thumbnailUrl: true,
          prompt: true,
          provider: true,
          views: true,
          likes: true,
          createdAt: true
        }
      }),
      prisma.galleryItem.count({ where })
    ]);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
});

/**
 * GET /api/gallery/stats
 * Get gallery statistics
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    const [totalItems, totalImages, totalVideos, totalViews, totalLikes] = await Promise.all([
      prisma.galleryItem.count({ where: { isPublic: true } }),
      prisma.galleryItem.count({ where: { isPublic: true, mediaType: 'IMAGE' } }),
      prisma.galleryItem.count({ where: { isPublic: true, mediaType: 'VIDEO' } }),
      prisma.galleryItem.aggregate({
        where: { isPublic: true },
        _sum: { views: true }
      }),
      prisma.galleryItem.aggregate({
        where: { isPublic: true },
        _sum: { likes: true }
      })
    ]);

    res.json({
      totalItems,
      totalImages,
      totalVideos,
      totalViews: totalViews._sum.views || 0,
      totalLikes: totalLikes._sum.likes || 0
    });
  } catch (error) {
    console.error('Gallery stats error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery stats' });
  }
});

/**
 * GET /api/gallery/:id
 * Get a single gallery item and increment view count
 */
router.get('/:id', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { id } = req.params;

    const item = await prisma.galleryItem.update({
      where: { id, isPublic: true },
      data: { views: { increment: 1 } }
    });

    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    res.json(item);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gallery item not found' });
    }
    console.error('Gallery item fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery item' });
  }
});

/**
 * POST /api/gallery
 * Add a new gallery item (can be called internally after generation)
 */
router.post('/', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const {
      userId,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      prompt,
      provider = 'kling',
      taskId,
      metadata,
      isPublic = true
    } = req.body;

    if (!mediaType || !mediaUrl || !prompt) {
      return res.status(400).json({
        error: 'mediaType, mediaUrl, and prompt are required'
      });
    }

    const item = await prisma.galleryItem.create({
      data: {
        userId,
        mediaType: mediaType.toUpperCase(),
        mediaUrl,
        thumbnailUrl,
        prompt,
        provider,
        taskId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isPublic
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Gallery create error:', error);
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

/**
 * PUT /api/gallery/:id/like
 * Like a gallery item
 */
router.put('/:id/like', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { id } = req.params;

    const item = await prisma.galleryItem.update({
      where: { id, isPublic: true },
      data: { likes: { increment: 1 } }
    });

    res.json({ likes: item.likes });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gallery item not found' });
    }
    console.error('Gallery like error:', error);
    res.status(500).json({ error: 'Failed to like gallery item' });
  }
});

/**
 * DELETE /api/gallery/:id
 * Delete a gallery item (requires auth, owner only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    const userId = req.user?.id;

    // Find the item first
    const item = await prisma.galleryItem.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    // Check ownership (if userId is set, only owner can delete)
    if (item.userId && item.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    await prisma.galleryItem.delete({ where: { id } });

    res.json({ message: 'Gallery item deleted' });
  } catch (error) {
    console.error('Gallery delete error:', error);
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

module.exports = router;
