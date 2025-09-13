# GraphML Integration Roadmap

Status: Draft (Phase 0) – Current schemaVersion: 1.1.0 (bumped from 1.0.0 after edge styling & rendering addition)
Owner: (assign)
Last Updated: 2025-09-12

## 1. Goals

Provide import/export interoperability with common graph / diagram tools (yEd, Gephi, Cytoscape) via GraphML while preserving core semantic model (nodes, edges, geometry, basic styling, title). Avoid scope creep into proprietary extensions until usage justifies.

## 2. Non‑Goals (Initial Phases)

- Full fidelity with yFiles / yEd proprietary `<y:*>` extensions
- Automatic layout translation
- Grouping / nesting (not in current model)
- Edge routing waypoints (not in current model)
- Undo stack / selection persistence
- Advanced style themes, fonts, line patterns (export minimal only)

## 3. Current Internal Model Summary

DiagramState:

- schemaVersion (string)
- metadata.title (string)
- nodes[]: { id, type, x, y, w, h, data? (backgroundColor, textColor, etc.) }
- edges[]: { id, type, source.nodeId, target.nodeId }
- selection[] (UI only, ignore for GraphML)

## 4. Mapping Specification (Phase 1 / 2 Core)

GraphML Structure:

```xml
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="d_title" for="graph" attr.name="title" attr.type="string" />
  <key id="d_type" for="node" attr.name="type" attr.type="string" />
  <key id="d_x" for="node" attr.name="x" attr.type="double" />
  <key id="d_y" for="node" attr.name="y" attr.type="double" />
  <key id="d_w" for="node" attr.name="w" attr.type="double" />
  <key id="d_h" for="node" attr.name="h" attr.type="double" />
  <key id="d_bg" for="node" attr.name="backgroundColor" attr.type="string" />
  <key id="d_tc" for="node" attr.name="textColor" attr.type="string" />
  <key id="d_nodeData" for="node" attr.name="data" attr.type="string" /> <!-- JSON string for unknown extra fields -->
  <key id="d_edgeType" for="edge" attr.name="type" attr.type="string" />
  <key id="d_modelVersion" for="graph" attr.name="modelVersion" attr.type="string" />
  <graph id="G" edgedefault="directed">
    <!-- nodes / edges -->
  </graph>
</graphml>
```

### Mapping Table

| Internal | GraphML Element/Attr | Key | Notes |
|----------|----------------------|-----|-------|
| metadata.title | `<graph><data>` | d_title | One per graph |
| schemaVersion | `<graph><data>` | d_modelVersion | Mirror internal version |
| node.id | `<node id="..."/>` | n/a | Must remain unique |
| node.type | `<data key="d_type">` | d_type | |
| node.x | `<data key="d_x">` | d_x | number |
| node.y | `<data key="d_y">` | d_y | number |
| node.w | `<data key="d_w">` | d_w | number |
| node.h | `<data key="d_h">` | d_h | number |
| node.data.backgroundColor | `<data key="d_bg">` | d_bg | optional |
| node.data.textColor | `<data key="d_tc">` | d_tc | optional |
| Remaining node.data props | `<data key="d_nodeData">` | d_nodeData | JSON serialize object minus extracted fields |
| edge.id | `<edge id="..."/>` | n/a | Unique |
| edge.source.nodeId | `<edge source="..."/>` | n/a | |
| edge.target.nodeId | `<edge target="..."/>` | n/a | |
| edge.type | `<data key="d_edgeType">` | d_edgeType | |
| selection | (ignored) | - | UI only |

### Import Handling

- Required node keys: id, type, x,y,w,h (if missing -> error)
- Optional style keys default to AddNode defaults
- If d_nodeData present: parse JSON (fail-safe: catch & warn, skip)
- Unknown `<key>` entries not in map: ignore but collect warnings.

## 5. Phased Task Breakdown

### Phase 1: Export MVP

- [x] Pure function `toGraphML(diagram: DiagramState): string`
- [x] Key registry constant
- [x] Ensure XML escaping & no DTD injection (no external entities)
- [x] Unit tests: small sample (export structure test)

### Phase 2: Import Core

- [x] Function `fromGraphML(xml: string): { diagram: DiagramState; warnings: string[] }`
- [x] XML parse (DOMParser in browser)
- [x] Validation & normalization (schema validation performed after parse in import flow)
- [x] Tests: round-trip, malformed missing required attributes

