// game-physics.js
// Handles collision detection, physics calculations and game mechanics

class GamePhysics {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.gravity = 0.5;
    this.groundY = canvasHeight - 100;
    this.friction = 0.8;
  }

  // Apply gravity and ground collision
  applyGravity(entity) {
    // Apply gravity
    entity.velocity.y += this.gravity;
    
    // Apply ground collision
    if (entity.position.y + entity.height + entity.velocity.y >= this.groundY) {
      entity.velocity.y = 0;
      entity.position.y = this.groundY - entity.height;
      entity.isJumping = false;
    } else {
      entity.isJumping = true;
    }
  }
  
  // Apply horizontal movement and friction
  applyMovement(entity) {
    // Apply horizontal movement
    entity.position.x += entity.velocity.x;
    
    // Apply friction when on ground
    if (!entity.isJumping && Math.abs(entity.velocity.x) > 0) {
      entity.velocity.x *= this.friction;
      
      // Stop completely if velocity is very small
      if (Math.abs(entity.velocity.x) < 0.1) {
        entity.velocity.x = 0;
      }
    }
    
    // Apply screen boundaries
    if (entity.position.x < 0) {
      entity.position.x = 0;
      entity.velocity.x = 0;
    } else if (entity.position.x + entity.width > this.canvasWidth) {
      entity.position.x = this.canvasWidth - entity.width;
      entity.velocity.x = 0;
    }
  }
  
  // Check rectangular collision between two entities
  checkRectangularCollision(rect1, rect2) {
    return (
      rect1.position.x < rect2.position.x + rect2.width &&
      rect1.position.x + rect1.width > rect2.position.x &&
      rect1.position.y < rect2.position.y + rect2.height &&
      rect1.position.y + rect1.height > rect2.position.y
    );
  }
  
  // Check attack box collision between attacker and defender
  checkAttackCollision(attacker, defender) {
    const attackBox = {
      position: {
        x: attacker.position.x + attacker.attackBox.offset.x,
        y: attacker.position.y + attacker.attackBox.offset.y
      },
      width: attacker.attackBox.width,
      height: attacker.attackBox.height
    };
    
    return this.checkRectangularCollision(attackBox, defender);
  }
  
  // Apply knockback to entity
  applyKnockback(entity, direction, force) {
    entity.velocity.x = direction * force;
    entity.velocity.y = -force / 2; // Small vertical knockback
  }
  
  // Check if entities are in attack range (for AI)
  inAttackRange(attacker, defender, range) {
    const attackerCenterX = attacker.position.x + attacker.width / 2;
    const defenderCenterX = defender.position.x + defender.width / 2;
    
    return Math.abs(attackerCenterX - defenderCenterX) <= range;
  }
  
  // Determine which direction an entity should face based on opponent position
  determineFacingDirection(entity, opponent) {
    const entityCenterX = entity.position.x + entity.width / 2;
    const opponentCenterX = opponent.position.x + opponent.width / 2;
    
    // Return 1 for right, -1 for left
    return entityCenterX < opponentCenterX ? 1 : -1;
  }
  
  // Calculate distance between two entities
  calculateDistance(entity1, entity2) {
    const entity1CenterX = entity1.position.x + entity1.width / 2;
    const entity2CenterX = entity2.position.x + entity2.width / 2;
    
    return Math.abs(entity1CenterX - entity2CenterX);
  }
  
  // Calculate a simple AI move for computer-controlled fighter
  calculateAIMove(ai, player, difficulty = 'medium') {
    const distance = this.calculateDistance(ai, player);
    const facingDirection = this.determineFacingDirection(ai, player);
    const moves = { left: false, right: false, jump: false, attack: false };
    
    // Different behavior based on difficulty
    switch (difficulty) {
      case 'easy':
        // Easy AI: Only basic movement and occasional attacks
        // Move towards player if too far
        if (distance > 150) {
          moves.left = facingDirection === -1;
          moves.right = facingDirection === 1;
        }
        // Random jump
        moves.jump = Math.random() < 0.01 && !ai.isJumping;
        // Attack when in range
        moves.attack = distance < 100 && Math.random() < 0.1;
        break;
        
      case 'medium':
        // Medium AI: Better movement, timed attacks
        // Move towards player with some strategy
        if (distance > 120) {
          moves.left = facingDirection === -1;
          moves.right = facingDirection === 1;
        } else if (distance < 80) {
          // Back away if too close
          moves.left = facingDirection === 1;
          moves.right = facingDirection === -1;
        }
        
        // Jump more intelligently
        moves.jump = ((Math.random() < 0.03 && !ai.isJumping) || 
                     (player.isAttacking && Math.random() < 0.4 && !ai.isJumping));
                     
        // Attack when in good range
        moves.attack = distance < 120 && distance > 50 && Math.random() < 0.2;
        break;
        
      case 'hard':
        // Hard AI: Advanced movement, combo attacks, defensive maneuvers
        // Strategic movement
        if (distance > 140) {
          // Chase aggressively
          moves.left = facingDirection === -1;
          moves.right = facingDirection === 1;
        } else if (distance < 70 && player.isAttacking) {
          // Defensive retreat when player attacks
          moves.left = facingDirection === 1;
          moves.right = facingDirection === -1;
          // Defensive jump
          moves.jump = Math.random() < 0.6 && !ai.isJumping;
        } else if (distance > 80 && distance < 140) {
          // Stay in optimal attack range
          moves.left = (facingDirection === -1 && distance > 110);
          moves.right = (facingDirection === 1 && distance > 110);
        }
        
        // Strategic jumps
        moves.jump = ((Math.random() < 0.05 && !ai.isJumping) || 
                     (player.isAttacking && Math.random() < 0.7 && !ai.isJumping));
                     
        // Smart attack timing
        moves.attack = (distance < 130 && !player.isAttacking && Math.random() < 0.3) ||
                      (player.isJumping && Math.random() < 0.4);
        
        // Counter attack
        if (player.attackRecovery && distance < 120) {
          moves.attack = Math.random() < 0.8;
        }
        
        break;
    }
    
    return moves;
  }
  
  // Apply combo system (for future enhancement)
  checkCombo(entity, input, time) {
    // Store recent inputs with timestamps for combo detection
    entity.inputHistory = entity.inputHistory || [];
    entity.inputHistory.push({ input, time });
    
    // Only keep recent inputs (last 2 seconds)
    entity.inputHistory = entity.inputHistory.filter(record => time - record.time < 2000);
    
    // Check for specific combo patterns
    // Example: Simple 3-hit combo check
    const recentInputs = entity.inputHistory.map(record => record.input);
    
    if (this.arrayEndsWith(recentInputs, ['punch', 'punch', 'kick'])) {
      return 'triple_combo';
    }
    
    if (this.arrayEndsWith(recentInputs, ['down', 'right', 'punch'])) {
      return 'special_move_1';
    }
    
    return null;
  }
  
  // Helper method to check if array ends with pattern
  arrayEndsWith(array, pattern) {
    if (array.length < pattern.length) return false;
    
    const startIdx = array.length - pattern.length;
    for (let i = 0; i < pattern.length; i++) {
      if (array[startIdx + i] !== pattern[i]) return false;
    }
    
    return true;
  }
}

// Export the class
if (typeof module !== 'undefined') {
  module.exports = { GamePhysics };
} else {
  window.GamePhysics = GamePhysics;
}
