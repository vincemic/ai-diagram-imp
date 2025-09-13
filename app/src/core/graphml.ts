import type { DiagramState, DiagramNode, DiagramEdge } from './commands.js';

// Key constants centralizing GraphML mapping.
export const GRAPHML_KEYS = {
  graph: {
    title: 'd_title',
    modelVersion: 'd_modelVersion'
  },
  node: {
    type: 'd_type',
    x: 'd_x',
    y: 'd_y',
    w: 'd_w',
    h: 'd_h',
    backgroundColor: 'd_bg',
    textColor: 'd_tc',
    data: 'd_nodeData',
    shape: 'd_shape',
    strokeColor: 'd_sc',
    strokeWidth: 'd_sw'
  },
  edge: {
    type: 'd_edgeType',
    strokeColor: 'd_edgeStrokeColor',
    strokeWidth: 'd_edgeStrokeWidth',
    lineStyle: 'd_edgeLineStyle',
    dashPattern: 'd_edgeDashPattern',
    arrowSource: 'd_edgeArrowSource',
    arrowTarget: 'd_edgeArrowTarget',
    label: 'd_edgeLabel',
    routing: 'd_edgeRouting',
    bendPoints: 'd_edgeBendPoints',
    data: 'd_edgeData'
  }
} as const;

export interface GraphMLImportResult {
  diagram: DiagramState;
  warnings: string[];
  stats?: {
    invalidStrokeColors?: number;
    invalidStrokeWidths?: number;
    missingShape?: number;
    unknownNodeKeys?: number;
    vendorNamespaces?: string[];
  };
}

// Canonical shape names list (extendable)
export const CANONICAL_SHAPES = [
  'rect',
  'diamond',
  'ellipse',
  'circle',
  'hexagon'
] as const;
const SHAPE_SET = new Set<string>(CANONICAL_SHAPES as readonly string[]);

// Basic permissive CSS color validation (hex or simple named)
const COLOR_REGEX = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/;

export interface ToGraphMLOptions {
  omitDefaultShape?: boolean; // when true, omit d_shape if shape === 'rect'
}

