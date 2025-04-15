import * as THREE from 'three';
import { Player } from 'player';
import { GridManager } from 'gridManager';
import { InputHandler } from 'inputHandler';
import { HUD } from 'hud';
import { EnemyManager } from 'enemyManager';
import { WeaponManager } from 'weaponManager';
import { WeaponSelectionMenu } from 'weaponSelectionMenu';

export class Game {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isRunning = false;
    this.gameStartTime = 0;
    this.score = 0;
    this.health = 100;
    
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupLights();
    
    this.gridManager = new GridManager(this.scene);
    this.player = new Player(this.scene);
    this.inputHandler = new InputHandler();
    this.hud = new HUD(container);
    this.enemyManager = new EnemyManager(this.scene, this.player);
    this.weaponManager = new WeaponManager(this.scene, this.player);
    this.weaponSelectionMenu = new WeaponSelectionMenu(container);
    
    // Don't start with a weapon - we'll select one at game start
    this.hasSelectedStarterWeapon = false;
    
    // Flag to track if the game is paused (e.g. when showing weapon selection)
    this.isPaused = false;
    
    this.setupResizeHandler();
    
    this.lastTime = 0;
    
    // Render a single frame to show the game background behind the menu
    this.renderer.render(this.scene, this.camera);
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);
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
    this.isRunning = true;
    this.gameStartTime = performance.now() / 1000;
    this.lastTime = this.gameStartTime;
    this.score = 0;
    this.health = 100;
    this.hud.gameTime = 0;
    this.hud.score = 0;
    this.hud.health = 100;
    this.hud.show();
    this.enemyManager.clear(); // Clear any existing enemies
    this.isPaused = true; // Start paused for weapon selection
    
    // Reset weapons
    this.weaponManager.dispose();
    this.weaponManager = new WeaponManager(this.scene, this.player, false); // Don't add default weapon
    
    // Show starter weapon selection
    this.showStarterWeaponSelection();
    
    this.renderer.setAnimationLoop(this.update.bind(this));
  }
  
  stop() {
    this.isRunning = false;
    this.hud.hide();
    this.renderer.setAnimationLoop(null);
    this.weaponManager.dispose();
  }
  
  update(time) {
    if (!this.isRunning) return;
    
    // Don't update game logic if paused (e.g., weapon selection screen is open)
    if (this.isPaused) {
      // Still render the scene, but don't update game state
      this.renderer.render(this.scene, this.camera);
      return;
    }
    
    const timeMs = time;
    const delta = (timeMs - this.lastTime) / 1000;
    this.lastTime = timeMs;
    
    // Update HUD
    this.hud.update(delta);
    
    // Update player position based on input
    const direction = this.inputHandler.getDirection();
    this.player.move(direction, delta);
    
    // Update camera to follow player
    this.camera.position.x = this.player.mesh.position.x;
    this.camera.position.z = this.player.mesh.position.z;
    
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
        
        // Offer weapon selection at score milestones
        const previousScoreMilestone = Math.floor((this.score - hit.enemy.value) / 100);
        const currentScoreMilestone = Math.floor(this.score / 100);
        
        if (currentScoreMilestone > previousScoreMilestone) {
          // We just crossed a 100-point milestone
          this.weaponManager.lastScoreCheck = currentScoreMilestone;
          console.log("Score milestone reached:", currentScoreMilestone * 100);
          this.showWeaponSelection();
        }
      }
    }
    
    // Handle enemy collisions with player
    if (enemyStatus.collision) {
      this.health -= 10; // Take damage when enemy collides
      this.hud.updateHealth(this.health);
      
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
      
      // Check for score milestone after adding enemy kills
      const previousScoreMilestone = Math.floor((this.score - scoreGain) / 100);
      const currentScoreMilestone = Math.floor(this.score / 100);
      
      if (currentScoreMilestone > previousScoreMilestone) {
        // We just crossed a 100-point milestone from enemy kills
        this.weaponManager.lastScoreCheck = currentScoreMilestone;
        console.log("Score milestone reached from kills:", currentScoreMilestone * 100);
        this.showWeaponSelection();
      }
    }
    
    // Natural score increase over time
    if (Math.random() < 0.005) {
      this.score += 5;
      this.hud.updateScore(this.score);
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  showWeaponSelection() {
    // Pause the game while selecting
    this.isPaused = true;
    
    // Get available weapons from the weapon manager
    const availableWeapons = this.weaponManager.getAvailableWeapons();
    
    // Show the weapon selection menu
    this.weaponSelectionMenu.show(availableWeapons, (selectedWeapon) => {
      // Add the selected weapon to the player's arsenal
      this.weaponManager.addWeapon(selectedWeapon);
      
      // Resume the game
      this.isPaused = false;
    });
  }
  
  showStarterWeaponSelection() {
    // Get random starter weapons
    const starterWeapons = this.weaponManager.getRandomStarterWeapons(3);
    
    // Show weapon selection with title for starter weapon
    this.weaponSelectionMenu.showWithTitle(
      starterWeapons, 
      'CHOOSE YOUR STARTER WEAPON', 
      (selectedWeapon) => {
        // Add the selected weapon to the player's arsenal
        this.weaponManager.addWeapon(selectedWeapon);
        this.hasSelectedStarterWeapon = true;
        
        // Resume the game
        this.isPaused = false;
      }
    );
  }
  
  // Method was defined twice - removed duplicate setupResizeHandler
}
