/* ============================================================
   THE PLANE — panning between home, portfolio, photography and about.

   The view is a camera over one big surface. It moves two ways:

   • Arrow keys / arrow buttons / back button: a CSS transition with a
     heavy, critically damped curve (--pan-ease). Each press just re-aims
     the transition from wherever the camera is, which is what lets fast
     key-mashing swing the view off on a diagonal.

   • Trackpad swipes, touch drags and the mouse wheel: the camera follows
     your fingers directly (JavaScript), then on release a livelier spring
     takes over, carrying your release speed: it can drift past and
     settle back. Speed and drag distance are capped, and once a gesture
     has moved you somewhere, the rest of that flick is ignored.
   ============================================================ */

type Dir = 'left' | 'right' | 'up' | 'down';
type Axis = 'x' | 'y';
interface PlaneMap {
  depth: number;
  siteName: string;
  places: Record<string, { x: number; y: number; path: string; title: string }>;
  routes: Record<string, Partial<Record<Dir, string>>>;
}

/* ---------- feel: tweak these ---------- */
const SPRING = { stiffness: 8, damping: 0.75 }; // gestures: ω₀ (rad/s), damping ratio (1 = no overshoot)
const MAX_SPEED = 2;          // screens per second a release can carry into the spring
const MAX_STEP_PX = 80;       // biggest single wheel/touch step (stops wild flicks)
const COMMIT_AT = 0.3;        // drag this fraction of a screen (or flick) to move on
const STREAM_GAP_MS = 220;    // wheel events closer than this are one gesture

const world = document.getElementById('world')!;
const near = document.getElementById('near')!;
const map: PlaneMap = JSON.parse(document.getElementById('plane-map')!.textContent!);
const root = document.documentElement;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let current = world.dataset.start!;
let lastPush = 0;
let settleTimer = 0;

const panel = (key: string) => document.getElementById(`panel-${key}`) as HTMLElement | null;
const arrowsFor = (key: string) => document.querySelector<HTMLElement>(`.arrows[data-place="${key}"]`);
const place = (key: string) => map.places[key];

function placeForPath(pathname: string) {
  const clean = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return Object.keys(map.places).find((k) => map.places[k].path === clean);
}

function showArrows(key: string | null) {
  document.querySelectorAll<HTMLElement>('.arrows').forEach((g) => {
    g.dataset.state = g.dataset.place === key ? 'visible' : 'hidden';
  });
}

/* ============================================================
   THE NEAR LAYER: big headings 15 cm from your eyes
   Each panel's [data-hero] heading is copied onto the near layer and
   placed exactly over the original, which then goes invisible. Panning
   moves the copy `depth` times as far (CSS, in Plane.astro); scrolling a
   panel moves its copy `depth` times as fast.
   ============================================================ */
interface Hero { src: HTMLElement; copy: HTMLElement; panel: HTMLElement }
const heroes: Hero[] = [];
const start = place(current);

Object.entries(map.places).forEach(([key, pl]) => {
  const p = panel(key);
  const src = p?.querySelector<HTMLElement>('[data-hero]');
  if (!p || !src) return;
  const copy = src.cloneNode(true) as HTMLElement;
  copy.removeAttribute('data-hero');
  copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  copy.classList.add('near-item');
  copy.style.setProperty('--cx', String(pl.x));
  copy.style.setProperty('--cy', String(pl.y));
  copy.style.setProperty('--tx', String(-start.x));
  copy.style.setProperty('--ty', String(-start.y));
  copy.style.setProperty('--timeline', `--scroll-${key}`);
  near.append(copy);
  heroes.push({ src, copy, panel: p });
});

// Put each copy where its original sits (as if the panel were unscrolled).
function measure() {
  heroes.forEach(({ src, copy, panel: p }) => {
    const pr = p.getBoundingClientRect();
    const r = src.getBoundingClientRect();
    copy.style.left = `${r.left - pr.left}px`;
    copy.style.top = `${r.top - pr.top + p.scrollTop}px`;
    copy.style.width = `${r.width}px`; // same width → same line breaks
  });
}

