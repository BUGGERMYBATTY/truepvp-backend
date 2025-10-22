// ==================== WEBSOCKET HANDLER ====================
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const { activeGames, playerSessions, disconnectedPlayers } = require('../state/gameState');
const GoldRushGame = require('../games/GoldRushGame');
const config = require('../config');

function setupWebSocketServer(wss) {
  wss.on('connection', (ws) => {
    const sessionId = uuidv4();
    console.log(`[WS] New connection: ${sessionId}`);
    
    let gameId;
    let playerWallet;
    let gameType;
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        // JOIN GAME
        if (data.type === 'join_game') {
          gameId = data.gameId;
          playerWallet = data.walletAddress;
          gameType = data.gameType || config.GAME_TYPES.GOLD_RUSH;
          const nickname = data.nickname || 'Player';
          
          playerSessions.set(playerWallet, {
            ws,
            sessionId,
            gameId,
            lastActivity: Date.now()
          });
          
          // Check for reconnection
          if (disconnectedPlayers.has(gameId)) {
            const disconnectData = disconnectedPlayers.get(gameId);
            if (disconnectData.walletAddress === playerWallet) {
              console.log(`[RECONNECT] ${playerWallet} rejoined ${gameId}`);
              disconnectedPlayers.delete(gameId);
              
              const game = activeGames.get(gameId);
              if (game) {
                game.setPlayerWs(playerWallet, ws);
                broadcastGameState(gameId);
              }
              return;
            }
          }
          
          if (!activeGames.has(gameId)) {
            // Create new game
            console.log(`[GAME] Creating ${gameType}: ${gameId}`);
            const game = new GoldRushGame(gameId, playerWallet, null, nickname, '');
            game.setPlayerWs(playerWallet, ws);
            activeGames.set(gameId, game);
          } else {
            // Join existing game
            const game = activeGames.get(gameId);
            game.players[1] = {
              walletAddress: playerWallet,
              nickname,
              score: 0,
              nuggets: [...config.GOLD_RUSH.NUGGETS],
              choice: null,
              ws
            };
            console.log(`[GAME] ${playerWallet} joined ${gameId}`);
            game.startRound();
            broadcastGameState(gameId);
          }
        }
        
        // PLAY CHOICE (Gold Rush)
        if (data.type === 'play_choice') {
          const game = activeGames.get(gameId);
          if (game && game instanceof GoldRushGame) {
            const success = game.makeChoice(playerWallet, data.choice);
            if (success) {
              broadcastGameState(gameId);
            }
          }
        }
        
        // HEARTBEAT
        if (data.type === 'heartbeat') {
          if (playerSessions.has(playerWallet)) {
            playerSessions.get(playerWallet).lastActivity = Date.now();
          }
          ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
        }
        
      } catch (error) {
        console.error('[WS] Message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log(`[WS] Disconnect: ${sessionId}`);
      
      if (gameId && activeGames.has(gameId)) {
        const game = activeGames.get(gameId);
        if (!game.gameOver) {
          disconnectedPlayers.set(gameId, {
            walletAddress: playerWallet,
            disconnectTime: Date.now()
          });
          console.log(`[DISCONNECT] ${playerWallet} has ${config.MAX_RECONNECT_TIME_MS/1000}s to reconnect`);
        }
      }
      
      if (playerSessions.has(playerWallet)) {
        playerSessions.delete(playerWallet);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`[WS] Error ${sessionId}:`, error);
    });
  });
  
  console.log('[WS] WebSocket server initialized');
}

function broadcastGameState(gameId) {
  const game = activeGames.get(gameId);
  if (!game) return;
  
  game.players.forEach(player => {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      const state = game.getStateFor(player.walletAddress);
      player.ws.send(JSON.stringify(state));
    }
  });
  
  if (game.gameOver) {
    const { gameResults } = require('../state/gameState');
    gameResults.set(gameId, {
      gameId,
      gameType: game.gameType,
      winnerWallet: game.winnerWallet,
      timestamp: Date.now()
    });
    
    setTimeout(() => {
      activeGames.delete(gameId);
      console.log(`[GAME] ${gameId} cleaned up`);
    }, 10000);
  }
}

module.exports = { setupWebSocketServer, broadcastGameState };
