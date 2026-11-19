/* IDEARE: Match the Services 'One team.' accent to homepage artistic typewriter headlines. */
(() => {
  'use strict';
  if (document.documentElement.dataset.idearePage !== 'home') return;
  const selector = '#service-story-heading > em';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let initialized = false;
  let sectionObserver;
  const init = () => {
    if (initialized) return true;
    const element = document.querySelector(selector);
    if (!element) return false;
    initialized = true;
    element.classList.add('ideare-artistic-phrase', 'ideare-typewriter');
    const chars = Array.from(element.textContent.trim()).length;
    element.style.setProperty('--ideare-typing-chars', String(Math.max(1, chars)));
    element.style.setProperty('--ideare-typing-duration', `${Math.min(2.35, Math.max(1.05, chars * .083)).toFixed(2)}s`);
    // Use the same visual accent as the other homepage typewriter phrases.
    const reference = document.querySelector('#home-about-title > span') || document.querySelector('#home-hero-title > span');
    if (reference) {
      const style = getComputedStyle(reference);
      element.style.fontFamily = style.fontFamily;
      element.style.fontWeight = style.fontWeight;
      element.style.fontStyle = style.fontStyle;
      element.style.letterSpacing = style.letterSpacing;
      element.style.color = style.color;
      element.style.setProperty('-webkit-text-fill-color', style.webkitTextFillColor);
      element.style.backgroundImage = style.backgroundImage;
      element.style.backgroundClip = style.backgroundClip;
      element.style.setProperty('-webkit-background-clip', style.webkitBackgroundClip);
    }
    const reveal = () => {
      element.classList.remove('is-type-pending');
      if (reduced.matches || !('IntersectionObserver' in window)) {
        element.classList.add('is-type-complete');
      } else {
        element.classList.add('is-typing');
        element.addEventListener('animationend', event => {
          if (event.animationName !== 'ideare-type-reveal') return;
          element.classList.remove('is-typing');
          element.classList.add('is-type-complete');
        }, {once: true});
      }
    };
    if (!reduced.matches && 'IntersectionObserver' in window) {
      element.classList.add('is-type-pending');
      sectionObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sectionObserver.disconnect();
          reveal();
        }
      }, {threshold: 0.2, rootMargin: '0px 0px -6% 0px'});
      sectionObserver.observe(element.parentElement || element);
    } else reveal();
    return true;
  };
  if (init()) return;
  const changes = new MutationObserver(() => { if (init()) changes.disconnect(); });
  changes.observe(document.querySelector('main') || document.body, {childList: true, subtree: true});
  window.addEventListener('pagehide', () => {changes.disconnect(); sectionObserver?.disconnect();}, {once: true});
})();
