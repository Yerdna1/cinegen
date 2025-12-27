/**
 * Anthropic Claude LLM Service
 *
 * Uses Claude API for scene content generation (dialogue + image prompts).
 * API Documentation: https://docs.anthropic.com/en/api
 */

class AnthropicService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.baseUrl = 'https://api.anthropic.com';
    this.model = 'claude-sonnet-4-20250514';
  }

  /**
   * Make authenticated request to Anthropic API
   */
  async request(endpoint, method = 'POST', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Anthropic API error: ${response.status}`);
    }

    return data;
  }

  /**
   * Generate scene content (dialogue + image prompts) for a single scene
   * @param {object} sceneContext - Current scene details
   * @param {object} projectContext - Project-level context (genre, setting, characters, etc.)
   */
  async generateSceneContent(sceneContext, projectContext) {
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

OUTPUT FORMAT (JSON):
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

    const result = await this.request('/v1/messages', 'POST', {
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    return this.parseSceneContent(result.content[0].text);
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
      console.error('Failed to parse scene content:', error);
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
   * Generate a style guide for the entire project
   * @param {object} project - Project details
   * @param {array} characters - Character list with descriptions
   */
  async generateStyleGuide(project, characters) {
    const systemPrompt = `You are a visual style consultant for film production. Generate a concise style guide that ensures visual consistency across all scenes.`;

    const userPrompt = `Create a visual style guide for this project:

Genre: ${project.genre || 'Not specified'}
Setting: ${project.setting || 'Not specified'}
Plot: ${project.plot || 'Not specified'}

Characters:
${characters.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')}

Generate a JSON style guide with:
{
  "colorPalette": "Description of color scheme",
  "lightingStyle": "Description of lighting approach",
  "cameraStyle": "Preferred camera angles and movements",
  "atmosphere": "Overall visual mood and atmosphere",
  "characterAppearance": "Key visual traits to maintain for each character"
}`;

    const result = await this.request('/v1/messages', 'POST', {
      model: this.model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    try {
      const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse style guide:', error);
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
          message: 'Missing Anthropic API key',
          hasApiKey: false
        };
      }

      // Make a simple test request
      await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }]
      });

      return {
        success: true,
        message: 'Anthropic API configured and working',
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

module.exports = new AnthropicService();
