import { test, expect, Page } from '@playwright/test';

/**
 * Generates screenshots for README documentation:
 * 1. readme-overview.png - variety of node shapes laid out
 * 2. readme-property-pane.png - node selected with property pane open
 *
 * Run via: npx playwright test tests/e2e/readme-screenshots.spec.ts
 */

async function gotoBase(page: Page, query: string = '') {
  await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
  await page.setViewportSize({ width: 1600, height: 900 });
  // Accept query beginning with '/' or without.
  const url = query.startsWith('/') ? query : '/' + query;
  await page.goto(url);
}

async function selectFirstNode(page: Page) {
  await page.waitForFunction(() => document.querySelector('[data-layer="nodes"] g[data-node-id]'));
  const node = page.locator('[data-layer="nodes"] g[data-node-id]').first();
  // Click the rect (or shape) directly
  await node.locator(':scope > .node-rect, :scope rect, :scope ellipse, :scope polygon').first().click();
  await expect(node).toHaveAttribute('data-node-selected', 'true');
}

// Helper to change shape of currently selected node
async function setShape(page: Page, shape: string) {
  const shapeSelect = page.getByTestId('prop-shape');
  await shapeSelect.selectOption(shape);
  await page.waitForTimeout(40); // allow DOM update
}

// Capture screenshot utility with small delay for transitions
async function capture(page: Page, path: string) {
  await page.waitForTimeout(120); // settle animations (e.g., property pane slide-in)
  await page.screenshot({ path: `screenshots/${path}`, fullPage: false });
  console.log('[screenshot]', path);
}

// We'll start from an example with at least one node
const EXAMPLE = '/?example=basic-flow';

// Layout helper: move selected node by applying arrow key moves or drag
async function nudge(page: Page, dx: number, dy: number) {
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const xStep = dx === 0 ? 0 : dx / steps;
  const yStep = dy === 0 ? 0 : dy / steps;
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press(xStep > 0 ? 'ArrowRight' : xStep < 0 ? 'ArrowLeft' : '');
    await page.keyboard.press(yStep > 0 ? 'ArrowDown' : yStep < 0 ? 'ArrowUp' : '');
  }
}

// Desired shape assignments for first several nodes present in example
const SHAPE_SEQUENCE = ['square','triangle','star','ellipse','rect','hexagon','octagon','cylinder'];

async function ensureVariety(page: Page) {
  const nodeSel = '[data-layer="nodes"] g[data-node-id]';
  await page.waitForFunction(sel => document.querySelectorAll(sel).length > 0, nodeSel);
  const count = await page.locator(nodeSel).count();
  const applyCount = Math.min(count, SHAPE_SEQUENCE.length);
  for (let i = 0; i < applyCount; i++) {
    const node = page.locator(nodeSel).nth(i);
    await node.locator(':scope > .node-rect, :scope rect, :scope ellipse, :scope polygon').first().click();
    await setShape(page, SHAPE_SEQUENCE[i]);
    // Slight nudge to avoid total overlap of labels if layout tight
    await nudge(page, 2 * i, i); // small offset
  }
}

test.describe('README screenshots', () => {
  test('generate overview and property pane screenshots', async ({ page }) => {
    await gotoBase(page, EXAMPLE);

    // Overview: variety of shapes visible, no property pane (deselect if needed)
    await ensureVariety(page);
    // Deselect to hide property pane
    const svg = page.locator('svg.diagram');
    await svg.click({ position: { x: 10, y: 10 } });
    await capture(page, 'readme-overview.png');

    // Property pane: reselect a node and show pane with selection highlight
    await selectFirstNode(page);
    // Ensure property pane open by focusing on a known input
    const textInput = page.getByTestId('property-pane').locator('input[type="text"]').first();
    await expect(textInput).toBeVisible();
    await capture(page, 'readme-property-pane.png');
  });
});
