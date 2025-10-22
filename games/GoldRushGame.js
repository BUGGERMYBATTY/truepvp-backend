// ==================== GOLD RUSH GAME ====================
const config = require('../config');

class GoldRushGame {
  constructor(gameId, player1Wallet, player2Wallet, player1Nickname, player2Nickname) {
    this.gameId = gameId;
    this.gameType = config.GAME_TYPES.GOLD_RUSH;
    this.players = [
      {
        walletAddress: player1Wallet,
        nickname: player1Nickname || 'Player 1',
        score: 0,
        nuggets: [...config.GOLD_RUSH.NUGGETS],
        choice: null,
        ws: null
      },
      {
        walletAddress: player2Wallet,
        nickname: player2Nickname || 'Player 2',
        score: 0,
        nuggets: [...config.GOLD_RUSH.NUGGETS],
        choice: null,
        ws: null
      }
    ];
    this.round = 0;
    this.availableRoundNumbers = [...config.GOLD_RUSH.NUGGETS].sort(() => 0.5 - Math.random());
    this.roundNumber = null;
    this.roundMessage = 'Waiting for opponent...';
    this.gameOver = false;
    this.winnerWallet = null;
    this.lastActivity = Date.now();
    this.roundTimer = null;
  }

  startRound() {
    this.round++;
    this.roundNumber = this.availableRoundNumbers[this.round - 1];
    this.players.forEach(p => p.choice = null);
    this.roundMessage = `Round ${this.round} - Choose Your Data Chip!`;
    this.lastActivity = Date.now();
    
    if (this.roundTimer) clearTimeout(this.roundTimer);
    this.roundTimer = setTimeout(() => {
      this.handleRoundTimeout();
    }, config.GOLD_RUSH.ROUND_TIMEOUT_MS);
  }

  handleRoundTimeout() {
    this.players.forEach(p => {
      if (p.choice === null && p.nuggets.length > 0) {
        p.choice = p.nuggets[0];
        p.nuggets.shift();
      }
    });
    return this.processRound();
  }

  makeChoice(walletAddress, choice) {
    const player = this.players.find(p => p.walletAddress === walletAddress);
    if (!player || player.choice !== null || this.gameOver) return false;
    if (!player.nuggets.includes(choice)) return false;
    
    player.choice = choice;
    player.nuggets = player.nuggets.filter(n => n !== choice);
    this.lastActivity = Date.now();
    
    if (this.players.every(p => p.choice !== null)) {
      if (this.roundTimer) clearTimeout(this.roundTimer);
      return this.processRound();
    }
    
    return true;
  }

  processRound() {
    const [p1, p2] = this.players;
    const roundValue = this.roundNumber;
    
    let roundWinner = null;
    if (p1.choice > p2.choice) roundWinner = p1;
    if (p2.choice > p1.choice) roundWinner = p2;
    
    if (roundWinner) {
      const points = roundValue + p1.choice + p2.choice;
      roundWinner.score += points;
      this.roundMessage = `${roundWinner.nickname} wins ${points} points!`;
    } else {
      this.roundMessage = "It's a draw!";
    }
    
    if (this.round >= config.GOLD_RUSH.ROUNDS) {
      setTimeout(() => this.endGame(), 2000);
    } else {
      setTimeout(() => this.startRound(), 3000);
    }
    
    return true;
  }

  endGame() {
    const [p1, p2] = this.players;
    let winner = null;
    if (p1.score > p2.score) winner = p1;
    if (p2.score > p1.score) winner = p2;
    
    this.roundMessage = winner 
      ? `Game Over! Winner is ${winner.nickname}` 
      : 'Game Over! Draw!';
    this.gameOver = true;
    this.winnerWallet = winner ? winner.walletAddress : null;
    
    if (this.roundTimer) clearTimeout(this.roundTimer);
  }

  getStateFor(walletAddress) {
    const player = this.players.find(p => p.walletAddress === walletAddress);
    const opponent = this.players.find(p => p.walletAddress !== walletAddress);
    const bothChose = this.players.every(p => p.choice !== null);
    
    return {
      gameId: this.gameId,
      round: this.round,
      roundNumber: this.roundNumber,
      roundMessage: this.roundMessage,
      gameOver: this.gameOver,
      you: {
        walletAddress: player.walletAddress,
        nickname: player.nickname,
        score: player.score,
        nuggets: player.nuggets,
        choice: player.choice
      },
      opponent: opponent ? {
        walletAddress: opponent.walletAddress,
        nickname: opponent.nickname,
        score: opponent.score,
        nuggets: opponent.nuggets,
        choice: bothChose ? opponent.choice : null
      } : null
    };
  }

  setPlayerWs(walletAddress, ws) {
    const player = this.players.find(p => p.walletAddress === walletAddress);
    if (player) player.ws = ws;
  }

  stop() {
    if (this.roundTimer) clearTimeout(this.roundTimer);
  }
}

module.exports = GoldRushGame;
