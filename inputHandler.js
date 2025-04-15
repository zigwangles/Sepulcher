export class InputHandler {
  constructor() {
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      s: false,
      a: false,
      d: false
    };
    
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // For touch devices
    this.setupTouchControls();
  }
  
  onKeyDown(event) {
    if (this.keys.hasOwnProperty(event.key)) {
      this.keys[event.key] = true;
    }
  }
  
  onKeyUp(event) {
    if (this.keys.hasOwnProperty(event.key)) {
      this.keys[event.key] = false;
    }
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
    
    // Keyboard input
    if (this.keys.ArrowUp || this.keys.w) direction.y = -1;
    if (this.keys.ArrowDown || this.keys.s) direction.y = 1;
    if (this.keys.ArrowLeft || this.keys.a) direction.x = -1;
    if (this.keys.ArrowRight || this.keys.d) direction.x = 1;
    
    // Touch input
    if (this.touchControls.active) {
      const dx = this.touchControls.currentX - this.touchControls.startX;
      const dy = this.touchControls.currentY - this.touchControls.startY;
      const threshold = 20;
      
      if (Math.abs(dx) > threshold) direction.x = Math.sign(dx);
      if (Math.abs(dy) > threshold) direction.y = Math.sign(dy);
    }
    
    return direction;
  }
}
