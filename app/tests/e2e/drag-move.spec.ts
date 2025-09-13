import { test, expect } from '@playwright/test';

function parseTransform(transform: string | null): { x: number; y: number } | null {
  if (!transform) return null;
  const match = /translate\(([-0-9.]+),([-0-9.]+)\)/.exec(transform);
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

test.describe('Drag Move', () => {
  test('dragging a node updates its position', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
  await page.goto('/');
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByRole('button', { name: 'Add Node' }).click();
    const node = page.locator('svg.diagram g[data-layer="nodes"] > g').first();
    await page.waitForFunction(() => document.querySelector('svg.diagram g[data-layer="nodes"] > g'));
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
    // Poll for transform change via evaluate loop
    let endVal: { x: number; y: number } | null = null;
    for (let i = 0; i < 20; i++) {
      const current = await node.getAttribute('transform');
      const parsed = parseTransform(current);
      if (start && parsed && (Math.round(parsed.x) !== Math.round(start.x) || Math.round(parsed.y) !== Math.round(start.y))) {
        endVal = parsed; break;
      }
      await page.waitForTimeout(50);
    }
    expect(endVal).not.toBeNull();
    if (start && endVal) {
      expect(Math.round(endVal.x)).toBeGreaterThan(Math.round(start.x));
      expect(Math.round(endVal.y)).toBeGreaterThan(Math.round(start.y));
    }
  });
});
