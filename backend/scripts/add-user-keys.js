/**
 * Script to add API keys to user's database record
 * Run with: node scripts/add-user-keys.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

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

async function main() {
  const prisma = new PrismaClient();

  try {
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'andrej'
        }
      }
    });

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Found user:', user.email, user.id);

    // API keys to add
    const keys = [
      { provider: 'kling', key: 'Ab8g9YFDYkrParRbnabMK3MQGMBaLyyE' },
      { provider: 'kling-secret', key: 'BMfmnBLACbkApBK3BRPEmeJJkCfEM4fy' },
    ];

    for (const { provider, key } of keys) {
      const encryptedKey = encrypt(key);

      await prisma.apiKey.upsert({
        where: {
          userId_provider: {
            userId: user.id,
            provider: provider
          }
        },
        update: {
          encryptedKey: encryptedKey
        },
        create: {
          userId: user.id,
          provider: provider,
          encryptedKey: encryptedKey
        }
      });

      console.log(`Added/Updated ${provider} key for user`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
