const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
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
      orderBy: { createdAt: 'desc' }
    });

    res.json({ characters });
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

    const character = await prisma.character.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null
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
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ character });
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
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Character not found' });
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
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageUrl = `/uploads/characters/${req.file.filename}`;

    const character = await prisma.character.update({
      where: { id: req.params.id },
      data: { imageUrl }
    });

    res.json({ character });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
