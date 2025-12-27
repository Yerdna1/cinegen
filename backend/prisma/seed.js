/**
 * Database Seed Script
 *
 * Sets up default preferences for specific users.
 * Run with: npx prisma db seed
 * Or directly: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Modal.com endpoints configuration
const MODAL_ENDPOINTS = {
  llm: 'https://andrejgalad--qwen-tts-serve.modal.run',
  image: 'https://andrejgalad--flux-image-serve.modal.run',
  f5tts: 'https://andrejgalad--f5-tts-serve.modal.run',
  chatterbox: 'https://andrejgalad--chatterbox-tts-serve.modal.run'
};

// Users to pre-configure with Modal.com defaults
const PRECONFIGURED_USERS = [
  {
    email: 'andrejgalad@gmail.com',
    preferences: {
      defaultLlmProvider: 'modal',
      defaultImageProvider: 'modal',
      defaultVoiceProvider: 'modal-f5tts',
      modalLlmEndpoint: MODAL_ENDPOINTS.llm,
      modalImageEndpoint: MODAL_ENDPOINTS.image,
      modalF5ttsEndpoint: MODAL_ENDPOINTS.f5tts,
      modalChatterboxEndpoint: MODAL_ENDPOINTS.chatterbox
    }
  }
];

async function main() {
  console.log('Starting database seed...');

  for (const userConfig of PRECONFIGURED_USERS) {
    console.log(`\nConfiguring user: ${userConfig.email}`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userConfig.email },
      include: { preferences: true }
    });

    if (!user) {
      console.log(`  User ${userConfig.email} not found. Skipping...`);
      console.log(`  (User will be configured when they register)`);
      continue;
    }

    // Create or update preferences
    if (user.preferences) {
      console.log(`  Updating existing preferences...`);
      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: userConfig.preferences
      });
    } else {
      console.log(`  Creating new preferences...`);
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
          ...userConfig.preferences
        }
      });
    }

    console.log(`  ✓ Preferences set:`);
    console.log(`    - LLM Provider: ${userConfig.preferences.defaultLlmProvider}`);
    console.log(`    - Image Provider: ${userConfig.preferences.defaultImageProvider}`);
    console.log(`    - Voice Provider: ${userConfig.preferences.defaultVoiceProvider}`);
    console.log(`    - Modal LLM Endpoint: ${userConfig.preferences.modalLlmEndpoint}`);
    console.log(`    - Modal Image Endpoint: ${userConfig.preferences.modalImageEndpoint}`);
    console.log(`    - Modal F5-TTS Endpoint: ${userConfig.preferences.modalF5ttsEndpoint}`);
    console.log(`    - Modal Chatterbox Endpoint: ${userConfig.preferences.modalChatterboxEndpoint}`);
  }

  console.log('\nSeed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
