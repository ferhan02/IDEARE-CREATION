/* Shared math for PC/tablet pinned service stories. Phone uses native vertical flow. */
export function mountPinnedServiceStory({ length = 5, gentle = false, motion } = {}) {
  const root = document.querySelector('.service-story');
  const runway = root?.querySelector('[data-service-runway]');
  const sticky = root?.querySelector('[data-service-sticky]');
  const stages = Array.from(root?.querySelectorAll('[data-service-stage]') || []);
  const links = Array.from(root?.querySelectorAll('[data-service-jump]') || []);
  if (!root || !runway || !sticky || stages.length !== length) return () => {};
  let raf = 0;
  let active = -1;
  const cleanupFunctions = [];
  const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
  const ease = t => t*t*(3-2*t);

  const paint = () => {
    raf = 0;
    const offset = Number.parseFloat(getComputedStyle(sticky).top) || 0;
    const runwayRect = runway.getBoundingClientRect();
    const travel = Math.max(1, runway.offsetHeight - sticky.offsetHeight);
    const progress = clamp((offset - runwayRect.top) / travel,0,1);
    const pos = progress*(length - 1);
    const prev = Math.min(length - 2,Math.floor(pos));
    const fraction = pos - prev;
    const mix = ease(clamp((fraction - (gentle ? .30 : .23)) / (gentle ? .4 : .54),0,1));
    const current = Math.round(pos);
    const reduced = motion.matches;
    stages.forEach((stage,i) => {
      const imageOpacity = reduced ? Number(i===current) : i===prev ? 1-mix : i===prev+1 ? mix : 0;
      const copy = reduced ? imageOpacity : i===prev ? 1 - clamp(mix/.46,0,1) : i===prev+1 ? clamp((mix-.54)/.46,0,1) : 0;
      const copyOpacity = imageOpacity>0 ? clamp(copy/imageOpacity,0,1) : 0;
      const distance = i-pos;
      stage.style.setProperty('--ss-opacity',String(imageOpacity.toFixed(4)));
      stage.style.setProperty('--ss-copy-opacity',String(copyOpacity.toFixed(4)));
      stage.style.setProperty('--ss-translate',`${(reduced?0:clamp(distance*(gentle?18:36),-36,36)).toFixed(1)}px`);
      stage.style.setProperty('--ss-blur',`${(reduced||gentle?0:(1-copyOpacity)*5).toFixed(2)}px`);
      stage.style.setProperty('--ss-scale',String((reduced?1:1.025+Math.min(1,Math.abs(distance))*(gentle?.014:.05)).toFixed(4)));
      stage.style.visibility = imageOpacity > .002 ? 'visible' : 'hidden';
      stage.style.pointerEvents = i===current?'auto':'none';
      stage.setAttribute('aria-hidden',i===current?'false':'true');
      // Hidden stages must not keep tab stops. inert is supported by modern browsers.
      stage.inert = i!==current;
    });
    root.style.setProperty('--ss-progress',`${(progress*100).toFixed(2)}%`);
    if (current!==active) {
      active=current;
      links.forEach((link,i) => i===current ? link.setAttribute('aria-current','step') : link.removeAttribute('aria-current'));
    }
  };
  const requestPaint = () => {if (!raf) raf = requestAnimationFrame(paint);};
  root.classList.add('is-enhanced');
  const jump = stage => {
    const offset = Number.parseFloat(getComputedStyle(sticky).top)||0;
    const base = runway.getBoundingClientRect().top+window.scrollY-offset;
    const travel = Math.max(0,runway.offsetHeight-sticky.offsetHeight);
    window.scrollTo({top:base+travel*stage/(length-1),behavior:motion.matches?'auto':'smooth'});
  };
  links.forEach((link,i) => {
    const handler = () => jump(i);
    link.addEventListener('click',handler);
    cleanupFunctions.push(() => link.removeEventListener('click',handler));
  });
  window.addEventListener('scroll',requestPaint,{passive:true});
  window.addEventListener('resize',requestPaint);
  window.addEventListener('pageshow',requestPaint);
  cleanupFunctions.push(() => window.removeEventListener('scroll',requestPaint),() => window.removeEventListener('resize',requestPaint),() => window.removeEventListener('pageshow',requestPaint));
  if (motion.addEventListener) {motion.addEventListener('change',requestPaint);cleanupFunctions.push(()=>motion.removeEventListener('change',requestPaint));}
  paint();
  return () => {
    cancelAnimationFrame(raf);
    cleanupFunctions.forEach(fn=>fn());
    root.classList.remove('is-enhanced');
    root.style.removeProperty('--ss-progress');
    stages.forEach(stage=>{
      for (const name of ['--ss-opacity','--ss-copy-opacity','--ss-translate','--ss-blur','--ss-scale']) stage.style.removeProperty(name);
      stage.style.removeProperty('visibility');stage.style.removeProperty('pointer-events');
      stage.removeAttribute('aria-hidden');stage.inert=false;
    });
    links.forEach(link=>link.removeAttribute('aria-current'));
  };
}
