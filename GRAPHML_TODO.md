# GraphML Integration Roadmap

Status: Draft (Phase 0)
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

- Implement visual edge rendering so imported edges become visible.
- Support edge labels (store in `edge.data.label`).
- Parse yFiles edge bends (future: capture as `edge.data.points` array) – currently out-of-scope.

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
