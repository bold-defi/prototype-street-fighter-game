// Street Fighter Style Game Implementation
// main.js - Core game engine and logic

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.5;
const GROUND_Y = CANVAS_HEIGHT - 100;
const FRICTION = 0.8;

// Main game class
class StreetFighterGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    
    // Game state
    this.player1 = new Fighter({
      position: { x: 200, y: GROUND_Y },
      velocity: { x: 0, y: 0 },
      color: '#FF0000',
      offset: { x: 0, y: 0 },
      sprites: {
        idle: {
          imageSrc: './assets/player1/idle.png',
          framesMax: 8
        },
        run: {
          imageSrc: './assets/player1/run.png',
          framesMax: 8
        },
        jump: {
          imageSrc: './assets/player1/jump.png',
          framesMax: 3
        },
        attack1: {
          imageSrc: './assets/player1/attack1.png',
          framesMax: 6
        },
        takeDamage: {
          imageSrc: './assets/player1/takeDamage.png',
          framesMax: 4
        }
      },
      attackBox: {
        offset: { x: 50, y: 0 },
        width: 100,
        height: 50
      },
      name: "Player 1"
    });
    
    this.player2 = new Fighter({
      position: { x: 600, y: GROUND_Y },
      velocity: { x: 0, y: 0 },
      color: '#0000FF',
      offset: { x: -50, y: 0 },
      sprites: {
        idle: {
          imageSrc: './assets/player2/idle.png',
          framesMax: 8
        },
        run: {
          imageSrc: './assets/player2/run.png',
          framesMax: 8
        },
        jump: {
          imageSrc: './assets/player2/jump.png',
          framesMax: 3
        },
        attack1: {
          imageSrc: './assets/player2/attack1.png',
          framesMax: 6
        },
        takeDamage: {
          imageSrc: './assets/player2/takeDamage.png',
          framesMax: 4
        }
      },
      attackBox: {
        offset: { x: -100, y: 0 },
        width: 100,
        height: 50
      },
      name: "Player 2"
    });
    
    this.keys = {
      // Player 1 controls
      a: { pressed: false },
      d: { pressed: false },
      w: { pressed: false },
      s: { pressed: false },
      space: { pressed: false },
      
      // Player 2 controls
      ArrowLeft: { pressed: false },
      ArrowRight: { pressed: false },
      ArrowUp: { pressed: false },
      ArrowDown: { pressed: false },
      Enter: { pressed: false }
    };
    
    this.background = new Sprite({
      position: { x: 0, y: 0 },
      imageSrc: './assets/background.png'
    });
    
    this.timer = 99;
    this.timerInterval = null;
    this.gameOver = false;
    this.winner = null;
    
    // Initialize event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    window.addEventListener('keydown', (event) => {
      if (!this.gameOver) {
        switch(event.key) {
          // Player 1 controls
          case 'a':
            this.keys.a.pressed = true;
            this.player1.lastKey = 'a';
            break;
          case 'd':
            this.keys.d.pressed = true;
            this.player1.lastKey = 'd';
            break;
          case 'w':
            if (this.player1.position.y >= GROUND_Y) {
              this.player1.velocity.y = -15;
            }
            break;
          case ' ':
            this.player1.attack();
            break;
            
          // Player 2 controls
          case 'ArrowLeft':
            this.keys.ArrowLeft.pressed = true;
            this.player2.lastKey = 'ArrowLeft';
            break;
          case 'ArrowRight':
            this.keys.ArrowRight.pressed = true;
            this.player2.lastKey = 'ArrowRight';
            break;
          case 'ArrowUp':
            if (this.player2.position.y >= GROUND_Y) {
              this.player2.velocity.y = -15;
            }
            break;
          case 'Enter':
            this.player2.attack();
            break;
        }
      }
    });
    
    window.addEventListener('keyup', (event) => {
      switch(event.key) {
        // Player 1 controls
        case 'a':
          this.keys.a.pressed = false;
          break;
        case 'd':
          this.keys.d.pressed = false;
          break;
          
        // Player 2 controls
        case 'ArrowLeft':
          this.keys.ArrowLeft.pressed = false;
          break;
        case 'ArrowRight':
          this.keys.ArrowRight.pressed = false;
          break;
      }
    });
  }
  
  start() {
    // Reset the game state
    this.player1.reset();
    this.player2.reset();
    this.gameOver = false;
    this.winner = null;
    this.timer = 99;
    
    // Start the game timer
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
        document.querySelector('#timer').innerHTML = this.timer;
      }
      
      if (this.timer === 0) {
        this.determineWinner();
      }
    }, 1000);
    
    // Start the game loop
    this.animate();
  }
  
  animate() {
    if (this.gameOver) return;
    
    window.requestAnimationFrame(() => this.animate());
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.background.update(this.ctx);
    
    // Draw ground
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Update players
    this.player1.update(this.ctx);
    this.player2.update(this.ctx);
    
    // Player 1 movement
    this.player1.velocity.x = 0;
    if (this.keys.a.pressed && this.player1.lastKey === 'a') {
      this.player1.velocity.x = -5;
      this.player1.switchSprite('run');
    } else if (this.keys.d.pressed && this.player1.lastKey === 'd') {
      this.player1.velocity.x = 5;
      this.player1.switchSprite('run');
    } else {
      this.player1.switchSprite('idle');
    }
    
    if (this.player1.velocity.y < 0) {
      this.player1.switchSprite('jump');
    }
    
    // Player 2 movement
    this.player2.velocity.x = 0;
    if (this.keys.ArrowLeft.pressed && this.player2.lastKey === 'ArrowLeft') {
      this.player2.velocity.x = -5;
      this.player2.switchSprite('run');
    } else if (this.keys.ArrowRight.pressed && this.player2.lastKey === 'ArrowRight') {
      this.player2.velocity.x = 5;
      this.player2.switchSprite('run');
    } else {
      this.player2.switchSprite('idle');
    }
    
    if (this.player2.velocity.y < 0) {
      this.player2.switchSprite('jump');
    }
    
    // Detect collision for Player 1's attack
    if (
      this.player1.isAttacking && 
      this.player1.framesCurrent === 4 // Hit frame in the attack animation
    ) {
      if (this.rectangularCollision(this.player1, this.player2)) {
        this.player1.isAttacking = false;
        this.player2.health -= 10;
        document.querySelector('#player2Health').style.width = `${this.player2.health}%`;
        this.player2.switchSprite('takeDamage');
      }
    }
    
    // Detect collision for Player 2's attack
    if (
      this.player2.isAttacking && 
      this.player2.framesCurrent === 4 // Hit frame in the attack animation
    ) {
      if (this.rectangularCollision(this.player2, this.player1)) {
        this.player2.isAttacking = false;
        this.player1.health -= 10;
        document.querySelector('#player1Health').style.width = `${this.player1.health}%`;
        this.player1.switchSprite('takeDamage');
      }
    }
    
    // Reset attack state after animation completes
    if (this.player1.isAttacking && this.player1.framesCurrent === 6) {
      this.player1.isAttacking = false;
    }
    
    if (this.player2.isAttacking && this.player2.framesCurrent === 6) {
      this.player2.isAttacking = false;
    }
    
    // Check for game end (health)
    if (this.player1.health <= 0 || this.player2.health <= 0) {
      this.determineWinner();
    }
  }
  
  rectangularCollision(attacker, defender) {
    return (
      attacker.attackBox.position.x + attacker.attackBox.width >= defender.position.x &&
      attacker.attackBox.position.x <= defender.position.x + defender.width &&
      attacker.attackBox.position.y + attacker.attackBox.height >= defender.position.y &&
      attacker.attackBox.position.y <= defender.position.y + defender.height
    );
  }
  
  determineWinner() {
    clearInterval(this.timerInterval);
    this.gameOver = true;
    
    const resultText = document.querySelector('#displayText');
    resultText.style.display = 'flex';
    
    if (this.player1.health === this.player2.health) {
      resultText.innerHTML = 'Tie!';
      this.winner = 'tie';
    } else if (this.player1.health > this.player2.health) {
      resultText.innerHTML = 'Player 1 Wins!';
      this.winner = 'player1';
    } else {
      resultText.innerHTML = 'Player 2 Wins!';
      this.winner = 'player2';
    }
    
    // Emit win event for blockchain integration
    this.emitGameResult();
  }
  
  emitGameResult() {
    // Placeholder for blockchain integration
    console.log(`Game result: ${this.winner}`);
    // You would implement your Solana blockchain transaction here
    // Example: window.dispatchEvent(new CustomEvent('gameComplete', { detail: { winner: this.winner } }));
  }
}

