import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173/');
await page.waitForTimeout(1500);
const html = await page.content();
console.log(html.slice(0,1000));
await browser.close();