### Phase 3: Extended Attributes & Styling Foundations

- [x] Basic styling foundation: shape persistence + strokeColor + strokeWidth (keys: d_shape, d_sc, d_sw) – importer/exporter + tests
- [x] UI controls to edit strokeColor & strokeWidth (property pane inputs added)
- [x] Shape variant export option flag (`omitDefaultShape` in `toGraphML` to suppress `rect`)
- [x] Color validation enhancement (simple regex for strokeColor + warning & stat counter)
- [x] Decide on internal canonical shape name list & mapping table placeholder (rect, diamond, ellipse, circle, hexagon)
- [x] Namespaced vendor extensions stub: detection of yWorks/yFiles namespaces (captured in `stats.vendorNamespaces`, ignored otherwise)
- [ ] Compression option (.graphml or .graphml.zip) (deferred)

### Phase 4: Tooling & Documentation

- [x] Add toolbar actions: Export GraphML, Import GraphML (file picker)
- [x] User guide section (usage + limitations)
- [x] Sample GraphML files in `examples/graphml/`

### Phase 5: Quality & Performance

- [ ] Large graph benchmarking script (generate 5k nodes + edges)
- [ ] Property-based round-trip test (optional)

## 6. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep into styling dialects | Delays | Phase gate: ship MVP first |
| Malformed external GraphML | Import failures | Graceful warnings; strict validation after parse |
| Performance on large graphs | Slow UX | Measure early with synthetic test |
| Future model changes | Drift | Centralize mapping constants and version key |
| Security (XXE) | Potential exploit | No external entity resolution; simple string build/DOMParser |

## 7. Open Questions

- Do we need undirected edge support initially? (Currently always directed.)
- Should we compress large exports automatically? (Defer.)
- Need deterministic ordering? (Yes: sort nodes/edges by id for test stability.)

## 8. Acceptance Criteria (Phase 1 & 2)

- Exported file opens in yEd / Gephi (nodes & edges appear) ignoring unrecognized keys.
- Importing exported file back yields deep-equal DiagramState (ignoring selection ordering, plus tolerated default color differences if absent in source).
- Unit tests snapshot stable.

## 9. Implementation Notes

- Consider small helper: `xml(tag, attrs, children?)` for readability.
- Keep functions pure & side-effect free; integrate with UI via existing command `ReplaceState` on import.
- Add test fixtures under `src/tests/unit/graphml/`.

## 10. Next Immediate Steps (Now)

1. Create mapping constants & stub functions file `src/core/graphml.ts`.
2. Implement export MVP.
3. Add unit test skeleton.

---
End of Draft

## 11. Future Improvements & Enhancements (Backlog)

These are not committed for the initial phases but represent logical next steps to increase interoperability and fidelity.

### 11.1 Shape & Style Fidelity

- Map internal extended shapes (diamond, hexagon, etc.) to yFiles `<y:ShapeNode>` shape names on export (optional flag).
- Parse yFiles `<y:ShapeNode>` (if namespace present) to recover shape -> internal `data.shape` (fallback to `rect` with warning when unknown).
- Add warning aggregation: `shapesDowngraded: number`, `unsupportedShapes: string[]`.

### 11.2 Vendor Extension Support (yFiles / yEd)

- Detect namespace `http://www.yworks.com/xml/graphml` and, behind feature flag, parse:
  - Geometry (x,y,width,height) vs existing numeric data.
  - Fill (color, transparency) -> backgroundColor.
  - BorderStyle (line width, color) -> future edge/node stroke fields.
  - NodeLabel text -> `data.text` if absent.
- Export minimal `<y:ShapeNode>` block mirroring basic fill + shape when enabled.

### 11.3 Edge Rendering & Metadata

Status: PARTIAL COMPLETE (2025-09-12)

- [x] Visual edge rendering (straight, orthogonal fallback, spline) implemented in `DiagramCanvas`.
- [x] Edge styling keys (strokeColor, strokeWidth, lineStyle/dashPattern, arrowSource, arrowTarget, label, routing, bendPoints, extra data) mapped via GraphML export/import.
- [x] Edge labels rendered (simple centroid positioning).
- [ ] Interactive edge selection & keyboard navigation.
- [ ] Edge hover/selection styling differentiation.
- [ ] Bend point interactive editing (drag handles).
- [ ] Smarter orthogonal routing (detour avoidance, Manhattan segments).
- [ ] Improved label placement (path length midpoint + collision avoidance).
- [ ] Parse vendor (yFiles) edge bends -> `edge.data.bendPoints`.

