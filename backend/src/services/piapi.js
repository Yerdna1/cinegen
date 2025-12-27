/**
 * PiAPI Service for Kling Video Generation
 *
 * Uses PiAPI to access Kling AI with your membership credits.
 * API Documentation: https://piapi.ai/docs/kling-api
 */

class PiAPIService {
  constructor() {
    this.apiKey = process.env.PIAPI_KEY;
    this.baseUrl = 'https://api.piapi.ai';
  }

  /**
   * Make authenticated request to PiAPI
   */
  async request(endpoint, method = 'POST', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();

    console.log('PiAPI Response:', JSON.stringify(data, null, 2));

    return data;
  }

  /**
   * Generate video from text prompt (text-to-video)
   * @param {string} prompt - Text description of the video
   * @param {object} options - Generation options
   */
  async generateVideoFromText(prompt, options = {}) {
    const {
      duration = 5, // 5 or 10 seconds
      aspectRatio = '16:9',
      mode = 'std', // std or pro
      version = '2.5', // 1.5, 1.6, 2.1, 2.5, 2.6
      negativePrompt = ''
    } = options;

    const body = {
      model: 'kling',
      task_type: 'video_generation',
      input: {
        prompt,
        negative_prompt: negativePrompt,
        duration,
        aspect_ratio: aspectRatio,
        mode,
        version
      }
    };

    const result = await this.request('/api/v1/task', 'POST', body);
    return result;
  }

  /**
   * Generate video from image (image-to-video)
   * @param {string} imageUrl - URL of the source image
   * @param {string} prompt - Motion/action description
   * @param {object} options - Generation options
   */
  async generateVideoFromImage(imageUrl, prompt = '', options = {}) {
    const {
      duration = 5,
      aspectRatio = '16:9',
      mode = 'std',
      version = '2.5', // 1.5, 1.6, 2.1, 2.5, 2.6
      negativePrompt = ''
    } = options;

    const body = {
      model: 'kling',
      task_type: 'video_generation',
      input: {
        prompt,
        negative_prompt: negativePrompt,
        image_url: imageUrl,
        duration,
        aspect_ratio: aspectRatio,
        mode,
        version
      }
    };

    const result = await this.request('/api/v1/task', 'POST', body);
    return result;
  }

  /**
   * Generate video from start and end frames (first/last frame mode)
   * @param {string} startImageUrl - URL of the first frame image
   * @param {string} endImageUrl - URL of the last frame image
   * @param {string} prompt - Motion/action description
   * @param {object} options - Generation options
   */
  async generateVideoFromFrames(startImageUrl, endImageUrl, prompt = '', options = {}) {
    const {
      duration = 5,
      aspectRatio = '16:9',
      mode = 'std',
      version = '2.5',
      negativePrompt = ''
    } = options;

    const body = {
      model: 'kling',
      task_type: 'video_generation',
      input: {
        prompt,
        negative_prompt: negativePrompt,
        image_url: startImageUrl,        // First frame
        image_tail_url: endImageUrl,     // Last frame (end frame)
        duration,
        aspect_ratio: aspectRatio,
        mode,
        version
      }
    };

    console.log('[PiAPI] Generating video from frames:', {
      startImage: startImageUrl?.substring(0, 50) + '...',
      endImage: endImageUrl?.substring(0, 50) + '...',
      prompt: prompt?.substring(0, 100),
      duration,
      mode
    });

    const result = await this.request('/api/v1/task', 'POST', body);
    return result;
  }

  /**
   * Note: PiAPI Kling API does NOT support image generation.
   * It only supports video generation tasks.
   * For image generation, use the official Kling API or another service.
   */

  /**
   * Check task status
   * @param {string} taskId - The task ID from generation request
   */
  async getTaskStatus(taskId) {
    const result = await this.request(`/api/v1/task/${taskId}`, 'GET');
    return result;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      return {
        success: true,
        message: 'PiAPI credentials configured',
        hasApiKey: !!this.apiKey,
        baseUrl: this.baseUrl
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new PiAPIService();
