/** IDEARE orbit browser interaction patch, November 2026.
 * Keep normal clicks on style cards; drag always rotates the existing carousel.
 * Does not replace the orbit's animation loop or the concept API.
 */
(() => {
  'use strict';
  const firefox = /Firefox\//i.test(navigator.userAgent);
  if (firefox) document.documentElement.classList.add('ci-is-firefox');
  const attached = new WeakSet();
  const activate = frame => {
    if (attached.has(frame)) return;
    attached.add(frame);
    const markNonDraggable = () => {
      frame.querySelectorAll('a, img').forEach(node => {
        node.draggable = false;
        node.setAttribute('draggable', 'false');
      });
    };
    markNonDraggable();
    // Native HTML5 image and link dragging displays Firefox's URL drag ghost.
    // The orbit handles its own pointer gestures; never start native drag.
    frame.addEventListener('dragstart', event => event.preventDefault(), true);
    frame.addEventListener('selectstart', event => event.preventDefault(), true);
    let dragging = false;
    let pointerId = null;
    let x = 0;
    let y = 0;
    let moved = false;
    let originatedOnLink = false;
    const reset = () => {
      if (pointerId !== null && frame.hasPointerCapture?.(pointerId)) {
        try { frame.releasePointerCapture(pointerId); } catch (_) {}
      }
      dragging = false;
      pointerId = null;
      frame.classList.remove('ci-pointer-dragging');
      frame.classList.remove('ci-pointer-pressed');
    };
    // Capture the pointer so the orbit receives movement past the card or frame.
    frame.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.pointerType === 'touch' || event.target.closest('button')) return;
      pointerId = event.pointerId;
      x = event.clientX;
      y = event.clientY;
      dragging = true;
      moved = false;
      originatedOnLink = Boolean(event.target.closest('a'));
      frame.classList.add('ci-pointer-pressed');
      // Do not capture yet: a simple click must still navigate the style link.
    });
    frame.addEventListener('pointermove', event => {
      if (!dragging || event.pointerId !== pointerId) return;
      if (Math.abs(event.clientX - x) > 7 || Math.abs(event.clientY - y) > 7) {
        moved = true;
        frame.classList.add('ci-pointer-dragging');
        // Capture only after a real drag has begun. A normal click stays on the link.
        if (!frame.hasPointerCapture?.(event.pointerId)) {
          try { frame.setPointerCapture(event.pointerId); } catch (_) {}
        }
      }
    });
    frame.addEventListener('pointerup', event => {
      if (event.pointerId !== pointerId) return;
      // Click suppression already belongs to the orbit's native gesture handler.
      // An additional capture-phase guard prevents cross-link navigation if the
      // pointer was released on a different card while moving.
      if (moved && originatedOnLink) {
        const guard = e => {
          const card = e.target.closest?.('.ci-orbit-card');
          if (card) { e.preventDefault(); e.stopImmediatePropagation(); }
          frame.removeEventListener('click', guard, true);
        };
        frame.addEventListener('click', guard, true);
        setTimeout(() => frame.removeEventListener('click', guard, true), 0);
      }
      reset();
    });
    frame.addEventListener('pointercancel', reset);
    frame.addEventListener('lostpointercapture', () => {
      dragging = false;
      pointerId = null;
      frame.classList.remove('ci-pointer-dragging', 'ci-pointer-pressed');
    });
    // Preserve keyboard access and real clicks to each style's collection.
    frame.addEventListener('keydown', event => {
      if (event.key === 'Escape' && dragging) reset();
    });
  };
  const scan = () => document.querySelectorAll('.ci-orbit-frame').forEach(activate);
  scan();
  // Carousel is mounted after its async concepts request, so attach on insertion.
  const observer = new MutationObserver(scan);
  observer.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => observer.disconnect(), {once:true});
})();
