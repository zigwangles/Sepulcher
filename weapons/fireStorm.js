import * as THREE from 'three';
import { Weapon } from './weapon';

export class FireStorm extends Weapon {
  constructor(scene) {
    super(scene);
    this.particles = [];
    this.projectiles = [];
    this.burnAreas = [];
  }

  initialize() {
    // Initialize particle system
    this.particleSystem = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xff4400,
        size: 0.5,
        transparent: true,
        blending: THREE.AdditiveBlending
      })
    );
    this.scene.add(this.particleSystem);
  }

  dispose() {
    // Clean up particle system
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      this.particleSystem.material.dispose();
    }
    
    // Clear arrays
    this.particles = [];
    this.projectiles = [];
    this.burnAreas = [];
  }

  update(delta) {
    super.update(delta);
    
    // Validate arrays
    if (!Array.isArray(this.particles)) this.particles = [];
    if (!Array.isArray(this.projectiles)) this.projectiles = [];
    if (!Array.isArray(this.burnAreas)) this.burnAreas = [];
    
    // Update burn areas
    for (let i = this.burnAreas.length - 1; i >= 0; i--) {
      const area = this.burnAreas[i];
      if (!area) {
        this.burnAreas.splice(i, 1);
        continue;
      }
      
      area.duration -= delta;
      if (area.duration <= 0) {
        this.burnAreas.splice(i, 1);
      }
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      if (!projectile || !projectile.mesh) {
        this.projectiles.splice(i, 1);
        continue;
      }
      
      projectile.life -= delta;
      if (projectile.life <= 0) {
        this.scene.remove(projectile.mesh);
        projectile.mesh.geometry.dispose();
        projectile.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (!particle) {
        this.particles.splice(i, 1);
        continue;
      }
      
      particle.life -= delta;
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update particle system geometry
    if (this.particles.length > 0) {
      const positions = new Float32Array(this.particles.length * 3);
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;
      }
      this.particleSystem.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  }
} 