### 11.4 Styling Extensions

- Introduce optional `data.strokeColor`, `data.strokeWidth` with GraphML keys.
- Add font style capture (bold / italic) if property pane later supports typography.

### 11.5 Robust Warning & Error UX

- Replace `alert()` with in-app non-blocking toast / panel summarizing import warnings.
- Surface import stats (invalidStrokeColors, invalidStrokeWidths, missingShape, unknownNodeKeys, vendorNamespaces) in the panel for quick diagnostics (replaces raw console reliance).
- Offer downloadable import report JSON (list of downgrades, ignored keys).
- Provide a diff view: original GraphML (normalized) vs reconstructed model (developer mode).

### 11.6 Performance & Large Graph Handling

- Streaming / chunked parse for very large files (use SAX-style parser in Web Worker) if > N MB.
- Lazy node materialization: create minimal node objects first, hydrate `data` asynchronously.
- Add benchmark fixture (5k, 10k nodes) and track parse + export timing.

### 11.7 Compression & Packaging

- Offer `.graphml.zip` download (JSZip) for large graphs to reduce transfer size.
- Support import of zipped GraphML (detect by magic bytes) – progressive enhancement.

### 11.8 Validation Enhancements

- Pre-validate required attributes before full DOM traversal for faster failure.
- Add schema version compatibility matrix & auto-upgrade transforms.

### 11.9 Testing & Quality

- Golden files for vendor extension round-trips (once implemented).
- Property-based tests generating random graphs with shape variety.
- Snapshot tests for deterministic export across timezones/locales.

### 11.10 Configuration & Flags

- Add settings panel toggle: "Include vendor extensions (yFiles)".
- Add telemetry hook (if enabled) counting GraphML imports/exports & warning categories.

### 11.11 Accessibility & Semantics

- When adding shape vendor mapping, ensure ARIA descriptions reflect downgraded shapes (e.g., "Hexagon (rendered as rectangle)").

### 11.12 Security Hardening

- Additional validation: reject files with external entity declarations even if DOMParser ignores them (pre-scan for `<!DOCTYPE`).
- Size limits & early abort if file exceeds configured maximum.

### 11.13 Developer Tooling

- Provide a CLI conversion script (Node) to batch convert JSON <-> GraphML for automation pipelines.
- Add VS Code snippet / task to regenerate GraphML test fixtures.

### 11.14 Roadmap Candidates (Evaluate Demand)

- Multi-graph support (multiple `<graph>` elements) mapping to tabs or layers.
- GraphML -> JSON diff tool for merges.
- Import policy: selective node/edge merging vs replace entire state.

---
Backlog section added (2025-09-12)

## 12. Phase 3 Detailed Plan (Extended Attributes & Styling Foundations)

Objective: Introduce minimal style extensibility (strokes + shape variant export) without locking into any single vendor dialect. Provide a clean internal abstraction so later vendor-specific exporters can layer on.

### 12.1 Scope (In-Scope vs Out-of-Scope)

In-Scope:

- New optional node style fields: `strokeColor`, `strokeWidth` in `node.data`.
- GraphML key additions for the above (export + import when present).
- Graceful defaults when absent (no stroke or 1px neutral stroke depending on design choice).
- Basic shape variant mapping (internal shapes already supported) – ensure export includes them as plain keys, NOT vendor `<y:ShapeNode>` yet.
- Update documentation & user guide (limitations note).

Out-of-Scope (defer to later backlog items):

- Fonts, text alignment, multiline labels.
- Vendor namespaces (`y:`) emission.
- Edge styling (handled in a later edge-focused phase alongside rendering).

### 12.2 Data Model Changes

- Extend `node.data` optional fields: `strokeColor?: string`, `strokeWidth?: number`.
- Do NOT mandate presence; absence means use existing fill-only rendering.
- Potential future consolidation: a `style` sub-object (not introduced now to avoid churn).

### 12.3 GraphML Key Additions

| Key ID | for | attr.name | attr.type | Notes |
|--------|-----|-----------|-----------|-------|
| d_sc | node | strokeColor | string | Hex or CSS color |
| d_sw | node | strokeWidth | double | Store numeric width |
| d_shape | node | shape | string | Persist internal shape name |

