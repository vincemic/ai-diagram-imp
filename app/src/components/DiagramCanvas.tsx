import React from 'react';
import { useDiagramStore, selectDiagramState } from '../core/store.js';

export const DiagramCanvas: React.FC = () => {
  const state = useDiagramStore(selectDiagramState);
  return (
    <div id="diagram-container" className="diagram-canvas">
      <svg className="diagram" width="2000" height="1200" role="img" aria-label="Diagram Canvas">
        <g data-layer="edges" />
        <g data-layer="nodes">
          {state.nodes.map((n) => (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              <rect width={n.w} height={n.h} rx={6} ry={6} className="node-rect" />
              <text className="node-label" x={n.w / 2} y={n.h / 2}>{n.type}</text>
            </g>
          ))}
        </g>
        <g data-layer="overlays" />
      </svg>
    </div>
  );
};
