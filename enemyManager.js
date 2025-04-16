import { Enemy } from './enemy.js';
import * as THREE from 'three';

export class EnemyManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.enemies = [];
    this.spawnTimer = 0;
    this.baseSpawnRate = 3; // Base seconds between spawns
    this.minSpawnRate = 0.5; // Minimum seconds between spawns (at high score)
    this.spawnDistance = 15; // Distance from player to spawn enemies
  }
  
  update(delta, score) {
    // Update spawn timer
    this.spawnTimer -= delta;
    
    // Calculate spawn rate based on score
    // As score increases, spawn rate increases (time between spawns decreases)
    const scoreSpawnReduction = Math.min(2.5, score / 200); // Cap the reduction
    const currentSpawnRate = Math.max(this.minSpawnRate, this.baseSpawnRate - scoreSpawnReduction);
    
    // Spawn new enemy if timer is up
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = currentSpawnRate;
    }
    
    // Update all enemies and check for collisions
    let collisionDetected = false;
    const deadEnemies = [];
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (!enemy.isAlive) {
        // Remove dead enemies from the array
        deadEnemies.push(enemy);
        this.enemies.splice(i, 1);
        continue;
      }
      
      // Update enemy and check for collision
      const hasCollided = enemy.update(delta);
      if (hasCollided) {
        collisionDetected = true;
      }
    }
    
    return {
      collision: collisionDetected,
      killedEnemies: deadEnemies
    };
  }
  
  // Add method to get all enemies for weapon targeting
  getEnemies() {
    return this.enemies;
  }
  
  spawnEnemy() {
    // Generate a random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Calculate position at a fixed distance from player but at random angle
    const spawnPos = new THREE.Vector3(
      this.player.mesh.position.x + Math.cos(angle) * this.spawnDistance,
      0.02, // Slightly above the ground
      this.player.mesh.position.z + Math.sin(angle) * this.spawnDistance
    );
    
    // Create new enemy and add to array
    const enemy = new Enemy(this.scene, this.player, spawnPos);
    this.enemies.push(enemy);
  }
  
  clear() {
    // Remove all enemies (for game restart)
    for (const enemy of this.enemies) {
      enemy.die();
    }
    this.enemies = [];
    this.spawnTimer = this.baseSpawnRate;
  }
}
