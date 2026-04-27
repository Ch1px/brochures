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
    '.circuit-map-eyebrow', '.text-center-eyebrow', '.section-heading-eyebrow',
    '.features-title-accent',
    '.section-heading-title',
    '.page-cover-bg', '.page-cover-frame', '.page-cover-svg-decor',
    '.cover-brand-lockup', '.cover-edition', '.cover-sup', '.cover-title',
    '.cover-tag', '.cover-cta', '.cover-ref',
    '.package-image', '.feature-card-media', '.page-image-hero-bg',
    '.page-spotlight-image', '.quote-profile-photo', '.page-intro-right',
    '.gallery-item', '.gallery-hero-lead', '.gallery-hero-thumb',
    '.gallery-duo-item',
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
