// ==================== GAME ROUTES ====================
const express = require('express');
const router = express.Router();
const { gameResults } = require('../state/gameState');

router.get('/result/:gameId', (req, res) => {
  const { gameId } = req.params;
  const result = gameResults.get(gameId);
  
  if (!result) {
    return res.status(404).json({ error: 'Game result not found' });
  }
  
  res.json(result);
});

module.exports = router;
