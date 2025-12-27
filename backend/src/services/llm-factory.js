/**
 * LLM Provider Factory
 *
 * Factory pattern for selecting LLM providers for scene content generation.
 * Supports: Anthropic Claude, Modal.com hosted models
 */

const anthropicService = require('./anthropic');
const modalLLMService = require('./modal-llm');

/**
 * Get LLM provider service by name
 * @param {string} providerName - Provider name ('anthropic' or 'modal')
 * @returns {object} LLM service instance
 */
function getLLMProvider(providerName) {
  switch (providerName?.toLowerCase()) {
    case 'anthropic':
    case 'claude':
      return anthropicService;

    case 'modal':
    case 'qwen':
      return modalLLMService;

    default:
      // Default to Anthropic
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
      id: 'anthropic',
      name: 'Anthropic Claude',
      description: 'Claude Sonnet for high-quality scene generation',
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
        message: status.message
      };
    })
  );

  return results;
}

module.exports = {
  getLLMProvider,
  getAvailableLLMProviders
};
