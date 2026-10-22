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
  let toggle;

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (validTheme(stored)) preference = stored;
  } catch {
    // The theme still works for this visit when storage is unavailable.
  }

  function updateToggle(theme) {
    if (!toggle) return;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const label = toggle.querySelector('.theme-toggle-label');
    if (label) label.textContent = nextTheme === 'dark' ? 'Dark mode' : 'Light mode';
    toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    toggle.title = `Switch to ${nextTheme} mode`;
  }

  function applyTheme(theme) {
    const changed = root.getAttribute('data-theme') !== theme;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    updateToggle(theme);
    if (changed) {
      document.dispatchEvent(new CustomEvent('portfolio:themechange', { detail: { theme } }));
    }
  }

  // This script runs in the head before styles and visible content are painted.
  applyTheme(preference || systemTheme());

  function connectToggle() {
    toggle = document.getElementById('themeToggle');
    updateToggle(root.getAttribute('data-theme'));
    toggle?.addEventListener('click', () => {
      preference = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(preference);
      try {
        window.localStorage.setItem(storageKey, preference);
      } catch {
        // Retain the explicit choice in memory for this visit.
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectToggle, { once: true });
  } else {
    connectToggle();
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