// Browsers with scroll-driven animations (Chrome, Edge, Safari 26+) run the
// scroll parallax in CSS on the compositor, exactly in step with the
// scroll. Others fall back to this per-frame JavaScript.
const cssScroll = CSS.supports('animation-timeline: scroll()');
if (cssScroll) root.classList.add('css-parallax');

let scrollQueued = false;
function applyScroll() {
  scrollQueued = false;
  if (cssScroll) return;
  const k = reduceMotion() ? 1 : map.depth;
  heroes.forEach(({ copy, panel: p }) => {
    copy.style.translate = `0 ${-p.scrollTop * k}px`;
  });
}
const queueScroll = () => {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(applyScroll);
  }
};

const resizes = new ResizeObserver(() => {
  measure();
  applyScroll();
});
heroes.forEach(({ src, panel: p }) => {
  if (!cssScroll) p.addEventListener('scroll', queueScroll, { passive: true });
  resizes.observe(src);
  resizes.observe(p);
});

Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]).then(() => {
  measure();
  applyScroll();
  root.classList.add('hero-ready');
});

/* ============================================================
   THE CAMERA
   Position is in screens: (0,0) is home, (1,0) portfolio, etc.
   ============================================================ */
const cam = { x: start.x, y: start.y };
const vel = { x: 0, y: 0 };
let driven: 'css' | 'js' = 'css';
let springRaf = 0;

// Write a camera position to the page and the near layer.
function paint(x: number, y: number) {
  const tx = String(-x);
  const ty = String(-y);
  world.style.setProperty('--tx', tx);
  world.style.setProperty('--ty', ty);
  heroes.forEach(({ copy }) => {
    copy.style.setProperty('--tx', tx);
    copy.style.setProperty('--ty', ty);
  });
}

// Take over from CSS: freeze the camera exactly where it is right now
// (even mid-transition) so a gesture can carry on from there.
function grab() {
  if (driven === 'js') return;
  const m = new DOMMatrix(getComputedStyle(world).transform);
  cam.x = -m.e / window.innerWidth;
  cam.y = -m.f / window.innerHeight;
  root.classList.add('js-cam'); // transitions off
  driven = 'js';
  paint(cam.x, cam.y);
}

function stopSpring() {
  if (springRaf) cancelAnimationFrame(springRaf);
  springRaf = 0;
}

// Hand back to CSS and glide to a place (arrow keys / buttons).
function glideTo(x: number, y: number) {
  stopSpring();
  gesture = null;
  if (driven === 'js') {
    root.classList.remove('js-cam');
    void getComputedStyle(world).transform; // transitions back on before the new target
    driven = 'css';
  }
  cam.x = x;
  cam.y = y;
  paint(x, y);
}

// Lively spring for gestures, starting from the current camera and speed.
function springTo(x: number, y: number, onDone?: () => void) {
  grab();
  stopSpring();
  if (reduceMotion()) {
    cam.x = x;
    cam.y = y;
    paint(x, y);
    onDone?.();
    return;
  }
  const k = SPRING.stiffness ** 2;
  const c = 2 * SPRING.damping * SPRING.stiffness;
  let last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    vel.x += (-k * (cam.x - x) - c * vel.x) * dt;
    vel.y += (-k * (cam.y - y) - c * vel.y) * dt;
    cam.x += vel.x * dt;
    cam.y += vel.y * dt;
    const settled =
      Math.abs(cam.x - x) < 0.0004 && Math.abs(cam.y - y) < 0.0004 &&
      Math.abs(vel.x) < 0.004 && Math.abs(vel.y) < 0.004;
    if (settled) {
      cam.x = x;
      cam.y = y;
      vel.x = vel.y = 0;
      paint(x, y);
      springRaf = 0;
      // back to CSS (values already match, so nothing animates)
      root.classList.remove('js-cam');
      driven = 'css';
      onDone?.();
      return;
    }
    paint(cam.x, cam.y);
    springRaf = requestAnimationFrame(step);
  };
  springRaf = requestAnimationFrame(step);
}