Ordering guideline: Keep deterministic order – append new `<key>` definitions after existing ones to minimize diff churn (export writer will list them in fixed sequence constant array).

### 12.4 Export Behavior

- Always export `d_shape` for nodes (even default `rect`) to preserve round-trip fidelity.
- Export `d_sc`, `d_sw` only when defined (omit otherwise to reduce noise).
- Validation: if `strokeWidth` <= 0 ignore & do not emit key (log dev console warning in non-production builds).

### 12.5 Import Behavior

- If `d_shape` missing: default `rect` (warn once per file category).
- If `d_sc` present but invalid color (basic regex fail): ignore + warning.
- If `d_sw` non-numeric or <= 0: ignore + warning.
- Merge into existing `node.data` object (preserve previously handled fields).

### 12.6 Warnings & Telemetry Hooks (Internal Only This Phase)

- Aggregate counters (not surfaced in UI yet): `{ invalidStrokeColors, invalidStrokeWidths, missingShape }`.
- Expose via return `warnings[]` messages appended to current import warning list.

### 12.7 Testing Plan

- Unit tests:
  - Export includes shape + stroke keys when present (snapshot / string contains).
  - Omission tests: no stroke keys when undefined.
  - Round-trip: shape + stroke preserved.
  - Invalid stroke width (<0) ignored with warning.
  - Invalid color string ignored with warning.
- Property-based test (optional, if Phase 5 overlaps): randomly assign stroke attributes.

### 12.8 Migration & Backward Compatibility

- Older GraphML (without new keys) still imports; defaults apply.
- New exports still readable by older importer versions (they just ignore unknown keys) – ensure importer gracefully skips unrecognized style keys if running outdated code.

### 12.9 Implementation Steps

1. Extend key registry constant with new key IDs (update tests referencing array length if any).
2. Update `toGraphML` to emit new keys & data elements.
3. Update `fromGraphML` parse switch to recognize new keys + validations.
4. Add state mutation pathways (Property Pane enhancement optional – if UI not yet exposing stroke, can seed via tests first).
5. Write unit tests for export/import (see 12.7).
6. Update `USER_GUIDE.md` (Beta section: styling keys minimal; shapes now persisted explicitly).
7. Update `GRAPHML_TODO.md` marking Phase 3 tasks when complete.

### 12.10 Acceptance Criteria

- Export includes `d_shape` for all nodes.
- Import of prior Phase 2 GraphML (no shape key) still succeeds defaulting shapes.
- Stroke attributes round-trip when provided and valid.
- All new unit tests pass; existing tests unaffected.
- Documentation updated reflecting new keys and limitations (no vendor namespace yet).

### 12.11 Rollout Notes

- Gate future vendor namespace emission behind explicit configuration to avoid breaking consumers expecting lean files.
- Consider semantic version bump of internal `schemaVersion` to reflect style extension capability.

---
Phase 3 plan added (2025-09-12)

## 13. Next Steps (Proposed Prioritized Backlog)

Short list to guide immediate incremental work after Phase 3 foundation:

1. Large graph benchmarking harness (script to synthesize N nodes/edges and measure export/import timings; integrates with Phase 5).
2. Property-based round-trip test (quickcheck style random graph generation including optional stroke + shape fields).
3. UI exposure of strokeColor + strokeWidth (extend property pane + validation; ties back to Phase 3 remaining checkbox).
4. Warning aggregation structure (counts for missingShape, invalidStrokeWidth, unknownKeys) and single summarized alert message.
5. Vendor extension detection stub (detect yFiles namespace; capture but ignore `<y:*>` blocks; add warning count) without emitting vendor data yet.
6. Compression option (optional .graphml.zip export) behind feature flag; defer import until after benchmark results.
7. Security hardening pre-scan: reject files containing `<!DOCTYPE` or external entity declarations before DOM parse.
8. CLI conversion script (Node) for JSON <-> GraphML batch operations (foundation for automation & regression fixtures).
9. Golden fixture set including: minimal diagram, styled nodes (stroke), mixed shapes, large synthetic sample (for benchmarking consistency).
10. Edge rendering MVP so imported edges are visually represented (improves usability validation of round-trips).

(Added 2025-09-12 after completing initial Phase 3 styling keys.)

## 14. Potential Next Enhancements (Edge Styling & Interaction)

These build upon the newly added edge styling and rendering layer.

### 14.1 Edge Interaction & UX

