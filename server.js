// --- TRUEPVP.io Matchmaking Server ---
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// --- FINAL, ROBUST FIX: Dynamic CORS Configuration ---
const allowedOrigins = ['https://truepvp-frontend.onrender.com'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Request from origin ' + origin + ' not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());

// In-memory player pool.
const playerPool = new Map();
const matchedPlayers = new Map();

app.post('/api/matchmaking/join', (req, res) => {
    const { gameId, betAmount, walletAddress } = req.body;
    if (!gameId || !betAmount || !walletAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const matchKey = `${gameId}-${betAmount}`;
    const waitingPlayer = playerPool.get(matchKey);
    if (waitingPlayer && waitingPlayer.walletAddress !== walletAddress) {
        console.log(`[MATCH] ${walletAddress} vs ${waitingPlayer.walletAddress} for ${matchKey}`);
        matchedPlayers.set(walletAddress, waitingPlayer.walletAddress);
        matchedPlayers.set(waitingPlayer.walletAddress, walletAddress);
        playerPool.delete(matchKey);
        res.json({ matched: true, opponent: waitingPlayer.walletAddress });
    } else {
        console.log(`[QUEUE] ${walletAddress} is waiting for a match for ${matchKey}`);
        playerPool.set(matchKey, { walletAddress, timestamp: Date.now() });
        res.json({ matched: false });
    }
});

app.get('/api/matchmaking/status/:matchKey/:walletAddress', (req, res) => {
    const { walletAddress } = req.params;
    if (matchedPlayers.has(walletAddress)) {
        matchedPlayers.delete(walletAddress);
        res.json({ status: 'matched' });
    } else {
        res.json({ status: 'waiting' });
    }
});

app.post('/api/matchmaking/cancel', (req, res) => {
    const { gameId, betAmount, walletAddress } = req.body;
    const matchKey = `${gameId}-${betAmount}`;
    const waitingPlayer = playerPool.get(matchKey);
    if (waitingPlayer && waitingPlayer.walletAddress === walletAddress) {
        playerPool.delete(matchKey);
        console.log(`[CANCEL] ${walletAddress} removed from pool for ${matchKey}`);
        res.status(200).json({ message: 'Search cancelled' });
    } else {
        res.status(200).json({ message: 'Player not found in queue' });
    }
});

app.listen(PORT, () => {
    console.log(`Matchmaking server listening on http://localhost:${PORT}`);
});
