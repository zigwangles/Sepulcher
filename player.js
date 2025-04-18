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
    if (!direction.x && !direction.y) return;
    
    // Normalize the direction vector if we're moving diagonally
    if (direction.x !== 0 && direction.y !== 0) {
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      direction.x /= length;
      direction.y /= length;
    }
    
    // Apply movement
    this.mesh.position.x += direction.x * this.speed * delta;
    this.mesh.position.z += direction.y * this.speed * delta;
    
    // Add visual effects when moving
    this.pulseTime += delta * 5;
    const scaleOffset = Math.sin(this.pulseTime) * 0.1;
    this.mesh.scale.set(1 + scaleOffset, 1 + scaleOffset, 1);
  }
}
