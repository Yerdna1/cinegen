require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Check if running in Vercel serverless
const isVercel = process.env.VERCEL === '1';

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const characterRoutes = require('./routes/characters');
const projectRoutes = require('./routes/projects');
const sceneRoutes = require('./routes/scenes');
const voiceRoutes = require('./routes/voices');
const adminRoutes = require('./routes/admin');
const exportRoutes = require('./routes/export');
const galleryRoutes = require('./routes/gallery');
const generationRoutes = require('./routes/generation');
const statisticsRoutes = require('./routes/statistics');

// Import Inngest
const { serve } = require('inngest/express');
const { inngest } = require('./services/inngest');
const { generateAudioFunction } = require('./functions/audio-generation');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Express
const app = express();

// Store WebSocket connections by project ID (only used in non-serverless mode)
const projectConnections = new Map();

// WebSocket setup only for non-Vercel environments
let server, wss;
if (!isVercel) {
  const http = require('http');
  const { WebSocketServer } = require('ws');

  server = http.createServer(app);
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const pathParts = url.pathname.split('/').filter(p => p);
    const projectId = pathParts[pathParts.length - 1];

    console.log('WebSocket connection for project:', projectId);

    if (projectId) {
      if (!projectConnections.has(projectId)) {
        projectConnections.set(projectId, new Set());
      }
      projectConnections.get(projectId).add(ws);

      ws.on('close', () => {
        const connections = projectConnections.get(projectId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            projectConnections.delete(projectId);
          }
        }
      });
    }
  });
}

// Make WebSocket broadcast available to routes (no-op in serverless)
app.set('broadcastProgress', (projectId, data) => {
  const connections = projectConnections.get(projectId);
  if (connections) {
    const message = JSON.stringify(data);
    connections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }
});

// Middleware
const corsOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/[\r\n]/g, '');
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Make Prisma available to routes
app.set('prisma', prisma);

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);

// Protected routes
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/characters', authenticateToken, characterRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/projects', authenticateToken, sceneRoutes);
app.use('/api/voices', authenticateToken, voiceRoutes);
app.use('/api/export', authenticateToken, exportRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/generation', authenticateToken, generationRoutes);
app.use('/api/statistics', authenticateToken, statisticsRoutes);

// Inngest endpoint for background jobs
app.use('/api/inngest', serve({
  client: inngest,
  functions: [generateAudioFunction],
}));

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'CineGen API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      gallery: '/api/gallery',
      auth: '/api/auth',
      projects: '/api/projects (auth required)',
      test: {
        piapi: '/api/test/piapi',
        generateVideo: 'POST /api/test/piapi/generate-video'
      }
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Genre configuration - available video genres
app.get('/api/genres', (req, res) => {
  const genres = [
    { id: 'action', name: 'Action' },
    { id: 'drama', name: 'Drama' },
    { id: 'comedy', name: 'Comedy' },
    { id: 'horror', name: 'Horror' },
    { id: 'sci-fi', name: 'Sci-Fi' },
    { id: 'romance', name: 'Romance' },
    { id: 'thriller', name: 'Thriller' },
    { id: 'documentary', name: 'Documentary' }
  ];
  res.json({ genres });
});

// Kling API test endpoint
app.get('/api/test/kling', async (req, res) => {
  try {
    const klingService = require('./services/kling');
    const result = await klingService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kling image generation test endpoint
app.post('/api/test/kling/generate-image', async (req, res) => {
  try {
    const klingService = require('./services/kling');
    const { prompt, aspectRatio = '16:9' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await klingService.generateImage(prompt, { aspectRatio });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kling balance check endpoint
app.get('/api/test/kling/balance', async (req, res) => {
  try {
    const klingService = require('./services/kling');
    const result = await klingService.checkBalance();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kling text-to-video test endpoint
app.post('/api/test/kling/generate-video', async (req, res) => {
  try {
    const klingService = require('./services/kling');
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await klingService.generateVideoFromText(prompt, { duration: '5', mode: 'std' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PiAPI test endpoint (uses Kling via PiAPI with membership credits)
app.get('/api/test/piapi', async (req, res) => {
  try {
    const piapiService = require('./services/piapi');
    const result = await piapiService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PiAPI image generation test endpoint
app.post('/api/test/piapi/generate-image', async (req, res) => {
  try {
    const piapiService = require('./services/piapi');
    const { prompt, aspectRatio = '16:9' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await piapiService.generateImage(prompt, { aspectRatio });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PiAPI text-to-video test endpoint
app.post('/api/test/piapi/generate-video', async (req, res) => {
  try {
    const piapiService = require('./services/piapi');
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await piapiService.generateVideoFromText(prompt, { duration: 5, mode: 'std' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PiAPI task status check
app.get('/api/test/piapi/task/:taskId', async (req, res) => {
  try {
    const piapiService = require('./services/piapi');
    const result = await piapiService.getTaskStatus(req.params.taskId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use(errorHandler);

// Only start server if not running in Vercel serverless
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`CineGen backend running on port ${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Export for Vercel serverless
module.exports = app;
module.exports.prisma = prisma;
