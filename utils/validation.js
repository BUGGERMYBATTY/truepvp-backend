// ==================== INPUT VALIDATION ====================
const bs58 = require('bs58');
const config = require('../config');

class InputValidator {
  static validateWalletAddress(address) {
    if (!address || typeof address !== 'string') {
      return { valid: false, error: 'Invalid wallet address format' };
    }
    
    if (address.startsWith('GUEST_')) {
      return { valid: true, isGuest: true };
    }
    
    if (address.length < 32 || address.length > 44) {
      return { valid: false, error: 'Invalid wallet address length' };
    }
    
    try {
      bs58.decode(address);
      return { valid: true, isGuest: false };
    } catch (error) {
      return { valid: false, error: 'Invalid base58 encoding' };
    }
  }
  
  static validateBetAmount(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return { valid: false, error: 'Bet amount must be a number' };
    }
    
    if (amount < config.MIN_BET_AMOUNT) {
      return { valid: false, error: `Minimum bet is ${config.MIN_BET_AMOUNT} SOL` };
    }
    
    if (amount > config.MAX_BET_AMOUNT) {
      return { valid: false, error: `Maximum bet is ${config.MAX_BET_AMOUNT} SOL` };
    }
    
    const tolerance = 0.00001;
    const isAllowed = config.BET_AMOUNTS.some(allowed => 
      Math.abs(amount - allowed) < tolerance
    );
    
    if (!isAllowed) {
      return { valid: false, error: 'Invalid bet amount' };
    }
    
    return { valid: true };
  }
  
  static validateGameType(gameType) {
    const allowed = Object.values(config.GAME_TYPES);
    if (!allowed.includes(gameType)) {
      return { valid: false, error: 'Invalid game type' };
    }
    return { valid: true };
  }
  
  static validateNickname(nickname) {
    if (!nickname || typeof nickname !== 'string') {
      return { valid: false, error: 'Nickname must be a string' };
    }
    
    if (nickname.length < 1 || nickname.length > 16) {
      return { valid: false, error: 'Nickname must be 1-16 characters' };
    }
    
    const bannedWords = ['admin', 'moderator', 'system', 'bot'];
    if (bannedWords.some(word => nickname.toLowerCase().includes(word))) {
      return { valid: false, error: 'Nickname contains restricted words' };
    }
    
    return { valid: true };
  }
  
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim().substring(0, 100);
  }
}

module.exports = { InputValidator };
```

4. Commit message: `Add input validation utilities`
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
│   └── validation.js  ← NEW FILE (1 of 2)
├── .gitignore
├── .env.example
├── package.json
└── server.js
