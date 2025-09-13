import { test, expect } from '@playwright/test';

// Basic interaction: create a new diagram and confirm a node appears.

function parseTransform(transform: string | null): { x: number; y: number } | null {
  if (!transform) return null;
  const match = /translate\(([-0-9.]+),([-0-9.]+)\)/.exec(transform);
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

test.describe('Diagram Interaction', () => {
  test('Add Node creates initial node', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New' }).click();
    const nodeGroups = page.locator('svg.diagram g[data-layer="nodes"] > g');
    await expect(nodeGroups).toHaveCount(0);
    await page.getByRole('button', { name: 'Add Node' }).click();
    await expect(nodeGroups).toHaveCount(1, { timeout: 2000 });
    const transform = await nodeGroups.first().getAttribute('transform');
    const pos = parseTransform(transform);
    expect(pos).not.toBeNull();
    if (pos) {
      expect(Math.round(pos.x)).toBe(100);
      expect(Math.round(pos.y)).toBe(80);
    }
  });

  test('Undo/Redo removes and restores node', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New' }).click();
    const nodeGroups = page.locator('svg.diagram g[data-layer="nodes"] > g');
    await expect(nodeGroups).toHaveCount(0);
    await page.getByRole('button', { name: 'Add Node' }).click();
    await expect(nodeGroups).toHaveCount(1);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(nodeGroups).toHaveCount(0);
    await page.getByRole('button', { name: 'Redo' }).click();
    await expect(nodeGroups).toHaveCount(1);
  });
});
