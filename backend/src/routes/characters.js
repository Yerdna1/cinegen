const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { checkCharacterOwnership } = require('../middleware/characterOwnership');
const {
  uploadCharacterImage,
  deleteCharacterImages,
  getUserLimits
} = require('../services/character-image');

const router = express.Router();
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
router.get('/:id', checkCharacterOwnership, async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const limits = await getUserLimits(prisma, req.user.id);
    res.json({ character: req.character, limits });
  } catch (error) {
    next(error);
  }
});

// PUT /api/characters/:id
router.put('/:id', checkCharacterOwnership, async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { name, description } = req.body;

    const character = await prisma.character.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || req.character.name,
        description: description?.trim() || req.character.description
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
router.delete('/:id', checkCharacterOwnership, async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Delete images from storage
    await deleteCharacterImages(req.character.images);

    await prisma.character.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/characters/:id/upload-image
router.post('/:id/upload-image', checkCharacterOwnership, upload.single('image'), async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check image limit
    const limits = await getUserLimits(prisma, req.user.id);
    if (req.character.images.length >= limits.maxImagesPerCharacter) {
      return res.status(400).json({
        error: `Image limit reached. Maximum ${limits.maxImagesPerCharacter} images per character allowed.`
      });
    }

    const imageUrl = await uploadCharacterImage(req.file);

    // Get the next sort order
    const maxSortOrder = req.character.images.length > 0
      ? Math.max(...req.character.images.map(img => img.sortOrder))
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
    if (req.character.images.length === 0) {
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
router.delete('/:id/images/:imageId', checkCharacterOwnership, async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { deleteCharacterImage } = require('../services/character-image');

    const imageToDelete = req.character.images.find(img => img.id === req.params.imageId);
    if (!imageToDelete) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from storage
    await deleteCharacterImage(imageToDelete.imageUrl);

    // Delete the image record
    await prisma.characterImage.delete({
      where: { id: req.params.imageId }
    });

    // Update primary imageUrl if we deleted the primary image
    const remainingImages = req.character.images.filter(img => img.id !== req.params.imageId);
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
router.put('/:id/images/reorder', checkCharacterOwnership, async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { imageIds } = req.body;

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
