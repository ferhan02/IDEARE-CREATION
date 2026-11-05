/* Phone: vertical chapters, native scrolling, no pinned scene or scroll hijack. */
export function mount({ page, motion }) {
  const clean = [];
  const nav=document.querySelector('.site-nav'),toggle=document.querySelector('.nav-toggle');
  if(nav&&toggle){
    const close=e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target)){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}};
    document.addEventListener('pointerdown',close);
    clean.push(()=>document.removeEventListener('pointerdown',close));
  }
  if(page==='home'){
    const story=document.querySelector('.service-story');
    const stages=[...document.querySelectorAll('.service-story-stage')];
    const links=[...document.querySelectorAll('[data-service-jump]')];
    if(story&&stages.length){
      // Move the EXISTING progress nav before the chapters so it sticks at the
      // top while the visitor scrolls through all five, without cloning markup.
      const sticky=story.querySelector('[data-service-sticky]');
      const stageGroup=story.querySelector('[data-service-stages]');
      const progressNav=story.querySelector('[data-service-nav]');
      const restoreMarker=document.createComment('restore service nav');
      if(sticky && stageGroup && progressNav){
        progressNav.parentNode.insertBefore(restoreMarker,progressNav);
        sticky.insertBefore(progressNav,stageGroup);
      }
      story.classList.add('is-phone-story');
      stages.forEach(s=>{s.removeAttribute('aria-hidden');s.inert=false;s.style.removeProperty('visibility');s.style.removeProperty('pointer-events');});
      const updateActive=i=>links.forEach((link,j)=>i===j?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current'));
      let observer=null;
      if('IntersectionObserver' in window){
        observer=new IntersectionObserver(entries=>{
          const best=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
          if(best){const i=stages.indexOf(best.target);if(i>=0)updateActive(i);}
          entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('is-in-view');});
        },{rootMargin:'-20% 0px -25% 0px',threshold:[0,.2,.4,.6]});
        stages.forEach(s=>observer.observe(s));
      }else{stages.forEach(s=>s.classList.add('is-in-view'));}
      const jumpHandlers=links.map((link,i)=>{
        const handler=()=>{
          const target=stages[i];
          if(!target)return;
          const y=target.getBoundingClientRect().top+window.scrollY-(Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ideare-nav-height'))||66);
          window.scrollTo({top:y,behavior:motion.matches?'auto':'smooth'});
        };
        link.addEventListener('click',handler);return()=>link.removeEventListener('click',handler);
      });
      clean.push(()=>{
        observer?.disconnect();jumpHandlers.forEach(fn=>fn());
        if(restoreMarker.parentNode && progressNav){
          restoreMarker.parentNode.replaceChild(progressNav,restoreMarker);
        }
        story.classList.remove('is-phone-story');
        stages.forEach(s=>s.classList.remove('is-in-view'));
        links.forEach(l=>l.removeAttribute('aria-current'));
      });
    }
  }
  return()=>clean.forEach(fn=>fn());
}
