import { mountPinnedServiceStory } from './story.js';
export function mount({ page, motion }) {
  const clean = [];
  if (page === 'home') {
    clean.push(mountPinnedServiceStory({motion}));
    // Gentle magnetic movement on the actual CTA, never on links/nav everywhere.
    if (!motion.matches && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      document.querySelectorAll('.home-hero-actions .btn, .studio-actions .btn').forEach(button => {
        const move = e => {
          if (motion.matches) { button.style.translate = ''; return; }
          const box = button.getBoundingClientRect();
          const x = (e.clientX-(box.left+box.width/2))*0.075;
          const y = (e.clientY-(box.top+box.height/2))*0.10;
          button.style.translate=`${x.toFixed(1)}px ${y.toFixed(1)}px`;
        };
        const reset=()=>{button.style.translate='';};
        button.addEventListener('pointermove',move);button.addEventListener('pointerleave',reset);
        clean.push(()=>{button.removeEventListener('pointermove',move);button.removeEventListener('pointerleave',reset);reset();});
      });
    }
  }
  return () => clean.forEach(fn=>fn());
}
