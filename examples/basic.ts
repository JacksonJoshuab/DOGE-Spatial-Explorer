/**
 * Basic example of DOGE Spatial Explorer
 * Demonstrates simple setup and spatial object manipulation
 */

import { createDOGESpatialExplorer, PlatformType, SpatialObject } from '../src/index';

async function basicExample() {
  console.log('=== Basic DOGE Spatial Explorer Example ===\n');

  // Create explorer for web platform
  const explorer = createDOGESpatialExplorer(PlatformType.WEB, {
    rendering: {
      width: 1920,
      height: 1080,
      antialias: true,
      enableVR: false,
      enableAR: false
    }
  });

  try {
    // Initialize the explorer
    console.log('Initializing explorer...');
    await explorer.initialize();
    console.log('Explorer initialized successfully!\n');

    // Get platform capabilities
    const capabilities = explorer.getPlatformCapabilities();
    console.log('Platform capabilities:', JSON.stringify(capabilities, null, 2), '\n');

    // Add some spatial objects
    console.log('Adding spatial objects...');
    
    const cube: SpatialObject = {
      id: 'cube-1',
      type: 'cube',
      pose: {
        position: { x: -2, y: 1, z: -5 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      },
      scale: { x: 1, y: 1, z: 1 },
      metadata: { color: 'blue', name: 'Blue Cube' }
    };

    const sphere: SpatialObject = {
      id: 'sphere-1',
      type: 'sphere',
      pose: {
        position: { x: 2, y: 1, z: -5 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      },
      scale: { x: 1, y: 1, z: 1 },
      metadata: { color: 'red', name: 'Red Sphere' }
    };

    explorer.addSpatialObject(cube);
    explorer.addSpatialObject(sphere);
    console.log('Added 2 spatial objects\n');

    // Get device pose
    const devicePose = await explorer.getDevicePose();
    console.log('Device pose:', JSON.stringify(devicePose, null, 2), '\n');

    // Update viewer pose
    await explorer.updateViewerPose();
    console.log('Viewer pose updated\n');

    // Get rendering stats
    const stats = explorer.getRenderingStats();
    console.log('Rendering stats:', JSON.stringify(stats, null, 2), '\n');

    // Move the cube
    console.log('Moving cube to new position...');
    explorer.updateObjectPose('cube-1', {
      position: { x: 0, y: 1.5, z: -4 },
      orientation: { x: 0, y: 0.707, z: 0, w: 0.707 }
    });
    console.log('Cube moved!\n');

    // In a real application, you would start rendering here
    // explorer.startRendering();
    
    // Simulate some runtime
    console.log('Explorer running...');
    await new Promise(resolve => setTimeout(resolve, 1000));

  } finally {
    // Always cleanup
    console.log('Shutting down...');
    await explorer.shutdown();
    console.log('Explorer shut down successfully!');
  }
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error);
}

export { basicExample };
