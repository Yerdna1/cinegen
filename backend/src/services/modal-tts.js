/**
 * Modal.com Hosted TTS Service
 *
 * Supports multiple TTS models hosted on Modal.com:
 * - F5-TTS: High-quality flow-matching TTS
 * - Chatterbox: Expressive conversational TTS
 */

class ModalTTSService {
  constructor() {
    this.apiKey = process.env.MODAL_API_KEY;
    this.f5ttsEndpoint = process.env.MODAL_F5TTS_ENDPOINT;
    this.chatterboxEndpoint = process.env.MODAL_CHATTERBOX_ENDPOINT;
  }

  /**
   * Get available voices for a specific model
   * @param {string} model - 'f5tts' or 'chatterbox'
   */
  async getVoices(model = 'f5tts') {
    const endpoint = model === 'chatterbox' ? this.chatterboxEndpoint : this.f5ttsEndpoint;

    if (!endpoint) {
      // Return default/built-in voices when endpoint not configured
      return this.getDefaultVoices(model);
    }

    try {
      const response = await fetch(`${endpoint}/voices`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch voices from Modal ${model}, using defaults`);
        return this.getDefaultVoices(model);
      }

      const data = await response.json();
      return data.voices.map(voice => ({
        ...voice,
        provider: `modal-${model}`
      }));
    } catch (error) {
      console.warn(`Error fetching Modal ${model} voices:`, error.message);
      return this.getDefaultVoices(model);
    }
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
   * @param {string} voiceId - Voice identifier
   * @param {string} text - Text to synthesize
   * @param {object} options - Generation options
   */
  async generateSpeechF5TTS(voiceId, text, options = {}) {
    if (!this.f5ttsEndpoint) {
      throw new Error('F5-TTS endpoint not configured');
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

    const response = await fetch(`${this.f5ttsEndpoint}/generate`, {
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
   * @param {string} voiceId - Voice identifier
   * @param {string} text - Text to synthesize
   * @param {object} options - Generation options
   */
  async generateSpeechChatterbox(voiceId, text, options = {}) {
    if (!this.chatterboxEndpoint) {
      throw new Error('Chatterbox endpoint not configured');
    }

    const {
      emotion = 'neutral', // neutral, happy, sad, angry, excited
      speed = 1.0
    } = options;

    const body = {
      voice_id: voiceId,
      text,
      emotion,
      speed
    };

    const response = await fetch(`${this.chatterboxEndpoint}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Chatterbox generation failed: ${response.status}`);
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

    throw new Error('Unexpected response format from Chatterbox');
  }

  /**
   * Generate speech using the specified model
   * @param {string} model - 'f5tts' or 'chatterbox'
   * @param {string} voiceId - Voice identifier
   * @param {string} text - Text to synthesize
   * @param {object} options - Generation options
   */
  async generateSpeech(model, voiceId, text, options = {}) {
    if (model === 'chatterbox') {
      return this.generateSpeechChatterbox(voiceId, text, options);
    }
    return this.generateSpeechF5TTS(voiceId, text, options);
  }

  /**
   * Check task status for async generation
   * @param {string} model - 'f5tts' or 'chatterbox'
   * @param {string} taskId - Task ID to check
   */
  async getTaskStatus(model, taskId) {
    const endpoint = model === 'chatterbox' ? this.chatterboxEndpoint : this.f5ttsEndpoint;

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
   */
  async testConnection(model = 'f5tts') {
    const endpoint = model === 'chatterbox' ? this.chatterboxEndpoint : this.f5ttsEndpoint;

    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Missing Modal API key',
          hasApiKey: false,
          hasEndpoint: !!endpoint
        };
      }

      if (!endpoint) {
        return {
          success: false,
          message: `${model} endpoint not configured`,
          hasApiKey: true,
          hasEndpoint: false
        };
      }

      // Try to fetch voices as a health check
      const response = await fetch(`${endpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: `Modal ${model} endpoint connected`,
          hasApiKey: true,
          hasEndpoint: true
        };
      }

      return {
        success: false,
        message: `${model} endpoint not responding`,
        hasApiKey: true,
        hasEndpoint: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        hasApiKey: !!this.apiKey,
        hasEndpoint: !!endpoint
      };
    }
  }
}

module.exports = new ModalTTSService();
