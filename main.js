import * as THREE from 'three';
import { Game } from './game.js';
import { MainMenu } from './mainMenu.js';
// Store a global reference to running game
window.gameInstance = null;
// Get the render target
const renderDiv = document.getElementById('renderDiv');
// Initialize the game with the render target but don't start it yet
const game = new Game(renderDiv);
// Create the main menu
const mainMenu = new MainMenu(renderDiv, () => {
  // Start the game when the start button is clicked
  game.start();
  
  // Store reference to current game
  window.gameInstance = game;
});
// Handle game over events
window.gameOver = (score) => {
  // Hide any weapon selection that might be open
  if (game.weaponSelectionMenu.isActive()) {
    game.weaponSelectionMenu.hide();
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
  
  const buttonContainer = document.createElement('div'); // Create a container for buttons
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '20px'; // Add some space between buttons

  const restartButton = document.createElement('button');
  restartButton.textContent = 'PLAY AGAIN';
  restartButton.style.padding = '15px 30px';
  restartButton.style.fontSize = '1.5rem';
  restartButton.style.backgroundColor = '#aa0000';
  restartButton.style.color = '#fff';
  restartButton.style.border = 'none';
  restartButton.style.borderRadius = '5px';
  restartButton.style.cursor = 'pointer';

  restartButton.addEventListener('click', () => {
    renderDiv.removeChild(gameOverScreen);
    game.start();
  });

  const mainMenuButton = document.createElement('button'); // Create Main Menu button
  mainMenuButton.textContent = 'MAIN MENU';
  mainMenuButton.style.padding = '15px 30px';
  mainMenuButton.style.fontSize = '1.5rem';
  mainMenuButton.style.backgroundColor = '#0055aa'; // Different color
  mainMenuButton.style.color = '#fff';
  mainMenuButton.style.border = 'none';
  mainMenuButton.style.borderRadius = '5px';
  mainMenuButton.style.cursor = 'pointer';

  mainMenuButton.addEventListener('click', () => {
    location.reload(); // Reload the page to go back to the main menu
  });

  gameOverScreen.appendChild(gameOverTitle);
  gameOverScreen.appendChild(scoreDisplay);
  buttonContainer.appendChild(restartButton); // Add restart button to container
  buttonContainer.appendChild(mainMenuButton); // Add main menu button to container
  gameOverScreen.appendChild(buttonContainer); // Add container to screen

  renderDiv.appendChild(gameOverScreen);
};

