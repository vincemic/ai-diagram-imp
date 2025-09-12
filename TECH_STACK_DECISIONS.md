# Technology & Framework Decisions

Decision record for the web-based diagram generator. This complements `ARCHITECTURE.md` by selecting concrete technologies aligned with architectural goals (extensibility, performance, maintainability, low initial complexity) while documenting alternatives and future pivot options.

## 1. Evaluation Criteria

- Developer Productivity: Ecosystem maturity, DX, learning curve.
- Performance: Interactive dragging, incremental re-render performance.
- Bundle Size & Tree-Shaking: Minimizing initial load (<300KB gzipped target MVP excluding fonts/icons).
- Type Safety: Prevent runtime diagram corruption; leverage TypeScript.
- Extensibility: Plugin model feasibility (node/edge types, commands).
- Maintainability: Clear state boundaries; avoid framework lock-in.
- Accessibility Support: ARIA patterns, keyboard navigation ease.
- Community & Longevity: Long-term sustainability.
- Progressive Enhancement: Works without backend; offline-friendly.

## 2. Frontend Framework Choice

**Decision:** React + TypeScript.

**Rationale:**

- Mature ecosystem of component libs, state libs, testing tools.
- Strong TypeScript integration and editor tooling.
- Virtual DOM diffing pairs well with custom scene graph diff approach; easy to build a thin adapter.
- Rich community patterns for portals, context isolation, memoization for performance.
- Many existing diagramming / layout OSS libs expose React examples.

**How Used:**

- Component shell: panels, toolbars, dialogs, property inspector, plugin injection points.
- Diagram surface itself will NOT rely heavily on React for each node; instead a virtual scene graph (VSG) to SVG layer to reduce reconciliation overhead (React manages container + overlays; nodes rendered via direct DOM updates or a focused reconciler hook).

**Alternatives Considered:**

- Vue 3: Composition API is elegant; smaller ecosystem for specialized diagram libs; switching cost not justified.
- Svelte: Excellent performance; fewer mature libs for complex plugin extension patterns; risk of being too tightly bound to compiler semantics.
- Lit / Web Components: Good for framework neutrality; more boilerplate + less ergonomic state management; slower initial iteration velocity.

## 3. Rendering Technology

**Decision:** Primary SVG rendering with optional Canvas layer for high-density edges.

**Rationale:**

- SVG offers native accessibility hooks, CSS styling, resolution independence, simpler hit-testing (bounding boxes & path intersections) for early phases.
- Most diagrams (hundreds of nodes) perform adequately in modern browsers with efficient diffing.
- Canvas fallback or hybrid enables optimization if edge counts or effects (glows, shadows) become performance constraints.

**Implementation Notes:**

- Build a VSG structure: nodes, edges, guides, overlays → diff → patch DOM (custom thin diff, not full React reconciliation per primitive).
- For hybrid: edges rendered on a single canvas layer beneath SVG nodes to reduce DOM node count.

**Excluded (Now):** WebGL: premature complexity; only reconsider if extremely large graphs (10k+ elements) become a requirement.

## 4. State Management

**Decision:** Zustand + custom command pattern.

**Why Zustand:**

- Minimal boilerplate, simple selectors, shallow compare optimizations.
- Easy integration with undo/redo via explicit command dispatcher facade.
- No action type verbosity (contrast Redux) while still testable.

**Command Pattern Layer:**

- Commands encapsulate intent & inversion logic (undo/redo) separate from store implementation.
- Enables plugin registration of new commands without exposing internal store shape.

**Alternatives:**

- Redux Toolkit: Mature tooling & devtools; more ceremony; good if time-travel debugging becomes central.
- XState: Strong for workflow/state machines; overkill for spatial editing context; may be used later for complex async flows (e.g., collaboration sync states).

## 5. Data Validation & Schema Tooling

**Decision:** Ajv (compile-time JSON Schema validation) + Zod (runtime config & form validation).

**Rationale:**

- JSON Schema (Draft 2020-12) needed for persistence stability & version negotiation.
- Ajv offers fast compiled validators; used during import, migration, export verification.
- Zod ergonomic for UI-layer (property panel) validation & localStorage preference schemas.

