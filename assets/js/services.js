/** IDEARE / Services process explorer and guided customer journey.
 * All copy and the image manifest come from public/pages/services.php.
 * No animation libraries, scroll locking, or duplicate theme system. */
(() => {
  'use strict';
  const page = document.querySelector('.sx-page');
  const dataNode = document.getElementById('sx-services-data');
  if (!page || !dataNode) return;

  let config;
  try { config = JSON.parse(dataNode.textContent || '{}'); } catch (_) { return; }
  const services = config.services || {};
  const keys = Object.keys(services);
  if (!keys.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const processSection = page.querySelector('#services-process');
  const overviewPanels = [...page.querySelectorAll('[data-sx-service]')];
  const serviceChips = [...page.querySelectorAll('[data-sx-switch]')];
  const bar = page.querySelector('.sx-step-bar');
  const img = page.querySelector('.sx-process-image');
  const placeholder = page.querySelector('.sx-visual-placeholder');
  const pathText = page.querySelector('[data-sx-image-path]');
  const figure = page.querySelector('.sx-process-visual');
  const visualLabel = page.querySelector('.sx-visual-label');
  const visualCount = page.querySelector('[data-sx-visual-count]');
  const counter = page.querySelector('[data-sx-counter]');
  const serviceTitle = page.querySelector('[data-sx-service-name]');
  const stepTitle = page.querySelector('[data-sx-step-title]');
  const doing = page.querySelector('[data-sx-doing]');
  const expectation = page.querySelector('[data-sx-expect]');
  const serviceNote = page.querySelector('[data-sx-note]');
  const progress = page.querySelector('.sx-progress-indicator');
  const progressFill = page.querySelector('.sx-progress-fill');
  const prev = page.querySelector('[data-sx-previous]');
  const next = page.querySelector('[data-sx-next]');
  const announce = page.querySelector('[data-sx-announcement]');
  const copy = page.querySelector('[data-sx-animated-copy]');
  if (![processSection,bar,figure,img,placeholder,prev,next].every(Boolean)) return;

  let currentService = services[config.initialService] ? config.initialService : keys[0];
  let currentIndex = Number.isInteger(config.initialStep) ? Math.max(0,Math.min(4,config.initialStep)) : 0;
  const number = index => String(index + 1).padStart(2, '0');
  const servicePath = (key, step = 0) => `?service=${encodeURIComponent(key)}&step=${step + 1}#services-process`;

  function changeAddress(push = false) {
    const address = new URL(window.location.href);
    address.searchParams.set('service', currentService);
    address.searchParams.set('step', String(currentIndex + 1));
    address.hash = 'services-process';
    try { window.history[push ? 'pushState' : 'replaceState']({servicesPage:true},'',address); }
    catch (_) { /* The page remains functional if the History API is unavailable. */ }
  }

  function renderStepLinks() {
    const group = document.createDocumentFragment();
    services[currentService].steps.forEach((step,i) => {
      const anchor = document.createElement('a');
      anchor.href = servicePath(currentService,i);
      anchor.className = 'sx-step-dot' + (i === currentIndex ? ' is-active' : '');
      anchor.dataset.sxStep = String(i);
      anchor.setAttribute('aria-label', `Step ${i + 1}: ${step.title}`);
      if (i === currentIndex) anchor.setAttribute('aria-current','step');
      const count = document.createElement('span');
      count.textContent = number(i);
      const label = document.createElement('small');
      label.textContent = step.title;
      anchor.append(count,label);
      group.appendChild(anchor);
    });
    bar.replaceChildren(group);
  }

  function renderVisual(service,step) {
    img.hidden = true;
    img.removeAttribute('src');
    img.alt = '';
    if (step.image) {
      img.alt = `${step.title} process image`;
      img.src = step.image;
      img.hidden = false;
      placeholder.hidden = true;
      // A file may be removed between the server availability check and loading.
      img.onerror = () => { img.hidden = true; placeholder.hidden = false; };
    } else {
      placeholder.hidden = false;
    }
    const path = (step.imageFile || '').replace(/^assets\/images\/Services\//,'');
    if (pathText) pathText.textContent = path;
    if (visualLabel) visualLabel.textContent = 'IDEARE / ' + service.name.toUpperCase();
    if (visualCount) visualCount.textContent = number(currentIndex) + ' / 05';
  }

  function paint(shouldAnnounce = true) {
    const service = services[currentService];
    if (!service) return;
    const step = service.steps[currentIndex];
    page.dataset.sxCurrent = currentService;
    overviewPanels.forEach(panel => {
      const active = panel.dataset.sxService === currentService;
      panel.classList.toggle('is-active',active);
      if (active) panel.setAttribute('aria-current','true');
      else panel.removeAttribute('aria-current');
    });
    serviceChips.forEach(chip => {
      const active = chip.dataset.sxSwitch === currentService;
      chip.classList.toggle('is-active',active);
      chip.setAttribute('aria-current',String(active));
    });
    renderStepLinks();
    renderVisual(service,step);
    counter.textContent = '';
    counter.append(document.createTextNode(number(currentIndex) + ' '));
    const slash = document.createElement('span');
    slash.textContent = '/';
    counter.append(slash,document.createTextNode(' 05'));
    serviceTitle.textContent = service.name;
    stepTitle.textContent = step.title;
    doing.textContent = step.doing;
    expectation.textContent = step.expect;
    serviceNote.textContent = service.note || '';
    serviceNote.hidden = !service.note;
    const fraction = (currentIndex + 1) / service.steps.length;
    progress.setAttribute('aria-valuenow',String(currentIndex + 1));
    progressFill.style.width = `${Math.round(fraction * 100)}%`;
    prev.disabled = currentIndex === 0;
    next.disabled = currentIndex === service.steps.length - 1;
    if (shouldAnnounce && announce) announce.textContent = `${service.name}. Step ${currentIndex + 1} of ${service.steps.length}. ${step.title}.`;
    if (!reduceMotion.matches) {
      copy.classList.remove('is-changing');
      void copy.offsetWidth;
      copy.classList.add('is-changing');
      if (!img.hidden) { img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
    }
  }

  function moveStep(index, {push = false,announce = true} = {}) {
    const length = services[currentService].steps.length;
    const destination = Math.max(0,Math.min(length - 1,index));
    if (destination === currentIndex) return;
    currentIndex = destination;
    paint(announce);
    changeAddress(push);
  }

  function selectService(key, {scroll = false,push = true} = {}) {
    if (!services[key]) return;
    const changed = currentService !== key;
    currentService = key;
    // Changing a discipline always returns to its first process step.
    currentIndex = 0;
    paint();
    changeAddress(changed && push);
    if (scroll) processSection.scrollIntoView({behavior:reduceMotion.matches?'auto':'smooth',block:'start'});
  }

  overviewPanels.forEach(panel => panel.addEventListener('click',event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    selectService(panel.dataset.sxService,{scroll:true});
  }));
  serviceChips.forEach(chip => chip.addEventListener('click',event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    selectService(chip.dataset.sxSwitch,{scroll:false});
  }));
  bar.addEventListener('click',event => {
    const link = event.target.closest('[data-sx-step]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    moveStep(Number(link.dataset.sxStep));
  });
  prev.addEventListener('click',() => moveStep(currentIndex - 1));
  next.addEventListener('click',() => moveStep(currentIndex + 1));
  processSection.addEventListener('keydown',event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (!processSection.contains(document.activeElement)) return;
    // The service selector and timeline retain native focus navigation.
    if (document.activeElement.closest('.sx-service-switcher')) return;
    event.preventDefault();
    moveStep(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });

  // Horizontal touch gestures on the current visual. Vertical document scrolling stays available.
  figure.style.touchAction = 'pan-y';
  let touchStart = null;
  figure.addEventListener('pointerdown',event => {
    if (event.pointerType === 'mouse') return;
    touchStart = {x:event.clientX,y:event.clientY,id:event.pointerId};
  },{passive:true});
  figure.addEventListener('pointerup',event => {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    moveStep(currentIndex + (dx < 0 ? 1 : -1));
  },{passive:true});
  figure.addEventListener('pointercancel',() => {touchStart = null;},{passive:true});

  // Pathway guidance. These actions use the existing booking and Cabinet Designer routes.
  const choices = [...page.querySelectorAll('[data-sx-choice]')];
  const recommendation = {
    title:page.querySelector('[data-sx-recommend-title]'),
    text:page.querySelector('[data-sx-recommend-text]'),
    primary:page.querySelector('[data-sx-primary]'),
    secondary:page.querySelector('[data-sx-secondary]')
  };
  const guidance = {
    cabinetry: {
      title:'Start with your cabinetry layout.',
      text:'Use the 3D Cabinet Designer to explore custom measurements, storage arrangements and an initial layout. Our team can help refine it during consultation.',
      primary:['Open Cabinet Designer',config.designerUrl],secondary:['Book a consultation',config.bookingUrl]
    },
    interior: {
      title:'Explore the Interior Design process.',
      text:'Begin with your space, lifestyle and design preferences. Then discuss concepts, materials and cabinetry options with the IDEARE team.',
      primary:['Explore Interior Design','#services-process','interior-design'],secondary:['Book a consultation',config.bookingUrl]
    },
    renovation: {
      title:'Begin with a site conversation.',
      text:'An initial consultation can help clarify the existing conditions, project scope and whether further site assessment or specialist input is needed.',
      primary:['Book a consultation',config.bookingUrl],secondary:['View Construction process','#services-process','construction']
    },
    unsure: {
      title:'Start with Consulting.',
      text:'Tell us about your idea, even if the details are not final. We can help you identify the information and decisions needed to move forward.',
      primary:['Explore Consulting','#services-process','consulting'],secondary:['Book a consultation',config.bookingUrl]
    }
  };
  const renderLink = (element,spec) => {
    if (!element) return;
    element.href = spec[1];
    element.dataset.sxRouteService = spec[2] || '';
    element.replaceChildren(document.createTextNode(spec[0] + ' '));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden','true');
    arrow.textContent = '↗';
    element.appendChild(arrow);
  };
  const renderChoice = key => {
    const item = guidance[key];
    if (!item) return;
    choices.forEach(button => {
      const active = button.dataset.sxChoice === key;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-pressed',String(active));
    });
    recommendation.title.textContent = item.title;
    recommendation.text.textContent = item.text;
    renderLink(recommendation.primary,item.primary);
    renderLink(recommendation.secondary,item.secondary);
  };
  choices.forEach(button => button.addEventListener('click',() => renderChoice(button.dataset.sxChoice)));
  [recommendation.primary,recommendation.secondary].forEach(link => link?.addEventListener('click',event => {
    const target = link.dataset.sxRouteService;
    if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    selectService(target,{scroll:true});
  }));

  window.addEventListener('popstate',() => {
    const address = new URL(window.location.href);
    const key = address.searchParams.get('service');
    currentService = services[key] ? key : keys[0];
    const requested = Number(address.searchParams.get('step'));
    currentIndex = Number.isFinite(requested) ? Math.max(0,Math.min(4,requested - 1)) : 0;
    paint(false);
  });

  // Reveal only when visibility can actually be observed. Avoid invisible fallback content.
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const targets = [...page.querySelectorAll('.sx-reveal')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },{threshold:0.08,rootMargin:'0px 0px 60px 0px'});
    targets.forEach(target => observer.observe(target));
    page.classList.add('sx-motion-ready');
  }
  paint(false);
})();
