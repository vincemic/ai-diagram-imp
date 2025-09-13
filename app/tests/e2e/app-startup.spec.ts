import { test, expect } from '@playwright/test';

// Verifies application boots cleanly with no severe console errors and key roots present.

test.describe('App Startup', () => {
  test('loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      const type = msg.type();
      if (['error'].includes(type)) {
        errors.push(`[${type}] ${msg.text()}`);
      }
    });

  await page.goto('/');
  await page.waitForSelector('#root', { state: 'attached', timeout: 5000 });
  // Give React a moment (should be fast, but CI may be slower)
  await expect(page.getByTestId('toolbar')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('diagram-container')).toBeVisible();

    // Give any async rendering a brief moment
    await page.waitForTimeout(200);
    if (errors.length) {
      console.error('Console errors captured:\n' + errors.join('\n'));
    }
    expect(errors, 'No console errors expected on startup').toEqual([]);
  });
});
