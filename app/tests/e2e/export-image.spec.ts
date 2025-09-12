import { test, expect } from '@playwright/test';

test('export PNG creates downloadable file', async ({ page }) => {
  await page.goto('/');
  // Add a node so there is visible content
  await page.getByRole('button', { name: 'Add Node' }).click();
  const title = await page.title();
  const expectedFile = (title || 'diagram') + '.png';
  // Intercept the download by listening for a navigation to blob url after clicking
  const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export PNG' }).click()
  ]);
  const suggested = download.suggestedFilename();
  expect(suggested).toBe(expectedFile);
});
