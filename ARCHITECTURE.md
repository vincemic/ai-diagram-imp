# Web Diagram Generator Architecture (Current Implementation)

> Status: Updated to reflect repository code as of current main branch. Earlier version of this document contained forward-looking sections (layout engine, advanced plugin sandboxing, multi-format export) that are **not yet implemented**. This revision distinguishes what exists now vs. future roadmap.

## 1. Executive Summary

A client‑only React + TypeScript application for authoring simple node/edge diagrams. The in‑memory authoritative structure is a `DiagramState` object (nodes, edges, selection, metadata) managed through an explicit Command pattern layered over a lightweight undo/redo stack. Rendering is presently **pure SVG** (no virtual scene graph abstraction beyond React & simple mapping). Persistence is limited to exporting / importing GraphML (partial support) and storing minimal user preferences in `localStorage` (`theme`, `lastOpenedTitle`). Export to JPEG/PNG is achieved by serializing the existing SVG DOM, inlining computed styles, and rasterizing to an off‑screen `<canvas>`.

## 2. Goals & Non-Goals

### Goals

- Author, edit, and visualize structured diagrams in the browser.
- Canonical, versioned JSON definition as the system of record.
- Deterministic rendering from JSON → visual output.
- One-click export to JPEG (and future formats like PNG/SVG/PDF).
- Persist user preferences (theme, grid, snap, recent files) via `localStorage`.
- Extensible node / edge types without breaking existing diagrams.

### Non-Goals (Initial Phase)

- Real-time multi-user collaboration.
- Server-side persistence or authentication.
- Enterprise RBAC / ACL models.
- Heavyweight workflow (reviews, approvals) or BPMN conformance.

## 3. High-Level Architecture Overview

Implemented layers (current):

1. **UI / React Components** (`src/components/*`): Canvas (`DiagramCanvas`), toolbars, property panes, menus, splash.
2. **Command & State Core** (`src/core/commands.ts`, `src/core/store.ts`): Command objects mutate immutable `DiagramState` snapshots via a `CommandManager` managing undo/redo stacks.
3. **Diagram Model & Validation** (`src/model/diagram.schema.json`, `validateDiagram.ts`): AJV2020 schema validation utility; not yet fully integrated into all mutation paths.
4. **GraphML Import/Export** (`src/core/graphml.ts`): Deterministic export (implemented) + browser DOM‑based import with warning & metric collection.
5. **Export (Raster)** (`src/core/exportJPEG.ts`): SVG clone + inline style + canvas rasterization to JPEG or PNG.
6. **Preferences** (`src/core/preferences.ts`): Zod schema, single namespaced key in `localStorage`.
7. **Minimal Plugin Registry** (`src/plugins/registry.ts`): Basic node type registration (size metadata only).

Not yet implemented (future roadmap items retained intentionally): dedicated layout/geometry engine abstraction, pluggable renderer backends (Canvas), sophisticated plugin sandboxing, multi-user collaboration, advanced configuration migration, telemetry hooks.

Deployment: Static build (Vite) – no backend dependencies.

## 4. Core User Flows (Implemented)

1. **Create Diagram**: App boots with `initialState` (schemaVersion `1.1.0`).
2. **Add Node**: UI action dispatches `AddNode` command → state append.
3. **Move Node**: Pointer drag triggers frequent `MoveNode` commands (not throttled yet) → immediate store update → React re-render.
4. **Connect Nodes**: Drag from connection handle → on pointer up over another node dispatch `AddEdge` with basic styling defaults.
5. **Select / Multi-select**: `SetSelection` command (currently single selection from canvas; multi-select TBD).
6. **Update Node Properties**: Property pane (where present) issues `UpdateNodeProps` command merging partial `data`.
7. **Export GraphML**: `toGraphML(diagram)` returns deterministic XML; optional omission of default rectangle shape.
8. **Import GraphML**: `fromGraphML(xml)` builds `DiagramState`; issues warnings and collects basic stats (shape fallback, unknown keys, vendor namespaces, invalid colors/widths). No migration pipeline yet beyond adopting embedded version.
9. **Export Image (JPEG/PNG)**: Calls `exportCurrentViewAsJPEG|PNG` which serializes current SVG view box, inlines style attributes, rasterizes via `<canvas>`.

Not yet implemented: JSON canonical export distinct from GraphML; incremental diff renderer (React handles reconciliation); explicit schema migrations.

## 5. In-Memory DiagramState (Actual Shape)

`DiagramState` (from `commands.ts`):

