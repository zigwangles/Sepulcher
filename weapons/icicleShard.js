import * as THREE from 'three';
import { Weapon, WeaponCategory } from '../baseWeapon.js';

export class IcicleShard extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.name = "Icicle Shard";
    this.description = "Fires sharp ice shards that slow enemies";
    this.cooldownTime = 0.5;
    this.damage = 10;
    this.color = "#00ffff";
    this.category = WeaponCategory.ICE;
    this.projectileSpeed = 15;
    this.projectileSize = 0.3;
    this.slowEffect = 0.5; // 50% slow
    this.slowDuration = 3; // 3 seconds
  }

  createProjectile() {
    const geometry = new THREE.ConeGeometry(this.projectileSize, this.projectileSize * 2, 8);
    const material = new THREE.MeshPhongMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
      shininess: 100
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position at player
    mesh.position.copy(this.player.mesh.position);
    
    // Get direction from player to mouse
    const direction = new THREE.Vector3();
    this.raycaster.setFromCamera(this.mouse, this.scene.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectPoint);
    direction.subVectors(intersectPoint, this.player.mesh.position).normalize();
    
    // Set rotation to face direction
    mesh.lookAt(intersectPoint);
    
    // Add to scene
    this.scene.add(mesh);
    
    // Create projectile object
    const projectile = {
      mesh: mesh,
      direction: direction,
      speed: this.projectileSpeed,
      damage: this.damage,
      slowEffect: this.slowEffect,
      slowDuration: this.slowDuration,
      update: (delta) => {
        mesh.position.addScaledVector(direction, this.projectileSpeed * delta);
      },
      checkCollisions: (enemies) => {
        for (const enemy of enemies) {
          const distance = mesh.position.distanceTo(enemy.mesh.position);
          if (distance < enemy.radius + this.projectileSize) {
            // Apply damage and slow effect
            enemy.takeDamage(this.damage);
            enemy.applySlow(this.slowEffect, this.slowDuration);
            return true;
          }
        }
        return false;
      },
      shouldRemove: () => {
        // Remove if out of bounds
        return Math.abs(mesh.position.x) > 50 || 
               Math.abs(mesh.position.y) > 50;
      },
      dispose: () => {
        this.scene.remove(mesh);
        geometry.dispose();
        material.dispose();
      }
    };
    
    this.projectiles.push(projectile);
  }
} 
