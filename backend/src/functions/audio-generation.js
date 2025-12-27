/**
 * Inngest Function: Audio Generation
 *
 * Handles async audio generation with retries and status updates.
 */

const { inngest, EVENTS } = require('../services/inngest');
const { generateSpeech } = require('../services/tts-factory');
const { PrismaClient } = require('@prisma/client');
const storage = require('../services/storage');

// Create a Prisma client for use in Inngest functions
const prisma = new PrismaClient();

/**
 * Audio Generation Function
 * Triggered when audio/generation.requested event is sent
 */
const generateAudioFunction = inngest.createFunction(
  {
    id: 'generate-audio',
    name: 'Generate Audio',
    retries: 3,
  },
  { event: EVENTS.AUDIO_GENERATION_REQUESTED },
  async ({ event, step }) => {
    const {
      sceneId,
      projectId,
      userId,
      voiceProvider,
      voiceId,
      dialogue,
      endpoint,
      apiKey,
    } = event.data;

    console.log(`[Inngest] Starting audio generation for scene ${sceneId}`);

    // Step 1: Mark scene as generating
    await step.run('mark-generating', async () => {
      await prisma.scene.update({
        where: { id: sceneId },
        data: { status: 'GENERATING' }
      });
      console.log(`[Inngest] Scene ${sceneId} marked as GENERATING`);
    });

    // Step 2: Generate audio
    const audioResult = await step.run('generate-audio', async () => {
      console.log(`[Inngest] Generating audio with provider: ${voiceProvider}`);
      const result = await generateSpeech(voiceProvider, voiceId, dialogue, {
        endpoint,
        apiKey,
        prisma,
        userId,
      });
      return result;
    });

    // Step 3: Save audio file if base64
    const audioUrl = await step.run('save-audio', async () => {
      if (audioResult.audioBase64) {
        const ext = audioResult.audioFormat || 'wav';
        const filename = `scene-${sceneId}-${Date.now()}.${ext}`;
        const contentType = ext === 'wav' ? 'audio/wav' : 'audio/mpeg';
        const url = await storage.upload(
          audioResult.audioBase64,
          filename,
          'audio',
          contentType
        );
        console.log(`[Inngest] Audio saved to storage: ${url}`);
        return url;
      }
      return audioResult.audioUrl;
    });

    // Step 4: Update scene with audio URL
    await step.run('update-scene', async () => {
      await prisma.scene.update({
        where: { id: sceneId },
        data: {
          audioUrl,
          status: 'COMPLETE'
        }
      });
      console.log(`[Inngest] Scene ${sceneId} updated with audio: ${audioUrl}`);
    });

    // Send completion event
    await inngest.send({
      name: EVENTS.AUDIO_GENERATION_COMPLETED,
      data: {
        sceneId,
        projectId,
        userId,
        audioUrl,
      }
    });

    console.log(`[Inngest] Audio generation completed for scene ${sceneId}`);
    return { success: true, audioUrl };
  }
);

module.exports = {
  generateAudioFunction,
  prisma, // Export for cleanup if needed
};
