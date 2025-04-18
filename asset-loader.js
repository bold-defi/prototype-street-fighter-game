// asset-loader.js
// This file manages loading game assets (sprites, sounds, etc.)

class AssetLoader {
  constructor() {
    this.images = {};
    this.sounds = {};
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.onProgressCallbacks = [];
    this.onCompleteCallbacks = [];
  }
  
  // Add assets to the loading queue
  queue(assets) {
    const { images = {}, sounds = {} } = assets;
    
    // Add images to queue
    Object.keys(images).forEach(key => {
      this.totalAssets++;
      this.loadImage(key, images[key]);
    });
    
    // Add sounds to queue
    Object.keys(sounds).forEach(key => {
      this.totalAssets++;
      this.loadSound(key, sounds[key]);
    });
    
    return this;
  }
  
  // Load an image
  loadImage(key, src) {
    const image = new Image();
    
    image.onload = () => {
      this.images[key] = image;
      this.assetLoaded();
    };
    
    image.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      this.assetLoaded();
    };
    
    image.src = src;
  }
  
  // Load a sound
  loadSound(key, src) {
    const sound = new Audio();
    
    sound.addEventListener('canplaythrough', () => {
      this.sounds[key] = sound;
      this.assetLoaded();
    }, { once: true });
    
    sound.addEventListener('error', () => {
      console.error(`Failed to load sound: ${src}`);
      this.assetLoaded();
    });
    
    sound.src = src;
    sound.load();
  }
  
  // Handle asset loaded event
  assetLoaded() {
    this.loadedAssets++;
    
    const progress = this.loadedAssets / this.totalAssets;
    
    // Notify progress listeners
    this.onProgressCallbacks.forEach(callback => callback(progress));
    
    // If all assets are loaded, notify complete listeners
    if (this.loadedAssets === this.totalAssets) {
      this.onCompleteCallbacks.forEach(callback => callback());
    }
  }
  
  // Get a loaded image
  getImage(key) {
    return this.images[key];
  }
  
  // Get a loaded sound
  getSound(key) {
    return this.sounds[key];
  }
  
  // Play a sound
  playSound(key, options = {}) {
    const sound = this.getSound(key);
    
    if (!sound) {
      console.warn(`Sound not found: ${key}`);
      return;
    }
    
    // Clone the audio to allow overlapping playback
    const soundInstance = sound.cloneNode();
    
    if (options.volume !== undefined) {
      soundInstance.volume = options.volume;
    }
    
    if (options.loop !== undefined) {
      soundInstance.loop = options.loop;
    }
    
    soundInstance.play().catch(error => {
      console.warn(`Failed to play sound: ${key}`, error);
    });
    
    return soundInstance;
  }
  
  // Add a progress callback
  onProgress(callback) {
    this.onProgressCallbacks.push(callback);
    return this;
  }
  
  // Add a complete callback
  onComplete(callback) {
    this.onCompleteCallbacks.push(callback);
    return this;
  }
  
  // Create default game assets for quick testing
  static createDefaultAssets() {
    // Create an SVG-based sprite for Player 1
    const player1Idle = `./assets/player1/idle.svg`;
    
    // Create an SVG-based sprite for Player 2
    const player2Idle = `./assets/player2/idle.svg`;
    
    // Create an SVG-based sprite for attack animation
    const player1Attack = `./assets/player1/attack.svg`;
    
    const player2Attack = `./assets/player2/attack.svg`;
    
    // Background image
    const background = `./assets/background.svg`;
    
    // Create asset dictionary
    return {
      images: {
        'player1-idle': player1Idle,
        'player1-attack': player1Attack,
        'player2-idle': player2Idle,
        'player2-attack': player2Attack,
        'background': background
      },
      sounds: {
        'punch': './assets/sound/punch.wav',
        'jump': './assets/sound/jump.wav',
        'victory': './assets/sound/victory.wav',
      }
    };
  }
}

// Export the class
if (typeof module !== 'undefined') {
  module.exports = { AssetLoader };
} else {
  window.AssetLoader = AssetLoader;
}
