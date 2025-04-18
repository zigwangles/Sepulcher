export class InputHandler {
  constructor(settings) {
    this.settings = settings;
    this.activeKeys = new Set();
    
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // For touch devices
    this.setupTouchControls();
  }
  
  onKeyDown(event) {
    this.activeKeys.add(event.code);
  }
  
  onKeyUp(event) {
    this.activeKeys.delete(event.code);
  }
  
  setupTouchControls() {
    this.touchControls = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    };
    
    window.addEventListener('touchstart', (e) => {
      this.touchControls.active = true;
      this.touchControls.startX = e.touches[0].clientX;
      this.touchControls.startY = e.touches[0].clientY;
      this.touchControls.currentX = this.touchControls.startX;
      this.touchControls.currentY = this.touchControls.startY;
    });
    
    window.addEventListener('touchmove', (e) => {
      if (this.touchControls.active) {
        this.touchControls.currentX = e.touches[0].clientX;
        this.touchControls.currentY = e.touches[0].clientY;
      }
    });
    
    window.addEventListener('touchend', () => {
      this.touchControls.active = false;
    });
  }
  
  getDirection() {
    const direction = { x: 0, y: 0 };
    
    if (this.activeKeys.has(this.settings.keybinds.up) || this.activeKeys.has('ArrowUp')) direction.y = -1;
    if (this.activeKeys.has(this.settings.keybinds.down) || this.activeKeys.has('ArrowDown')) direction.y = 1;
    if (this.activeKeys.has(this.settings.keybinds.left) || this.activeKeys.has('ArrowLeft')) direction.x = -1;
    if (this.activeKeys.has(this.settings.keybinds.right) || this.activeKeys.has('ArrowRight')) direction.x = 1;
    
    if (this.touchControls.active) {
      const dx = this.touchControls.currentX - this.touchControls.startX;
      const dy = this.touchControls.currentY - this.touchControls.startY;
      const threshold = 20;
      
      let touchX = 0;
      let touchY = 0;
      if (Math.abs(dx) > threshold) touchX = Math.sign(dx);
      if (Math.abs(dy) > threshold) touchY = Math.sign(dy);

      if (direction.x === 0 && direction.y === 0) {
          direction.x = touchX;
          direction.y = touchY; 
      }
    }
    
    return direction;
  }
}
