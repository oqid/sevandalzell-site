# sevandalzell.com

My portfolio, built with [Astro](https://docs.astro.build). Content lives in
Markdown and YAML files; Astro turns them into a fast static site, resizes
every image, and deploys to GitHub Pages on each push.

## Working on it

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install      # once, after cloning
npm run dev      # live preview at http://localhost:4321 (updates as you save)
npm run build    # production build into dist/ (shows any content errors)
npm run preview  # serve that build locally
```

## Where things are

```
src/
  content/
    projects/<slug>/index.md   one folder per project; its images sit beside it
    photos/photos.yaml         photography list (images go in the same folder)
  content.config.ts            the fields every project/photo must have
  site.config.ts               name, email, links, under-construction and
                               dark-mode switches, the map of pages
  pages/                       one file per URL
  components/panels/           home, portfolio, photography, about
  components/                  other building blocks (project layout, media, arrows…)
  layouts/Plane.astro          the panning surface the four main pages sit on
  layouts/Page.astro           normal scrolling pages (each project, 404)
  styles/tokens.css            colours, fonts, sizes: change the look here
  styles/fonts.css             the Helvetica Neue font files
  scripts/plane.ts             panning: arrows, keys, wheel, swipe, back button
  scripts/site.ts              loader, carousels, lightbox, scroll reveals
public/                        copied as-is: favicons, CV, preview image, fonts
```

## Adding a project

1. Make a folder: `src/content/projects/my-project/`
2. Put its images in that folder.
3. Create `index.md` in it:

```markdown
---
title: My project
start: 2026-03          # 2026, 2026-03 or 2026-03-14
end: 2026-06            # optional; or `ongoing: true`
role: What I did        # optional
tags: [Thing, Other thing]
order: 7                # position on the portfolio page (lower = earlier)
display: standard       # or `feature` for a full-width image
media:
  - image: ./photo.jpg
    alt: What the photo shows, for screen readers
    caption: Optional hover caption
  - video: https://res.cloudinary.com/.../clip.mp4
    alt: What happens in the clip
---

Write the description here as normal text. *Italics*, **bold** and
[links](https://example.com) all work. Blank line = new paragraph.
```

It appears on `/portfolio/` and gets its own page at `/portfolio/my-project/`.
Add `draft: true` to hide it from the live site while you work on it.

### Adding a new field (e.g. `client`)

1. Add it to the `projects` schema in `src/content.config.ts`,
   e.g. `client: z.string().optional(),`
2. Show it where you want it, e.g. in `src/components/ProjectLandmark.astro`:
   `{data.client && <p class="label">{data.client}</p>}`

If a project has a typo or a missing required field, `npm run build` tells you
which file and which field.

## Adding photos

Put the image in `src/content/photos/` and add an entry to `photos.yaml`
(there's a commented example at the top of the file). Upload full-size
originals; the build resizes and compresses them.

## How the panning works

Home, portfolio, photography and about sit side by side on one big surface
(`layouts/Plane.astro`), each at an (x, y) coordinate. Moving just retargets
a CSS transform, so pressing a new arrow mid-pan re-aims from wherever the
view is: mash ↓ then → and it swings off diagonally. Each place still has
its own URL, and the back button works.

`ROUTES` in `site.config.ts` sets the on-screen arrows; `SHORTCUTS` adds
extra arrow-key moves with no button (that's where the diagonal comes from).
Project pages are separate pages that the browser slides to and from.

## Adding a page to the plane

1. In `src/site.config.ts`, add it to `PLACES` at an empty coordinate
   (`plane: true`), and add arrows to and from it in `ROUTES`.
2. Make `src/components/panels/MyPanel.astro` and add it to the `panels`
   list in `src/layouts/Plane.astro`.
3. Create `src/pages/my-page.astro` containing `<Plane start="myPage" />`.

## Fonts

Headings are Helvetica Neue Heavy and labels/buttons Helvetica Neue Medium,
from your Helvetica Neue LT Pro files (converted to web format in
`public/fonts/helvetica-neue/`). Body text is Georgia, which every Mac and
Windows machine already has.

**That folder is git-ignored on purpose.** Helvetica Neue LT Pro is sold by
Monotype/Linotype, and a desktop licence doesn't cover putting the files on
a public website; pushing them to a public repo would also let anyone
download them. So:

- On your computer (`npm run dev`), you see the real thing.
- On the deployed site, Apple devices show their built-in Helvetica Neue
  (Bold instead of Heavy) and everything else shows Helvetica or Arial.

To use the real files online, buy a web licence for Helvetica Neue (or
Helvetica Now) from Monotype, then delete the `public/fonts/helvetica-neue/`
line from `.gitignore`. Nothing else needs changing.

## Dark mode

The dark colours are in `src/styles/tokens.css`. They're switched off: set
`darkMode: true` in `src/site.config.ts` to follow each visitor's setting.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site
and publishes it to GitHub Pages. The domain comes from the repo's Actions
variables (Settings → Secrets and variables → Actions → Variables):

| Variable     | Dev copy                       | Live site                  |
|--------------|--------------------------------|----------------------------|
| `SITE_URL`   | `https://dev.sevandalzell.com` | `https://sevandalzell.com` |
| `DEPLOY_ENV` | `dev`                          | (leave unset)              |

With `DEPLOY_ENV=dev` every page tells search engines not to index it, so the
test copy never competes with the real site on Google.

See `SETUP-DEV-DOMAIN.md` for first-time setup of `dev.sevandalzell.com` and
for switching the main domain over when it's ready.
