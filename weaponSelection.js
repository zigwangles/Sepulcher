import * as THREE from 'three';
import { getCategoryColor, getCategoryIcon, getCategoryDescription } from './weapon.js';

export class WeaponSelectionMenu {
  constructor(container) {
    this.container = container;
    this.onSelectCallback = null;
    this.onPauseCallback = null;
    this.onResumeCallback = null;
    this.weaponOptions = [];
    this.active = false;
    this.customTitle = null;
    
    this.createMenu();
  }
  
  createMenu() {
    // Create menu container
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'weapon-selection-menu';
    this.menuElement.style.position = 'absolute';
    this.menuElement.style.top = '50%';
    this.menuElement.style.left = '50%';
    this.menuElement.style.transform = 'translate(-50%, -50%)';
    this.menuElement.style.width = '80%';
    this.menuElement.style.maxWidth = '600px';
    this.menuElement.style.padding = '20px';
    this.menuElement.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    this.menuElement.style.border = '2px solid #ffaa00';
    this.menuElement.style.borderRadius = '10px';
    this.menuElement.style.color = '#fff';
    this.menuElement.style.fontFamily = 'Arial, sans-serif';
    this.menuElement.style.zIndex = '200';
    this.menuElement.style.display = 'none';
    this.menuElement.style.flexDirection = 'column';
    this.menuElement.style.alignItems = 'center';
    this.menuElement.style.boxShadow = '0 0 20px rgba(255, 170, 0, 0.5)';
    
    // Create title
    this.titleElement = document.createElement('h2');
    this.titleElement.textContent = 'SELECT NEW WEAPON';
    this.titleElement.style.fontSize = '2rem';
    this.titleElement.style.margin = '0 0 20px 0';
    this.titleElement.style.textAlign = 'center';
    this.titleElement.style.color = '#ffaa00';
    this.titleElement.style.textShadow = '0 0 5px #ff5500';
    
    // Create weapon options container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.style.display = 'flex';
    this.optionsContainer.style.flexDirection = 'row';
    this.optionsContainer.style.justifyContent = 'center';
    this.optionsContainer.style.flexWrap = 'wrap';
    this.optionsContainer.style.gap = '15px';
    this.optionsContainer.style.width = '100%';
    
    this.menuElement.appendChild(this.titleElement);
    this.menuElement.appendChild(this.optionsContainer);
    
    // Add to container
    this.container.appendChild(this.menuElement);
    
    // Make the menu responsive
    this.makeResponsive();
  }
  
  makeResponsive() {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        // Mobile layout
        this.menuElement.style.width = '90%';
        this.menuElement.style.padding = '15px';
        this.optionsContainer.style.flexDirection = 'column';
      } else {
        // Desktop layout
        this.menuElement.style.width = '80%';
        this.menuElement.style.padding = '20px';
        this.optionsContainer.style.flexDirection = 'row';
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();
  }
  
  show(weaponOptions, callback, onPause, onResume) {
    this.weaponOptions = weaponOptions;
    this.onSelectCallback = callback;
    this.onPauseCallback = onPause;
    this.onResumeCallback = onResume;
    this.active = true;
    this.titleElement.textContent = 'SELECT NEW WEAPON';
    
    // Pause the game
    if (this.onPauseCallback) {
        this.onPauseCallback();
    }
    
    // Clear previous options
    while (this.optionsContainer.firstChild) {
      this.optionsContainer.removeChild(this.optionsContainer.firstChild);
    }
    
    // Create weapon option cards
    this.weaponOptions.forEach((weapon, index) => {
      const card = this.createWeaponCard(weapon, index);
      this.optionsContainer.appendChild(card);
    });
    
    // Show menu
    this.menuElement.style.display = 'flex';
  }
  
  showWithTitle(weaponOptions, title, callback, onPause, onResume) {
    this.titleElement.textContent = title;
    this.show(weaponOptions, callback, onPause, onResume);
  }
  
