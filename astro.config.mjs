// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL is set by the GitHub Action (see .github/workflows/deploy.yml).
// Locally it falls back to the real domain so links in meta tags look right.
const site = process.env.SITE_URL || 'https://sevandalzell.com';

export default defineConfig({
  site,
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
