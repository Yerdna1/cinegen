/**
 * Kling AI Video Generation Service
 *
 * Uses Kling API for image-to-video generation.
 * API Documentation: https://docs.qingque.cn/d/home/eZQB44VvKuvGbqE_EoKE_a6x9
 */

const crypto = require('crypto');

// Decryption helper for user API keys stored in database
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

class KlingService {
  constructor() {
    this.defaultAccessKey = process.env.KLING_ACCESS_KEY;
    this.defaultSecretKey = process.env.KLING_SECRET_KEY;
    this.baseUrl = 'https://api.klingai.com';
    // These will be set per-request when using user keys
    this.accessKey = this.defaultAccessKey;
    this.secretKey = this.defaultSecretKey;
  }

  /**
   * Get user's Kling API keys from database or fall back to environment
   * @param {object} prisma - Prisma client
   * @param {string} userId - User ID
   */
  async getUserApiKeys(prisma, userId) {
    let accessKey = this.defaultAccessKey;
    let secretKey = this.defaultSecretKey;

    if (prisma && userId) {
      try {
        const [accessKeyRecord, secretKeyRecord] = await Promise.all([
          prisma.apiKey.findFirst({
            where: { userId, provider: 'kling' }
          }),
          prisma.apiKey.findFirst({
            where: { userId, provider: 'kling-secret' }
          })
        ]);

        if (accessKeyRecord) {
          accessKey = decrypt(accessKeyRecord.encryptedKey);
        }
        if (secretKeyRecord) {
          secretKey = decrypt(secretKeyRecord.encryptedKey);
        }
      } catch (error) {
        console.warn('Failed to get Kling keys from database:', error.message);
      }
    }

    return { accessKey, secretKey };
  }

  /**
   * Set keys for current request (used when making user-specific requests)
   */
  setKeys(accessKey, secretKey) {
    this.accessKey = accessKey || this.defaultAccessKey;
    this.secretKey = secretKey || this.defaultSecretKey;
  }

  /**
   * Reset to default environment keys
   */
  resetKeys() {
    this.accessKey = this.defaultAccessKey;
    this.secretKey = this.defaultSecretKey;
  }

  /**
   * Generate JWT token for Kling API authentication
   */
  generateToken() {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.accessKey,
      exp: now + 1800, // 30 minutes
      nbf: now - 5
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url');

    return `${base64Header}.${base64Payload}.${signature}`;
  }

  /**
   * Make authenticated request to Kling API
   */
  async request(endpoint, method = 'GET', body = null) {
    const token = this.generateToken();

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();

    console.log('Kling API Response:', JSON.stringify(data, null, 2));

    if (!response.ok || data.code !== 0) {
      throw new Error(data.message || data.msg || `Kling API error: ${response.status}`);
    }

    return data;
  }

  /**
   * Generate video from image (image-to-video)
   * @param {string} imageUrl - URL of the source image
   * @param {object} options - Generation options
   */
  async generateVideoFromImage(imageUrl, options = {}) {
    const {
      prompt = '',
      negativePrompt = '',
      duration = '5', // 5 or 10 seconds
      cfgScale = 0.5,
      mode = 'std', // std or pro
      aspectRatio = '16:9'
    } = options;

    const body = {
      model_name: 'kling-v2-5-turbo',
      image: imageUrl,
      prompt,
      negative_prompt: negativePrompt,
      cfg_scale: cfgScale,
      mode,
      aspect_ratio: aspectRatio,
      duration
    };

    const result = await this.request('/v1/videos/image2video', 'POST', body);
    return result;
  }

  /**
   * Generate video from text prompt (text-to-video)
   * @param {string} prompt - Text description of the video
   * @param {object} options - Generation options
   */
  async generateVideoFromText(prompt, options = {}) {
    const {
      negativePrompt = '',
      duration = '5',
      cfgScale = 0.5,
      mode = 'std',
      aspectRatio = '16:9'
    } = options;

    const body = {
      model_name: 'kling-v2-5-turbo',
      prompt,
      negative_prompt: negativePrompt,
      cfg_scale: cfgScale,
      mode,
      aspect_ratio: aspectRatio,
      duration
    };

    const result = await this.request('/v1/videos/text2video', 'POST', body);
    return result;
  }

  /**
   * Check video generation task status
   * @param {string} taskId - The task ID returned from generation request
   */
  async getTaskStatus(taskId) {
    const result = await this.request(`/v1/videos/image2video/${taskId}`, 'GET');
    return result;
  }

  /**
   * Generate image from text prompt (text-to-image)
   * @param {string} prompt - Text description of the image
   * @param {object} options - Generation options
   */
  async generateImage(prompt, options = {}) {
    const {
      negativePrompt = '',
      aspectRatio = '16:9',
      imageCount = 1,
      width = 1024,
      height = 576,
      referenceImages = [] // For character consistency
    } = options;

    const body = {
      model_name: 'kling-v1',
      prompt,
      negative_prompt: negativePrompt,
      n: imageCount,
      aspect_ratio: aspectRatio
    };

    // Add reference images for character consistency if provided
    if (referenceImages.length > 0) {
      body.image_fidelity = 0.5;
      body.reference_images = referenceImages;
    }

    const result = await this.request('/v1/images/generations', 'POST', body);
    return result;
  }

  /**
   * Check image generation task status
   * @param {string} taskId - The task ID returned from image generation
   */
  async getImageTaskStatus(taskId) {
    const result = await this.request(`/v1/images/generations/${taskId}`, 'GET');
    return result;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      // Simple test - generate token and verify it works
      const token = this.generateToken();
      return {
        success: true,
        message: 'Kling API credentials configured',
        hasAccessKey: !!this.accessKey,
        hasSecretKey: !!this.secretKey
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Check account balance/resource pack
   */
  async checkBalance() {
    const result = await this.request('/account/costs', 'GET');
    return result;
  }
}

module.exports = new KlingService();
