export class HUD {
  constructor(container) {
    this.container = container;
    this.gameTime = 0;
    this.score = 0;
    this.health = 100;
    this.hudElement = null; // Initialize
    
    this.createHUD();
    // Add listener for resize to update layout
    window.addEventListener('resize', () => this.updateResponsiveLayout());
  }
  
  createHUD() {
    // Remove existing HUD if it exists
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }

    // Create HUD container
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'game-hud'; // Add ID
    this.hudElement.className = 'game-hud'; // Add class for styling
    // Most styles handled by CSS now
    // Remove inline: position, top, left, width, padding, boxSizing, display, justifyContent, alignItems, color, fontFamily, zIndex
    // Keep pointerEvents
    this.hudElement.style.pointerEvents = 'none';
    
    // Create left panel (health)
    const leftPanel = document.createElement('div');
    leftPanel.className = 'hud-panel hud-panel-left';
    // Remove inline styles
    
    const healthLabel = document.createElement('div');
    healthLabel.className = 'hud-label';
    healthLabel.textContent = 'HEALTH';
    // Remove inline styles
    
    this.healthBar = document.createElement('div');
    this.healthBar.className = 'hud-health-bar';
    // Remove inline styles
    
    this.healthFill = document.createElement('div');
    this.healthFill.className = 'hud-health-fill';
    // Remove inline styles
    
    this.healthBar.appendChild(this.healthFill);
    leftPanel.appendChild(healthLabel);
    leftPanel.appendChild(this.healthBar);
    
    // Create center panel (time)
    const centerPanel = document.createElement('div');
    centerPanel.className = 'hud-panel hud-panel-center';
    // Remove inline styles
    
    const timeLabel = document.createElement('div');
    timeLabel.className = 'hud-label';
    timeLabel.textContent = 'TIME';
    // Remove inline styles
    
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.className = 'hud-value hud-time';
    this.timeDisplay.textContent = '00:00';
    // Remove inline styles
    
    centerPanel.appendChild(timeLabel);
    centerPanel.appendChild(this.timeDisplay);
    
    // Create right panel (score)
    const rightPanel = document.createElement('div');
    rightPanel.className = 'hud-panel hud-panel-right';
    // Remove inline styles
    
    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'hud-label';
    scoreLabel.textContent = 'SCORE';
    // Remove inline styles
    
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'hud-value hud-score';
    this.scoreDisplay.textContent = '0';
    // Remove inline styles
    
    rightPanel.appendChild(scoreLabel);
    rightPanel.appendChild(this.scoreDisplay);
    
    // Add panels to HUD
    this.hudElement.appendChild(leftPanel);
    this.hudElement.appendChild(centerPanel);
    this.hudElement.appendChild(rightPanel);
    
    // Append HUD to container
    this.container.appendChild(this.hudElement);
    
    // Apply initial styles and layout
    this.updateHealth(this.health); // Apply initial health bar style
    this.updateResponsiveLayout(); // Apply initial layout
    
    // Initially hide the HUD
    this.hide();
  }
  
  update(delta) {
    // Update game time
    this.gameTime += delta;
    
    // Format time as MM:SS
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    if (this.timeDisplay) { // Check if element exists
        this.timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Health bar width/color is updated in updateHealth
    
    // Update score is handled in updateScore
    // if (this.scoreDisplay) { // Check if element exists
    //     this.scoreDisplay.textContent = this.score.toString();
    // }
  }
  
  updateScore(newScore) {
    this.score = newScore;
    if (!this.scoreDisplay) return; // Guard clause
    this.scoreDisplay.textContent = this.score.toString();
    
    // Add a flash effect using classes
    this.scoreDisplay.classList.add('flash');
    // Remove the class after the animation duration (match CSS)
    setTimeout(() => {
        if (this.scoreDisplay) this.scoreDisplay.classList.remove('flash');
    }, 300); 
  }
  
  updateHealth(newHealth) {
    const oldHealth = this.health;
    this.health = Math.max(0, Math.min(100, newHealth)); // Clamp between 0-100
    
    if (!this.healthFill || !this.healthBar) return; // Guard clauses

    this.healthFill.style.width = `${this.health}%`;
    
    // Update color based on remaining health using classes or direct style
    let colorClass = 'health-high';
    if (this.health <= 30) {
        colorClass = 'health-low';
    } else if (this.health <= 60) {
        colorClass = 'health-medium';
    }
    // Remove old classes, add new one
    this.healthFill.classList.remove('health-high', 'health-medium', 'health-low');
    this.healthFill.classList.add(colorClass);
    
    // Add shake effect when health decreases
    if (newHealth < oldHealth) {
        this.healthBar.classList.add('shake');
        // Remove the class after animation duration
        setTimeout(() => {
            if (this.healthBar) this.healthBar.classList.remove('shake');
        }, 200); // Match CSS animation duration
    }
  }
  
  show() {
    if (this.hudElement) {
        this.hudElement.style.display = 'flex';
        this.updateResponsiveLayout(); // Ensure layout is correct when shown
    }
  }
  
  hide() {
    if (this.hudElement) {
        this.hudElement.style.display = 'none';
    }
  }
  
  // Make HUD responsive - simpler version, specific styles in CSS
  updateResponsiveLayout() {
    // Logic can be simplified if CSS media queries handle layout changes
    // This function might still be needed for dynamic adjustments
    // console.log('Updating responsive layout');
  }
  
  // Add dispose method to remove element and listeners
  dispose() {
    if (this.hudElement && this.hudElement.parentNode) {
        this.hudElement.parentNode.removeChild(this.hudElement);
    }
    this.hudElement = null;
    window.removeEventListener('resize', this.updateResponsiveLayout);
  }
}
