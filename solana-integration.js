// solana-integration.js
// This file handles the Solana blockchain integration for the game

class SolanaGameIntegration {
  constructor() {
    this.connection = null;
    this.wallet = null;
    this.programId = null; // Your deployed Solana program ID
    this.initialized = false;
  }

  async initialize(programId) {
    try {
      // Check if Solana is available in window (Phantom, Solflare, etc.)
      const { solana } = window;
      
      if (!solana) {
        throw new Error('Solana wallet not found! Please install a Solana wallet extension.');
      }
      
      // Connect to wallet
      await solana.connect();
      this.wallet = solana;
      
      // Connect to Solana network (devnet for testing, mainnet for production)
      this.connection = new solanaWeb3.Connection(
        solanaWeb3.clusterApiUrl('devnet'),
        'confirmed'
      );
      
      this.programId = new solanaWeb3.PublicKey(programId);
      this.initialized = true;
      
      console.log('Solana integration initialized successfully!');
      console.log('Connected wallet:', this.wallet.publicKey.toString());
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Solana integration:', error);
      return false;
    }
  }
  
  async recordGameResult(winner, loser, gameType = 'street-fighter') {
    if (!this.initialized) {
      console.error('Solana integration not initialized!');
      return false;
    }
    
    try {
      // Create transaction instruction
      const instruction = new solanaWeb3.TransactionInstruction({
        keys: [
          {
            pubkey: this.wallet.publicKey,
            isSigner: true,
            isWritable: false,
          },
          {
            // Game state account - you would create this in advance
            pubkey: new solanaWeb3.PublicKey('YOUR_GAME_STATE_ACCOUNT'),
            isSigner: false,
            isWritable: true,
          },
        ],
        programId: this.programId,
        data: Buffer.from(JSON.stringify({
          action: 'record_game',
          gameType,
          winner,
          loser,
          timestamp: new Date().getTime(),
        })),
      });
      
      // Create and send transaction
      const transaction = new solanaWeb3.Transaction().add(instruction);
      
      // Setting recent blockhash and fee payer
      transaction.recentBlockhash = (
        await this.connection.getRecentBlockhash()
      ).blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Request wallet signature and send transaction
      const signed = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signed.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction(signature);
      
      console.log('Game result recorded on blockchain:', signature);
      return signature;
    } catch (error) {
      console.error('Failed to record game result:', error);
      return false;
    }
  }
  
  async requestGameToken() {
    if (!this.initialized) {
      console.error('Solana integration not initialized!');
      return false;
    }
    
    try {
      // This function would request a token or NFT reward for the player
      // Implementation depends on your specific token/NFT setup
      
      // Example transaction for minting a token reward
      const instruction = new solanaWeb3.TransactionInstruction({
        keys: [
          {
            pubkey: this.wallet.publicKey,
            isSigner: true,
            isWritable: false,
          },
          {
            // Your token mint account
            pubkey: new solanaWeb3.PublicKey('YOUR_TOKEN_MINT_ACCOUNT'),
            isSigner: false,
            isWritable: true,
          },
          {
            // Player's token account
            pubkey: new solanaWeb3.PublicKey('PLAYER_TOKEN_ACCOUNT'),
            isSigner: false,
            isWritable: true,
          },
          {
            // Token program
            pubkey: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: this.programId,
        data: Buffer.from(JSON.stringify({
          action: 'mint_reward',
          amount: 10, // Example reward amount
        })),
      });
      
      // Create and send transaction
      const transaction = new solanaWeb3.Transaction().add(instruction);
      
      // Setting recent blockhash and fee payer
      transaction.recentBlockhash = (
        await this.connection.getRecentBlockhash()
      ).blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Request wallet signature and send transaction
      const signed = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signed.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction(signature);
      
      console.log('Game token rewarded:', signature);
      return signature;
    } catch (error) {
      console.error('Failed to request game token:', error);
      return false;
    }
  }
  
  async getLeaderboard() {
    if (!this.initialized) {
      console.error('Solana integration not initialized!');
      return [];
    }
    
    try {
      // This is a placeholder - in a real implementation, you would query
      // your program's state accounts to get leaderboard data
      
      // Example: Get program accounts that store game results
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            dataSize: 1024, // Example size of your game record data
          },
        ],
      });
      
      // Process account data into leaderboard format
      const leaderboard = accounts.map(account => {
        // Decode your account data based on your program's data structure
        // This is just a placeholder
        const data = JSON.parse(Buffer.from(account.account.data).toString());
        
        return {
          player: data.player,
          wins: data.wins,
          losses: data.losses,
          score: data.score,
        };
      });
      
      // Sort by score
      leaderboard.sort((a, b) => b.score - a.score);
      
      return leaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }
  
  async placeBet(amount) {
    if (!this.initialized) {
      console.error('Solana integration not initialized!');
      return false;
    }
    
    try {
      // Find the player's token account for the game token
      const tokenAccountInfo = await this.connection.getTokenAccountsByOwner(
        this.wallet.publicKey,
        { mint: new solanaWeb3.PublicKey('YOUR_GAME_TOKEN_MINT') }
      );
      
      if (tokenAccountInfo.value.length === 0) {
        throw new Error("Player doesn't have a token account for the game token");
      }
      
      const playerTokenAccount = tokenAccountInfo.value[0].pubkey;
      
      // Create instruction to transfer tokens as a bet
      const instruction = new solanaWeb3.TransactionInstruction({
        keys: [
          {
            pubkey: this.wallet.publicKey,
            isSigner: true,
            isWritable: false,
          },
          {
            pubkey: playerTokenAccount,
            isSigner: false,
            isWritable: true,
          },
          {
            // Game treasury account
            pubkey: new solanaWeb3.PublicKey('GAME_TREASURY_ACCOUNT'),
            isSigner: false,
            isWritable: true,
          },
          {
            // Token program
            pubkey: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: this.programId,
        data: Buffer.from(JSON.stringify({
          action: 'place_bet',
          amount: amount,
        })),
      });
      
      // Create and send transaction
      const transaction = new solanaWeb3.Transaction().add(instruction);
      
      // Setting recent blockhash and fee payer
      transaction.recentBlockhash = (
        await this.connection.getRecentBlockhash()
      ).blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Request wallet signature and send transaction
      const signed = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signed.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction(signature);
      
      console.log('Bet placed:', signature);
      return signature;
    } catch (error) {
      console.error('Failed to place bet:', error);
      return false;
    }
  }
}

// Export the class
if (typeof module !== 'undefined') {
  module.exports = { SolanaGameIntegration };
} else {
  window.SolanaGameIntegration = SolanaGameIntegration;
}
