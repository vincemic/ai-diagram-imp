import { test, expect } from '@playwright/test';

test('export PNG creates downloadable file', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('diagramimp.skipSplash','1'); } catch {} });
  await page.goto('/');
  // Add a node so there is visible content
  await page.getByRole('button', { name: 'Add Node' }).click();
  // Filename derives from diagram metadata.title, which starts as 'Untitled Diagram'
  const expectedFile = 'Untitled Diagram.png';
  // Intercept the download by listening for a navigation to blob url after clicking
  const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export PNG' }).click()
  ]);
  const suggested = download.suggestedFilename();
  expect(suggested).toBe(expectedFile);
});
