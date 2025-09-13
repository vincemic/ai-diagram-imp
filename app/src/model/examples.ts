import { DiagramState } from '../core/commands.js';

// A small catalog of example diagrams that can be loaded via
// the URL query parameter: ?example=<key>
// They intentionally keep edges empty until edge rendering is implemented.
export const examples: Record<string, DiagramState> = {
  'basic-flow': {
  schemaVersion: '1.1.0',
    metadata: { title: 'Basic Flow' },
    selection: [],
    nodes: [
      { id: 'start', type: 'start', x: 80, y: 120, w: 140, h: 60 },
      { id: 'process', type: 'process', x: 320, y: 120, w: 160, h: 60 },
      { id: 'end', type: 'end', x: 600, y: 120, w: 140, h: 60 }
    ],
    edges: []
  },
  'architecture': {
  schemaVersion: '1.1.0',
    metadata: { title: 'Mini Architecture' },
    selection: [],
    nodes: [
      { id: 'client', type: 'client', x: 60, y: 80, w: 160, h: 60 },
      { id: 'api', type: 'api', x: 300, y: 60, w: 160, h: 60 },
      { id: 'auth', type: 'auth', x: 300, y: 160, w: 160, h: 60 },
      { id: 'db', type: 'database', x: 560, y: 110, w: 180, h: 70 },
      { id: 'cache', type: 'cache', x: 560, y: 220, w: 180, h: 70 }
    ],
    edges: []
  },
  'grid': {
  schemaVersion: '1.1.0',
    metadata: { title: 'Grid Layout' },
    selection: [],
    nodes: Array.from({ length: 12 }).map((_, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      return {
        id: `n${i}`,
        type: `N${i}`,
        x: 80 + col * 180,
        y: 80 + row * 140,
        w: 150,
        h: 70
      };
    }),
    edges: []
  }
  ,
  'basic-flow-connected': {
    schemaVersion: '1.1.0',
    metadata: { title: 'Basic Flow (Connected)' },
    selection: [],
    nodes: [
      { id: 'start', type: 'start', x: 80, y: 120, w: 140, h: 60 },
      { id: 'process', type: 'process', x: 320, y: 120, w: 160, h: 60 },
      { id: 'end', type: 'end', x: 600, y: 120, w: 140, h: 60 }
    ],
    edges: [
      { id: 'e1', type: 'edge', source: { nodeId: 'start' }, target: { nodeId: 'process' } },
      { id: 'e2', type: 'edge', source: { nodeId: 'process' }, target: { nodeId: 'end' } }
    ]
  },
  'architecture-connected': {
    schemaVersion: '1.1.0',
    metadata: { title: 'Mini Architecture (Connected)' },
    selection: [],
    nodes: [
      { id: 'client', type: 'client', x: 60, y: 80, w: 160, h: 60 },
      { id: 'api', type: 'api', x: 300, y: 60, w: 160, h: 60 },
      { id: 'auth', type: 'auth', x: 300, y: 160, w: 160, h: 60 },
      { id: 'db', type: 'database', x: 560, y: 110, w: 180, h: 70 },
      { id: 'cache', type: 'cache', x: 560, y: 220, w: 180, h: 70 }
    ],
    edges: [
      { id: 'c1', type: 'edge', source: { nodeId: 'client' }, target: { nodeId: 'api' } },
      { id: 'c2', type: 'edge', source: { nodeId: 'client' }, target: { nodeId: 'auth' } },
      { id: 'c3', type: 'edge', source: { nodeId: 'api' }, target: { nodeId: 'db' } },
      { id: 'c4', type: 'edge', source: { nodeId: 'auth' }, target: { nodeId: 'db' } },
      { id: 'c5', type: 'edge', source: { nodeId: 'api' }, target: { nodeId: 'cache' } },
      { id: 'c6', type: 'edge', source: { nodeId: 'auth' }, target: { nodeId: 'cache' } }
    ]
  }
};
