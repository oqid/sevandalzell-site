import type { APIRoute } from 'astro';

// Writes dist/CNAME with this build's domain (from SITE_URL), so the dev
// copy and the live site each claim the right hostname on GitHub Pages.
export const GET: APIRoute = ({ site }) =>
  new Response(`${site?.hostname ?? 'sevandalzell.com'}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
