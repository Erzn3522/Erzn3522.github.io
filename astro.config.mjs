// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// User site on GitHub Pages, served from the root.
export default defineConfig({
  site: 'https://erzn3522.github.io',
  base: '/',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  // Small CSS: inline it so the first paint does not wait on a stylesheet request
  build: { inlineStylesheets: 'always' },
});
