import * as THREE from 'three';
import { Player } from './player.js';
import { GridManager } from './gridManager.js';
import { InputHandler } from './inputHandler.js';
import { HUD } from './hud.js';
import { EnemyManager } from './enemyManager.js';
import { WeaponManager } from './weaponManager.js';
import { WeaponSelectionMenu } from './weaponSelection.js';

export class Game {
  constructor(container, settings) {
    this.container = container;
    this.settings = settings;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isRunning = false;
    this.gameStartTime = 0;
    this.score = 0;
    this.health = 100;
    
    console.log("Setting up game...");
    this.setupRenderer();
    console.log("Renderer setup complete");
    this.setupCamera();
    console.log("Camera setup complete");
    this.setupScene();
    console.log("Scene setup complete");
    this.setupLights();
    console.log("Lights setup complete");
    
    this.gridManager = new GridManager(this.scene);
    console.log("Grid manager created");
    this.player = new Player(this.scene, this.settings);
    console.log("Player created");
    this.inputHandler = new InputHandler(this.settings);
    this.hud = new HUD(container);
    this.enemyManager = new EnemyManager(this.scene, this.player);
    this.weaponManager = new WeaponManager(this.scene, this.player, false); // Don't add default weapon
    this.weaponSelectionMenu = new WeaponSelectionMenu(container);
    
    // Don't start with a weapon - we'll select one at game start
    this.hasSelectedStarterWeapon = false;
    
    // Flag to track if the game is paused (e.g. when showing weapon selection)
    this.isPaused = false;
    
    this.setupResizeHandler();
    
    this.lastTime = 0;
    
    // Render a single frame to show the game background behind the menu
    this.renderer.render(this.scene, this.camera);
    console.log("Initial render complete");
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111133);
    this.container.appendChild(this.renderer.domElement);
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 15, 0);
    this.camera.lookAt(0, 0, 0);
    this.camera.rotation.x = -Math.PI / 2; // Look down at the plane
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
  }
  
  setupLights() {
    // Ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    console.log("Added ambient light");
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    console.log("Added directional light");
    
    // Add a second directional light from the opposite direction for better illumination
    const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.4);
    secondaryLight.position.set(-10, 15, -10);
    this.scene.add(secondaryLight);
    console.log("Added secondary directional light");
  }
  
  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    });
  }
  
  start() {
    console.log("Game starting...");
    this.isRunning = true;
    this.gameStartTime = performance.now() / 1000;
    this.lastTime = this.gameStartTime;
    this.score = 0;
    this.health = 100;
    this.hud.gameTime = 0;
    this.hud.score = 0;
    this.hud.health = 100;
    this.hud.show();
    console.log("HUD initialized");
    
    // Initialize FPS display based on settings
    if (this.settings.showFPS) {
      this.hud.fpsDisplay.style.display = 'block';
    } else {
      this.hud.fpsDisplay.style.display = 'none';
    }
    
    this.enemyManager.clear(); // Clear any existing enemies
    console.log("Enemies cleared");
    
    // Reset player position
    this.player.mesh.position.set(0, this.player.mesh.position.y, 0); 
    this.player.mesh.scale.set(1, 1, 1); // Reset any pulse scaling
    this.player.pulseTime = 0; // Reset pulse timer
    console.log("Player position reset");
    
    this.isPaused = true; // Start paused for weapon selection
    
    // Re-apply player color from settings in case it changed
    this.player.applyColor(this.settings.getPlayerColorTHREE());
    
    // Reset weapons
    this.weaponManager.dispose();
    this.weaponManager = new WeaponManager(this.scene, this.player, false); // Don't add default weapon
    console.log("Weapons reset");
    
    // Show starter weapon selection
    this.showStarterWeaponSelection();
    console.log("Starter weapon selection shown");
    
    this.renderer.setAnimationLoop(this.update.bind(this));
    console.log("Animation loop started");
  }
  
  stop() {
    this.isRunning = false;
    this.hud.hide();
    this.renderer.setAnimationLoop(null);
    this.weaponManager.dispose();
  }
  
  update(time) {
    if (!this.isRunning) {
      console.log("Game not running, skipping update");
      return;
    }
    
    // Always render the scene, even when paused
    this.renderer.render(this.scene, this.camera);
    
    // Don't update game logic if paused (e.g., weapon selection screen is open)
    if (this.isPaused) {
      console.log("Game is paused, skipping game logic update");
      return;
    }
    
    // --- Game Logic Starts Here ---
    console.log(`Update loop running: time=${time.toFixed(2)}, isPaused=${this.isPaused}`);
    
    const timeMs = time;
    const delta = (timeMs - this.lastTime) / 1000;
    this.lastTime = timeMs;
    
    // Update HUD
    this.hud.update(delta);
    
    // Ensure FPS display visibility matches settings
    if (this.settings.showFPS) {
      this.hud.fpsDisplay.style.display = 'block';
    } else {
      this.hud.fpsDisplay.style.display = 'none';
    }
    
    // Update player position based on input
    const direction = this.inputHandler.getDirection();
    this.player.move(direction, delta);
    
    // Update camera to follow player
    console.log(`Player Pos: x=${this.player.mesh.position.x.toFixed(2)}, z=${this.player.mesh.position.z.toFixed(2)}`);
    this.camera.position.x = this.player.mesh.position.x;
    this.camera.position.z = this.player.mesh.position.z;
    console.log(`Camera Pos: x=${this.camera.position.x.toFixed(2)}, y=${this.camera.position.y.toFixed(2)}, z=${this.camera.position.z.toFixed(2)}`);
    
    // Update grid sections based on player position
    this.gridManager.update(this.player.mesh.position);
    
    // Update enemies
    const enemyStatus = this.enemyManager.update(delta, this.score);
    
    // Update weapons and check for hits
    const weaponHits = this.weaponManager.update(delta, this.score, this.enemyManager.enemies);
    
    // Process weapon hits on enemies
    for (const hit of weaponHits) {
      if (hit.enemy.takeDamage(hit.damage)) {
        // Enemy died from this hit
        this.score += hit.enemy.value;
        this.hud.updateScore(this.score);
        
        // Offer weapon selection at score milestones (every 200 points)
        const scoreMilestone = 200;
        const previousScoreMilestone = Math.floor((this.score - hit.enemy.value) / scoreMilestone);
        const currentScoreMilestone = Math.floor(this.score / scoreMilestone);
        
        if (currentScoreMilestone > previousScoreMilestone) {
          // We just crossed a 200-point milestone
          this.weaponManager.lastScoreCheck = currentScoreMilestone;
          console.log("Score milestone reached:", currentScoreMilestone * scoreMilestone);
          this.showWeaponSelection();
        }
      }
    }
    
    // Handle enemy collisions with player
    if (enemyStatus.collision) {
      // Take damage when enemy collides
      this.health -= 10;
      this.hud.updateHealth(this.health);
      
      // Push back enemies when they collide with player
      this.pushbackEnemies();
      
      // Game over condition
      if (this.health <= 0) {
        this.stop();
        // Use the new gameOver function from main.js
        if (window.gameOver) {
          window.gameOver(this.score);
        }
      }
    }
    
    // Add score for killed enemies
    if (enemyStatus.killedEnemies.length > 0) {
      let scoreGain = 0;
      enemyStatus.killedEnemies.forEach(enemy => {
        scoreGain += enemy.value;
      });
      
      this.score += scoreGain;
      this.hud.updateScore(this.score);
      
      // Check for score milestone after adding enemy kills (every 200 points)
      const scoreMilestone = 200;
      const previousScoreMilestone = Math.floor((this.score - scoreGain) / scoreMilestone);
      const currentScoreMilestone = Math.floor(this.score / scoreMilestone);
      
      if (currentScoreMilestone > previousScoreMilestone) {
        // We just crossed a 200-point milestone from enemy kills
        this.weaponManager.lastScoreCheck = currentScoreMilestone;
        console.log("Score milestone reached from kills:", currentScoreMilestone * scoreMilestone);
        this.showWeaponSelection();
      }
    }
  }
  
  showWeaponSelection() {
    console.log("Showing weapon selection...");
    this.isPaused = true;
    
    // Get available weapons from the weapon manager
    const availableWeapons = this.weaponManager.getAvailableWeapons();
    console.log("Available weapons:", availableWeapons.length);
    
    // Define pause/resume logic once
    const pauseGame = () => { 
      this.isPaused = true;
      console.log("Game paused");
    };
    const resumeGame = () => { 
      this.isPaused = false;
      console.log("Game resumed");
    };

    // Show the weapon selection menu with pause/resume callbacks
    this.weaponSelectionMenu.show(availableWeapons, (selectedWeapon) => {
      console.log("Weapon selected:", selectedWeapon.name);
      // Add the selected weapon to the player's arsenal
      this.weaponManager.addWeapon(selectedWeapon);
      
      // Push back enemies after selection
      this.pushbackEnemies();

      // Resume is handled by the menu's hide method now
    }, pauseGame, resumeGame); // Pass pause/resume functions
  }
  
  showStarterWeaponSelection() {
    console.log("Showing starter weapon selection...");
    // Get random starter weapons
    const starterWeapons = this.weaponManager.getRandomStarterWeapons(3);
    console.log("Starter weapons:", starterWeapons.length);
    
    // Define pause/resume logic once
    const pauseGame = () => { 
      this.isPaused = true;
      console.log("Game paused for starter weapon selection");
    };
    const resumeGame = () => { 
      this.isPaused = false;
      console.log("Game resumed after starter weapon selection");
    };

    // Show weapon selection with title for starter weapon
    this.weaponSelectionMenu.showWithTitle(
      starterWeapons, 
      'CHOOSE YOUR STARTER WEAPON', 
      (selectedWeapon) => {
        console.log("Starter weapon selected:", selectedWeapon.name);
        // Add the selected weapon to the player's arsenal
        this.weaponManager.addWeapon(selectedWeapon);
        this.hasSelectedStarterWeapon = true;
        
        // Push back enemies after selection
        this.pushbackEnemies();

        // Resume is handled by the menu's hide method now
      },
      pauseGame, // Pass pause function
      resumeGame // Pass resume function
    );
  }
  
  pushbackEnemies() {
    const playerPosition = this.player.mesh.position;
    const pushbackDistance = 2.5; // 5 * player radius (0.5)
    const pushDirection = new THREE.Vector3();
    
    this.enemyManager.enemies.forEach(enemy => {
      if (enemy.isAlive) {
        // Calculate direction from player to enemy
        pushDirection.subVectors(enemy.mesh.position, playerPosition);
        pushDirection.y = 0; // Keep pushback on the horizontal plane
        
        if (pushDirection.lengthSq() > 0.001) { // Avoid division by zero if enemy is exactly on player
            pushDirection.normalize();
            
            // Calculate new position
            const newPosition = new THREE.Vector3();
            newPosition.copy(enemy.mesh.position).addScaledVector(pushDirection, pushbackDistance);
            
            // Update enemy position
            enemy.mesh.position.copy(newPosition);
        } else {
            // If enemy is too close, just push it in a default direction (e.g., positive X)
            const defaultPush = new THREE.Vector3(pushbackDistance, 0, 0);
            enemy.mesh.position.add(defaultPush);
        }
      }
    });
  }
  
  // Method was defined twice - removed duplicate setupResizeHandler
}