**Flow:** Import JSON → Ajv structural validation → semantic checks (custom) → migration pipeline → commit to state.

## 6. Build & Toolchain

**Decision:** Vite + TypeScript + ESLint + Prettier.

**Rationale:**

- Fast HMR via ESBuild/Rollup hybrid.
- Simplifies code-splitting & asset inlining w/out heavy config.
- Future library extraction supported (can externalize core editor as its own package).

**Alternatives:**

- Webpack / Rspack: More configuration overhead; benefits not needed initially.
- Parcel: Simplicity good, but less granular control vs Vite ecosystem.

## 7. Styling & Theming

**Decision:** CSS Variables + lightweight utility classes (Tailwind optional but not mandatory initially).

**Rationale:**

- CSS variables allow dynamic theme switching (light/dark/high-contrast) & plugin-provided palettes.
- Avoid early buy-in to heavy global utility layers; can adopt Tailwind if style surface grows.

**Implementation:**

- Base design tokens: spacing scale, color roles, radii, z-index layers, shadows, typography.
- Scoped theming root `.theme-light` / `.theme-dark` toggled by preference.

## 8. Export Pipeline

**Decision:** Manual SVG → Canvas rasterization using native APIs; optional `canvas.toBlob` wrapper; avoid large dependencies.

**Optional Helpers Later:** `dom-to-image-more` or `html-to-image` if additional fidelity requirements (filters, foreignObject text) emerge.

**Exclusions:** `canvg` (only if browser incompatibility surfaces), server-side headless render (future scale phase).

## 9. Testing Stack

**Unit & Integration:** Vitest (fast, TS-native) + React Testing Library for UI.

**End-to-End:** Playwright (cross-browser, tracing, screenshot capture).

**Visual Regression:** `@playwright/test` screenshot diff or Loki (if component-level snapshots become important).

**Geometry/Engine Testing:** Deterministic fixtures for routing & layout; golden JSON snapshots of VSG output.

## 10. Layout & Geometry Libraries

**Decision:** Internal minimal geometry utilities + optional Dagre for initial auto-layout (if needed Phase 2).

**Rationale:**

- Early manual positioning; auto-layout not MVP-critical.
- Dagre lightweight for layered DAGs.
- ELK (Eclipse Layout Kernel) more powerful but heavier; adopt later if requirements justify.

## 11. Performance & Observability

**Initial:** Manual performance marks (`performance.mark/measure`) + React Profiler in dev.

**Future:** Sentry (error + performance tracing) once public beta; optional Web Vitals collection to analytics endpoint.

**Why not now:** Avoid external complexity before core stability; privacy simplicity (no network calls) in MVP.

## 12. Deployment & Hosting

**Decision:** Static hosting (GitHub Pages or Netlify) behind CDN.

**Rationale:**

- Pure client app; no server dependency.
- Easy preview environments (Netlify deploy previews / Vercel) for PR QA.

**Build Output:** Single-page app; hashed asset filenames; service worker (Phase 2) for offline caching.

## 13. Extensibility Mechanisms

**Approach:** In-process plugin registry; plugins are plain ES modules returning a manifest object.

**Loading:** Dynamic `import()` gated by allow-list; later remote plugin manifests (signed) if marketplace emerges.

**Safety:** Validate plugin manifest schema (Zod) + enforce pure functions for serialization hooks.

## 14. Alternatives & Future Pivots

| Concern | Current Choice | Possible Pivot Trigger | Alternative |
|---------|----------------|------------------------|------------|
| Rendering scale | SVG | >5k elements sluggish | WebGL (Pixi.js), Canvas full rewrite |
| State complexity | Zustand | Complex workflows | Redux Toolkit, XState hybrid |
| Auto-layout variety | Dagre (optional) | Diverse graph types | ELK, Cola.js |
| Export fidelity | Native rasterization | Font/render inconsistencies | Server Puppeteer render farm |
| Plugin isolation | ES module | Third-party untrusted plugins | iframe sandbox / WebAssembly wrappers |

