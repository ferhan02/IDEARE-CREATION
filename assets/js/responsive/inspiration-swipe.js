/* Shared pointer gestures for touch layouts. Native vertical scroll is retained. */
export function mountSwipe(root, showroom, threshold = 54) {
  const surface = root.querySelector('.ic-hero-media');
  if (!surface) return () => {};
  let start = null;
  let suppressClick = false;
  let resetTimer = 0;
  const down = event => {
    if (event.pointerType === 'mouse') return;
    start = {x:event.clientX,y:event.clientY,id:event.pointerId};
  };
  const up = event => {
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    showroom.next(dx < 0 ? 1 : -1);
    suppressClick = true;
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {suppressClick = false;}, 450);
  };
  const cancel = () => {start = null;};
  const click = event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  };
  surface.addEventListener('pointerdown', down, {passive:true});
  surface.addEventListener('pointerup', up, {passive:true});
  surface.addEventListener('pointercancel', cancel, {passive:true});
  surface.addEventListener('click', click, true);
  return () => {
    window.clearTimeout(resetTimer);
    surface.removeEventListener('pointerdown', down);
    surface.removeEventListener('pointerup', up);
    surface.removeEventListener('pointercancel', cancel);
    surface.removeEventListener('click', click, true);
  };
}
