# ai-diagram-imp

<img src="./logo.png" alt="AI Diagram Imp Logo" width="140" />

Lightweight, client-only SVG diagram editor prototype (React + TypeScript + Vite) showcasing:

- Command-based state management with undo/redo (custom `CommandManager` + Zustand store)
- Rich node shape palette & live property editing (text, fill, stroke, shape)
- Edge creation via drag handle + configurable arrowheads
- GraphML (Beta) export/import with validation & warning capture
- JSON schema (AJV 2020-12) validated import/export
- PNG & JPEG raster export (SVG clone → canvas)
- Playwright E2E & Vitest unit tests (including screenshot generation)
- Updated architecture documentation with clear current vs future scope

For detailed usage see the **[User Guide](./USER_GUIDE.md)**. Architectural internals: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Quick Start

```powershell
cd app
npm install
npm run dev
```

Open <http://localhost:5173> and optionally append `?example=basic-flow` (also `architecture`, `grid`).

## Key Features (Current)

- Add/move nodes (drag) with immediate updates
- Property pane (auto-slide, focus trap) for text, colors, shape, stroke
- Shape set: rect, rounded, square, ellipse, triangle, parallelogram, trapezoid, diamond, hexagon, octagon, cylinder, star
- Edge creation by dragging connection handle between nodes
- Arrowhead selector (None, Standard, Circle, Diamond, Tee)
- Export: JSON, GraphML (Beta), PNG, JPEG
- Import: JSON (schema validated), GraphML (Beta with warnings)
- Deterministic GraphML ordering & warning statistics

## Current Limitations

- Single selection only; no multi-select / marquee / group move
- No resize handles or keyboard nudging / delete shortcut yet
- No zoom/pan; static SVG viewport
- Edge styling UI limited (line style, bends editable only by GraphML)
- Dark theme only; no theming system
- Undo stack unbounded; many entries during long drags
- No autosave or revision history (manual export/import)

See full detail and roadmap ideas in the [User Guide](./USER_GUIDE.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Known Issues

- Frequent undo entries during continuous dragging (one command per pointer move) – planned coalescing.
- GraphML import downgrades non-canonical shapes silently to `rect` after warning (no UI surfacing yet).
- No deletion UI for nodes/edges (must clear with New or future feature).
- Accessibility: limited keyboard operations; screen reader labeling minimal.
- Large diagrams may cause sluggish re-render due to full SVG tree reconciliation.

See [CHANGELOG](./CHANGELOG.md) for recent updates and pending items.

## Example Screenshots

Captured with Playwright at a 1600x900 desktop viewport using predefined example diagrams (`?example=<key>`). See `tests/e2e/screenshots.spec.ts` and `src/model/examples.ts`.

| Basic Flow | Mini Architecture | Grid Layout |
|------------|-------------------|-------------|
| ![Basic Flow](app/screenshots/basic-flow.png) | ![Mini Architecture](app/screenshots/architecture.png) | ![Grid Layout](app/screenshots/grid.png) |

### Node Variety & Property Pane

Automatically generated via `tests/e2e/readme-screenshots.spec.ts`.

| Node Shape Variety | Selected Node with Property Pane |
|--------------------|----------------------------------|
| ![Diagram showing multiple nodes with varied shapes (square, triangle, star, ellipse, rectangle) laid out on canvas](app/screenshots/readme-overview.png) | ![Selected node with properties panel open displaying editable fields including text input and shape selector](app/screenshots/readme-property-pane.png) |

### Connected Examples

These variants include edges to show link rendering.

| Basic Flow (Connected) | Architecture (Connected) |
|------------------------|--------------------------|
| ![Basic Flow connected with edges between start→process→end](app/screenshots/basic-flow-connected.png) | ![Architecture connected showing client to api/auth and api/auth to db/cache edges](app/screenshots/architecture-connected.png) |

Regenerate locally:

```powershell
cd app
npx playwright test tests/e2e/screenshots.spec.ts
```

Add new examples by editing `src/model/examples.ts` and re-running the screenshot test.

## Splash Screen

A lightweight splash screen (see `SplashScreen.tsx`) displays the project logo briefly during initial load. By default it only appears in production builds. Control it with an environment variable before `vite` or `npm run dev/build`:

```bash
# Force enable while developing
VITE_FORCE_SPLASH=1 npm run dev

# Force disable even in production build
VITE_FORCE_SPLASH=0 npm run build
```

Timing and logic are in `src/main.tsx`.

## Demo

Live site: [https://vincemic.github.io/ai-diagram-imp/](https://vincemic.github.io/ai-diagram-imp/)


## Deployment (GitHub Pages)

This repo contains a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that builds the Vite app in `app/` and publishes it to GitHub Pages.

### How it works

1. On push to `main`, the workflow installs dependencies (`npm ci`) in `app/`.
2. It sets an environment variable `VITE_BASE_PATH` used by `vite.config.ts` to set the `base` option.
3. Vite builds to `app/dist` which is uploaded as a Pages artifact.
4. A deploy job publishes that artifact to GitHub Pages.

### Configuring the base path

`vite.config.ts` reads `process.env.VITE_BASE_PATH` (defaults to `/`). For user or organization Pages of form `https://<user>.github.io/<repo>/`, set `VITE_BASE_PATH` to `/<repo>/` (trailing slash required). The workflow sets a conservative default; if your repository name differs from the owner you may adjust the expression or hardcode:

```yaml
env:
  VITE_BASE_PATH: /<repo-name>/
```

### First-time setup steps

1. In the repository Settings → Pages, set Source to "GitHub Actions".
2. Push to `main` (or trigger via Actions → Run workflow) to generate the initial deployment.
3. After deploy, the workflow output will show the published URL.

### Local preview with base path

You normally run:

```bash
cd app
npm run dev
```
 
For testing a non-root base locally:

```bash
VITE_BASE_PATH=/ai-diagram-imp/ npm run dev
```
 
Then open `http://localhost:5173/ai-diagram-imp/`.

### Troubleshooting

- Missing assets (404): Ensure `base` in `vite.config.ts` matches deployment path.
- Old cache: Invalidate with a hard refresh (Ctrl+Shift+R) or bump a query parameter.
- 404 on deep links: GitHub Pages needs a redirect fallback; consider adding a `404.html` copying `index.html` for client routing (not yet necessary if only root usage).

## Contributing / Testing

Run unit and e2e tests:

```powershell
cd app
npm run test:unit
npx playwright test
```

Please open an issue or PR for enhancements; architecture and user guide updates welcome.

## License

Released under the MIT License. See [`LICENSE`](./LICENSE) for full text.

