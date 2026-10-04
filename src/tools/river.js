import { groundTool } from './ground.js';

// River tool: paint water. Track laid across water, on any level, becomes a bridge by itself.
export const river = groundTool('river', 'water',
  'Drag to paint water for a river or a pond. Track that crosses it becomes a bridge.');
