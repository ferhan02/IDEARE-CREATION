/** IDEARE / Services showcase. Three cards per selected discipline.
 * Uses the server provided service content and existing customer links. */
(() => {
  'use strict';
  const page = document.querySelector('.sx-page');
  const dataNode = document.getElementById('sx-services-data');
  if (!page || !dataNode) return;
  let config;
  try { config = JSON.parse(dataNode.textContent); } catch (_) { return; }
  const services = config.services || {};
  const keys = Object.keys(services);
  if (!keys.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = page.querySelector('[data-sx-services]');
  const tabs = [...page.querySelectorAll('[data-sx-service]')];
  const stage = page.querySelector('[data-sx-stage]');
  const cards = page.querySelector('[data-sx-cards]');
  const nodes = {
    eyebrow:page.querySelector('[data-sx-eyebrow]'),
    name:page.querySelector('[data-sx-name]'),
    description:page.querySelector('[data-sx-description]'),
    note:page.querySelector('[data-sx-note]'),
    scope:page.querySelector('[data-sx-scope]'),
    link:page.querySelector('[data-sx-aside-link]'),
    detailTitle:page.querySelector('[data-sx-detail-title]'),
    detailExpect:page.querySelector('[data-sx-detail-expect]'),
    prev:page.querySelector('[data-sx-prev-step]'),
    next:page.querySelector('[data-sx-next-step]')
  };
  if (!stage || !cards || !nav || Object.values(nodes).some(node=>!node)) return;
  let active = services[config.activeService] ? config.activeService : keys[0];
  let step = Math.max(0,Math.min(2,Number(config.activeStep) || 0));
  let transitionTimer = 0;
  const create = (tag, className = '', text = '') => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = String(text);
    return el;
  };
  const pageUrl = () => {
    const next = new URL(location.href);
    next.searchParams.set('service',active);
    next.searchParams.set('step',String(step + 1));
    next.hash = 'services-presentation';
    return next;
  };
  const updateAddress = push => {
    try { history[push?'pushState':'replaceState']({ideareService:active},'',pageUrl()); }
    catch (_) { /* No History API is required for interaction. */ }
  };
  const placeholder = imagePath => {
    const box = create('span','sx-image-pending');
    box.setAttribute('aria-hidden','true');
    box.append(create('span','sx-placeholder-grid'),create('span','sx-placeholder-arch'),
      create('span','sx-placeholder-note','PHOTOGRAPH COMING SOON'));
    return box;
  };
  function buildCard(item,i) {
    const btn = create('button','sx-process-card');
    btn.type = 'button';
    btn.dataset.sxCard = String(i);
    btn.setAttribute('aria-label',item.title);
    const visual = create('span','sx-card-media');
    if (item.image) {
      const img = create('img');
      img.alt = item.subject || item.title;
      img.src = item.image;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 600;
      img.height = 800;
      img.addEventListener('error', () => visual.replaceChildren(placeholder(item.imagePath)),{once:true});
      visual.append(img);
    } else visual.append(placeholder(item.imagePath));
    const head = create('span','sx-card-top');
    head.textContent = '↗';
    head.setAttribute('aria-hidden','true');
    const body = create('span','sx-card-bottom');
    body.append(create('strong','',item.title));
    btn.append(visual,create('span','sx-card-shade'),head,body);
    return btn;
  }
  function announceStep() {
    const data = services[active];
    const item = data.steps[step];
    nodes.detailTitle.textContent = item.title;
    nodes.detailExpect.textContent = item.doing;
    nodes.prev.disabled = step === 0;
    nodes.next.disabled = step === 2;
    [...cards.children].forEach((card,i) => {
      const selected = i === step;
      card.classList.toggle('is-selected',selected);
      card.setAttribute('aria-pressed',String(selected));
    });
  }
  function selectStep(index, {push = false, scroll = true} = {}) {
    if (index < 0 || index > 2 || !Number.isInteger(index)) return;
    step = index;
    announceStep();
    updateAddress(push);
    if (scroll && window.matchMedia('(max-width:650px)').matches) {
      cards.children[step]?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest',inline:'center'});
    }
  }
  function selectService(key, {push = true, scroll = false} = {}) {
    if (!services[key]) return;
    active = key;
    step = 0;
    const data = services[key];
    tabs.forEach(tab => {
      const selected = tab.dataset.sxService === key;
      tab.classList.toggle('is-active',selected);
      if (selected) tab.setAttribute('aria-current','true');
      else tab.removeAttribute('aria-current');
    });
    nodes.eyebrow.textContent = data.eyebrow;
    nodes.name.textContent = data.name;
    nodes.description.textContent = data.description;
    nodes.note.textContent = data.note || '';
    nodes.scope.hidden = !data.note;
    nodes.scope.open = false;
    const linkToDesigner = key === 'interior-design';
    nodes.link.href = linkToDesigner ? config.designerUrl : config.bookUrl;
    nodes.link.replaceChildren(document.createTextNode(linkToDesigner?'Open Cabinet Designer ':'Discuss this service '),create('span','','↗'));
    const contents = document.createDocumentFragment();
    data.steps.forEach((item,i)=>contents.append(buildCard(item,i)));
    cards.replaceChildren(contents);
    cards.setAttribute('aria-label','Three steps in ' + data.name);
    announceStep();
    updateAddress(push);
    if (!reduced.matches) {
      window.clearTimeout(transitionTimer);
      stage.classList.remove('is-transitioning');
      void stage.offsetWidth;
      stage.classList.add('is-transitioning');
      transitionTimer = window.setTimeout(()=>stage.classList.remove('is-transitioning'),550);
    }
    if (scroll) page.querySelector('#services-presentation').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});
    if (window.matchMedia('(max-width:650px)').matches) {
      cards.scrollLeft = 0;
      tabs.find(tab=>tab.dataset.sxService===key)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest',inline:'center'});
    }
  }
  nav.addEventListener('click',event=>{
    const tab = event.target.closest('[data-sx-service]');
    if (!tab || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    selectService(tab.dataset.sxService,{push:true});
  });
  cards.addEventListener('click',event=>{
    const card = event.target.closest('[data-sx-card]');
    if (card) selectStep(Number(card.dataset.sxCard),{push:false,scroll:false});
  });
  nodes.prev.addEventListener('click',()=>selectStep(step-1));
  nodes.next.addEventListener('click',()=>selectStep(step+1));
  cards.addEventListener('keydown',event=>{
    if (event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    if (!cards.contains(document.activeElement)) return;
    event.preventDefault();
    const next = Math.max(0,Math.min(2,step + (event.key === 'ArrowRight'?1:-1)));
    selectStep(next);
    cards.children[next]?.focus({preventScroll:true});
  });
  // Swiping on touch naturally scrolls the mobile card rail. The closest card becomes active.
  let settle = 0;
  cards.addEventListener('scroll',()=>{
    if (!window.matchMedia('(max-width:650px)').matches) return;
    window.clearTimeout(settle);
    settle = window.setTimeout(()=>{
      const rect = cards.getBoundingClientRect();
      const mid = rect.left + rect.width/2;
      const nearest = [...cards.children].map((card,i)=>({i,dist:Math.abs(card.getBoundingClientRect().left+card.offsetWidth/2-mid)}))
        .sort((a,b)=>a.dist-b.dist)[0];
      if (nearest && nearest.i !== step) selectStep(nearest.i,{push:false,scroll:false});
    },120);
  },{passive:true});
  window.addEventListener('popstate',()=>{
    const params = new URLSearchParams(location.search);
    const key = params.get('service');
    const i = Number(params.get('step')||1)-1;
    if (services[key]) selectService(key,{push:false});
    selectStep(Math.max(0,Math.min(2,i)),{push:false,scroll:false});
  });

  const choiceButtons = [...page.querySelectorAll('[data-sx-choice]')];
  const results = {
    title:page.querySelector('[data-sx-result-title]'),
    copy:page.querySelector('[data-sx-result-copy]'),
    primary:page.querySelector('[data-sx-result-primary]'),
    secondary:page.querySelector('[data-sx-result-secondary]')
  };
  const options = {
    cabinetry:['Explore your cabinetry layout.','Start with a custom layout in the Cabinet Designer, then discuss materials, measurements and the details with our team.','Open Cabinet Designer',config.designerUrl,'Book consultation',config.bookUrl],
    interior:['Start with Interior Design.','Discuss your space and the design direction with our team. We can explore material choices, layouts and custom cabinetry as needed.','Book a consultation',config.bookUrl,'Explore Interior Design','?service=interior-design#services-presentation'],
    construction:['Begin with a site discussion.','We can review your renovation or building requirements, discuss the site and establish an appropriate scope before work begins.','Book a consultation',config.bookUrl,'Explore Construction','?service=construction#services-presentation'],
    unsure:['Start with Consulting.','Share what you have in mind. We can help you understand your options and choose the right next step.','Book a consultation',config.bookUrl,'Explore Consulting','?service=consulting#services-presentation']
  };
  function selectChoice(key) {
    const data = options[key];
    if (!data) return;
    choiceButtons.forEach(btn=>{
      const selected = btn.dataset.sxChoice === key;
      btn.classList.toggle('is-selected',selected);
      btn.setAttribute('aria-pressed',String(selected));
    });
    results.title.textContent = data[0];
    results.copy.textContent = data[1];
    for(const [anchor,label,href] of [[results.primary,data[2],data[3]],[results.secondary,data[4],data[5]]]) {
      anchor.href = href;
      anchor.replaceChildren(document.createTextNode(label+' '),create('span','','↗'));
    }
  }
  choiceButtons.forEach(btn=>btn.addEventListener('click',()=>selectChoice(btn.dataset.sxChoice)));
  results.secondary.addEventListener('click',event=>{
    const target = new URL(event.currentTarget.href,location.href);
    const targetService = target.searchParams.get('service');
    if (targetService && services[targetService] && target.pathname === location.pathname) {
      event.preventDefault();
      selectService(targetService,{push:true,scroll:true});
    }
  });
  selectChoice('cabinetry');
})();
