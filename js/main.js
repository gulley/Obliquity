/**
 * Main Application Entry Point
 */

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Obliquity Visualization...');

    // Create 3D scene
    const scene = new ObliquityScene('scene-3d');
    console.log('3D scene created');

    // Initialize controls (handles all interactions)
    const controls = new UIControls(scene);
    console.log('Controls initialized');

    console.log('Obliquity Visualization ready!');
});
