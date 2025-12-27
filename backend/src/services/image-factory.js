/**
 * Image Provider Factory
 *
 * Factory pattern for selecting image generation providers.
 * Supports: Kling, NanoBanana, Modal.com hosted models
 *
 * Note: PiAPI only supports VIDEO generation, not images.
 * Use PiAPI for video generation via the video-factory instead.
 */

const klingService = require('./kling');
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
    // Note: PiAPI removed - it only supports VIDEO generation, not images
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
