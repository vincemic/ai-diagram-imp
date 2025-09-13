import { toGraphML } from '../../core/graphml.js';
import { DiagramState } from '../../core/commands.js';

function sampleState(): DiagramState {
  return {
    schemaVersion: '1.0.0',
    metadata: { title: 'Sample' },
    selection: [],
    nodes: [
      { id: 'n1', type: 'process', x: 10, y: 20, w: 160, h: 60, data: { text: 'Hello', backgroundColor: '#ff0000', textColor: '#000000' } },
      { id: 'n2', type: 'decision', x: 300, y: 120, w: 160, h: 60, data: { } }
    ],
    edges: [
      { id: 'e1', type: 'default', source: { nodeId: 'n1' }, target: { nodeId: 'n2' } }
    ]
  };
}

test('toGraphML emits expected structural elements', () => {
  const xml = toGraphML(sampleState());
  expect(xml).toContain('<graphml');
  expect(xml).toContain('<graph id="G"');
  expect(xml).toContain('<node id="n1"');
  expect(xml).toContain('<edge id="e1"');
  expect(xml).toContain('backgroundColor');
  expect(xml).toContain('modelVersion');
  // Should escape basic characters
  const special: DiagramState = { ...sampleState(), metadata: { title: 'A&B <Test>' } };
  const xml2 = toGraphML(special);
  expect(xml2).toContain('A&amp;B &lt;Test&gt;');
});