```ts
interface DiagramState {
  schemaVersion: string;          // CURRENT_SCHEMA_VERSION = '1.1.0'
  nodes: DiagramNode[];           // Each carries geometry + data blob
  edges: DiagramEdge[];           // Simple source/target (nodeId only)
  selection: string[];            // Currently active selected node/edge ids
  metadata: { title: string };    // Minimal metadata (title only)
}

interface DiagramNode {
  id: string; type: string; x: number; y: number; w: number; h: number;
  data?: Record<string, unknown>; // backgroundColor, textColor, shape, strokeColor, strokeWidth, text, etc.
}

interface DiagramEdge {
  id: string; type: string; source: { nodeId: string }; target: { nodeId: string };
  data?: Record<string, unknown>; // lineStyle, dashPattern, arrowSource/Target, routing, bendPoints, label, styling.
}
```

Not present (contrary to prior speculative example): canvas sizing, port lists, nodeType definitions with constraints, explicit style vs semantic separation, extensions object, created/modified timestamps.

Validation: AJV schema exists but is not enforced on every command dispatch; targeted use in tests / potential import validation.

## 6. State & Command Architecture (Implemented)

Zustand-based store (`useDiagramStore`) holds a single `CommandManager` instance. React components subscribe to slices (e.g., `selectDiagramState`).

`CommandManager` responsibilities:

- Holds current `DiagramState` (mutable field `_state`).
- Applies a `Command` via `dispatch(cmd)` → obtains new state from `cmd.execute(prev)`.
- Generates inverse for undo either by calling `cmd.invert(prev,next)` or storing a `SnapshotCommand(prev)` fallback.
- Maintains `undoStack` & `redoStack` as arrays of `Command` instances.

Implemented Commands: `AddNode`, `RemoveNode`, `MoveNode`, `AddEdge`, `RemoveEdge`, `SetSelection`, `UpdateNodeProps`, `ReplaceState` + internal `SnapshotCommand`.

Notes / Gaps:
- No batching / transactional command grouping yet.
- Dragging issues many `MoveNode` commands (potential performance improvement area).
- No memory cap or pruning policy on undo stack presently.
- Validation & business rules minimal (e.g., no prevention of duplicate IDs, no edge endpoint existence check inside commands — canvas rendering filters invalid references).

## 7. Layout, Geometry & Routing (Current)

There is **no separate geometry module**. All geometric logic lives inline inside `DiagramCanvas.tsx`:

- Edge path calculation supports three routing modes driven by edge `data.routing`: `straight` (default polyline), `orthogonal` (simple L-shape; bends minimal), `spline` (Catmull-Rom to Bezier conversion for >2 points).
- Bend points optional (`data.bendPoints`: array of `{x,y}`) used verbatim in path generation.
- Hit detection for connecting edges uses simple bounding box checks over current node array (O(n)).
- Drag operations compute local SVG coordinates via `getScreenCTM().inverse()`; no zoom/pan transform yet.
- Shapes (ellipse, square, triangle, diamond, parallelogram, trapezoid, hexagon, octagon, cylinder, star, rounded/rect) are rendered by conditional branches directly in JSX; geometry math inlined.

Missing vs prior design: spatial index, separate layout engine, auto-layout algorithms, multi-port anchoring, zoom/pan.

## 8. Rendering (Current)

Rendering uses React's reconciliation; there is **no custom diff engine** or abstract VSG layer. Each command dispatch triggers `set({})` in Zustand causing subscribed components to re-render.

Notable points:
- All nodes and edges are rendered every update; no memoized partitioning yet.
- Accessibility: Root SVG has `role="img"`; nodes use `role="group"` with `aria-label` from text or type.
- Selection styling via CSS classes & data attributes.
- Connection handles (small circles) initiate edge creation.

Optimization opportunities: limit `MoveNode` induced full re-render, introduce node-level memoization, implement minimal reconciliation for frequently updated attributes.

## 9. Export (JPEG / PNG)

Implemented flow (`exportJPEG.ts`):

1. Clone existing SVG and inline computed style properties (fill, stroke, font, etc.).
2. Optionally inject background rectangle if original had CSS background.
3. Serialize cloned SVG, load into `<img>`, draw onto `<canvas>` sized by element bounding box × scale (default `devicePixelRatio`).
4. Use `canvas.toBlob` to generate JPEG / PNG; trigger download via temporary anchor.

PNG export shares same pipeline; only MIME type differs. Background override is supported via options.

Not yet: multi-tile large surface export, SVG direct download (could be derived trivially), PDF.

