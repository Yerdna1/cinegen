/**
 * ElevenLabs Text-to-Speech Service
 *
 * Uses ElevenLabs API for high-quality voice synthesis.
 * API Documentation: https://docs.elevenlabs.io/api-reference
 */

const crypto = require('crypto');

// Decryption helper for user API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const ALGORITHM = 'aes-256-gcm';

function decrypt(encryptedData) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

class ElevenLabsService {
  constructor() {
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  /**
   * Get available voices from ElevenLabs
   * @param {string} apiKey - Decrypted API key
   */
  async getVoices(apiKey) {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();

    return data.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      gender: voice.labels?.gender || 'unknown',
      age: voice.labels?.age || 'unknown',
      accent: voice.labels?.accent || 'unknown',
      previewUrl: voice.preview_url,
      provider: 'elevenlabs'
    }));
  }

  /**
   * Generate speech from text
   * @param {string} apiKey - Decrypted API key
   * @param {string} voiceId - ElevenLabs voice ID
   * @param {string} text - Text to synthesize
   * @param {object} options - Voice settings
   */
  async generateSpeech(apiKey, voiceId, text, options = {}) {
    const {
      modelId = 'eleven_multilingual_v2',
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0,
      useSpeakerBoost = true
    } = options;

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail?.message || `TTS failed: ${response.status}`);
    }

    // Return audio buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate speech and return as base64
   * @param {string} apiKey - Decrypted API key
   * @param {string} voiceId - ElevenLabs voice ID
   * @param {string} text - Text to synthesize
   * @param {object} options - Voice settings
   */
  async generateSpeechBase64(apiKey, voiceId, text, options = {}) {
    const audioBuffer = await this.generateSpeech(apiKey, voiceId, text, options);
    return audioBuffer.toString('base64');
  }

  /**
   * Get user's decrypted API key from database
   * @param {object} prisma - Prisma client
   * @param {string} userId - User ID
   */
  async getUserApiKey(prisma, userId) {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        userId,
        provider: '11labs'
      }
    });

    if (!apiKey) {
      return null;
    }

    return decrypt(apiKey.encryptedKey);
  }

  /**
   * Test API connection
   * @param {string} apiKey - API key to test
   */
  async testConnection(apiKey) {
    try {
      if (!apiKey) {
        return {
          success: false,
          message: 'No ElevenLabs API key provided',
          hasApiKey: false
        };
      }

      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (response.ok) {
        const user = await response.json();
        return {
          success: true,
          message: 'ElevenLabs API connected',
          hasApiKey: true,
          characterCount: user.subscription?.character_count,
          characterLimit: user.subscription?.character_limit
        };
      }

      return {
        success: false,
        message: 'Invalid API key',
        hasApiKey: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        hasApiKey: !!apiKey
      };
    }
  }
}

module.exports = new ElevenLabsService();
