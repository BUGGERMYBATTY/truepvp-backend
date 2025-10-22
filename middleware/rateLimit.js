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
