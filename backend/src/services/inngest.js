/**
 * Inngest Configuration and Functions
 *
 * Handles async background jobs for audio generation with retries and observability.
 */

const { Inngest } = require('inngest');

// Create Inngest client
const inngest = new Inngest({
  id: 'cinegen',
  name: 'CineGen',
});

// Event types
const EVENTS = {
  AUDIO_GENERATION_REQUESTED: 'audio/generation.requested',
  AUDIO_GENERATION_COMPLETED: 'audio/generation.completed',
  AUDIO_GENERATION_FAILED: 'audio/generation.failed',
};

module.exports = {
  inngest,
  EVENTS,
};
