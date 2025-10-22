// ==================== ADMIN ROUTES ====================
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/security');
const { activeGames, playerPool, playerSessions, statistics } = require('../state/gameState');

router.get('/stats', requireAdmin, (req, res) => {
  const stats = {
    ...statistics,
    activeGames: activeGames.size,
    waitingPlayers: playerPool.size,
    activeSessions: playerSessions.size,
    uptime: process.uptime()
  };
  
  res.json(stats);
});

module.exports = router;
