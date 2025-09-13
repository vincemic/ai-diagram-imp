import React, { useRef, useCallback } from 'react';
import { useDiagramStore, selectDiagramState, selectDispatch } from '../core/store.js';
import { MoveNode, SetSelection } from '../core/commands.js';

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

  const handleBackgroundPointerDown = useCallback(() => {
    dispatch(new SetSelection([]));
  }, [dispatch]);

  const isSelected = (id: string) => state.selection.includes(id);

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
        <g data-layer="edges" onPointerDown={handleBackgroundPointerDown}>
          <rect x={0} y={0} width={2000} height={1200} fill="transparent" />
        </g>
        <g data-layer="nodes">
          {state.nodes.map((n) => {
            const data: any = n.data || {};
            const fill = data.backgroundColor || undefined;
            const textFill = data.textColor || undefined;
            const shape = data.shape || 'rect';
            const corner = shape === 'rounded' ? 12 : 0;
            const isEllipse = shape === 'ellipse';
            const isSquare = shape === 'square';
            const isTriangle = shape === 'triangle';
            const isStar = shape === 'star';
            const squareSide = Math.min(n.w, n.h);
            const textY = (() => {
              if (isTriangle) {
                // Centroid of current triangle (points at (w/2,0) and base at y=h) is at 2h/3.
                return (2 * n.h) / 3;
              }
              return n.h / 2;
            })();

            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                data-node-id={n.id}
                onPointerDown={(e) => { dispatch(new SetSelection([n.id])); handlePointerDown(e, n.id, n.x, n.y); }}
                className={isSelected(n.id) ? 'node selected' : 'node'}
                tabIndex={0}
                role="group"
                aria-label={`Node ${data.text || n.type}`}
                onFocus={() => { if (!isSelected(n.id)) dispatch(new SetSelection([n.id])); }}
                data-node-bg={fill || undefined}
                data-node-text={textFill || undefined}
                data-node-selected={isSelected(n.id) ? 'true' : undefined}
              >
                {isEllipse && (
                  <ellipse data-shape="ellipse" cx={n.w/2} cy={n.h/2} rx={n.w/2} ry={n.h/2} className="node-rect" fill={fill || undefined} />
                )}
                {isSquare && !isEllipse && (
                  <rect
                    data-shape="square"
                    x={(n.w - squareSide) / 2}
                    y={(n.h - squareSide) / 2}
                    width={squareSide}
                    height={squareSide}
                    className="node-rect"
                    fill={fill || undefined}
                  />
                )}
                {isTriangle && !isEllipse && (
                  <polygon
                    data-shape="triangle"
                    className="node-rect"
                    points={`${n.w/2},0 ${n.w},${n.h} 0,${n.h}`}
                    fill={fill || undefined}
                  />
                )}
                {isStar && !isEllipse && (
                  (() => {
                    const w = n.w; const h = n.h; const cx = w/2; const cy = h/2; const outer = Math.min(w,h)/2; const inner = outer*0.45; const pts: string[] = [];
                    for (let i=0;i<10;i++) { const ang = (Math.PI/5)*i - Math.PI/2; const r = i%2===0?outer:inner; pts.push(`${cx + r*Math.cos(ang)},${cy + r*Math.sin(ang)}`); }
                    return <polygon data-shape="star" className="node-rect" points={pts.join(' ')} fill={fill || undefined} />;
                  })()
                )}
                {!isEllipse && !isSquare && !isTriangle && !isStar && (
                  <rect data-shape={shape} width={n.w} height={n.h} rx={corner} ry={corner} className="node-rect" fill={fill || undefined} />
                )}
                <text className="node-label" x={n.w / 2} y={textY} fill={textFill || undefined}>{String(data.text || n.type)}</text>
              </g>
            );
          })}
        </g>
        <g data-layer="overlays" />
      </svg>
    </div>
  );
};
