/**
 * Claude Agent SDK Service
 *
 * Uses the official Claude Agent SDK with OAuth token authentication.
 * This allows using your Claude subscription (via CLAUDE_CODE_OAUTH_TOKEN)
 * instead of separate API credits.
 *
 * Based on the Python autonomous agent implementation.
 */

const { query } = require('@anthropic-ai/claude-agent-sdk');
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

class ClaudeSDKService {
  constructor() {
    // Check for OAuth token or API key from environment (fallback)
    this.envOauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
    this.envApiKey = process.env.ANTHROPIC_API_KEY;
    this.model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';
  }

  /**
   * Get user's OAuth token from database or environment
   * @param {object} prisma - Prisma client
   * @param {string} userId - User ID
   * @returns {string|null} The OAuth token
   */
  async getUserApiKey(prisma, userId) {
    // First, try to get OAuth token from database
    if (prisma && userId) {
      const oauthKey = await prisma.apiKey.findFirst({
        where: {
          userId,
          provider: 'claude-oauth'
        }
      });

      if (oauthKey) {
        const token = decrypt(oauthKey.encryptedKey);
        // Set it for this request
        process.env.CLAUDE_CODE_OAUTH_TOKEN = token;
        return token;
      }
    }

    // Fall back to environment variables
    if (this.envOauthToken) {
      return this.envOauthToken;
    }

    if (this.envApiKey) {
      return this.envApiKey;
    }

    return null;
  }

  /**
   * Generate scene content using Claude Agent SDK
   * @param {string} _apiKey - Ignored (SDK uses env-based auth)
   * @param {object} sceneContext - Current scene details
   * @param {object} projectContext - Project-level context
   */
  async generateSceneContent(_apiKey, sceneContext, projectContext) {
    const prompt = this.buildScenePrompt(sceneContext, projectContext);

    try {
      let result = null;

      for await (const message of query({
        prompt,
        options: {
          model: this.model,
          maxTurns: 1, // Single turn for content generation
          systemPrompt: this.getSystemPrompt()
        }
      })) {
        if (message.type === 'result') {
          result = message.result;
          break;
        }
      }

      if (result) {
        return this.parseSceneContent(result);
      }

      // Fallback if no result
      return {
        dialogue: '',
        startImagePrompt: '',
        endImagePrompt: '',
        emotions: '',
        actions: ''
      };
    } catch (error) {
      console.error('Claude SDK generation error:', error);
      throw new Error(`Claude SDK error: ${error.message}`);
    }
  }

  /**
   * Get system prompt for scene generation
   */
  getSystemPrompt() {
    return `You are a professional cinematic scene writer and visual storyteller. Your task is to generate dialogue and detailed image prompts for movie scenes.

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
  }

  /**
   * Build the prompt for scene generation
   */
  buildScenePrompt(sceneContext, projectContext) {
    const characterDescriptions = projectContext.characters
      .map(c => `- ${c.name}: ${c.description || 'No description'}`)
      .join('\n');

    const previousContext = projectContext.previousScenes
      .map((s, i) => `Scene ${i + 1}: ${s.dialogue || 'No dialogue'} [${s.actions || 'No actions'}]`)
      .join('\n');

    return `Generate content for Scene ${sceneContext.sequenceNumber} of ${projectContext.totalScenes}.

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
  }

  /**
   * Parse the SDK response into structured scene content
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
      console.error('Failed to parse scene content from Claude SDK:', error);
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
   * Generate video prompt for scene transition
   * @param {object} sceneContext - Scene details including dialogue, images, etc.
   * @param {object} projectContext - Project-level context
   */
  async generateVideoPrompt(sceneContext, projectContext) {
    const prompt = `Generate a video motion prompt for transitioning between two frames in a movie scene.

PROJECT CONTEXT:
- Genre: ${projectContext.genre || 'Drama'}
- Setting: ${projectContext.setting || 'Modern'}

SCENE CONTEXT:
- Scene Number: ${sceneContext.sequenceNumber}
- Dialogue: ${sceneContext.dialogue || 'No dialogue'}
- Emotions: ${sceneContext.emotions || 'neutral'}
- Actions: ${sceneContext.actions || 'standing'}
- Camera Angle: ${sceneContext.cameraAngle || 'medium shot'}

START FRAME DESCRIPTION:
${sceneContext.startImagePrompt || 'Opening shot of the scene'}

END FRAME DESCRIPTION:
${sceneContext.endImagePrompt || 'Closing shot of the scene'}

Generate a concise video motion prompt (2-3 sentences) that describes:
1. The camera movement (pan, zoom, dolly, static, etc.)
2. Character movements and actions
3. Any environmental changes (lighting, weather, etc.)

The prompt should guide smooth video generation between the start and end frames.
Respond with ONLY the video prompt text, no JSON or extra formatting.`;

    try {
      let result = null;

      for await (const message of query({
        prompt,
        options: {
          model: this.model,
          maxTurns: 1,
          systemPrompt: 'You are a professional cinematographer describing camera movements and scene transitions. Be concise and specific. Output only the video prompt, nothing else.'
        }
      })) {
        if (message.type === 'result') {
          result = message.result;
          break;
        }
      }

      // Clean up the result - remove any quotes or extra formatting
      if (result) {
        result = result.trim().replace(/^["']|["']$/g, '');
      }

      return result || 'Smooth camera movement following the action in the scene.';
    } catch (error) {
      console.error('Claude SDK video prompt generation error:', error);
      // Return a default prompt on error
      return 'Natural camera movement with subtle transitions between frames.';
    }
  }

  /**
   * Test SDK connection
   */
  async testConnection() {
    try {
      if (!this.oauthToken && !this.apiKey) {
        return {
          success: false,
          message: 'Missing CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY',
          hasAuth: false
        };
      }

      // Quick test query
      let success = false;
      for await (const message of query({
        prompt: 'Say "ok"',
        options: {
          model: this.model,
          maxTurns: 1
        }
      })) {
        if (message.type === 'result') {
          success = true;
          break;
        }
      }

      return {
        success,
        message: success ? 'Claude SDK connected via OAuth' : 'SDK query failed',
        hasAuth: true,
        authType: this.oauthToken ? 'oauth' : 'apikey'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        hasAuth: !!(this.oauthToken || this.apiKey)
      };
    }
  }
}

module.exports = new ClaudeSDKService();