/* ---------- arrive somewhere ---------- */
function settle() {
  window.clearTimeout(settleTimer);
  document.body.classList.remove('is-panning');
  showArrows(current);
  document.dispatchEvent(new CustomEvent('plane:settle')); // the night switch says hello again
}

function departing() {
  document.body.classList.add('is-panning');
  showArrows(null);
  window.clearTimeout(settleTimer);
}

function moveTo(
  key: string,
  opts: { history?: 'push' | 'replace' | 'none'; pulse?: Dir; feel?: 'glide' | 'spring' } = {},
) {
  if (!map.places[key]) return false;
  const { x, y } = place(key);

  if (key === current) {
    // already there (e.g. a gesture let go short): just return home
    if (opts.feel === 'spring') springTo(x, y, settle);
    return false;
  }
  const from = current;
  current = key;

  // Only the panel you're on is focusable / readable by screen readers.
  Object.keys(map.places).forEach((k) => {
    const p = panel(k);
    if (p) p.inert = k !== key;
  });
  focusPanel(key);

  if (opts.pulse) {
    const btn = arrowsFor(from)?.querySelector<HTMLElement>(`[data-dir="${opts.pulse}"]`);
    if (btn) {
      btn.classList.remove('is-pulsing');
      void btn.offsetWidth; // restart the animation
      btn.classList.add('is-pulsing');
    }
  }

  // Arrows hide while moving and the new set appears once you arrive.
  departing();
  if (opts.feel === 'spring') {
    springTo(x, y, settle);
  } else {
    glideTo(x, y);
    settleTimer = window.setTimeout(settle, reduceMotion() ? 0 : 1000);
  }

  const title = map.places[key].title;
  document.title = title ? `${title} | ${map.siteName}` : `${map.siteName} | portfolio`;

  if (opts.history !== 'none') {
    // Mashing keys shouldn't fill the back button with every stop.
    const now = performance.now();
    const method = opts.history === 'replace' || now - lastPush < 700 ? 'replaceState' : 'pushState';
    history[method]({ place: key }, '', map.places[key].path);
    lastPush = now;
  }
  return true;
}

// The panel you're on holds keyboard focus, so ↑ ↓ Space PageUp/Down
// Home/End scroll it natively (smoothly, like any page).
function focusPanel(key: string) {
  panel(key)?.focus({ preventScroll: true });
}

function go(dir: Dir, pulse = true) {
  const to = map.routes[current]?.[dir];
  return to ? moveTo(to, { pulse: pulse ? dir : undefined }) : false;
}

function atEdge(p: HTMLElement | null, dir: 'up' | 'down') {
  if (!p) return true;
  const max = p.scrollHeight - p.clientHeight;
  if (max <= 2) return true;
  return dir === 'up' ? p.scrollTop <= 2 : p.scrollTop >= max - 2;
}

/* ---------- arrow buttons ---------- */
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('.edgenav a[data-to]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const to = a.dataset.to!;
  if (!map.places[to]) return; // not on the plane: normal link
  e.preventDefault();
  moveTo(to);
});

/* ---------- keyboard ---------- */
const keyDir: Record<string, Dir> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

window.addEventListener('keydown', (e) => {
  const dir = keyDir[e.key];
  if (!dir || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable], dialog[open]')) return;

  if (dir === 'up' || dir === 'down') {
    const p = panel(current);
    if (!atEdge(p, dir)) {
      // Still room to scroll: let the browser scroll the panel. If focus
      // wandered off it (e.g. you clicked the page), bring it back first.
      if (p && !p.contains(document.activeElement)) {
        e.preventDefault();
        focusPanel(current);
        p.scrollBy({ top: (dir === 'down' ? 1 : -1) * 120, behavior: 'smooth' });
      }
      return;
    }
    // At the edge: holding the key scrolls to the edge and stops there;
    // a fresh press moves on to the next place.
    if (e.repeat) {
      e.preventDefault();
      return;
    }
  }
  if (go(dir)) e.preventDefault();
});

