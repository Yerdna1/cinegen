/**
 * TTS Provider Factory
 *
 * Factory pattern for selecting TTS providers for voice synthesis.
 * Supports: ElevenLabs, Modal F5-TTS, Modal Chatterbox
 */

const elevenlabsService = require('./elevenlabs');
const modalTTSService = require('./modal-tts');

/**
 * Provider configurations
 */
const PROVIDERS = {
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'High-quality AI voices with natural expression',
    service: elevenlabsService,
    requiresUserKey: true
  },
  'modal-f5tts': {
    id: 'modal-f5tts',
    name: 'F5-TTS (Modal)',
    description: 'Flow-matching TTS for natural speech synthesis',
    service: modalTTSService,
    model: 'f5tts',
    requiresUserKey: false
  },
  'modal-chatterbox': {
    id: 'modal-chatterbox',
    name: 'Chatterbox (Modal)',
    description: 'Expressive conversational TTS with emotion control',
    service: modalTTSService,
    model: 'chatterbox',
    requiresUserKey: false
  },
  'modal-coqui': {
    id: 'modal-coqui',
    name: 'Coqui TTS (Modal)',
    description: 'Self-hosted Coqui TTS on Modal.com',
    service: modalTTSService,
    model: 'f5tts', // Uses same model type as F5-TTS
    requiresUserKey: false
  }
};

/**
 * Get TTS provider configuration by name
 * @param {string} providerName - Provider name
 * @returns {object} Provider configuration
 */
function getTTSProvider(providerName) {
  return PROVIDERS[providerName?.toLowerCase()] || PROVIDERS.elevenlabs;
}

/**
 * Get voices from a specific provider
 * @param {string} providerName - Provider name
 * @param {object} options - Options (apiKey for elevenlabs)
 */
async function getVoices(providerName, options = {}) {
  const provider = getTTSProvider(providerName);

  if (providerName === 'elevenlabs') {
    if (!options.apiKey) {
      throw new Error('ElevenLabs requires API key');
    }
    return provider.service.getVoices(options.apiKey);
  }

  // Modal providers
  return provider.service.getVoices(provider.model);
}

/**
 * Generate speech using specified provider
 * @param {string} providerName - Provider name
 * @param {string} voiceId - Voice ID
 * @param {string} text - Text to synthesize
 * @param {object} options - Generation options (apiKey, endpoint, emotion, speed, etc.)
 */
async function generateSpeech(providerName, voiceId, text, options = {}) {
  const provider = getTTSProvider(providerName);

  if (providerName === 'elevenlabs') {
    if (!options.apiKey) {
      throw new Error('ElevenLabs requires API key');
    }
    const audioBuffer = await provider.service.generateSpeech(
      options.apiKey,
      voiceId,
      text,
      options
    );
    return {
      audioBase64: audioBuffer.toString('base64'),
      status: 'completed',
      provider: 'elevenlabs'
    };
  }

  // Modal providers - requires endpoint
  if (!options.endpoint) {
    throw new Error(`${providerName} endpoint not configured. Please add it in Settings.`);
  }

  const result = await provider.service.generateSpeech(
    provider.model,
    options.endpoint,
    voiceId,
    text,
    options
  );
  return {
    ...result,
    provider: providerName
  };
}

/**
 * Get all available TTS providers with their status
 * @param {object} options - Options for checking (e.g., user's API keys)
 * @returns {Promise<array>} Array of provider info
 */
async function getAvailableTTSProviders(options = {}) {
  const results = [];

  for (const [id, provider] of Object.entries(PROVIDERS)) {
    let status;

    if (id === 'elevenlabs') {
      if (options.elevenlabsApiKey) {
        status = await provider.service.testConnection(options.elevenlabsApiKey);
      } else {
        status = {
          success: false,
          message: 'API key not configured',
          hasApiKey: false
        };
      }
    } else {
      // Modal providers
      status = await provider.service.testConnection(provider.model);
    }

    results.push({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      requiresUserKey: provider.requiresUserKey,
      available: status.success,
      message: status.message
    });
  }

  return results;
}

/**
 * Get all voices from all available providers
 * @param {object} options - Options (API keys, etc.)
 */
async function getAllVoices(options = {}) {
  const allVoices = [];

  // ElevenLabs voices (if API key available)
  if (options.elevenlabsApiKey) {
    try {
      const voices = await elevenlabsService.getVoices(options.elevenlabsApiKey);
      allVoices.push(...voices);
    } catch (error) {
      console.warn('Failed to fetch ElevenLabs voices:', error.message);
    }
  }

  // Modal F5-TTS voices
  try {
    const f5Voices = await modalTTSService.getVoices('f5tts');
    allVoices.push(...f5Voices);
  } catch (error) {
    console.warn('Failed to fetch F5-TTS voices:', error.message);
  }

  // Modal Chatterbox voices
  try {
    const cbVoices = await modalTTSService.getVoices('chatterbox');
    allVoices.push(...cbVoices);
  } catch (error) {
    console.warn('Failed to fetch Chatterbox voices:', error.message);
  }

  return allVoices;
}

module.exports = {
  getTTSProvider,
  getVoices,
  generateSpeech,
  getAvailableTTSProviders,
  getAllVoices,
  PROVIDERS
};
