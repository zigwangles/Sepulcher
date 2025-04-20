import * as THREE from 'three';
import { Weapon, WeaponCategory } from '../baseWeapon.js';

export class LeechingTendrilsWeapon extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Leeching Tendrils";
    this.description = "Summons tendrils that damage enemies and heal the player";
    this.cooldownTime = 1.5;
    this.damage = 10; // Per enemy hit
    this.color = 0x990066; // Purple-red
    this.category = WeaponCategory.DARK;
    this.tendrilCount = 4; // Number of tendrils to create
    this.tendrilLength = 10; // Length of each tendril
    this.tendrilWidth = 0.25; // Width of tendrils
    this.tendrilDuration = 2.0; // How long tendrils last
    this.healAmount = 5; // Health restored per enemy hit
    this.healInterval = 0.5; // Seconds between healing pulses
    this.lastHealTime = 0; // Time of last healing
  }
  
  fire() {
    // Create multiple leeching tendrils around the player
    for (let i = 0; i < this.tendrilCount; i++) {
      // Calculate angle for this tendril (evenly spaced around player)
      const angle = (i / this.tendrilCount) * Math.PI * 2;
      
      // Create the tendril
      this.createLeechingTendril(angle);
    }
  }
  
  update(delta) {
    // Update cooldown
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }
    
    // Update healing timer
    this.lastHealTime += delta;
    
    // Update existing tendrils
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const tendril = this.projectiles[i];
      
      // Update tendril lifetime
      tendril.lifetime -= delta;
      
      // Remove tendrils that have expired
      if (tendril.lifetime <= 0) {
        this.scene.remove(tendril);
        tendril.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.projectiles.splice(i, 1);
      } else {
        // Fade out tendril over time
        const opacity = tendril.lifetime / this.tendrilDuration;
        
        tendril.children.forEach(child => {
          if (child.material && child.material.opacity !== undefined) {
            child.material.opacity = opacity;
          }
        });
        
        // If the tendril has a light, adjust its intensity
        if (tendril.light) {
          tendril.light.intensity = 1.0 * opacity;
        }
        
        // Animate the tendril (slight movement)
        if (tendril.curve) {
          // Update control points for a slight writhing effect
          const time = Date.now() * 0.001;
          const baseCurve = tendril.baseCurve;
          
          // Create a new curve with slightly modified control points
          const points = baseCurve.getPoints(20);
          for (let j = 1; j < points.length - 1; j++) {
            // Add some noise to the middle points
            const noise = Math.sin(time + j * 0.5) * 0.2;
            points[j].y += noise;
          }
          
          // Update the geometry
          tendril.geometry.dispose();
          tendril.geometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            20,
            this.tendrilWidth,
            8,
            false
          );
        }
        
        // Check for healing if enough time has passed
        if (this.lastHealTime >= this.healInterval) {
          this.checkHealing(tendril);
          this.lastHealTime = 0;
        }
      }
    }
    
    // Automatically fire if cooldown is ready
    if (this.cooldown <= 0 && this.active) {
      this.fire();
      this.cooldown = this.cooldownTime;
    }
  }
  
  createLeechingTendril(angle) {
    // Create a group to hold the tendril parts
    const tendrilGroup = new THREE.Group();
    tendrilGroup.lifetime = this.tendrilDuration;
    
    // Calculate direction for this tendril
    const direction = new THREE.Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    );
    
    // Create a curved path for the tendril
    const startPoint = this.player.mesh.position.clone();
    startPoint.y = 0.1; // Slightly above ground
    
    const endPoint = startPoint.clone().add(direction.clone().multiplyScalar(this.tendrilLength));
    
    // Create control points for a curved tendril
    const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
    midPoint.y += 0.5; // Curve upward
    
    // Create the curve
    const curve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint);
    tendrilGroup.baseCurve = curve; // Store for animation
    
    // Create the tendril geometry
    const geometry = new THREE.TubeGeometry(curve, 20, this.tendrilWidth, 8, false);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 1
    });
    
    const tendril = new THREE.Mesh(geometry, material);
    tendrilGroup.add(tendril);
    
    // Add a glow effect
    const glowGeometry = new THREE.TubeGeometry(curve, 20, this.tendrilWidth * 1.5, 8, false);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    tendrilGroup.add(glow);
    
    // Add light at the end of the tendril
    const light = new THREE.PointLight(this.color, 1.0, this.tendrilWidth * 3);
    light.position.copy(endPoint);
    tendrilGroup.light = light;
    tendrilGroup.add(light);
    
    // Add to scene and store reference
    this.scene.add(tendrilGroup);
    this.projectiles.push(tendrilGroup);
    
    // Store the curve for animation
    tendrilGroup.curve = curve;
    
    // Check for hits
    this.checkTendrilHits(tendrilGroup, curve);
    
    return tendrilGroup;
  }
  
  checkTendrilHits(tendril, curve) {
    const enemies = window.gameEnemies || [];
    
    // Get points along the curve for hit detection
    const points = curve.getPoints(20);
    
    // Check each enemy against the tendril
    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      
      const enemyPos = enemy.mesh.position.clone();
      enemyPos.y = 0.1; // Same height as tendril
      
      // Check distance to each segment of the tendril
      let hit = false;
      for (let i = 0; i < points.length - 1; i++) {
        const segmentStart = points[i];
        const segmentEnd = points[i + 1];
        
        // Calculate distance from point to line segment
        const v = new THREE.Vector3().subVectors(segmentEnd, segmentStart);
        const w = new THREE.Vector3().subVectors(enemyPos, segmentStart);
        
        const c1 = w.dot(v);
        if (c1 <= 0) {
          // Enemy is before the segment start
          continue;
        }
        
        const c2 = v.dot(v);
        if (c2 <= c1) {
          // Enemy is past the segment end
          continue;
        }
        
        const b = c1 / c2;
        const pointOnLine = new THREE.Vector3().addVectors(segmentStart, v.multiplyScalar(b));
        const distance = new THREE.Vector3().subVectors(enemyPos, pointOnLine).length();
        
        // Check if enemy is within tendril width
        if (distance <= (this.tendrilWidth * 1.5 + 0.4)) { // Add enemy radius
          hit = true;
          break;
        }
      }
      
      // If enemy was hit by the tendril
      if (hit) {
        // Apply damage
        enemy.takeDamage(this.damage);
        
        // Add hit effects
        this.createHitEffect(enemy.mesh.position.clone());
        
        // Add a visual effect to the enemy
        if (enemy.mesh && enemy.mesh.material) {
          enemy.mesh.material.emissive.setHex(this.color);
          enemy.mesh.material.emissiveIntensity = 0.8;
          
          // Reset after a short time
          setTimeout(() => {
            if (enemy.isAlive && enemy.mesh && enemy.mesh.material) {
              enemy.mesh.material.emissiveIntensity = 0.3;
              enemy.mesh.material.emissive.setHex(0xaa0000);
            }
          }, 200);
        }
        
        // Mark this enemy as being leeched
        if (!tendril.leechingEnemies) {
          tendril.leechingEnemies = new Set();
        }
        tendril.leechingEnemies.add(enemy);
      }
    }
  }
  
  checkHealing(tendril) {
    // Check if we have any enemies being leeched
    if (tendril.leechingEnemies && tendril.leechingEnemies.size > 0) {
      // Heal the player
      if (this.player.health < this.player.maxHealth) {
        this.player.health = Math.min(this.player.health + this.healAmount, this.player.maxHealth);
        
        // Update HUD if available
        if (window.updateHUD) {
          window.updateHUD();
        }
        
        // Create healing effect
        this.createHealingEffect(this.player.mesh.position.clone());
      }
    }
  }
  
  createHitEffect(position) {
    // Create a purple mist effect at hit point
    const geometry = new THREE.SphereGeometry(0.4, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6
    });
    
    const hitEffect = new THREE.Mesh(geometry, material);
    hitEffect.position.copy(position);
    hitEffect.position.y = 0.1; // Same height as tendril
    
    // Add animation properties
    hitEffect.lifetime = 0.3;
    hitEffect.scale.set(0.1, 0.1, 0.1);
    
    this.scene.add(hitEffect);
    
    // Animate expansion and fade
    const expandAndFade = () => {
      hitEffect.scale.multiplyScalar(1.1);
      hitEffect.material.opacity -= 0.03;
      
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
  
  createHealingEffect(position) {
    // Create a healing effect at player position
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00, // Green for healing
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6
    });
    
    const healingEffect = new THREE.Mesh(geometry, material);
    healingEffect.position.copy(position);
    healingEffect.position.y = 0.5; // Above player
    
    // Add animation properties
    healingEffect.lifetime = 0.5;
    healingEffect.scale.set(0.1, 0.1, 0.1);
    
    this.scene.add(healingEffect);
    
    // Animate expansion and fade
    const expandAndFade = () => {
      healingEffect.scale.multiplyScalar(1.1);
      healingEffect.material.opacity -= 0.02;
      
      if (healingEffect.material.opacity > 0) {
        requestAnimationFrame(expandAndFade);
      } else {
        this.scene.remove(healingEffect);
        healingEffect.geometry.dispose();
        healingEffect.material.dispose();
      }
    };
    
    expandAndFade();
  }
  
  checkCollisions(enemies) {
    return []; // No projectile collisions to check
  }
  
  dispose() {
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
      if (projectile.light) {
        this.scene.remove(projectile.light);
      }
    }
    
    this.projectiles = [];
    this.active = false;
  }
} 