/* ============================================================
   GESTURES
   ============================================================ */
interface Gesture {
  axis: Axis;
  base: string;        // the place the drag is measured from
  raw: number;         // drag so far, in screens, before rubber-banding
  samples: [number, number][]; // [time, camera position] for release speed
}
let gesture: Gesture | null = null;

const size = (axis: Axis) => (axis === 'x' ? window.innerWidth : window.innerHeight);
const posDir = (axis: Axis): Dir => (axis === 'x' ? 'right' : 'down');
const negDir = (axis: Axis): Dir => (axis === 'x' ? 'left' : 'up');

// A neighbour reachable by dragging straight along this axis.
function neighbour(base: string, dir: Dir, axis: Axis) {
  const to = map.routes[base]?.[dir];
  if (!to) return null;
  const a = place(base);
  const b = place(to);
  const straight = axis === 'x' ? a.y === b.y : a.x === b.x;
  return straight ? to : null;
}

// Past the last place you can still pull a little, against resistance.
const rubber = (over: number) => 0.1 * (1 - 1 / (over * 5 + 1));

function startGesture(axis: Axis) {
  grab();
  stopSpring();
  vel.x = vel.y = 0;
  departing();
  gesture = { axis, base: current, raw: cam[axis] - place(current)[axis], samples: [] };
}

function dragBy(px: number) {
  const g = gesture;
  if (!g) return;
  const step = Math.max(-MAX_STEP_PX, Math.min(MAX_STEP_PX, px)); // speed limit
  g.raw += step / size(g.axis);
  const max = neighbour(g.base, posDir(g.axis), g.axis) ? 1 : 0;
  const min = neighbour(g.base, negDir(g.axis), g.axis) ? -1 : 0;
  let off = g.raw;
  if (off > max) off = max + rubber(off - max);
  if (off < min) off = min - rubber(min - off);
  cam[g.axis] = place(g.base)[g.axis] + off;
  paint(cam.x, cam.y);

  const now = performance.now();
  g.samples.push([now, cam[g.axis]]);
  while (g.samples.length > 2 && now - g.samples[0][0] > 90) g.samples.shift();
}

// Let go: move on if dragged far enough (or flicked), else spring back.
function release() {
  const g = gesture;
  if (!g) return;
  gesture = null;
  const s = g.samples;
  let v = 0;
  if (s.length > 1) {
    const [t0, p0] = s[0];
    const [t1, p1] = s[s.length - 1];
    if (t1 > t0) v = ((p1 - p0) / (t1 - t0)) * 1000;
  }
  v = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, v));
  vel[g.axis] = v;

  const off = cam[g.axis] - place(g.base)[g.axis];
  const projected = off + v * 0.12;
  let dir: Dir | null = null;
  if (projected >= COMMIT_AT || (v > 0.8 && off > 0.04)) dir = posDir(g.axis);
  else if (projected <= -COMMIT_AT || (v < -0.8 && off < -0.04)) dir = negDir(g.axis);
  const to = dir ? neighbour(g.base, dir, g.axis) : null;
  moveTo(to ?? g.base, { feel: 'spring' });
}

/* ---------- trackpad & mouse wheel ---------- */
let lastWheel = 0;
let wheelSpent = false; // this stream already moved us: ignore the rest of it
let edgeAtStart = { up: false, down: false };
let wheelEndTimer = 0;

