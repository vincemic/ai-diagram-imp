import React, { useRef, useCallback } from 'react';
import { useDiagramStore, selectDiagramState, selectDispatch } from '../core/store.js';
import { MoveNode } from '../core/commands.js';

export const DiagramCanvas: React.FC = () => {
  const state = useDiagramStore(selectDiagramState);
  const dispatch = useDiagramStore(selectDispatch);
  const draggingRef = useRef<null | { id: string; offsetX: number; offsetY: number }>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGGElement>, id: string, x: number, y: number) => {
    const svg = (e.currentTarget.ownerSVGElement);
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    draggingRef.current = { id, offsetX: local.x - x, offsetY: local.y - y };
    (e.currentTarget as any).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const { id, offsetX, offsetY } = draggingRef.current;
    // Optimistic update: directly mutate then dispatch final command on up? For simplicity dispatch on move throttled.
    // Here we dispatch each move; in future could throttle.
    const newX = local.x - offsetX;
    const newY = local.y - offsetY;
    dispatch(new MoveNode(id, newX, newY));
  }, [dispatch]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingRef.current) {
      draggingRef.current = null;
    }
  }, []);

  return (
    <div id="diagram-container" className="diagram-canvas" data-testid="diagram-container">
      <svg
        className="diagram"
        width="2000"
        height="1200"
        role="img"
        aria-label="Diagram Canvas"
        data-testid="diagram-svg"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <g data-layer="edges" />
        <g data-layer="nodes">
          {state.nodes.map((n) => (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              data-node-id={n.id}
              onPointerDown={(e) => handlePointerDown(e, n.id, n.x, n.y)}
              style={{ cursor: 'move' }}
            >
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
