/**
 * Modal.com Hosted LLM Service
 *
 * Uses Modal.com hosted LLM models (e.g., Qwen) for scene content generation.
 * The endpoint should be a Modal.com deployed function URL.
 *
 * Note: Modal doesn't have a dedicated LLM endpoint in the current deployment.
 * This service is a placeholder for future Modal-hosted LLM models.
 */

class ModalLLMService {
  constructor() {
    this.apiKey = process.env.MODAL_API_KEY;
    this.endpoint = process.env.MODAL_LLM_ENDPOINT;
  }

  /**
   * Get user's Modal LLM endpoint from preferences
   * Modal doesn't require API keys - endpoints are public or use Modal's auth
   * @param {object} prisma - Prisma client
   * @param {string} userId - User ID
   * @returns {string|null} The endpoint URL or null if not configured
   */
  async getUserApiKey(prisma, userId) {
    // Modal LLM endpoint is not currently deployed
    // Return the environment variable endpoint or null
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // For now, Modal doesn't have a dedicated LLM endpoint
    // Return a placeholder that indicates Modal LLM is not available
    return this.endpoint || null;
  }

  /**
   * Make authenticated request to Modal LLM endpoint
   * @param {string} endpoint - Optional endpoint override
   */
  async request(body, endpoint = null) {
    const targetEndpoint = endpoint || this.endpoint;
    if (!targetEndpoint) {
      throw new Error('Modal LLM endpoint not configured. Please use Anthropic for now.');
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };

    // Add auth if API key exists
    if (this.apiKey) {
      options.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(targetEndpoint, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Modal LLM error: ${response.status}`);
    }

    return data;
  }

  /**
   * Generate scene content (dialogue + image prompts) for a single scene
   * Compatible interface with AnthropicService
   * @param {string} apiKeyOrEndpoint - API key or endpoint URL (for Modal, this is the endpoint)
   * @param {object} sceneContext - Current scene details
   * @param {object} projectContext - Project-level context
   */
  async generateSceneContent(apiKeyOrEndpoint, sceneContext, projectContext) {
    const systemPrompt = `You are a professional cinematic scene writer and visual storyteller. Your task is to generate dialogue and detailed image prompts for movie scenes.

For each scene, you must generate:
1. DIALOGUE: Natural, engaging dialogue that fits the characters and scene context
2. START_IMAGE_PROMPT: A detailed prompt describing the FIRST frame of the scene
3. END_IMAGE_PROMPT: A detailed prompt describing the LAST frame of the scene

CRITICAL REQUIREMENTS:
- Image prompts must be visually consistent with each other (same characters, lighting, style)
- Include specific details: character positions, expressions, camera angle, lighting, environment
- Prompts should be suitable for AI image generation (detailed, descriptive, no ambiguity)
- The start and end frames should show clear progression within the scene
- Maintain visual continuity with the project's established style

OUTPUT FORMAT (JSON only, no other text):
{
  "dialogue": "Character dialogue for this scene",
  "startImagePrompt": "Detailed description of the first frame...",
  "endImagePrompt": "Detailed description of the last frame...",
  "emotions": "Primary emotions in this scene (comma-separated)",
  "actions": "Key actions happening (comma-separated)"
}`;

    const characterDescriptions = projectContext.characters
      .map(c => `- ${c.name}: ${c.description || 'No description'}`)
      .join('\n');

    const previousContext = projectContext.previousScenes
      .map((s, i) => `Scene ${i + 1}: ${s.dialogue || 'No dialogue'} [${s.actions || 'No actions'}]`)
      .join('\n');

    const userPrompt = `Generate content for Scene ${sceneContext.sequenceNumber} of ${projectContext.totalScenes}.

PROJECT DETAILS:
- Genre: ${projectContext.genre || 'Not specified'}
- Setting: ${projectContext.setting || 'Not specified'}
- Plot: ${projectContext.plot || 'Not specified'}

CHARACTERS:
${characterDescriptions || 'No characters defined'}

PREVIOUS SCENES:
${previousContext || 'This is the first scene'}

CURRENT SCENE CONTEXT:
- Scene Number: ${sceneContext.sequenceNumber}
- Camera Angle: ${sceneContext.cameraAngle || 'medium shot'}
- Suggested Emotions: ${sceneContext.emotions || 'neutral'}
- Suggested Actions: ${sceneContext.actions || 'standing'}

Generate the scene content now. Respond ONLY with valid JSON.`;

    // Modal endpoints typically expect a specific format
    // Adjust this based on your actual Modal deployment
    const result = await this.request({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, apiKeyOrEndpoint);

    // Handle different response formats from Modal
    const responseText = result.choices?.[0]?.message?.content
      || result.response
      || result.text
      || result.content
      || '';

    return this.parseSceneContent(responseText);
  }

  /**
   * Parse the LLM response into structured scene content
   */
  parseSceneContent(responseText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          dialogue: parsed.dialogue || '',
          startImagePrompt: parsed.startImagePrompt || parsed.start_image_prompt || '',
          endImagePrompt: parsed.endImagePrompt || parsed.end_image_prompt || '',
          emotions: parsed.emotions || '',
          actions: parsed.actions || ''
        };
      }
    } catch (error) {
      console.error('Failed to parse scene content from Modal LLM:', error);
    }

    // Fallback: return empty content
    return {
      dialogue: '',
      startImagePrompt: '',
      endImagePrompt: '',
      emotions: '',
      actions: ''
    };
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      if (!this.apiKey || !this.endpoint) {
        return {
          success: false,
          message: 'Missing Modal API key or endpoint',
          hasApiKey: !!this.apiKey,
          hasEndpoint: !!this.endpoint
        };
      }

      // Simple test request
      await this.request({
        messages: [{ role: 'user', content: 'Say "ok"' }],
        max_tokens: 10
      });

      return {
        success: true,
        message: 'Modal LLM endpoint configured and working',
        hasApiKey: true,
        hasEndpoint: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        hasApiKey: !!this.apiKey,
        hasEndpoint: !!this.endpoint
      };
    }
  }
}

module.exports = new ModalLLMService();
