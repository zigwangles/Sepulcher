import * as THREE from 'three';
import { Settings } from './settings.js'; // Import from the new file

export class SettingsMenu {
  constructor(container, showMainMenuCallback) {
    this.container = container;
    this.showMainMenuCallback = showMainMenuCallback;
    this.active = false;
    this.settings = new Settings(); // Load current settings

    this.createMenu();
    this.setupEventListeners();
  }

  createMenu() {
    // Create menu container
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'settings-menu';
    this.menuElement.style.position = 'absolute';
    this.menuElement.style.top = '0';
    this.menuElement.style.left = '0';
    this.menuElement.style.width = '100%';
    this.menuElement.style.height = '100%';
    this.menuElement.style.display = 'none'; // Initially hidden
    this.menuElement.style.flexDirection = 'column';
    this.menuElement.style.justifyContent = 'center';
    this.menuElement.style.alignItems = 'center';
    this.menuElement.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'; // Slightly darker background
    this.menuElement.style.color = '#fff';
    this.menuElement.style.fontFamily = 'Arial, sans-serif';
    this.menuElement.style.zIndex = '150'; // Ensure it's above the main menu if needed

    // Create title
    const title = document.createElement('h1');
    title.textContent = 'SETTINGS';
    title.style.fontSize = '3rem';
    title.style.margin = '0 0 2rem 0';
    title.style.color = '#cccccc';
    title.style.textAlign = 'center';

    // Settings container
    const settingsContainer = document.createElement('div');
    settingsContainer.style.display = 'flex';
    settingsContainer.style.flexDirection = 'column';
    settingsContainer.style.alignItems = 'center';
    settingsContainer.style.gap = '1.5rem';
    settingsContainer.style.marginBottom = '2rem';
    settingsContainer.style.padding = '2rem';
    settingsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    settingsContainer.style.borderRadius = '10px';
    settingsContainer.style.minWidth = '300px';

    // --- Player Color Setting ---
    const colorSettingDiv = document.createElement('div');
    colorSettingDiv.style.display = 'flex';
    colorSettingDiv.style.alignItems = 'center';
    colorSettingDiv.style.gap = '1rem';

    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Player Color:';
    colorLabel.style.fontSize = '1.2rem';

    this.colorInput = document.createElement('input');
    this.colorInput.type = 'color';
    this.colorInput.value = `#${this.settings.playerColor.toString(16).padStart(6, '0')}`; // Load initial color
    this.colorInput.style.padding = '0.2rem';
    this.colorInput.style.border = '1px solid #ccc';
    this.colorInput.style.borderRadius = '5px';
    this.colorInput.style.cursor = 'pointer';
    this.colorInput.style.width = '50px';
    this.colorInput.style.height = '30px';

    colorSettingDiv.appendChild(colorLabel);
    colorSettingDiv.appendChild(this.colorInput);
    settingsContainer.appendChild(colorSettingDiv);

    // --- Keybind Settings (Placeholder) ---
    const keybindTitle = document.createElement('h3');
    keybindTitle.textContent = 'Keybinds (Coming Soon)';
    keybindTitle.style.color = '#aaa';
    keybindTitle.style.marginTop = '1rem';
    settingsContainer.appendChild(keybindTitle);


    // --- Back Button ---
    this.backButton = document.createElement('button');
    this.backButton.textContent = 'BACK';
    this.backButton.style.padding = '1rem 2rem';
    this.backButton.style.fontSize = '1.5rem';
    this.backButton.style.backgroundColor = '#555555';
    this.backButton.style.color = '#fff';
    this.backButton.style.border = 'none';
    this.backButton.style.borderRadius = '5px';
    this.backButton.style.cursor = 'pointer';
    this.backButton.style.marginTop = '1rem'; // Add some space above
    this.backButton.style.transition = 'background-color 0.2s';

    // Add hover effect for back button
    this.backButton.addEventListener('mouseover', () => {
      this.backButton.style.backgroundColor = '#777777';
    });
    this.backButton.addEventListener('mouseout', () => {
      this.backButton.style.backgroundColor = '#555555';
    });


    // Append elements
    this.menuElement.appendChild(title);
    this.menuElement.appendChild(settingsContainer);
    this.menuElement.appendChild(this.backButton);

    // Append menu to container
    this.container.appendChild(this.menuElement);
  }

  setupEventListeners() {
    // Color input change
    this.colorInput.addEventListener('change', (event) => {
      const newColorHex = event.target.value.substring(1); // Remove #
      const newColorInt = parseInt(newColorHex, 16);
      this.settings.playerColor = newColorInt;
      this.settings.save(); // Save setting immediately
      
      // Apply color change immediately if game is running
      if (window.gameInstance && window.gameInstance.isRunning) {
        window.gameInstance.player.applyColor(this.settings.getPlayerColorTHREE());
      }
    });

    // Back button listener
    this.backButton.addEventListener('click', () => {
      this.hide();
      this.showMainMenuCallback(); // Show the main menu again
    });

    // Add touch support for back button
    this.backButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.hide();
      this.showMainMenuCallback();
    });
  }

  show() {
    this.active = true;
    // Refresh color input in case settings were loaded/changed elsewhere
    this.colorInput.value = `#${this.settings.playerColor.toString(16).padStart(6, '0')}`;
    this.menuElement.style.display = 'flex';
  }

  hide() {
    this.active = false;
    this.menuElement.style.display = 'none';
  }

  isActive() {
    return this.active;
  }
}

// Basic settings class (can be expanded)
// REMOVED from here - moved to settings.js 
