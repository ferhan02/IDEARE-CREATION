/* Companion to homepage.js and concept-orbit.js; no replacement of their controllers. */
(() => {
  'use strict';
  if (document.documentElement.dataset.idearePage !== 'home') return;
  const main = document.querySelector('main');
  if (!main) return;
  const unwanted = '#materials-overview, .home-materials, #services-overview .service-story-footer, #services-overview .service-story-outro';
  const phrases = '#services-overview .service-story-header h2 > em, #inspiration .ci-home-landing .ci-heading h2 > em';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const initialized = new WeakSet();
  const pending = new Map();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const phrase = pending.get(entry.target);
      observer.unobserve(entry.target);
      pending.delete(entry.target);
      if (phrase?.isConnected) activate(phrase);
    }
  }, {threshold: .2, rootMargin: '0px 0px -6% 0px'}) : null;

  function activate(phrase) {
    phrase.classList.remove('is-editorial-pending');
    if (reduced.matches || !observer) return;
    phrase.classList.add('is-editorial-typing');
    phrase.addEventListener('animationend', function complete(event) {
      if (event.animationName !== 'ideare-editorial-reveal') return;
      phrase.classList.remove('is-editorial-typing');
      phrase.removeEventListener('animationend', complete);
    });
  }
  function reconcile() {
    main.querySelectorAll(unwanted).forEach(node => node.remove());
    for (const [heading, phrase] of pending) {
      if (!phrase.isConnected) { observer?.unobserve(heading); pending.delete(heading); }
    }
    main.querySelectorAll(phrases).forEach(phrase => {
      if (initialized.has(phrase)) return;
      initialized.add(phrase);
      // A later version of the original controller may already own this phrase.
      if (phrase.classList.contains('ideare-typewriter')) return;
      phrase.classList.add('ideare-editorial-reveal');
      const chars = Math.max(1, Array.from(phrase.textContent.trim()).length);
      phrase.style.setProperty('--ideare-typing-chars', String(chars));
      phrase.style.setProperty('--ideare-typing-duration', `${Math.min(2.35, Math.max(1.05, chars * .083)).toFixed(2)}s`);
      if (!observer || reduced.matches) return;
      const heading = phrase.parentElement;
      phrase.classList.add('is-editorial-pending');
      pending.set(heading, phrase);
      observer.observe(heading);
    });
  }
  // Services are replaced and Inspiration is injected after page parsing.
  // Observe only structural edits, never theme changes or animation classes.
  const changes = new MutationObserver(reconcile);
  changes.observe(main, {childList:true, subtree:true});
  reconcile();
  reduced.addEventListener?.('change', () => {
    if (!reduced.matches) return;
    for (const [heading, phrase] of pending) {
      observer?.unobserve(heading);
      phrase.classList.remove('is-editorial-pending');
    }
    pending.clear();
    main.querySelectorAll('.is-editorial-typing').forEach(phrase => phrase.classList.remove('is-editorial-typing'));
  });
})();
