/**
 * Script to add Chatterbox endpoint to user preferences
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

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

    // Upsert user preferences with Chatterbox endpoint
    const prefs = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        modalChatterboxEndpoint: 'https://andrej-galad--chatterbox-tts-generator-texttospeechserver-generate-speech.modal.run'
      },
      create: {
        userId: user.id,
        modalChatterboxEndpoint: 'https://andrej-galad--chatterbox-tts-generator-texttospeechserver-generate-speech.modal.run'
      }
    });

    console.log('Updated user preferences:', prefs);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