// Sprite class for handling animations and rendering
class Sprite {
  constructor({ 
    position, 
    imageSrc, 
    scale = 1, 
    framesMax = 1, 
    offset = { x: 0, y: 0 } 
  }) {
    this.position = position;
    this.width = 50;
    this.height = 150;
    this.image = new Image();
    this.image.src = imageSrc;
    this.scale = scale;
    this.framesMax = framesMax;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.offset = offset;
  }
  
  draw(ctx) {
    // Fallback rendering if image isn't loaded
    if (!this.image.complete) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
      return;
    }
    
    ctx.drawImage(
      this.image,
      this.framesCurrent * (this.image.width / this.framesMax),
      0,
      this.image.width / this.framesMax,
      this.image.height,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      (this.image.width / this.framesMax) * this.scale,
      this.image.height * this.scale
    );
  }
  
  animateFrames() {
    this.framesElapsed++;
    
    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++;
      } else {
        this.framesCurrent = 0;
      }
    }
  }
  
  update(ctx) {
    this.draw(ctx);
    this.animateFrames();
  }
}

// Fighter class extends Sprite with fighting game mechanics
class Fighter extends Sprite {
  constructor({ 
    position, 
    velocity, 
    color = 'red', 
    imageSrc, 
    scale = 1, 
    framesMax = 1, 
    offset = { x: 0, y: 0 },
    sprites,
    attackBox = { offset: {}, width: undefined, height: undefined },
    name
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset
    });
    
