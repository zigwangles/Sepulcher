import * as THREE from 'three';
import { getCategoryColor, getCategoryIcon, getCategoryDescription } from './weapon.js';

export class WeaponSelectionMenu {
  constructor(container) {
    this.container = container;
    this.onSelectCallback = null;
    this.weaponOptions = [];
    this.active = false;
    this.customTitle = null;
    this.menuElement = null; // Initialize
    
    this.createMenu();
    window.addEventListener('resize', () => this.makeResponsive());
  }
  
  createMenu() {
     // Remove existing menu if it exists
    if (this.menuElement && this.menuElement.parentNode) {
      this.menuElement.parentNode.removeChild(this.menuElement);
    }

    // Create menu container using overlay style
    this.menuElement = document.createElement('div');
    this.menuElement.id = 'weapon-selection-menu'; // Add ID
    // Use overlay-menu for positioning/background, add specific class for content styling
    this.menuElement.className = 'overlay-menu weapon-selection-menu hidden'; 
    // Remove inline styles for position, transform, width, padding, bg color, border, radius, color, fontFamily, zIndex, boxShadow
    
    // Create title
    this.titleElement = document.createElement('h2');
    this.titleElement.className = 'menu-title weapon-selection-title'; // Class for styling
    this.titleElement.textContent = 'SELECT NEW WEAPON';
    // Remove inline styles for fontSize, margin, textAlign, color, textShadow
    
    // Create weapon options container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.className = 'options-container'; // Class for styling
    // Remove inline styles for display, flexDirection, justifyContent, flexWrap, gap, width
    
    this.menuElement.appendChild(this.titleElement);
    this.menuElement.appendChild(this.optionsContainer);
    
    // Add to container
    this.container.appendChild(this.menuElement);
    
    // Make the menu responsive initially
    this.makeResponsive();
  }
  
  makeResponsive() {
    // This can be simplified if CSS handles responsiveness via media queries
    // For now, keep JS adjustments if needed for complex layout changes
    if (!this.menuElement) return;
    const isMobile = window.innerWidth < 700; // Adjust breakpoint if needed
    this.optionsContainer.style.flexDirection = isMobile ? 'column' : 'row';
    this.menuElement.style.width = isMobile ? '90%' : '80%';
    this.menuElement.style.maxWidth = isMobile ? '90%' : '800px'; // Adjust max width
  }
  
  show(weaponOptions, callback) {
    if (!this.menuElement) this.createMenu(); // Ensure menu exists

    this.weaponOptions = weaponOptions;
    this.onSelectCallback = callback;
    this.active = true;
    this.titleElement.textContent = this.customTitle || 'SELECT NEW WEAPON';
    this.customTitle = null; // Reset custom title
    
    // Clear previous options
    this.optionsContainer.innerHTML = ''; // Clear efficiently
    
    // Create weapon option cards
    this.weaponOptions.forEach((weapon, index) => {
      if (weapon) { // Ensure weapon data is valid
          const card = this.createWeaponCard(weapon, index);
          this.optionsContainer.appendChild(card);
      }
    });
    
    // Show menu by removing hidden class
    this.menuElement.classList.remove('hidden');
  }
  
  showWithTitle(weaponOptions, title, callback) {
    this.customTitle = title; // Store custom title before calling show
    this.show(weaponOptions, callback);
  }
  
  createWeaponCard(weapon, index) {
    const card = document.createElement('div');
    card.className = 'weapon-card'; // Use class from style.css
    // Remove inline styles for display, flexDirection, alignItems, padding, bgColor, border, radius, cursor, transition, flex, minWidth, maxWidth

    // Weapon icon (colored circle)
    const icon = document.createElement('div');
    icon.className = 'weapon-card-icon'; // Add class
    // Use inline style only for the dynamic background color and shadow
    const weaponColorHex = '#' + weapon.color.toString(16).padStart(6, '0');
    icon.style.backgroundColor = weaponColorHex;
    icon.style.boxShadow = `0 0 10px ${weaponColorHex}`; 
    // Remove inline styles for width, height, borderRadius, marginBottom
    
    // Weapon name
    const name = document.createElement('h3');
    name.className = 'weapon-card-name'; // Add class
    name.textContent = weapon.name;
    // Remove inline styles for margin, fontSize, color
    
    // Weapon description
    const description = document.createElement('p');
    description.className = 'weapon-card-description'; // Add class
    description.textContent = weapon.description;
    // Remove inline styles for margin, fontSize, textAlign, color
    
    // Stats container
    const stats = document.createElement('div');
    stats.className = 'weapon-card-stats'; // Add class
    // Remove inline styles for marginTop, width
    
    // Helper function to create a stat line
    const createStatLine = (label, value, valueColor) => {
        const statLine = document.createElement('div');
        statLine.className = 'stat-line';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'stat-label';
        labelSpan.textContent = label + ':';

        const valueSpan = document.createElement('span');
        valueSpan.className = 'stat-value';
        valueSpan.textContent = value;
        if (valueColor) {
            valueSpan.style.color = valueColor;
        }

        statLine.appendChild(labelSpan);
        statLine.appendChild(valueSpan);
        return statLine;
    };

    // Add stats using the helper
    stats.appendChild(createStatLine('Damage', weapon.damage, '#ff6666')); // Red-ish for damage
    stats.appendChild(createStatLine('Cooldown', weapon.cooldownTime + 's', '#66aaff')); // Blue-ish for cooldown
    
    // Append all elements
    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(description);
    card.appendChild(stats);
    
    // Hover effect (handled by CSS :hover on .weapon-card)
    // Remove JS hover listeners
    
    // Selection event
    card.addEventListener('click', () => {
      this.selectWeapon(index);
    });

    // Touch support - simplified: treat tap like click
    card.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent zoom/scroll
      // Add active state for visual feedback if desired via CSS :active
      card.classList.add('active'); 
    }, { passive: false });

    card.addEventListener('touchend', (e) => {
      e.preventDefault();
      card.classList.remove('active');
      // Check if touch hasn't moved significantly (optional)
      this.selectWeapon(index);
    });
    
    return card;
  }
  
  selectWeapon(index) {
    if (this.onSelectCallback && index >= 0 && index < this.weaponOptions.length) {
      // Pass the actual weapon instance back, not just index
      const selectedWeaponInstance = this.weaponOptions[index]; 
      this.onSelectCallback(selectedWeaponInstance);
      this.hide();
    }
  }
  
  hide() {
    this.active = false;
    if (this.menuElement) {
        this.menuElement.classList.add('hidden'); // Use class to hide
    }
  }
  
  isActive() {
    return this.active;
  }
  
  // Add dispose method
  dispose() {
    if (this.menuElement && this.menuElement.parentNode) {
        this.menuElement.parentNode.removeChild(this.menuElement);
    }
    this.menuElement = null;
    window.removeEventListener('resize', this.makeResponsive);
  }
}
