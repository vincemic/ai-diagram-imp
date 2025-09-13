import { test } from '@playwright/test';

// Diagnostic test to capture console + network and dump initial HTML.

test('debug render capture', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', m => messages.push(`[${m.type()}] ${m.text()}`));
  page.on('requestfailed', (r: any) => {
    let failure: any = undefined;
    try { failure = r.failure && r.failure(); } catch {}
    messages.push(`[requestfailed] ${r.url()} -> ${failure?.errorText || 'unknown'}`);
  });
  page.on('pageerror', err => messages.push(`[pageerror] ${err.message}`));

  await page.goto('/');
  await page.waitForTimeout(1500);
  const content = await page.content();

  console.log('\n--- DEBUG START ---');
  console.log(messages.join('\n'));
  console.log('\n--- HTML HEAD SNIPPET ---');
  console.log(content.slice(0, 800));
  console.log('\n--- DEBUG END ---');
});
