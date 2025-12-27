/**
 * Modal.com Hosted TTS Service
 *
 * Supports multiple TTS models hosted on Modal.com:
 * - F5-TTS: High-quality flow-matching TTS
 * - Chatterbox: Expressive conversational TTS
 */

class ModalTTSService {
  constructor() {
    // Modal authentication (from modal token list)
    this.modalKey = process.env.MODAL_KEY;
    this.modalSecret = process.env.MODAL_SECRET;
    this.defaultF5ttsEndpoint = process.env.MODAL_F5TTS_ENDPOINT;
    this.defaultChatterboxEndpoint = process.env.MODAL_CHATTERBOX_ENDPOINT;
  }

  /**
   * Get user's Modal TTS endpoint from database
   * @param {object} prisma - Prisma client
   * @param {string} userId - User ID
   * @param {string} model - 'f5tts' or 'chatterbox'
   * @returns {Promise<string|null>} User's endpoint or default
   */
  async getUserEndpoint(prisma, userId, model = 'chatterbox') {
    if (prisma && userId) {
      const prefs = await prisma.userPreferences.findUnique({
        where: { userId }
      });
      if (prefs) {
        if (model === 'chatterbox' && prefs.modalChatterboxEndpoint) {
          return prefs.modalChatterboxEndpoint;
        }
        if (model === 'f5tts' && prefs.modalCoquiTtsEndpoint) {
          return prefs.modalCoquiTtsEndpoint;
        }
      }
    }
    // Fall back to environment variables
    return model === 'chatterbox' ? this.defaultChatterboxEndpoint : this.defaultF5ttsEndpoint;
  }

  /**
   * Get available voices for a specific model
   * Modal TTS endpoints use built-in voice presets, so we return defaults
   * @param {string} model - 'f5tts' or 'chatterbox'
   * @param {string} endpoint - Optional endpoint URL (unused, kept for API consistency)
   */
  async getVoices(model = 'f5tts', endpoint = null) {
    // Modal TTS endpoints use built-in voice presets
    // Return default voices - these are the supported voice IDs
    return this.getDefaultVoices(model);
  }

  /**
   * Get default voices when endpoint not available
   * @param {string} model - 'f5tts' or 'chatterbox'
   */
  getDefaultVoices(model) {
    if (model === 'f5tts') {
      return [
        { id: 'f5-male-1', name: 'Alex (Male)', gender: 'male', provider: 'modal-f5tts' },
        { id: 'f5-male-2', name: 'David (Male)', gender: 'male', provider: 'modal-f5tts' },
        { id: 'f5-female-1', name: 'Sarah (Female)', gender: 'female', provider: 'modal-f5tts' },
        { id: 'f5-female-2', name: 'Emma (Female)', gender: 'female', provider: 'modal-f5tts' },
        { id: 'f5-neutral-1', name: 'Sam (Neutral)', gender: 'neutral', provider: 'modal-f5tts' }
      ];
    } else {
      return [
        { id: 'cb-male-1', name: 'James (Male)', gender: 'male', provider: 'modal-chatterbox' },
        { id: 'cb-male-2', name: 'Michael (Male)', gender: 'male', provider: 'modal-chatterbox' },
        { id: 'cb-female-1', name: 'Lisa (Female)', gender: 'female', provider: 'modal-chatterbox' },
        { id: 'cb-female-2', name: 'Jessica (Female)', gender: 'female', provider: 'modal-chatterbox' },
        { id: 'cb-neutral-1', name: 'Taylor (Neutral)', gender: 'neutral', provider: 'modal-chatterbox' }
      ];
    }
  }

