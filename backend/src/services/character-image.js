const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { put, del } = require('@vercel/blob');

const isVercel = process.env.VERCEL === '1';

/**
 * Upload character image to storage
 */
async function uploadCharacterImage(file) {
  let imageUrl;

  if (isVercel) {
    const ext = path.extname(file.originalname);
    const filename = `characters/${uuidv4()}${ext}`;
    const blob = await put(filename, file.buffer, {
      access: 'public',
      contentType: file.mimetype
    });
    imageUrl = blob.url;
  } else {
    imageUrl = `/uploads/characters/${file.filename}`;
  }

  return imageUrl;
}

/**
 * Delete character image from storage
 */
async function deleteCharacterImage(imageUrl) {
  if (isVercel) {
    try {
      await del(imageUrl);
    } catch (e) {
      console.error('Failed to delete blob:', e);
    }
  }
}

/**
 * Delete multiple character images from storage
 */
async function deleteCharacterImages(images) {
  if (isVercel) {
    for (const img of images) {
      try {
        await del(img.imageUrl);
      } catch (e) {
        console.error('Failed to delete blob:', e);
      }
    }
  }
}

/**
 * Get user character limits
 */
async function getUserLimits(prisma, userId) {
  let prefs = await prisma.userPreferences.findUnique({
    where: { userId }
  });

  if (!prefs) {
    prefs = await prisma.userPreferences.create({
      data: { userId }
    });
  }

  return {
    maxCharacters: prefs.maxCharacters || 6,
    maxImagesPerCharacter: prefs.maxImagesPerCharacter || 5
  };
}

module.exports = {
  uploadCharacterImage,
  deleteCharacterImage,
  deleteCharacterImages,
  getUserLimits
};
