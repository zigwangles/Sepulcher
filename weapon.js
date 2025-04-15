import * as THREE from 'three';
// Weapon categories
export const WeaponCategory = {
  ICE: 'ice',
  FIRE: 'fire',
  LIGHTNING: 'lightning',
  LIGHT: 'light',
  DARKNESS: 'darkness',
  EARTH: 'earth',
  SPACE: 'space',
  RANGED: 'ranged',
  MELEE: 'melee'
};
// Base weapon class
export class Weapon {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.cooldown = 0;
    this.projectiles = [];
    this.active = true;
    this.name = "Weapon";
    this.description = "Base weapon";
    this.color = 0xffffff;
    this.damage = 20;
    this.projectileSpeed = 12;
    this.cooldownTime = 0.5;
    this.category = null; // Will hold the weapon category
  }
  
  update(delta) {
    // Update cooldown
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Update position
      projectile.position.x += projectile.direction.x * this.projectileSpeed * delta;
      projectile.position.z += projectile.direction.z * this.projectileSpeed * delta;
      
      // Remove projectiles that are too far away
      const distanceFromPlayer = new THREE.Vector3()
        .subVectors(projectile.position, this.player.mesh.position)
        .length();
        
      if (distanceFromPlayer > 20) {
        this.scene.remove(projectile);
        projectile.geometry.dispose();
        projectile.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }
    
    // Automatically fire if cooldown is ready
    if (this.cooldown <= 0 && this.active) {
      this.fire();
      this.cooldown = this.cooldownTime;
    }
  }
  
  fire() {
    // Find the nearest enemy
    const nearestEnemy = this.findNearestEnemy();
    
    if (nearestEnemy) {
      // Calculate direction to the enemy
      const direction = new THREE.Vector3()
        .subVectors(nearestEnemy.mesh.position, this.player.mesh.position)
        .normalize();
        
      // Create projectile moving in that direction
      this.createProjectile(direction);
    }
  }
  
  // Find the nearest enemy - shared method for all weapons
  findNearestEnemy() {
    // Getting enemies is handled in the weaponManager, which passes them
    // to the checkCollisions method. For firing, we need to find enemies ourselves.
    // This will be filled with actual enemies in the weaponManager update method.
    const enemies = window.gameEnemies || [];
    
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      
      const distance = new THREE.Vector3()
        .subVectors(enemy.mesh.position, this.player.mesh.position)
        .length();
        
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    return nearestEnemy;
  }
  
  // Creates a projectile at the player position moving in the given direction
  createProjectile(direction) {
    const geometry = new THREE.CircleGeometry(0.2, 16);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.7,
      side: THREE.DoubleSide
    });
    
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.copy(this.player.mesh.position);
    projectile.position.y = 0.05; // Slightly above the ground
    projectile.rotation.x = -Math.PI / 2; // Make it flat like the player
    
    // Save direction for movement updates
    projectile.direction = direction;
    
    // Store damage value on the projectile
    projectile.damage = this.damage;
    
    this.scene.add(projectile);
    this.projectiles.push(projectile);
    
    return projectile;
  }
  
  // Check collision between all projectiles and all enemies
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
          hits.push({
            enemy,
            damage: projectile.damage,
            position: projectile.position.clone()
          });
          
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
  
  dispose() {
    // Clean up projectiles when weapon is discarded
    for (const projectile of this.projectiles) {
      this.scene.remove(projectile);
      
      // Safely dispose of geometry and material if they exist
      if (projectile.geometry) projectile.geometry.dispose();
      if (projectile.material) projectile.material.dispose();
    }
    this.projectiles = [];
    this.active = false;
  }
}
// Ice Weapon - Icicle Shard
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
// Fire Weapon - Fire Storm
export class FireStorm extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Fire Storm";
    this.description = "Shoots fire that burns the ground behind it";
    this.cooldownTime = 1.2;
    this.damage = 10; // Initial impact damage
    this.color = 0xff4400;
    this.category = WeaponCategory.FIRE;
    this.burnDuration = 3; // Seconds that ground burns
    this.burnTickDamage = 5; // Damage per tick for enemies in burn area
    this.projectileSpeed = 8; // Slower than normal projectiles
    this.burnAreas = []; // Array to track active burn areas
  }
  
  fire() {
    // Find the nearest enemy
    const nearestEnemy = this.findNearestEnemy();
    
    let direction;
    if (nearestEnemy) {
      // Calculate direction to the enemy
      direction = new THREE.Vector3()
        .subVectors(nearestEnemy.mesh.position, this.player.mesh.position)
        .normalize();
    } else {
      // If no enemies, fire in a random direction
      const angle = Math.random() * Math.PI * 2;
      direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    }
    
    // Create a fire projectile
    this.createFireProjectile(direction);
  }
  
  createFireProjectile(direction) {
    // Create a cube for the fire block
    const geometry = new THREE.BoxGeometry(1, 0.2, 1);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
    
    const projectile = new THREE.Mesh(geometry, material);
    projectile.position.copy(this.player.mesh.position);
    projectile.position.y = 0.1; // Slightly above the ground
    
    // Save direction for movement updates
    projectile.direction = direction;
    
    // Store damage value on the projectile
    projectile.damage = this.damage;
    
    // Add trail timer to track how long the projectile has been moving
    projectile.trailTimer = 0;
    
    // Last position where we added a burn area
    projectile.lastBurnPosition = new THREE.Vector3().copy(projectile.position);
    
    // Add flames with randomized movement
    this.addFlameParticles(projectile);
    
    this.scene.add(projectile);
    this.projectiles.push(projectile);
    
    return projectile;
  }
  
  addFlameParticles(projectile) {
    // Create small flame particles on the fire block
    const particleCount = 5;
    projectile.particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00, // Yellow-orange for flames
        emissive: 0xffaa00,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.7
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Position randomly within the fire block
      particle.position.set(
        (Math.random() - 0.5) * 0.5,
        0.1 + Math.random() * 0.1,
        (Math.random() - 0.5) * 0.5
      );
      
      // Add random movement variables
      particle.speed = {
        x: (Math.random() - 0.5) * 2,
        y: 1 + Math.random(),
        z: (Math.random() - 0.5) * 2
      };
      
      // Add lifetime
      particle.lifetime = 0.5 + Math.random() * 0.5;
      particle.age = 0;
      
      projectile.add(particle);
      projectile.particles.push(particle);
    }
  }
  
  update(delta) {
    super.update(delta);
    
    // Update burn areas
    for (let i = this.burnAreas.length - 1; i >= 0; i--) {
      const burnArea = this.burnAreas[i];
      
      // Update burn timer
      burnArea.timeLeft -= delta;
      
      // Apply damage tick to enemies in the burn area
      if (burnArea.tickTimer <= 0) {
        this.applyBurnDamage(burnArea);
        // Reset tick timer (damage every 0.5 seconds)
        burnArea.tickTimer = 0.5;
      } else {
        burnArea.tickTimer -= delta;
      }
      
      // Update burn visual effect
      burnArea.material.opacity = Math.min(0.7, burnArea.timeLeft / this.burnDuration);
      
      // Remove burn area when time is up
      if (burnArea.timeLeft <= 0) {
        this.scene.remove(burnArea);
        burnArea.material.dispose();
        burnArea.geometry.dispose();
        this.burnAreas.splice(i, 1);
      }
    }
    
    // Additional update for fire projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Update trail timer
      projectile.trailTimer += delta;
      
      // Check if we should place a new burn area (every 0.2 seconds of travel)
      const distanceFromLastBurn = new THREE.Vector3()
        .subVectors(projectile.position, projectile.lastBurnPosition)
        .length();
        
      if (distanceFromLastBurn > 0.8) {
        // Create a burn area at the current position
        this.createBurnArea(projectile.position);
        
        // Update last burn position
        projectile.lastBurnPosition.copy(projectile.position);
      }
      
      // Update flame particles
      if (projectile.particles) {
        for (let j = projectile.particles.length - 1; j >= 0; j--) {
          const particle = projectile.particles[j];
          
          // Update position
          particle.position.x += particle.speed.x * delta * 0.2;
          particle.position.y += particle.speed.y * delta * 0.2;
          particle.position.z += particle.speed.z * delta * 0.2;
          
          // Update age and opacity
          particle.age += delta;
          particle.material.opacity = Math.max(0, 1 - (particle.age / particle.lifetime));
          
          // Remove old particles
          if (particle.age >= particle.lifetime) {
            projectile.remove(particle);
            particle.material.dispose();
            particle.geometry.dispose();
            projectile.particles.splice(j, 1);
            
            // Create new particle to replace
            if (projectile.particles.length < 5 && this.projectiles.includes(projectile)) {
              this.addFlameParticle(projectile);
            }
          }
        }
      }
    }
  }
  
  addFlameParticle(projectile) {
    const particleGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Position randomly within the fire block
    particle.position.set(
      (Math.random() - 0.5) * 0.5,
      0.1 + Math.random() * 0.1,
      (Math.random() - 0.5) * 0.5
    );
    
    // Add random movement variables
    particle.speed = {
      x: (Math.random() - 0.5) * 2,
      y: 1 + Math.random(),
      z: (Math.random() - 0.5) * 2
    };
    
    // Add lifetime
    particle.lifetime = 0.5 + Math.random() * 0.5;
    particle.age = 0;
    
    projectile.add(particle);
    projectile.particles.push(particle);
  }
  
  createBurnArea(position) {
    // Create a circular burn area on the ground
    const geometry = new THREE.CircleGeometry(0.8, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const burnArea = new THREE.Mesh(geometry, material);
    burnArea.rotation.x = -Math.PI / 2; // Flat on the ground
    burnArea.position.copy(position);
    burnArea.position.y = 0.02; // Just above the ground
    
    // Add properties to track burn area lifetime
    burnArea.timeLeft = this.burnDuration;
    burnArea.tickTimer = 0.5; // Time until next damage tick
    burnArea.tickDamage = this.burnTickDamage;
    
    this.scene.add(burnArea);
    this.burnAreas.push(burnArea);
  }
  
  applyBurnDamage(burnArea) {
    const enemies = window.gameEnemies || [];
    
    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      
      // Check if enemy is in burn area
      const distance = new THREE.Vector3()
        .subVectors(burnArea.position, enemy.mesh.position)
        .length();
        
      if (distance < 1.0) { // If enemy is within burn radius
        enemy.takeDamage(burnArea.tickDamage);
        
        // Add a visual burning effect to the enemy
        if (enemy.mesh && enemy.mesh.material) {
          enemy.mesh.material.emissive.setHex(0xff2200);
          enemy.mesh.material.emissiveIntensity = 0.5;
          
          // Reset after a short time
          setTimeout(() => {
            if (enemy.isAlive && enemy.mesh && enemy.mesh.material) {
              enemy.mesh.material.emissiveIntensity = 0.3;
              enemy.mesh.material.emissive.setHex(0xaa0000);
            }
          }, 200);
        }
      }
    }
  }
  
  dispose() {
    super.dispose();
    
    // Clean up burn areas
    for (const burnArea of this.burnAreas) {
      this.scene.remove(burnArea);
      burnArea.geometry.dispose();
      burnArea.material.dispose();
    }
    this.burnAreas = [];
  }
}
// Lightning Weapon - Thunderbolts
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
  // Removed duplicate code block that was incorrectly placed outside any method
}
// Light Weapon - Light Beam
export class LightBeamWeapon extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Light Beam";
    this.description = "Creates a beam of light through multiple enemies";
    this.cooldownTime = 0.8;
    this.damage = 15; // Per enemy hit
    this.color = 0xffffff; // Pure white
    this.category = WeaponCategory.LIGHT;
    this.beamMaxLength = 20; // Maximum beam length
    this.beamWidth = 0.5; // Beam width
    this.beamDuration = 0.4; // How long each beam lasts
    this.rotationSpeed = Math.PI * 0.8; // Radians per second
    this.currentAngle = 0; // Current rotation angle
    this.beamHitEnemies = new Set(); // Track enemies hit by current beam
  }
  
  fire() {
    // Create a beam of light in current direction
    this.createLightBeam();
    
    // Reset the set of hit enemies for the new beam
    this.beamHitEnemies = new Set();
  }
  
  update(delta) {
    // Update cooldown
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }
    
    // Update beam rotation angle
    this.currentAngle += this.rotationSpeed * delta;
    if (this.currentAngle > Math.PI * 2) {
      this.currentAngle -= Math.PI * 2;
    }
    
    // Update existing beams
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const beam = this.projectiles[i];
      
      // Update beam lifetime
      beam.lifetime -= delta;
      
      // Remove beams that have expired
      if (beam.lifetime <= 0) {
        this.scene.remove(beam);
        beam.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.projectiles.splice(i, 1);
      } else {
        // Fade out beam over time
        const opacity = beam.lifetime / this.beamDuration;
        
        beam.children.forEach(child => {
          if (child.material && child.material.opacity !== undefined) {
            child.material.opacity = opacity;
          }
        });
        
        // If the beam has a light, adjust its intensity
        if (beam.light) {
          beam.light.intensity = 1.5 * opacity;
        }
      }
    }
    
    // Automatically fire if cooldown is ready
    if (this.cooldown <= 0 && this.active) {
      this.fire();
      this.cooldown = this.cooldownTime;
    }
  }
  
  createLightBeam() {
    // Create a group to hold the beam parts
    const beamGroup = new THREE.Group();
    beamGroup.lifetime = this.beamDuration;
    
    // Calculate beam direction based on currentAngle
    const direction = new THREE.Vector3(
      Math.cos(this.currentAngle),
      0,
      Math.sin(this.currentAngle)
    );
    
    // Store direction on the beam group for hit detection
    beamGroup.direction = direction.clone();
    beamGroup.origin = this.player.mesh.position.clone();
    
    // Create main beam
    const geometry = new THREE.BoxGeometry(this.beamMaxLength, this.beamWidth * 0.2, this.beamWidth);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 1
    });
    
    const beam = new THREE.Mesh(geometry, material);
    
    // Position the beam relative to the player
    // Place the center of the beam at half its length away from the player in the direction
    beam.position.copy(direction.clone().multiplyScalar(this.beamMaxLength / 2));
    
    // Rotate the beam to point in the right direction
    beam.rotation.y = Math.atan2(direction.x, direction.z) - Math.PI / 2;
    
    // Add a glow effect around the beam
    const glowGeometry = new THREE.BoxGeometry(this.beamMaxLength, this.beamWidth * 0.6, this.beamWidth * 1.5);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(beam.position);
    glow.rotation.copy(beam.rotation);
    
    // Add light
    const light = new THREE.PointLight(this.color, 1.5, this.beamWidth * 4);
    light.position.set(0, 0, 0); // Center of the beam group
    beamGroup.light = light;
    
    // Add beam components to group
    beamGroup.add(beam);
    beamGroup.add(glow);
    beamGroup.add(light);
    
    // Position the beam group at the player
    beamGroup.position.copy(this.player.mesh.position);
    beamGroup.position.y = 0.3; // Slightly above ground
    
    // Add to scene and store reference
    this.scene.add(beamGroup);
    this.projectiles.push(beamGroup);
    
    // Immediately check for hits
    this.checkBeamHits(beamGroup);
    
    return beamGroup;
  }
  
  checkBeamHits(beam) {
    const enemies = window.gameEnemies || [];
    const hits = [];
    
    // Create a raycaster for beam hit detection
    const raycaster = new THREE.Raycaster(
      beam.origin.clone(),
      beam.direction.clone(),
      0,
      this.beamMaxLength
    );
    
    // Collect all enemies that intersect with the beam
    for (const enemy of enemies) {
      if (!enemy.isAlive || this.beamHitEnemies.has(enemy)) continue;
      
      // Check if enemy is in beam's path
      // Calculate distance from enemy to beam line
      const enemyPos = enemy.mesh.position.clone();
      enemyPos.y = beam.position.y; // Ensure we're checking on the same plane
      
      // Project enemy position onto beam's axis
      const beamStart = beam.position.clone();
      const beamEnd = beamStart.clone().add(beam.direction.clone().multiplyScalar(this.beamMaxLength));
      
      // Calculate distance from point to line segment
      const v = new THREE.Vector3().subVectors(beamEnd, beamStart);
      const w = new THREE.Vector3().subVectors(enemyPos, beamStart);
      
      const c1 = w.dot(v);
      if (c1 <= 0) {
        // Enemy is before the beam start
        continue;
      }
      
      const c2 = v.dot(v);
      if (c2 <= c1) {
        // Enemy is past the beam end
        continue;
      }
      
      const b = c1 / c2;
      const pointOnLine = new THREE.Vector3().addVectors(beamStart, v.multiplyScalar(b));
      const distance = new THREE.Vector3().subVectors(enemyPos, pointOnLine).length();
      
      // Check if enemy is within beam width
      if (distance <= (this.beamWidth * 1.5 + 0.4)) { // Add enemy radius
        // Mark this enemy as hit by the current beam
        this.beamHitEnemies.add(enemy);
        
        // Apply damage
        enemy.takeDamage(this.damage);
        
        // Add hit effects
        this.createHitEffect(enemy.mesh.position.clone());
        
        // Add a visual effect to the enemy
        if (enemy.mesh && enemy.mesh.material) {
          enemy.mesh.material.emissive.setHex(0xffffff);
          enemy.mesh.material.emissiveIntensity = 0.8;
          
          // Reset after a short time
          setTimeout(() => {
            if (enemy.isAlive && enemy.mesh && enemy.mesh.material) {
              enemy.mesh.material.emissiveIntensity = 0.3;
              enemy.mesh.material.emissive.setHex(0xaa0000);
            }
          }, 200);
        }
      }
    }
  }
  
  createHitEffect(position) {
    // Create a flash effect at hit point
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8
    });
    
    const hitEffect = new THREE.Mesh(geometry, material);
    hitEffect.position.copy(position);
    hitEffect.position.y = 0.3; // Same height as beam
    
    // Add animation properties
    hitEffect.lifetime = 0.2;
    hitEffect.scale.set(0.1, 0.1, 0.1);
    
    this.scene.add(hitEffect);
    
    // Animate expansion and fade
    const expandAndFade = () => {
      hitEffect.scale.multiplyScalar(1.1);
      hitEffect.material.opacity -= 0.05;
      
      if (hitEffect.material.opacity > 0) {
        requestAnimationFrame(expandAndFade);
      } else {
        this.scene.remove(hitEffect);
        hitEffect.geometry.dispose();
        hitEffect.material.dispose();
      }
    };
    
    expandAndFade();
  }
  
  // We don't use the regular checkCollisions method since beam hits are handled differently
  checkCollisions(enemies) {
    return [];
  }
  
  dispose() {
    super.dispose();
  }
}
// Weapon category helper functions
export function getCategoryColor(category) {
  switch(category) {
    case WeaponCategory.ICE:
      return 0x00ffff; // Cyan
    case WeaponCategory.FIRE:
      return 0xff4400; // Orange-red
    case WeaponCategory.LIGHTNING:
      return 0xffff00; // Yellow
    case WeaponCategory.LIGHT:
      return 0xffffff; // White
    case WeaponCategory.DARKNESS:
      return 0x440088; // Dark purple
    case WeaponCategory.EARTH:
      return 0x885500; // Brown
    case WeaponCategory.SPACE:
      return 0x5500ff; // Purple
    case WeaponCategory.RANGED:
      return 0x00aa44; // Green
    case WeaponCategory.MELEE:
      return 0xff0000; // Red
    default:
      return 0xcccccc; // Gray (default)
  }
}
// Darkness Weapon - Dark Tendrils
export class DarkTendrils extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Dark Tendrils";
    this.description = "Shoots tendrils that sap enemy health";
    this.cooldownTime = 1.5;
    this.damage = 12; // Base damage
    this.color = 0x440088; // Dark purple
    this.category = WeaponCategory.DARKNESS;
    this.projectileSpeed = 10;
    this.maxTendrils = 3; // Maximum number of tendrils active at once
    this.tendrilLifetime = 2.0; // How long tendrils stay attached
    this.healthReturn = 0.2; // 20% of damage dealt returns as health
  }
  
  fire() {
    // Only fire if we have less than max tendrils active
    if (this.projectiles.filter(p => p.isAttached).length >= this.maxTendrils) {
      return;
    }
    
    // Find the nearest enemy
    const nearestEnemy = this.findNearestEnemy();
    
    if (nearestEnemy) {
      // Calculate direction to the enemy
      const direction = new THREE.Vector3()
        .subVectors(nearestEnemy.mesh.position, this.player.mesh.position)
        .normalize();
        
      // Create tendril moving in that direction
      this.createTendril(direction, nearestEnemy);
    } else {
      // If no enemies, fire in a random direction
      const angle = Math.random() * Math.PI * 2;
      const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      this.createTendril(direction);
    }
  }
  
  createTendril(direction, targetEnemy = null) {
    // Create a dark tendril
    const geometry = new THREE.CylinderGeometry(0.05, 0.1, 0.6, 8);
    geometry.rotateX(Math.PI / 2); // Rotate to point forward
    
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8
    });
    
    const tendril = new THREE.Mesh(geometry, material);
    tendril.position.copy(this.player.mesh.position);
    tendril.position.y = 0.1; // Slightly above the ground
    
    // Orient the tendril to face the direction of movement
    tendril.lookAt(new THREE.Vector3(
      tendril.position.x + direction.x,
      tendril.position.y,
      tendril.position.z + direction.z
    ));
    
    // Save properties for movement updates
    tendril.direction = direction.clone();
    tendril.damage = this.damage;
    tendril.isAttached = false;
    tendril.targetEnemy = targetEnemy;
    tendril.lifetime = 0;
    tendril.maxLifetime = this.tendrilLifetime;
    tendril.startLength = 0.6;
    tendril.healthDrainInterval = 0.5; // Drain health every 0.5 seconds
    tendril.lastDrainTime = 0;
    tendril.segments = [];
    
    this.scene.add(tendril);
    this.projectiles.push(tendril);
    
    return tendril;
  }
  
  update(delta) {
    // First update cooldown
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }
    
    // Update each tendril
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const tendril = this.projectiles[i];
      
      if (tendril.isAttached) {
        // Handle attached tendrils
        this.updateAttachedTendril(tendril, delta);
      } else {
        // Move unattached tendrils
        tendril.position.x += tendril.direction.x * this.projectileSpeed * delta;
        tendril.position.z += tendril.direction.z * this.projectileSpeed * delta;
        
        // Remove if too far away
        const distanceFromPlayer = new THREE.Vector3()
          .subVectors(tendril.position, this.player.mesh.position)
          .length();
          
        if (distanceFromPlayer > 20) {
          this.removeTendril(i);
        }
      }
    }
    
    // Fire automatically if cooldown is ready
    if (this.cooldown <= 0 && this.active) {
      this.fire();
      this.cooldown = this.cooldownTime;
    }
  }
  
  updateAttachedTendril(tendril, delta) {
    // Check if target enemy is still alive
    if (!tendril.targetEnemy || !tendril.targetEnemy.isAlive) {
      this.removeTendril(this.projectiles.indexOf(tendril));
      return;
    }
    
    // Update lifetime
    tendril.lifetime += delta;
    if (tendril.lifetime >= tendril.maxLifetime) {
      this.removeTendril(this.projectiles.indexOf(tendril));
      return;
    }
    
    // Move the end point to follow the enemy
    this.updateTendrilGeometry(tendril);
    
    // Drain health at intervals
    tendril.lastDrainTime += delta;
    if (tendril.lastDrainTime >= tendril.healthDrainInterval) {
      this.drainEnemyHealth(tendril);
      tendril.lastDrainTime = 0;
    }
    
    // Visual pulsing effect
    const pulseScale = 1 + 0.1 * Math.sin(tendril.lifetime * 5);
    tendril.material.emissiveIntensity = 0.5 + 0.2 * Math.sin(tendril.lifetime * 8);
  }
  
  updateTendrilGeometry(tendril) {
    // Remove existing segments
    for (const segment of tendril.segments) {
      this.scene.remove(segment);
      segment.geometry.dispose();
      segment.material.dispose();
    }
    tendril.segments = [];
    
    // Create new connection between player and enemy
    if (tendril.targetEnemy && tendril.targetEnemy.isAlive) {
      const startPos = this.player.mesh.position.clone();
      startPos.y = 0.1;
      const endPos = tendril.targetEnemy.mesh.position.clone();
      endPos.y = 0.1;
      
      // Create a curved path for the tendril
      const distance = startPos.distanceTo(endPos);
      const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
      
      // Add some randomized wave motion to the midpoint
      const time = tendril.lifetime * 3;
      midPoint.x += Math.sin(time) * 0.5;
      midPoint.z += Math.cos(time * 0.7) * 0.5;
      midPoint.y += 0.5 + Math.sin(time * 1.5) * 0.3;
      
      // Create curve
      const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
      
      // Create segments along the curve
      const segmentCount = Math.max(3, Math.floor(distance * 2));
      const segmentLength = distance / segmentCount;
      
      for (let i = 0; i < segmentCount; i++) {
        const t1 = i / segmentCount;
        const t2 = (i + 1) / segmentCount;
        
        const point1 = curve.getPoint(t1);
        const point2 = curve.getPoint(t2);
        
        const segLength = point1.distanceTo(point2);
        const midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
        
        // Create a segment
        const segGeometry = new THREE.CylinderGeometry(0.05, 0.07, segLength, 6);
        const segMaterial = new THREE.MeshStandardMaterial({
          color: this.color,
          emissive: this.color,
          emissiveIntensity: 0.6 - (i / segmentCount) * 0.3, // Fade intensity along length
          transparent: true,
          opacity: 0.8 - (i / segmentCount) * 0.4 // Fade opacity along length
        });
        
        const segment = new THREE.Mesh(segGeometry, segMaterial);
        segment.position.copy(midpoint);
        
        // Orient segment to point from point1 to point2
        segment.lookAt(point2);
        segment.rotateX(Math.PI / 2);
        
        this.scene.add(segment);
        tendril.segments.push(segment);
      }
    }
  }
  
  drainEnemyHealth(tendril) {
    if (!tendril.targetEnemy || !tendril.targetEnemy.isAlive) return;
    
    // Apply damage
    const damageAmount = tendril.damage * 0.5; // Half damage per tick
    tendril.targetEnemy.takeDamage(damageAmount);
    
    // Heal player
    if (window.gameInstance && window.gameInstance.health < 100) {
      const healAmount = damageAmount * this.healthReturn;
      window.gameInstance.health = Math.min(100, window.gameInstance.health + healAmount);
      window.gameInstance.hud.updateHealth(window.gameInstance.health);
      
      // Visual feedback for health gain
      this.createHealEffect();
    }
  }
  
  createHealEffect() {
    // Create a visual effect around the player to show healing
    const geometry = new THREE.RingGeometry(0.6, 0.7, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x880088,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2; // Lay flat
    ring.position.copy(this.player.mesh.position);
    ring.position.y = 0.05;
    
    this.scene.add(ring);
    
    // Animate and remove
    const expandAndFade = () => {
      ring.scale.multiplyScalar(1.05);
      ring.material.opacity -= 0.05;
      
      if (ring.material.opacity > 0) {
        requestAnimationFrame(expandAndFade);
      } else {
        this.scene.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
      }
    };
    
    expandAndFade();
  }
  
  checkCollisions(enemies) {
    const hits = [];
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const tendril = this.projectiles[i];
      
      // Skip already attached tendrils
      if (tendril.isAttached) continue;
      
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        
        if (!enemy.isAlive) continue;
        
        const distance = new THREE.Vector3()
          .subVectors(tendril.position, enemy.mesh.position)
          .length();
          
        // If tendril hits an enemy
        if (distance < 0.7) { // Combined radius
          hits.push({
            enemy,
            damage: tendril.damage,
            position: tendril.position.clone()
          });
          
          // Attach to this enemy
          tendril.isAttached = true;
          tendril.targetEnemy = enemy;
          tendril.lifetime = 0;
          
          // Create connection between player and enemy
          this.updateTendrilGeometry(tendril);
          
          break; // Tendril can only attach to one enemy
        }
      }
    }
    
    return hits;
  }
  
  removeTendril(index) {
    if (index < 0 || index >= this.projectiles.length) return;
    
    const tendril = this.projectiles[index];
    
    // Remove segments
    for (const segment of tendril.segments) {
      this.scene.remove(segment);
      segment.geometry.dispose();
      segment.material.dispose();
    }
    
    // Remove main tendril mesh
    this.scene.remove(tendril);
    tendril.geometry.dispose();
    tendril.material.dispose();
    
    // Remove from array
    this.projectiles.splice(index, 1);
  }
  
  dispose() {
    // Remove all tendril segments
    for (const tendril of this.projectiles) {
      for (const segment of tendril.segments || []) {
        this.scene.remove(segment);
        segment.geometry.dispose();
        segment.material.dispose();
      }
    }
    
    // Call parent dispose
    super.dispose();
  }
}
export function getCategoryIcon(category) {
  // These could be replaced with actual icon paths if assets are available
  return category;
}
export function getCategoryDescription(category) {
  switch(category) {
    case WeaponCategory.ICE:
      return "Freezing attacks that slow enemies";
    case WeaponCategory.FIRE:
      return "Burning attacks with damage over time";
    case WeaponCategory.LIGHTNING:
      return "Electric attacks that can chain between enemies";
    case WeaponCategory.LIGHT:
      return "Radiant attacks that pierce through enemies";
    case WeaponCategory.DARKNESS:
      return "Shadow attacks that weaken enemies";
    case WeaponCategory.EARTH:
      return "Stone and nature attacks with area effects";
    case WeaponCategory.SPACE:
      return "Cosmic attacks that distort reality";
    case WeaponCategory.RANGED:
      return "Physical projectiles fired from a distance";
    case WeaponCategory.MELEE:
      return "Close-range physical attacks";
    default:
      return "Unknown attack type";
  }
}
