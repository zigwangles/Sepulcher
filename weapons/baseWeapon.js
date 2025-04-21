import * as THREE from 'three';

// Weapon categories
export const WeaponCategory = {
    ICE: 'ice',
    FIRE: 'fire',
    LIGHTNING: 'lightning',
    LIGHT: 'light',
    DARK: 'dark',
    EARTH: 'earth'
};

// Base Weapon class
export class Weapon {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.isActive = false;
        this.cooldown = 0;
        this.lastFired = 0;
        this.projectiles = [];
        this.mesh = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    update(delta, enemies) {
        // Update cooldown
        if (this.cooldown > 0) {
            this.cooldown -= delta;
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(delta);

            // Check for collisions with enemies
            if (projectile.checkCollisions(enemies)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Remove projectiles that are out of bounds or too old
            if (projectile.shouldRemove()) {
                projectile.dispose();
                this.projectiles.splice(i, 1);
            }
        }
    }

    fire() {
        if (this.cooldown <= 0) {
            this.createProjectile();
            this.cooldown = this.cooldownTime;
            this.lastFired = Date.now();
        }
    }

    createProjectile() {
        // To be implemented by subclasses
    }

    checkCollisions(enemies) {
        // Default implementation for weapons where collisions
        // are handled by projectiles in the update method.
        // Subclasses can override this for non-projectile collisions (beams, AoE, etc.)
        return [];
    }

    dispose() {
        // Clean up all projectiles
        this.projectiles.forEach(projectile => projectile.dispose());
        this.projectiles = [];

        // Remove mesh if it exists
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}

// Utility functions for weapon categories
export function getCategoryColor(category) {
    const colors = {
        [WeaponCategory.ICE]: '#00ffff',
        [WeaponCategory.FIRE]: '#ff4400',
        [WeaponCategory.LIGHTNING]: '#ffff00',
        [WeaponCategory.LIGHT]: '#ffffff',
        [WeaponCategory.DARK]: '#800080',
        [WeaponCategory.EARTH]: '#8B4513'
    };
    return colors[category] || '#ffffff';
}

export function getCategoryIcon(category) {
    const icons = {
        [WeaponCategory.ICE]: '❄️',
        [WeaponCategory.FIRE]: '🔥',
        [WeaponCategory.LIGHTNING]: '⚡',
        [WeaponCategory.LIGHT]: '✨',
        [WeaponCategory.DARK]: '🌑',
        [WeaponCategory.EARTH]: '🌍'
    };
    return icons[category] || '❓';
}

export function getCategoryDescription(category) {
    const descriptions = {
        [WeaponCategory.ICE]: 'Freezing weapons that slow and freeze enemies',
        [WeaponCategory.FIRE]: 'Burning weapons that deal damage over time',
        [WeaponCategory.LIGHTNING]: 'Lightning weapons that chain between enemies',
        [WeaponCategory.LIGHT]: 'Light weapons that pierce through enemies',
        [WeaponCategory.DARK]: 'Dark weapons that weaken and corrupt enemies',
        [WeaponCategory.EARTH]: 'Earth weapons that control the battlefield'
    };
    return descriptions[category] || 'Unknown weapon type';
} 
