/* ============================================================
   Behaviour shared by every page: loader, lightbox, carousels,
   scroll reveals, and keyboard moves on project pages.
   (Panning on the main plane lives in plane.ts.)
   ============================================================ */

const root = document.documentElement;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- loader ----------
   Stays up until the page is really ready: fonts in (so nothing reflows)
   and the page's own load finished (eager images etc.), but never more
   than LOADER.maxMs. It also always plays its animation to the end.
   dots: if the page still isn't ready a moment after the seventh dot,
   the last dot starts blinking, a "still loading" signal that a fast
   visit never sees. It stops the moment the fade into the site begins. */
const LOADER = {
  dotEveryMs: 160,  // between one dot and the next (keep in step with Loader.astro)
  dotFadeMs: 150,   // each dot's fade in (keep in step with Loader.astro)
  blinkAfterMs: 700, // after the last dot, how long before blinking starts
  blinkMs: 260,     // blink on/off speed
  maxMs: 6000,      // give up waiting and show the site anyway
};

(function runLoader() {
  const loader = document.getElementById('loader');
  if (!loader || root.classList.contains('skip-loader')) return;
  const mark = loader.querySelector<HTMLElement>('.loader-mark');
  const lastDot = loader.querySelector<HTMLElement>('.dot:last-child');
  const construction = loader.hasAttribute('data-construction');
  const frames = ['!ii', 'v!i', 'vi!', 'v!i', '!ii', 'v!i', 'vi!', 'vii'];
  const still = reduceMotion();

  let ready = false;
  let blink = 0;
  const animation = loader.dataset.variant === 'dots'
    ? new Promise<void>((done) => {
        window.setTimeout(() => {
          done();
          // still loading? after a pause, the last dot starts to blink
          window.setTimeout(() => {
            if (ready || still || !lastDot) return;
            blink = window.setInterval(() => lastDot.classList.toggle('is-off'), LOADER.blinkMs);
          }, LOADER.blinkAfterMs);
        }, still ? 0 : 6 * LOADER.dotEveryMs + LOADER.dotFadeMs);
      })
    : new Promise<void>((done) => {
        let i = 0;
        const tick = window.setInterval(() => {
          if (mark) mark.textContent = frames[i];
          if (++i >= frames.length) {
            window.clearInterval(tick);
            done();
          }
        }, still ? 0 : 110);
      });

  const loaded = new Promise<void>((done) => {
    if (document.readyState === 'complete') done();
    else window.addEventListener('load', () => done(), { once: true });
  });
  const pageReady = Promise.race([
    Promise.all([document.fonts.ready, loaded]),
    new Promise((r) => setTimeout(r, LOADER.maxMs)),
  ]);

  Promise.all([animation, pageReady]).then(() => {
    ready = true;
    if (construction) return;
    window.setTimeout(() => {
      window.clearInterval(blink);
      lastDot?.classList.remove('is-off');
      loader.classList.add('is-done');
    }, 300);
  });
})();

/* ---------- lightbox ---------- */
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const dialog = document.getElementById('lightbox') as HTMLDialogElement | null;
  if (!dialog) return;

  if (target === dialog || target.closest('.lightbox-close')) {
    dialog.close();
    return;
  }

  const media = target.closest<HTMLElement>('[data-lightbox]');
  if (!media) return;
  const src = media.dataset.lightbox!;
  const content = dialog.querySelector('.lightbox-content')!;
  const caption = dialog.querySelector('.lightbox-caption')!;

  if (media.dataset.lightboxType === 'video') {
    content.replaceChildren(
      Object.assign(document.createElement('video'), {
        src, controls: true, autoplay: true, loop: true, muted: true, playsInline: true,
      }),
    );
  } else {
    content.replaceChildren(
      Object.assign(document.createElement('img'), { src, alt: (media as HTMLImageElement).alt || '' }),
    );
  }
  caption.textContent = media.dataset.caption || '';
  dialog.showModal();
});

document.addEventListener('close', (e) => {
  if ((e.target as HTMLElement).id === 'lightbox') {
    (e.target as HTMLElement).querySelector('.lightbox-content')?.replaceChildren();
  }
}, true);

/* ---------- carousels: crossfade, pause on hover, dots to jump ---------- */
const SLIDE_MS = 4200;
const FIRST_SLIDE_MS = 6500;

