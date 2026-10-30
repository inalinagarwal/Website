(() => {
  'use strict';

  const storageKey = 'nalin-portfolio-theme';
  const root = document.documentElement;
  const systemScheme = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  const validTheme = value => value === 'light' || value === 'dark';
  const systemTheme = () => systemScheme?.matches ? 'dark' : 'light';
  let preference = null;
  let themeChoices = [];

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (validTheme(stored)) preference = stored;
  } catch {
    // The theme still works for this visit when storage is unavailable.
  }

  function updateThemeChoices(theme) {
    themeChoices.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
  }

  function applyTheme(theme) {
    const changed = root.getAttribute('data-theme') !== theme;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    updateThemeChoices(theme);
    if (changed) {
      document.dispatchEvent(new CustomEvent('portfolio:themechange', { detail: { theme } }));
    }
  }

  // This script runs in the head before styles and visible content are painted.
  applyTheme(preference || systemTheme());

  function connectControls() {
    themeChoices = [...document.querySelectorAll('[data-theme-choice]')];
    updateThemeChoices(root.getAttribute('data-theme'));
    themeChoices.forEach(button => button.addEventListener('click', () => {
      preference = button.dataset.themeChoice;
      if (!validTheme(preference)) return;
      applyTheme(preference);
      try { window.localStorage.setItem(storageKey, preference); } catch {
        // Retain the explicit choice in memory for this visit.
      }
    }));
    connectSectionNavigation();
  }

  function connectSectionNavigation() {
    const rail = document.getElementById('sectionRail');
    const toggle = document.getElementById('sectionRailToggle');
    const list = document.getElementById('sectionIndex');
    const header = document.querySelector('nav[aria-label="Main navigation"]');
    if (!rail || !toggle || !list || !header) return;
    const links = [...list.querySelectorAll('a[href^="#"]')];
    const sections = links.map(link => document.getElementById(link.hash.slice(1)));
    const mobile = window.matchMedia('(max-width: 900px)');
    let frame = 0;
    let active = null;
    let headerHeight = 100;

    function setOpen(open) {
      rail.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', () => setOpen(!rail.classList.contains('is-open')));
    links.forEach(link => link.addEventListener('click', () => {
      if (mobile.matches) setOpen(false);
    }));
    document.addEventListener('pointerdown', event => {
      if (!rail.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && rail.classList.contains('is-open')) {
        setOpen(false); toggle.focus();
      }
    });
    mobile.addEventListener('change', () => setOpen(false));

    function updateLocation() {
      frame = 0;
      const readingLine = headerHeight + Math.min(140, window.innerHeight * .2);
      let next = 0;
      sections.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= readingLine) next = index;
      });
      if (window.scrollY + window.innerHeight >= root.scrollHeight - 3) next = links.length - 1;
      if (next === active) return;
      active = next;
      links.forEach((link, index) => {
        if (index === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (list.clientHeight) {
        const linkBounds = links[active].getBoundingClientRect();
        const listBounds = list.getBoundingClientRect();
        if (linkBounds.top < listBounds.top) list.scrollTop -= listBounds.top - linkBounds.top;
        else if (linkBounds.bottom > listBounds.bottom) list.scrollTop += linkBounds.bottom - listBounds.bottom;
      }
    }
    function queueUpdate() {
      if (!frame) frame = window.requestAnimationFrame(updateLocation);
    }
    function measureHeader() {
      headerHeight = header.getBoundingClientRect().height;
      root.style.setProperty('--page-header-height', `${Math.ceil(headerHeight)}px`);
      queueUpdate();
    }
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', measureHeader);
    window.addEventListener('hashchange', queueUpdate);
    window.addEventListener('load', measureHeader, { once: true });
    document.fonts?.ready.then(measureHeader);
    measureHeader();
    window.addEventListener('pageshow', () => {
      measureHeader();
      updateThemeChoices(root.getAttribute('data-theme'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectControls, { once: true });
  } else {
    connectControls();
  }

  function followSystem() {
    if (!preference) applyTheme(systemTheme());
  }
  if (typeof systemScheme?.addEventListener === 'function') {
    systemScheme.addEventListener('change', followSystem);
  } else if (typeof systemScheme?.addListener === 'function') {
    systemScheme.addListener(followSystem);
  }

  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = validTheme(event.newValue) ? event.newValue : null;
    applyTheme(preference || systemTheme());
  });
})();
