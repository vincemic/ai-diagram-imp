import { test, expect } from '@playwright/test';

// Check presence and roles/text of primary UI controls.

test.describe('UI Elements', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
      await page.goto('/');
    });

  test('toolbar buttons visible', async ({ page }) => {
    const buttons = ['New', 'Import', 'Export JSON', 'Export JPEG', 'Undo', 'Redo'];
    for (const label of buttons) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('sidebar and canvas visible', async ({ page }) => {
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('diagram-container')).toBeVisible();
    await expect(page.getByTestId('diagram-svg')).toBeVisible();
  });
});
