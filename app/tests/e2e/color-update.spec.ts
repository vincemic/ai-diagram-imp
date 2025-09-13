import { test, expect } from '@playwright/test';

test.describe('Node color updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('diagramimp.skipSplash', 'true'); });
    await page.goto('/');
    const addBtn = page.getByRole('button', { name: /add node/i });
    await addBtn.click();
  });

  test('background and text color change reflects on node', async ({ page }) => {
    const node = page.locator('[data-layer="nodes"] g[data-node-id]').first();
    await node.click();
    const pane = page.getByTestId('property-pane');
    await expect(pane).toBeVisible();

    // Change background color
    const bgInput = pane.locator('label:has-text("Background Color") input[type=color]');
    await bgInput.fill('#ff0000');
    // Change text color
    const textInput = pane.locator('label:has-text("Text Color") input[type=color]');
    await textInput.fill('#00ff00');

    // Validate fills via attributes
    const rect = node.locator('.node-rect');
    await expect(rect).toHaveAttribute('fill', '#ff0000');
    const text = node.locator('text.node-label');
    await expect(text).toHaveAttribute('fill', '#00ff00');
  });
});