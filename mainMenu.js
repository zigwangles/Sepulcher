import * as THREE from 'three';

export class MainMenu {
  constructor(container, startGameCallback) {
    this.container = container;
    this.startGameCallback = startGameCallback;
    this.active = true;
    
    this.createMenu();
    this.setupEventListeners();
  }
  
  createMenu() {
    // Create menu container
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'main-menu';
    this.menuElement.style.position = 'absolute';
    this.menuElement.style.top = '0';
    this.menuElement.style.left = '0';
    this.menuElement.style.width = '100%';
    this.menuElement.style.height = '100%';
    this.menuElement.style.display = 'flex';
    this.menuElement.style.flexDirection = 'column';
    this.menuElement.style.justifyContent = 'center';
    this.menuElement.style.alignItems = 'center';
    this.menuElement.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    this.menuElement.style.color = '#fff';
    this.menuElement.style.fontFamily = 'Arial, sans-serif';
    this.menuElement.style.zIndex = '100';
    
    // Create title
    const title = document.createElement('h1');
    title.textContent = 'INFINITE SURVIVOR';
    title.style.fontSize = '4rem';
    title.style.margin = '0 0 2rem 0';
    title.style.textShadow = '0 0 10px #ff5500, 0 0 20px #ff5500, 0 0 30px #ff5500';
    title.style.color = '#ffaa00';
    title.style.textAlign = 'center';
    title.style.width = '100%';
    
    // Create start button
    this.startButton = document.createElement('button');
    this.startButton.textContent = 'START GAME';
    this.startButton.style.padding = '1rem 2rem';
    this.startButton.style.fontSize = '1.5rem';
    this.startButton.style.backgroundColor = '#aa0000';
    this.startButton.style.color = '#fff';
    this.startButton.style.border = 'none';
    this.startButton.style.borderRadius = '5px';
    this.startButton.style.cursor = 'pointer';
    this.startButton.style.marginBottom = '1rem';
    this.startButton.style.boxShadow = '0 0 10px #ff5500';
    this.startButton.style.transition = 'transform 0.2s, background-color 0.2s';
    
    // Create how to play section
    const howToPlay = document.createElement('div');
    howToPlay.style.marginTop = '2rem';
    howToPlay.style.textAlign = 'center';
    
    const howToPlayTitle = document.createElement('h2');
    howToPlayTitle.textContent = 'How to Play';
    howToPlayTitle.style.fontSize = '1.5rem';
    howToPlayTitle.style.marginBottom = '1rem';
    
    const controls = document.createElement('p');
    controls.textContent = 'WASD or Arrow Keys to move | Weapons auto-fire';
    controls.style.fontSize = '1.2rem';
    controls.style.margin = '0.5rem 0';
    
    const objective = document.createElement('p');
    objective.textContent = 'Survive as long as possible!';
    objective.style.fontSize = '1.2rem';
    objective.style.margin = '0.5rem 0';
    
    // Add pulse animation to start button
    this.pulseAnimation();
    
    // Add hover effect
    this.startButton.addEventListener('mouseover', () => {
      this.startButton.style.backgroundColor = '#ff0000';
      this.startButton.style.transform = 'scale(1.1)';
    });
    
    this.startButton.addEventListener('mouseout', () => {
      this.startButton.style.backgroundColor = '#aa0000';
      this.startButton.style.transform = 'scale(1)';
    });
    
    // Append elements to menu
    howToPlay.appendChild(howToPlayTitle);
    howToPlay.appendChild(controls);
    howToPlay.appendChild(objective);
    
    this.menuElement.appendChild(title);
    this.menuElement.appendChild(this.startButton);
    this.menuElement.appendChild(howToPlay);
    
    // Append menu to container
    this.container.appendChild(this.menuElement);
  }
  
  pulseAnimation() {
    let scale = 1;
    let growing = true;
    
    const animate = () => {
      if (!this.active) return;
      
      if (growing) {
        scale += 0.001;
        if (scale >= 1.05) growing = false;
      } else {
        scale -= 0.001;
        if (scale <= 1) growing = true;
      }
      
      this.startButton.style.transform = `scale(${scale})`;
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  setupEventListeners() {
    this.startButton.addEventListener('click', () => {
      this.hide();
      this.startGameCallback();
    });
    
    // Add touch support
    this.startButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.hide();
      this.startGameCallback();
    });
  }
  
  hide() {
    this.active = false;
    this.menuElement.style.display = 'none';
  }
  
  show() {
    this.active = true;
    this.menuElement.style.display = 'flex';
  }
}
