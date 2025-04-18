import * as THREE from 'three';

export class Player {
  constructor(scene, settings) {
    this.scene = scene;
    this.settings = settings;
    this.speed = 8; // Units per second
    this.createMesh();
  }
  
  createMesh() {
    // Create a flat circle for the player
    const geometry = new THREE.CircleGeometry(0.5, 32);
    const playerColor = this.settings.getPlayerColorTHREE();
    const material = new THREE.MeshStandardMaterial({ 
      color: playerColor,
      emissive: playerColor.clone().multiplyScalar(0.5),
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to be parallel to the ground
    this.mesh.position.y = 0.01; // Slightly above the plane to avoid z-fighting
    this.scene.add(this.mesh);
    
    // Add a pulsing effect
    this.pulseTime = 0;
  }
  
  applyColor(color) {
    if (this.mesh && this.mesh.material) {
      this.mesh.material.color.set(color);
      this.mesh.material.emissive.set(color.clone().multiplyScalar(0.5));
      this.mesh.material.needsUpdate = true;
    }
  }
  
  move(direction, delta) {
    // Normalize direction vector for consistent speed in all directions
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    // Calculate new position
    const newX = this.mesh.position.x + direction.x * this.speed * delta;
    const newZ = this.mesh.position.z + direction.z * this.speed * delta;
    
    // Check for collisions with Earth Walls
    const newPosition = new THREE.Vector3(newX, this.mesh.position.y, newZ);
    const playerRadius = 0.5; // Player's collision radius
    
    // Get all Earth Walls from the weapon manager
    const earthWalls = window.gameEarthWalls || [];
    let collision = false;
    
    for (const wall of earthWalls) {
      if (!wall || !wall.position || !wall.isObstacle) continue;
      
      // Calculate distance to wall
      const distance = new THREE.Vector3()
        .subVectors(newPosition, wall.position)
        .length();
      
      // Check if player would collide with wall
      if (distance < playerRadius + (wall.collisionRadius || 0.5)) {
        collision = true;
        break;
      }
    }
    
    // Only apply movement if no collision
    if (!collision) {
      this.mesh.position.x = newX;
      this.mesh.position.z = newZ;
      
      // Add visual effects during movement
      if (direction.length() > 0) {
        // Add a subtle trail effect
        const trail = new THREE.Mesh(
          new THREE.CircleGeometry(0.4, 16),
          new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3
          })
        );
        trail.position.copy(this.mesh.position);
        trail.position.y = 0.01; // Slightly below the player
        this.scene.add(trail);
        
        // Fade out and remove the trail
        const fadeOut = () => {
          if (trail.material.opacity > 0.01) {
            trail.material.opacity -= 0.05;
            requestAnimationFrame(fadeOut);
          } else {
            this.scene.remove(trail);
            trail.geometry.dispose();
            trail.material.dispose();
          }
        };
        fadeOut();
      }
    }
  }
}
