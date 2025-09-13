# AI Diagram Imp – End User Guide

> Guide Version: 1.1 (matches current `schemaVersion` = **1.1.0** in code)

## 1. What Is This?

AI Diagram Imp is a lightweight, early-stage, client-only web application for experimenting with simple node/edge diagrams. It demonstrates:

- Command-based state manager with undo/redo (Zustand + custom `CommandManager`).
- SVG rendering of nodes & edges (no canvas/zoom yet).
- Rich shape palette for nodes.
- GraphML (Beta) export/import with warning aggregation.
- JSON export/import (schema validated with AJV Draft 2020-12).
- Raster export (PNG + JPEG) via SVG→Canvas pipeline.
- Automated screenshot generation (Playwright) & unit/e2e tests.

Current focus: positioning, styling (fill / text / stroke), simple edge routing variants (straight default; orthogonal + spline when encoded via data), and basic arrowhead selection.

Supported node shapes (property pane): rectangle, rounded rectangle, square, ellipse/circle, triangle, parallelogram, trapezoid, diamond, hexagon, octagon, cylinder, star.

## 2. Quick Start

### Hosted Demo

Open the live site: <https://vincemic.github.io/ai-diagram-imp/>

### Local Run

```powershell
cd app
npm install
npm run dev
```

Then open <http://localhost:5173/> in a browser.

### Load an Example Diagram

Append `?example=basic-flow` (or `architecture`, `grid`) to the URL, e.g.:

```text
http://localhost:5173/?example=architecture
```

This replaces the in‑memory diagram state; it does not overwrite files.

## 3. Interface Overview

| Area | Description |
|------|-------------|
| Toolbar (top) | Hamburger menu (New, Import, Export JSON, Export/Import GraphML Beta, Export PNG, Export JPEG) plus inline New Node, Undo, Redo, and Arrow selector. |
| Sidebar (left) | Sliding Properties panel (overlays diagram when open; when no node is selected it is fully hidden and the canvas uses the full width). |
| Canvas (center) | Large scrollable area containing the diagram SVG and nodes. |
| Splash Screen | (Production or forced) Brief logo screen at launch, fades out automatically. |

## 4. Creating & Editing Diagrams

Current interactions:

- Open the hamburger menu (☰) then click **New Node** (or the inline button) to append a new node at default position (x=100, y=80) with `type` = "start" (text defaults to that type until changed).
- **Select a node** by clicking it; highlight appears. Click empty canvas to clear selection and hide the property pane.
- **Edit properties** (Property Pane auto-slides in on selection):
  - Text label (stored in `data.text`; falls back to node `type` if empty)
  - Shape (full palette listed above)
  - Text color, background color, stroke color, stroke width (positive numbers only; blank reverts to auto stroke)
  - (Node `type` currently not editable from pane—text label recommended for display)
  Defaults for new nodes: text `type`, textColor `#000000`, backgroundColor `#ADD8E6`.
