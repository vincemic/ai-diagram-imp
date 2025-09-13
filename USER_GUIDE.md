# AI Diagram Imp – End User Guide

> Version: 1.0 (matches schemaVersion 1.0.0)

## 1. What Is This?

AI Diagram Imp is a lightweight, early-stage web application for experimenting with diagram creation. It demonstrates a command-based state manager, schema validation, export features, automated screenshots, and testing scaffolding.

Current focus: nodes and basic directed edges rendered on an SVG canvas. You can draw connections between nodes, choose a target arrowhead style, and export/import them via GraphML or JSON. Supported shapes: rectangle, rounded rectangle, square, ellipse/circle, triangle, parallelogram, trapezoid, diamond, hexagon, octagon, cylinder (pseudo), star.

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
| Toolbar (top) | Left hamburger menu (New, Import, Add Node, Export JSON/PNG/JPEG) plus inline Undo / Redo buttons and app title. |
| Sidebar (left) | Sliding Properties panel (overlays diagram when open; when no node is selected it is fully hidden and the canvas uses the full width). |
| Canvas (center) | Large scrollable area containing the diagram SVG and nodes. |
| Splash Screen | (Production or forced) Brief logo screen at launch, fades out automatically. |

## 4. Creating & Editing Diagrams

Current interactions:

- Open the hamburger menu (top-left ☰) then click **Add Node** to append a new node at a default position (x=100, y=80) labelled with its `type` (default "start").
- **Select a node** by clicking it; selection highlight appears (accent stroke). Click empty canvas to clear selection and hide the property pane.
- **Edit properties**: With a node selected, the sidebar shows a pane where you can modify:
  - Text label (stored in `node.data.text`; falls back to `type` if empty)
  - Shape (rectangle, rounded, ellipse)
  - Text color / background color
    - Defaults for newly added nodes: text color `#000000` (black), background color `#ADD8E6` (light blue)
- Drag a node: press and hold on the node shape, move the pointer, release to set its new position. The diagram state updates live and any subsequent JSON export includes the new `x`/`y` and any updated `data` fields.
- Create an edge: press on the small circular connection handle (right side of a node) and drag to another node. Release over a *different* node to create a directed edge. A dashed temporary guide line appears while dragging.
- Target arrowhead: use the Arrow selector in the toolbar to change the default arrowhead style (None, Standard, Circle, Diamond, Tee) for newly created edges.
- Use **New** (inside the hamburger menu) to reset to a blank diagram (title set to "Untitled Diagram").

## 5. Importing JSON

1. Open the hamburger menu and click **Import**.
2. Select a `.json` file matching the diagram schema (see Section 10).
3. On success, the diagram state replaces the current one. On failure, an alert appears and validation errors are logged to the browser console.

## 6. Exporting

### 6.1 Export JSON

- Open the hamburger menu and click **Export JSON** to download the current state as `<title>.json`.

### 6.2 Export JPEG

- Open the hamburger menu and click **Export JPEG** to rasterize the current visible SVG region into a JPEG file. A white background is added automatically; device pixel ratio is respected for higher DPI.
- File name defaults to `<title>.jpg`.

### 6.3 GraphML (Beta)

Two actions are available in the hamburger menu (labeled *Beta*):

- **Export GraphML (Beta)**: Downloads a `.graphml` file representing the current diagram (nodes, edges, geometry, basic colors, stroke + shape metadata, plus extra node data as JSON). Selection state and undo history are excluded.
- **Import GraphML (Beta)**: Loads a `.graphml` file produced by this app (or a compatible external tool) and replaces the current diagram.

Recent Phase 3 additions:

- Canonical shape persistence (rect, diamond, ellipse, circle, hexagon; others downgrade to `rect`).
- Optional node `strokeColor` & `strokeWidth` round-trip with validation.
- Export option (developer flag) `omitDefaultShape` to suppress `shape=rect` entries for leaner files. When omitted, importer warns and defaults to `rect`.
- Basic color validation for strokeColor (simple hex or name). Invalid colors are ignored with warnings.
- Warning statistics (not surfaced in UI yet) track counts for invalid stroke colors, widths, missing shapes, unknown node keys, vendor namespaces.

Limitations (Beta):

- Directed edges only.
- Grouping / nested graphs unsupported and skipped.
- Vendor (yFiles/yWorks) extensions detected but ignored (future roadmap); any `<y:*>` blocks are not parsed.
- Non-canonical shapes (e.g. triangle, star) currently exported as provided but *if imported* and not in canonical set they downgrade to `rect` with a warning.
  Basic edge styling fields (strokeColor, strokeWidth, lineStyle, dashPattern, arrowSource, arrowTarget, label, routing, bendPoints) round-trip in GraphML. UI currently exposes only target arrowhead (others use defaults).

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

`schemaVersion`: must be `"1.0.0"`

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

Validation uses AJV (JSON Schema 2020-12). Invalid imports show an alert and log errors to the console.

## 11. Keyboard Shortcuts & Focus Behavior

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + Z | Undo |
| Ctrl + Y or Ctrl/Cmd + Shift + Z | Redo |
| Tab / Shift + Tab | Cycle forward / backward through nodes (selection changes) when focus is NOT inside the property pane form |
| Arrow Keys | Nudge selected node (10px) |
| Ctrl/Cmd + Arrow Keys | Fine nudge selected node (1px) |
| Delete / Backspace | Delete selected node |
| Esc | Clear selection (also closes sliding panel) |
| Enter / F2 | Focus text field in property pane for quick edit |

### Focus Trap

When the properties panel is open and focus is inside it, `Tab` / `Shift+Tab` cycles only through the interactive fields within the panel (focus trap). Press `Esc` to exit (deselect) and return to canvas/node navigation; subsequent `Tab` resumes global node cycling.

## 12. Known Limitations

- Single selection only (no multi-select / marquee yet).
- No node resizing yet; limited live edge styling controls (only arrowhead target picker).
- No persistence beyond manual export/import (in‑memory only).
- Single theme; dark only.
- Limited accessibility review (improvements planned for keyboard nav & ARIA labelling of nodes and property form).

## 13. Roadmap Ideas (Non-binding)

- Multi-select & selection rectangle.
- Edge creation and routing with arrows.
- Zoom & pan controls.
- Multiple themes & light mode.
- Autosave to localStorage with revision history.
- Node type palette & inline editing of labels.
- Export to SVG/PNG directly (in addition to JPEG).

## 14. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Import alert: Invalid diagram JSON | Schema mismatch; open DevTools Console to view AJV errors. |
| Export JPEG blank/partial | Ensure nodes visible; re-run after a short delay if fonts loading. |
| Undo not undoing expected step | Only mutating commands create history; repeated Add Node is reversible step-by-step. |
| Example URL shows empty canvas | Misspelled example key; valid keys: `basic-flow`, `architecture`, `grid`. |

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
