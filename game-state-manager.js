// game-state-manager.js
// Manages different game states and transitions

class GameStateManager {
  constructor(game) {
    this.game = game;
    this.states = {
      LOADING: 'loading',
      MENU: 'menu',
      CHARACTER_SELECT: 'characterSelect',
      GAME: 'game',
      PAUSE: 'pause',
      GAME_OVER: 'gameOver',
      LEADERBOARD: 'leaderboard'
    };
    this.currentState = this.states.LOADING;
    this.stateData = {}; // Store state-specific data
    
    // UI Elements
    this.displayText = document.getElementById('displayText');
    this.startButton = document.getElementById('startButton');
    this.menuElement = document.getElementById('menu');
    this.gameCanvas = document.getElementById('gameCanvas');
    this.gameOverElement = document.getElementById('gameOver');
    this.leaderboardElement = document.getElementById('leaderboard');
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Start button
    if (this.startButton) {
      this.startButton.addEventListener('click', () => {
        if (this.currentState === this.states.MENU) {
          this.changeState(this.states.CHARACTER_SELECT);
        } else if (this.currentState === this.states.CHARACTER_SELECT) {
          this.changeState(this.states.GAME);
        } else if (this.currentState === this.states.GAME_OVER) {
          this.changeState(this.states.MENU);
        }
      });
    }
    
    // Pause key
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.currentState === this.states.GAME) {
          this.changeState(this.states.PAUSE);
        } else if (this.currentState === this.states.PAUSE) {
          this.changeState(this.states.GAME);
        }
      }
    });
    
    // Character select buttons
    const characterButtons = document.querySelectorAll('.character-select-btn');
    characterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const characterId = button.getAttribute('data-character');
        this.stateData.selectedCharacter = characterId;
        this.startButton.disabled = false;
      });
    });
    
    // Leaderboard button
    const leaderboardButton = document.getElementById('leaderboardButton');
    if (leaderboardButton) {
      leaderboardButton.addEventListener('click', () => {
        this.changeState(this.states.LEADERBOARD);
      });
    }
    
    // Back button
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.changeState(this.states.MENU);
      });
    });
  }
  
  changeState(newState) {
    const oldState = this.currentState;
    this.currentState = newState;
    
    // Exit old state actions
    this.exitState(oldState);
    
    // Enter new state actions
    this.enterState(newState);
    
    console.log(`Game state changed: ${oldState} -> ${newState}`);
  }
  
  enterState(state) {
    // Hide all UI elements first
    this.hideAllUI();
    
    switch(state) {
      case this.states.LOADING:
        if (this.displayText) {
          this.displayText.textContent = 'Loading...';
          this.displayText.style.display = 'flex';
        }
        break;
        
      case this.states.MENU:
        if (this.menuElement) {
          this.menuElement.style.display = 'flex';
        }
        if (this.startButton) {
          this.startButton.textContent = 'Start Game';
          this.startButton.style.display = 'block';
        }
        break;
        
      case this.states.CHARACTER_SELECT:
        const characterSelectElement = document.getElementById('characterSelect');
        if (characterSelectElement) {
          characterSelectElement.style.display = 'flex';
        }
        if (this.startButton) {
          this.startButton.textContent = 'Fight!';
          this.startButton.disabled = !this.stateData.selectedCharacter;
        }
        break;
        
      case this.states.GAME:
        this.gameCanvas.style.display = 'block';
        if (this.game.start) {
          this.game.start(this.stateData.selectedCharacter);
        }
        break;
        
      case this.states.PAUSE:
        if (this.displayText) {
          this.displayText.textContent = 'Paused';
          this.displayText.style.display = 'flex';
        }
        if (this.game.pause) {
          this.game.pause();
        }
        break;
        
      case this.states.GAME_OVER:
        if (this.gameOverElement) {
          this.gameOverElement.style.display = 'flex';
          
          // Update winner display
          const winnerText = document.getElementById('winnerText');
          if (winnerText) {
            winnerText.textContent = `${this.stateData.winner} wins!`;
          }
        }
        
        if (this.startButton) {
          this.startButton.textContent = 'Play Again';
          this.startButton.style.display = 'block';
        }
        break;
        
      case this.states.LEADERBOARD:
        if (this.leaderboardElement) {
          this.leaderboardElement.style.display = 'flex';
          
          // Fetch and display leaderboard
          if (window.fetchLeaderboard) {
            window.fetchLeaderboard();
          }
        }
        break;
    }
  }
  
  exitState(state) {
    switch(state) {
      case this.states.GAME:
        if (this.game.stop) {
          this.game.stop();
        }
        break;
        
      case this.states.PAUSE:
        if (this.game.resume) {
          this.game.resume();
        }
        break;
    }
  }
  
  hideAllUI() {
    // Hide all UI elements
    if (this.displayText) this.displayText.style.display = 'none';
    if (this.startButton) this.startButton.style.display = 'none';
    if (this.menuElement) this.menuElement.style.display = 'none';
    if (this.gameCanvas) this.gameCanvas.style.display = 'none';
    if (this.gameOverElement) this.gameOverElement.style.display = 'none';
    if (this.leaderboardElement) this.leaderboardElement.style.display = 'none';
    
    const characterSelectElement = document.getElementById('characterSelect');
    if (characterSelectElement) characterSelectElement.style.display = 'none';
  }
  
  // Called when game is completed
  gameCompleted(winner) {
    this.stateData.winner = winner;
    this.changeState(this.states.GAME_OVER);
    
    // Emit game completion event for blockchain integration
    window.dispatchEvent(new CustomEvent('gameComplete', {
      detail: { winner: winner }
    }));
  }
  
  // Update loading progress
  updateLoading(progress) {
    if (this.currentState === this.states.LOADING && this.displayText) {
      this.displayText.textContent = `Loading: ${Math.round(progress * 100)}%`;
      
      // When loading is complete, move to menu
      if (progress >= 1) {
        setTimeout(() => {
          this.changeState(this.states.MENU);
        }, 500);
      }
    }
  }
}

// Export the class
if (typeof module !== 'undefined') {
  module.exports = { GameStateManager };
} else {
  window.GameStateManager = GameStateManager;
}
