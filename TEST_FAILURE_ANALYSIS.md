# Current E2E Test Failures (Property Pane Related)

Date: 2025-09-12  
Scope: Updated after refactor to always-mounted sliding Property Pane and subsequent test adjustments.

## Summary

Three Playwright e2e specs continue to fail consistently:

- `tests/e2e/property-pane.spec.ts`
- `tests/e2e/property-pane-initial-text.spec.ts`
- `tests/e2e/color-update.spec.ts`

All failures share a common root symptom: selection of a node (and consequent pane activation) is not being observed within the test timeout window. The instrumentation global `window.__diagramSelection` never reflects a non-empty selection for these tests during execution, leading to `waitForFunction` timeouts. Earlier failures showed click interception by `<text.node-label>`; after CSS changes the failure pattern shifted purely to missing selection state updates.

## Environment / Preconditions

- Dev server (Vite) running in background via `npm run dev` task.
- Tests run with `npx playwright test` (default headless Chromium).
- Splash screen skipped via `localStorage.setItem('diagramimp.skipSplash','1')` init script.
- Diagram initialization expected to produce at least one node for `property-pane.spec.ts` (using example query) and explicitly add a node for the other two tests.

## Failing Test Details

### 1. property pane slides in on select, updates text, and slides out on deselect

File: `tests/e2e/property-pane.spec.ts`

Observed Failure:

```text
Error: page.waitForFunction: Test timeout ...
Line: await page.waitForFunction(() => (window as any).__diagramSelection && (window as any).__diagramSelection.length === 1)
```

Earlier Failure Modes:

- Click action retried because `<text.node-label>` intercepted pointer events.
- Selection class (`.selected`) never appeared.

Current Behavior After Fix Attempts:

- `.node-label { pointer-events:none }` added, clicks retarget rect.
- Still no selection state; implies either the pointer event does not bubble to the `<g>` handler or the code served to browser is stale (handler missing / changed).

Hypotheses:

- Stale bundled JS served (HMR cache) not reflecting latest `Sidebar` or `DiagramCanvas` code.
- `onPointerDown` handler suppressed due to passive event capture differences (unlikely for standard SVG `onPointerDown`).
- The node group not yet in DOM at click time (but we wait for query + visibility).
- Another overlay element absorbing the click (screenshot would help confirm; current failure screenshot shows node visible but selection stroke absent).

Impact:

- Prevents verifying pane visibility transitions, makes rest of assertions moot.

### 2. property pane shows fallback text equal to node type when text undefined

File: `tests/e2e/property-pane-initial-text.spec.ts`

Observed Failure:

Identical `waitForFunction` timeout waiting for global selection length === 1.

Context:

- Test adds a node via toolbar first.
- Waits for at least one node in DOM; then clicks rect.

Hypotheses (same set as Test 1) plus:

- Toolbar Add Node command might not flush state before click attempt. (But we wait for presence of a node.)

Impact:

- Cannot verify fallback text (expected initial value equals node type) because pane never activated.

### 3. Node color updates (background and text color change reflects on node)

File: `tests/e2e/color-update.spec.ts`

Observed Failure:

Timeout waiting for selection instrumentation after rect click.

Earlier Failure Mode:

- Attempted click produced interception warnings by label text, resolved via CSS change.

Impact:

- Blocks subsequent assertions about color attribute changes on rect and text.

## Cross-Cutting Root Cause Analysis

