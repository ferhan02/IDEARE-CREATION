/** IDEARE homepage / five stages of a complete project.
 * Icons now serve as the timeline markers instead of duplicate numbered badges.
 * Independent of the homepage service cards and the dedicated services process. */
(() => {
  'use strict';
  if (document.documentElement.dataset.idearePage !== 'home' || document.getElementById('project-journey')) return;
  const services = document.querySelector('section.service-story, section#services');
  const portfolio = document.getElementById('portfolio');
  if (!services && !portfolio) return;
  const stages = [
    {title:'Consultation Session',copy:'We discuss your vision, requirements and project expectations to establish a clear direction.',icon:'<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>'},
    {title:'3D Design Process',copy:'Our designers develop visual concepts and proposed designs to help you visualize the project before work begins.',icon:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5M12 12v10"/>'},
    {title:'Design & Build Quotation',copy:'We prepare and explain the relevant project quotation or Bill of Quantities based on the proposed scope of work.',icon:'<path d="M6 2h12v20H6zM9 7h6M9 11h6M9 15h3M15 16h1"/>'},
    {title:'Construction Project',copy:'Our team coordinates and carries out the agreed building or renovation works, including applicable interior installations.',icon:'<path d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-7h6v7M3 10h18"/>'},
    {title:'Handover Session',copy:'We inspect the completed project, review the finished work with you and complete the handover process.',icon:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'}
  ];
  // Keep the existing homepage timeline stylesheet authoritative, changing only
  // the SVG badge treatment and removing the now redundant second icon row.
  const markerStyles = document.createElement('style');
  markerStyles.textContent = `
    html[data-ideare-page="home"] .pj-step .pj-marker {
      color:var(--pj-gold);
      flex-shrink:0;
    }
    html[data-ideare-page="home"] .pj-step .pj-marker svg {
      width:29px;height:29px;display:block;stroke:currentColor;
      fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;
      transition:transform .32s cubic-bezier(.2,.8,.2,1);
    }
    html[data-ideare-page="home"] .pj-step:is(.is-active,.is-complete) .pj-marker {
      color:var(--pj-bg);
    }
    html[data-ideare-page="home"] .pj-step:hover .pj-marker svg {transform:scale(1.13)}
    html[data-ideare-page="home"] .pj-step .pj-icon {display:none!important}
    html[data-ideare-page="home"] .pj-step-title {margin-top:clamp(16px,2.6svh,25px)}
    html[data-ideare-page="home"] .pj-step .pj-marker-num {display:none}
    html[data-ideare-page="home"] .pj-current-number {display:none}
    @media (max-width:720px) {
      html[data-ideare-page="home"] .pj-step .pj-marker svg {width:24px;height:24px}
      html[data-ideare-page="home"] .pj-step-title {margin-top:4px}
    }
    @media (prefers-reduced-motion:reduce) {
      html[data-ideare-page="home"] .pj-step .pj-marker svg {transition:none}
    }
  `;
  document.head.appendChild(markerStyles);
  const section = document.createElement('section');
  section.id = 'project-journey';
  section.className = 'pj-section';
  section.setAttribute('aria-labelledby','pj-title');
  section.innerHTML = `
    <div class="site-wrap pj-shell">
      <header class="pj-heading">
        <div class="pj-heading-main"><p class="pj-overline"><span class="pj-rule"></span> IDEARE / THE PROJECT JOURNEY</p>
          <h2 id="pj-title">From first conversation <em>to final handover.</em></h2></div>
        <p class="pj-intro">A clear view of how a complete project may progress. Smaller projects can follow a simpler path based on the agreed scope.</p>
      </header>
      <div class="pj-track" role="group" aria-label="Five stages of the IDEARE project journey">
        <div class="pj-rail" aria-hidden="true"><span class="pj-rail-fill"></span></div>
      </div>
      <div class="pj-footer">
        <div class="pj-current" aria-live="polite" aria-atomic="true"><span class="pj-current-number" aria-hidden="true"></span><span class="pj-current-title">Consultation Session</span><span class="pj-current-hint">SELECT A STAGE TO EXPLORE</span></div>
        <div class="pj-actions"><button class="pj-arrow" type="button" data-pj-prev aria-label="Previous project stage" disabled>←</button><button class="pj-arrow" type="button" data-pj-next aria-label="Next project stage">→</button><a class="pj-cta" href="pages/book-appointment.php">Plan your project <span aria-hidden="true">↗</span></a></div>
      </div>
    </div>`;
  const track = section.querySelector('.pj-track');
  const make = (tag, name, value) => {
    const el = document.createElement(tag);
    if (name) el.className = name;
    if (value !== undefined) el.textContent = String(value);
    return el;
  };
  stages.forEach((stage,i) => {
    const button = make('button','pj-step'+(i===0?' is-active':''));
    button.type = 'button';
    button.dataset.pjStep = String(i);
    button.setAttribute('aria-pressed',String(i === 0));
    button.setAttribute('aria-label',`${stage.title}. ${stage.copy}`);
    const marker = make('span','pj-marker');
    marker.setAttribute('aria-hidden','true');
    marker.innerHTML = `<svg viewBox="0 0 24 24" width="29" height="29" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${stage.icon}</svg>`;
    const head = make('strong','pj-step-title',stage.title);
    const copy = make('span','pj-step-copy',stage.copy);
    button.append(marker,head,copy);
    track.append(button);
  });
  if (services) services.insertAdjacentElement('afterend',section);
  else portfolio.insertAdjacentElement('beforebegin',section);
  const buttons = [...track.querySelectorAll('[data-pj-step]')];
  const prev = section.querySelector('[data-pj-prev]');
  const next = section.querySelector('[data-pj-next]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0;
  function select(i, focus = false) {
    const to = Math.max(0,Math.min(stages.length-1,i));
    selected = to;
    buttons.forEach((button,index)=>{
      button.classList.toggle('is-active',index===to);
      button.classList.toggle('is-complete',index<to);
      button.setAttribute('aria-pressed',String(index===to));
    });
    section.style.setProperty('--pj-fill',`${to / (stages.length-1)*100}%`);
    section.querySelector('.pj-current-title').textContent = stages[to].title;
    prev.disabled = to===0;
    next.disabled = to===stages.length-1;
    if (focus) buttons[to]?.focus({preventScroll:true});
    if (window.matchMedia('(max-width:720px)').matches && focus) buttons[to]?.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'nearest'});
  }
  track.addEventListener('click',event=>{
    const card = event.target.closest('[data-pj-step]');
    if (card) select(Number(card.dataset.pjStep));
  });
  track.addEventListener('keydown',event=>{
    if (!buttons.includes(document.activeElement) || event.altKey || event.ctrlKey || event.metaKey) return;
    let target;
    if (event.key==='ArrowRight'||event.key==='ArrowDown') target=selected+1;
    else if (event.key==='ArrowLeft'||event.key==='ArrowUp') target=selected-1;
    else if (event.key==='Home') target=0;
    else if (event.key==='End') target=4;
    else return;
    event.preventDefault();
    select(target,true);
  });
  prev.addEventListener('click',()=>select(selected-1));
  next.addEventListener('click',()=>select(selected+1));
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){section.classList.add('pj-visible');observer.disconnect();}
    },{threshold:.12});
    observer.observe(section);
  } else section.classList.add('pj-visible');
  select(0);
})();
