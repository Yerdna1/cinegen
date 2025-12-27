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
// Based on actual deployed apps from: modal app list
// Apps: music-generator, chatterbox-tts-generator, hallo3-portrait-avatar, file-to-s3, coqui-tts-generator
const MODAL_ENDPOINTS = {
  chatterbox: 'https://andrejgalad--chatterbox-tts-generator-generate.modal.run',
  coquiTts: 'https://andrejgalad--coqui-tts-generator-generate.modal.run',
  hallo3: 'https://andrejgalad--hallo3-portrait-avatar-generate.modal.run',
  music: 'https://andrejgalad--music-generator-generate.modal.run',
  fileS3: 'https://andrejgalad--file-to-s3-upload.modal.run'
};

// Users to pre-configure with Modal.com defaults
const PRECONFIGURED_USERS = [
  {
    email: 'andrejgalad@gmail.com',
    preferences: {
      defaultLlmProvider: 'anthropic',
      defaultImageProvider: 'kling',
      defaultVoiceProvider: 'modal-chatterbox',
      modalChatterboxEndpoint: MODAL_ENDPOINTS.chatterbox,
      modalCoquiTtsEndpoint: MODAL_ENDPOINTS.coquiTts,
      modalHallo3Endpoint: MODAL_ENDPOINTS.hallo3,
      modalMusicEndpoint: MODAL_ENDPOINTS.music,
      modalFileS3Endpoint: MODAL_ENDPOINTS.fileS3
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
    console.log(`    - Modal Chatterbox: ${userConfig.preferences.modalChatterboxEndpoint}`);
    console.log(`    - Modal Coqui TTS: ${userConfig.preferences.modalCoquiTtsEndpoint}`);
    console.log(`    - Modal Hallo3: ${userConfig.preferences.modalHallo3Endpoint}`);
    console.log(`    - Modal Music: ${userConfig.preferences.modalMusicEndpoint}`);
    console.log(`    - Modal File S3: ${userConfig.preferences.modalFileS3Endpoint}`);
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
