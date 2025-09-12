# Project TODOs

This document reflects the current engineering task list (mirrors the in-session task tracker).

## Completed

- [x] Review e2e smoke test
- [x] Inspect key UI components for selector strategy
- [x] Add test IDs (toolbar, sidebar, canvas)
- [x] Add Playwright config
- [x] Implement additional e2e tests (ui-elements, diagram-interaction, app-startup)
- [x] Run e2e tests (Chromium: 7/7 passing)
- [x] Add diagnostic debug test (console + HTML snippet)
- [x] Inspect package.json dependencies (React versions, Ajv + formats)
- [x] Capture transformed main.tsx (served via Vite)
- [x] Analyze diagnostic output (Ajv 2020-12 schema fix)
- [x] Implement node drag-and-drop with persisted x/y
- [x] Add unit + e2e tests for MoveNode / drag

## Pending / Planned

- [ ] Enable multi-browser tests (Firefox & WebKit) — update `playwright.config.ts`, run `npx playwright install`
- [ ] Test JSON import/export (round‑trip: add node -> export -> reset -> import -> assert state)
- [ ] Test JPEG export (mock download link or intercept blob URL generation)
- [ ] Fix tsconfig types location (move root-level `types` into `compilerOptions.types`)
- [ ] Add CI coverage thresholds (Vitest + Playwright; configure coverage collection)
- [ ] Document undo/redo semantics (README: no auto-node on New; explicit Add Node)
- [ ] Add accessibility test (axe scan, role checks, basic keyboard nav)
- [ ] Add selection highlight & multi-select (foundation for group moves)
- [ ] Throttle drag updates (reduce command spam, maybe schedule with requestAnimationFrame)
- [ ] Introduce pan/zoom (SVG viewBox or transform wrapper) and adjust drag math
- [ ] Edge rendering prototype (straight lines between node centers)
- [ ] Persist last diagram auto-save to localStorage (opt-in toggle)

## Notes

- Undo/Redo now routed through store to ensure React re-render.
- Ajv upgraded to 2020 draft (`Ajv2020`) with `ajv-formats` to satisfy schema meta reference.
- Interaction tests rely on `Add Node` button—keep label stable for selectors.

## Suggestions (Future Nice-to-Haves)

- [ ] Visual regression baseline (Playwright trace + screenshot comparisons)
- [ ] Edge case validation tests for invalid JSON import handling
- [ ] Performance budget smoke (first paint < threshold) using tracing API
- [ ] SVG export (vector) alongside existing JPEG
- [ ] Keyboard nudging of selected nodes (arrow keys)
- [ ] Plugin points for custom node renderers

---
Update this file when tasks are completed or new ones are added.
