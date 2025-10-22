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
```

4. Commit message: `Add admin routes`
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
│   ├── admin.js        ← NEW FILE (3 of 3)
│   ├── game.js
│   └── matchmaking.js
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
