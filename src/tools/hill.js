import { groundTool } from './ground.js';

// Hill tool: paint hills. Ground-level track through a hill becomes a tunnel by itself.
export const hill = groundTool('hill', 'hill',
  'Drag to raise a hill. Ground-level track through it becomes a tunnel. Hills are thicker and taller in the middle.');
