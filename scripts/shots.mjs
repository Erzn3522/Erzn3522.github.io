// Screenshots of / and one project page at 1440, 768 and 390 px.
// Needs a running server: `npm run dev` (or `npm run preview`) in another terminal.
// Usage: npm run shots [-- --base http://localhost:4321]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const arg = process.argv.indexOf('--base');
const base = arg > -1 ? process.argv[arg + 1] : 'http://localhost:4321';
const widths = [1440, 768, 390];
const pages = [
  { name: 'home', path: '/' },
  { name: 'project', path: '/projects/camera-to-arm-calibration' },
];
const variants = [
  { name: 'light', colorScheme: 'light', reducedMotion: 'no-preference' },
  { name: 'dark', colorScheme: 'dark', reducedMotion: 'no-preference' },
  { name: 'light-reduced', colorScheme: 'light', reducedMotion: 'reduce' },
];

await mkdir('shots', { recursive: true });
const browser = await chromium.launch();
const errors = [];

for (const v of variants) {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width >= 1000 ? 900 : width >= 700 ? 1024 : 844 },
      deviceScaleFactor: 1,
      colorScheme: v.colorScheme,
      reducedMotion: v.reducedMotion,
    });
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && errors.push(`${v.name} ${width} ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`${v.name} ${width} ${e.message}`));
    for (const p of pages) {
      await page.goto(base + p.path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `shots/${p.name}-${width}-${v.name}.png`, fullPage: true });
      await page.screenshot({ path: `shots/${p.name}-${width}-${v.name}-fold.png` });
    }
    // Hero while the pointer is over the scene (boxes + moved divider)
    if (v.name === 'light') {
      await page.goto(base + '/', { waitUntil: 'networkidle' });
      const frame = page.locator('[data-frame]');
      const box = await frame.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
        await page.waitForTimeout(600);
        await frame.screenshot({ path: `shots/hero-${width}-hover.png` });
      }
    }
    await context.close();
  }
}

await browser.close();
if (errors.length) {
  console.error('Console errors:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Screenshots written to ./shots, no console errors.');
}