  createWeaponCard(weapon, index) {
    const card = document.createElement('div');
    card.className = 'weapon-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.padding = '15px';
    card.style.backgroundColor = 'rgba(20, 20, 40, 0.9)';
    card.style.border = '1px solid #666';
    card.style.borderRadius = '8px';
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.2s ease';
    card.style.flex = '1';
    card.style.minWidth = '150px';
    card.style.maxWidth = '250px';
    
    // Weapon icon (colored circle)
    const icon = document.createElement('div');
    icon.style.width = '50px';
    icon.style.height = '50px';
    icon.style.borderRadius = '50%';
    icon.style.backgroundColor = '#' + weapon.color.toString(16).padStart(6, '0');
    icon.style.marginBottom = '10px';
    icon.style.boxShadow = `0 0 15px #${weapon.color.toString(16).padStart(6, '0')}`;
    
    // Weapon name
    const name = document.createElement('h3');
    name.textContent = weapon.name;
    name.style.margin = '0 0 5px 0';
    name.style.fontSize = '1.2rem';
    name.style.color = '#fff';
    
    // Weapon description
    const description = document.createElement('p');
    description.textContent = weapon.description;
    description.style.margin = '0';
    description.style.fontSize = '0.9rem';
    description.style.textAlign = 'center';
    description.style.color = '#ccc';
    
    // Stats
    const stats = document.createElement('div');
    stats.style.marginTop = '10px';
    stats.style.width = '100%';
    
    // Damage stat
    const damageStat = document.createElement('div');
    damageStat.style.display = 'flex';
    damageStat.style.justifyContent = 'space-between';
    damageStat.style.fontSize = '0.9rem';
    damageStat.style.marginBottom = '5px';
    
    const damageLabel = document.createElement('span');
    damageLabel.textContent = 'Damage:';
    damageLabel.style.color = '#aaa';
    
    const damageValue = document.createElement('span');
    damageValue.textContent = weapon.damage;
    damageValue.style.color = '#ff5555';
    
    damageStat.appendChild(damageLabel);
    damageStat.appendChild(damageValue);
    
    // Speed stat
    const speedStat = document.createElement('div');
    speedStat.style.display = 'flex';
    speedStat.style.justifyContent = 'space-between';
    speedStat.style.fontSize = '0.9rem';
    
    const speedLabel = document.createElement('span');
    speedLabel.textContent = 'Cooldown:';
    speedLabel.style.color = '#aaa';
    
    const speedValue = document.createElement('span');
    speedValue.textContent = weapon.cooldownTime + 's';
    speedValue.style.color = '#55aaff';
    
    speedStat.appendChild(speedLabel);
    speedStat.appendChild(speedValue);
    
    stats.appendChild(damageStat);
    stats.appendChild(speedStat);
    
    // Append all elements
    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(description);
    card.appendChild(stats);
    
    // Hover effect
    card.addEventListener('mouseover', () => {
      card.style.backgroundColor = 'rgba(40, 40, 80, 0.9)';
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = `0 5px 15px rgba(${weapon.color & 0xFF}, ${(weapon.color >> 8) & 0xFF}, ${(weapon.color >> 16) & 0xFF}, 0.5)`;
    });
    
    card.addEventListener('mouseout', () => {
      card.style.backgroundColor = 'rgba(20, 20, 40, 0.9)';
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });
    
    // Selection event
    card.addEventListener('click', () => {
      this.selectWeapon(index);
    });

    // Touch support
    card.addEventListener('touchstart', (e) => {
      e.preventDefault();
      card.style.backgroundColor = 'rgba(40, 40, 80, 0.9)';
      card.style.transform = 'translateY(-5px)';
    });

    card.addEventListener('touchend', (e) => {
      e.preventDefault();
      card.style.backgroundColor = 'rgba(20, 20, 40, 0.9)';
      card.style.transform = 'translateY(0)';
      this.selectWeapon(index);
    });
    
    return card;
  }
  
  selectWeapon(index) {
    if (this.onSelectCallback && index >= 0 && index < this.weaponOptions.length) {
      this.onSelectCallback(this.weaponOptions[index]);
      this.hide();
    }
  }
  
  hide() {
    // Resume the game before hiding
    if (this.onResumeCallback) {
        this.onResumeCallback();
    }

    this.active = false;
    this.menuElement.style.display = 'none';
  }
  
  isActive() {
    return this.active;
  }
}
