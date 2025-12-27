/**
 * Provider Routes
 *
 * API endpoints for getting available AI providers (LLM, Image, TTS).
 */

const express = require('express');
const router = express.Router();
const { getAvailableLLMProviders } = require('../../services/llm-factory');
const { getAvailableImageProviders } = require('../../services/image-factory');
const { getAvailableTTSProviders } = require('../../services/tts-factory');
const elevenlabsService = require('../../services/elevenlabs');

/**
 * GET /api/generation/providers
 * Get available LLM, image, and TTS providers
 */
router.get('/', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Get user's ElevenLabs API key for TTS availability check
    const elevenlabsApiKey = await elevenlabsService.getUserApiKey(prisma, req.user.id);

    const [llmProviders, imageProviders, ttsProviders] = await Promise.all([
      getAvailableLLMProviders(),
      getAvailableImageProviders(),
      getAvailableTTSProviders({ elevenlabsApiKey })
    ]);

    res.json({
      llm: llmProviders,
      image: imageProviders,
      tts: ttsProviders
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
