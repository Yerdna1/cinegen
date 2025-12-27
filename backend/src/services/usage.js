/**
 * Usage Tracking Service
 * Records usage events for statistics and billing
 */

class UsageService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Record LLM token usage
   */
  async recordLLMUsage(userId, { provider, model, operation, inputTokens, outputTokens, cost, metadata }) {
    const totalTokens = (inputTokens || 0) + (outputTokens || 0);

    // Create usage record
    const record = await this.prisma.usageRecord.create({
      data: {
        userId,
        category: 'llm',
        provider,
        model,
        operation: operation || 'generate',
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Deduct cost from credit balance
    if (cost && cost > 0) {
      await this.deductCredits(userId, cost);
    }

    return record;
  }

  /**
   * Record image generation usage
   */
  async recordImageUsage(userId, { provider, operation, count, cost, metadata }) {
    const record = await this.prisma.usageRecord.create({
      data: {
        userId,
        category: 'image',
        provider,
        operation: operation || 'generate',
        imagesCount: count || 1,
        cost,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Deduct cost from credit balance
    if (cost && cost > 0) {
      await this.deductCredits(userId, cost);
    }

    return record;
  }

  /**
   * Record video generation usage
   */
  async recordVideoUsage(userId, { provider, operation, count, cost, metadata }) {
    const record = await this.prisma.usageRecord.create({
      data: {
        userId,
        category: 'video',
        provider,
        operation: operation || 'generate',
        videosCount: count || 1,
        cost,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Deduct cost from credit balance
    if (cost && cost > 0) {
      await this.deductCredits(userId, cost);
    }

    return record;
  }

  /**
   * Record audio/TTS generation usage
   */
  async recordAudioUsage(userId, { provider, operation, durationSeconds, cost, metadata }) {
    const record = await this.prisma.usageRecord.create({
      data: {
        userId,
        category: 'audio',
        provider,
        operation: operation || 'generate',
        audioSeconds: durationSeconds,
        cost,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Deduct cost from credit balance
    if (cost && cost > 0) {
      await this.deductCredits(userId, cost);
    }

    return record;
  }

  /**
   * Record TTS usage (alias for audio)
   */
  async recordTTSUsage(userId, { provider, operation, durationSeconds, cost, metadata }) {
    const record = await this.prisma.usageRecord.create({
      data: {
        userId,
        category: 'tts',
        provider,
        operation: operation || 'generate',
        audioSeconds: durationSeconds,
        cost,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Deduct cost from credit balance
    if (cost && cost > 0) {
      await this.deductCredits(userId, cost);
    }

    return record;
  }

  /**
   * Get user's current credit balance
   */
  async getCreditBalance(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true }
    });
    return user?.creditBalance || 0;
  }

  /**
   * Deduct credits from user's balance
   */
  async deductCredits(userId, amount) {
    if (amount <= 0) return;
    await this.prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: amount } }
    });
  }

  /**
   * Add credits to user's balance (admin operation)
   */
  async addCredits(userId, amount, reason, addedBy) {
    if (amount <= 0) throw new Error('Amount must be positive');

    await this.prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: amount } }
    });

    // Record the credit addition
    await this.prisma.usageRecord.create({
      data: {
        userId,
        category: 'credit',
        provider: 'system',
        operation: 'add',
        cost: -amount,
        metadata: JSON.stringify({ reason, addedBy })
      }
    });
  }
}

// Factory function to create service with prisma instance
function createUsageService(prisma) {
  return new UsageService(prisma);
}

module.exports = { UsageService, createUsageService };
