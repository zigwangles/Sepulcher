import * as THREE from 'three';
import { Weapon, WeaponCategory } from '../weapon';

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