## 10. Preferences / localStorage

Current implementation is minimal:

- Single key: `ai-diagram-imp:preferences:v1`.
- Schema (Zod): `{ theme: 'dark'; lastOpenedTitle?: string }` – only `dark` theme enumerated; no dynamic theming.
- Utility functions: `loadPreferences`, `savePreferences`, `updatePreferences`.
- No migration logic or feature flag storage yet.

## 11. Plugin / Extensibility (Current)

Current registry: `registerNodeType({ type, defaultSize })` storing size metadata only; retrieval via `getNodeType(type)`.

Missing features from prior plan: edge type registration, behaviors, property panel schema, version negotiation, sandboxing, renderer middleware.

Commands are the pragmatic extension surface today—new behavior added by defining new `Command` implementations and dispatching them from UI.

## 12. Testing (Actual State)

Test stacks present:

- **Unit (Vitest)**: command behavior (`updateNodeProps`, edge style serialization, shape props, GraphML export/import invariants).
- **End-to-End (Playwright)**: startup smoke, node interactions (drag, property pane), export image, keyboard navigation, UI element presence, screenshot generation for docs.

No current pixel-diff visual regression harness; screenshot tests validate presence rather than rendering tolerance.

Determinism techniques implemented: sorting nodes & edges during GraphML export for consistent XML order.

## 13. Error Handling (Current)

- GraphML import: accumulates warnings (unknown keys, invalid stroke width/color, parse failures) returned to caller; no UI surfacing implemented in code sampled.
- Preferences load: silent fallback to defaults upon parse or validation failure.
- Export: throws errors for missing SVG / canvas context; calling UI should handle (no global error boundary yet).
- Commands: minimal precondition checks; invalid IDs lead to no-ops or downstream rendering omissions.

## 14. Migration Strategy (Gap)

While `schemaVersion` exists (`CURRENT_SCHEMA_VERSION = '1.1.0'`), there is **no implemented migration pipeline**. Import simply trusts provided version. Preferences have no versioned migration beyond the namespaced key.

Future direction: Introduce ordered array of migration transformers keyed by semantic version; apply sequentially when older version detected during GraphML or JSON import.

## 15. Security Considerations (Current)

- User-supplied text currently interpolated into `<text>` elements (SVG text content) – lower XSS risk vs `innerHTML`, but future rich text must sanitize.
- GraphML import: unknown keys accepted for nodes (warning recorded) may inflate memory but not executed.
- No dynamic `eval` usage; no remote plugin loading.
- Potential DoS: unlimited node/edge creation; no quotas / size guards.

## 16. Roadmap (Revised Snapshot)

Near-term:
- Enforce schema validation on import & optionally on command dispatch (dev mode).
- Introduce batching / throttling for drag (`MoveNode`) to reduce undo noise.
- Basic multi-select & group move.
- Direct SVG export (already nearly available via serialization step).

Mid-term:
- Migration pipeline for schema version changes.
- Zoom & pan + viewport transform abstraction.
- Node/edge type registry expansion (behavior hooks, property schemas).
- Lightweight layout helpers (orthogonal routing improvements, snap lines).

Longer-term:
- Auto-layout algorithms integration.
- Collaboration (shared state via CRDT/OT layer + websocket service).
- Plugin sandboxing & version negotiation.
- Additional export targets (SVG packaged, PDF, high-res tiling).

## 17. Open Questions (Current)

- Should schema validation run eagerly (cost) or lazily (risk)?
- Edge routing architecture: keep inline or extract dedicated module with strategies?
- Undo stack policy: memory cap and command coalescing (e.g., merge sequential `MoveNode`).
- Preferred canonical persistence format moving forward: GraphML vs custom JSON.
- Shape taxonomy consolidation (current divergence between GraphML canonical shapes and runtime shapes like star, cylinder, etc.).

## 18. Appendix

### 18.1 Command Interface (Implemented)

```ts
interface Command<Result = void> {
  readonly name: string;
  execute(state: DiagramState): { state: DiagramState; result?: Result };
  invert?(prev: DiagramState, next: DiagramState): Command | undefined;
}
```

### 18.2 GraphML Key Mapping Overview

See `GRAPHML_KEYS` in `graphml.ts` for centralized attribute key declarations enabling deterministic export & resilient import parsing.

### 18.3 Registry Example (Current Simplicity)

```ts
registerNodeType({ type: 'process', defaultSize: { w: 160, h: 60 } });
```

Future expansion would add behaviors & rendering metadata.

---
End of current implementation architecture document.