## 15. Risks & Mitigations

- SVG performance ceiling: Mitigate with hybrid canvas edges + virtualization of off-screen groups.
- Plugin API drift: Versioned capability negotiation; adapter layer for older plugins.
- Schema evolution: Strict migration tests + golden sample corpus.
- Large bundle growth: Bundle analyzer gating CI; code-splitting plugin system.

## 16. Summary Snapshot

| Layer | Decision | Notes |
|-------|----------|-------|
| Framework | React + TS | UI shell + overlays |
| Rendering | SVG primary | Hybrid canvas edges later |
| State | Zustand + Commands | Undo/redo abstraction |
| Validation | Ajv + Zod | Import vs runtime prefs |
| Build | Vite | Fast HMR, future lib packaging |
| Styling | CSS Vars (+Tailwind opt) | Token-driven theming |
| Export | SVG→Canvas→JPEG | Future PNG/PDF server path |
| Tests | Vitest + Playwright | Visual diff gating |
| Layout | Manual + (Dagre opt) | Auto-layout not MVP |
| Deploy | Static CDN | No backend required |

## 17. Open Monitoring Items

- Measure interactive frame time after implementing 200 node stress test.
- Evaluate memory footprint of large undo stack (>500 operations) → possible ring buffer.
- Track font rendering consistency across browsers for export.

## Testing & Quality (Expanded)

### End-to-End & Visual Regression Testing: Playwright

- **Decision**: Adopt **Playwright** for end-to-end (E2E) browser automation, basic accessibility assertions, and (later) visual regression baselines.
- **Status**: Accepted (Foundational – to be introduced before first interactive feature set freeze).
- **Rationale**:
  - Unified cross-browser engine coverage (Chromium / Firefox / WebKit) with one API.
  - Built-in test runner removes need for Jest adaptation layer for E2E.
  - Auto-waiting + robust locator engine reduces flake versus raw Selenium/WebDriver.
  - First-class tracing (video, network, console, screenshots) accelerates triage.
  - Easy parallelization + sharding suits future CI scaling.
  - Supports emulation (viewport, color-scheme) useful for future theming tests.
  - Can integrate visual comparisons (Playwright Test + toMatchSnapshot or external diff pipeline) for diagram rendering stability.
- **Scope (Initial)**:
  - Smoke flows: load app, create node, export JSON, undo/redo, export JPEG path success.
  - Validation failure surfacing (future) – assert error panel content.
  - No immediate visual diff; add after deterministic rendering ordering is stabilized.
- **Alternatives Considered**:
  - Cypress: Strong DX but single-browser (Chromium) primary, slower cross-browser story, license nuances for some parallel features.
  - Selenium / WebDriver IO: Heavier setup, slower feedback loop, less ergonomic for modern reactive apps.
  - Puppeteer: Single-engine (Chromium) only; would need separate runner + test harness.
  - Cypress Component Testing + Vitest split: Adds conceptual complexity vs single Playwright runner for E2E.
- **Risks / Mitigations**:
  - Rendering nondeterminism (layout timing): Mitigate with explicit waits on semantic locators not timeouts.
  - Flaky snapshot diffs due to font/render variance: Defer pixel baseline until we embed a webfont + lock layout metrics.
  - Test runtime growth: Use tagging (`@smoke`, `@full`) and parallel shards.
- **Tooling Integration Plan**:
  - Add `@playwright/test` dev dependency + `npx playwright install` postinstall script.
  - Create `tests/e2e/` directory with core flows.
  - Add `npm run test:e2e` and `npm run test:e2e:ui` scripts.
  - Optional: Add GitHub Actions workflow with matrix (chromium, firefox, webkit) later.
- **Future Enhancements**:
  - Visual baseline suite (per major diagram primitive) once rendering stable.
  - Accessibility audit integration (axe-core) executed inside Playwright context.
  - Performance budget checks using `page.metrics()` + custom thresholds.
  - Screenshot diff gating on PR for core diagram rendering changes.

---
End of decision record.
