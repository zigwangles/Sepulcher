import * as THREE from 'three';
import { Weapon, WeaponCategory } from '../baseWeapon.js';

export class FireStorm extends Weapon {
    constructor(scene, player) {
        super(scene, player);
        this.name = 'Fire Storm';
        this.description = 'Creates a storm of fire that damages enemies over time';
        this.cooldownTime = 2;
        this.damage = 5;
        this.color = '#ff4400';
        this.category = WeaponCategory.FIRE;
        this.duration = 5;
        this.radius = 5;
        this.particleCount = 50;
        this.particles = [];
        this.isActive = false;
        this.startTime = 0;
    }

    fire() {
        if (this.cooldown <= 0 && !this.isActive) {
            this.isActive = true;
            this.startTime = Date.now();
            this.createFireStorm();
            this.cooldown = this.cooldownTime;
            this.lastFired = Date.now();
        }
    }

    createFireStorm() {
        // Create particle system
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            // Random position within radius
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.radius;
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = Math.sin(angle) * radius;
            
            // Color gradient from orange to red
            const color = new THREE.Color();
            color.setHSL(0.05 + Math.random() * 0.05, 1, 0.5);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.position.copy(this.player.mesh.position);
        this.scene.add(particles);
        
        // Store particle system
        this.particles.push({
            mesh: particles,
            startTime: Date.now(),
            update: (delta) => {
                // Rotate particles
                particles.rotation.y += delta * 2;
                
                // Update particle positions
                const positions = particles.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += Math.random() * delta * 2; // Rise up
                }
                particles.geometry.attributes.position.needsUpdate = true;
                
                // Check for enemy collisions
                this.checkEnemyCollisions(particles.position);
            },
            shouldRemove: () => {
                return Date.now() - this.startTime > this.duration * 1000;
            },
            dispose: () => {
                this.scene.remove(particles);
                geometry.dispose();
                material.dispose();
            }
        });
    }

    checkEnemyCollisions(center) {
        for (const enemy of window.gameEnemies) {
            const distance = center.distanceTo(enemy.mesh.position);
            if (distance < this.radius + enemy.radius) {
                enemy.takeDamage(this.damage * 0.1); // Damage per frame
            }
        }
    }

    update(delta) {
        super.update(delta);
        
        // Update fire storm particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(delta);
            
            if (particle.shouldRemove()) {
                particle.dispose();
                this.particles.splice(i, 1);
                this.isActive = false;
            }
        }
    }

    dispose() {
        super.dispose();
        this.particles.forEach(particle => particle.dispose());
        this.particles = [];
    }
} 
