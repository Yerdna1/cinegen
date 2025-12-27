/**
 * Voice Routes
 *
 * API endpoints for managing TTS voices and character voice assignments.
 */

const express = require('express');
const router = express.Router();
const { getAllVoices } = require('../../services/tts-factory');
const elevenlabsService = require('../../services/elevenlabs');

/**
 * GET /api/generation/voices
 * Get all available voices from all TTS providers
 */
router.get('/', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Get user's ElevenLabs API key
    const elevenlabsApiKey = await elevenlabsService.getUserApiKey(prisma, req.user.id);

    const voices = await getAllVoices({ elevenlabsApiKey });

    res.json({ voices });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/generation/voices/:provider
 * Get voices from a specific TTS provider
 */
router.get('/:provider', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { provider } = req.params;

    let voices = [];

    if (provider === 'elevenlabs') {
      const apiKey = await elevenlabsService.getUserApiKey(prisma, req.user.id);
      if (!apiKey) {
        return res.status(400).json({ error: 'ElevenLabs API key not configured' });
      }
      voices = await elevenlabsService.getVoices(apiKey);
    } else if (provider === 'modal-f5tts' || provider === 'modal-chatterbox') {
      const modalTTSService = require('../../services/modal-tts');
      const model = provider === 'modal-f5tts' ? 'f5tts' : 'chatterbox';
      voices = await modalTTSService.getVoices(model);
    } else {
      return res.status(400).json({ error: 'Unknown TTS provider' });
    }

    res.json({ voices, provider });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/generation/projects/:id/characters/:characterId/voice
 * Assign a voice to a character
 */
router.put('/projects/:id/characters/:characterId/voice', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { voiceId, voiceProvider, voiceName } = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Find the project character
    const projectCharacter = await prisma.projectCharacter.findFirst({
      where: {
        projectId: req.params.id,
        characterId: req.params.characterId
      }
    });

    if (!projectCharacter) {
      return res.status(404).json({ error: 'Character not found in project' });
    }

    // Update the voice assignment
    const updated = await prisma.projectCharacter.update({
      where: { id: projectCharacter.id },
      data: {
        voiceId,
        voiceProvider,
        voiceName
      },
      include: { character: true }
    });

    res.json({
      success: true,
      projectCharacter: updated
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
