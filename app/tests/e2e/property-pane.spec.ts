import { test, expect } from '@playwright/test';

// Assumes example provides at least one node.
const EXAMPLE_URL = '/?example=basic-flow';

test('property pane slides in on select, updates text, and slides out on deselect', async ({ page }) => {
  page.on('console', msg => {
    // Relay page console for debugging selection issues
    // eslint-disable-next-line no-console
    console.log('[page]', msg.type(), msg.text());
  });
  await page.addInitScript(() => {
    try { localStorage.setItem('diagramimp.skipSplash', '1'); } catch {}
  });
  await page.goto(EXAMPLE_URL + `&t=${Date.now()}`);

  const sidebar = page.getByTestId('sidebar');
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toContainText('Properties');
  await expect(sidebar).toContainText('No selection');

  const shell = page.getByTestId('property-pane-shell');
  await expect(shell).toHaveAttribute('data-pane-active', '0');

  await page.waitForFunction(() => document.querySelector('[data-layer="nodes"] g[data-node-id]'));
  const nodes = page.locator('[data-layer="nodes"] g[data-node-id]');
  await expect(nodes.first()).toBeVisible();
  const firstNode = nodes.first();
  // Perform manual mouse click at the center of the node's rect to avoid text interception
  const rectLoc = firstNode.locator('.node-rect').first();
  await rectLoc.click();
  await page.waitForSelector('aside[data-selection-count="1"]', { timeout: 8000 });
  await page.waitForSelector('[data-layer="nodes"] g[data-node-id][data-node-selected="true"]', { timeout: 8000 });

  await expect(shell).toHaveAttribute('data-pane-active', '1');
  const pane = page.getByTestId('property-pane');
  // (Visibility may still be transitioning; attribute is source of truth)
  await expect(pane).toBeVisible();

  const textInput = pane.locator('label:has-text("Text")').locator('input[type="text"]');
  await textInput.fill('Updated Label');

  const nodeText = firstNode.locator('text.node-label');
  await expect(nodeText).toHaveText('Updated Label');

  const svg = page.locator('svg.diagram');
  await svg.click({ position: { x: 10, y: 10 } });
  await expect(shell).toHaveAttribute('data-pane-active', '0');
  await expect(sidebar).toContainText('No selection');
});
