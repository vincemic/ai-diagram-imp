import { UpdateNodeProps, AddNode, CommandManager, initialState, SetSelection } from '../../core/commands.js';

test('UpdateNodeProps updates node data and type', () => {
  const mgr = new CommandManager(initialState);
  mgr.dispatch(new AddNode({ id: 'n1', type: 'process', x:0, y:0, w:100, h:50 }));
  mgr.dispatch(new UpdateNodeProps({ id: 'n1', changes: { data: { text: 'Hello', textColor: '#ffffff' }, type: 'custom' } }));
  const node = mgr.state.nodes.find(n => n.id === 'n1');
  expect(node?.data?.text).toBe('Hello');
  expect(node?.data?.textColor).toBe('#ffffff');
  expect(node?.type).toBe('custom');
});

test('SetSelection sets selection array', () => {
  const mgr = new CommandManager(initialState);
  mgr.dispatch(new SetSelection(['a','b']));
  expect(mgr.state.selection).toEqual(['a','b']);
});
