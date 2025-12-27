/**
 * Image Provider Factory
 *
 * Factory pattern for selecting image generation providers.
 * Supports: Kling, PiAPI (Kling wrapper), NanoBanana, Modal.com hosted models
 */

const klingService = require('./kling');
const piapiService = require('./piapi');
const nanobananaService = require('./nanobanana');
const modalImageService = require('./modal-image');

/**
 * Get image provider service by name
 * @param {string} providerName - Provider name
 * @returns {object} Image service instance
 */
function getImageProvider(providerName) {
  switch (providerName?.toLowerCase()) {
    case 'kling':
      return klingService;

    case 'piapi':
      return piapiService;

    case 'nanobanana':
      return nanobananaService;

    case 'modal':
      return modalImageService;

    default:
      // Default to Kling
      return klingService;
  }
}

/**
 * Get all available image providers with their status
 * @returns {Promise<array>} Array of provider info
 */
async function getAvailableImageProviders() {
  const providers = [
    {
      id: 'kling',
      name: 'Kling AI',
      description: 'Official Kling API for high-quality image generation',
      service: klingService
    },
    {
      id: 'piapi',
      name: 'PiAPI (Kling)',
      description: 'Kling via PiAPI membership credits',
      service: piapiService
    },
    {
      id: 'nanobanana',
      name: 'NanoBanana Pro',
      description: 'NanoBanana image generation API',
      service: nanobananaService
    },
    {
      id: 'modal',
      name: 'Modal.com',
      description: 'Self-hosted image models on Modal.com',
      service: modalImageService
    }
  ];

  // Check availability of each provider
  const results = await Promise.all(
    providers.map(async (provider) => {
      try {
        const status = await provider.service.testConnection();
        return {
          id: provider.id,
          name: provider.name,
          description: provider.description,
          available: status.success,
          message: status.message
        };
      } catch (error) {
        return {
          id: provider.id,
          name: provider.name,
          description: provider.description,
          available: false,
          message: error.message
        };
      }
    })
  );

  return results;
}

module.exports = {
  getImageProvider,
  getAvailableImageProviders
};
