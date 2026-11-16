/**
 * IDEARE homepage | deliberate one-gesture section navigation.
 * Desktop mouse/trackpad only. Touch scrolling, browser zoom, reduced motion,
 * interactive galleries, dialogs and internal scroll containers retain native behavior.
 */
(() => {
  'use strict';
  if (document.documentElement.dataset.idearePage !== 'home') return;
  const mediaDesktop = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const navHeight = () => document.querySelector('.site-header')?.getBoundingClientRect().height || 70;
  const sectionSelectors = [
    '.home-hero', '.home-studio', '#services-overview', '#project-journey',
    '#portfolio', '#inspiration', '#materials-overview', '#cabinet-designer',
    '#contact', '.site-footer'
  ];
  const ignoreSelector = [
    '.ci-orbit-frame', '.ci-orbit-area', '.portfolio-modal', '.portfolio-image-viewer',
    '[role="dialog"]', 'dialog', 'input', 'textarea', 'select',
    '[contenteditable="true"]', '[data-scroll-native]'
  ].join(',');
  const EPSILON = 9;
  let animation = 0;
  let quietTimer = 0;
  let gestureOpen = false;
  let animationActive = false;
  let cancelledByUser = false;
  let originalScrollBehavior = null;

  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  const getSections = () => {
    const elements = sectionSelectors.map(selector => document.querySelector(selector))
      .filter(el => el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    // Deduplicate selectors while preserving visual/document order.
    return [...new Set(elements)].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  };

  // Tall sections get intermediate, viewport-sized reading stops instead of
  // losing content in a direct jump to the next heading.
  const getStops = () => {
    const sections = getSections();
    const max = maxScroll();
    const available = Math.max(340, window.innerHeight - navHeight());
    const stops = [0];
    for (const section of sections) {
      const rawTop = section.getBoundingClientRect().top + window.scrollY;
      const top = clamp(rawTop - (section.matches('.home-hero') ? 0 : navHeight()), 0, max);
      if (top > 0 && !section.matches('.home-hero')) stops.push(top);
      const height = section.getBoundingClientRect().height;
      if (height <= available + 48 || section.matches('.site-footer')) continue;
      const last = clamp(rawTop + height - window.innerHeight, top, max);
      const range = last - top;
      if (range <= 80) continue;
      const segments = Math.ceil(range / Math.max(300, available * 0.84));
      for (let step = 1; step <= segments; step++) stops.push(top + range * step / segments);
    }
    if (max > 0) stops.push(max);
    return [...new Set(stops.map(x => Math.round(x)))].sort((a, b) => a - b)
      .filter((x, i, arr) => i === 0 || x - arr[i - 1] > 22);
  };

  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function animateTo(target) {
    cancelAnimationFrame(animation);
    const from = window.scrollY;
    const distance = target - from;
    if (Math.abs(distance) < EPSILON) return;
    animationActive = true;
    cancelledByUser = false;
    originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const duration = clamp(530 + Math.abs(distance) * .19, 580, 930);
    const started = performance.now();
    function tick(now) {
      if (cancelledByUser) { animationActive = false; document.documentElement.style.scrollBehavior = originalScrollBehavior ?? ''; return; }
      const progress = clamp((now - started) / duration, 0, 1);
      window.scrollTo(0, from + distance * ease(progress));
      if (progress < 1) animation = requestAnimationFrame(tick);
      else { window.scrollTo(0, target); animationActive = false; animation = 0; document.documentElement.style.scrollBehavior = originalScrollBehavior ?? ''; }
    }
    animation = requestAnimationFrame(tick);
  }

  const modalOpen = () => document.body.style.overflow === 'hidden' ||
    !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]:not([aria-hidden="true"]), .portfolio-modal[aria-hidden="false"]');

  function allowsOwnScroll(target, delta) {
    let node = target instanceof Element ? target : null;
    while (node && node !== document.body) {
      if (node.matches(ignoreSelector)) return true;
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 3) {
        if ((delta > 0 && node.scrollTop < node.scrollHeight - node.clientHeight - 2) ||
            (delta < 0 && node.scrollTop > 2)) return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function onWheel(event) {
    if (!mediaDesktop.matches || reducedMotion.matches || event.defaultPrevented ||
        event.ctrlKey || event.metaKey || event.shiftKey || modalOpen()) return;
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : 0;
    if (Math.abs(delta) < 2 || allowsOwnScroll(event.target, delta)) return;
    const stops = getStops();
    if (stops.length < 2) return;
    const current = window.scrollY;
    const direction = Math.sign(delta);
    const target = direction > 0
      ? stops.find(stop => stop > current + EPSILON)
      : [...stops].reverse().find(stop => stop < current - EPSILON);
    // At the very end, let ordinary boundary behavior remain available.
    if (target === undefined && !gestureOpen) return;
    event.preventDefault();
    clearTimeout(quietTimer);
    quietTimer = window.setTimeout(() => { gestureOpen = false; }, 320);
    if (gestureOpen || animationActive || target === undefined) return;
    gestureOpen = true;
    animateTo(target);
  }

  // Explicit navigation should override scroll animation immediately.
  const cancelOnNavigation = event => {
    if (event.type === 'keydown' && !['Escape', 'Home', 'End'].includes(event.key)) return;
    cancelledByUser = true;
    cancelAnimationFrame(animation);
    animationActive = false;
    document.documentElement.style.scrollBehavior = originalScrollBehavior ?? '';
    gestureOpen = false;
    clearTimeout(quietTimer);
  };
  window.addEventListener('wheel', onWheel, {passive: false});
  document.addEventListener('click', event => {
    if (event.target.closest('a[href^="#"], a[href*="index.php#"]')) cancelOnNavigation(event);
  }, true);
  window.addEventListener('keydown', cancelOnNavigation);
  window.addEventListener('pagehide', cancelOnNavigation);
})();
