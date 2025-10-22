// ==================== GAME STATE MANAGEMENT ====================

// Main data stores
const playerPool = new Map(); // matchKey -> { walletAddress, nickname, timestamp, feeSignature, mmr }
const matchedPairs = new Map(); // walletAddress -> { opponent, gameId, gameType, timestamp, betAmount }
const activeGames = new Map(); // gameId -> Game instance
const playerSessions = new Map(); // walletAddress -> { ws, sessionId, gameId, lastActivity }
const disconnectedPlayers = new Map(); // gameId -> { walletAddress, disconnectTime }
const gameResults = new Map(); // gameId -> { winner, loser, gameType, timestamp, signature }

// Rate limiting
const rateLimits = new Map(); // ip -> { count, resetTime }

// Ban management
const bannedIPs = new Map(); // ip -> { reason, bannedUntil }
const failedAttempts = new Map(); // ip -> count

// Anti-cheat
const playerActions = new Map(); // walletAddress -> actions[]
const suspiciousPlayers = new Set(); // walletAddress

// Transaction cache
const verifiedTransactions = new Map(); // signature -> { timestamp, verified, amount }

// Player MMR (in production, this would be in database)
const playerMMR = new Map(); // walletAddress -> mmr

// Statistics
const statistics = {
  totalGamesPlayed: 0,
  totalMatchesMade: 0,
  gamesInProgress: 0,
  playersOnline: 0,
  startTime: Date.now()
};

module.exports = {
  // Main stores
  playerPool,
  matchedPairs,
  activeGames,
  playerSessions,
  disconnectedPlayers,
  gameResults,
  
  // Security
  rateLimits,
  bannedIPs,
  failedAttempts,
  
  // Anti-cheat
  playerActions,
  suspiciousPlayers,
  
  // Caching
  verifiedTransactions,
  playerMMR,
  
  // Stats
  statistics
};
