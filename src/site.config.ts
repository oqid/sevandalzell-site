/* ============================================================
   SITE CONFIG — the one place for site-wide settings.
   ============================================================ */

export const SITE = {
  name: 'Sevan Dalzell',
  mark: 'vii',
  description: 'Sevan Dalzell, final-year mechatronics engineering student at the University of Auckland. Projects in design, robotics and photography.',
  email: 'contact@sevandalzell.com',
  linkedin: 'https://www.linkedin.com/in/sevandalzell/',
  cv: '/Sevan-Dalzell-CV-2026.pdf',

  // The loading screen on fresh visits:
  //   'mark' → "vii" flickering, hero-sized, in the bottom-left corner
  //   'dots' → seven circles appearing one by one down the left side
  loader: 'dots' as 'mark' | 'dots',

  // true → every page shows only the loader with an "under construction"
  // note. Flip back to false to bring the site back.
  underConstruction: false,

  // Night mode: between sunset and sunrise the site switches to white
  // on near-black (colours in src/styles/tokens.css), with a note on the
  // home page that lets visitors switch back to day until sunrise.
  // false → always light.
  nightMode: true,
};

// Where sunset and sunrise are worked out for. Visitors in Auckland's
// time zone get these exact times; anyone elsewhere gets a rough guess
// from their own time zone (no location permission is ever asked for).
export const NIGHT = {
  lat: -36.85,
  lon: 174.76,
  timeZone: 'Pacific/Auckland',
};

// True on the dev.sevandalzell.com build (set DEPLOY_ENV=dev in the
// GitHub repo's Actions variables). Dev builds tell search engines to
// stay away so Google never indexes the test copy.
export const IS_DEV_DEPLOY = process.env.DEPLOY_ENV === 'dev';

/* ------------------------------------------------------------
   THE PLANE
   The main pages sit side by side on one big surface, each at an
   (x, y) coordinate, and the view pans between them. To add a page:
     1. add it to PLACES at an empty coordinate (plane: true)
     2. add arrows to/from it in ROUTES
     3. make a panel component and add it to src/layouts/Plane.astro
     4. make src/pages/<name>.astro rendering <Plane start="<key>" />
   ------------------------------------------------------------ */

export type Direction = 'left' | 'right' | 'up' | 'down';

export const PLACES = {
  home: { path: '/', label: 'home', title: '', x: 0, y: 0, plane: true },
  portfolio: { path: '/portfolio/', label: 'portfolio', title: 'Portfolio', x: 1, y: 0, plane: true },
  photography: { path: '/photography/', label: 'photography', title: 'Photography', x: -1, y: 0, plane: true },
  about: { path: '/about/', label: 'about', title: 'About', x: 0, y: 1, plane: true },
  // every /portfolio/<slug>/ page: its own page, entered by panning down
  project: { path: '', label: 'project', title: '', x: 1, y: 1, plane: false },
} as const;

export type PlaceKey = keyof typeof PLACES;

// Arrows shown on screen.
export const ROUTES: Record<PlaceKey, Partial<Record<Direction, PlaceKey>>> = {
  home: { left: 'photography', right: 'portfolio', down: 'about' },
  portfolio: { left: 'home' },
  photography: { right: 'home' },
  about: { up: 'home' },
  project: { up: 'portfolio' },
};

// Depth. The big headings float on a layer close to your eyes; everything
// else sits at arm's length. Nearer things move further, so the headings
// travel (body ÷ heading) times as far as the page when you pan or scroll.
// 70 / 15 ≈ 4.7×. Bring the numbers closer together for a gentler effect.
export const PARALLAX = {
  headingDistanceCm: 15,
  bodyDistanceCm: 70,
};

// Extra arrow-key moves with no button. Mash ↓ then → fast enough and the
// view swings off diagonally toward portfolio, like the original site.
export const SHORTCUTS: Partial<Record<PlaceKey, Partial<Record<Direction, PlaceKey>>>> = {
  about: { left: 'photography', right: 'portfolio' },
};
