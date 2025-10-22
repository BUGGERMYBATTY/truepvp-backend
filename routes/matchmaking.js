// ==================== MATCHMAKING ROUTES ====================
const express = require('express');
const router = express.Router();
const { validateMatchmakingRequest } = require('../middleware/security');
const { matchmaking } = require('../services/matchmaking');
const { matchedPairs } = require('../state/gameState');

router.post('/join', validateMatchmakingRequest, async (req, res) => {
  const { gameId, betAmount, walletAddress, nickname } = req.body;
  
  const match = matchmaking.joinQueue(gameId, betAmount, {
    walletAddress,
    nickname: nickname || 'Player'
  });
  
  if (match) {
    matchedPairs.set(match.player1.walletAddress, {
      opponent: match.player2.walletAddress,
      gameId: match.gameInstanceId,
      gameType: gameId,
      timestamp: Date.now(),
      betAmount
    });
    
    matchedPairs.set(match.player2.walletAddress, {
      opponent: match.player1.walletAddress,
      gameId: match.gameInstanceId,
      gameType: gameId,
      timestamp: Date.now(),
      betAmount
    });
    
    return res.json({ 
      matched: true, 
      gameId: match.gameInstanceId,
      matchQuality: match.matchQuality
    });
  }
  
  const queueStatus = matchmaking.getQueueStatus(walletAddress);
  res.json({ matched: false, gameId: null, queueStatus });
});

router.get('/status/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  if (matchedPairs.has(walletAddress)) {
    const matchInfo = matchedPairs.get(walletAddress);
    return res.json({ status: 'matched', gameId: matchInfo.gameId });
  }
  
  const queueStatus = matchmaking.getQueueStatus(walletAddress);
  if (queueStatus) {
    return res.json({ status: 'waiting', ...queueStatus });
  }
  
  res.json({ status: 'not_in_queue' });
});

router.post('/cancel', (req, res) => {
  const { walletAddress } = req.body;
  matchmaking.cancelSearch(walletAddress);
  res.json({ message: 'Search cancelled' });
});

module.exports = router;
```

4. Commit message: `Add matchmaking routes`
5. Click **"Commit changes"**

---

## 🎯 After You Finish

You should now see:
```
truepvp-backend/
├── config/
│   └── index.js
├── middleware/
│   ├── rateLimit.js
│   └── security.js
├── routes/
│   └── matchmaking.js  ← NEW FILE (1 of 3)
├── services/
│   ├── matchmaking.js
│   └── transactionVerifier.js
├── state/
│   └── gameState.js
├── utils/
│   ├── cleanup.js
│   └── validation.js
├── .gitignore
├── .env.example
├── package.json
└── server.js
