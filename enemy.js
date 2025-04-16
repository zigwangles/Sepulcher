import * as THREE from 'three';

export class Enemy {
  constructor(scene, player, position) {
    this.scene = scene;
    this.player = player;
    this.speed = 2; // Units per second (slow)
    this.health = 100;
    this.damage = 10; // Damage to player on collision
    this.isAlive = true;
    this.value = 5; // Reduced score value when killed
    this.isSlowed = false;
    this.originalSpeed = this.speed; // Store original speed for slowing effects
    
    this.createMesh(position);
  }
  
  createMesh(position) {
    // Create a red enemy (flat circle like the player but red)
    const geometry = new THREE.CircleGeometry(0.4, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xaa0000,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to be parallel to the ground
    this.mesh.position.copy(position);
    this.mesh.position.y = 0.02; // Slightly above the player to avoid z-fighting
    this.scene.add(this.mesh);
    
    // Add a pulsing effect
    this.pulseTime = Math.random() * Math.PI; // Randomize starting phase
  }
  
  update(delta) {
    if (!this.isAlive) return;
    
    // Move towards player
    const direction = new THREE.Vector3();
    direction.subVectors(this.player.mesh.position, this.mesh.position);
    direction.y = 0; // Keep movement on the same plane
    
    if (direction.length() > 0.01) {
      direction.normalize();
      
      // Apply movement
      this.mesh.position.x += direction.x * this.speed * delta;
      this.mesh.position.z += direction.z * this.speed * delta;
    }
    
    // Visual pulse effect
    this.pulseTime += delta * 3;
    const scaleOffset = Math.sin(this.pulseTime) * 0.1 + 0.9; // Pulse between 0.8 and 1.0 scale
    this.mesh.scale.set(scaleOffset, scaleOffset, 1);
    
    // Check for collision with player
    const distanceToPlayer = new THREE.Vector3()
      .subVectors(this.player.mesh.position, this.mesh.position)
      .length();
      
    // If we're within the combined radius of both objects (player + enemy)
    if (distanceToPlayer < 0.9) {
      return true; // Signal a collision
    }
    
    return false;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // Flash effect when taking damage
    this.mesh.material.emissiveIntensity = 1.0;
    setTimeout(() => {
      if (this.isAlive) {
        this.mesh.material.emissiveIntensity = 0.3;
      }
    }, 100);
    
    if (this.health <= 0) {
      this.die();
      return true; // Signal that enemy died
    }
    return false;
  }
  
  die() {
    this.isAlive = false;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
  
  // Method to apply slow effect
  applySlowEffect(duration, amount) {
    this.isSlowed = true;
    
    // Store original speed if not already stored
    this.originalSpeed = this.originalSpeed || this.speed;
    
    // Apply slow effect
    this.speed = this.originalSpeed * amount;
    
    // Add visual indicator for slowed state
    if (this.mesh && this.mesh.material) {
      // Add blue tint to indicate frozen/slowed
      this.mesh.material.color.setHex(0xaaddff);
    }
    
    // Clear any existing timeout
    if (this.slowTimeout) {
      clearTimeout(this.slowTimeout);
    }
    
    // Reset after duration
    this.slowTimeout = setTimeout(() => {
      if (!this.isAlive) return;
      
      this.isSlowed = false;
      this.speed = this.originalSpeed;
      
      // Remove visual indicator
      if (this.mesh && this.mesh.material) {
        this.mesh.material.color.setHex(0xff0000);
      }
    }, duration * 1000);
  }
}
