import { toGraphML, fromGraphML } from '../../core/graphml.js';
import type { DiagramState } from '../../core/commands.js';

function buildState(): DiagramState {
  return {
    schemaVersion: '1.0.0',
    metadata: { title: 'RT' },
    selection: [],
    nodes: [
      { id: 'a', type: 'process', x: 1, y: 2, w: 100, h: 50, data: { backgroundColor: '#111111', textColor: '#eeeeee', note: 'hi' } },
      { id: 'b', type: 'decision', x: 10, y: 20, w: 120, h: 70 }
    ],
    edges: [ { id: 'e1', type: 'default', source: { nodeId: 'a' }, target: { nodeId: 'b' } } ]
  };
}

test('round-trip preserves core fields', () => {
  const state = buildState();
  const xml = toGraphML(state);
  const { diagram, warnings } = fromGraphML(xml);
  expect(warnings.length).toBe(0);
  expect(diagram.nodes.length).toBe(2);
  const a = diagram.nodes.find(n => n.id === 'a');
  expect(a?.x).toBe(1);
  expect(a?.data?.note).toBe('hi');
  expect(diagram.edges[0].source.nodeId).toBe('a');
});

test('missing required node fields leads to skip', () => {
  const badXml = `<?xml version="1.0"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns"><graph id="G" edgedefault="directed"><node id="x"><data key="d_type">proc</data></node></graph></graphml>`;
  const { diagram, warnings } = fromGraphML(badXml);
  expect(diagram.nodes.length).toBe(0);
  expect(warnings.some(w => w.includes('missing required'))).toBe(true);
});

test('extra node data JSON parse error is warned', () => {
  const xml = `<?xml version="1.0"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns"><key id="d_type" for="node" attr.name="type" attr.type="string"/><key id="d_x" for="node" attr.name="x" attr.type="double"/><key id="d_y" for="node" attr.name="y" attr.type="double"/><key id="d_w" for="node" attr.name="w" attr.type="double"/><key id="d_h" for="node" attr.name="h" attr.type="double"/><key id="d_nodeData" for="node" attr.name="data" attr.type="string"/><graph id="G" edgedefault="directed"><node id="n1"><data key="d_type">p</data><data key="d_x">0</data><data key="d_y">0</data><data key="d_w">10</data><data key="d_h">10</data><data key="d_nodeData">{bad json}</data></node></graph></graphml>`;
  const { warnings } = fromGraphML(xml);
  expect(warnings.some(w => w.includes('Failed to parse'))).toBe(true);
});
