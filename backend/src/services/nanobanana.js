/**
 * NanoBanana Pro Image Generation Service
 *
 * Uses Google Gemini API for AI image generation with character consistency.
 * Supports reference images for maintaining consistent character appearance across scenes.
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

// Encryption for API keys (same as other services)
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

class NanoBananaService {
  constructor() {
    this.defaultApiKey = process.env.NANOBANANA_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = 'gemini-3-pro-image-preview'; // Default model
  }

  /**
   * Get user's API key from database
   */
  async getUserApiKey(prisma, userId) {
    if (!prisma || !userId) {
      return this.defaultApiKey;
    }

    try {
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: { userId, provider: 'nanobanana' }
      });

      if (apiKeyRecord) {
        return decrypt(apiKeyRecord.encryptedKey);
      }
    } catch (error) {
      console.error('Error fetching NanoBanana API key:', error);
    }

    return this.defaultApiKey;
  }

  /**
   * Fetch image from URL and convert to base64
   */
  async fetchImageAsBase64(imageUrl) {
    try {
      // Handle both full URLs and relative paths
      const fullUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001'}${imageUrl}`;

      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.warn(`[Gemini Image] Failed to fetch image: ${fullUrl}`);
        return null;
      }

      const buffer = await response.buffer();
      const base64 = buffer.toString('base64');

      // Determine mime type from content-type or default to jpeg
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return {
        data: base64,
        mimeType: contentType
      };
    } catch (error) {
      console.error('[Gemini Image] Error fetching reference image:', error);
      return null;
    }
  }

  /**
   * Generate image from text prompt using Google Gemini with character consistency
   * @param {string} prompt - Text description of the image
   * @param {object} options - Generation options
   */
  async generateImage(prompt, options = {}) {
    const {
      aspectRatio = '16:9',
      style = 'cinematic',
      apiKey = null,
      model = null, // gemini-3-pro-image-preview, gemini-2.0-flash-exp, imagen-3.0-generate-002
      referenceImages = [], // Array of character image URLs for consistency
      imageSize = '4K', // 1K, 2K, or 4K for higher resolution
      characterDescriptions = [] // Array of character appearance descriptions
    } = options;

    const key = apiKey || this.defaultApiKey;
    if (!key) {
      throw new Error('Google API key not configured. Please add your API key in Settings.');
    }

    // Use provided model or default
    const modelName = model || this.defaultModel;

    // Build character consistency instruction
    let characterContext = '';
    if (characterDescriptions && characterDescriptions.length > 0) {
      characterContext = `\n\nCHARACTERS (maintain exact appearance including clothing, hair, and physical features):\n${characterDescriptions.join('\n')}`;
    }

    // Enhance prompt with style and character consistency
    const enhancedPrompt = `IMPORTANT: Preserve exact character identity, clothing, and appearance from reference images.${characterContext}

${style} style image: ${prompt}

Requirements:
- Maintain consistent character appearance (same clothing, hairstyle, physical features)
- Characters must look identical to reference images
- High quality, detailed, professional cinematography
- Aspect ratio: ${aspectRatio}`;

    const url = `${this.baseUrl}/models/${modelName}:generateContent?key=${key}`;

    // Build content parts - start with text prompt
    const contentParts = [{
      text: enhancedPrompt
    }];

    // Add reference images (up to 14 images, max 5 people for character consistency)
    if (referenceImages && referenceImages.length > 0) {
      console.log(`[Gemini Image] Adding ${referenceImages.length} reference images for character consistency`);

      const imageLimit = Math.min(referenceImages.length, 14); // API limit
      for (let i = 0; i < imageLimit; i++) {
        const imageData = await this.fetchImageAsBase64(referenceImages[i]);
        if (imageData) {
          contentParts.push({
            inline_data: {
              mime_type: imageData.mimeType,
              data: imageData.data
            }
          });
        }
      }
    }

    const body = {
      contents: [{
        parts: contentParts
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageSize: imageSize // 1K, 2K, or 4K
      }
    };

    console.log('[Gemini Image] Calling API:', {
      model: modelName,
      promptLength: enhancedPrompt.length,
      referenceImagesCount: contentParts.length - 1,
      imageSize
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Gemini Image] API Error:', data);
      throw new Error(data.error?.message || `Gemini API error: ${response.status}`);
    }

    console.log('[Gemini Image] Response received:', {
      hasCandidates: !!data.candidates,
      candidatesCount: data.candidates?.length
    });

    // Extract image from response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      throw new Error('No image generated by Gemini');
    }

    const parts = candidates[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

    if (imagePart) {
      // Return base64 image data directly
      const base64Data = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;
      const ext = mimeType.split('/')[1] || 'png';

      return {
        success: true,
        data: {
          image_url: `data:${mimeType};base64,${base64Data}`,
          image_base64: base64Data,
          format: ext,
          status: 'completed'
        }
      };
    }

    // Check if there's text explaining why no image
    const textPart = parts.find(p => p.text);
    if (textPart) {
      throw new Error(`Gemini response: ${textPart.text}`);
    }

    throw new Error('No image in Gemini response');
  }

  /**
   * Check image generation task status (not needed for Gemini - synchronous)
   */
  async getTaskStatus(taskId, apiKey = null) {
    // Gemini generates images synchronously, no task polling needed
    return {
      success: true,
      data: {
        task_id: taskId,
        status: 'completed'
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
