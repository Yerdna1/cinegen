/**
 * Kling AI Video Generation Service
 *
 * Uses Kling API for image-to-video generation.
 * API Documentation: https://docs.qingque.cn/d/home/eZQB44VvKuvGbqE_EoKE_a6x9
 */

const crypto = require('crypto');

class KlingService {
  constructor() {
    this.accessKey = process.env.KLING_ACCESS_KEY;
    this.secretKey = process.env.KLING_SECRET_KEY;
    this.baseUrl = 'https://api.klingai.com';
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
