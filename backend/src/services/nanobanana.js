/**
 * NanoBanana Pro Image Generation Service
 *
 * Uses NanoBanana API for AI image generation.
 * This service provides text-to-image capabilities with style control.
 */

class NanoBananaService {
  constructor() {
    this.apiKey = process.env.NANOBANANA_API_KEY;
    this.baseUrl = process.env.NANOBANANA_API_URL || 'https://api.nanobanana.com';
  }

  /**
   * Make authenticated request to NanoBanana API
   */
  async request(endpoint, method = 'POST', body = null) {
    if (!this.apiKey) {
      throw new Error('NanoBanana API key not configured');
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || `NanoBanana API error: ${response.status}`);
    }

    return data;
  }

  /**
   * Generate image from text prompt
   * @param {string} prompt - Text description of the image
   * @param {object} options - Generation options
   */
  async generateImage(prompt, options = {}) {
    const {
      aspectRatio = '16:9',
      style = 'cinematic',
      negativePrompt = '',
      referenceImages = [],
      width = 1024,
      height = 576
    } = options;

    const body = {
      prompt,
      negative_prompt: negativePrompt,
      aspect_ratio: aspectRatio,
      style,
      width,
      height
    };

    // Add reference images for character consistency if provided
    if (referenceImages.length > 0) {
      body.reference_images = referenceImages;
      body.reference_strength = 0.5;
    }

    const result = await this.request('/v1/images/generate', 'POST', body);

    // Return in standardized format
    return {
      success: true,
      data: {
        task_id: result.task_id || result.id,
        status: result.status || 'pending'
      }
    };
  }

  /**
   * Check image generation task status
   * @param {string} taskId - The task ID returned from generation request
   */
  async getTaskStatus(taskId) {
    const result = await this.request(`/v1/tasks/${taskId}`, 'GET');

    // Return in standardized format
    return {
      success: true,
      data: {
        task_id: taskId,
        status: result.status,
        images: result.images || result.output || [],
        error: result.error
      }
    };
  }

  /**
   * Get image URL from completed task
   * @param {string} taskId - The task ID to check
   */
  async getImageUrl(taskId) {
    const status = await this.getTaskStatus(taskId);

    if (status.data.status === 'completed' && status.data.images.length > 0) {
      return status.data.images[0].url || status.data.images[0];
    }

    return null;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Missing NanoBanana API key',
          hasApiKey: false
        };
      }

      // Try to get account info or make a simple request
      // Adjust endpoint based on actual NanoBanana API
      return {
        success: true,
        message: 'NanoBanana API key configured',
        hasApiKey: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        hasApiKey: !!this.apiKey
      };
    }
  }
}

module.exports = new NanoBananaService();
