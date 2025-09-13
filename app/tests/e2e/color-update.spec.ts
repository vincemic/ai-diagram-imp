import { test, expect } from '@playwright/test';

test.describe('Node color updates', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      // eslint-disable-next-line no-console
      console.log('[page]', msg.type(), msg.text());
    });
    await page.addInitScript(() => { localStorage.setItem('diagramimp.skipSplash', '1'); });
  await page.goto('/?t=' + Date.now());
    const addBtn = page.getByRole('button', { name: /add node/i });
    await addBtn.click();
  });

  test('background and text color change reflects on node', async ({ page }) => {
  await page.waitForFunction(() => document.querySelector('[data-layer="nodes"] g[data-node-id]'));
  const node = page.locator('[data-layer="nodes"] g[data-node-id]').first();
  await expect(node).toBeVisible();
  // Click underlying rect (label has pointer-events:none now)
  const rectLoc = node.locator('.node-rect').first();
  await rectLoc.click();
  await page.waitForSelector('aside[data-selection-count="1"]', { timeout: 8000 });
  await page.waitForSelector('[data-layer="nodes"] g[data-node-id][data-node-selected="true"]', { timeout: 8000 });
    const shell = page.getByTestId('property-pane-shell');
    await expect(shell).toHaveAttribute('data-pane-active', '1');
    const pane = page.getByTestId('property-pane');
    await expect(pane).toBeVisible();

    const bgInput = pane.locator('label:has-text("Background Color") input[type=color]');
    await bgInput.fill('#ff0000');
    const textInput = pane.locator('label:has-text("Text Color") input[type=color]');
    await textInput.fill('#00ff00');

    const rect = node.locator('.node-rect');
    await expect(rect).toHaveAttribute('fill', '#ff0000');
    const text = node.locator('text.node-label');
    await expect(text).toHaveAttribute('fill', '#00ff00');
  });
});