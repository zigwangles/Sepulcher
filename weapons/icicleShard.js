import * as THREE from 'three';
import { Weapon, WeaponCategory } from '../weapon';

export class IcicleShard extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Icicle Shard";
    this.description = "Shoots twin ice shards that slow enemies";
    this.cooldownTime = 0.8;
    this.damage = 15;
    this.color = 0x00ffff;
    this.category = WeaponCategory.ICE;
    this.slowDuration = 3; // Seconds that enemies are slowed
    this.slowAmount = 0.6; // Slow to 60% of original speed
    this.projectileSpeed = 14; // Faster than normal projectiles
  }
  
  fire() {
    // Find the nearest enemy
    const nearestEnemy = this.findNearestEnemy();
    
    if (nearestEnemy) {
      // Calculate direction to the enemy
      const direction = new THREE.Vector3()
        .subVectors(nearestEnemy.mesh.position, this.player.mesh.position)
        .normalize();
      
      // Create two projectiles with slight spread
      const angle = 0.2; // Spread angle in radians
      
      // First projectile (slightly to the left)
      const dir1 = direction.clone();
      dir1.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      const projectile1 = this.createIcicleProjectile(dir1);
      
      // Second projectile (slightly to the right)
      const dir2 = direction.clone();
      dir2.applyAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
      const projectile2 = this.createIcicleProjectile(dir2);
    } else {
      // If no enemies, fire forward
      const forward = new THREE.Vector3(1, 0, 0);
      
      // Create two projectiles with spread
      const angle = 0.2;
      
      const dir1 = forward.clone();
      dir1.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      const projectile1 = this.createIcicleProjectile(dir1);
      
      const dir2 = forward.clone();
      dir2.applyAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
      const projectile2 = this.createIcicleProjectile(dir2);
    }
  }
  
  createIcicleProjectile(direction) {
    // Create a custom icicle-shaped projectile
    const geometry = new THREE.ConeGeometry(0.1, 0.5, 8);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8
    });
    
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.copy(this.player.mesh.position);
    projectile.position.y = 0.05; // Slightly above the ground
    
    // Orient the cone to point in the direction of movement
    const axis = new THREE.Vector3(0, 1, 0);
    const angle = Math.atan2(direction.x, direction.z);
    projectile.rotation.y = angle;
    projectile.rotation.x = Math.PI / 2; // Point the cone horizontally
    
    // Save direction for movement updates
    projectile.direction = direction;
    
    // Store damage value on the projectile
    projectile.damage = this.damage;
    
    // Add special property for slow effect
    projectile.slowEffect = {
      duration: this.slowDuration,
      amount: this.slowAmount
    };
    
    this.scene.add(projectile);
    this.projectiles.push(projectile);
    
    return projectile;
  }
  
  // Override the check collisions method to apply slow effect
  checkCollisions(enemies) {
    const hits = [];
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        
        if (!enemy.isAlive) continue;
        
        const distance = new THREE.Vector3()
          .subVectors(projectile.position, enemy.mesh.position)
          .length();
          
        // If projectile hits an enemy
        if (distance < 0.6) { // Combined radius of projectile and enemy
          // Create special hit with slow effect
          hits.push({
            enemy,
            damage: projectile.damage,
            position: projectile.position.clone(),
            slowEffect: projectile.slowEffect
          });
          
          // Apply slow effect to enemy
          if (enemy.applySlowEffect) {
            enemy.applySlowEffect(projectile.slowEffect.duration, projectile.slowEffect.amount);
          } else {
            // If enemy doesn't have the method yet, add basic slowing capability
            enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
            enemy.speed = enemy.originalSpeed * projectile.slowEffect.amount;
            
            // Reset speed after duration
            setTimeout(() => {
              if (enemy.isAlive) {
                enemy.speed = enemy.originalSpeed;
              }
            }, projectile.slowEffect.duration * 1000);
          }
          
          // Remove the projectile
          this.scene.remove(projectile);
          projectile.geometry.dispose();
          projectile.material.dispose();
          this.projectiles.splice(i, 1);
          
          break; // Projectile can only hit one enemy
        }
      }
    }
    
    return hits;
  }
} 
