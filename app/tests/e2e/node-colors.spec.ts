import { test, expect } from '@playwright/test';

// Verifies default node background fill and label text color.

const EXPECT_NODE_FILL = 'rgb(207, 232, 255)'; // #cfe8ff
const EXPECT_LABEL_FILL = 'rgb(255, 255, 255)'; // #ffffff

function toRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const intVal = parseInt(m[1], 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
  await page.goto('/?example=basic-flow');
});

test('default node colors are light blue with white text', async ({ page }) => {
  const firstNode = page.locator('[data-layer="nodes"] g[data-node-id]').first();
  await expect(firstNode).toBeVisible();
  const rect = firstNode.locator('.node-rect').first();
  await expect(rect).toBeVisible();
  const fill = await rect.getAttribute('fill');
  // If React sets inline fill via data, fallback to computed style
  const effectiveFill = fill || await rect.evaluate(el => (window.getComputedStyle(el as SVGElement).fill));
  // Normalize hex to rgb if needed
  const normalized = /^#/.test(effectiveFill || '') ? toRgb(effectiveFill!) : effectiveFill;
  expect(normalized).toBe(EXPECT_NODE_FILL);

  const label = firstNode.locator('text.node-label').first();
  const labelFill = await label.getAttribute('fill') || await label.evaluate(el => window.getComputedStyle(el as SVGElement).fill);
  const labelNorm = /^#/.test(labelFill || '') ? toRgb(labelFill!) : labelFill;
  expect(labelNorm).toBe(EXPECT_LABEL_FILL);
});
