// ==================== RATE LIMIT MIDDLEWARE ====================
const { rateLimits } = require('../state/gameState');
const config = require('../config');

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const limit = rateLimits.get(ip);
  
  if (now > limit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (limit.count >= config.MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: Math.ceil((limit.resetTime - now) / 1000)
    });
  }
  
  limit.count++;
  next();
}

module.exports = { rateLimitMiddleware };
```

4. Commit message: `Add rate limit middleware`
5. Click **"Commit changes"**

---

## 🎯 After You Finish

You should now see:
```
truepvp-backend/
├── config/
│   └── index.js
├── middleware/
│   ├── rateLimit.js  ← NEW FILE (2 of 2)
│   └── security.js
├── state/
│   └── gameState.js
├── .gitignore
├── .env.example
├── package.json
└── server.js
