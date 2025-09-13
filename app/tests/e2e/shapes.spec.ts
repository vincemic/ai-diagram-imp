import { test, expect, Page } from '@playwright/test';

// Verifies new shape renderings: square, triangle, star, ellipse, rounded, rect fallback.

async function selectFirstNode(page: Page) {
  const node = page.locator('[data-layer="nodes"] g[data-node-id]').first();
  await page.waitForFunction(() => document.querySelector('[data-layer="nodes"] g[data-node-id]'));
  await node.locator(':scope > .node-rect, :scope rect, :scope ellipse, :scope polygon').first().click();
  await expect(node).toHaveClass(/selected/);
}

test.describe('Shapes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
    await page.goto('/');
  });

  test('can cycle through new shapes', async ({ page }) => {
    await selectFirstNode(page);
    const shapeSelect = page.getByTestId('prop-shape');

    const shapes = ['square','triangle','star','ellipse','rect'];
    for (const shape of shapes) {
      await shapeSelect.selectOption(shape);
      // Wait for DOM update
      await page.waitForTimeout(50);
      const selected = page.locator('g.node.selected .node-rect');
      await expect(selected.first()).toBeVisible();
      if (['triangle','star','ellipse','square'].includes(shape)) {
        // data-shape attribute present
        await expect(selected.first()).toHaveAttribute('data-shape', shape === 'rect' ? /.+/ : shape);
      }
    }
  });
});
