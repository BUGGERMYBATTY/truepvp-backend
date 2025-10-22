// ==================== TRUEPVP.IO SERVER - MAIN ENTRY ====================
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');

// Import modules
const { securityMiddleware, validateMatchmakingRequest } = require('./middleware/security');
const { rateLimitMiddleware } = require('./middleware/rateLimit');
const matchmakingRoutes = require('./routes/matchmaking');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');
const { setupWebSocketServer } = require('./websocket/handler');
const { startCleanupRoutines } = require('./utils/cleanup');
const config = require('./config');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Setup WebSocket
const wss = new WebSocket.Server({ server });
setupWebSocketServer(wss);

// ==================== MIDDLEWARE ====================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://truepvp-frontend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
app.use(rateLimitMiddleware);

// Security middleware
app.use(securityMiddleware);

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ==================== ROUTES ====================

app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const { activeGames, playerPool, playerSessions } = require('./state/gameState');
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    stats: {
      activeGames: activeGames.size,
      waitingPlayers: playerPool.size,
      activeSessions: playerSessions.size
    },
    version: '2.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TruePVP.io API',
    version: '2.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      matchmaking: '/api/matchmaking/*',
      game: '/api/game/*',
      admin: '/api/admin/*'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== STARTUP ====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 TruePVP.io Server Started');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Tick Rate: ${config.TICK_RATE} FPS`);
  console.log(`📊 Broadcast Rate: ${config.BROADCAST_RATE} FPS`);
  console.log(`💰 Treasury: ${config.TREASURY_WALLET}`);
  console.log(`🔒 Fee Rate: ${config.FEE_RATE * 100}%`);
  console.log('═══════════════════════════════════════════════════════');
  
  // Start cleanup routines
  startCleanupRoutines();
  
  console.log('✅ Cleanup routines started');
  console.log('✅ WebSocket server ready');
  console.log('✅ All systems operational');
  console.log('═══════════════════════════════════════════════════════\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wss };
