import { test, expect } from '@playwright/test';

test('property pane shows fallback text equal to node type when text undefined', async ({ page }) => {
  page.on('console', msg => {
    // eslint-disable-next-line no-console
    console.log('[page]', msg.type(), msg.text());
  });
  await page.addInitScript(() => { localStorage.setItem('diagramimp.skipSplash', '1'); });
  await page.goto('/?t=' + Date.now());

  const addButton = page.getByRole('button', { name: /add node/i });
  await addButton.click();
  await page.waitForFunction(() => document.querySelector('[data-layer="nodes"] g[data-node-id]'));
  const node = page.locator('[data-layer="nodes"] g[data-node-id]').last();
  await expect(node).toBeVisible();
  await node.locator('.node-rect').first().click();
  await page.waitForSelector('aside[data-selection-count="1"]', { timeout: 8000 });
  await page.waitForSelector('[data-layer="nodes"] g[data-node-id][data-node-selected="true"]', { timeout: 8000 });

  const shell = page.getByTestId('property-pane-shell');
  await expect(shell).toHaveAttribute('data-pane-active', '1');
  const pane = page.getByTestId('property-pane');
  await expect(pane).toBeVisible();

  const textInput = pane.getByTestId('prop-text');
  const value = await textInput.inputValue();
  // Fallback should equal node type 'start' initially when no explicit text set
  expect(value).toEqual('start');
});
