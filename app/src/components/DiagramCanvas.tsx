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
        <defs>
          <marker id="arrow-standard" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
          <marker id="arrow-circle" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <circle cx="5" cy="5" r="4" fill="currentColor" />
          </marker>
          <marker id="arrow-diamond" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
          </marker>
          <marker id="arrow-tee" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M9 0 L9 10 M9 5 L0 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </marker>
        </defs>
        <g data-layer="edges" onPointerDown={handleBackgroundPointerDown}>
          <rect x={0} y={0} width={2000} height={1200} fill="transparent" />
          {state.edges.map(edge => {
            const source = state.nodes.find(n => n.id === edge.source.nodeId);
            const target = state.nodes.find(n => n.id === edge.target.nodeId);
            if (!source || !target) return null;
            const data: any = edge.data || {};
            const sx = source.x + source.w / 2;
            const sy = source.y + source.h / 2;
            const tx = target.x + target.w / 2;
            const ty = target.y + target.h / 2;
            const bends: { x: number; y: number }[] = Array.isArray(data.bendPoints) ? data.bendPoints : [];
            const points = [{ x: sx, y: sy }, ...bends, { x: tx, y: ty }];
            let d = '';
            if (data.routing === 'orthogonal') {
              // Simple orthogonal: insert right-angle via midpoint for now
              if (bends.length === 0) {
                const midX = sx; const midY = ty; // L shape
                d = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${midY} L ${tx} ${ty}`;
              } else {
                d = 'M ' + points.map((p,i) => (i===0?`${p.x} ${p.y}`:`L ${p.x} ${p.y}`)).join(' ');
              }
            } else if (data.routing === 'spline') {
              if (points.length <= 2) {
                d = `M ${sx} ${sy} L ${tx} ${ty}`;
              } else {
                // Basic Catmull-Rom to Bezier conversion for smooth path
                const toBezier = (pts: {x:number;y:number}[]) => {
                  if (pts.length < 2) return '';
                  let path = `M ${pts[0].x} ${pts[0].y}`;
                  for (let i=0;i<pts.length-1;i++) {
                    const p0 = pts[i-1] || pts[i];
                    const p1 = pts[i];
                    const p2 = pts[i+1];
                    const p3 = pts[i+2] || p2;
                    const cp1x = p1.x + (p2.x - p0.x)/6;
                    const cp1y = p1.y + (p2.y - p0.y)/6;
                    const cp2x = p2.x - (p3.x - p1.x)/6;
                    const cp2y = p2.y - (p3.y - p1.y)/6;
                    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                  }
                  return path;
                };
                d = toBezier(points);
              }
            } else {
              // straight
              d = 'M ' + points.map((p,i) => (i===0?`${p.x} ${p.y}`:`L ${p.x} ${p.y}`)).join(' ');
            }
            const stroke = data.strokeColor || '#8899aa';
            const strokeWidth = typeof data.strokeWidth === 'number' ? data.strokeWidth : 1.2;
            const lineStyle = data.lineStyle as string | undefined;
            const dashPattern = data.dashPattern as string | undefined;
            const strokeDasharray = dashPattern ? dashPattern : (lineStyle === 'dashed' ? '6 4' : lineStyle === 'dotted' ? '2 4' : undefined);
            const markerStart = data.arrowSource && data.arrowSource !== 'none' ? `url(#arrow-${data.arrowSource})` : undefined;
            const markerEnd = data.arrowTarget && data.arrowTarget !== 'none' ? `url(#arrow-${data.arrowTarget})` : undefined;
            // midpoint for label (simple: average of all points)
            const mx = points.reduce((s,p)=>s+p.x,0)/points.length;
            const my = points.reduce((s,p)=>s+p.y,0)/points.length;
            return (
              <g key={edge.id} className="edge" data-edge-id={edge.id}>
                <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} markerStart={markerStart} markerEnd={markerEnd} />
                {data.label && (
                  <text className="edge-label" x={mx} y={my - 4} textAnchor="middle" fontSize={10} fill={stroke}>{String(data.label)}</text>
                )}
              </g>
            );
          })}
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
            const isDiamond = shape === 'diamond';
            const isParallelogram = shape === 'parallelogram';
            const isTrapezoid = shape === 'trapezoid';
            const isHexagon = shape === 'hexagon';
            const isOctagon = shape === 'octagon';
            const isCylinder = shape === 'cylinder';
            const squareSide = Math.min(n.w, n.h);
            const textY = (() => {
              if (isTriangle) return (2 * n.h) / 3;
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
                {isDiamond && !isEllipse && (
                  <polygon
                    data-shape="diamond"
                    className="node-rect"
                    points={`${n.w/2},0 ${n.w},${n.h/2} ${n.w/2},${n.h} 0,${n.h/2}`}
                    fill={fill || undefined}
                  />
                )}
                {isParallelogram && !isEllipse && (
                  (() => {
                    const skew = Math.min(n.w * 0.25, 30);
                    return <polygon data-shape="parallelogram" className="node-rect" points={`${skew},0 ${n.w},0 ${n.w - skew},${n.h} 0,${n.h}`} fill={fill || undefined} />;
                  })()
                )}
                {isTrapezoid && !isEllipse && (
                  (() => {
                    const topInset = Math.min(n.w * 0.2, 40);
                    const bottomInset = Math.min(n.w * 0.05, 20);
                    return <polygon data-shape="trapezoid" className="node-rect" points={`${topInset},0 ${n.w - topInset},0 ${n.w - bottomInset},${n.h} ${bottomInset},${n.h}`} fill={fill || undefined} />;
                  })()
                )}
                {isHexagon && !isEllipse && (
                  (() => {
                    const inset = n.w * 0.2;
                    return <polygon data-shape="hexagon" className="node-rect" points={`${inset},0 ${n.w - inset},0 ${n.w},${n.h/2} ${n.w - inset},${n.h} ${inset},${n.h} 0,${n.h/2}`} fill={fill || undefined} />;
                  })()
                )}
                {isOctagon && !isEllipse && (
                  (() => {
                    const cut = Math.min(n.w, n.h) * 0.2;
                    const w = n.w, h = n.h;
                    return <polygon data-shape="octagon" className="node-rect" points={`${cut},0 ${w - cut},0 ${w},${cut} ${w},${h - cut} ${w - cut},${h} ${cut},${h} 0,${h - cut} 0,${cut}`} fill={fill || undefined} />;
                  })()
                )}
                {isCylinder && !isEllipse && (
                  (() => {
                    const rx = n.w / 2;
                    const ry = Math.min(n.h * 0.18, n.w * 0.25);
                    const top = ry;
                    const bottom = n.h - ry;
                    const d = `M0 ${top} Q0 0 ${rx} 0 Q${n.w} 0 ${n.w} ${top} L${n.w} ${bottom} Q${n.w} ${n.h} ${rx} ${n.h} Q0 ${n.h} 0 ${bottom} Z`;
                    return <path data-shape="cylinder" className="node-rect" d={d} fill={fill || undefined} />;
                  })()
                )}
                {isStar && !isEllipse && (
                  (() => {
                    const w = n.w; const h = n.h; const cx = w/2; const cy = h/2; const outer = Math.min(w,h)/2; const inner = outer*0.45; const pts: string[] = [];
                    for (let i=0;i<10;i++) { const ang = (Math.PI/5)*i - Math.PI/2; const r = i%2===0?outer:inner; pts.push(`${cx + r*Math.cos(ang)},${cy + r*Math.sin(ang)}`); }
                    return <polygon data-shape="star" className="node-rect" points={pts.join(' ')} fill={fill || undefined} />;
                  })()
                )}
                {!isEllipse && !isSquare && !isTriangle && !isStar && !isDiamond && !isParallelogram && !isTrapezoid && !isHexagon && !isOctagon && !isCylinder && (
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
