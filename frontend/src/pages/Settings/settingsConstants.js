/**
 * Settings Constants
 *
 * Provider options, model options, and configuration constants.
 */

export const providers = [
  { id: 'claude-oauth', name: 'Claude Code OAuth', descriptionKey: 'settings.providers.claudeOauth', isOAuth: true },
  { id: 'hailuo', name: 'Hailuo/Kling', descriptionKey: 'settings.providers.hailuo' },
  { id: 'piapi', name: 'PiAPI', descriptionKey: 'settings.providers.piapi' },
  { id: 'nanobanana', name: 'Google Gemini', descriptionKey: 'settings.providers.gemini' },
  { id: '11labs', name: '11Labs', descriptionKey: 'settings.providers.elevenlabs' },
  { id: 'anthropic', name: 'Anthropic API', descriptionKey: 'settings.providers.anthropic' },
  { id: 'modal', name: 'Modal.com API Key', descriptionKey: 'settings.providers.modal' },
  { id: 'modal-key', name: 'Modal Key', descriptionKey: 'settings.providers.modalKey', isModalAuth: true },
  { id: 'modal-secret', name: 'Modal Secret', descriptionKey: 'settings.providers.modalSecret', isModalAuth: true }
];

export const llmProviderOptions = [
  { id: 'claude-sdk', name: 'Claude SDK', descriptionKey: 'settings.llmProviders.claudeSdk' },
  { id: 'anthropic', name: 'Anthropic API', descriptionKey: 'settings.llmProviders.anthropic' },
  { id: 'modal', name: 'Modal (Qwen)', descriptionKey: 'settings.llmProviders.modal' }
];

export const imageProviderOptions = [
  { id: 'kling', name: 'Kling AI', descriptionKey: 'settings.imageProviders.kling' },
  { id: 'nanobanana', name: 'Gemini', descriptionKey: 'settings.imageProviders.gemini' },
  { id: 'modal', name: 'Modal (Flux)', descriptionKey: 'settings.imageProviders.modal' }
];

export const videoProviderOptions = [
  { id: 'piapi', name: 'PiAPI', descriptionKey: 'settings.videoProviders.piapi' },
  { id: 'kling', name: 'Kling AI', descriptionKey: 'settings.videoProviders.kling' },
  { id: 'modal', name: 'Modal', descriptionKey: 'settings.videoProviders.modal' }
];

export const voiceProviderOptions = [
  { id: 'elevenlabs', name: 'ElevenLabs', descriptionKey: 'settings.voiceProviders.elevenlabs' },
  { id: 'modal-chatterbox', name: 'Chatterbox', descriptionKey: 'settings.voiceProviders.chatterbox' },
  { id: 'modal-coqui', name: 'Coqui TTS', descriptionKey: 'settings.voiceProviders.coqui' }
];

export const videoModelOptions = {
  kling: [
    { id: 'kling-v2-6', name: 'Kling 2.6', description: 'Latest model, best quality' },
    { id: 'kling-v2-5-turbo', name: 'Kling 2.5 Turbo', description: 'Fast, high quality' },
    { id: 'kling-v2-master', name: 'Kling 2.1 Master', description: 'Professional quality' },
    { id: 'kling-v1', name: 'Kling 1.0', description: 'Original model' }
  ],
  piapi: [
    { id: '2.6', name: 'Kling 2.6', description: 'Latest via PiAPI' },
    { id: '2.5', name: 'Kling 2.5', description: 'Recommended - fast & quality' },
    { id: '2.1', name: 'Kling 2.1', description: 'Professional mode' },
    { id: '1.6', name: 'Kling 1.6', description: 'Faster, good quality' },
    { id: '1.5', name: 'Kling 1.5', description: 'Original, fastest' }
  ],
  modal: [
    { id: 'default', name: 'Default', description: 'Self-hosted model' }
  ]
};

export const videoModeOptions = [
  { id: 'std', name: 'Standard', description: 'Faster, lower cost ($0.26)' },
  { id: 'pro', name: 'Professional', description: 'Higher quality ($0.46)' }
];

export const imageModelOptions = {
  kling: [
    { id: 'kling-v2', name: 'Kling 2.0', description: 'Latest image model' },
    { id: 'kling-v1-5', name: 'Kling 1.5', description: 'Stable, fast' },
    { id: 'kling-v1', name: 'Kling 1.0', description: 'Original' }
  ],
  nanobanana: [
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Pro', description: 'Latest Gemini model' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Fast generation' },
    { id: 'imagen-3.0-generate-002', name: 'Imagen 3.0', description: 'High quality photos' }
  ],
  modal: [
    { id: 'flux-schnell', name: 'Flux Schnell', description: 'Fast generation' },
    { id: 'flux-dev', name: 'Flux Dev', description: 'Higher quality' }
  ]
};

export const modalEndpointFields = [
  { key: 'modalChatterboxEndpoint', label: 'Chatterbox TTS' },
  { key: 'modalCoquiTtsEndpoint', label: 'Coqui TTS' },
  { key: 'modalHallo3Endpoint', label: 'Hallo3 (Lip Sync)' },
  { key: 'modalMusicEndpoint', label: 'Music Generator' },
  { key: 'modalImageEndpoint', label: 'Image Gen (Flux)' },
  { key: 'modalFileS3Endpoint', label: 'File to S3' }
];

export const defaultPreferences = {
  defaultLlmProvider: 'anthropic',
  defaultImageProvider: 'kling',
  defaultVideoProvider: 'piapi',
  defaultVoiceProvider: 'elevenlabs',
  defaultVideoModel: '2.5',
  defaultVideoMode: 'std',
  defaultImageModel: 'kling-v2',
  modalChatterboxEndpoint: '',
  modalCoquiTtsEndpoint: '',
  modalHallo3Endpoint: '',
  modalMusicEndpoint: '',
  modalImageEndpoint: '',
  modalFileS3Endpoint: ''
};
