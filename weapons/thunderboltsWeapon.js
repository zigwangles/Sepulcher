import * as THREE from 'three';
import { Weapon, WeaponCategory } from './baseWeapon.js';

export class ThunderboltsWeapon extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Thunderbolts";
    this.description = "Summons 3 lightning strikes on the closest enemies";
    this.cooldownTime = 5.0; // 5 second cooldown as requested
    this.damage = 35; // High damage per bolt
    this.color = 0xffff00;
    this.category = WeaponCategory.LIGHTNING;
    this.strikeCount = 3; // Number of bolts to summon
    this.strikeDelay = 0.15; // Delay between strikes
    this.pendingStrikes = [];
    this.strikeTimer = 0;
  }
  
  fire() {
    // Instead of creating projectiles immediately, queue up strike targets
    this.queueLightningStrikes();
  }
  
  queueLightningStrikes() {
    // Find the closest N enemies
    const enemies = window.gameEnemies || [];
    const aliveEnemies = enemies.filter(enemy => enemy.isAlive);
    
    // Sort enemies by distance to player
    aliveEnemies.sort((a, b) => {
      const distA = new THREE.Vector3()
        .subVectors(a.mesh.position, this.player.mesh.position)
        .length();
      const distB = new THREE.Vector3()
        .subVectors(b.mesh.position, this.player.mesh.position)
        .length();
      return distA - distB;
    });
    
    // Take up to strikeCount closest enemies
    const targets = aliveEnemies.slice(0, this.strikeCount);
    
    // If we don't have enough enemies, create random strikes
    const missingTargets = this.strikeCount - targets.length;
    for (let i = 0; i < missingTargets; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 10;
      const randomPos = new THREE.Vector3(
        this.player.mesh.position.x + Math.cos(angle) * distance,
        0.01,
        this.player.mesh.position.z + Math.sin(angle) * distance
      );
      
      targets.push({ 
        mesh: { position: randomPos },
        isAlive: true,
        isRandomTarget: true // Mark as random target
      });
    }
    
    // Queue up strikes with a delay between each
    this.pendingStrikes = targets.map((target, index) => ({
      target,
      delay: index * this.strikeDelay,
      timer: index * this.strikeDelay
    }));
  }
  
  update(delta) {
    // First handle the base weapon update (handles cooldown)
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }
    
    // Process any pending lightning strikes
    if (this.pendingStrikes.length > 0) {
      for (let i = this.pendingStrikes.length - 1; i >= 0; i--) {
        const strike = this.pendingStrikes[i];
        
        // Update the strike timer
        strike.timer -= delta;
        
        // If it's time to execute this strike
        if (strike.timer <= 0) {
          this.createLightningStrike(strike.target);
          this.pendingStrikes.splice(i, 1);
        }
      }
    } else if (this.cooldown <= 0 && this.active) {
      // If no strikes are pending and cooldown is ready, fire
      this.fire();
      this.cooldown = this.cooldownTime;
    }
    
    // Clean up any existing lightning bolts
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const bolt = this.projectiles[i];
      
      // Update bolt lifetime
      bolt.age += delta;
      
      // Remove old bolts
      if (bolt.age >= bolt.lifetime) {
        this.scene.remove(bolt);
        this.scene.remove(bolt.impactLight);
        bolt.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.projectiles.splice(i, 1);
      } else {
        // Animate the bolt during its lifetime
        const fadeStart = bolt.lifetime * 0.5;
        if (bolt.age > fadeStart) {
          const opacity = 1 - ((bolt.age - fadeStart) / (bolt.lifetime - fadeStart));
          bolt.material.opacity = opacity;
          
          // Also fade the light
          if (bolt.impactLight) {
            bolt.impactLight.intensity = 1.5 * opacity;
          }
        }
      }
    }
  }
  
  createLightningStrike(target) {
    // Don't strike if the target is no longer alive (could have been killed by a previous bolt)
    if (!target.isAlive) return;
    
    // Create lightning bolt
    const points = [];
    const targetPos = target.mesh.position.clone();
    
    // Start position is high above the target
    const startPos = targetPos.clone();
    startPos.y = 15; // Start from high up
    
    // Add zigzag points for the lightning
    points.push(startPos);
    
    // Number of zigzag segments
    const segments = 6;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const pos = new THREE.Vector3(
        startPos.x * (1 - t) + targetPos.x * t,
        startPos.y * (1 - t) + targetPos.y * t,
        startPos.z * (1 - t) + targetPos.z * t
      );
      
      // Add random zigzag
      const randomOffset = 0.5 * (1 - t); // Zigzag gets smaller as we approach the target
      pos.x += (Math.random() - 0.5) * randomOffset;
      pos.z += (Math.random() - 0.5) * randomOffset;
      
      points.push(pos);
    }
    
    // Add the final target position
    points.push(targetPos);
    
    // Create the lightning geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: this.color,
      linewidth: 3,
      transparent: true,
      opacity: 1.0
    });
    
    const bolt = new THREE.Line(geometry, material);
    bolt.age = 0;
    bolt.lifetime = 0.5; // Half second display time
    
    // Create a point light at the impact point
    const impactLight = new THREE.PointLight(this.color, 1.5, 5);
    impactLight.position.copy(targetPos);
    impactLight.position.y = 0.5; // Slightly above ground
    
    // Link the light to the bolt for easy cleanup
    bolt.impactLight = impactLight;
    
    // Add both to the scene
    this.scene.add(bolt);
    this.scene.add(impactLight);
    
    // Store the bolt for animations/cleanup
    this.projectiles.push(bolt);
    
    // Apply damage if it's a real enemy (not a random target)
    if (!target.isRandomTarget) {
      target.takeDamage(this.damage);
      
      // Create visual impact effect
      this.createImpactEffect(targetPos);
    } else {
      // Still create visual impact for random targets
      this.createImpactEffect(targetPos);
    }
  }
  
  createImpactEffect(position) {
    // Create a circular impact effect on the ground
    const geometry = new THREE.CircleGeometry(0.8, 16);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const impact = new THREE.Mesh(geometry, material);
    impact.rotation.x = -Math.PI / 2; // Lay flat on the ground
    impact.position.copy(position);
    impact.position.y = 0.03; // Slightly above ground to avoid z-fighting
    
    // Create animation properties
    impact.age = 0;
    impact.lifetime = 0.5;
    
    this.scene.add(impact);
    
    // Add to projectiles for cleanup
    this.projectiles.push(impact);
  }
  
  // We don't use the default check collisions as damage is applied directly
  checkCollisions(enemies) {
    return []; // No projectile collisions to check
  }
  
  dispose() {
    // Completely reimplemented method rather than calling super.dispose()
    // This avoids the issue with geometry.dispose() for lines
    
    // Clean up all projectiles
    for (const projectile of this.projectiles) {
      this.scene.remove(projectile);
      
      // For standard meshes, dispose geometry and material
      if (projectile.geometry) projectile.geometry.dispose();
      if (projectile.material) projectile.material.dispose();
      
      // For groups or objects with children, traverse and dispose
      if (projectile.traverse) {
        projectile.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }
      
      // Remove attached lights
      if (projectile.impactLight) {
        this.scene.remove(projectile.impactLight);
      }
    }
    
    this.projectiles = [];
    this.active = false;
  }
} 
