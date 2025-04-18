import * as THREE from 'three';

// Basic settings class (can be expanded)
export class Settings {
    constructor() {
        this.loadDefaults();
        this.load(); // Load saved settings over defaults
    }

    loadDefaults() {
        // Default values
        this.playerColor = 0x00ff00; // Default Green
        this.keybinds = {
            up: 'KeyW',
            down: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            // Add other actions here (e.g., interact, shoot, etc.)
            // Example:
            // interact: 'KeyE',
            // shoot: 'Space' 
        };
        // Add other default settings here
        // Example:
        // this.masterVolume = 0.8;
        // this.showFPS = false;
    }

    load() {
        try {
            const savedSettings = localStorage.getItem('gameSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                // Carefully merge loaded settings, keeping defaults if missing
                if (parsed.playerColor !== undefined) {
                    this.playerColor = parsed.playerColor;
                }
                if (parsed.keybinds) {
                     // Ensure only valid keybinds are loaded and defaults are kept for missing ones
                     for (const key in this.keybinds) {
                         if (parsed.keybinds[key] !== undefined) {
                             this.keybinds[key] = parsed.keybinds[key];
                         }
                     }
                }
                // Load other settings...
                // Example:
                // if (parsed.masterVolume !== undefined) {
                //     this.masterVolume = parsed.masterVolume;
                // }
                // if (parsed.showFPS !== undefined) {
                //     this.showFPS = parsed.showFPS;
                // }
            }
        } catch (e) {
            console.error("Failed to load settings:", e);
            this.loadDefaults(); // Fallback to defaults on error
        }
    }

    save() {
        try {
            const settingsToSave = {
                playerColor: this.playerColor,
                keybinds: this.keybinds,
                // Add other settings...
                // Example:
                // masterVolume: this.masterVolume,
                // showFPS: this.showFPS,
            };
            localStorage.setItem('gameSettings', JSON.stringify(settingsToSave));
        } catch (e) {
            console.error("Failed to save settings:", e);
        }
    }

    getPlayerColorTHREE() {
        return new THREE.Color(this.playerColor);
    }
} 
