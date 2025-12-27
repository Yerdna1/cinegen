/**
 * Pricing Service
 *
 * Calculates costs for all AI providers based on 2025 pricing.
 * Prices are stored as constants and can be updated as needed.
 */

// Pricing constants (updated December 2025)
const PRICING = {
  // LLM Providers - prices per 1 million tokens
  llm: {
    anthropic: {
      'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
      'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
      'claude-opus-4-5': { input: 5.00, output: 25.00 },
      'claude-opus-4-5-20251101': { input: 5.00, output: 25.00 },
      'claude-haiku-3': { input: 0.25, output: 1.25 },
      'claude-3-haiku': { input: 0.25, output: 1.25 },
      'claude-3-sonnet': { input: 3.00, output: 15.00 },
      'claude-3-opus': { input: 15.00, output: 75.00 },
      default: { input: 3.00, output: 15.00 } // Default to Sonnet pricing
    },
    modal: {
      default: { input: 0, output: 0 } // Self-hosted, compute cost not tracked here
    }
  },

  // Image Providers - price per image
  image: {
    nanobanana: 0.039,  // Google Gemini - $0.039 per 1024x1024 image
    gemini: 0.039,      // Alias for nanobanana
    kling: 0.003,       // Kling AI - ~$10 for 3300 images
    modal: 0.0081       // Estimated: ~15 sec on L40S = $0.0081
  },

  // Video Providers - price per video
  video: {
    piapi: {
      standard: 0.26,   // 5-second video, standard mode
      std: 0.26,        // Alias
      pro: 0.46,        // 5-second video, pro mode
      professional: 0.46 // Alias
    },
    kling: {
      standard: 0.14,   // Official Kling API
      pro: 0.49
    },
    modal: 0            // Self-hosted
  },

  // TTS/Audio Providers - price per character
  tts: {
    elevenlabs: 0.00020,        // ~$0.20 per 1000 characters
    'modal-chatterbox': 0.0005, // Estimated: ~5 sec on L40S @ $1.95/hr = $0.0027/generation, normalized per char
    'modal-f5tts': 0.0005,      // Estimated: similar to chatterbox
    'modal-coqui': 0.0005       // Estimated: similar to chatterbox
  },

  // Modal GPU compute costs (for tracking self-hosted operations)
  modal: {
    // GPU rates per second (derived from hourly rates)
    gpu: {
      't4': 0.000164,           // $0.59/hour
      'l4': 0.000306,           // $1.10/hour
      'l40s': 0.000542,         // $1.95/hour
      'a10g': 0.000306,         // $1.10/hour
      'a100-40gb': 0.000583,    // $2.10/hour
      'a100-80gb': 0.000694,    // $2.50/hour
      'h100': 0.001097          // $3.95/hour
    },
    // Estimated execution times per operation (seconds)
    estimatedTime: {
      tts: 8,                   // TTS generation (~8 seconds on L40S)
      image: 15                 // Image generation (~15 seconds on L40S)
    },
    // Fixed cost estimates per operation (GPU time × rate)
    perOperation: {
      tts: 0.0043,              // ~8 sec on L40S = $0.0043
      image: 0.0081             // ~15 sec on L40S = $0.0081
    }
  }
};

/**
 * Calculate LLM cost based on token usage
 * @param {string} provider - Provider name (anthropic, modal)
 * @param {string} model - Model name (claude-sonnet-4-5, etc.)
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Cost in USD
 */
function calculateLLMCost(provider, model, inputTokens, outputTokens) {
  const providerPricing = PRICING.llm[provider?.toLowerCase()] || PRICING.llm.anthropic;
  const modelPricing = providerPricing[model?.toLowerCase()] || providerPricing.default;

  if (!modelPricing) {
    console.warn(`[Pricing] Unknown LLM model: ${provider}/${model}, using default`);
    return 0;
  }

  // Convert from per-million to per-token pricing
  const inputCost = (inputTokens || 0) * (modelPricing.input / 1_000_000);
  const outputCost = (outputTokens || 0) * (modelPricing.output / 1_000_000);

  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Calculate image generation cost
 * @param {string} provider - Provider name (nanobanana, kling, modal)
 * @param {number} count - Number of images generated
 * @returns {number} Cost in USD
 */
function calculateImageCost(provider, count = 1) {
  const pricePerImage = PRICING.image[provider?.toLowerCase()] ?? PRICING.image.nanobanana;
  return Number((pricePerImage * count).toFixed(6));
}

/**
 * Calculate video generation cost
 * @param {string} provider - Provider name (piapi, kling, modal)
 * @param {string} mode - Generation mode (standard, pro)
 * @param {number} count - Number of videos generated
 * @returns {number} Cost in USD
 */
function calculateVideoCost(provider, mode = 'standard', count = 1) {
  const providerPricing = PRICING.video[provider?.toLowerCase()];

  if (!providerPricing) {
    console.warn(`[Pricing] Unknown video provider: ${provider}`);
    return 0;
  }

  // Handle both object-style and number-style pricing
  const price = typeof providerPricing === 'object'
    ? (providerPricing[mode?.toLowerCase()] || providerPricing.standard)
    : providerPricing;

  return Number((price * count).toFixed(6));
}

/**
 * Calculate TTS/audio generation cost
 * @param {string} provider - Provider name (elevenlabs, modal-chatterbox, etc.)
 * @param {number} characterCount - Number of characters in the text
 * @returns {number} Cost in USD
 */
function calculateTTSCost(provider, characterCount) {
  const providerLower = provider?.toLowerCase() || '';

  // For Modal TTS providers, use fixed per-operation cost estimate
  if (providerLower.startsWith('modal-')) {
    return PRICING.modal.perOperation.tts;
  }

  const pricePerChar = PRICING.tts[providerLower] ?? 0;
  return Number((pricePerChar * (characterCount || 0)).toFixed(6));
}

/**
 * Calculate Modal compute cost based on operation type
 * @param {string} operation - Operation type (tts, image)
 * @param {string} gpuType - GPU type (default: l40s)
 * @param {number} durationSeconds - Optional actual duration in seconds
 * @returns {number} Cost in USD
 */
function calculateModalCost(operation, gpuType = 'l40s', durationSeconds = null) {
  // If actual duration provided, calculate based on GPU rate
  if (durationSeconds !== null) {
    const rate = PRICING.modal.gpu[gpuType] || PRICING.modal.gpu['l40s'];
    return Number((rate * durationSeconds).toFixed(6));
  }

  // Otherwise use fixed per-operation estimate
  return PRICING.modal.perOperation[operation] || 0;
}

/**
 * Get current pricing configuration
 * @returns {object} Current pricing configuration
 */
function getPricing() {
  return PRICING;
}

module.exports = {
  calculateLLMCost,
  calculateImageCost,
  calculateVideoCost,
  calculateTTSCost,
  calculateModalCost,
  getPricing,
  PRICING
};