// Escapes text for XML element content.
function esc(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Phase 1: Export MVP implementation.
export function toGraphML(diagram: DiagramState, opts: ToGraphMLOptions = {}): string {
  const k = GRAPHML_KEYS;
  // Sort for deterministic output (test stability)
  const nodes = [...diagram.nodes].sort((a, b) => a.id.localeCompare(b.id));
  const edges = [...diagram.edges].sort((a, b) => a.id.localeCompare(b.id));

  const keyDecls = [
    { id: k.graph.title, for: 'graph', name: 'title', type: 'string' },
    { id: k.graph.modelVersion, for: 'graph', name: 'modelVersion', type: 'string' },
    { id: k.node.type, for: 'node', name: 'type', type: 'string' },
    { id: k.node.x, for: 'node', name: 'x', type: 'double' },
    { id: k.node.y, for: 'node', name: 'y', type: 'double' },
    { id: k.node.w, for: 'node', name: 'w', type: 'double' },
    { id: k.node.h, for: 'node', name: 'h', type: 'double' },
    { id: k.node.backgroundColor, for: 'node', name: 'backgroundColor', type: 'string' },
    { id: k.node.textColor, for: 'node', name: 'textColor', type: 'string' },
    { id: k.node.data, for: 'node', name: 'data', type: 'string' },
    { id: k.node.shape, for: 'node', name: 'shape', type: 'string' },
    { id: k.node.strokeColor, for: 'node', name: 'strokeColor', type: 'string' },
    { id: k.node.strokeWidth, for: 'node', name: 'strokeWidth', type: 'double' },
    { id: k.edge.type, for: 'edge', name: 'type', type: 'string' },
    { id: k.edge.strokeColor, for: 'edge', name: 'strokeColor', type: 'string' },
    { id: k.edge.strokeWidth, for: 'edge', name: 'strokeWidth', type: 'double' },
    { id: k.edge.lineStyle, for: 'edge', name: 'lineStyle', type: 'string' },
    { id: k.edge.dashPattern, for: 'edge', name: 'dashPattern', type: 'string' },
    { id: k.edge.arrowSource, for: 'edge', name: 'arrowSource', type: 'string' },
    { id: k.edge.arrowTarget, for: 'edge', name: 'arrowTarget', type: 'string' },
    { id: k.edge.label, for: 'edge', name: 'label', type: 'string' },
    { id: k.edge.routing, for: 'edge', name: 'routing', type: 'string' },
    { id: k.edge.bendPoints, for: 'edge', name: 'bendPoints', type: 'string' },
    { id: k.edge.data, for: 'edge', name: 'data', type: 'string' }
  ];

  const keyXml = keyDecls
    .map(d => `<key id="${d.id}" for="${d.for}" attr.name="${d.name}" attr.type="${d.type}"/>`)
    .join('\n  ');

  const nodeXml = nodes.map(n => {
    const bg = (n.data as any)?.backgroundColor;
    const tc = (n.data as any)?.textColor;
    let shape = (n.data as any)?.shape || 'rect';
    if (!SHAPE_SET.has(shape)) shape = 'rect';
    const strokeColor = (n.data as any)?.strokeColor;
    let strokeWidth = (n.data as any)?.strokeWidth;
    if (typeof strokeWidth !== 'number' || strokeWidth <= 0) strokeWidth = undefined;
    const extraData: Record<string, unknown> = { ...(n.data || {}) };
    delete extraData.backgroundColor;
    delete extraData.textColor;
    delete extraData.shape;
    delete extraData.strokeColor;
    delete extraData.strokeWidth;
    const extraKeys = Object.keys(extraData).length > 0 ?
      `<data key="${k.node.data}">${esc(JSON.stringify(extraData))}</data>` : '';
    return `<node id="${esc(n.id)}">` +
      `<data key="${k.node.type}">${esc(n.type)}</data>` +
      `<data key="${k.node.x}">${n.x}</data>` +
      `<data key="${k.node.y}">${n.y}</data>` +
      `<data key="${k.node.w}">${n.w}</data>` +
      `<data key="${k.node.h}">${n.h}</data>` +
      (!opts.omitDefaultShape || shape !== 'rect' ? `<data key="${k.node.shape}">${esc(shape)}</data>` : '') +
      (bg ? `<data key="${k.node.backgroundColor}">${esc(bg)}</data>` : '') +
      (tc ? `<data key="${k.node.textColor}">${esc(tc)}</data>` : '') +
      (strokeColor ? `<data key="${k.node.strokeColor}">${esc(strokeColor)}</data>` : '') +
      (strokeWidth !== undefined ? `<data key="${k.node.strokeWidth}">${strokeWidth}</data>` : '') +
      extraKeys +
      `</node>`;
  }).join('\n    ');

  const edgeXml = edges.map(e => {
    const d = e.data || {} as any;
    const lineStyle = d.lineStyle as string | undefined;
    const dashPattern = d.dashPattern as string | undefined;
    const arrowSource = d.arrowSource as string | undefined;
    const arrowTarget = d.arrowTarget as string | undefined;
    const strokeColor = d.strokeColor as string | undefined;
    const strokeWidth = typeof d.strokeWidth === 'number' && d.strokeWidth > 0 ? d.strokeWidth : undefined;
    const label = d.label as string | undefined;
    const routing = d.routing as string | undefined;
    const bendPoints = Array.isArray(d.bendPoints) ? d.bendPoints : undefined;
    // Build extra edge data JSON excluding known keys
    const known = new Set(['lineStyle','dashPattern','arrowSource','arrowTarget','strokeColor','strokeWidth','label','routing','bendPoints']);
    const extraEntries: Record<string, unknown> = {};
    for (const [kEdge, v] of Object.entries(d)) if (!known.has(kEdge)) extraEntries[kEdge] = v;
    const extraJson = Object.keys(extraEntries).length ? `<data key="${k.edge.data}">${esc(JSON.stringify(extraEntries))}</data>` : '';
    return `<edge id="${esc(e.id)}" source="${esc(e.source.nodeId)}" target="${esc(e.target.nodeId)}">` +
      `<data key="${k.edge.type}">${esc(e.type)}</data>` +
      (strokeColor ? `<data key="${k.edge.strokeColor}">${esc(strokeColor)}</data>` : '') +
      (strokeWidth !== undefined ? `<data key="${k.edge.strokeWidth}">${strokeWidth}</data>` : '') +
      (lineStyle ? `<data key="${k.edge.lineStyle}">${esc(lineStyle)}</data>` : '') +
      (dashPattern ? `<data key="${k.edge.dashPattern}">${esc(dashPattern)}</data>` : '') +
      (arrowSource ? `<data key="${k.edge.arrowSource}">${esc(arrowSource)}</data>` : '') +
      (arrowTarget ? `<data key="${k.edge.arrowTarget}">${esc(arrowTarget)}</data>` : '') +
      (label ? `<data key="${k.edge.label}">${esc(label)}</data>` : '') +
      (routing ? `<data key="${k.edge.routing}">${esc(routing)}</data>` : '') +
      (bendPoints ? `<data key="${k.edge.bendPoints}">${esc(JSON.stringify(bendPoints))}</data>` : '') +
      extraJson +
      `</edge>`;
  }).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n` +
    `  ${keyXml}\n` +
    `  <graph id="G" edgedefault="directed">\n` +
    `    <data key="${k.graph.title}">${esc(diagram.metadata.title)}</data>\n` +
    `    <data key="${k.graph.modelVersion}">${esc(diagram.schemaVersion)}</data>\n` +
    (nodeXml ? `    ${nodeXml}\n` : '') +
    (edgeXml ? `    ${edgeXml}\n` : '') +
    `  </graph>\n` +
    `</graphml>`;
}

// Phase 2 placeholder: will parse XML and build DiagramState.
export function fromGraphML(xml: string): GraphMLImportResult {
  const warnings: string[] = [];
  const stats: GraphMLImportResult['stats'] = { invalidStrokeColors: 0, invalidStrokeWidths: 0, missingShape: 0, unknownNodeKeys: 0, vendorNamespaces: [] };
  if (typeof window === 'undefined' || typeof (window as any).DOMParser === 'undefined') {
    throw new Error('fromGraphML requires DOMParser (browser environment)');
  }
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
  } catch (e) {
    throw new Error('Invalid XML');
  }
  // Detect parser errors
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('XML parse error');
  }
  // Vendor namespace detection (stored, not acted on yet)
  const root = doc.documentElement;
  if (root && root.attributes) {
    for (let i = 0; i < root.attributes.length; i++) {
      const attr = root.attributes[i];
      if (attr.name.startsWith('xmlns:') && /yworks|yfiles|y:/i.test(attr.value)) {
        stats.vendorNamespaces!.push(attr.value);
      }
    }
  }
  const k = GRAPHML_KEYS;
  const graph = doc.getElementsByTagName('graph')[0];
  if (!graph) throw new Error('Missing <graph> element');

  // Gather <data> under graph for title & version
  const graphData = graph.getElementsByTagName('data');
  let title = 'Untitled';
  let modelVersion = '1.0.0';
  for (let i = 0; i < graphData.length; i++) {
    const d = graphData[i];
    const key = d.getAttribute('key');
    if (key === k.graph.title) title = d.textContent || title;
    if (key === k.graph.modelVersion) modelVersion = d.textContent || modelVersion;
  }

  // Parse nodes
  const nodeElements = graph.getElementsByTagName('node');
  const nodes: DiagramNode[] = [];
  for (let i = 0; i < nodeElements.length; i++) {
    const ne = nodeElements[i];
    const id = ne.getAttribute('id');
    if (!id) { warnings.push('Node missing id skipped'); continue; }
    const dataElems = ne.getElementsByTagName('data');
    const nodeData: Record<string, any> = {};
    let type: string | undefined;
    let x: number | undefined; let y: number | undefined; let w: number | undefined; let h: number | undefined;
    let bg: string | undefined; let tc: string | undefined; let extraJson: string | undefined;
    let shape: string | undefined; let strokeColor: string | undefined; let strokeWidth: number | undefined;
    for (let j = 0; j < dataElems.length; j++) {
      const d = dataElems[j];
      const key = d.getAttribute('key');
      const text = d.textContent || '';
      switch (key) {
        case k.node.type: type = text; break;
        case k.node.x: x = Number(text); break;
        case k.node.y: y = Number(text); break;
        case k.node.w: w = Number(text); break;
        case k.node.h: h = Number(text); break;
        case k.node.backgroundColor: bg = text; break;
        case k.node.textColor: tc = text; break;
        case k.node.data: extraJson = text; break;
        case k.node.shape: shape = text || 'rect'; break;
        case k.node.strokeColor: strokeColor = text; break;
        case k.node.strokeWidth: {
          const num = Number(text);
          if (!isNaN(num) && num > 0) strokeWidth = num; else warnings.push(`Invalid strokeWidth on node ${id} ignored`);
          break;
        }
        default:
          stats.unknownNodeKeys = (stats.unknownNodeKeys || 0) + 1;
          warnings.push(`Unknown node data key ${key}`); break;
      }
    }
    if (type === undefined || x === undefined || y === undefined || w === undefined || h === undefined) {
      warnings.push(`Node ${id} missing required fields and was skipped`);
      continue;
    }
    if (bg) nodeData.backgroundColor = bg;
    if (tc) nodeData.textColor = tc;
    if (!shape) { shape = 'rect'; warnings.push('Missing shape defaulted to rect'); stats.missingShape = (stats.missingShape || 0) + 1; }
    if (!SHAPE_SET.has(shape)) {
      warnings.push(`Unknown shape '${shape}' downgraded to rect`);
      shape = 'rect';
    }
    nodeData.shape = shape;
    if (strokeColor) {
      if (COLOR_REGEX.test(strokeColor)) {
        nodeData.strokeColor = strokeColor;
      } else {
        warnings.push(`Invalid strokeColor '${strokeColor}' on node ${id} ignored`);
        stats.invalidStrokeColors = (stats.invalidStrokeColors || 0) + 1;
      }
    }
    if (strokeWidth !== undefined) nodeData.strokeWidth = strokeWidth;
    if (extraJson) {
      try {
        const parsed = JSON.parse(extraJson);
        Object.assign(nodeData, parsed);
      } catch (e) {
        warnings.push(`Failed to parse extra node data JSON for node ${id}`);
      }
    }
    const node: DiagramNode = { id, type, x, y, w, h, data: Object.keys(nodeData).length ? nodeData : undefined };
    nodes.push(node);
  }

  // Parse edges
  const edgeElements = graph.getElementsByTagName('edge');
  const edges: DiagramEdge[] = [];
  for (let i = 0; i < edgeElements.length; i++) {
    const ee = edgeElements[i];
    const id = ee.getAttribute('id');
    const src = ee.getAttribute('source');
    const tgt = ee.getAttribute('target');
    if (!id || !src || !tgt) { warnings.push('Edge missing id/source/target skipped'); continue; }
    let type = 'default';
    const edgeData: Record<string, any> = {};
    const dataElems = ee.getElementsByTagName('data');
    for (let j = 0; j < dataElems.length; j++) {
      const d = dataElems[j];
      const key = d.getAttribute('key');
      const text = d.textContent || '';
      switch (key) {
        case k.edge.type: type = text || type; break;
        case k.edge.strokeColor: if (COLOR_REGEX.test(text)) edgeData.strokeColor = text; else warnings.push(`Invalid edge strokeColor on edge ${id}`); break;
        case k.edge.strokeWidth: {
          const num = Number(text); if (!isNaN(num) && num > 0) edgeData.strokeWidth = num; else warnings.push(`Invalid edge strokeWidth on edge ${id}`); break;
        }
        case k.edge.lineStyle: {
          if (['solid','dashed','dotted'].includes(text)) edgeData.lineStyle = text; else if (text) warnings.push(`Unknown lineStyle '${text}' on edge ${id}`); break;
        }
        case k.edge.dashPattern: if (text) edgeData.dashPattern = text; break;
        case k.edge.arrowSource: if (['none','standard','circle','diamond','tee'].includes(text)) edgeData.arrowSource = text; else if (text) warnings.push(`Unknown arrowSource '${text}' on edge ${id}`); break;
        case k.edge.arrowTarget: if (['none','standard','circle','diamond','tee'].includes(text)) edgeData.arrowTarget = text; else if (text) warnings.push(`Unknown arrowTarget '${text}' on edge ${id}`); break;
        case k.edge.label: if (text) edgeData.label = text; break;
        case k.edge.routing: if (['straight','orthogonal','spline'].includes(text)) edgeData.routing = text; else if (text) warnings.push(`Unknown routing '${text}' on edge ${id}`); break;
        case k.edge.bendPoints: {
          if (text) {
            try {
              const arr = JSON.parse(text);
              if (Array.isArray(arr) && arr.every(p => typeof p.x === 'number' && typeof p.y === 'number')) edgeData.bendPoints = arr; else warnings.push(`Invalid bendPoints on edge ${id}`);
            } catch { warnings.push(`Failed to parse bendPoints on edge ${id}`); }
          }
          break;
        }
        case k.edge.data: {
          if (text) {
            try {
              const extra = JSON.parse(text);
              if (extra && typeof extra === 'object') Object.assign(edgeData, extra);
            } catch { warnings.push(`Failed to parse extra edge data JSON for edge ${id}`); }
          }
          break;
        }
        default:
          // Unknown edge key ignored silently (could accumulate stats later)
          break;
      }
    }
    const edge: DiagramEdge = { id, type, source: { nodeId: src }, target: { nodeId: tgt }, data: Object.keys(edgeData).length ? edgeData : undefined };
    edges.push(edge);
  }

  const diagram: DiagramState = {
    schemaVersion: modelVersion,
    metadata: { title },
    nodes,
    edges,
    selection: []
  };

  return { diagram, warnings, stats };
}

// Convenience helper for tests (round-trip invariant once import implemented)
export function cloneViaGraphML(diagram: DiagramState): DiagramState {
  const xml = toGraphML(diagram);
  const { diagram: imported } = fromGraphML(xml);
  return imported;
}
