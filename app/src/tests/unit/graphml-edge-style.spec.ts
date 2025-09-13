import { toGraphML, fromGraphML } from '../../core/graphml.js';
import type { DiagramState } from '../../core/commands.js';
import { test, expect } from 'vitest';

function buildState(): DiagramState {
  return {
  schemaVersion: '1.1.0',
    metadata: { title: 'EdgeStyles' },
    selection: [],
    nodes: [
      { id: 'n1', type: 'proc', x: 0, y: 0, w: 80, h: 40 },
      { id: 'n2', type: 'proc', x: 200, y: 120, w: 80, h: 40 }
    ],
    edges: [
      {
        id: 'e1', type: 'default', source: { nodeId: 'n1' }, target: { nodeId: 'n2' },
        data: {
          strokeColor: '#ff0000',
            strokeWidth: 2,
            lineStyle: 'dashed',
            arrowTarget: 'standard',
            arrowSource: 'none',
            label: 'Flow',
            routing: 'straight',
            bendPoints: [ { x: 50, y: 20 }, { x: 150, y: 90 } ],
            customMetric: 42
        }
      }
    ]
  };
}

test('edge styling round-trip preserves styling fields', () => {
  const state = buildState();
  const xml = toGraphML(state);
  const { diagram, warnings } = fromGraphML(xml);
  expect(warnings).toEqual([]);
  expect(diagram.edges.length).toBe(1);
  const e = diagram.edges[0];
  expect(e.data?.strokeColor).toBe('#ff0000');
  expect(e.data?.strokeWidth).toBe(2);
  expect(e.data?.lineStyle).toBe('dashed');
  expect(e.data?.arrowTarget).toBe('standard');
  const bends = e.data?.bendPoints as any[] | undefined;
  expect(bends?.length).toBe(2);
  expect(e.data?.customMetric).toBe(42);
});

test('invalid edge styling yields warnings and ignores fields', () => {
  const badXml = `<?xml version="1.0"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n<key id="d_edgeType" for="edge" attr.name="type" attr.type="string"/>\n<key id="d_edgeStrokeColor" for="edge" attr.name="strokeColor" attr.type="string"/>\n<key id="d_edgeStrokeWidth" for="edge" attr.name="strokeWidth" attr.type="double"/>\n<key id="d_edgeLineStyle" for="edge" attr.name="lineStyle" attr.type="string"/>\n<key id="d_edgeArrowTarget" for="edge" attr.name="arrowTarget" attr.type="string"/>\n<graph id="G" edgedefault="directed">\n<node id="n1"/>\n<node id="n2"/>\n<edge id="e1" source="n1" target="n2">\n<data key="d_edgeType">default</data>\n<data key="d_edgeStrokeColor">not-a-color</data>\n<data key="d_edgeStrokeWidth">-3</data>\n<data key="d_edgeLineStyle">weird</data>\n<data key="d_edgeArrowTarget">strangeArrow</data>\n</edge>\n</graph>\n</graphml>`;
  const { diagram, warnings } = fromGraphML(badXml);
  expect(diagram.edges.length).toBe(1);
  // Should have warnings for invalid color, width, lineStyle, arrowTarget
  const matches = warnings.filter(w => /edge/.test(w));
  expect(matches.length).toBeGreaterThanOrEqual(3);
  expect(diagram.edges[0].data).toBeUndefined();
});
