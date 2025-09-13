# AI Diagram Imp – End User Guide

> Version: 1.0 (matches schemaVersion 1.0.0)

## 1. What Is This?

AI Diagram Imp is a lightweight, early-stage web application for experimenting with diagram creation. It demonstrates a command-based state manager, schema validation, export features, automated screenshots, and testing scaffolding.

Current focus: simple rectangular nodes rendered on an SVG canvas. (Edges are part of the schema but not yet visually rendered.)

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
| Toolbar (top) | Buttons for New, Import, Add Node, Export JSON, Export JPEG, Undo, Redo. |
| Sidebar (left) | Properties panel (auto shows details for selected node, otherwise "No selection"). |
| Canvas (center) | Large scrollable area containing the diagram SVG and nodes. |
| Splash Screen | (Production or forced) Brief logo screen at launch, fades out automatically. |

## 4. Creating & Editing Diagrams

Current interactions:

- Click **Add Node** to append a new node at a default position (x=100, y=80) labelled with its `type` (default "start").
- **Select a node** by clicking it; selection highlight appears (accent stroke). Click empty canvas to clear selection and hide the property pane.
- **Edit properties**: With a node selected, the sidebar shows a pane where you can modify:
  - Text label (stored in `node.data.text`; falls back to `type` if empty)
  - Shape (rectangle, rounded, ellipse)
  - Text color / background color
    - Defaults for newly added nodes: text color `#000000` (black), background color `#ADD8E6` (light blue)
- Drag a node: press and hold on the node shape, move the pointer, release to set its new position. The diagram state updates live and any subsequent JSON export includes the new `x`/`y` and any updated `data` fields.
- Use **New** to reset to a blank diagram (title set to "Untitled Diagram").

## 5. Importing JSON

1. Click **Import**.
2. Select a `.json` file matching the diagram schema (see Section 10).
3. On success, the diagram state replaces the current one. On failure, an alert appears and validation errors are logged to the browser console.

## 6. Exporting

### 6.1 Export JSON

- Click **Export JSON** to download the current state as `<title>.json`.

### 6.2 Export JPEG

- Click **Export JPEG** to rasterize the current visible SVG region into a JPEG file. A white background is added automatically; device pixel ratio is respected for higher DPI.
- File name defaults to `<title>.jpg`.

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

### Edge Object (Not yet rendered visually)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique identifier |
| `type` | string | Reserved for future styling/semantics |
| `source.nodeId` | string | Source node id |
| `target.nodeId` | string | Target node id |

### Validation

Validation uses AJV (JSON Schema 2020-12). Invalid imports show an alert and log errors to the console.

## 11. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + Z | Undo |
| Ctrl + Y or Ctrl/Cmd + Shift + Z | Redo |
| Tab / Shift + Tab | Cycle forward / backward through nodes (select) |
| Arrow Keys | Nudge selected node (10px) |
| Ctrl/Cmd + Arrow Keys | Fine nudge selected node (1px) |
| Delete / Backspace | Delete selected node |
| Esc | Clear selection |
| Enter / F2 | Focus text field in property pane for quick edit |

## 12. Known Limitations

- Single selection only (no multi-select / marquee yet).
- No node resizing or edge rendering yet.
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
