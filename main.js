import * as THREE from 'three';
import { Game } from './game.js';
import { MainMenu } from './mainMenu.js';
import { SettingsMenu } from './settingsMenu.js';
import { Settings } from './settings.js';

// Store a global reference to running game
window.gameInstance = null;
// Get the render target
const renderDiv = document.getElementById('renderDiv');

// Load settings first
const settings = new Settings();

// Initialize the game with the render target and settings, but don't start it yet
const game = new Game(renderDiv, settings);

// Create the settings menu, passing a callback to show the main menu
const settingsMenu = new SettingsMenu(renderDiv, () => {
  mainMenu.show();
});

// Create the main menu, passing callbacks for starting game and showing settings
const mainMenu = new MainMenu(renderDiv, 
  () => {
    game.start();
    window.gameInstance = game;
  },
  () => {
    settingsMenu.show();
  }
);

// Show the main menu immediately
mainMenu.show();

// Handle game over events
window.gameOver = (score) => {
  // Hide any weapon selection or settings menu that might be open
  if (game.weaponSelectionMenu.isActive()) {
    game.weaponSelectionMenu.hide();
  }
  if (settingsMenu.isActive()) {
    settingsMenu.hide();
  }
  
  // Show game over screen
  const gameOverScreen = document.createElement('div');
  gameOverScreen.style.position = 'absolute';
  gameOverScreen.style.top = '0';
  gameOverScreen.style.left = '0';
  gameOverScreen.style.width = '100%';
  gameOverScreen.style.height = '100%';
  gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  gameOverScreen.style.color = '#fff';
  gameOverScreen.style.display = 'flex';
  gameOverScreen.style.flexDirection = 'column';
  gameOverScreen.style.alignItems = 'center';
  gameOverScreen.style.justifyContent = 'center';
  gameOverScreen.style.zIndex = '1000';
  
  const gameOverTitle = document.createElement('h1');
  gameOverTitle.textContent = 'GAME OVER';
  gameOverTitle.style.fontSize = '4rem';
  gameOverTitle.style.margin = '0 0 20px 0';
  gameOverTitle.style.color = '#ff3333';
  gameOverTitle.style.textShadow = '0 0 10px #ff0000';
  
  const scoreDisplay = document.createElement('div');
  scoreDisplay.textContent = `Score: ${score}`;
  scoreDisplay.style.fontSize = '2rem';
  scoreDisplay.style.margin = '0 0 40px 0';
  
  const mainMenuButton = document.createElement('button');
  mainMenuButton.textContent = 'MAIN MENU';
  mainMenuButton.style.padding = '15px 30px';
  mainMenuButton.style.fontSize = '1.5rem';
  mainMenuButton.style.backgroundColor = '#555555';
  mainMenuButton.style.color = '#fff';
  mainMenuButton.style.border = 'none';
  mainMenuButton.style.borderRadius = '5px';
  mainMenuButton.style.cursor = 'pointer';
  mainMenuButton.style.margin = '10px';
  
  mainMenuButton.addEventListener('click', () => {
    // Reload page on Main Menu click
    window.location.reload();
  });
  
  gameOverScreen.appendChild(gameOverTitle);
  gameOverScreen.appendChild(scoreDisplay);
  gameOverScreen.appendChild(mainMenuButton);
  
  renderDiv.appendChild(gameOverScreen);
};
