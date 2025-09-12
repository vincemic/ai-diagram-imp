import { describe, it, expect } from 'vitest';
import { CommandManager, initialState, AddNode, RemoveNode, ReplaceState, MoveNode } from '../../src/core/commands.js';

describe('CommandManager', () => {
  it('adds a node and undo restores previous state', () => {
    const mgr = new CommandManager(initialState);
    const add = new AddNode({ id: 'n1', x: 10, y: 20 });
    mgr.dispatch(add);
    expect(mgr.state.nodes.find(n => n.id === 'n1')).toBeTruthy();
    mgr.undo();
    expect(mgr.state.nodes.find(n => n.id === 'n1')).toBeFalsy();
  });

  it('redo reapplies undone command', () => {
    const mgr = new CommandManager(initialState);
    mgr.dispatch(new AddNode({ id: 'n1' }));
    mgr.undo();
    mgr.redo();
    expect(mgr.state.nodes.some(n => n.id === 'n1')).toBe(true);
  });

  it('replace state invert works', () => {
    const mgr = new CommandManager(initialState);
    mgr.dispatch(new ReplaceState({ ...initialState, nodes: [{ id: 'x', type: 'start', x:0, y:0, w:100, h:50 }] } as any));
    expect(mgr.state.nodes.length).toBe(1);
    mgr.undo();
    expect(mgr.state.nodes.length).toBe(0);
  });

  it('remove node invert adds it back', () => {
    const mgr = new CommandManager(initialState);
    mgr.dispatch(new AddNode({ id: 'n1' }));
    mgr.dispatch(new RemoveNode('n1'));
    expect(mgr.state.nodes.some(n => n.id === 'n1')).toBe(false);
    mgr.undo();
    expect(mgr.state.nodes.some(n => n.id === 'n1')).toBe(true);
  });

  it('move node updates coordinates and undo restores previous', () => {
    const mgr = new CommandManager(initialState);
    mgr.dispatch(new AddNode({ id: 'n1', x: 10, y: 20 }));
    mgr.dispatch(new MoveNode('n1', 200, 300));
    const moved = mgr.state.nodes.find(n => n.id === 'n1');
    expect(moved?.x).toBe(200);
    expect(moved?.y).toBe(300);
    mgr.undo();
    const original = mgr.state.nodes.find(n => n.id === 'n1');
    expect(original?.x).toBe(10);
    expect(original?.y).toBe(20);
  });
});
