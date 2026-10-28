import type { APIRoute } from 'astro';
import { IS_DEV_DEPLOY } from '../site.config';

// The dev copy tells every crawler to stay out; the real site welcomes them.
export const GET: APIRoute = ({ site }) => {
  const body = IS_DEV_DEPLOY
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
