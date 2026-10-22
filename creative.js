(() => {
  'use strict';

  function initializeCreativePage() {
    const page = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const lightbox = document.getElementById('lightbox');
    page.classList.add('js');

    // Animation is optional; content remains visible without these enhancements.
    const reveals = [...document.querySelectorAll('.reveal')];
    let revealObserver;
    function revealContent() {
      if (reducedMotion.matches || !('IntersectionObserver' in window)) {
        revealObserver?.disconnect();
        reveals.forEach(element => element.classList.add('visible'));
        return;
      }
      if (revealObserver) return;
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
      reveals.forEach(element => revealObserver.observe(element));
    }
    revealContent();

    const progress = document.getElementById('progressBar');
    let progressFrame = 0;
    function updateProgress() {
      progressFrame = 0;
      if (!progress) return;
      const distance = page.scrollHeight - window.innerHeight;
      const fraction = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      progress.style.width = `${fraction * 100}%`;
    }
    function scheduleProgress() {
      if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
    }
    progress?.setAttribute('aria-hidden', 'true');
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress, { passive: true });
    updateProgress();

    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    let cursorEnabled = false;
    let cursorFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let ringX = 0;
    let ringY = 0;
    let pointerSeen = false;
    function updateCursorAvailability() {
      cursorEnabled = Boolean(cursor && ring && finePointer.matches && !reducedMotion.matches && !lightbox?.open);
      page.classList.toggle('custom-cursor', cursorEnabled);
      [cursor, ring].forEach(element => {
        if (!element) return;
        element.hidden = !cursorEnabled;
        element.style.display = cursorEnabled ? '' : 'none';
        element.style.visibility = 'hidden';
      });
      pointerSeen = false;
      if (!cursorEnabled) {
        cancelAnimationFrame(cursorFrame);
        cursorFrame = 0;
      }
    }
    function animateRing() {
      cursorFrame = 0;
      if (!cursorEnabled) return;
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      if (Math.abs(pointerX - ringX) + Math.abs(pointerY - ringY) > 0.15) {
        cursorFrame = requestAnimationFrame(animateRing);
      }
    }
    document.addEventListener('pointermove', event => {
      if (!cursorEnabled || event.pointerType !== 'mouse') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerSeen) {
        ringX = pointerX;
        ringY = pointerY;
        pointerSeen = true;
      }
      cursor.style.visibility = 'visible';
      ring.style.visibility = 'visible';
      cursor.style.left = `${pointerX}px`;
      cursor.style.top = `${pointerY}px`;
      if (!cursorFrame) cursorFrame = requestAnimationFrame(animateRing);
    }, { passive: true });
    document.addEventListener('pointerout', event => {
      if (event.relatedTarget || !cursorEnabled) return;
      cursor.style.visibility = 'hidden';
      ring.style.visibility = 'hidden';
      pointerSeen = false;
    });
    const interactiveSelector = 'a, button, [role="button"], [role="tab"], video';
    document.addEventListener('pointerover', event => {
      if (!cursorEnabled || !(event.target instanceof Element)) return;
      const expanded = Boolean(event.target.closest(interactiveSelector));
      ring.style.width = expanded ? '52px' : '36px';
      ring.style.height = expanded ? '52px' : '36px';
    });
    updateCursorAvailability();
    function motionPreferenceChanged() {
      updateCursorAvailability();
      revealContent();
    }
    reducedMotion.addEventListener('change', motionPreferenceChanged);
    finePointer.addEventListener('change', updateCursorAvailability);

    // The overlay remains a keyboard toggle while a playing video hides it visually.
    const video = document.getElementById('gameVid');
    const playOverlay = document.getElementById('playOverlay');
    if (video && playOverlay) {
      function reflectPlayback() {
        const playing = !video.paused && !video.ended;
        const showOverlay = !playing || playOverlay.matches(':focus-visible');
        playOverlay.style.opacity = showOverlay ? '1' : '0';
        playOverlay.style.pointerEvents = showOverlay ? 'auto' : 'none';
        playOverlay.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} Sharpie's Dungeon Adventure gameplay`);
        playOverlay.setAttribute('aria-pressed', String(playing));
      }
      function togglePlayback() {
        if (!video.paused && !video.ended) {
          video.pause();
        } else {
          const attempt = video.play();
          if (attempt?.catch) attempt.catch(reflectPlayback);
        }
        reflectPlayback();
      }
      playOverlay.addEventListener('click', togglePlayback);
      playOverlay.addEventListener('focus', reflectPlayback);
      playOverlay.addEventListener('blur', reflectPlayback);
      video.addEventListener('click', togglePlayback);
      video.addEventListener('keydown', event => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        togglePlayback();
      });
      ['play', 'pause', 'ended', 'error'].forEach(event => video.addEventListener(event, reflectPlayback));
      reflectPlayback();
    }

    const tabs = [...document.querySelectorAll('.gtb[data-tab]')]
      .filter(tab => document.getElementById(`tab-${tab.dataset.tab}`));
    const tablist = tabs[0]?.closest('.gallery-tabs');
    if (tablist) {
      tablist.setAttribute('role', 'tablist');
      tablist.setAttribute('aria-label', 'Design categories');
      tablist.setAttribute('aria-orientation', 'horizontal');
    }
    function activateTab(selected, focus = false) {
      tabs.forEach(tab => {
        const active = tab === selected;
        const panel = document.getElementById(`tab-${tab.dataset.tab}`);
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
      if (focus) selected.focus({ preventScroll: true });
      scheduleProgress();
    }
    tabs.forEach((tab, index) => {
      const panel = document.getElementById(`tab-${tab.dataset.tab}`);
      if (!tab.id) tab.id = `gallery-tab-${tab.dataset.tab}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        activateTab(tabs[next], true);
      });
    });
    if (tabs.length) activateTab(tabs.find(tab => tab.classList.contains('active')) || tabs[0]);

    const lightboxImage = document.getElementById('lbImg');
    const lightboxCaption = document.getElementById('lbCaption');
    const lightboxClose = document.getElementById('lbClose');
    if (lightbox && lightboxCaption) lightbox.setAttribute('aria-describedby', lightboxCaption.id);
    let returnFocus;
    let previousOverflow = '';
    function closeArtwork() {
      if (!lightbox?.open) return;
      lightbox.close();
    }
    function openArtwork(card) {
      if (!lightbox || !lightboxImage || !card.dataset.src) return;
      const image = card.querySelector('img');
      const label = card.querySelector('.mitem-label, .logo-card-name')?.textContent.trim() || image?.alt || 'Design artwork';
      lightboxImage.src = card.dataset.src;
      lightboxImage.alt = image?.alt || label;
      if (lightboxCaption) lightboxCaption.textContent = label;
      if (lightbox.open) return;
      returnFocus = card;
      previousOverflow = document.body.style.overflow;
      lightbox.showModal();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      updateCursorAvailability();
      lightboxClose?.focus({ preventScroll: true });
    }
    document.querySelectorAll('.mitem, .logo-card').forEach(card => {
      const image = card.querySelector('img');
      const label = card.querySelector('.mitem-label, .logo-card-name')?.textContent.trim() || image?.alt || 'Design artwork';
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View ${label}`);
      card.setAttribute('aria-haspopup', 'dialog');
      card.tabIndex = 0;
      card.addEventListener('click', () => openArtwork(card));
      card.addEventListener('keydown', event => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        openArtwork(card);
      });
    });
    if (lightbox) {
      lightboxClose?.addEventListener('click', closeArtwork);
      lightbox.addEventListener('click', event => {
        if (event.target === lightbox) closeArtwork();
      });
      lightbox.addEventListener('cancel', event => {
        event.preventDefault();
        closeArtwork();
      });
      lightbox.addEventListener('close', () => {
        lightbox.classList.remove('open');
        document.body.style.overflow = previousOverflow;
        updateCursorAvailability();
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      });
      lightbox.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeArtwork();
          return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...lightbox.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
          .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
        if (!focusable.length) {
          event.preventDefault();
          lightbox.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === lightbox)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === lightbox)) {
          event.preventDefault();
          first.focus();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCreativePage, { once: true });
  } else {
    initializeCreativePage();
  }
})();
