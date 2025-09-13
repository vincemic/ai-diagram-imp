import { describe, it, expect } from 'vitest';
import { toGraphML, fromGraphML } from '../../core/graphml.js';
import { DiagramState } from '../../core/commands.js';

describe('GraphML shape & stroke extensions', () => {
  function baseState(): DiagramState {
    return {
  schemaVersion: '1.1.0',
      metadata: { title: 'Test' },
      nodes: [
        { id: 'n1', type: 'process', x: 10, y: 20, w: 160, h: 60, data: { backgroundColor: '#fff', textColor: '#000', shape: 'rect' } },
        { id: 'n2', type: 'process', x: 30, y: 40, w: 100, h: 50, data: { backgroundColor: '#eee', textColor: '#111', shape: 'diamond', strokeColor: '#333', strokeWidth: 2 } }
      ],
      edges: [ { id: 'e1', type: 'default', source: { nodeId: 'n1' }, target: { nodeId: 'n2' } } ],
      selection: []
    };
  }

  it('exports shape for every node', () => {
    const xml = toGraphML(baseState());
    expect(xml).toContain('d_shape');
    // Each node should have a shape entry
    const occurrences = (xml.match(/key=\"d_shape\"/g) || []).length;
    expect(occurrences).toBe(2);
  });

  it('conditionally exports stroke attributes', () => {
    const xml = toGraphML(baseState());
    expect(xml).toContain('d_sc');
    expect(xml).toContain('d_sw');
    // Node without stroke should not have stroke keys near its id
    const node1Block = xml.split('<node id="n1">')[1].split('</node>')[0];
    expect(node1Block).not.toContain('d_sc');
    const node2Block = xml.split('<node id="n2">')[1].split('</node>')[0];
    expect(node2Block).toContain('d_sc');
  });

  it('round-trips stroke & shape', () => {
    const state = baseState();
    const { diagram } = fromGraphML(toGraphML(state));
  const n2 = diagram.nodes.find((n: any) => n.id === 'n2')!;
    expect(n2.data?.shape).toBe('diamond');
    expect(n2.data?.strokeColor).toBe('#333');
    expect(n2.data?.strokeWidth).toBe(2);
  });

  it('ignores invalid stroke width (no emission, no warning)', () => {
    const badXml = toGraphML({
  schemaVersion: '1.1.0',
      metadata: { title: 'Bad' },
      nodes: [ { id: 'n1', type: 'process', x: 0, y: 0, w: 10, h: 10, data: { shape: 'rect', strokeWidth: -5 } } ],
      edges: [],
      selection: []
    });
    const { diagram, warnings } = fromGraphML(badXml.replace('-5', '-5'));
    const n1 = diagram.nodes[0];
    expect(n1.data?.strokeWidth).toBeUndefined();
  expect(warnings.some((w: string) => w.includes('Invalid strokeWidth'))).toBe(false);
  });

  it('defaults missing shape to rect', () => {
    const xmlNoShape = toGraphML({
  schemaVersion: '1.1.0',
      metadata: { title: 'NoShape' },
      nodes: [ { id: 'n1', type: 'process', x: 0, y: 0, w: 10, h: 10, data: { backgroundColor: '#fff' } } ],
      edges: [],
      selection: []
    }).replace(/<data key=\"d_shape\">rect<\/data>/g, '');
    const { diagram, warnings } = fromGraphML(xmlNoShape);
    const n1 = diagram.nodes[0];
    expect(n1.data?.shape).toBe('rect');
  expect(warnings.some((w: string) => w.includes('Missing shape'))).toBe(true);
  });
});
