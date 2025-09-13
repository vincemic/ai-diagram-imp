import { describe, it, expect } from 'vitest';
import { toGraphML, fromGraphML } from '../../core/graphml.js';
import { DiagramState } from '../../core/commands.js';

describe('GraphML omitDefaultShape option', () => {
  const base: DiagramState = {
    schemaVersion: '1.0.0',
    metadata: { title: 'ODS' },
    nodes: [
      { id: 'a', type: 't', x: 0, y: 0, w: 10, h: 10, data: { shape: 'rect', text: 'x' } },
      { id: 'b', type: 't', x: 20, y: 0, w: 10, h: 10, data: { shape: 'diamond' } }
    ],
    edges: [],
    selection: []
  };

  it('omits shape tag for rect when flag set, retains others', () => {
    const xml = toGraphML(base, { omitDefaultShape: true });
    const aBlock = xml.split('<node id="a">')[1].split('</node>')[0];
    const bBlock = xml.split('<node id="b">')[1].split('</node>')[0];
    expect(aBlock).not.toContain('d_shape');
    expect(bBlock).toContain('d_shape');
    const { diagram, warnings } = fromGraphML(xml);
    expect(warnings.some(w => w.includes('Missing shape defaulted'))).toBe(true);
    const a = diagram.nodes.find(n => n.id === 'a');
    expect(a?.data?.shape).toBe('rect');
  });
});

describe('GraphML invalid stroke color handling', () => {
  it('invalid strokeColor triggers warning and is dropped', () => {
    const state: DiagramState = {
      schemaVersion: '1.0.0',
      metadata: { title: 'BadColor' },
      nodes: [ { id: 'n1', type: 't', x: 0, y: 0, w: 10, h: 10, data: { shape: 'rect', strokeColor: 'not-a-color', strokeWidth: 2 } } ],
      edges: [],
      selection: []
    };
    const xml = toGraphML(state);
    const { diagram, warnings, stats } = fromGraphML(xml.replace('not-a-color', 'not-a-color'));
    const n1 = diagram.nodes[0];
    expect(n1.data?.strokeColor).toBeUndefined();
    expect(warnings.some(w => w.includes('Invalid strokeColor'))).toBe(true);
    expect(stats?.invalidStrokeColors).toBeGreaterThanOrEqual(1);
  });
});
