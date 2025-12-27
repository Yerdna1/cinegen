/**
 * SceneCard Constants
 *
 * Provider display names and helper functions.
 */

export const PROVIDER_NAMES = {
  // LLM Providers
  'claude-sdk': 'Claude SDK',
  'anthropic': 'Anthropic API',
  'modal': 'Modal LLM',
  // Image Providers
  'kling': 'Kling',
  'piapi': 'PiAPI',
  'nanobanana': 'Google Gemini',
  'modal-image': 'Modal Flux',
  // Voice Providers
  'elevenlabs': 'ElevenLabs',
  'modal-f5tts': 'F5-TTS',
  'modal-chatterbox': 'Chatterbox',
  'modal-coqui': 'Coqui TTS',
};

export const getProviderName = (providerId) => {
  return PROVIDER_NAMES[providerId] || providerId || 'Unknown';
};
