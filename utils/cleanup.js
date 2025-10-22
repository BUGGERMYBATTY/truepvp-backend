// ==================== CLEANUP ROUTINES ====================
const { playerPool, matchedPairs, activeGames, disconnectedPlayers } = require('../state/gameState');
const { txVerifier } = require('../services/transactionVerifier');
const config = require('../config');

function startCleanupRoutines() {
  setInterval(() => {
    const now = Date.now();
    
    // Clean player pool
    for (const [key, player] of playerPool.entries()) {
      if (now - player.timestamp > config.MATCH_TIMEOUT_MS) {
        playerPool.delete(key);
        console.log(`[CLEANUP] Removed expired player from pool: ${player.walletAddress}`);
      }
    }
    
    // Clean matched pairs
    for (const [wallet, match] of matchedPairs.entries()) {
      if (now - match.timestamp > config.MATCH_TIMEOUT_MS) {
        matchedPairs.delete(wallet);
      }
    }
    
    // Clean inactive games
    for (const [gameId, game] of activeGames.entries()) {
      if (game.lastActivity && now - game.lastActivity > config.GAME_TIMEOUT_MS) {
        if (game.stop) game.stop();
        activeGames.delete(gameId);
        console.log(`[CLEANUP] Removed inactive game: ${gameId}`);
      }
    }
    
    // Handle disconnects
    for (const [gameId, data] of disconnectedPlayers.entries()) {
      if (now - data.disconnectTime > config.MAX_RECONNECT_TIME_MS) {
        const game = activeGames.get(gameId);
        if (game && !game.gameOver) {
          game.gameOver = true;
          console.log(`[FORFEIT] ${data.walletAddress} timed out in game ${gameId}`);
        }
        disconnectedPlayers.delete(gameId);
      }
    }
    
    // Clean transaction cache
    txVerifier.cleanup();
    
  }, 30000); // Run every 30 seconds
}

module.exports = { startCleanupRoutines };
```

4. Commit message: `Add cleanup utilities`
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
├── state/
│   └── gameState.js
├── utils/
│   ├── cleanup.js     ← NEW FILE (2 of 2)
│   └── validation.js
├── .gitignore
├── .env.example
├── package.json
└── server.js
