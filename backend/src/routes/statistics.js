const express = require('express');
const router = express.Router();

/**
 * GET /api/statistics
 * Get usage statistics for the current user
 */
router.get('/', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const userId = req.user.id;

    // Get user with credit balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true }
    });

    // Get total counts
    const [
      totalTokens,
      totalImages,
      totalVideos,
      totalAudioSeconds,
      categorySummary,
      modelSummary,
      recentUsage
    ] = await Promise.all([
      // Total tokens used
      prisma.usageRecord.aggregate({
        where: { userId },
        _sum: { totalTokens: true }
      }),
      // Total images generated
      prisma.usageRecord.aggregate({
        where: { userId, category: 'image' },
        _sum: { imagesCount: true }
      }),
      // Total videos generated
      prisma.usageRecord.aggregate({
        where: { userId, category: 'video' },
        _sum: { videosCount: true }
      }),
      // Total audio seconds
      prisma.usageRecord.aggregate({
        where: { userId, category: { in: ['audio', 'tts'] } },
        _sum: { audioSeconds: true }
      }),
      // Usage by category
      prisma.usageRecord.groupBy({
        by: ['category'],
        where: { userId },
        _sum: {
          totalTokens: true,
          imagesCount: true,
          videosCount: true,
          audioSeconds: true,
          cost: true
        },
        _count: { id: true }
      }),
      // Usage by model (for LLM)
      prisma.usageRecord.groupBy({
        by: ['category', 'provider', 'model'],
        where: { userId },
        _sum: {
          totalTokens: true,
          inputTokens: true,
          outputTokens: true,
          imagesCount: true,
          videosCount: true,
          audioSeconds: true,
          cost: true
        },
        _count: { id: true }
      }),
      // Recent usage (last 30 days, grouped by day)
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          category,
          SUM(total_tokens) as tokens,
          SUM(images_count) as images,
          SUM(videos_count) as videos,
          SUM(audio_seconds) as audio_seconds,
          SUM(cost) as cost,
          COUNT(*) as count
        FROM usage_records
        WHERE user_id = ${userId}
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), category
        ORDER BY date DESC
      `
    ]);

    // Transform category summary
    const categoryStats = categorySummary.reduce((acc, item) => {
      acc[item.category] = {
        count: item._count.id,
        tokens: item._sum.totalTokens || 0,
        images: item._sum.imagesCount || 0,
        videos: item._sum.videosCount || 0,
        audioSeconds: item._sum.audioSeconds || 0,
        cost: item._sum.cost || 0
      };
      return acc;
    }, {});

    // Transform model summary
    const modelStats = modelSummary.map(item => ({
      category: item.category,
      provider: item.provider,
      model: item.model || 'default',
      count: item._count.id,
      inputTokens: item._sum.inputTokens || 0,
      outputTokens: item._sum.outputTokens || 0,
      totalTokens: item._sum.totalTokens || 0,
      images: item._sum.imagesCount || 0,
      videos: item._sum.videosCount || 0,
      audioSeconds: item._sum.audioSeconds || 0,
      cost: item._sum.cost || 0
    }));

    // Transform daily usage for charts
    const dailyUsage = recentUsage.map(row => ({
      date: row.date,
      category: row.category,
      tokens: Number(row.tokens) || 0,
      images: Number(row.images) || 0,
      videos: Number(row.videos) || 0,
      audioSeconds: Number(row.audio_seconds) || 0,
      cost: Number(row.cost) || 0,
      count: Number(row.count)
    }));

    res.json({
      creditBalance: user?.creditBalance || 0,
      summary: {
        totalTokens: totalTokens._sum.totalTokens || 0,
        totalImages: totalImages._sum.imagesCount || 0,
        totalVideos: totalVideos._sum.videosCount || 0,
        totalAudioSeconds: totalAudioSeconds._sum.audioSeconds || 0
      },
      byCategory: categoryStats,
      byModel: modelStats,
      dailyUsage
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/statistics/credit-balance
 * Get just the credit balance (for header display)
 */
router.get('/credit-balance', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true }
    });

    res.json({ creditBalance: user?.creditBalance || 0 });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(500).json({ error: 'Failed to fetch credit balance' });
  }
});

/**
 * POST /api/statistics/record
 * Record a usage event (internal use)
 */
router.post('/record', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const userId = req.user.id;
    const {
      category,
      provider,
      model,
      operation,
      inputTokens,
      outputTokens,
      totalTokens,
      imagesCount,
      videosCount,
      audioSeconds,
      cost,
      metadata
    } = req.body;

    if (!category || !provider || !operation) {
      return res.status(400).json({
        error: 'category, provider, and operation are required'
      });
    }

    const record = await prisma.usageRecord.create({
      data: {
        userId,
        category,
        provider,
        model,
        operation,
        inputTokens,
        outputTokens,
        totalTokens,
        imagesCount,
        videosCount,
        audioSeconds,
        cost,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Optionally deduct from credit balance
    if (cost && cost > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: { decrement: cost }
        }
      });
    }

    res.json({ success: true, record });
  } catch (error) {
    console.error('Error recording usage:', error);
    res.status(500).json({ error: 'Failed to record usage' });
  }
});

/**
 * POST /api/statistics/add-credits
 * Add credits to user balance (admin only)
 */
router.post('/add-credits', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { userId, amount, reason } = req.body;

    // Check if current user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        error: 'userId and positive amount are required'
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        creditBalance: { increment: amount }
      },
      select: { id: true, email: true, creditBalance: true }
    });

    // Record this as a usage event (credit addition)
    await prisma.usageRecord.create({
      data: {
        userId,
        category: 'credit',
        provider: 'system',
        operation: 'add',
        cost: -amount, // Negative cost = credit added
        metadata: JSON.stringify({ reason, addedBy: req.user.id })
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

module.exports = router;
