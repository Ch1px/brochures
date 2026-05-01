/**
 * Vanilla-JS runtime injected into the offline `index.html` export.
 *
 * Replaces the React-driven interactivity from three sources so the
 * exported file feels indistinguishable from the live brochure:
 *
 *   - Slider state + transform   ← BrochureReader.tsx (lines 24-47, 121-156)
 *   - Burger menu + nav clicks   ← BrochureNav.tsx    (lines 86-93, 222-236)
 *   - Fade-up animations         ← AnimatedSection.tsx (lines 128-210)
 *
 * The runtime expects the SSR'd DOM emitted by `BrochureStaticView` —
 * see that file for the data-attribute contract. If you change either
 * end of the contract, change both.
 *
 * The ANIMATABLE_SELECTOR list below is duplicated from
 * `AnimatedSection.tsx` (ANIMATABLE_CLASSES, lines 18-59). When you add
 * a new animatable class there, add it here too — they need to match
 * for the offline file to fade in the same elements as live.
 */

const RUNTIME_SOURCE = /* js */ `(() => {
  'use strict';

  // ---- Selectors (kept in sync with AnimatedSection.tsx) ----
  const ANIMATABLE = [
    '.intro-eyebrow', '.stats-eyebrow', '.image-hero-eyebrow',
    '.closing-eyebrow', '.quote-profile-eyebrow', '.gallery-variant-eyebrow',
    '.circuit-map-eyebrow', '.text-center-eyebrow', '.linked-cards-eyebrow',
    '.section-heading-eyebrow', '.features-title-accent',
    '.section-heading-title',
    '.page-cover-bg', '.page-cover-frame', '.page-cover-svg-decor',
    '.cover-brand-lockup', '.cover-edition', '.cover-sup', '.cover-title',
    '.cover-tag', '.cover-cta', '.cover-ref',
    '.package-image', '.feature-card-bg', '.linked-card-bg',
    '.page-image-hero-bg', '.page-spotlight-image', '.quote-profile-photo',
    '.page-intro-right',
    '.gallery-item', '.gallery-hero-lead', '.gallery-hero-thumb',
    '.gallery-duo-item',
    '.page-closing-bg',
    '.page-section-heading-svg-decor', '.page-spotlight-svg-decor',
    '.page-closing-svg', '.circuit-map-svg-wrap'
  ].join(',');

  const TRIGGER_RATIO = 0.9;

  function syncVisibility(targets) {
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const triggerY = vh * TRIGGER_RATIO;
    for (let i = 0; i < targets.length; i++) {
      const r = targets[i].getBoundingClientRect();
      const inView =
        r.top < triggerY && r.bottom > 0 && r.left < vw && r.right > 0;
      if (inView) targets[i].classList.add('is-in-view');
      else targets[i].classList.remove('is-in-view');
    }
  }

  function init() {
    const slider = document.querySelector('.preview-mode-slider');
    if (!slider) return;

    const total = parseInt(slider.getAttribute('data-page-count') || '0', 10);
    if (!total) return;

    let pageIndex = 0;

    const pillPrev = document.querySelector('[data-prev]');
    const pillNext = document.querySelector('[data-next]');
    const counterCurrent = document.querySelector('[data-counter-current]');
    const dots = document.querySelectorAll('.preview-mode-dot[data-page-link]');
    const navLinks = document.querySelectorAll('.brochure-nav-link[data-page-link]');
    const menuItems = document.querySelectorAll('.brochure-nav-menu-item[data-page-link]');
    const burger = document.querySelector('[data-burger]');
    const menu = document.querySelector('[data-menu]');
    const navEl = document.querySelector('.brochure-nav');

    // ---- Page change ----
    function setActiveLinks() {
      function setActive(nodes) {
        nodes.forEach((n) => {
          const idx = parseInt(n.getAttribute('data-page-link') || '-1', 10);
          if (idx === pageIndex) n.classList.add('active');
          else n.classList.remove('active');
        });
      }
      setActive(dots);
      setActive(navLinks);
      setActive(menuItems);
    }

    function update() {
      slider.style.transform = 'translateX(' + (pageIndex * -100) + 'vw)';
      if (counterCurrent) {
        counterCurrent.textContent = String(pageIndex + 1).padStart(2, '0');
      }
      if (pillPrev) {
        if (pageIndex <= 0) pillPrev.setAttribute('disabled', '');
        else pillPrev.removeAttribute('disabled');
      }
      if (pillNext) {
        if (pageIndex >= total - 1) pillNext.setAttribute('disabled', '');
        else pillNext.removeAttribute('disabled');
      }
      setActiveLinks();
      // Re-sync fade-ups while the slide transition runs (transforms don't
      // fire scroll/IO events).
      pollVisibility(800);
      // Scroll active nav link into view, mirroring BrochureNav.tsx:96-105.
      const link = document.querySelector('.brochure-nav-link.active');
      if (link && link.scrollIntoView) {
        try {
          link.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        } catch (e) {}
      }
    }

    function goTo(idx) {
      if (idx < 0 || idx >= total) return;
      pageIndex = idx;
      closeMenu();
      update();
    }

    function next() { goTo(pageIndex + 1); }
    function prev() { goTo(pageIndex - 1); }

    // ---- Wiring ----
    if (pillPrev) pillPrev.addEventListener('click', prev);
    if (pillNext) pillNext.addEventListener('click', next);
    function onLinkClick(e) {
      const t = e.currentTarget;
      const idx = parseInt(t.getAttribute('data-page-link') || '-1', 10);
      if (idx >= 0) goTo(idx);
    }
    dots.forEach((d) => d.addEventListener('click', onLinkClick));
    navLinks.forEach((l) => l.addEventListener('click', onLinkClick));
    menuItems.forEach((m) => m.addEventListener('click', onLinkClick));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    });

    // ---- Burger menu ----
    function openMenu() {
      if (!burger || !menu) return;
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
      menu.classList.add('open');
    }
    function closeMenu() {
      if (!burger || !menu) return;
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      menu.classList.remove('open');
    }
    if (burger) {
      burger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menu && menu.classList.contains('open')) closeMenu();
        else openMenu();
      });
    }
    document.addEventListener('click', (e) => {
      if (!navEl) return;
      if (!navEl.contains(e.target)) closeMenu();
    });

    // ---- Circuit map content-frame sync ----
    // CircuitMap.tsx computes the .circuit-map-content-frame box
    // (left/top/width/height) in a useEffect to letterbox-match the inlined
    // SVG (xMidYMid meet). When Puppeteer captures the page, those values
    // are frozen at the capture viewport (1440x900). Recompute them here
    // so annotations track the SVG when the offline file is opened at any
    // size.
    function syncCircuitMapFrames() {
      const wraps = document.querySelectorAll('.circuit-map-svg-wrap');
      for (let i = 0; i < wraps.length; i++) {
        const wrap = wraps[i];
        const svg = wrap.querySelector('svg');
        const frame = wrap.querySelector('.circuit-map-content-frame');
        if (!svg || !frame) continue;
        let vb = svg.getAttribute('viewBox');
        if (!vb) {
          const w = svg.getAttribute('width') || '1000';
          const h = svg.getAttribute('height') || '600';
          vb = '0 0 ' + w + ' ' + h;
        }
        const parts = vb.trim().split(/[\\s,]+/).map(Number);
        if (parts.length !== 4) continue;
        const vbW = parts[2], vbH = parts[3];
        if (!(vbW > 0 && vbH > 0)) continue;
        const ar = vbW / vbH;
        const r = wrap.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        const wrapAr = r.width / r.height;
        let cw, ch;
        if (wrapAr > ar) { ch = r.height; cw = ch * ar; }
        else { cw = r.width; ch = cw / ar; }
        const left = (r.width - cw) / 2;
        const top = (r.height - ch) / 2;
        frame.style.left = left + 'px';
        frame.style.top = top + 'px';
        frame.style.width = cw + 'px';
        frame.style.height = ch + 'px';
      }
    }
    syncCircuitMapFrames();
    window.addEventListener('resize', syncCircuitMapFrames);

    // ---- Spotlight parallax (mirrors SpotlightBackground.tsx) ----
    // The bg layer translates vertically based on its centre relative to the
    // viewport; the scroll container is the nearest .brochure-page (which has
    // overflow-y: auto). The CSS class .parallax is already on the layer; we
    // only need to write --spotlight-parallax on scroll.
    const parallaxLayers = document.querySelectorAll('.page-spotlight-bg.parallax');
    parallaxLayers.forEach((layer) => {
      let scroller = null;
      for (let p = layer.parentElement; p; p = p.parentElement) {
        const oy = getComputedStyle(p).overflowY;
        if (oy === 'auto' || oy === 'scroll') { scroller = p; break; }
      }
      let raf = 0;
      function updateParallax() {
        raf = 0;
        const r = layer.getBoundingClientRect();
        const vh = window.innerHeight;
        const center = r.top + r.height / 2;
        const offset = (center - vh / 2) * -0.25;
        layer.style.setProperty('--spotlight-parallax', offset + 'px');
      }
      function onParallaxScroll() {
        if (raf) return;
        raf = requestAnimationFrame(updateParallax);
      }
      updateParallax();
      const target = scroller || window;
      target.addEventListener('scroll', onParallaxScroll, { passive: true });
      window.addEventListener('resize', onParallaxScroll);
    });

    // ---- Fade-up animations (mirrors AnimatedSection.tsx) ----
    const targets = document.querySelectorAll(ANIMATABLE);
    syncVisibility(targets);

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) entry.target.classList.add('is-in-view');
            else entry.target.classList.remove('is-in-view');
          }
        },
        { threshold: 0, rootMargin: '0px 0px -10% 0px' }
      );
      targets.forEach((t) => io.observe(t));
    }

    let scrollRaf = 0;
    function onScrollSync() {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        syncVisibility(targets);
      });
    }
    document.addEventListener('scroll', onScrollSync, { passive: true, capture: true });
    window.addEventListener('resize', onScrollSync, { passive: true });
    window.addEventListener('touchmove', onScrollSync, { passive: true });

    // rAF poll used right after a slide change (transforms don't fire events).
    let pollRaf = 0;
    let pollEnd = 0;
    function pollVisibility(durationMs) {
      pollEnd = performance.now() + durationMs;
      if (pollRaf) return;
      const tick = () => {
        syncVisibility(targets);
        if (performance.now() < pollEnd) {
          pollRaf = requestAnimationFrame(tick);
        } else {
          pollRaf = 0;
        }
      };
      pollRaf = requestAnimationFrame(tick);
    }

    // First-frame paint: prime the active page now that listeners are set.
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`

export const offlineRuntime: string = RUNTIME_SOURCE
