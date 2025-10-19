// --- TRUEPVP.io Matchmaking & Game Server ---
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

// --- HTTP Server Setup (Matchmaking) ---
const allowedOrigins = ['https://truepvp-frontend.onrender.com', 'http://localhost:3000'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
app.use(express.json());

const playerPool = new Map();
const matchedPairs = new Map();

app.post('/api/matchmaking/join', (req, res) => {
    const { gameId, betAmount, walletAddress } = req.body;
    if (!gameId || !betAmount || !walletAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const matchKey = `${gameId}-${betAmount}`;
    const waitingPlayer = playerPool.get(matchKey);

    if (waitingPlayer && waitingPlayer.walletAddress !== walletAddress) {
        const gameInstanceId = uuidv4();
        console.log(`[MATCH] ${walletAddress} vs ${waitingPlayer.walletAddress} in game ${gameInstanceId}`);
        matchedPairs.set(walletAddress, { opponent: waitingPlayer.walletAddress, gameId: gameInstanceId });
        matchedPairs.set(waitingPlayer.walletAddress, { opponent: walletAddress, gameId: gameInstanceId });
        playerPool.delete(matchKey);
        res.json({ matched: true, gameId: gameInstanceId });
    } else {
        console.log(`[QUEUE] ${walletAddress} is waiting for a match for ${matchKey}`);
        playerPool.set(matchKey, { walletAddress });
        res.json({ matched: false, gameId: null });
    }
});

app.get('/api/matchmaking/status/:walletAddress', (req, res) => {
    const { walletAddress } = req.params;
    if (matchedPairs.has(walletAddress)) {
        const matchInfo = matchedPairs.get(walletAddress);
        matchedPairs.delete(walletAddress); // Clean up after confirming
        console.log(`[STATUS] Player ${walletAddress} confirmed match for game ${matchInfo.gameId}`);
        res.json({ status: 'matched', gameId: matchInfo.gameId });
    } else {
        res.json({ status: 'waiting' });
    }
});

app.post('/api/matchmaking/cancel', (req, res) => {
    const { walletAddress } = req.body;
    for (const [key, player] of playerPool.entries()) {
        if (player.walletAddress === walletAddress) {
            playerPool.delete(key);
            console.log(`[CANCEL] ${walletAddress} removed from pool.`);
            break;
        }
    }
    res.status(200).json({ message: 'Search cancelled' });
});


// --- WebSocket Server Setup (Live Gameplay) ---
const activeGames = new Map();

wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    let gameId;
    let playerWallet;

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'join_game') {
            gameId = data.gameId;
            playerWallet = data.walletAddress;

            if (!activeGames.has(gameId)) {
                const shuffledNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => 0.5 - Math.random());
                const gameState = {
                    gameId: gameId,
                    players: [{ walletAddress: playerWallet, score: 0, nuggets: [1, 2, 3, 4, 5], choice: null, ws: ws }],
                    round: 0,
                    availableRoundNumbers: shuffledNumbers.slice(0, 5),
                    roundNumber: null,
                    roundMessage: 'Waiting for opponent...',
                    isPlayer1Turn: true,
                    gameOver: false,
                };
                activeGames.set(gameId, gameState);
                console.log(`[GAME] Game ${gameId} created by ${playerWallet}`);
            } else {
                const gameState = activeGames.get(gameId);
                if (gameState.players.length < 2) {
                    gameState.players.push({ walletAddress: playerWallet, score: 0, nuggets: [1, 2, 3, 4, 5], choice: null, ws: ws });
                    console.log(`[GAME] Player ${playerWallet} joined game ${gameId}`);
                    startRound(gameId);
                }
            }
        }

        if (data.type === 'play_choice') {
            const gameState = activeGames.get(gameId);
            if (!gameState) return;
            
            const playerIndex = gameState.players.findIndex(p => p.walletAddress === playerWallet);
            if (playerIndex !== -1 && gameState.players[playerIndex].choice === null) {
                gameState.players[playerIndex].choice = data.choice;
                gameState.players[playerIndex].nuggets = gameState.players[playerIndex].nuggets.filter(n => n !== data.choice);
                console.log(`[GAME] Player ${playerWallet} chose ${data.choice} in game ${gameId}`);

                if (gameState.players.every(p => p.choice !== null)) {
                    processRound(gameId);
                } else {
                     gameState.roundMessage = "Opponent is thinking...";
                     broadcastGameState(gameId);
                }
            }
        }
    });

    ws.on('close', () => {
        console.log(`[WS] Client ${playerWallet} disconnected`);
        if (gameId && activeGames.has(gameId)) {
             activeGames.delete(gameId);
             console.log(`[GAME] Game ${gameId} terminated due to disconnect.`);
        }
    });
});

function broadcastGameState(gameId) {
    const gameState = activeGames.get(gameId);
    if (!gameState) return;

    gameState.players.forEach(player => {
        if (player.ws.readyState === WebSocket.OPEN) {
            const opponent = gameState.players.find(p => p.walletAddress !== player.walletAddress);
            const stateForPlayer = {
                gameId: gameState.gameId,
                round: gameState.round,
                roundNumber: gameState.roundNumber,
                roundMessage: gameState.roundMessage,
                gameOver: gameState.gameOver,
                you: {
                    walletAddress: player.walletAddress,
                    score: player.score,
                    nuggets: player.nuggets,
                    choice: player.choice,
                },
                opponent: opponent ? {
                    walletAddress: opponent.walletAddress,
                    score: opponent.score,
                    nuggets: opponent.nuggets,
                    choice: opponent.choice,
                } : null,
            };
            player.ws.send(JSON.stringify(stateForPlayer));
        }
    });
}

function startRound(gameId) {
    const gameState = activeGames.get(gameId);
    gameState.round++;
    gameState.roundNumber = gameState.availableRoundNumbers[gameState.round - 1];
    gameState.players.forEach(p => p.choice = null);
    gameState.roundMessage = `Round ${gameState.round} - Choose Your Data Chip!`;
    console.log(`[GAME] Starting round ${gameState.round} for game ${gameId}`);
    broadcastGameState(gameId);
}

function processRound(gameId) {
    const gameState = activeGames.get(gameId);
    if (!gameState) return;
    const [p1, p2] = gameState.players;
    const roundValue = gameState.roundNumber;

    let roundWinner = null;
    if (p1.choice > p2.choice) roundWinner = p1;
    if (p2.choice > p1.choice) roundWinner = p2;

    if (roundWinner) {
        const points = roundValue + p1.choice + p2.choice;
        roundWinner.score += points;
        const winnerName = nicknameFor(roundWinner.walletAddress);
        gameState.roundMessage = `${winnerName} wins ${points} points!`;
    } else {
        gameState.roundMessage = "It's a draw!";
    }

    broadcastGameState(gameId);

    setTimeout(() => {
        if (gameState.round >= 5) {
            let winner = null;
            if (p1.score > p2.score) winner = p1;
            if (p2.score > p1.score) winner = p2;
            const winnerName = winner ? nicknameFor(winner.walletAddress) : null;
            gameState.roundMessage = winnerName ? `Game Over! Winner is ${winnerName}` : 'Game Over! It is a draw!';
            gameState.gameOver = true;
            broadcastGameState(gameId);
            setTimeout(() => activeGames.delete(gameId), 1000);
        } else {
            startRound(gameId);
        }
    }, 3000);
}

function nicknameFor(address) {
    // This is a placeholder. In a real app, you'd look up the nickname.
    if (address.startsWith('GUEST_')) return 'Guest';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
}

server.listen(PORT, () => {
    console.log(`Server is live on http://localhost:${PORT}`);
});
