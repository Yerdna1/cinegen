const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Encryption for API keys
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

function decrypt(encryptedData) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function maskApiKey(key) {
  if (!key || key.length < 8) return '****';
  return '****' + key.slice(-4);
}

// GET /api/users/profile
router.get('/profile', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/profile
router.put('/profile', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { email } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { email },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/api-keys
router.get('/api-keys', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        provider: true,
        encryptedKey: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Mask the keys
    const maskedKeys = apiKeys.map(key => ({
      id: key.id,
      provider: key.provider,
      maskedKey: maskApiKey(decrypt(key.encryptedKey)),
      hasKey: true,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt
    }));

    res.json({ apiKeys: maskedKeys });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/api-keys
router.put('/api-keys', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { provider, apiKey } = req.body;

    const validProviders = ['hailuo', 'kling', 'nanobanana', '11labs'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    const encryptedKey = encrypt(apiKey);

    await prisma.apiKey.upsert({
      where: {
        userId_provider: {
          userId: req.user.id,
          provider
        }
      },
      update: { encryptedKey },
      create: {
        userId: req.user.id,
        provider,
        encryptedKey
      }
    });

    res.json({ message: 'API key saved successfully', maskedKey: maskApiKey(apiKey) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/account
router.delete('/account', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const bcrypt = require('bcryptjs');
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Delete user (cascades to related data)
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
