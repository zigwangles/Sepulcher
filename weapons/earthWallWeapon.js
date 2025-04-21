import * as THREE from 'three';
import { Weapon, WeaponCategory } from './baseWeapon.js';

export class EarthWallWeapon extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Earth Wall";
    this.description = "Creates a wall of earth that blocks enemies";
    this.cooldownTime = 3.0;
    this.damage = 20; // Damage to enemies that hit the wall
    this.color = 0x8B4513; // Brown color for earth
    this.category = WeaponCategory.EARTH;
    this.wallWidth = 3.0; // Width of the wall
    this.wallHeight = 2.0; // Height of the wall
    this.wallThickness = 0.5; // Thickness of the wall
    this.wallDuration = 5.0; // How long the wall lasts
    this.wallDistance = 5.0; // Distance in front of player to place wall
    this.knockbackForce = 3.0; // Force to push enemies back
  }
  
  fire() {
    // Create an earth wall in front of the player
    this.createEarthWall();
  }
  
  update(delta) {
    // Update cooldown
    if (this.cooldown > 0) {
      this.cooldown -= delta;
    }
    
    // Update existing walls
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const wall = this.projectiles[i];
      
      // Update wall lifetime
      wall.lifetime -= delta;
      
      // Remove walls that have expired
      if (wall.lifetime <= 0) {
        this.scene.remove(wall);
        wall.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.projectiles.splice(i, 1);
        
        // Remove from global earth walls array
        if (window.gameEarthWalls) {
          const index = window.gameEarthWalls.indexOf(wall);
          if (index !== -1) {
            window.gameEarthWalls.splice(index, 1);
          }
        }
      } else {
        // Fade out wall over time
        const opacity = wall.lifetime / this.wallDuration;
        
        wall.children.forEach(child => {
          if (child.material && child.material.opacity !== undefined) {
            child.material.opacity = opacity;
          }
        });
        
        // If the wall has a light, adjust its intensity
        if (wall.light) {
          wall.light.intensity = 0.5 * opacity;
        }
        
        // Check for enemy collisions with the wall
        this.checkWallCollisions(wall);
      }
    }
    
    // Automatically fire if cooldown is ready
    if (this.cooldown <= 0 && this.active) {
      this.fire();
      this.cooldown = this.cooldownTime;
    }
  }
  
  createEarthWall() {
    // Create a group to hold the wall parts
    const wallGroup = new THREE.Group();
    wallGroup.lifetime = this.wallDuration;
    
    // Get player's forward direction
    const playerDirection = new THREE.Vector3(1, 0, 0);
    playerDirection.applyQuaternion(this.player.mesh.quaternion);
    
    // Calculate wall position (in front of player)
    const wallPosition = this.player.mesh.position.clone().add(
      playerDirection.clone().multiplyScalar(this.wallDistance)
    );
    wallPosition.y = this.wallHeight / 2; // Center vertically
    
    // Create the wall geometry
    const geometry = new THREE.BoxGeometry(
      this.wallWidth,
      this.wallHeight,
      this.wallThickness
    );
    
    // Create materials for different sides of the wall
    const materials = [
      new THREE.MeshStandardMaterial({ color: this.color }), // right
      new THREE.MeshStandardMaterial({ color: this.color }), // left
      new THREE.MeshStandardMaterial({ color: this.color }), // top
      new THREE.MeshStandardMaterial({ color: this.color }), // bottom
      new THREE.MeshStandardMaterial({ color: this.color }), // front
      new THREE.MeshStandardMaterial({ color: this.color })  // back
    ];
    
    const wall = new THREE.Mesh(geometry, materials);
    wall.position.copy(wallPosition);
    
    // Rotate the wall to face the player's direction
    wall.rotation.y = Math.atan2(playerDirection.x, playerDirection.z);
    
    // Add some random rotation for a more natural look
    wall.rotation.z = (Math.random() - 0.5) * 0.1;
    wall.rotation.x = (Math.random() - 0.5) * 0.1;
    
    wallGroup.add(wall);
    
    // Add a glow effect
    const glowGeometry = new THREE.BoxGeometry(
      this.wallWidth + 0.2,
      this.wallHeight + 0.2,
      this.wallThickness + 0.2
    );
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(wall.position);
    glow.rotation.copy(wall.rotation);
    wallGroup.add(glow);
    
    // Add light
    const light = new THREE.PointLight(this.color, 0.5, this.wallWidth);
    light.position.copy(wallPosition);
    wallGroup.light = light;
    wallGroup.add(light);
    
    // Add to scene and store reference
    this.scene.add(wallGroup);
    this.projectiles.push(wallGroup);
    
    // Add to global earth walls array for collision detection
    if (!window.gameEarthWalls) {
      window.gameEarthWalls = [];
    }
    window.gameEarthWalls.push(wallGroup);
    
    // Create wall emergence effect
    this.createWallEmergenceEffect(wallPosition, wall.rotation);
    
    return wallGroup;
  }
  
  checkWallCollisions(wall) {
    const enemies = window.gameEnemies || [];
    
    // Get wall bounds for collision detection
    const wallBounds = new THREE.Box3().setFromObject(wall);
    
    // Check each enemy against the wall
    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      
      const enemyPos = enemy.mesh.position.clone();
      
      // Check if enemy is colliding with the wall
      if (wallBounds.containsPoint(enemyPos)) {
        // Apply damage
        enemy.takeDamage(this.damage);
        
        // Add hit effects
        this.createHitEffect(enemyPos.clone());
        
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
        
        // Apply knockback
        const knockbackDir = new THREE.Vector3()
          .subVectors(enemyPos, wall.position)
          .normalize();
        
        // Move enemy away from wall
        enemy.mesh.position.add(knockbackDir.multiplyScalar(this.knockbackForce));
      }
    }
  }
  
  createWallEmergenceEffect(position, rotation) {
    // Create particles for wall emergence
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Set up particles
    for (let i = 0; i < particleCount; i++) {
      // Random position within wall bounds
      const x = (Math.random() - 0.5) * this.wallWidth;
      const y = (Math.random() - 0.5) * this.wallHeight;
      const z = (Math.random() - 0.5) * this.wallThickness;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Brown color with slight variation
      const r = 0.55 + Math.random() * 0.1;
      const g = 0.27 + Math.random() * 0.1;
      const b = 0.07 + Math.random() * 0.1;
      
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 1
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.position.copy(position);
    particles.rotation.copy(rotation);
    
    // Add to scene
    this.scene.add(particles);
    
    // Animate particles
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
      velocities.push({
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.2
      });
    }
    
    const animate = () => {
      const positions = particles.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;
        
        // Apply gravity
        velocities[i].y -= 0.01;
        
        // Fade out
        material.opacity -= 0.01;
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      
      if (material.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(particles);
        particles.geometry.dispose();
        particles.material.dispose();
      }
    };
    
    animate();
  }
  
  createHitEffect(position) {
    // Create a dust effect at hit point
    const geometry = new THREE.SphereGeometry(0.4, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.6
    });
    
    const hitEffect = new THREE.Mesh(geometry, material);
    hitEffect.position.copy(position);
    
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
      
      // Remove from global earth walls array
      if (window.gameEarthWalls) {
        const index = window.gameEarthWalls.indexOf(projectile);
        if (index !== -1) {
          window.gameEarthWalls.splice(index, 1);
        }
      }
    }
    
    this.projectiles = [];
    this.active = false;
  }
} 
