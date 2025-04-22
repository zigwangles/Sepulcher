import * as THREE from 'three';
import { Weapon, WeaponCategory } from '../weapons/baseWeapon.js';

export class FireStorm extends Weapon {
    constructor(scene, player) {
        super(scene, player);
        this.name = 'Fire Storm';
        this.description = 'Shoots a fiery ball that leaves a trail of damaging fire';
        this.cooldownTime = 1.5;
        this.damage = 8;
        this.color = '#ff4400';
        this.category = WeaponCategory.FIRE;
        
        this.projectileSpeed = 10;
        this.projectileSize = 0.5;
    }

    fire() {
        if (this.cooldown <= 0) {
            this.createProjectile();
            this.cooldown = this.cooldownTime;
        }
    }

    createProjectile() {
        // console.log("[FireStorm] Firing projectile (implementation pending)");
        // --- Projectile Creation Logic ---
        
        // 1. Find the nearest enemy
        let nearestEnemy = null;
        let minDistanceSq = Infinity;
        const searchRadiusSq = 15 * 15; // Only target enemies within 15 units

        // Access enemies globally (set by WeaponManager)
        const enemies = window.gameEnemies || []; 
        
        for (const enemy of enemies) {
            const distanceSq = this.player.mesh.position.distanceToSquared(enemy.mesh.position);
            if (distanceSq < minDistanceSq && distanceSq <= searchRadiusSq) {
                minDistanceSq = distanceSq;
                nearestEnemy = enemy;
            }
        }

        // Only fire if an enemy is found within range
        if (!nearestEnemy) {
            // console.log("[FireStorm] No nearby enemy to target.");
            return; 
        }

        // 2. Calculate Direction to nearest enemy
        const direction = new THREE.Vector3();
        direction.subVectors(nearestEnemy.mesh.position, this.player.mesh.position).normalize();

        // 3. Create Geometry & Material
        const geometry = new THREE.SphereGeometry(this.projectileSize, 16, 8);
        const material = new THREE.MeshBasicMaterial({ // Use BasicMaterial for a bright, glowing effect
            color: this.color,
            transparent: true, // Optional: for softer edges?
            opacity: 0.9,      // Optional
        });

        // 4. Create Mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.player.mesh.position);
        // Adjust Y slightly so it doesn't start inside the floor/player
        mesh.position.y += 0.5; 

        // 5. Add mesh to scene
        this.scene.add(mesh);

        // 6. Create projectile object
        const projectile = {
            mesh: mesh,
            direction: direction,
            speed: this.projectileSpeed,
            damage: this.damage, // Placeholder for potential direct hit damage
            lifeTime: 3, // Projectile lives for 3 seconds
            spawnTime: Date.now(),
            // --- Trail properties ---
            trailParticles: [],
            trailCooldown: 0.1, // Spawn trail particle every 0.1s
            trailTimer: 0,
            trailParticleDuration: 1.5, // How long each trail particle lasts
            trailParticleSize: 0.3,
            trailDamage: 2, // Damage per trail particle tick (adjust as needed)

            update: (delta) => {
                // Move projectile
                mesh.position.addScaledVector(direction, projectile.speed * delta);

                // --- Trail Spawning Logic ---
                projectile.trailTimer -= delta;
                if (projectile.trailTimer <= 0) {
                    projectile.trailTimer = projectile.trailCooldown;
                    // Spawn a trail particle
                    const trailGeo = new THREE.SphereGeometry(projectile.trailParticleSize, 8, 4);
                    const trailMat = new THREE.MeshBasicMaterial({
                        color: 0xff8800, // Lighter orange/yellow for trail
                        transparent: true,
                        opacity: 0.7
                    });
                    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
                    trailMesh.position.copy(mesh.position);
                    this.scene.add(trailMesh);

                    const trailParticle = {
                        mesh: trailMesh,
                        spawnTime: Date.now(),
                        duration: projectile.trailParticleDuration,
                        damage: projectile.trailDamage,
                        update: (trailDelta) => {
                            // Optional: Fade out, shrink, etc.
                            const lifeRatio = (Date.now() - trailParticle.spawnTime) / (trailParticle.duration * 1000);
                            trailMesh.material.opacity = Math.max(0, 0.7 * (1 - lifeRatio));
                            // trailMesh.scale.setScalar(Math.max(0.1, 1 - lifeRatio)); // Shrink
                        },
                        dispose: () => {
                            this.scene.remove(trailMesh);
                            trailGeo.dispose();
                            trailMat.dispose();
                        }
                    };
                    projectile.trailParticles.push(trailParticle);
                }
                
                // Update existing trail particles
                for (let i = projectile.trailParticles.length - 1; i >= 0; i--) {
                    const tp = projectile.trailParticles[i];
                    tp.update(delta);
                    // Damage check for trail particles
                    for (const enemy of window.gameEnemies || []) {
                         const distSq = tp.mesh.position.distanceToSquared(enemy.mesh.position);
                         if (distSq < (enemy.radius + projectile.trailParticleSize) ** 2) {
                             enemy.takeDamage(tp.damage * delta); // Apply DPS based on trail damage
                         }
                    }
                    // Remove old trail particles
                    if (Date.now() - tp.spawnTime > tp.duration * 1000) {
                        tp.dispose();
                        projectile.trailParticles.splice(i, 1);
                    }
                }
            },
            
            checkCollisions: (enemies) => {
                // Main projectile collision (optional - maybe trail does all damage?)
                for (const enemy of enemies) {
                    const distanceSq = mesh.position.distanceToSquared(enemy.mesh.position);
                    if (distanceSq < (enemy.radius + this.projectileSize) ** 2) {
                        // enemy.takeDamage(projectile.damage); // Apply direct hit damage?
                        // projectile.dispose(); // Dispose main projectile on hit
                        // return true; // Collision detected
                    }
                }
                return false; // No collision
            },
            
            shouldRemove: () => {
                // Remove if lifetime exceeded
                return Date.now() - projectile.spawnTime > projectile.lifeTime * 1000;
            },
            
            dispose: () => {
                // Dispose main projectile mesh
                this.scene.remove(mesh);
                geometry.dispose();
                material.dispose();
                // Dispose all remaining trail particles
                projectile.trailParticles.forEach(tp => tp.dispose());
                projectile.trailParticles = [];
            }
        };
        
        // 7. Add projectile object to manager
        this.projectiles.push(projectile);
    }

    update(delta) {
        super.update(delta);

        // Call fire() if cooldown is ready
        if (this.cooldown <= 0) {
            this.fire();
        }
    }

    dispose() {
        super.dispose();
    }
} 
