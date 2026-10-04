import { groundTool } from './ground.js';

// Road tool: paint roads. Cars appear by themselves. A road across straight ground-level track
// becomes a level crossing with gates.
export const road = groundTool('road', 'road',
  'Drag to lay a road. Cars arrive by themselves. Where a road crosses straight track there is a level crossing; across water it becomes a bridge.');