- Add edge hit area: duplicate path with transparent wide stroke for easier pointer targeting.
- Edge selection state: click to select, shift-click to multi-select, reflect in `selection[]` (prefix `edge:` or maintain separate array).
- Keyboard deletion & navigation for edges (Tab cycles nodes & edges, arrow keys maybe cycle incident edges).
- Hover affordances: lighten stroke or show subtle glow; show endpoints/bend handles.

### 14.2 Bend Point Editing

- On selected edge, render draggable circle handles at bend points.
- Double-click on edge path to insert a new bend point; Delete key while a handle focused removes it.
- Constraint options: hold Shift to constrain new bend to horizontal/vertical relative to previous point.
- Data persistence: update `edge.data.bendPoints` array and re-export automatically.

### 14.3 Routing Strategies

- Orthogonal refinement: automatically insert intermediate bends that minimize total Manhattan distance while avoiding node bounding boxes (simple obstacle avoidance first, full A* grid later).
- Spline smoothing toggle: user can convert straight polyline with bends into spline (flag `routing: 'spline'`).
- Future: incremental reroute when nodes move (preserve user-added bends unless overlapping a node).

### 14.4 Label Management

- Dynamic label anchoring at geometric path midpoint using cumulative length instead of centroid average.
- Auto-flip label to avoid overlapping nodes (bounding box collision check).
- Multi-line label support (parse `\n`).
- Optional label background pill (semi-transparent rounded rect) for contrast.

### 14.5 Styling UI

- Property pane section for selected edge: stroke color picker, width slider, line style dropdown, arrow source/target dropdown, routing mode selector, label text input.
- Live preview updates diagram state debounced (e.g., 120ms) for performance.
- Bulk edit (multi-selected edges) applies changes to all, showing mixed-value indicators.

### 14.6 Data & Validation

- Extend importer stats: `invalidEdgeStrokeColors`, `invalidEdgeStrokeWidths`, `unknownEdgeKeys`, `invalidBendPoints`.
- Add deterministic ordering of bend points on save (already implied; enforce numeric sort if future features add z-order semantics).
- Schema version bump to reflect edge styling addition (e.g., 1.1.0) and add upgrade path for pre-1.1 graphs (set default styling).

### 14.7 Performance Considerations

- Path caching: memoize computed `d` strings keyed by (points, routing, smoothing) to avoid recompute on unrelated state updates.
- Layer virtualization for large edge counts (thousands) – slice rendering to viewport bounding box + margin.
- Optional Web Worker for heavy future routing algorithms (deferred; maintain pure UI thread rendering for now).

### 14.8 Testing Additions

- Unit test: bend point round-trip across export/import with multiple routing modes.
- Visual regression: captured PNG/SVG snapshots for representative edge styles (requires deterministic layout).
- Interaction E2E: add tests for selecting edge, editing label, adding/removing bends.
- Property-based: random edge sets with varied styling ensure importer resilience.

### 14.9 Vendor Compatibility (Forward-Looking)

- Map arrow types to yFiles equivalents where possible (standard -> standard, diamond -> diamond, circle -> circle) when emitting vendor namespace.
- Translate yFiles `PolyLineEdge` / `SplineEdge` bends into internal `bendPoints` and `routing`.
- On export, optional vendor block generation behind `includeVendorExtensions` flag.

### 14.10 Accessibility

- Provide focusable edge elements (tab index) with ARIA label "Edge from &lt;SourceNode&gt; to &lt;TargetNode&gt; label: &lt;EdgeLabel&gt;".
- High-contrast mode: ensure dashed/dotted patterns meet contrast guidelines (adjust strokeColor fallback).

### 14.11 Tooling & Authoring

- Add a mini floating toolbar when an edge is selected (quick arrow toggle, style preset buttons).
- Style presets (e.g., "Flow", "Dependency", "Error") applying a bundle of stroke + arrow + dash.

### 14.12 Potential Risks

- Over-complex routing early: mitigate by incremental shipping (straight -> bend editing -> routing heuristics -> obstacle avoidance).
- Performance with many splines: fallback to straight lines over threshold (configurable) with user toggle to enable full fidelity.

---

Section 14 added 2025-09-12.

## 15. Immediate Next Options (Post Edge Rendering)

Prioritized shortlist distilled from broader backlog to guide the next iteration. Each item is scoped to be shippable independently.