    this.velocity = velocity;
    this.width = 50;
    this.height = 150;
    this.lastKey = '';
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    };
    this.color = color;
    this.isAttacking = false;
    this.health = 100;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 5;
    this.sprites = sprites;
    this.name = name;
    this.dead = false;
    
    // Load sprites
    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image();
      sprites[sprite].image.src = sprites[sprite].imageSrc;
    }
  }
  
  update(ctx) {
    this.draw(ctx);
    if (!this.dead) this.animateFrames();
    
    // Update attack box position
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;
    
    // Draw attack box for debugging
    // ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    // ctx.fillRect(
    //   this.attackBox.position.x,
    //   this.attackBox.position.y,
    //   this.attackBox.width,
    //   this.attackBox.height
    // );
    
    // Apply physics
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    
    // Gravity
    if (this.position.y + this.height + this.velocity.y >= GROUND_Y) {
      this.velocity.y = 0;
      this.position.y = GROUND_Y;
    } else {
      this.velocity.y += GRAVITY;
    }
    
    // Boundary detection
    if (this.position.x < 0) {
      this.position.x = 0;
    }
    if (this.position.x + this.width > CANVAS_WIDTH) {
      this.position.x = CANVAS_WIDTH - this.width;
    }
  }
  
  attack() {
    if (this.isAttacking) return;
    
    this.isAttacking = true;
    this.switchSprite('attack1');
  }
  
  switchSprite(sprite) {
    // Override with attack animation
    if (
      this.image === this.sprites.attack1.image &&
      this.framesCurrent < this.sprites.attack1.framesMax - 1
    ) 
      return;
      
    // Override with take damage animation
    if (
      this.image === this.sprites.takeDamage.image &&
      this.framesCurrent < this.sprites.takeDamage.framesMax - 1
    )
      return;
    
    switch(sprite) {
      case 'idle':
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image;
          this.framesMax = this.sprites.idle.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'run':
        if (this.image !== this.sprites.run.image) {
          this.image = this.sprites.run.image;
          this.framesMax = this.sprites.run.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'jump':
        if (this.image !== this.sprites.jump.image) {
          this.image = this.sprites.jump.image;
          this.framesMax = this.sprites.jump.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'attack1':
        if (this.image !== this.sprites.attack1.image) {
          this.image = this.sprites.attack1.image;
          this.framesMax = this.sprites.attack1.framesMax;
          this.framesCurrent = 0;
        }
        break;
      case 'takeDamage':
        if (this.image !== this.sprites.takeDamage.image) {
          this.image = this.sprites.takeDamage.image;
          this.framesMax = this.sprites.takeDamage.framesMax;
          this.framesCurrent = 0;
        }
        break;
    }
  }
  
  reset() {
    this.health = 100;
    this.dead = false;
    this.position = { 
      x: this.name === "Player 1" ? 200 : 600, 
      y: GROUND_Y 
    };
    this.velocity = { x: 0, y: 0 };
    this.framesCurrent = 0;
    this.switchSprite('idle');
  }
}

// Initialize game on window load
window.addEventListener('load', () => {
  const game = new StreetFighterGame();
  
  // Add start button event listener
  document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('displayText').style.display = 'none';
    game.start();
  });
});
