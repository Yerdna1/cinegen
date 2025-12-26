const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { generateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// POST /api/auth/register
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prisma = req.app.get('prisma');
    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });

    // Create verification token
    const verificationToken = uuidv4();
    await prisma.verificationToken.create({
      data: {
        token: verificationToken,
        email: user.email,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    // TODO: Send verification email

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prisma = req.app.get('prisma');
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // JWT is stateless, client should discard the token
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { token } = req.body;

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken || verificationToken.type !== 'EMAIL_VERIFICATION') {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (verificationToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification token expired' });
    }

    // Update user
    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: true }
    });

    // Delete token
    await prisma.verificationToken.delete({ where: { token } });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { email } = req.body;

    // Always return same message to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = uuidv4();
      await prisma.verificationToken.create({
        data: {
          token: resetToken,
          email: user.email,
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        }
      });

      // TODO: Send password reset email
    }

    res.json({ message: 'If an account exists, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { token, password } = req.body;

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!resetToken || resetToken.type !== 'PASSWORD_RESET') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Reset token expired' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash }
    });

    await prisma.verificationToken.delete({ where: { token } });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticateToken, async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
