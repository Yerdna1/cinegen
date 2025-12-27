/**
 * Database Seed Script
 *
 * Sets up default preferences and API keys for specific users.
 * Run with: npx prisma db seed
 * Or directly: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Encryption for API keys (must match users.js)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

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

// Claude Code OAuth Token (from claude setup-token)
// This uses your Claude subscription instead of separate API credits
const CLAUDE_OAUTH_TOKEN = process.env.CLAUDE_CODE_OAUTH_TOKEN || '';

// Users to pre-configure with Modal.com defaults
const PRECONFIGURED_USERS = [
  {
    email: 'andrejgalad@gmail.com',
    preferences: {
      defaultLlmProvider: 'claude-sdk', // Use Claude SDK with OAuth
      defaultImageProvider: 'kling',
      defaultVoiceProvider: 'modal-chatterbox',
      modalChatterboxEndpoint: MODAL_ENDPOINTS.chatterbox,
      modalCoquiTtsEndpoint: MODAL_ENDPOINTS.coquiTts,
      modalHallo3Endpoint: MODAL_ENDPOINTS.hallo3,
      modalMusicEndpoint: MODAL_ENDPOINTS.music,
      modalFileS3Endpoint: MODAL_ENDPOINTS.fileS3
    },
    apiKeys: [
      { provider: 'claude-oauth', key: CLAUDE_OAUTH_TOKEN }
    ]
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

    // Set up API keys
    if (userConfig.apiKeys) {
      console.log(`  Setting up API keys...`);
      for (const apiKeyConfig of userConfig.apiKeys) {
        if (!apiKeyConfig.key) {
          console.log(`    - ${apiKeyConfig.provider}: Skipped (no key provided)`);
          continue;
        }

        const encryptedKey = encrypt(apiKeyConfig.key);
        await prisma.apiKey.upsert({
          where: {
            userId_provider: {
              userId: user.id,
              provider: apiKeyConfig.provider
            }
          },
          update: { encryptedKey },
          create: {
            userId: user.id,
            provider: apiKeyConfig.provider,
            encryptedKey
          }
        });
        console.log(`    - ${apiKeyConfig.provider}: ✓ Saved (****${apiKeyConfig.key.slice(-4)})`);
      }
    }
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
