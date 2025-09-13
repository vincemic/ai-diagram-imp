import { test, expect } from '@playwright/test';

// Generates screenshots for connected examples with edges.
// Run: npx playwright test tests/e2e/connected-screenshots.spec.ts

const connectedExamples = [
  'basic-flow-connected',
  'architecture-connected'
];

for (const name of connectedExamples) {
  test(`capture connected screenshot: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
    await page.goto(`/?example=${name}`);
    await expect(page.locator('svg.diagram g[data-layer="nodes"] > g').first()).toBeVisible();
    // Ensure at least one edge path appears if edges defined.
    if (name.includes('connected')) {
      const edgeCount = await page.locator('g[data-layer="edges"] path').count();
      expect(edgeCount).toBeGreaterThan(0);
    }
    await page.waitForTimeout(150);
    await page.screenshot({ path: `screenshots/${name}.png` });
  });
}
