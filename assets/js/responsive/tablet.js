import { mountPinnedServiceStory } from './story.js';
import { mountPortfolioTablet } from './portfolio-tablet.js';
import { mountPortfolioWhenReady } from './portfolio-init.js';

export function mount({ page, motion }) {
  const clean = [];
  if (page === 'home') {
    clean.push(mountPinnedServiceStory({gentle:true,motion}));
    clean.push(mountPortfolioWhenReady(() => mountPortfolioTablet({motion})));
    const sticky = document.querySelector('[data-service-sticky]');
    const links = [...document.querySelectorAll('[data-service-jump]')];
    if (sticky && links.length) {
      let start = null;
      const onStart=e=>{if(e.touches.length===1)start={x:e.touches[0].clientX,y:e.touches[0].clientY};};
      const onEnd=e=>{
        if (!start || !e.changedTouches.length) return;
        const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
        start=null;
        // Horizontal gestures only; vertical swipes remain native page scrolling.
        if (Math.abs(dx)<65 || Math.abs(dx)<Math.abs(dy)*1.5) return;
        const active=links.findIndex(a=>a.getAttribute('aria-current')==='step');
        const next=Math.max(0,Math.min(links.length-1,active+(dx<0?1:-1)));
        if (next!==active)links[next].click();
      };
      sticky.addEventListener('touchstart',onStart,{passive:true});
      sticky.addEventListener('touchend',onEnd,{passive:true});
      clean.push(()=>{sticky.removeEventListener('touchstart',onStart);sticky.removeEventListener('touchend',onEnd);});
    }
  }
  clean.push(mountOutsideNavClose());
  return () => clean.forEach(fn=>fn());
}
function mountOutsideNavClose(){
  const nav=document.querySelector('.site-nav'),toggle=document.querySelector('.nav-toggle');
  if(!nav||!toggle)return()=>{};
  const close=e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target)){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}};
  document.addEventListener('pointerdown',close);
  return()=>document.removeEventListener('pointerdown',close);
}
