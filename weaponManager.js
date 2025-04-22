import * as THREE from 'three';
import { IcicleShard } from './weapons/icicleShard.js';
import { FireStorm } from './weapons/fireStorm.js';
import { ThunderboltsWeapon } from './weapons/thunderboltsWeapon.js';
import { LightBeamWeapon } from './weapons/lightBeamWeapon.js';
import { DarkTendrilsWeapon } from './weapons/darkTendrilsWeapon.js';
import { LeechingTendrilsWeapon } from './weapons/leechingTendrilsWeapon.js';
import { EarthWallWeapon } from './weapons/earthWallWeapon.js';

export class WeaponManager {
  constructor(scene, player, addDefaultWeapon = true) {
    this.scene = scene;
    this.player = player;
    this.weapons = []; // Array to hold multiple active weapons
    this.lastScoreCheck = 0;
    this.scoreThreshold = 100; // Every 100 points, offer new weapons
    
    // Available weapon types
    this.weaponTypes = [
        IcicleShard,
        FireStorm,
        ThunderboltsWeapon,
        LightBeamWeapon,
        DarkTendrilsWeapon,
        LeechingTendrilsWeapon,
        EarthWallWeapon
    ];
    
    // Available weapons to choose from (rotates based on score)
    this.availableWeapons = [];
    
    // Start with a basic weapon if specified
    if (addDefaultWeapon) {
      this.addWeapon(new IcicleShard(scene, player));
    }
    
    // Generate initial available weapons
    this.regenerateAvailableWeapons();
  }
  
  update(delta, score, enemies) {
    // Make enemies available to weapons for targeting *before* updating them
    window.gameEnemies = enemies;
    
    // Update all weapons and collect hits
    let allHits = [];
    
    for (const weapon of this.weapons) {
      weapon.update(delta);
      
      // Check for projectile-enemy collisions
      const hits = weapon.checkCollisions(enemies);
      
      // Add hits to our collection
      allHits = allHits.concat(hits);
    }
    
    // No longer needed here, weapons can access it directly via window
    // window.gameEnemies = enemies;
    
    // Regenerate available weapons based on score and current arsenal
    this.regenerateAvailableWeapons();
    
    return allHits;
  }
  
  // Add a new weapon to the player's arsenal
  addWeapon(weapon) {
    console.log(`[WeaponManager] Adding weapon: ${weapon.name}`);
    // Ensure weapon is properly initialized
    if (weapon && typeof weapon.initialize === 'function') {
      weapon.initialize();
    }
    this.weapons.push(weapon);
  }
  
  regenerateAvailableWeapons() {
    // Clear current available weapons
    this.availableWeapons = [];
    
    // Step 1: Group weapon types by category
    const weaponsByCategory = {};
    
    for (const WeaponType of this.weaponTypes) {
      // Create a temporary instance to check its category
      const tempWeapon = new WeaponType(this.scene, this.player);
      const category = tempWeapon.category;
      tempWeapon.dispose(); // Clean up the temporary weapon
      
      if (!weaponsByCategory[category]) {
        weaponsByCategory[category] = [];
      }
      
      weaponsByCategory[category].push(WeaponType);
    }
    
    // Step 2: Find out which categories player already has
    const playerCategories = new Set();
    for (const weapon of this.weapons) {
      if (weapon.category) {
        playerCategories.add(weapon.category);
      }
    }
    
    // Step 3: Prioritize categories that player doesn't have yet
    const availableCategories = Object.keys(weaponsByCategory).filter(
      category => !playerCategories.has(category)
    );
    
    // If no new categories, use all categories
    if (availableCategories.length === 0) {
      availableCategories.push(...Object.keys(weaponsByCategory));
    }
    
    // Step 4: Shuffle categories and pick up to 3 different ones
    const shuffledCategories = [...availableCategories].sort(() => 0.5 - Math.random());
    const selectedCategories = shuffledCategories.slice(0, Math.min(3, shuffledCategories.length));
    
    // Step 5: From each selected category, pick one weapon type at random
    for (const category of selectedCategories) {
      const categoryWeapons = weaponsByCategory[category];
      if (categoryWeapons && categoryWeapons.length > 0) {
        // Filter out weapon types the player already has
        const availableTypes = categoryWeapons.filter(type => 
          !this.weapons.some(weapon => weapon instanceof type)
        );
        
        // If all weapons of this category are taken, use any from the category
        const weaponsToChooseFrom = availableTypes.length > 0 ? availableTypes : categoryWeapons;
        
        // Pick a random weapon type from this category
        const randomIndex = Math.floor(Math.random() * weaponsToChooseFrom.length);
        const WeaponType = weaponsToChooseFrom[randomIndex];
        
        this.availableWeapons.push(new WeaponType(this.scene, this.player));
      }
    }
    
    // If we couldn't get enough weapons from different categories, add more random ones
    if (this.availableWeapons.length < 3) {
      const remainingCount = 3 - this.availableWeapons.length;
      const allTypes = this.weaponTypes.filter(type => 
        !this.availableWeapons.some(w => w instanceof type)
      );
      
      if (allTypes.length > 0) {
        const shuffled = [...allTypes].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(remainingCount, shuffled.length); i++) {
          const WeaponType = shuffled[i];
          this.availableWeapons.push(new WeaponType(this.scene, this.player));
        }
      }
    }
  }
  
  // Get all available weapons for selection
  getAvailableWeapons() {
    if (this.availableWeapons.length === 0) {
      this.regenerateAvailableWeapons();
    }
    
    return this.availableWeapons;
  }
  
  // Get random starter weapons
  getRandomStarterWeapons(count = 3) {
    // Create one of each weapon type
    const starterWeapons = this.weaponTypes.map(Type => new Type(this.scene, this.player));
    
    // Shuffle array
    const shuffled = [...starterWeapons].sort(() => 0.5 - Math.random());
    
    // Return first n weapons (or all if less than n)
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
  
  // Choose a random weapon from available options
  getRandomWeapon() {
    if (this.availableWeapons.length === 0) {
      this.regenerateAvailableWeapons();
    }
    
    const index = Math.floor(Math.random() * this.availableWeapons.length);
    return this.availableWeapons[index];
  }
  
  dispose() {
    // Clean up all weapons
    for (const weapon of this.weapons) {
      weapon.dispose();
    }
    this.weapons = [];
    
    // Clean up available weapons
    for (const weapon of this.availableWeapons) {
      weapon.dispose();
    }
    
    window.gameEnemies = null;
  }
}
