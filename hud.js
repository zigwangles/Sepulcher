export class HUD {
  constructor(container) {
    this.container = container;
    this.gameTime = 0;
    this.score = 0;
    this.health = 100;
    
    this.createHUD();
  }
  
  createHUD() {
    // Create HUD container
    this.hudElement = document.createElement('div');
    this.hudElement.className = 'game-hud';
    this.hudElement.style.position = 'absolute';
    this.hudElement.style.top = '0';
    this.hudElement.style.left = '0';
    this.hudElement.style.width = '100%';
    this.hudElement.style.padding = '10px';
    this.hudElement.style.boxSizing = 'border-box';
    this.hudElement.style.display = 'flex';
    this.hudElement.style.justifyContent = 'space-between';
    this.hudElement.style.alignItems = 'flex-start';
    this.hudElement.style.color = '#fff';
    this.hudElement.style.fontFamily = 'Arial, sans-serif';
    this.hudElement.style.pointerEvents = 'none'; // Make HUD not block clicks/touches
    this.hudElement.style.zIndex = '10';
    
    // Create left panel (health)
    const leftPanel = document.createElement('div');
    leftPanel.style.display = 'flex';
    leftPanel.style.flexDirection = 'column';
    leftPanel.style.alignItems = 'flex-start';
    
    const healthLabel = document.createElement('div');
    healthLabel.textContent = 'HEALTH';
    healthLabel.style.fontSize = '0.8rem';
    healthLabel.style.opacity = '0.8';
    healthLabel.style.marginBottom = '5px';
    
    this.healthBar = document.createElement('div');
    this.healthBar.style.width = '120px';
    this.healthBar.style.height = '15px';
    this.healthBar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.healthBar.style.border = '1px solid #888';
    this.healthBar.style.borderRadius = '3px';
    this.healthBar.style.overflow = 'hidden';
    
    this.healthFill = document.createElement('div');
    this.healthFill.style.width = '100%';
    this.healthFill.style.height = '100%';
    this.healthFill.style.backgroundColor = '#ff3333';
    this.healthFill.style.transition = 'width 0.3s';
    
    this.healthBar.appendChild(this.healthFill);
    leftPanel.appendChild(healthLabel);
    leftPanel.appendChild(this.healthBar);
    
    // Create center panel (time)
    const centerPanel = document.createElement('div');
    centerPanel.style.display = 'flex';
    centerPanel.style.flexDirection = 'column';
    centerPanel.style.alignItems = 'center';
    centerPanel.style.textAlign = 'center';
    
    const timeLabel = document.createElement('div');
    timeLabel.textContent = 'TIME';
    timeLabel.style.fontSize = '0.8rem';
    timeLabel.style.opacity = '0.8';
    timeLabel.style.marginBottom = '5px';
    
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.textContent = '00:00';
    this.timeDisplay.style.fontSize = '1.5rem';
    this.timeDisplay.style.fontWeight = 'bold';
    this.timeDisplay.style.textShadow = '0 0 5px #000';
    
    centerPanel.appendChild(timeLabel);
    centerPanel.appendChild(this.timeDisplay);
    
    // Create right panel (score)
    const rightPanel = document.createElement('div');
    rightPanel.style.display = 'flex';
    rightPanel.style.flexDirection = 'column';
    rightPanel.style.alignItems = 'flex-end';
    rightPanel.style.textAlign = 'right';
    
    const scoreLabel = document.createElement('div');
    scoreLabel.textContent = 'SCORE';
    scoreLabel.style.fontSize = '0.8rem';
    scoreLabel.style.opacity = '0.8';
    scoreLabel.style.marginBottom = '5px';
    
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.textContent = '0';
    this.scoreDisplay.style.fontSize = '1.5rem';
    this.scoreDisplay.style.fontWeight = 'bold';
    this.scoreDisplay.style.textShadow = '0 0 5px #000';
    
    rightPanel.appendChild(scoreLabel);
    rightPanel.appendChild(this.scoreDisplay);
    
    // Add panels to HUD
    this.hudElement.appendChild(leftPanel);
    this.hudElement.appendChild(centerPanel);
    this.hudElement.appendChild(rightPanel);
    
    // Append HUD to container
    this.container.appendChild(this.hudElement);
    
    // Initially hide the HUD
    this.hide();
  }
  
  update(delta) {
    // Update game time
    this.gameTime += delta;
    
    // Format time as MM:SS
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    this.timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update health bar
    this.healthFill.style.width = `${this.health}%`;
    
    // Update health bar color based on remaining health
    if (this.health > 60) {
      this.healthFill.style.backgroundColor = '#33cc33'; // Green for high health
    } else if (this.health > 30) {
      this.healthFill.style.backgroundColor = '#ffcc00'; // Yellow for medium health
    } else {
      this.healthFill.style.backgroundColor = '#ff3333'; // Red for low health
    }
    
    // Update score
    this.scoreDisplay.textContent = this.score.toString();
  }
  
  updateScore(newScore) {
    this.score = newScore;
    this.scoreDisplay.textContent = this.score.toString();
    
    // Add a flash effect when score changes
    this.scoreDisplay.style.transform = 'scale(1.2)';
    this.scoreDisplay.style.color = '#ffcc00';
    
    setTimeout(() => {
      this.scoreDisplay.style.transform = 'scale(1)';
      this.scoreDisplay.style.color = '#fff';
    }, 300);
  }
  
  updateHealth(newHealth) {
    this.health = Math.max(0, Math.min(100, newHealth)); // Clamp between 0-100
    this.healthFill.style.width = `${this.health}%`;
    
    // Update color based on remaining health
    if (this.health > 60) {
      this.healthFill.style.backgroundColor = '#33cc33';
    } else if (this.health > 30) {
      this.healthFill.style.backgroundColor = '#ffcc00';
    } else {
      this.healthFill.style.backgroundColor = '#ff3333';
    }
    
    // Add shake effect when health decreases
    if (newHealth < this.health) {
      this.healthBar.style.transform = 'translateX(3px)';
      setTimeout(() => {
        this.healthBar.style.transform = 'translateX(-3px)';
        setTimeout(() => {
          this.healthBar.style.transform = 'translateX(0)';
        }, 100);
      }, 100);
    }
  }
  
  show() {
    this.hudElement.style.display = 'flex';
  }
  
  hide() {
    this.hudElement.style.display = 'none';
  }
  
  // Make HUD responsive
  updateResponsiveLayout() {
    if (window.innerWidth < 600) {
      // Mobile layout
      this.hudElement.style.flexDirection = 'row';
      this.hudElement.style.padding = '5px';
      this.timeDisplay.style.fontSize = '1.2rem';
      this.scoreDisplay.style.fontSize = '1.2rem';
      this.healthBar.style.width = '80px';
    } else {
      // Desktop layout
      this.hudElement.style.flexDirection = 'row';
      this.hudElement.style.padding = '10px';
      this.timeDisplay.style.fontSize = '1.5rem';
      this.scoreDisplay.style.fontSize = '1.5rem';
      this.healthBar.style.width = '120px';
    }
  }
}
