require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const characterRoutes = require('./routes/characters');
const projectRoutes = require('./routes/projects');
const sceneRoutes = require('./routes/scenes');
const voiceRoutes = require('./routes/voices');
const adminRoutes = require('./routes/admin');
const exportRoutes = require('./routes/export');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Express
const app = express();
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

// Store WebSocket connections by project ID
const projectConnections = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const projectId = url.pathname.split('/').pop();

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

// Make WebSocket broadcast available to routes
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make Prisma available to routes
app.set('prisma', prisma);

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/characters', authenticateToken, characterRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/projects', authenticateToken, sceneRoutes);
app.use('/api/voices', authenticateToken, voiceRoutes);
app.use('/api/export', authenticateToken, exportRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
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

module.exports = { app, prisma };
