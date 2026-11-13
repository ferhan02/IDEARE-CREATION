/* Desktop: gentle photo parallax and keyboard arrow browsing. */
export function mount(root, showroom) {
  const surface = root.querySelector('.ic-hero-media');
  if (!surface) return () => {};
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover:hover) and (pointer:fine)');
  const move = event => {
    if (motion.matches || !pointer.matches) return;
    const rect = surface.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / Math.max(1, rect.width) - .5;
    const ny = (event.clientY - rect.top) / Math.max(1, rect.height) - .5;
    surface.style.setProperty('--ic-move-x', `${(-nx * 8).toFixed(1)}px`);
    surface.style.setProperty('--ic-move-y', `${(-ny * 8).toFixed(1)}px`);
  };
  const reset = () => {
    surface.style.removeProperty('--ic-move-x');
    surface.style.removeProperty('--ic-move-y');
  };
  const keydown = event => {
    if (root.classList.contains('ic-dialog-open')) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    if (!root.contains(document.activeElement)) return;
    if (document.activeElement?.closest('.ic-filters')) return;
    event.preventDefault();
    showroom.next(event.key === 'ArrowRight' ? 1 : -1);
  };
  surface.addEventListener('pointermove', move, { passive:true });
  surface.addEventListener('pointerleave', reset);
  root.addEventListener('keydown', keydown);
  return () => {
    surface.removeEventListener('pointermove', move);
    surface.removeEventListener('pointerleave', reset);
    root.removeEventListener('keydown', keydown);
    reset();
  };
}
