/**
 * LLM Provider Factory
 *
 * Factory pattern for selecting LLM providers for scene content generation.
 * Supports: Claude SDK (OAuth), Anthropic API, Modal.com hosted models
 *
 * Priority:
 * 1. Claude SDK with OAuth token (uses your Claude subscription)
 * 2. Anthropic API with API key
 * 3. Modal.com hosted models
 */

const claudeSDKService = require('./claude-sdk');
const anthropicService = require('./anthropic');
const modalLLMService = require('./modal-llm');

// Check if Claude SDK auth is available (OAuth token or API key for SDK)
const hasSDKAuth = !!(process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY);

/**
 * Get LLM provider service by name
 * @param {string} providerName - Provider name ('anthropic', 'claude-sdk', or 'modal')
 * @returns {object} LLM service instance
 */
function getLLMProvider(providerName) {
  switch (providerName?.toLowerCase()) {
    case 'claude-sdk':
    case 'sdk':
      return claudeSDKService;

    case 'anthropic':
    case 'claude':
      // Prefer Claude SDK if OAuth token is available
      if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
        console.log('Using Claude SDK with OAuth token');
        return claudeSDKService;
      }
      return anthropicService;

    case 'modal':
    case 'qwen':
      return modalLLMService;

    default:
      // Default: prefer SDK with OAuth, then Anthropic API
      if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
        console.log('Defaulting to Claude SDK with OAuth token');
        return claudeSDKService;
      }
      return anthropicService;
  }
}

/**
 * Get all available LLM providers with their status
 * @returns {Promise<array>} Array of provider info
 */
async function getAvailableLLMProviders() {
  const providers = [
    {
      id: 'claude-sdk',
      name: 'Claude SDK (OAuth)',
      description: 'Uses your Claude subscription via OAuth token',
      service: claudeSDKService,
      preferred: !!process.env.CLAUDE_CODE_OAUTH_TOKEN
    },
    {
      id: 'anthropic',
      name: 'Anthropic API',
      description: 'Direct Claude API (requires API key)',
      service: anthropicService
    },
    {
      id: 'modal',
      name: 'Modal.com (Qwen)',
      description: 'Self-hosted Qwen model on Modal.com',
      service: modalLLMService
    }
  ];

  // Check availability of each provider
  const results = await Promise.all(
    providers.map(async (provider) => {
      const status = await provider.service.testConnection();
      return {
        id: provider.id,
        name: provider.name,
        description: provider.description,
        available: status.success,
        message: status.message,
        preferred: provider.preferred || false
      };
    })
  );

  return results;
}

module.exports = {
  getLLMProvider,
  getAvailableLLMProviders
};
