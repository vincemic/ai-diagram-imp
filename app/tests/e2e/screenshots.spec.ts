import { test, expect } from '@playwright/test';

// Generates wide desktop screenshots for README examples.
// Run with: npx playwright test tests/e2e/screenshots.spec.ts

const examples = ['basic-flow', 'architecture', 'grid'];

for (const name of examples) {
  test(`capture screenshot: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
    await page.goto(`/?example=${name}`);
    // Wait for at least one node group to appear.
    await expect(page.locator('svg.diagram g[data-layer="nodes"] > g').first()).toBeVisible();
    // Small delay to ensure layout/ fonts stable.
    await page.waitForTimeout(150);
    await page.screenshot({ path: `screenshots/${name}.png` });
  });
}