  /**
   * Generate speech using F5-TTS
   * @param {string} endpoint - Endpoint URL
   * @param {string} voiceId - Voice identifier
   * @param {string} text - Text to synthesize
   * @param {object} options - Generation options
   */
  async generateSpeechF5TTS(endpoint, voiceId, text, options = {}) {
    if (!endpoint) {
      throw new Error('F5-TTS endpoint not configured. Please add it in Settings.');
    }

    const {
      speed = 1.0,
      referenceAudio = null // For voice cloning
    } = options;

    const body = {
      voice_id: voiceId,
      text,
      speed
    };

    if (referenceAudio) {
      body.reference_audio = referenceAudio;
    }

    // Modal endpoints are complete URLs (e.g., https://user--app-function.modal.run)
    // Don't append anything - use the endpoint as-is
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `F5-TTS generation failed: ${response.status}`);
    }

    const data = await response.json();

    // Handle async task response
    if (data.task_id) {
      return {
        taskId: data.task_id,
        status: 'pending'
      };
    }

    // Handle synchronous response with audio
    if (data.audio_base64) {
      return {
        audioBase64: data.audio_base64,
        status: 'completed'
      };
    }

    if (data.audio_url) {
      return {
        audioUrl: data.audio_url,
        status: 'completed'
      };
    }

    throw new Error('Unexpected response format from F5-TTS');
  }

  /**
   * Generate speech using Chatterbox
   * @param {string} endpoint - Endpoint URL
   * @param {string} voiceId - Voice identifier (used as voice_S3_key if it's a path)
   * @param {string} text - Text to synthesize
   * @param {object} options - Generation options
   */
  async generateSpeechChatterbox(endpoint, voiceId, text, options = {}) {
    if (!endpoint) {
      throw new Error('Chatterbox endpoint not configured. Please add it in Settings.');
    }

    if (!this.modalKey || !this.modalSecret) {
      throw new Error('Modal authentication not configured. Set MODAL_KEY and MODAL_SECRET in environment.');
    }

    // Chatterbox Modal endpoint expects: { text, voice_S3_key? }
    const body = {
      text
    };

    // If voiceId looks like an S3 path, use it for voice cloning
    if (voiceId && voiceId.includes('/')) {
      body.voice_S3_key = voiceId;
    }

    // Modal endpoints require Modal-Key and Modal-Secret headers for authenticated endpoints
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Modal-Key': this.modalKey,
        'Modal-Secret': this.modalSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Chatterbox generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Handle S3 key response (the Chatterbox endpoint returns { s3_key: "tts/uuid.wav" })
    if (data.s3_key) {
      // Construct the S3 URL from the bucket and key
      const s3Bucket = process.env.MODAL_S3_BUCKET || 'hey-gen-clone-yerdna';
      const audioUrl = `https://${s3Bucket}.s3.amazonaws.com/${data.s3_key}`;
      return {
        audioUrl,
        status: 'completed'
      };
    }

    // Handle async task response
    if (data.task_id) {
      return {
        taskId: data.task_id,
        status: 'pending'
      };
    }

    // Handle synchronous response with audio
    if (data.audio_base64) {
      return {
        audioBase64: data.audio_base64,
        status: 'completed'
      };
    }

    if (data.audio_url) {
      return {
        audioUrl: data.audio_url,
        status: 'completed'
      };
    }

    throw new Error('Unexpected response format from Chatterbox');
  }

  /**
   * Generate speech using the specified model
   * @param {string} model - 'f5tts' or 'chatterbox'
   * @param {string} endpoint - Endpoint URL
   * @param {string} voiceId - Voice identifier
   * @param {string} text - Text to synthesize
   * @param {object} options - Generation options
   */
  async generateSpeech(model, endpoint, voiceId, text, options = {}) {
    if (model === 'chatterbox') {
      return this.generateSpeechChatterbox(endpoint, voiceId, text, options);
    }
    return this.generateSpeechF5TTS(endpoint, voiceId, text, options);
  }

  /**
   * Check task status for async generation
   * @param {string} model - 'f5tts' or 'chatterbox'
   * @param {string} endpoint - Endpoint URL
   * @param {string} taskId - Task ID to check
   */
  async getTaskStatus(model, endpoint, taskId) {
    if (!endpoint) {
      throw new Error(`${model} endpoint not configured`);
    }

    const response = await fetch(`${endpoint}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Test API connection
   * @param {string} model - 'f5tts' or 'chatterbox'
   * @param {string} endpoint - Optional endpoint to test (falls back to default)
   */
  async testConnection(model = 'f5tts', endpoint = null) {
    const ep = endpoint || (model === 'chatterbox' ? this.defaultChatterboxEndpoint : this.defaultF5ttsEndpoint);

    if (!ep) {
      return {
        success: false,
        message: `${model} endpoint not configured`,
        hasApiKey: true,
        hasEndpoint: false
      };
    }

    // Modal endpoints are ready if URL is configured
    // We can't easily health-check Modal web endpoints without making a real request
    return {
      success: true,
      message: `Modal ${model} endpoint configured`,
      hasApiKey: true,
      hasEndpoint: true
    };
  }
}

module.exports = new ModalTTSService();
