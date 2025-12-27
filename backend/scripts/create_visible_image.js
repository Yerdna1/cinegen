const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  // Create a 100x100 red PNG image using raw PNG format
  // This is a larger visible image
  const width = 100;
  const height = 100;

  // Raw pixel data (RGBA - 4 bytes per pixel)
  const pixels = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Create a gradient from red to blue
      const r = Math.floor(255 * (1 - x / width));
      const g = 50;
      const b = Math.floor(255 * (x / width));
      row.push(0); // filter byte
      row.push(r, g, b); // RGB
    }
    pixels.push(Buffer.from([0, ...new Array(width).fill(null).flatMap((_, x) => {
      const r = Math.floor(255 * (1 - x / width));
      const g = 100;
      const b = Math.floor(255 * (x / width));
      return [r, g, b];
    })]));
  }

  // For simplicity, copy an existing JPEG file if available
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'characters');
  const existingImages = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpeg'));

  if (existingImages.length > 0) {
    // Copy an existing image
    const sourcePath = path.join(uploadsDir, existingImages[0]);
    const destPath = path.join(uploadsDir, 'test-visible-image.jpeg');
    fs.copyFileSync(sourcePath, destPath);
    console.log('Copied existing image to:', destPath);

    // Update character
    const characterId = process.argv[2];
    if (characterId) {
      const character = await prisma.character.update({
        where: { id: characterId },
        data: { imageUrl: '/uploads/characters/test-visible-image.jpeg' }
      });
      console.log('Character updated:', character.name, 'with image:', character.imageUrl);
    }
  } else {
    console.log('No existing images to copy');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
