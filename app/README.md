# AI Diagram Imp (Scaffold)

Initial scaffold for the web-based diagram generator described in `ARCHITECTURE.md` and `TECH_STACK_DECISIONS.md`.

## Features (Current Scaffold)

- Vite + React + TypeScript setup
- Zustand-based command manager skeleton
- Basic component shell (Toolbar, Sidebar, DiagramCanvas)
- JSON Schema + Ajv validation helper
- JPEG export utility (SVG → Canvas → JPEG)
- Toolbar actions: New (with seed node), Import (validated), Export JSON, Export JPEG

## Getting Started

```powershell
# From repository root
cd app
npm install
npm run dev
```

Open <http://localhost:5173> (default Vite port).

## Commands

- `npm run dev` – development server with HMR
- `npm run build` – production build
- `npm run preview` – preview production build locally
- `npm run typecheck` – TypeScript type checking
- `npm run lint` – Lint source files
- `npm run test:e2e` – Run Playwright end-to-end tests (expects dev server up)
- `npm run test:e2e:ui` – Interactive Playwright UI mode

## Next Steps

- Implement node/edge rendering diff layer
- Add import/export JSON UI bindings
- Integrate plugin registry with dynamic node types
- Add undo/redo UI buttons and shortcuts
- Build validation error surfacing in Sidebar
- Add deterministic rendering & visual regression snapshots (Playwright)
- Introduce undo/redo UI controls & keyboard shortcuts

## License

(Define licensing here if needed.)
