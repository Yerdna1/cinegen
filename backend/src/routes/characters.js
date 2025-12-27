const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { put, del } = require('@vercel/blob');

const router = express.Router();

// Check if running in Vercel serverless
const isVercel = process.env.VERCEL === '1';

// Configure multer for image uploads (memory storage for Vercel Blob)
const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/characters');
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
      }
    });

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Helper to get user limits
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

// GET /api/characters
router.get('/', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const characters = await prisma.character.findMany({
      where: { userId: req.user.id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get user limits
    const limits = await getUserLimits(prisma, req.user.id);

    res.json({
      characters,
      limits
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/characters
router.post('/', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Character name is required' });
    }

    // Check character limit
    const limits = await getUserLimits(prisma, req.user.id);
    const characterCount = await prisma.character.count({
      where: { userId: req.user.id }
    });

    if (characterCount >= limits.maxCharacters) {
      return res.status(400).json({
        error: `Character limit reached. Maximum ${limits.maxCharacters} characters allowed.`
      });
    }

    const character = await prisma.character.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        images: true
      }
    });

    res.status(201).json({ character });
  } catch (error) {
    next(error);
  }
});

// GET /api/characters/:id
router.get('/:id', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const character = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Get user limits
    const limits = await getUserLimits(prisma, req.user.id);

    res.json({ character, limits });
  } catch (error) {
    next(error);
  }
});

// PUT /api/characters/:id
router.put('/:id', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { name, description } = req.body;

    // Check ownership
    const existing = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const character = await prisma.character.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || existing.name,
        description: description?.trim() || existing.description
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    res.json({ character });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/characters/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Check ownership
    const existing = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        images: true
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Delete images from blob storage if on Vercel
    if (isVercel) {
      for (const img of existing.images) {
        try {
          await del(img.imageUrl);
        } catch (e) {
          console.error('Failed to delete blob:', e);
        }
      }
    }

    await prisma.character.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/characters/:id/upload-image
router.post('/:id/upload-image', upload.single('image'), async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Check ownership
    const existing = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        images: true
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check image limit
    const limits = await getUserLimits(prisma, req.user.id);
    if (existing.images.length >= limits.maxImagesPerCharacter) {
      return res.status(400).json({
        error: `Image limit reached. Maximum ${limits.maxImagesPerCharacter} images per character allowed.`
      });
    }

    let imageUrl;

    if (isVercel) {
      // Use Vercel Blob storage in production
      const ext = path.extname(req.file.originalname);
      const filename = `characters/${uuidv4()}${ext}`;
      const blob = await put(filename, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype
      });
      imageUrl = blob.url;
    } else {
      // Use local file storage in development
      imageUrl = `/uploads/characters/${req.file.filename}`;
    }

    // Get the next sort order
    const maxSortOrder = existing.images.length > 0
      ? Math.max(...existing.images.map(img => img.sortOrder))
      : -1;

    // Create the character image record
    await prisma.characterImage.create({
      data: {
        characterId: req.params.id,
        imageUrl,
        sortOrder: maxSortOrder + 1
      }
    });

    // Update the main imageUrl if this is the first image
    if (existing.images.length === 0) {
      await prisma.character.update({
        where: { id: req.params.id },
        data: { imageUrl }
      });
    }

    // Fetch updated character
    const character = await prisma.character.findUnique({
      where: { id: req.params.id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    res.json({ character });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/characters/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Check ownership
    const character = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const imageToDelete = character.images.find(img => img.id === req.params.imageId);
    if (!imageToDelete) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from blob storage if on Vercel
    if (isVercel) {
      try {
        await del(imageToDelete.imageUrl);
      } catch (e) {
        console.error('Failed to delete blob:', e);
      }
    }

    // Delete the image record
    await prisma.characterImage.delete({
      where: { id: req.params.imageId }
    });

    // Update primary imageUrl if we deleted the primary image
    const remainingImages = character.images.filter(img => img.id !== req.params.imageId);
    const newPrimaryUrl = remainingImages.length > 0 ? remainingImages[0].imageUrl : null;

    await prisma.character.update({
      where: { id: req.params.id },
      data: { imageUrl: newPrimaryUrl }
    });

    // Fetch updated character
    const updatedCharacter = await prisma.character.findUnique({
      where: { id: req.params.id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    res.json({ character: updatedCharacter });
  } catch (error) {
    next(error);
  }
});

// PUT /api/characters/:id/images/reorder
router.put('/:id/images/reorder', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { imageIds } = req.body; // Array of image IDs in new order

    // Check ownership
    const character = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        images: true
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({ error: 'imageIds must be an array' });
    }

    // Update sort orders
    const updates = imageIds.map((id, index) =>
      prisma.characterImage.updateMany({
        where: { id, characterId: req.params.id },
        data: { sortOrder: index }
      })
    );

    await Promise.all(updates);

    // Update primary imageUrl to first image
    if (imageIds.length > 0) {
      const firstImage = await prisma.characterImage.findUnique({
        where: { id: imageIds[0] }
      });
      if (firstImage) {
        await prisma.character.update({
          where: { id: req.params.id },
          data: { imageUrl: firstImage.imageUrl }
        });
      }
    }

    // Fetch updated character
    const updatedCharacter = await prisma.character.findUnique({
      where: { id: req.params.id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    res.json({ character: updatedCharacter });
  } catch (error) {
    next(error);
  }
});

// GET /api/characters/limits
router.get('/user/limits', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const limits = await getUserLimits(prisma, req.user.id);

    const characterCount = await prisma.character.count({
      where: { userId: req.user.id }
    });

    res.json({
      limits,
      currentCount: characterCount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