function setupCarousel(el: HTMLElement) {
  const slides = [...el.querySelectorAll<HTMLElement>('.slide')];
  const dots = [...el.querySelectorAll<HTMLButtonElement>('.dot')];
  let index = 0;
  let timer = 0;
  let hovered = false;
  let onScreen = false;

  const schedule = (delay = SLIDE_MS) => {
    window.clearTimeout(timer);
    if (hovered || !onScreen || reduceMotion()) return;
    const video = slides[index].querySelector('video');
    if (video) {
      video.onended = () => show(index + 1); // video slides move on when the clip ends
      return;
    }
    timer = window.setTimeout(() => show(index + 1), delay);
  };

  const show = (n: number) => {
    index = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const on = i === index;
      s.classList.toggle('is-active', on);
      const video = s.querySelector('video');
      if (!video) return;
      if (on) {
        video.currentTime = 0;
        video.loop = false;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    dots.forEach((d, i) => d.setAttribute('aria-pressed', String(i === index)));
    schedule();
  };

  dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
  el.addEventListener('mouseenter', () => { hovered = true; window.clearTimeout(timer); });
  el.addEventListener('mouseleave', () => { hovered = false; schedule(); });

  // Only cycle while it's actually on screen.
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) schedule(index === 0 ? FIRST_SLIDE_MS : SLIDE_MS);
    else window.clearTimeout(timer);
  }).observe(el);

  slides.forEach((s, i) => {
    const v = s.querySelector('video');
    if (v && i !== 0) v.pause();
  });
}

document.querySelectorAll<HTMLElement>('[data-carousel]').forEach(setupCarousel);

/* ---------- reveal on scroll ---------- */
const reveal = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    reveal.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));

/* ---------- project pages: arrow keys ---------- */
if (root.dataset.kind === 'page') {
  const atTop = () => window.scrollY <= 2;
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable], dialog[open]')) return;
    let link: HTMLAnchorElement | null = null;
    if (e.key === 'ArrowUp' && atTop()) link = document.querySelector('.edgenav [data-dir="up"]');
    if (e.key === 'ArrowLeft') link = document.querySelector('.pager [rel="prev"]');
    if (e.key === 'ArrowRight') link = document.querySelector('.pager [rel="next"]');
    if (!link) return;
    e.preventDefault();
    link.click();
  });

  // prev/next between projects slide sideways
  document.querySelectorAll<HTMLAnchorElement>('.pager a').forEach((a) =>
    a.addEventListener('click', () => {
      try {
        sessionStorage.setItem('pan-dir', a.rel === 'prev' ? 'pan-left' : 'pan-right');
      } catch {}
    }),
  );
}

/* ---------- night mode: the corner switch ----------
   Base.astro has already decided whether it's night (window.__night) and
   set the colours. This fills in the sunset/sunrise times and runs the
   switch, by night and by day. A choice lasts until the next sunrise
   (at night) or sunset (by day). */
const NIGHT_UI = {
  wipeMs: 700,       // day ↔ night: how long the circle takes to cover the screen
  firstOpenMs: 5000, // first page of the night: how long the drawer stays open
  closeDelayMs: 500, // after the mouse leaves, before the drawer slides shut
  idleMs: 3500,      // after that (or after landing on a page), before it fades
};

interface NightState { isNight: boolean; sunset: number; sunrise: number; day: boolean; seen: boolean }
const night = (window as unknown as { __night?: NightState }).__night;
const nightBox = document.querySelector<HTMLElement>('[data-night]');

