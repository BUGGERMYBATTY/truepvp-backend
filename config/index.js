// ==================== CONFIGURATION ====================

module.exports = {
  // Server
  PORT: parseInt(process.env.PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Solana
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  TREASURY_WALLET: process.env.TREASURY_WALLET || 'DpfnnAQb9z5qQsoR6mjNtF6P6HpTj3M17K5BfLmfvBoC',
  
  // Game Configuration
  FEE_RATE: parseFloat(process.env.FEE_RATE) || 0.015,
  MIN_BET_AMOUNT: parseFloat(process.env.MIN_BET_AMOUNT) || 0.05,
  MAX_BET_AMOUNT: parseFloat(process.env.MAX_BET_AMOUNT) || 10.0,
  BET_AMOUNTS: [0.05, 0.1, 0.25, 0.5, 1.0],
  
  // Security
  MAX_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 30,
  MAX_FAILED_VERIFICATIONS: parseInt(process.env.MAX_FAILED_VERIFICATIONS) || 5,
  BAN_DURATION_MS: parseInt(process.env.BAN_DURATION_MS) || 3600000,
  SIGNATURE_EXPIRY_MS: parseInt(process.env.SIGNATURE_EXPIRY_MS) || 300000,
  
  // Timeouts
  MATCH_TIMEOUT_MS: parseInt(process.env.MATCH_TIMEOUT_MS) || 300000,
  GAME_TIMEOUT_MS: parseInt(process.env.GAME_TIMEOUT_MS) || 600000,
  MAX_RECONNECT_TIME_MS: parseInt(process.env.MAX_RECONNECT_TIME_MS) || 60000,
  
  // Performance
  TICK_RATE: parseInt(process.env.TICK_RATE) || 60,
  BROADCAST_RATE: parseInt(process.env.BROADCAST_RATE) || 30,
  
  // Game Types
  GAME_TYPES: {
    GOLD_RUSH: 'solana-gold-rush',
    NEON_PONG: 'neon-pong',
    VIPER_PIT: 'viper-pit'
  },
  
  // Gold Rush Config
  GOLD_RUSH: {
    ROUNDS: 5,
    NUGGETS: [1, 2, 3, 4, 5],
    ROUND_TIMEOUT_MS: 30000
  },
  
  // Pong Config
  PONG: {
    PADDLE_HEIGHT: 100,
    PADDLE_WIDTH: 12,
    BALL_SIZE: 12,
    GAME_WIDTH: 600,
    GAME_HEIGHT: 400,
    INITIAL_BALL_SPEED: 3,
    BALL_SPEED_INCREASE: 1.15,
    PADDLE_SPEED: 6,
    WINNING_SCORE: 3,
    WINNING_ROUNDS: 2,
    AI_REACTION_SPEED: 0.7
  },
  
  // ViperPit Config
  VIPER: {
    ARENA_WIDTH: 350,
    ARENA_HEIGHT: 450,
    SHIP_SIZE: 20,
    SHIP_SPEED: 5,
    WINNING_ROUNDS: 3,
    WAVE_INTERVAL_MS: 1800
  },
  
  // Matchmaking
  MATCHMAKING: {
    BASE_MMR: 1000,
    MMR_CHANGE_PER_GAME: 25,
    MIN_MMR: 100,
    MAX_MMR: 3000,
    BASE_MMR_RANGE: 100,
    RANGE_EXPANSION_RATE: 50,
    RANGE_EXPANSION_INTERVAL_MS: 30000,
    MAX_WAIT_TIME_MS: 120000
  },
  
  // Admin
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'dev-api-key-change-in-production'
};
```

4. Commit message: `Add configuration file`
5. Click **"Commit changes"**

---

## 🎯 After You Finish

You should now see:
```
truepvp-backend/
├── config/
│   └── index.js  ← NEW FOLDER & FILE
├── .gitignore
├── .env.example
├── package.json
└── server.js
