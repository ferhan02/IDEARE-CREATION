/* Approach A: ONE set of page markup and pictures; responsive CSS is media-loaded.
 * This loader mounts exactly one device-specific behavior controller at a time.
 * Viewport/matchMedia is more appropriate than user-agent sniffing: resizing,
 * iPad split view and browser zoom automatically reconfigure the layout. */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script) return;
  const assetBase = new URL('./', script.src);
  const desktop = window.matchMedia('(min-width: 1200px)');
  const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1199px)');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  let mode = '';
  let cleanup = null;
  let epoch = 0;

  const getMode = () => desktop.matches ? 'desktop' : tablet.matches ? 'tablet' : 'phone';

  const switchMode = async () => {
    const next = getMode();
    if (mode === next) return;
    mode = next;
    epoch += 1;
    const id = epoch;
    if (typeof cleanup === 'function') {
      try { cleanup(); } catch (err) { console.warn('IDEARE device cleanup:', err); }
      cleanup = null;
    }
    root.dataset.deviceLayout = next;
    try {
      const module = await import(new URL(`${next}.js`, assetBase).href);
      if (id !== epoch || getMode() !== next) return;
      cleanup = typeof module.mount === 'function'
        ? module.mount({ root, page: root.dataset.idearePage || 'general', motion })
        : null;
    } catch (err) {
      console.error(`IDEARE ${next} layout controller failed; static content remains available.`, err);
    }
  };
  for (const query of [desktop, tablet]) {
    if (query.addEventListener) query.addEventListener('change', switchMode);
    else if (query.addListener) query.addListener(switchMode);
  }
  // Cleanup if page is replaced by bfcache; restore on navigation back.
  window.addEventListener('pageshow', switchMode);
  switchMode();
})();
