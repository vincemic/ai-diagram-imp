import { CommandManager, initialState, AddNode, UpdateNodeProps } from '../../core/commands.js';

const newShapes = [
  'parallelogram','trapezoid','diamond','hexagon','octagon','cylinder'
];

test('can set extended shape types', () => {
  const mgr = new CommandManager(initialState);
  mgr.dispatch(new AddNode({ id: 's1', x:0, y:0, w:120, h:80 }));
  for (const shape of newShapes) {
    mgr.dispatch(new UpdateNodeProps({ id: 's1', changes: { data: { shape } } }));
    const node = mgr.state.nodes.find(n => n.id === 's1');
    expect((node?.data as any)?.shape).toBe(shape);
  }
});
