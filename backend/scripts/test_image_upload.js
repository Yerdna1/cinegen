const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  // Create a simple 1x1 red PNG image
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // width=1, height=1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0xFF, 0x00, // compressed image data (red pixel)
    0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59, 0xE7,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
    0xAE, 0x42, 0x60, 0x82
  ]);

  // Save test image
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'characters');
  const testImagePath = path.join(uploadsDir, 'test-upload-91.png');
  fs.writeFileSync(testImagePath, pngData);
  console.log('Test image created:', testImagePath);

  // Update character with image URL
  const characterId = process.argv[2];
  if (characterId) {
    const character = await prisma.character.update({
      where: { id: characterId },
      data: { imageUrl: '/uploads/characters/test-upload-91.png' }
    });
    console.log('Character updated:', character.name, 'with image:', character.imageUrl);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
