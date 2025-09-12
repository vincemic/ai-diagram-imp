import { test, expect } from '@playwright/test';

function parseTransform(transform: string | null): { x: number; y: number } | null {
  if (!transform) return null;
  const match = /translate\(([-0-9.]+),([-0-9.]+)\)/.exec(transform);
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

test.describe('Drag Move', () => {
  test('dragging a node updates its position', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Add Node' }).click();
    const node = page.locator('svg.diagram g[data-layer="nodes"] > g').first();
    await expect(node).toBeVisible();
    const startTransform = await node.getAttribute('transform');
    const start = parseTransform(startTransform);
    expect(start).not.toBeNull();
    // Drag by 150, 120
    const box = await node.boundingBox();
    if (!box) throw new Error('No bounding box for node');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2 + 120, { steps: 10 });
    await page.mouse.up();
    // Wait a moment for state updates
    await page.waitForTimeout(50);
    const endTransform = await node.getAttribute('transform');
    const end = parseTransform(endTransform);
    expect(end).not.toBeNull();
    if (start && end) {
      expect(Math.round(end.x)).toBeGreaterThan(Math.round(start.x));
      expect(Math.round(end.y)).toBeGreaterThan(Math.round(start.y));
    }
  });
});
