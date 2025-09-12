# Web Diagram Generator Architecture

## 1. Executive Summary

High-level architecture for a web-based interactive diagram generator that produces a canonical JSON diagram definition and can (a) render that JSON directly in-browser, and (b) export the rendered view as a JPEG. The solution emphasizes a clean separation between the model (JSON schema), editing logic, rendering pipeline, and export services. Configuration is persisted client-side via `localStorage` while keeping the design open for optional future backend services (e.g., collaboration, authentication, storage, rendering at scale).

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

Logical layers:

1. UI Layer (React/Vanilla + Component Library) – tools, panels, canvas.
2. Editor Core (State Manager + Commands + Undo/Redo) – domain state.
3. Diagram Model (JSON Schema + Validation) – canonical data.
4. Layout & Geometry Engine – positioning, routing, hit-testing.
5. Renderer – translates model state → DOM/SVG/Canvas.
6. Export Engine – rasterization (Canvas → JPEG) & future vectors.
7. Configuration Store – `localStorage` abstraction + schema/migration.
8. Plugin Layer – register node/edge types, behaviors, serializers.

Deployment: Pure static site (HTML/CSS/JS) served via CDN. No mandatory backend.

## 4. Core User Flows

1. Create Diagram → Initialize empty model (with metadata & schema version) → UI updates.
2. Add Node/Edge → Command executed → State updated → Re-validate → Renderer diff patches view.
3. Select & Edit → Live property panel updates JSON fragment → Re-render affected elements only.
4. Save / Export JSON → Serialize canonical in-memory model (ordered, normalized) → Download as `.json`.
5. Import JSON → Validate schema & version → Migrate if needed → Load into state → Render.
6. Export JPEG → Snapshot current visual tree → Render off-screen canvas → Encode → Download.

## 5. JSON Diagram Definition

### Design Principles

- Versioned: `schemaVersion` for migrations.
- Minimal & explicit: no derived layout stored unless explicitly locked.
- Stable identifiers: UUID-like `id` for nodes/edges for diffing & referencing.
- Separation of semantic vs visual properties (e.g., `type`, `data` vs `style`).
- Extensible: arbitrary `extensions` namespaced keys allowed.

### Top-Level Structure (Example)

```json
{
  "schemaVersion": "1.0.0",
  "metadata": {
    "title": "Sample Diagram",
    "created": "2025-09-12T12:34:56Z",
    "modified": "2025-09-12T12:34:56Z"
  },
  "canvas": {
    "width": 2400,
    "height": 1600,
    "gridSize": 16,
    "background": { "type": "solid", "color": "#ffffff" }
  },
  "nodes": [
    {
      "id": "n1",
      "type": "process",
      "position": { "x": 120, "y": 240 },
      "size": { "w": 180, "h": 60 },
      "data": { "label": "Start" },
      "style": { "fill": "#E3F2FD", "stroke": "#1976D2" },
      "ports": [ { "id": "p1", "side": "right" } ],
      "extensions": {}
    }
  ],
  "edges": [
    {
      "id": "e1",
      "type": "straight",
      "source": { "nodeId": "n1", "portId": "p1" },
      "target": { "nodeId": "n2", "portId": "p3" },
      "style": { "stroke": "#424242", "width": 2 },
      "markers": { "end": "arrow" },
      "extensions": {}
    }
  ],
  "definitions": {
    "nodeTypes": {
      "process": { "resizable": true, "minSize": { "w": 120, "h": 48 } }
    },
    "edgeTypes": {
      "straight": { "routing": "direct" }
    }
  },
  "extensions": {}
}
```

### Validation & Migrations

- JSON Schema (Draft 2020-12) distributed with app; version keyed by `schemaVersion`.
- On load: parse → basic structural validation → deep semantic validation (e.g., edge references existing nodes & ports) → migration pipeline (sequence of pure functions) if version mismatch.

## 6. State & Command Architecture

- Central immutable store (e.g., Zustand, Redux, or custom) representing current diagram state.
- Commands encapsulate intent: `AddNode`, `UpdateNode`, `DeleteEdge`, `MoveNodes`, `BatchUpdate`.
- Each command: validate preconditions → produce new state → push onto undo stack.
- Undo/Redo stacks store command inverses or prior state snapshots (bounded memory strategy).
- Derived selectors compute: selection sets, spatial index (R-Tree or Quadtree), render list.

## 7. Layout & Geometry

- Core utilities: rectangle ops, intersection tests, orthogonal routing, anchor resolution, zoom/pan transforms.
- Edge routing strategies (pluggable): direct, orthogonal, curved (Bezier). Each returns polyline/curve path segments.
- Hit-testing: spatial index of node bounds + port hotspots + edge segments for pointer interaction.
- Auto-layout (Phase 2): optional algorithms (DAG layered layout, force-directed) executed on demand; results not persisted unless user chooses to "freeze layout".

## 8. Rendering Pipeline

Rendering abstraction supports interchangeable backends (SVG initial, Canvas optional):

1. Diff Engine: Compares previous and next virtual scene graph (VSG) derived from state.
2. Element Builders: Map node/edge models to VSG primitives (shapes, paths, text).
3. Renderer Adapter: Applies diff to DOM/SVG nodes with minimal mutation.
4. Interaction Layer: Overlays selection boxes, drag handles, guides, snap lines.
5. Accessibility Hooks: ARIA roles, focus rings, keyboard nav order.

Performance Techniques:

- RequestAnimationFrame batching.
- Debounced layout recalculation.
- Dirty rectangle tracking for Canvas backend.
- Lazy text measurement caching.

