import { test, expect } from '@playwright/test';

// Basic smoke test to confirm the app boots and core UI elements render.
// Assumes dev server running on default Vite port (5173) when executed.

test.describe('App Smoke', () => {
  test('loads toolbar and canvas', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'New' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export JPEG' })).toBeVisible();
    await expect(page.locator('svg.diagram')).toBeVisible();
  });
});
