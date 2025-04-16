import * as THREE from 'three';

export class MainMenu {
  constructor(container, startGameCallback) {
    this.container = container;
    this.startGameCallback = startGameCallback;
    // Add callbacks for other menu items if needed
    this.leaderboardCallback = () => console.log('Leaderboard clicked');
    this.settingsCallback = () => console.log('Settings clicked');
    this.aboutCallback = () => console.log('About clicked');
    
    this.active = true;
    this.menuElement = null; // Initialize as null
    
    this.createMenu();
    // No need for explicit event listeners here if handled via event delegation or direct assignment in createMenu
  }
  
  createMenu() {
    // Remove existing menu if it exists
    if (this.menuElement && this.menuElement.parentNode) {
      this.menuElement.parentNode.removeChild(this.menuElement);
    }

    // Create menu container using overlay style
    this.menuElement = document.createElement('div');
    this.menuElement.id = 'main-menu'; // Add ID for specific styling
    this.menuElement.className = 'overlay-menu'; // Use general overlay class from style.css
    // Most styles like position, display, bg color, alignment are handled by .overlay-menu class

    // --- Title Section ---
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.justifyContent = 'center';
    titleContainer.style.marginBottom = '1rem';

    const skullIconLeft = document.createElement('span');
    skullIconLeft.textContent = '💀'; // Placeholder skull icon
    skullIconLeft.style.fontSize = '3rem';
    skullIconLeft.style.marginRight = '1.5rem';
    skullIconLeft.style.color = '#cc0000'; // Red color for icons

    const title = document.createElement('h1');
    title.textContent = 'SEPULCHER'; 
    title.style.fontSize = '4.5rem'; 
    title.style.color = '#cc0000'; // Red color for title
    title.style.margin = '0'; // Remove default margin
    title.style.fontFamily = 'Georgia, serif'; // Explicitly set title font
    // Remove text shadow from previous style

    const skullIconRight = document.createElement('span');
    skullIconRight.textContent = '💀'; // Placeholder skull icon
    skullIconRight.style.fontSize = '3rem';
    skullIconRight.style.marginLeft = '1.5rem';
    skullIconRight.style.color = '#cc0000'; // Red color for icons

    titleContainer.appendChild(skullIconLeft);
    titleContainer.appendChild(title);
    titleContainer.appendChild(skullIconRight);

    // --- Subtitle ---
    const subtitle = document.createElement('p');
    subtitle.textContent = 'THE DARKNESS AWAITS';
    subtitle.style.fontSize = '1.2rem';
    subtitle.style.color = '#aaaaaa'; // Lighter grey for subtitle
    subtitle.style.margin = '0 0 2.5rem 0';
    subtitle.style.textAlign = 'center';
    subtitle.style.fontFamily = 'Georgia, serif'; // Match title font family? Or Arial?

    // --- Menu Items ---
    const menuItemsContainer = document.createElement('div');
    menuItemsContainer.style.display = 'flex';
    menuItemsContainer.style.flexDirection = 'column';
    menuItemsContainer.style.alignItems = 'center';

    const menuItems = [
      { text: 'PLAY', icon: '▶', callback: this.startGameCallback },
      { text: 'LEADERBOARD', icon: '🏆', callback: this.leaderboardCallback },
      { text: 'SETTINGS', icon: '⚙️', callback: this.settingsCallback },
      { text: 'ABOUT', icon: 'ℹ️', callback: this.aboutCallback },
    ];

    menuItems.forEach(item => {
      const menuItemElement = document.createElement('button');
      menuItemElement.className = 'menu-item'; // Use class for styling from style.css
      
      // Create icon span
      const iconSpan = document.createElement('span');
      iconSpan.textContent = item.icon + ' '; // Add space after icon
      iconSpan.style.marginRight = '10px'; 
      iconSpan.style.display = 'inline-block'; // Ensure icon is on the same line
      iconSpan.style.width = '20px'; // Allocate space for icon
      iconSpan.style.textAlign = 'center';

      // Create text span
      const textSpan = document.createElement('span');
      textSpan.textContent = item.text;

      // Clear default button styles and apply menu-item styles via class
      menuItemElement.style.border = 'none'; // Remove default button border if needed
      menuItemElement.style.background = 'none'; // Use background from class
      menuItemElement.style.padding = '10px 20px';
      menuItemElement.style.fontSize = '1.3rem';
      menuItemElement.style.color = '#ccc'; // Use text color from style.css
      menuItemElement.style.display = 'flex';
      menuItemElement.style.alignItems = 'center';
      menuItemElement.style.width = '250px'; // Set a fixed width for alignment
      menuItemElement.style.justifyContent = 'flex-start'; // Align icon and text left
      menuItemElement.style.marginBottom = '15px';

      // Add hover effect (can also be done purely in CSS)
       menuItemElement.addEventListener('mouseover', () => {
          menuItemElement.style.backgroundColor = 'rgba(50, 50, 50, 0.9)'; 
          menuItemElement.style.color = '#fff';
      });
      menuItemElement.addEventListener('mouseout', () => {
          menuItemElement.style.backgroundColor = 'transparent'; // Back to no background or inherit
          menuItemElement.style.color = '#ccc';
      });

      menuItemElement.addEventListener('click', () => {
          if (item.text === 'PLAY') {
              this.hide(); // Hide menu only when starting game
          }
          item.callback(); // Execute the assigned callback
      });
      
      // Add touch support if needed
      menuItemElement.addEventListener('touchstart', (e) => {
          e.preventDefault(); // Prevent double-tap zoom
          if (item.text === 'PLAY') {
             this.hide();
          }
          item.callback();
      }, { passive: false });

      menuItemElement.appendChild(iconSpan);
      menuItemElement.appendChild(textSpan);
      menuItemsContainer.appendChild(menuItemElement);
    });
    
    // Append elements to menu container
    this.menuElement.appendChild(titleContainer);
    this.menuElement.appendChild(subtitle);
    this.menuElement.appendChild(menuItemsContainer);
    
    // Append menu to the main container
    this.container.appendChild(this.menuElement);
  }
  
  // Remove pulse animation, hover effects are now handled
  // Remove setupEventListeners as they are added directly in createMenu
  
  hide() {
    this.active = false;
    if (this.menuElement) {
      this.menuElement.classList.add('hidden'); // Use class to hide
      // Alternatively: this.menuElement.style.display = 'none';
    }
  }
  
  show() {
    this.active = true;
    if (!this.menuElement) { // If menu doesn't exist, create it
      this.createMenu();
    } 
    if (this.menuElement) { // Ensure element exists before showing
        this.menuElement.classList.remove('hidden'); // Use class to show
        // Alternatively: this.menuElement.style.display = 'flex';
    }
  }
}
