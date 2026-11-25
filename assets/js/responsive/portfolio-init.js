/* One responsive portfolio controller. The API and project modal remain owned
 * by portfolio-showcase.js. Three rows, no POV wrappers or transforms. */
let mounted = null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function mountGrid() {
  const root = document.querySelector('#portfolio.portfolio-showcase');
  const viewport = root?.querySelector('[data-portfolio-viewport]');
  const track = root?.querySelector('[data-portfolio-track]');
  const group = root?.querySelector('[data-portfolio-group]');
  if (!root || !viewport || !track || !group || mounted === viewport) return;
  const cards = [...group.querySelectorAll('.portfolio-project')].filter(c => !c.closest('[data-portfolio-clone]'));
  if (!cards.length) return;
  mounted = viewport;
  // Keep actual button nodes and their event handlers / project indices.
  // Flatten any legacy columns; never discard any original project.
  track.replaceChildren(group);
  group.replaceChildren(...cards);
  root.querySelectorAll('.pov-controls,.portfolio-grid-controls').forEach(el => el.remove());
  root.dataset.portfolioLayout = 'uniform-grid';
  group.style.setProperty('--portfolio-columns', Math.ceil(cards.length / 3));
  // Fill the final bottom-row slot before leaving an extra card in the middle.
  // With 20 projects the row counts become 7 / 6 / 7.
  cards.forEach((card, index) => {
    const lastMiddle = index === cards.length - 1 && cards.length % 3 === 2;
    const row = lastMiddle ? 3 : index % 3 + 1;
    card.style.setProperty('--project-grid-row', row);
    card.style.setProperty('--project-grid-column', Math.floor(index / 3) + 1);
    card.classList.toggle('is-editorial-middle', row === 2);
  });
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('../../css/portfolio-pov.css?v=20261124-editorial-balanced-4', import.meta.url).href;
  document.head.append(css);
  const controls = document.createElement('div');
  controls.className = 'portfolio-grid-controls';
  controls.innerHTML = '<button type="button" aria-label="Browse previous projects">‹</button><div class="portfolio-grid-guide"><span>Hold &amp; drag to explore</span><div class="portfolio-grid-progress" aria-hidden="true"><i></i></div></div><button type="button" aria-label="Browse next projects">›</button>';
  viewport.after(controls);
  const [prev,next] = controls.querySelectorAll('button');
  const indicator = controls.querySelector('i');
  viewport.tabIndex = 0;
  viewport.setAttribute('aria-label','Project gallery. Drag or use left and right arrows to browse.');
  viewport.setAttribute('data-scroll-native','');
  cards.forEach(c => c.querySelectorAll('img').forEach(img => {img.draggable = false;}));
  let target = viewport.scrollLeft, raf = 0, last = 0, gesture = null, suppressUntil = 0;
  const limit = () => Math.max(0,viewport.scrollWidth-viewport.clientWidth);
  const step = () => (cards[0]?.offsetWidth || 200)+(parseFloat(getComputedStyle(group).columnGap)||0);
  function paint() {
    const max=limit(), x=viewport.scrollLeft, w=viewport.clientWidth;
    const thumb=Math.min(1,w/Math.max(1,viewport.scrollWidth));
    indicator.style.width=`${thumb*100}%`;
    indicator.style.left=`${(max?clamp(x/max,0,1):0)*(1-thumb)*100}%`;
    prev.disabled=max<2 || x<2; next.disabled=max<2 || x>=max-2;
  }
  function stop(){ cancelAnimationFrame(raf); raf=0; last=0; target=viewport.scrollLeft; }
  function tick(now){
    const dt=last?Math.min(50,now-last):16; last=now;
    target=clamp(target,0,limit());
    const delta=target-viewport.scrollLeft;
    if(reduced.matches||Math.abs(delta)<1){viewport.scrollLeft=target;raf=0;last=0;paint();return;}
    viewport.scrollLeft += Math.sign(delta)*Math.min(Math.abs(delta),Math.max(1,Math.abs(delta)*(1-Math.exp(-dt/(gesture?.drag?38:85)))));
    paint(); raf=requestAnimationFrame(tick);
  }
  function moveTo(x){target=clamp(x,0,limit());if(!raf){last=0;raf=requestAnimationFrame(tick);}}
  const advance=d=>moveTo((raf?target:viewport.scrollLeft)+d*step());
  prev.addEventListener('click',()=>advance(-1));next.addEventListener('click',()=>advance(1));
  viewport.addEventListener('scroll',paint,{passive:true});
  viewport.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();advance(e.key==='ArrowLeft'?-1:1);}});
  viewport.addEventListener('focusin',e=>{if(e.target.matches('.portfolio-project:focus-visible')){stop();e.target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}});
  viewport.addEventListener('dragstart',e=>e.preventDefault(),true);
  viewport.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    stop();suppressUntil=0;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,start:viewport.scrollLeft,lastX:e.clientX,lastT:performance.now(),v:0,drag:false};
  });
  window.addEventListener('pointermove',e=>{
    const g=gesture;if(!g||e.pointerId!==g.id)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.drag){
      if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
      if(Math.abs(dx)<7||Math.abs(dx)<Math.abs(dy)*1.15)return;
      g.drag=true;viewport.classList.add('is-gallery-dragging');
      try{viewport.setPointerCapture(e.pointerId);}catch(_){}
    }
    if(e.cancelable)e.preventDefault();
    const now=performance.now(),dt=now-g.lastT;
    if(dt>0)g.v=.35*g.v+.65*(g.lastX-e.clientX)/dt;
    g.lastX=e.clientX;g.lastT=now;
    moveTo(g.start-dx);
  },{passive:false});
  function finish(e,cancel=false){
    const g=gesture;if(!g||e.pointerId!==g.id)return;
    gesture=null;viewport.classList.remove('is-gallery-dragging');
    if(g.drag){suppressUntil=performance.now()+500;
      const momentum=cancel||reduced.matches||performance.now()-g.lastT>100?0:clamp(g.v*150,-step(),step());
      moveTo(target+momentum);
    }
    try{if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);}catch(_){}
  }
  window.addEventListener('pointerup',e=>finish(e));window.addEventListener('pointercancel',e=>finish(e,true));
  viewport.addEventListener('lostpointercapture',e=>finish(e,true));
  viewport.addEventListener('click',e=>{if(e.detail!==0&&performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();suppressUntil=0;}},true);
  // Leave wheel/trackpad scrolling to the browser. Vertical wheel gestures
  // must scroll the page, not translate the portfolio horizontally.
  // Drag, arrow buttons, and keyboard navigation remain explicit controls.
  // A native wheel gesture cancels any outstanding drag/arrow momentum.
  viewport.addEventListener('wheel',stop,{passive:true});
  const measure=()=>{target=clamp(target,0,limit());paint();};
  window.addEventListener('resize',measure);css.addEventListener('load',measure,{once:true});
  if('ResizeObserver'in window){const ro=new ResizeObserver(measure);ro.observe(viewport);ro.observe(group);}
  document.addEventListener('portfolio:modal-open',stop);window.addEventListener('pagehide',stop);
  paint();requestAnimationFrame(measure);
}
export function mountPortfolioWhenReady(_legacyMount){
  if(document.querySelector('#portfolio.portfolio-showcase'))mountGrid();
  else document.addEventListener('portfolio:ready',mountGrid,{once:true});
  return ()=>document.removeEventListener('portfolio:ready',mountGrid);
}