window.addEventListener('wheel', (e) => {
  if (e.ctrlKey || document.querySelector('dialog[open]')) return; // ctrl = pinch zoom

  const now = performance.now();
  if (now - lastWheel > STREAM_GAP_MS) {
    // a new gesture
    wheelSpent = false;
    const p = panel(current);
    edgeAtStart = { up: atEdge(p, 'up'), down: atEdge(p, 'down') };
  }
  lastWheel = now;

  const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
  const dx = e.deltaX * unit;
  const dy = e.deltaY * unit;
  const horizontal = gesture ? gesture.axis === 'x' : Math.abs(dx) > Math.abs(dy);
  const d = horizontal ? dx : dy;
  if (d === 0) return;
  const dir: Dir = horizontal ? (d > 0 ? 'right' : 'left') : d > 0 ? 'down' : 'up';

  if (wheelSpent) {
    // leftover momentum from a flick that already moved us
    e.preventDefault();
    return;
  }

  if (!horizontal && !gesture) {
    // Vertical: normal scrolling, unless this gesture began at the edge
    // of the panel and there's somewhere to go that way.
    const vdir = dir as 'up' | 'down';
    if (!map.routes[current]?.[vdir]) return;
    if (!atEdge(panel(current), vdir) || !edgeAtStart[vdir]) return;
  }
  e.preventDefault();

  // A physical mouse wheel moves in clicks: one click = one move.
  const wd = horizontal ? (e as any).wheelDeltaX : (e as any).wheelDeltaY;
  const notched = e.deltaMode !== 0 || (typeof wd === 'number' && wd !== 0 && wd % 120 === 0 && Math.abs(d) >= 50);
  if (notched && !gesture) {
    wheelSpent = true;
    const to = map.routes[current]?.[dir];
    if (to) {
      const axis: Axis = horizontal ? 'x' : 'y';
      grab();
      vel.x = vel.y = 0;
      vel[axis] = (dir === 'right' || dir === 'down' ? 1 : -1) * 1.2; // a nudge of momentum
      moveTo(to, { feel: 'spring' });
    }
    return;
  }

  // Trackpad: the camera follows your fingers.
  if (!gesture) startGesture(horizontal ? 'x' : 'y');
  dragBy(d);

  // Dragged past halfway: commit now and ignore the rest of the flick.
  const off = cam[gesture!.axis] - place(gesture!.base)[gesture!.axis];
  if (Math.abs(off) >= 0.5) {
    wheelSpent = true;
    release();
    return;
  }

  window.clearTimeout(wheelEndTimer);
  wheelEndTimer = window.setTimeout(release, 140); // fingers lifted / momentum over
}, { passive: false });

/* ---------- touch: drag sideways between places ---------- */
let touch: { x: number; y: number; lastX: number; locked: 'x' | 'none' | null } | null = null;

window.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1 || document.querySelector('dialog[open]')) {
    touch = null;
    return;
  }
  const t = e.touches[0];
  touch = { x: t.clientX, y: t.clientY, lastX: t.clientX, locked: null };
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!touch) return;
  const t = e.touches[0];
  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;
  if (!touch.locked) {
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      touch.locked = 'x';
      startGesture('x');
    } else if (Math.abs(dy) > 10) {
      touch.locked = 'none'; // vertical: the panel scrolls as normal
    }
  }
  if (touch.locked === 'x') {
    dragBy(touch.lastX - t.clientX); // finger left → camera right
    touch.lastX = t.clientX;
  }
}, { passive: true });

const endTouch = () => {
  if (touch?.locked === 'x') release();
  touch = null;
};
window.addEventListener('touchend', endTouch, { passive: true });
window.addEventListener('touchcancel', endTouch, { passive: true });

/* ---------- back / forward buttons ---------- */
window.addEventListener('popstate', (e) => {
  const key = (e.state && e.state.place) || placeForPath(location.pathname);
  if (key) moveTo(key, { history: 'none' });
});

/* ---------- start ---------- */
history.replaceState({ place: current }, '', location.href);
focusPanel(current);

// Coming back from a project page: return to where you were in the list.
try {
  const saved = sessionStorage.getItem('portfolio-scroll');
  if (saved && current === 'portfolio' && /\/portfolio\/[^/]+\/?$/.test(new URL(document.referrer).pathname)) {
    panel('portfolio')!.scrollTop = Number(saved);
    applyScroll();
  }
} catch {}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('a[href^="/portfolio/"]');
  if (a && current === 'portfolio') {
    try {
      sessionStorage.setItem('portfolio-scroll', String(panel('portfolio')!.scrollTop));
    } catch {}
  }
});

// Turn transitions on only after the first frame, so loading /about/
// lands there directly instead of sweeping in from home.
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('plane-ready')));