if (night && night.sunset && nightBox) {
  const icon = nightBox.querySelector<HTMLButtonElement>('[data-night-icon]')!;
  const flip = nightBox.querySelector<HTMLButtonElement>('[data-night-flip]')!;
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  nightBox.querySelector('[data-sunset]')!.textContent = clock.format(night.sunset);
  nightBox.querySelector('[data-sunrise]')!.textContent = clock.format(night.sunrise);
  nightBox.dataset.period = night.isNight ? 'night' : 'day';

  const save = () => {
    try {
      const until = night.isNight ? night.sunrise : night.sunset;
      localStorage.setItem('night', JSON.stringify({ until: Math.round(until / 6e4), day: night.day }));
    } catch {}
  };

  const render = () => {
    root.dataset.theme = night.day ? 'light' : 'dark';
    themeMeta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim() || '#fafafa');
  };

  let closeTimer = 0;
  let idleTimer = 0;
  const setOpen = (open: boolean) => {
    nightBox.classList.toggle('is-open', open);
    icon.setAttribute('aria-expanded', String(open));
  };
  const wake = () => {
    window.clearTimeout(idleTimer);
    nightBox.classList.remove('is-idle');
  };
  const restLater = (ms = NIGHT_UI.idleMs) => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => nightBox.classList.add('is-idle'), ms);
  };
  const closeLater = (ms = NIGHT_UI.closeDelayMs) => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      setOpen(false);
      restLater();
    }, ms);
  };
  let openedAt = 0;
  const open = () => {
    window.clearTimeout(closeTimer);
    wake();
    if (!nightBox.classList.contains('is-open')) openedAt = performance.now();
    setOpen(true);
  };

  nightBox.addEventListener('mouseenter', open);
  nightBox.addEventListener('mouseleave', () => closeLater());
  nightBox.addEventListener('focusin', open);
  nightBox.addEventListener('focusout', (e) => {
    if (!nightBox.contains(e.relatedTarget as Node)) closeLater();
  });
  // Switch, spreading the new colours out of the button in a circle.
  // Each circle is a white disc in 'difference' blend mode, which turns
  // whatever is under it into its negative: and night is exactly day's
  // negative (tokens.css). When a circle has covered the screen, the real
  // colours swap underneath it and it's removed, in the same frame, so
  // nothing visibly changes. Click as fast as you like: every click starts
  // its own circle, and overlapping circles flip back and forth.
  // (Photos look like negatives while a circle passes over them.)
  const flipTheme = () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    themeMeta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim() || '#fafafa');
  };
  const flipMode = (from: HTMLElement) => {
    night.day = !night.day;
    save();
    if (reduceMotion() || !CSS.supports('clip-path', 'circle(1px at 0 0)')) return flipTheme();
    const r = from.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const reach = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) + 2;
    const timing = { duration: NIGHT_UI.wipeMs, easing: 'cubic-bezier(0.6, 0, 0.25, 1)', fill: 'forwards' as const };
    const grow = (el: HTMLElement, cx: number, cy: number) =>
      el.animate({ clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${reach}px at ${cx}px ${cy}px)`] }, timing);

    const disc = document.createElement('div');
    disc.className = 'theme-disc';
    document.body.append(disc);
    // the photos' own discs: same circle, in each photo's coordinates
    const locals = [...document.querySelectorAll<HTMLElement>('[data-photo]')].flatMap((frame) => {
      const f = frame.getBoundingClientRect();
      if (f.bottom < 0 || f.top > innerHeight || f.right < 0 || f.left > innerWidth || !f.width) return [];
      const d = document.createElement('div');
      d.className = 'theme-disc theme-disc--local';
      frame.append(d);
      grow(d, x - f.left, y - f.top);
      return [d];
    });
    grow(disc, x, y).finished.then(() => {
      flipTheme();
      disc.remove();
      locals.forEach((d) => d.remove());
    });
  };

  // tap on touch screens: the first tap opens, the next one flips (a tap
  // also fires mouseenter, which has just opened it: that doesn't count)
  icon.addEventListener('click', () => {
    if (!nightBox.classList.contains('is-open') || performance.now() - openedAt < 500) return open();
    flipMode(icon);
  });
  flip.addEventListener('click', () => flipMode(flip));

  // say hello again on every page (and every place on the plane)
  document.addEventListener('plane:settle', () => {
    if (nightBox.classList.contains('is-open')) return;
    wake();
    restLater();
  });

  render();
  nightBox.hidden = false;
  if (night.isNight && !night.seen) {
    // first page of the night: slide the drawer open once, after the loader
    night.seen = true;
    save();
    window.setTimeout(() => {
      open();
      closeLater(NIGHT_UI.firstOpenMs);
    }, root.classList.contains('skip-loader') ? 300 : 1800);
  } else {
    restLater();
  }

  // Sunrise (or sunset) while the page is open: change over quietly. The
  // switch steps aside until the next page, which has the new times.
  window.setTimeout(() => {
    root.dataset.theme = night.isNight ? 'light' : 'dark';
    nightBox.hidden = true;
  }, Math.min((night.isNight ? night.sunrise : night.sunset) - Date.now(), 2 ** 31 - 1));
}
