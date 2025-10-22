// ==================== MATCHMAKING SERVICE ====================
const { v4: uuidv4 } = require('uuid');
const { playerPool, playerMMR } = require('../state/gameState');
const config = require('../config');

class MatchmakingQueue {
  constructor() {
    this.queues = new Map();
  }
  
  joinQueue(gameType, betAmount, playerData) {
    const { walletAddress, nickname, mmr = config.MATCHMAKING.BASE_MMR } = playerData;
    const queueKey = `${gameType}-${betAmount}`;
    
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
    }
    
    const queue = this.queues.get(queueKey);
    const joinTime = Date.now();
    
    playerMMR.set(walletAddress, mmr);
    
    queue.push({
      walletAddress,
      nickname,
      mmr,
      joinTime,
      expandedRange: 0
    });
    
    console.log(`[MM] ${walletAddress} joined ${queueKey} (MMR: ${mmr})`);
    return this.attemptMatch(queueKey);
  }
  
  attemptMatch(queueKey) {
    const queue = this.queues.get(queueKey);
    if (!queue || queue.length < 2) return null;
    
    queue.sort((a, b) => a.joinTime - b.joinTime);
    
    const now = Date.now();
    
    for (let i = 0; i < queue.length; i++) {
      const player1 = queue[i];
      const waitTime = now - player1.joinTime;
      
      const mmrRange = config.MATCHMAKING.BASE_MMR_RANGE + 
        Math.floor(waitTime / config.MATCHMAKING.RANGE_EXPANSION_INTERVAL_MS) * 
        config.MATCHMAKING.RANGE_EXPANSION_RATE;
      
      player1.expandedRange = mmrRange;
      
      for (let j = i + 1; j < queue.length; j++) {
        const player2 = queue[j];
        const mmrDiff = Math.abs(player1.mmr - player2.mmr);
        
        if (mmrDiff <= Math.max(player1.expandedRange, player2.expandedRange) ||
            waitTime > config.MATCHMAKING.MAX_WAIT_TIME_MS) {
          
          const gameInstanceId = uuidv4();
          queue.splice(j, 1);
          queue.splice(i, 1);
          
          console.log(`[MM] Match: ${player1.walletAddress} vs ${player2.walletAddress}`);
          
          return {
            gameInstanceId,
            player1: {
              walletAddress: player1.walletAddress,
              nickname: player1.nickname,
              mmr: player1.mmr
            },
            player2: {
              walletAddress: player2.walletAddress,
              nickname: player2.nickname,
              mmr: player2.mmr
            },
            matchQuality: 1 - (mmrDiff / Math.max(player1.expandedRange, 100))
          };
        }
      }
    }
    
    return null;
  }
  
  cancelSearch(walletAddress) {
    for (const [queueKey, queue] of this.queues.entries()) {
      const index = queue.findIndex(p => p.walletAddress === walletAddress);
      if (index !== -1) {
        queue.splice(index, 1);
        console.log(`[MM] ${walletAddress} cancelled`);
        return true;
      }
    }
    return false;
  }
  
  getQueueStatus(walletAddress) {
    for (const [queueKey, queue] of this.queues.entries()) {
      const index = queue.findIndex(p => p.walletAddress === walletAddress);
      if (index !== -1) {
        const player = queue[index];
        return {
          position: index + 1,
          totalInQueue: queue.length,
          waitTime: Date.now() - player.joinTime,
          mmr: player.mmr,
          expandedRange: player.expandedRange
        };
      }
    }
    return null;
  }
}

const matchmaking = new MatchmakingQueue();
module.exports = { matchmaking };
```

4. Commit message: `Add matchmaking service`
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
├── services/
│   ├── matchmaking.js          ← NEW FILE (2 of 2)
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
