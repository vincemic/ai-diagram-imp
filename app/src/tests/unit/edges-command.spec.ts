import { describe, it, expect } from 'vitest';
import { CommandManager, initialState, AddNode, AddEdge, RemoveEdge } from '../../core/commands.js';

describe('Edge command manager integration', () => {
  it('adds and removes an edge with undo/redo', () => {
    const mgr = new CommandManager(initialState);
    // Add two nodes
    mgr.dispatch(new AddNode({ id: 'a', x: 0, y: 0 } as any));
    mgr.dispatch(new AddNode({ id: 'b', x: 100, y: 100 } as any));
    expect(mgr.state.nodes.length).toBe(2);
    mgr.dispatch(new AddEdge({ id: 'e1', source: { nodeId: 'a' }, target: { nodeId: 'b' }, data: { arrowTarget: 'standard' } }));
    expect(mgr.state.edges.length).toBe(1);
    // Undo edge
    mgr.undo();
    expect(mgr.state.edges.length).toBe(0);
    // Redo edge
    mgr.redo();
    expect(mgr.state.edges.length).toBe(1);
    // Remove edge directly
    mgr.dispatch(new RemoveEdge('e1'));
    expect(mgr.state.edges.length).toBe(0);
  });
});
