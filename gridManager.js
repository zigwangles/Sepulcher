import * as THREE from 'three';

export class GridManager {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 10; // Size of each grid section
    this.visibleRange = 3; // How many grid sections to show in each direction
    
    this.gridSections = new Map(); // Map to store grid sections
    
    // Material for grid sections
    this.materials = [
      new THREE.MeshStandardMaterial({ color: 0x444455, wireframe: false }),
      new THREE.MeshStandardMaterial({ color: 0x555566, wireframe: false })
    ];
    
    // Grid lines material
    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0x666688, transparent: true, opacity: 0.5 });
  }
  
  getGridKey(x, z) {
    return `${Math.floor(x / this.gridSize)},${Math.floor(z / this.gridSize)}`;
  }
  
  update(playerPosition) {
    const playerGridX = Math.floor(playerPosition.x / this.gridSize);
    const playerGridZ = Math.floor(playerPosition.z / this.gridSize);
    
    // Track which sections we should keep
    const sectionsToKeep = new Set();
    
    // Create or update visible grid sections
    for (let x = playerGridX - this.visibleRange; x <= playerGridX + this.visibleRange; x++) {
      for (let z = playerGridZ - this.visibleRange; z <= playerGridZ + this.visibleRange; z++) {
        const key = `${x},${z}`;
        sectionsToKeep.add(key);
        
        if (!this.gridSections.has(key)) {
          this.createGridSection(x, z);
        }
      }
    }
    
    // Remove grid sections that are now out of range
    for (const key of this.gridSections.keys()) {
      if (!sectionsToKeep.has(key)) {
        const section = this.gridSections.get(key);
        this.scene.remove(section.plane);
        this.scene.remove(section.grid);
        this.gridSections.delete(key);
      }
    }
  }
  
  createGridSection(gridX, gridZ) {
    const key = `${gridX},${gridZ}`;
    const x = gridX * this.gridSize;
    const z = gridZ * this.gridSize;
    
    // Create the plane
    const geometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
    
    // Alternate materials for a checkerboard effect
    const materialIndex = (gridX + gridZ) % 2;
    const plane = new THREE.Mesh(geometry, this.materials[materialIndex]);
    
    plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    plane.position.set(x + this.gridSize / 2, 0, z + this.gridSize / 2);
    this.scene.add(plane);
    
    // Create grid lines
    const gridGeometry = new THREE.BufferGeometry();
    const gridPoints = [];
    
    // Add horizontal and vertical lines
    for (let i = 0; i <= this.gridSize; i++) {
      // Horizontal lines
      gridPoints.push(x, 0.01, z + i);
      gridPoints.push(x + this.gridSize, 0.01, z + i);
      
      // Vertical lines
      gridPoints.push(x + i, 0.01, z);
      gridPoints.push(x + i, 0.01, z + this.gridSize);
    }
    
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    const grid = new THREE.LineSegments(gridGeometry, this.lineMaterial);
    this.scene.add(grid);
    
    this.gridSections.set(key, { plane, grid });
  }
}
