// game-integration-demo.js
// This file demonstrates how to integrate the game with Solana blockchain

document.addEventListener('DOMContentLoaded', () => {
  // Game instance
  let game;
  
  // Solana integration instance
  const solanaIntegration = new SolanaGameIntegration();
  
  // DOM Elements
  const walletConnectBtn = document.getElementById('walletConnectBtn');
  const walletStatus = document.getElementById('walletStatus');
  const startGameBtn = document.getElementById('startButton');
  const betAmountInput = document.getElementById('betAmount');
  const placeBetBtn = document.getElementById('placeBetBtn');
  const displayText = document.getElementById('displayText');
  
  // Asset loader
  const assetLoader = new AssetLoader();
  
  // Connect wallet button
  walletConnectBtn.addEventListener('click', async () => {
    try {
      const connected = await connectWallet();
      if (connected) {
        updateWalletUI(true);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      updateWalletUI(false);
      alert('Failed to connect wallet: ' + error.message);
    }
  });
  
  // Start game button
  startGameBtn.addEventListener('click', () => {
    if (!solanaIntegration.initialized) {
      alert('Please connect your wallet first!');
      return;
    }
    
    displayText.style.display = 'none';
    startGame();
  });
  
  // Place bet button
  if (placeBetBtn) {
    placeBetBtn.addEventListener('click', async () => {
      if (!solanaIntegration.initialized) {
        alert('Please connect your wallet first!');
        return;
      }
      
      const betAmount = parseFloat(betAmountInput.value);
      if (isNaN(betAmount) || betAmount <= 0) {
        alert('Please enter a valid bet amount!');
        return;
      }
      
      try {
        const success = await solanaIntegration.placeBet(betAmount);
        if (success) {
          alert(`Successfully placed bet of ${betAmount} tokens!`);
          startGameBtn.disabled = false;
        }
      } catch (error) {
        console.error('Failed to place bet:', error);
        alert('Failed to place bet: ' + error.message);
      }
    });
  }
  
  // Connect wallet function
  async function connectWallet() {
    const PROGRAM_ID = 'YOUR_SOLANA_PROGRAM_ID'; // Replace with your actual program ID
    return await solanaIntegration.initialize(PROGRAM_ID);
  }
  
  // Update wallet UI
  function updateWalletUI(connected) {
    if (connected) {
      const publicKey = solanaIntegration.wallet.publicKey.toString();
      walletConnectBtn.textContent = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
      walletConnectBtn.classList.add('connected');
      
      if (walletStatus) {
        walletStatus.textContent = 'Connected';
        walletStatus.style.color = 'green';
      }
      
      // Enable game controls
      if (startGameBtn) {
        startGameBtn.disabled = false;
      }
      
      if (placeBetBtn && betAmountInput) {
        betAmountInput.disabled = false;
        placeBetBtn.disabled = false;
      }
    } else {
      walletConnectBtn.textContent = 'Connect Wallet';
      walletConnectBtn.classList.remove('connected');
      
      if (walletStatus) {
        walletStatus.textContent = 'Not Connected';
        walletStatus.style.color = 'red';
      }
      
      // Disable game controls
      if (startGameBtn) {
        startGameBtn.disabled = true;
      }
      
      if (placeBetBtn && betAmountInput) {
        betAmountInput.disabled = true;
        placeBetBtn.disabled = true;
      }
    }
  }
  
  // Start game function
  function startGame() {
    // Load game assets
    displayText.textContent = 'Loading game assets...';
    displayText.style.display = 'flex';
    
    // Use default assets for demo or load real assets
    const assets = AssetLoader.createDefaultAssets();
    
    assetLoader
      .queue(assets)
      .onProgress(progress => {
        displayText.textContent = `Loading: ${Math.round(progress * 100)}%`;
      })
      .onComplete(() => {
        displayText.style.display = 'none';
        
        // Initialize game
        game = new StreetFighterGame();
        
        // Add game completion listener
        window.addEventListener('gameComplete', handleGameComplete);
        
        // Start the game
        game.start();
      });
  }
  
  // Handle game completion
  async function handleGameComplete(event) {
    const { winner } = event.detail;
    
    // Record game result on blockchain
    try {
      let winnerId, loserId;
      
      if (winner === 'player1') {
        winnerId = 'player1';
        loserId = 'player2';
      } else if (winner === 'player2') {
        winnerId = 'player2';
        loserId = 'player1';
      } else {
        // It's a tie
        winnerId = 'tie';
        loserId = 'tie';
      }
      
      // Record game result
      const resultSignature = await solanaIntegration.recordGameResult(winnerId, loserId);
      
      if (resultSignature) {
        console.log('Game result recorded on blockchain:', resultSignature);
        
        // Display transaction in UI
        const transactionInfo = document.createElement('div');
        transactionInfo.classList.add('transaction-info');
        transactionInfo.innerHTML = `
          <p>Game result recorded on blockchain!</p>
          <a href="https://explorer.solana.com/tx/${resultSignature}?cluster=devnet" target="_blank">
            View Transaction
          </a>
        `;
        
        document.body.appendChild(transactionInfo);
        
        // Reward winner if there is one
        if (winner !== 'tie') {
          await solanaIntegration.requestGameToken();
        }
      }
    } catch (error) {
      console.error('Failed to record game result:', error);
    }
  }
  
  // Initialize UI
  updateWalletUI(false);
});

// Add this to the head of your HTML to demonstrate how to implement leaderboard
function fetchLeaderboard() {
  if (!window.solanaIntegration || !window.solanaIntegration.initialized) {
    console.error('Solana integration not initialized!');
    return Promise.resolve([]);
  }
  
  return window.solanaIntegration.getLeaderboard()
    .then(leaderboard => {
      const leaderboardElement = document.getElementById('leaderboard');
      if (!leaderboardElement) return;
      
      // Clear existing leaderboard
      leaderboardElement.innerHTML = '';
      
      // Add header
      const header = document.createElement('div');
      header.classList.add('leaderboard-header');
      header.innerHTML = `
        <div class="rank">Rank</div>
        <div class="player">Player</div>
        <div class="score">Score</div>
        <div class="wins">Wins</div>
        <div class="losses">Losses</div>
      `;
      leaderboardElement.appendChild(header);
      
      // Add players
      leaderboard.forEach((entry, index) => {
        const row = document.createElement('div');
        row.classList.add('leaderboard-row');
        
        // Highlight current player if available
        if (
          window.solanaIntegration.wallet && 
          entry.player === window.solanaIntegration.wallet.publicKey.toString()
        ) {
          row.classList.add('current-player');
        }
        
        row.innerHTML = `
          <div class="rank">${index + 1}</div>
          <div class="player">${entry.player.slice(0, 4)}...${entry.player.slice(-4)}</div>
          <div class="score">${entry.score}</div>
          <div class="wins">${entry.wins}</div>
          <div class="losses">${entry.losses}</div>
        `;
        
        leaderboardElement.appendChild(row);
      });
      
      return leaderboard;
    })
    .catch(error => {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    });
}