### 15.1 Edge Interaction & Editing (High Value)

- Select edges (hit area + visual highlight) and allow Delete key removal.
- Add basic edge property editing (target arrowhead, label text) in existing property pane when an edge is selected.
- Provide focusable edge elements with ARIA labels.

### 15.2 Edge Styling UI (Incremental)

- Add inputs for stroke color, stroke width, line style (solid / dashed / dotted) in property pane.
- Persist changes immediately to `edge.data` (debounced) and ensure GraphML round-trip.

### 15.3 Label Placement Improvement

- Compute label position via path length midpoint instead of geometric centroid.
- Fallback to centroid if path length computation fails.

### 15.4 Warning Aggregation UX

- Replace multiple `alert()` calls with a single in-app non-blocking toast listing counts and first N warnings.
- Surface import stats (invalid colors, widths, missingShape, vendorNamespaces) in a collapsible panel.

### 15.5 Large Graph Benchmark Harness

- Script: generate synthetic graph (N nodes, M edges) and measure export + import timing.
- Output JSON summary (counts, durations) for regression tracking.

### 15.6 Property-Based Round-Trip Tests

- Random diagram generator (bounded sizes, random shapes, optional strokes, edge styles).
- Assert structural invariants after `fromGraphML(toGraphML(state))`.

### 15.7 Security Pre-Scan

- Pre-parse string scan rejecting files containing `<!DOCTYPE` or external entity declarations before DOMParser.

### 15.8 Bend Point Authoring (Minimal)

- Enable adding manual bend points (double-click to insert, drag to move, Delete to remove) updating `edge.data.bendPoints`.
- Restrict initial implementation to straight routing.

### 15.9 Routing Enhancements (Orthogonal MVP)

- Simple orthogonal path generator that inserts one intermediate L or Z bend avoiding direct overlap with source/target node bounding boxes.

### 15.10 Vendor Namespace Detection UI

- When vendor namespaces detected, show a subtle badge (e.g., “Vendor extensions ignored”).

### 15.11 Compression Option (Deferred Toggle)

- Optional `.graphml.zip` export using JSZip behind feature flag; import support later.

### 15.12 Documentation & Schema Sync

- Update `USER_GUIDE` and schema version notes after implementing edge selection & editing.

### 15.13 Accessibility Quick Wins

- Ensure connection handle has accessible name (aria-label) and larger hit target (invisible outline) for users with motor challenges.

### 15.14 Performance Guardrails

- Memoize path `d` generation keyed by edge points + routing to avoid unnecessary re-renders for unchanged edges.

---
Decision heuristic for selecting next task: If user feedback centers on usability -> start with 15.1; if stability/interop -> 15.4 + 15.6; if performance concerns emerge -> 15.5 + 15.14 first.

## 16. Short-Term Execution Recommendations (Actionable Sprints)

This section distills Sections 13–15 into concrete, time-boxed sprint candidates with priority labels:

- P1 = Highest leverage / unblock core UX or reliability
- P2 = Important enhancement / quality
- P3 = Opportunistic / can slip without major impact

### 16.1 Sprint Candidate A (Edge UX Foundations) – P1

Objective: Make edges first-class citizens (selectable, editable) to validate modeling beyond node-only scenarios.

Tasks:

1. Edge selection model (extend `selection[]`: adopt `edge:<id>` convention) – update keyboard nav to skip mixing semantics for now.
2. Hit area path: duplicate path with `stroke="transparent" stroke-width=12` for easier pointer capture.
3. Visual selection style: thicker stroke + glow (CSS filter or duplicated stroke).
4. Delete key handling for selected edge(s).
5. Property pane conditional mode for a single selected edge: fields `label`, `arrowTarget` (reuse existing arrow select), read-only endpoints summary.
6. Update GraphML doc & user guide describing new interaction.
7. Unit + e2e tests: create edge, select, delete, undo/redo.

Acceptance: User can create, select, label, delete edges; undo/redo works; GraphML round-trip preserves label & arrow target.

### 16.2 Sprint Candidate B (Import/Warning Quality) – P1

Objective: Improve trust in import/export by surfacing structured warnings.

Tasks:

1. Aggregate import stats into a single `ImportReport` object.
2. Toast / panel component to display summary (counts + first N messages, expandable to full list).
3. Replace `alert()` usage in GraphML import path.
4. Add pre-scan security check for `<!DOCTYPE` and abort early (log + friendly message).
5. Unit tests: pre-scan rejection, aggregated stats formatting.

