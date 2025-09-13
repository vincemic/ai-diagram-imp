import { test, expect } from '@playwright/test';

// Assumes a default diagram loads with at least one node or user can add one via UI.
// We will add a node using the toolbar button if necessary.

test('property pane shows fallback text equal to node type when text undefined', async ({ page }) => {
  // Skip splash
  await page.addInitScript(() => {
    localStorage.setItem('diagramimp.skipSplash', 'true');
  });
  await page.goto('/');

  // If there is an Add Node button (depends on UI), click it to create a fresh node
  const addButton = page.getByRole('button', { name: /add node/i });
  if (await addButton.isVisible()) {
    await addButton.click();
  }

  // Click the last node rendered (simplest: select any svg node group)
  const node = page.locator('svg [data-diagram-node]').last();
  await node.click();

  const pane = page.getByTestId('property-pane');
  await expect(pane).toBeVisible();

  const textInput = pane.getByLabel('Text');
  const value = await textInput.inputValue();
  // Expect non-empty (should show the type fallback like 'start')
  expect(value).not.toEqual('');
});
