/* IDEARE | Project exhibition. Extends only the existing project modal.
   Portfolio showcase remains the sole owner of API, modal state, image viewer,
   keyboard trap and project click handlers. No carousel modifications. */
(() => {
  'use strict';
  if (document.documentElement.dataset.idearePage !== 'home' || window.__ideareExhibition) return;
  window.__ideareExhibition = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stateByModal = new WeakMap();
  let active = null, returnPosition = null, restoreFrame = 0;
  const make = (tag, className) => {
    const node = document.createElement(tag); node.className = className; return node;
  };
  function hash(value) {
    let h = 2166136261;
    for (const ch of value) { h ^= ch.charCodeAt(0); h = Math.imul(h,16777619); }
    return h >>> 0;
  }
  function getModal() { return document.querySelector('.portfolio-modal'); }
  function prepare() {
    const modal = getModal();
    if (!modal) return;
    modal.classList.add('ideare-exhibition');
    if (!stateByModal.has(modal)) {
      const panel = modal.querySelector('.portfolio-modal-panel');
      const gallery = modal.querySelector('.portfolio-modal-gallery');
      const info = modal.querySelector('.portfolio-modal-info');
      if (!panel || !gallery || !info) return;
      const close = panel.querySelector('.portfolio-modal-close');
      close?.setAttribute('aria-label','Back to portfolio');
      close?.setAttribute('title','Back to portfolio');
      stateByModal.set(modal,{modal,panel,gallery,info,observer:null,frame:0,abort:null,figures:[],inert:[]});
    }
  }
  // Snapshot before the original click handler opens the modal. No click is
  // prevented or redirected, including clicks suppressed by the drag controller.
  document.addEventListener('click', event => {
    const card = event.target.closest?.('#portfolio [data-portfolio-open]');
    if (!card || active) return;
    cancelAnimationFrame(restoreFrame);
    const viewport = document.querySelector('#portfolio [data-portfolio-viewport]');
    returnPosition = {x:window.scrollX,y:window.scrollY,viewport,left:viewport?.scrollLeft||0,top:viewport?.scrollTop||0};
  },true);

  function ratioOf(figure) {
    const img = figure.querySelector('img');
    return img?.naturalWidth && img.naturalHeight ? img.naturalWidth/img.naturalHeight : 1.5;
  }
  function setPhotoRatio(figure) {
    const ratio = ratioOf(figure);
    figure.style.setProperty('--ex-ratio',String(ratio));
    figure.dataset.orientation = ratio < .9 ? 'portrait' : ratio < 1.25 ? 'square' : ratio > 1.9 ? 'cinematic' : 'landscape';
  }
  function layoutChapter(chapter) {
    const photos = [...chapter.querySelectorAll('.ex-figure')];
    if (!photos.length) return;
    const ratios = photos.map(ratioOf);
    chapter.classList.toggle('ex-portrait-pair', photos.length === 2 && ratios.every(r=>r<1.25));
    if (photos.length === 2) {
      // A wide image receives more wall area; portrait pairs use a calmer split.
      const firstWide = ratios[0] > ratios[1]*1.22;
      const lastWide = ratios[1] > ratios[0]*1.22;
      chapter.dataset.balance = firstWide ? 'left' : lastWide ? 'right' : chapter.dataset.rhythm;
    } else if (photos.length === 3) {
      const lead = ratios.indexOf(Math.max(...ratios));
      chapter.dataset.lead = String(lead);
    }
  }
  function compose(s) {
    const {gallery,info,panel,modal} = s;
    // The original renderer creates one figure per API image, in API order.
    // Reuse each exact node once, retaining its button, alt and caption.
    const photos = [...gallery.querySelectorAll('.portfolio-modal-photo')];
    s.figures = photos;
    const seed = hash(info.querySelector('.portfolio-modal-title')?.textContent || 'IDEARE');
    const count = photos.length;
    modal.dataset.exCount = String(count);
    modal.classList.toggle('ex-compact', count <= 2);
    modal.classList.toggle('ex-single', count === 1);
    modal.classList.toggle('ex-double', count === 2);
    modal.classList.toggle('ex-empty', count === 0);
    modal.dataset.exOpening = seed%2 ? 'right' : 'left';
    const opening = make('div','ex-opening');
    const openingPhotos = make('div','ex-opening-photos');
    // Preserve original header element across openings even when the existing
    // renderer clears its parent gallery. This reference is retained in state.
    opening.append(info,openingPhotos);
    if (count >= 3) {
      const wordmark = make('span','ex-wordmark');
      wordmark.textContent = 'IDEARE';
      wordmark.setAttribute('aria-hidden','true');
      opening.append(wordmark);
    }
    if (!count) {
      const empty = gallery.querySelector('.portfolio-modal-empty');
      if (empty) openingPhotos.append(empty);
      gallery.replaceChildren(opening);
      return;
    }
    photos.forEach((figure,index) => {
      figure.classList.add('ex-figure');
      figure.style.setProperty('--ex-delay',`${(index%3)*70}ms`);
      setPhotoRatio(figure);
      const img = figure.querySelector('img');
      if (img && !img.complete) {
        img.addEventListener('load',() => {
          setPhotoRatio(figure);
          const chapter=figure.closest('.ex-chapter');
          if(chapter) layoutChapter(chapter);
          requestDrift(s);
        },{once:true,signal:s.abort.signal});
      }
    });
    if (count <= 2) {
      openingPhotos.append(...photos);
      gallery.replaceChildren(opening);
      return;
    }
    openingPhotos.append(photos[0]);
    const nodes = [opening];
    let i = 1, chapterIndex = 0;
    // Deterministic, project-specific composition. Pairs are the default;
    // triptychs and statement singles punctuate longer exhibitions. The
    // final chapter never duplicates images or pads an incomplete row.
    while (i < count) {
      const left = count-i;
      let size = left <= 3 ? left : ((seed+chapterIndex)%4===1 && left>=5 ? 3 : 2);
      if (left === 4) size = 2;
      if (left-size===1 && size===3) size=2;
      const chapter = make('div',`ex-chapter ex-chapter-${size}`);
      chapter.dataset.rhythm = (seed+chapterIndex)%2 ? 'left' : 'right';
      chapter.dataset.sequence = String(chapterIndex%3);
      chapter.append(...photos.slice(i,i+size));
      layoutChapter(chapter);
      nodes.push(chapter);
      i += size; chapterIndex++;
    }
    gallery.replaceChildren(...nodes);
  }
  function requestDrift(s) {
    if (s.frame || reduced.matches || s.modal.classList.contains('ex-compact') || active!==s) return;
    s.frame = requestAnimationFrame(() => {
      s.frame=0;
      const box = s.panel.getBoundingClientRect();
      const middle = box.top+box.height/2;
      for (const figure of s.figures) {
        const b=figure.getBoundingClientRect();
        if (b.bottom<box.top-80 || b.top>box.bottom+80) continue;
        // The complete image+caption drifts by at most 7px; no cropping.
        const drift=Math.max(-7,Math.min(7,(b.top+b.height/2-middle)*.013));
        figure.style.setProperty('--ex-drift',`${drift.toFixed(2)}px`);
      }
    });
  }
  function stopMotion(s) {
    s.observer?.disconnect();s.observer=null;
    cancelAnimationFrame(s.frame);s.frame=0;
    for(const fig of s.figures){fig.classList.remove('ex-awaiting');fig.style.removeProperty('--ex-drift');}
  }
  function startMotion(s) {
    if (reduced.matches) return;
    if ('IntersectionObserver' in window && !s.modal.classList.contains('ex-compact')) {
      s.observer = new IntersectionObserver(entries=>{
        for(const entry of entries) if(entry.isIntersecting){entry.target.classList.remove('ex-awaiting');s.observer?.unobserve(entry.target);}
      },{root:s.panel,threshold:.06,rootMargin:'0px 0px 8% 0px'});
      for(const fig of s.figures.slice(1)){fig.classList.add('ex-awaiting');s.observer.observe(fig);}
    }
    requestDrift(s);
  }
  function open() {
    prepare();
    const modal=getModal(),s=modal&&stateByModal.get(modal);
    if(!s)return;
    if(active) close();
    active=s;
    s.abort=new AbortController();
    compose(s);
    s.panel.scrollTop=0;
    // Keep the underlying page out of the accessibility tree while the
    // original modal handler retains its existing focus trap and Escape logic.
    s.inert=[];
    for(const child of document.body.children){
      if(child===modal||child.matches('script,style,link,template')||child.inert)continue;
      child.inert=true;s.inert.push(child);
    }
    s.panel.addEventListener('scroll',()=>requestDrift(s),{passive:true,signal:s.abort.signal});
    s.panel.addEventListener('focusin',e=>e.target.closest('.ex-figure')?.classList.remove('ex-awaiting'),{signal:s.abort.signal});
    startMotion(s);
  }
  function close() {
    const s=active;if(!s)return;
    active=null;
    s.abort?.abort();s.abort=null;
    stopMotion(s);
    for(const child of s.inert) child.inert=false;
    s.inert=[];
    const saved=returnPosition;returnPosition=null;
    if(saved){
      // The existing modal close handler focuses the original card AFTER
      // dispatching its event. Restore after that focus/scrollIntoView.
      restoreFrame=requestAnimationFrame(()=>{
        if(active)return;
        if(saved.viewport?.isConnected){saved.viewport.scrollLeft=saved.left;saved.viewport.scrollTop=saved.top;}
        window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
      });
    }
  }
  reduced.addEventListener?.('change',()=>{
    if(!active)return;
    if(reduced.matches)stopMotion(active);
    else requestDrift(active);
  });
  document.addEventListener('portfolio:ready',prepare);
  document.addEventListener('portfolio:modal-open',open);
  document.addEventListener('portfolio:modal-close',close);
  prepare();
})();
