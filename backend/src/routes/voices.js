const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Decryption helper
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const ALGORITHM = 'aes-256-gcm';

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

// GET /api/voices
router.get('/', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');

    // Get user's 11Labs API key
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        userId: req.user.id,
        provider: '11labs'
      }
    });

    if (!apiKey) {
      return res.status(400).json({ error: '11Labs API key not configured' });
    }

    const decryptedKey = decrypt(apiKey.encryptedKey);

    // Fetch voices from 11Labs API
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': decryptedKey
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return res.status(400).json({ error: 'Invalid 11Labs API key' });
        }
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();

      const voices = data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        previewUrl: voice.preview_url,
        labels: voice.labels
      }));

      res.json({ voices });
    } catch (fetchError) {
      console.error('11Labs API error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch voices from 11Labs' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
