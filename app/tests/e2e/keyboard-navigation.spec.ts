import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Skip splash
  await page.addInitScript(() => { localStorage.setItem('diagramimp.skipSplash', '1'); });
    await page.goto('/');
  });

  test('Tab cycles selection and Delete removes node', async ({ page }) => {
  // Add three nodes and wait for them to render
  const addBtn = page.getByRole('button', { name: /add node/i });
  for (let i = 0; i < 3; i++) {
    await addBtn.click();
  }
  await page.waitForFunction(() => document.querySelectorAll('g.node').length >= 3);

    // Initial: no selection, press Tab -> first node selected
    await page.keyboard.press('Tab');
    const nodes = page.locator('g.node');
    await expect(nodes).toHaveCount(3);
    await expect(nodes.first()).toHaveClass(/selected/);

    // Tab again -> second node selected
    await page.keyboard.press('Tab');
    await expect(nodes.nth(1)).toHaveClass(/selected/);

    // Shift+Tab -> back to first
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await expect(nodes.first()).toHaveClass(/selected/);

    // ArrowRight nudge (check x increases)
    const xBefore = await nodes.first().evaluate(el => {
      const transform = el.getAttribute('transform') || ''; // translate(x,y)
      const match = /translate\(([-0-9.]+),([-0-9.]+)\)/.exec(transform);
      return match ? parseFloat(match[1]) : 0;
    });
    await page.keyboard.press('ArrowRight');
    const xAfter = await nodes.first().evaluate(el => {
      const transform = el.getAttribute('transform') || ''; // translate(x,y)
      const match = /translate\(([-0-9.]+),([-0-9.]+)\)/.exec(transform);
      return match ? parseFloat(match[1]) : 0;
    });
    expect(xAfter).toBeGreaterThan(xBefore);

    // Delete removes selected node -> selection clears
    await page.keyboard.press('Delete');
    await expect(nodes).toHaveCount(2);
  });
});