## 9. Export to JPEG

Primary (Client-Only) Path:

1. Serialize current scene to SVG string (ensures crisp vector fidelity).
2. Create off-screen `<canvas>` sized to bounding box * devicePixelRatio.
3. Draw SVG via `Image` element once loaded.
4. `canvas.toDataURL('image/jpeg', quality)` and trigger download.

Considerations:

- Background fill required (JPEG lacks alpha); derive from canvas background.
- Font loading: ensure `document.fonts.ready` resolved before render.
- Large diagrams: tile rendering or scale factor cap to prevent memory errors.

Optional (Future) Server Path:

- Headless renderer (Node + Puppeteer / Sharp) for deterministic, large-scale exports (PNG/PDF/SVG/JPEG) and batch processing.

## 10. Configuration via localStorage

Key Strategy: Prefix all keys: `dg:<version>:<key>` to avoid collisions.

Example Keys:

- `dg:1:preferences` – JSON blob { theme, snapToGrid, showMiniMap }.
- `dg:1:recent` – Array of recent diagram metadata.
- `dg:1:featureFlags` – Map of experimental toggles.

Access Pattern:

- Thin abstraction module: get(key) / set(key, validator) / migrate(previousVersion).
- On app load: detect version mismatch and run migration for persisted preferences.
- Validation: Zod (or similar) runtime schema ensures corrupted entries are discarded with fallback defaults.

Privacy & Limits:

- Avoid storing full diagrams if size risk (quota). Encourage manual export/import.
- Provide "Clear Local Data" action.

## 11. Plugin & Extensibility Model

Extension Points:

- Node Types: register render, default size, property panel schema, behaviors (resize, anchors).
- Edge Types: routing strategy, marker shapes, interaction handles.
- Commands: custom domain operations that integrate with undo/redo.
- Serializers: augment `extensions` namespace with plugin-specific data.
- Render Middleware: intercept VSG before diff (e.g., theming, overlays).

Registration Mechanism:

- Plugin manifest object consumed at boot. Merges into registries; conflicts resolved by explicit namespacing (e.g., `acme.timelineNode`).
- Version negotiation: plugin declares supported `schemaVersionRange`.

Isolation & Safety:

- Defensive runtime guards; plugin cannot mutate core state directly—must dispatch commands.
- Optional sandbox (iframe / Realms future) for untrusted third-party plugins.

## 12. Non-Functional Requirements

Performance:

- Target <16ms average frame during drag on mid-tier hardware.
- Load & render medium diagram (200 nodes, 300 edges) <1.5s.

Accessibility:

- Keyboard navigation for selection & movement (arrow keys + modifiers).
- Screen reader labels via node `data.label`.

Security:

- No eval-based plugin loading; static import or vetted dynamic modules.
- Sanitize text for SVG injection contexts.

Reliability:

- Deterministic serialization ordering (sort nodes/edges by id) for diff-friendly output.

Testing:

- Unit: geometry, commands, serializers.
- Integration: import→render parity tests (snapshot of VSG).
- Visual regression: Playwright + pixel diff on key examples.

Observability (Future):

- Instrument command dispatch timings.
- Error boundary with telemetry hooks.

## 13. Error Handling Strategy

- Validation errors surfaced with actionable messages (e.g., "Edge e17 references missing node n404").
- Non-blocking recoverable errors (layout fail) fall back to default strategy.
- Corrupt localStorage entries purged with notification.

## 14. Migration Strategy

Schema Migration Steps:

1. Detect older `schemaVersion`.
2. Sequentially apply transformer functions (pure, idempotent).
3. Re-validate after each step; abort & report if failure.
4. Append migration report to in-memory log (debug panel inspection).

Preference Migration:

- Map old keys to new or drop deprecated flags.

## 15. Security & Threat Surface

- Primary risk: XSS via embedded text in nodes. Mitigation: encode or restrict markup.
- Denial via oversized diagrams: enforce soft limits & warn.
- Plugin isolation: disallow direct DOM traversal outside provided sandbox API.

## 16. Roadmap (Indicative)

Phase 1 (MVP): Core editor, JSON import/export, SVG render, JPEG export, local preferences.
Phase 2: Auto-layout algorithms, multi-select alignment, theming, PNG/SVG export options.
Phase 3: Collaborative editing (CRDT/OT), cloud persistence, user auth, template gallery.
Phase 4: Advanced analytics (change history, metrics), plugin marketplace, enterprise SSO.

## 17. Open Questions / Decisions Pending

- Choose initial rendering backend: pure SVG vs hybrid (SVG nodes, Canvas edges)?
- Adopt existing layout libs (ELK, Dagre) or custom minimal implementation?
- Plugin packaging format (ES modules only vs UMD fallback)?

## 18. Appendix

### 18.1 Alternative Export Paths

- Direct Canvas Render: Skip SVG intermediate but lose vector clarity; harder for crisp text scaling.
- WebAssembly Rasterizer: For very large diagrams—likely premature optimization.

### 18.2 Example Command (Pseudo-code)

```ts
interface Command<Result = void> {
  readonly name: string;
  execute(state: DiagramState): { state: DiagramState; result?: Result };
  invert?(prevState: DiagramState, nextState: DiagramState): Command;
}
```

### 18.3 Minimal Node Type Registration

```ts
registerNodeType('process', {
  defaultSize: { w: 180, h: 60 },
  render(props) { /* returns VSG element */ },
  propertyPanelSchema: { label: { type: 'string', maxLength: 64 } },
  behaviors: { resizable: true, anchors: ['top','right','bottom','left'] }
});
```

---
End of document.