Acceptance: Imports never block with modal alert; user sees concise summary; security pre-scan rejects DOCTYPE samples.

### 16.3 Sprint Candidate C (Performance & Scale Baseline) – P2

Objective: Establish performance benchmarks before complexity increases.

Tasks:

1. Synthetic generator (`scripts/genLargeGraph.ts`): parameters nodes, edges, options for shapes/styling density.
2. Benchmark harness: measure `toGraphML`, `fromGraphML`, and UI mount (optional) – log JSON results.
3. Add CI job (optional follow-up) to run reduced-size benchmark (e.g., 1k nodes) to catch regressions heuristically.
4. Document baseline numbers in `PERF_NOTES.md`.

Acceptance: Have reproducible timing data and script checked in; future PRs can compare.

### 16.4 Sprint Candidate D (Edge Styling UI Minimal) – P2

Objective: Let users adjust visual distinction between edges beyond arrowheads.

Tasks:

1. Extend edge property pane (after Candidate A) with stroke color picker & width slider.
2. Dropdown for line style (solid/dashed/dotted) writing to `edge.data.lineStyle` unless custom dash set.
3. Live preview debounced 120ms; undo groups changes (optional advanced) else single commands.
4. GraphML round-trip test ensuring styling keys persist.
5. Accessibility: contrast check fallback if chosen stroke too low against background (warn indicator).

Acceptance: User can restyle an edge and see changes persist after export/import.

### 16.5 Sprint Candidate E (Bend Points MVP) – P2

Objective: Introduce manual path shaping without full routing engine.

Tasks:

1. On edge selection with modifier (e.g., Alt+Click) insert bend point at cursor along current path.
2. Render draggable handles for bend points (hit radius > visual radius).
3. Drag updates `bendPoints` in state; snap to 90° when Shift pressed.
4. Delete bend (Backspace when handle focused or context action).
5. Export/import test with multiple bends.

Acceptance: User can insert, move, remove bends; GraphML shows `d_edgeBendPoints` JSON.

### 16.6 Sprint Candidate F (Label Placement Enhancement) – P3

Objective: Improve readability for multi-segment edges.

Tasks:

1. Compute path length & midpoint using SVG `getTotalLength()` / `getPointAtLength()` (fallback to centroid on error).
2. Cache length & midpoint per edge unless geometry changes.
3. Adjust text anchor alignment to avoid overlap with arrowhead (offset vector along tangent).
4. Test: label for polyline not at raw centroid.

Acceptance: Multi-bend labels appear centered along actual drawn line.

### 16.7 Sprint Candidate G (Security & Robustness Hardening) – P3

Objective: Defense-in-depth around input handling.

Tasks:

1. File size threshold (configurable) – warn if exceeding soft limit, abort at hard limit.
2. Character whitelist / blacklist scan (e.g., reject NUL bytes).
3. Add fuzz test harness (generate mutated GraphML snippets) verifying no crashes & bounded warnings.

Acceptance: Malicious or oversized inputs are rejected gracefully with clear messaging.

### 16.8 Priority Matrix Summary

| Candidate | Priority | Core Value | Risk Reduction | Effort (est) |
|-----------|----------|------------|----------------|--------------|
| A Edge UX | P1 | High (usability) | Medium | M |
| B Import UX | P1 | High (trust) | High | S-M |
| C Perf Baseline | P2 | Medium (future-proof) | High | S |
| D Styling UI | P2 | Medium (visual clarity) | Low | S-M |
| E Bend Points | P2 | Medium (layout control) | Medium | M |
| F Label Placement | P3 | Low-Med | Low | S |
| G Security Hardening | P3 | Medium | High | M |

Legend Effort: S (≤1 day), M (2–3 days), L (week+)

### 16.9 Recommended Order of Execution

1. A (Edge UX Foundations)
2. B (Import/Warning Quality)
3. C (Performance Baseline)
4. D (Edge Styling UI)
5. E (Bend Points MVP)
6. F (Label Placement)
7. G (Security Hardening) – can move earlier if external file ingest increases.

### 16.10 Tracking & Metrics Hooks

- Count edges created, selected, deleted (telemetry stub) to validate feature usage.
- Measure import/export timings aggregated over session (perf panel).
- Warning category counts to prioritize parser resilience work.

---
Section 16 added 2025-09-12.
