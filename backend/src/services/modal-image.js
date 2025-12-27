/**
 * Modal.com Hosted Image Generation Service
 *
 * Uses Modal.com hosted image models (e.g., Flux, SDXL, Qwen-VL) for image generation.
 * The endpoint should be a Modal.com deployed function URL.
 */

class ModalImageService {
  constructor() {
    this.defaultApiKey = process.env.MODAL_API_KEY;
    this.defaultEndpoint = process.env.MODAL_IMAGE_ENDPOINT;
  }

  /**
   * Get user's Modal image endpoint from database
   * @param {object} prisma - Prisma client
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} User's endpoint or default
   */
  async getUserEndpoint(prisma, userId) {
    if (prisma && userId) {
      const prefs = await prisma.userPreferences.findUnique({
        where: { userId }
      });
      if (prefs?.modalImageEndpoint) {
        return prefs.modalImageEndpoint;
      }
    }
    return this.defaultEndpoint || null;
  }

  /**
   * Make authenticated request to Modal image endpoint
   * @param {string} endpoint - The endpoint URL to use
   * @param {object} body - Request body
   */
  async request(endpoint, body) {
    if (!endpoint) {
      throw new Error('Modal image endpoint not configured. Set it in Settings or environment.');
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.defaultApiKey}`
      },
      body: JSON.stringify(body)
    };

    const response = await fetch(endpoint, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Modal image error: ${response.status}`);
    }

    return data;
  }

  /**
   * Generate image from text prompt
   * @param {string} endpoint - Modal endpoint URL
   * @param {string} prompt - Text description of the image
   * @param {object} options - Generation options
   */
  async generateImage(endpoint, prompt, options = {}) {
    const {
      aspectRatio = '16:9',
      style = 'cinematic',
      negativePrompt = '',
      referenceImages = [],
      width = 1024,
      height = 576,
      model = 'flux' // or 'sdxl', 'qwen-vl'
    } = options;

    const body = {
      prompt,
      negative_prompt: negativePrompt,
      width,
      height,
      model,
      style
    };

    // Add reference images for character consistency if provided
    if (referenceImages.length > 0) {
      body.reference_images = referenceImages;
    }

    const result = await this.request(endpoint, body);

    // Handle different response formats from Modal
    // Synchronous response with image URL
    if (result.image_url || result.url) {
      return {
        success: true,
        data: {
          task_id: result.id || `modal-${Date.now()}`,
          status: 'completed',
          image_url: result.image_url || result.url
        }
      };
    }

    // Asynchronous response with task ID
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
   * @param {string} endpoint - Modal endpoint URL
   * @param {string} taskId - The task ID returned from generation request
   */
  async getTaskStatus(endpoint, taskId) {
    // For Modal, we might need a separate status endpoint
    const statusEndpoint = process.env.MODAL_IMAGE_STATUS_ENDPOINT || endpoint + '/status';

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.defaultApiKey}`
      }
    };

    try {
      const response = await fetch(`${statusEndpoint}?task_id=${taskId}`, options);
      const data = await response.json();

      return {
        success: true,
        data: {
          task_id: taskId,
          status: data.status,
          image_url: data.image_url || data.url,
          error: data.error
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          task_id: taskId,
          status: 'error',
          error: error.message
        }
      };
    }
  }

  /**
   * Get image URL from completed task
   * @param {string} endpoint - Modal endpoint URL
   * @param {string} taskId - The task ID to check
   */
  async getImageUrl(endpoint, taskId) {
    const status = await this.getTaskStatus(endpoint, taskId);

    if (status.data.status === 'completed' && status.data.image_url) {
      return status.data.image_url;
    }

    return null;
  }

  /**
   * Test API connection
   * @param {string} endpoint - Optional endpoint to test (falls back to default)
   */
  async testConnection(endpoint = null) {
    const ep = endpoint || this.defaultEndpoint;
    try {
      if (!this.defaultApiKey || !ep) {
        return {
          success: false,
          message: 'Missing Modal API key or image endpoint',
          hasApiKey: !!this.defaultApiKey,
          hasEndpoint: !!ep
        };
      }

      return {
        success: true,
        message: 'Modal image endpoint configured',
        hasApiKey: true,
        hasEndpoint: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        hasApiKey: !!this.defaultApiKey,
        hasEndpoint: !!ep
      };
    }
  }
}

module.exports = new ModalImageService();
