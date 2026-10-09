// Renders public/og.png (1200x630) and public/apple-touch-icon.png (180x180)
// from the calibration-board motif. Run once: npm run og
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const fontCss = await readFile(
  'node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
);
const font = `@font-face{font-family:A;font-weight:100 900;font-stretch:62% 125%;src:url(data:font/woff2;base64,${fontCss.toString('base64')}) format('woff2');}`;

const board = (n, size) => {
  let s = '';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if ((r + c) % 2 === 0) s += `<rect x="${c * size}" y="${r * size}" width="${size}" height="${size}"/>`;
  return s;
};

const og = `<!doctype html><html><head><style>${font}
body{margin:0;width:1200px;height:630px;background:#E8ECE9;color:#17262F;font-family:A,sans-serif;display:flex;align-items:center;}
.t{padding:0 0 0 80px;flex:1}
h1{font-stretch:112%;font-weight:700;font-size:76px;line-height:1.02;letter-spacing:-.01em;margin:0 0 28px}
p{font-size:30px;font-weight:500;margin:0;color:#5A6864}
svg{margin-right:80px}
</style></head><body>
<div class="t"><h1>Abdullah Erzin</h1><p>Computer vision for robots<br>that work outdoors.</p></div>
<svg width="360" height="360" viewBox="0 0 360 360"><g fill="#17262F">${board(6, 60)}</g>
<rect x="96" y="96" width="150" height="150" fill="none" stroke="#fff" stroke-width="12" stroke-opacity=".8"/>
<rect x="96" y="96" width="150" height="150" fill="none" stroke="#D7332A" stroke-width="7"/>
<rect x="92.5" y="62" width="112" height="34" fill="#D7332A"/>
<text x="102" y="87" font-family="A" font-weight="600" font-size="22" fill="#fff">1.42 m</text></svg>
</body></html>`;

const icon = `<!doctype html><html><body style="margin:0">
<svg width="180" height="180" viewBox="0 0 32 32"><rect width="32" height="32" fill="#E8ECE9"/><g fill="#17262F">${board(4, 8)}</g>
<rect x="10" y="10" width="13" height="13" fill="none" stroke="#D7332A" stroke-width="3"/></svg></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(icon);
await page.screenshot({ path: 'public/apple-touch-icon.png' });
await browser.close();
console.log('Wrote public/og.png and public/apple-touch-icon.png');
