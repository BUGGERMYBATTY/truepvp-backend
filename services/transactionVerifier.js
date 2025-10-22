// ==================== TRANSACTION VERIFIER ====================
const { Connection, PublicKey } = require('@solana/web3.js');
const { verifiedTransactions } = require('../state/gameState');
const config = require('../config');

class SolanaTransactionVerifier {
  constructor() {
    this.connection = new Connection(config.SOLANA_RPC_URL, 'confirmed');
    this.treasuryPublicKey = new PublicKey(config.TREASURY_WALLET);
  }
  
  async verifyTransaction(signature, senderWallet, expectedAmount) {
    try {
      // Check cache
      const cached = verifiedTransactions.get(signature);
      if (cached && Date.now() - cached.timestamp < 3600000) {
        return { valid: cached.verified, amount: cached.amount };
      }
      
      // Fetch transaction
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!tx) {
        return { valid: false, reason: 'Transaction not found' };
      }
      
      if (tx.meta.err) {
        return { valid: false, reason: 'Transaction failed' };
      }
      
      // Verify sender
      const senderPubkey = tx.transaction.message.accountKeys[0].toString();
      if (senderPubkey !== senderWallet) {
        return { valid: false, reason: 'Sender mismatch' };
      }
      
      // Verify amount
      let receivedAmount = 0;
      const treasuryAddress = this.treasuryPublicKey.toString();
      
      for (let i = 0; i < tx.meta.postBalances.length; i++) {
        const account = tx.transaction.message.accountKeys[i].toString();
        if (account === treasuryAddress) {
          receivedAmount = (tx.meta.postBalances[i] - tx.meta.preBalances[i]) / 1e9;
          break;
        }
      }
      
      const tolerance = 0.00001;
      if (Math.abs(receivedAmount - expectedAmount) > tolerance) {
        return { valid: false, reason: `Amount mismatch: ${receivedAmount} vs ${expectedAmount}` };
      }
      
      // Check age
      const txAge = Date.now() - (tx.blockTime * 1000);
      if (txAge > config.SIGNATURE_EXPIRY_MS) {
        return { valid: false, reason: 'Transaction expired' };
      }
      
      // Cache
      verifiedTransactions.set(signature, {
        timestamp: Date.now(),
        verified: true,
        amount: receivedAmount
      });
      
      console.log(`[VERIFY] ✓ ${signature}`);
      return { valid: true, amount: receivedAmount };
      
    } catch (error) {
      console.error('[VERIFY] Error:', error);
      return { valid: false, reason: error.message };
    }
  }
  
  cleanup() {
    const now = Date.now();
    for (const [sig, data] of verifiedTransactions.entries()) {
      if (now - data.timestamp > 3600000) {
        verifiedTransactions.delete(sig);
      }
    }
  }
}

const txVerifier = new SolanaTransactionVerifier();
module.exports = { txVerifier };