The unifying failure is that the expected side effect of clicking the node (`dispatch(new SetSelection([id]))` inside `DiagramCanvas.tsx`'s `onPointerDown`) does not manifest in the browser runtime used by Playwright. Given the code review:

```tsx
<g
  /* ...props omitted ... */
  onPointerDown={(e) => { dispatch(new SetSelection([n.id])); handlePointerDown(e, n.id, n.x, n.y); }}
  className={isSelected(n.id) ? 'node selected' : 'node'}
>
```

If this handler executed successfully, selection array should update, triggering instrumentation effect that mutates `window.__diagramSelection` in `Sidebar.tsx` via `useEffect`.

Possible Explanations Ranked:

1. **Stale Dev Server Bundle**: Playwright connects to dev server returning older JS (pre-instrumentation). Evidence: earlier test logs referenced selectors removed from updated tests; persistent failure after code modifications suggests caching.
2. **Race Condition / Immediate Blur**: Selection set, then immediately cleared (e.g., background handler firing). Unlikely: background deselect logic is on a separate `<g data-layer="edges">` with its own `onPointerDown`; unless click passes through transparent rect after bubbling order.
3. **Event Not Firing on SVG Group in Headless Chromium**: Pointer events might require `pointerdown` simulation differences; however standard click should translate to pointer events.
4. **Global Instrumentation Not Updating**: `useEffect` maybe not firing if `Sidebar` not re-rendering due to store subscription mismatch; but selection also fails via class expectation earlier.
5. **Z-Index / Overlay Interference**: Not indicated by CSS—no positioned overlay above diagram except potential splash (skipped).

## Diagnostic Gaps / Next Steps (Not Yet Implemented)

- Add console logging inside `onPointerDown` for nodes (e.g., `console.debug('pointerDown node', id)`).
- Add console logging inside `SetSelection` command execution path.
- Capture `window.__diagramSelection` progression via `page.waitForSelector('[data-selection-count="1"]')` on sidebar instead of global.
- Force full page reload disabling service worker / cache: add query param timestamp when visiting page: `page.goto('/?t=' + Date.now())`.
- Run tests against production build (`vite build` + `vite preview`) to eliminate HMR caching variable.
- Temporarily replace selection wait with manual dispatch via `page.evaluate(() => window.storeDebugSelectFirst())` after exposing a debug helper.

## Proposed Remedies

| Issue | Remedy | Rationale |
|-------|--------|-----------|
| Potential stale bundle | Append cache-busting query param in tests | Ensures fresh load bypassing dev cache |
| Selection not registering | Wait on sidebar attr: `data-selection-count="1"` | DOM attribute reflects store change |
| Need signal of handler firing | Insert console log in `DiagramCanvas` handler | Confirms event pipeline execution |
| Race with background deselect | Disable background handler via flag during test | Isolates interference cause |
| Headless pointer nuance | `dispatchEvent('pointerdown')` + `pointerup` manually | Bypasses click heuristics |

## Immediate Action Plan (Pending Approval)

1. Add temporary logs to `DiagramCanvas` and `Sidebar` instrumentation.
2. Adjust tests to wait on `data-selection-count="1"` instead of global function.
3. Use cache-busting query parameter for all three failing specs.
4. Re-run only these specs in headed mode for visual verification.
5. If still failing, build & run `vite preview` and execute tests against that static server.

## Appendix: Current Relevant Code Snippets

`Sidebar.tsx` instrumentation:

```tsx
<aside ... data-selection-count={state.selection.length}>
  {/* ... */}
</aside>
```

`DiagramCanvas.tsx` node group pointer handler:

```tsx
onPointerDown={(e) => { dispatch(new SetSelection([n.id])); handlePointerDown(e, n.id, n.x, n.y); }}
```

---

Document prepared to clarify present failure state and outline remediation path.

## Resolution Update (Post Fix)

Date: 2025-09-12

Applied changes to resolve selection-related timeouts in three failing specs:

1. Added deterministic test hooks.
  - `data-selection-count` already on sidebar used as primary wait condition.
  - Added `data-node-selected="true"` on selected node `<g>` elements.
2. Replaced brittle global `window.__diagramSelection` polling with DOM attribute waits.
3. Added cache-busting query parameter to e2e navigation (`?t=TIMESTAMP`) to avoid stale dev server bundles.
4. Added temporary debug logs in node pointer handler (guarded by `import.meta.env.DEV`) to confirm dispatch sequence.
5. Fixed React hook order warning in `PropertyPane` by removing conditional early return that changed hook ordering between renders; now the component always mounts and conditionally renders internals.
6. Introduced stable `data-testid` hooks for property pane inputs: `prop-text`, `prop-text-color`, `prop-bg-color`, `prop-shape`.
7. Updated tests.
  - `property-pane.spec.ts`, `color-update.spec.ts`, `property-pane-initial-text.spec.ts` now wait for `aside[data-selection-count="1"]` and selected node attribute.
  - Initial text test asserts fallback equals node type (`start`).

Result: All three previously failing specs pass in headed mode. (See run logs in timeline.)

Pending Cleanup / Follow-up:

- Remove or further gate debug console logs once CI stability confirmed.
- Optional: Replace ad-hoc cache busting with a Playwright config fixture that appends timestamp automatically.
- Consider adding a small helper in tests: `await waitForSelection(page, 1)` to DRY selection waits.

No further action required for current failure set; keeping this section for historical context.