- Drag a node: press and hold on the node shape, move the pointer, release to set its new position. The diagram state updates live and any subsequent JSON export includes the new `x`/`y` and any updated `data` fields.
- Create an edge: press the small circular connection handle (on right side of a node) and drag to a *different* node. Release to create an edge. Temporary dashed guide shows during drag.
- Target arrowhead: use the toolbar selector (None, Standard, Circle, Diamond, Tee) to set default arrowhead for new edges (stored in each new edge's `data.arrowTarget`).
- Use **New** to reset to a blank diagram (title resets to "Untitled Diagram").

## 5. Importing JSON

1. Open the hamburger menu and click **Import**.
2. Select a `.json` file matching the diagram schema (see Section 10). Only `.json` accepted (drag/drop not yet implemented).
3. On success, the diagram state replaces the current one. On failure, an alert appears and validation errors are logged to the browser console.

## 6. Exporting

### 6.1 Export JSON

- Open the hamburger menu and click **Export JSON** to download the current state as `<title>.json`.

### 6.2 Export PNG

- Hamburger menu → **Export PNG**. Rasterizes SVG with alpha retained (if background transparent) using device pixel ratio scaling.
- File name: `<title>.png`.

### 6.3 Export JPEG

- Open the hamburger menu and click **Export JPEG** to rasterize the current visible SVG region into a JPEG file. A white background is added automatically; device pixel ratio is respected for higher DPI.
- File name defaults to `<title>.jpg`.

### 6.4 GraphML (Beta)

Two actions are available in the hamburger menu (labeled *Beta*):

- **Export GraphML (Beta)**: Downloads a `.graphml` file representing the current diagram (nodes, edges, geometry, basic colors, stroke + shape metadata, plus extra node data as JSON). Selection state and undo history are excluded.
- **Import GraphML (Beta)**: Loads a `.graphml` file produced by this app (or a compatible external tool) and replaces the current diagram.

Current Beta feature set:

- Canonical shape persistence (subset used in GraphML: rect, diamond, ellipse, circle, hexagon). Non-canonical shapes (triangle, star, etc.) downgraded to `rect` on import with warning.
- Optional node `strokeColor` & `strokeWidth` round-trip (positive numeric width only).
- Developer flag `omitDefaultShape` (internal) can skip `shape=rect` to reduce size.
- Basic color validation for strokeColor (hex or simple name). Invalid -> ignored + warning.
- Warning stats collected: invalidStrokeColors, invalidStrokeWidths, missingShape, unknownNodeKeys, vendorNamespaces.

Limitations (GraphML Beta):

- Directed edges only (no undirected flag).
- No grouping / nested graphs.
- Vendor (yFiles/yWorks) namespaces detected → recorded only.
  Basic edge styling fields (strokeColor, strokeWidth, lineStyle, dashPattern, arrowSource, arrowTarget, label, routing, bendPoints) round-trip. UI currently exposes only arrowTarget; others may be present if GraphML edited externally.

Exported Node Keys (subset):

- Geometry: x, y, w, h
- Type: type
- Colors: backgroundColor, textColor
- Shape: shape (unless omitted via `omitDefaultShape` and equal to `rect`)
- Stroke: strokeColor, strokeWidth (> 0 only)
- Extra data: remaining custom fields serialized once under the `data` key.

Developer Option (omit default shape):

- Used by passing `{ omitDefaultShape: true }` to the internal `toGraphML` API. UI export currently always includes shape for clarity.

Sample file: `examples/graphml/simple.graphml`.

If import shows "Imported with warnings", open DevTools Console to inspect ignored or downgraded items (messages list unknown keys, invalid colors, etc.).

## 7. Undo / Redo

- Each mutating command (Add Node, New diagram, Import) pushes history.
- Use **Undo** / **Redo** buttons or keyboard shortcuts:
  - Windows/Linux: `Ctrl+Z` (undo), `Ctrl+Shift+Z` or `Ctrl+Y` (redo)
  - macOS: `Cmd+Z` (undo), `Cmd+Shift+Z` (redo)

## 8. Preferences

Stored in `localStorage` under key `ai-diagram-imp:preferences:v1`.

| Field | Meaning | Default |
|-------|---------|---------|
| `theme` | UI theme (currently only `"dark"`) | `dark` |
| `lastOpenedTitle` | Last diagram title opened/imported | unset |

## 9. Example Screenshots

See README section "Example Screenshots" for gallery generated via Playwright. Regenerate locally:

```powershell
cd app
npx playwright test tests/e2e/screenshots.spec.ts
```

## 10. Diagram JSON Schema (Summary)

`schemaVersion`: must be `"1.1.0"`

### Required Top-Level Fields

- `schemaVersion` (string)
- `nodes` (array)
- `edges` (array)

### Optional

- `metadata.title` (string, required if `metadata` present)
- `selection` (array of node IDs)

### Node Object

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique identifier |
| `type` | string | Interpreted as label in prototype |
| `x` | number | Position left |
| `y` | number | Position top |
| `w` | number | Width (>=1) |
| `h` | number | Height (>=1) |
| `data` | object | Arbitrary key/value (optional) |

### Edge Object

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique identifier |
| `type` | string | Reserved for future styling/semantics (currently "default") |
| `source.nodeId` | string | Source node id |
| `target.nodeId` | string | Target node id |

### Validation

Validation uses AJV (Draft 2020-12). Invalid imports show an alert and log errors to the console.

## 11. Keyboard Shortcuts & Focus Behavior

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + Z | Undo |
| Ctrl + Y or Ctrl/Cmd + Shift + Z | Redo |
| Tab / Shift + Tab | Cycle forward / backward through nodes (selection changes) when focus is NOT inside the property pane form |
| Esc | Clear selection / close property pane |
| Tab / Shift + Tab | Cycle focus (canvas nodes OR trapped inside property pane) |
| Enter | Focus text field in property pane when a node is selected (browser focus heuristics) |

Not implemented yet: keyboard node nudging, delete key removal of nodes (must be done via future UI or code), multi-select traversal.

### Focus Trap

When the properties panel is open and focus is inside it, `Tab` / `Shift+Tab` cycles only through the interactive fields within the panel (focus trap). Press `Esc` to exit (deselect) and return to canvas/node navigation; subsequent `Tab` resumes global node cycling.

## 12. Known Limitations

- Single selection only (no multi-select / marquee / group move).
- No node resizing; size fixed at creation (shape changes do not auto-resize).
- Edge styling controls limited to arrow target; other style fields only via GraphML editing.
- No persistence beyond manual export/import; no autosave or revision history.
- Single theme (dark) enforced; no light mode switch.
- Limited accessibility review; ARIA roles basic, keyboard movement of nodes absent.
- No zoom/pan or viewport controls.
- Undo stack unbounded (session memory only) and can fill with many `MoveNode` entries during drags.

## 13. Roadmap Ideas (Indicative / Non-binding)

- Multi-select & selection rectangle; command coalescing for drags.
- Keyboard nudging and delete action.
- Zoom & pan + minimap.
- Schema migration pipeline & validation toggle in dev mode.
- Autosave (localStorage) & lightweight history snapshots.
- Extended edge styling UI (line style, dashed patterns, bend editing).
- Direct SVG export (trivial addition) & PDF.
- Plugin expansion: node/edge type metadata & behaviors.
- Performance: node-level memoization, drag throttling.

## 14. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Import alert: Invalid diagram JSON | Schema mismatch; open DevTools Console to view AJV errors. |
| Export JPEG blank/partial | Ensure nodes visible; re-run after a short delay if fonts loading. |
| Undo not undoing expected step | Only mutating commands create history; repeated Add Node is reversible step-by-step. |
| Example URL shows empty canvas | Misspelled example key (`basic-flow`, `architecture`, `grid`). |

## 15. Testing & Automation (FYI)

For contributors; end users need not run tests.

```powershell
# Unit + e2e
cd app
npm run test:unit
npx playwright test
```

Screenshot regeneration described in Section 9.

## 16. License / Usage

This project is released under the MIT License. You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software subject to inclusion of the copyright notice and permission notice. See the full text in the root [`LICENSE`](./LICENSE).

---

Questions or suggestions? Open an issue or PR in the repository.
