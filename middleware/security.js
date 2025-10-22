// ==================== SECURITY MIDDLEWARE ====================
const { bannedIPs, failedAttempts } = require('../state/gameState');
const { txVerifier } = require('../services/transactionVerifier');
const { InputValidator } = require('../utils/validation');
const config = require('../config');

// Check if IP is banned
function securityMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  
  const ban = bannedIPs.get(ip);
  if (ban) {
    if (Date.now() > ban.bannedUntil) {
      bannedIPs.delete(ip);
      failedAttempts.delete(ip);
    } else {
      return res.status(403).json({
        error: 'Access denied',
        reason: 'Too many failed attempts',
        bannedUntil: new Date(ban.bannedUntil).toISOString()
      });
    }
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
}

// Validate matchmaking requests
async function validateMatchmakingRequest(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const { gameId, betAmount, walletAddress, feeSignature, isDemoMode, nickname } = req.body;
  
  try {
    // Validate game type
    const gameValidation = InputValidator.validateGameType(gameId);
    if (!gameValidation.valid) {
      recordFailedAttempt(ip, 'Invalid game type');
      return res.status(400).json({ error: gameValidation.error });
    }
    
    // Validate wallet
    const walletValidation = InputValidator.validateWalletAddress(walletAddress);
    if (!walletValidation.valid) {
      recordFailedAttempt(ip, 'Invalid wallet');
      return res.status(400).json({ error: walletValidation.error });
    }
    
    // Validate bet amount
    const betValidation = InputValidator.validateBetAmount(betAmount);
    if (!betValidation.valid) {
      recordFailedAttempt(ip, 'Invalid bet amount');
      return res.status(400).json({ error: betValidation.error });
    }
    
    // Validate nickname
    if (nickname) {
      const nicknameValidation = InputValidator.validateNickname(nickname);
      if (!nicknameValidation.valid) {
        return res.status(400).json({ error: nicknameValidation.error });
      }
    }
    
    // Verify transaction (skip for demo)
    if (!isDemoMode && !walletValidation.isGuest) {
      if (!feeSignature) {
        recordFailedAttempt(ip, 'Missing fee signature');
        return res.status(400).json({ error: 'Fee transaction signature required' });
      }
      
      const expectedFee = betAmount * config.FEE_RATE;
      const verification = await txVerifier.verifyTransaction(
        feeSignature,
        walletAddress,
        expectedFee
      );
      
      if (!verification.valid) {
        recordFailedAttempt(ip, `Failed verification: ${verification.reason}`);
        return res.status(403).json({
          error: 'Transaction verification failed',
          reason: verification.reason
        });
      }
      
      clearFailedAttempts(ip);
    }
    
    next();
    
  } catch (error) {
    console.error('[SECURITY] Validation error:', error);
    recordFailedAttempt(ip, 'Validation error');
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper functions
function recordFailedAttempt(ip, reason) {
  const current = failedAttempts.get(ip) || 0;
  failedAttempts.set(ip, current + 1);
  
  console.log(`[SECURITY] Failed attempt from ${ip}: ${reason} (${current + 1}/${config.MAX_FAILED_VERIFICATIONS})`);
  
  if (current + 1 >= config.MAX_FAILED_VERIFICATIONS) {
    banIP(ip, reason);
  }
}

function banIP(ip, reason) {
  const bannedUntil = Date.now() + config.BAN_DURATION_MS;
  bannedIPs.set(ip, { reason, bannedUntil });
  console.log(`[BAN] ${ip} banned until ${new Date(bannedUntil).toISOString()} - ${reason}`);
}

function clearFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

// Admin authentication
function requireAdmin(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== config.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

module.exports = {
  securityMiddleware,
  validateMatchmakingRequest,
  requireAdmin,
  recordFailedAttempt,
  banIP,
  clearFailedAttempts
};
```

4. Commit message: `Add security middleware`
5. Click **"Commit changes"**

---

## 🎯 After You Finish

You should now see:
```
truepvp-backend/
├── config/
│   └── index.js
├── middleware/
│   └── security.js  ← NEW FILE (1 of 2)
├── state/
│   └── gameState.js
├── .gitignore
├── .env.example
├── package.json
└── server.js
