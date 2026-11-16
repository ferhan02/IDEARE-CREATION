/**
 * IDEARE Cabinet Inspiration | compact 3D orbit / style detail showroom.
 * All images and concept metadata are supplied by the existing folder-driven API.
 * Scoped to pages/inspiration.php; existing homepage showroom remains unchanged.
 */
(() => {
  'use strict';
  const app = document.getElementById('ci-app');
  const script = document.currentScript;
  if (!app || !script?.src) return;

  const root = new URL('../../', script.src);
  const url = path => new URL(path, root).href;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const make = (tag, className = '', label) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (label !== undefined) node.textContent = String(label);
    return node;
  };
  const safeImage = value => {
    if (!value || typeof value !== 'string') return '';
    try {
      const parsed = new URL(value, root);
      return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
    } catch (_) { return ''; }
  };
  const styleUrl = id => {
    const target = new URL('pages/inspiration.php', root);
    target.searchParams.set('style', id);
    return target.href;
  };
  const appointmentUrl = (style, concept) => {
    const target = new URL('pages/book-appointment.php', root);
    if (style) target.searchParams.set('style', style);
    if (concept) target.searchParams.set('concept', concept);
    return target.href;
  };
  const shell = (className = '') => make('div', `ci-shell ${className}`);
  const setImage = (host, source, title, priority = false) => {
    const safe = safeImage(source);
    if (safe) {
      const image = make('img');
      image.src = safe;
      image.alt = title || '';
      image.loading = priority ? 'eager' : 'lazy';
      image.decoding = 'async';
      host.appendChild(image);
    } else {
      host.appendChild(make('span', 'ci-image-fallback', 'IDEARE / CONCEPT'));
    }
  };
  const selectedStyle = styles => {
    const query = (new URLSearchParams(location.search).get('style') || '').trim().toLowerCase().replace(/\s+/g, '-');
    return styles.find(item => item.id === query || item.name.toLowerCase().replace(/\s+/g, '-') === query) || null;
  };

  function renderLanding(styles) {
    app.classList.add('ci-is-landing');
    const page = make('section', 'ci-landing');
    page.setAttribute('aria-labelledby', 'ci-landing-title');
    const content = shell();
    content.innerHTML = `
      <div class="ci-masthead">
        <a class="ci-back" href="${url('index.php#inspiration')}">← BACK TO HOMEPAGE</a>
        <span>IDEARE <span class="ci-gold">/</span> CABINET INSPIRATIONS</span>
      </div>
      <header class="ci-heading">
        <div>
          <p class="ci-kicker"><span class="ci-dot"></span> FIVE DESIGN DIRECTIONS</p>
          <h1 id="ci-landing-title">A space that feels <em>like you.</em></h1>
        </div>
        <p>Explore the styles, discover your favourite and find the details that make it yours.</p>
      </header>
      <div class="ci-orbit-area" aria-label="Explore cabinet inspiration styles">
        <div class="ci-orbit-frame" tabindex="0" aria-label="Rotating style carousel. Use mouse wheel, left or right arrow keys, or the controls below to browse.">
          <span class="ci-orbit-aura" aria-hidden="true"></span>
          <div class="ci-orbit-ring"></div>
        </div>
        <div class="ci-orbit-controls">
          <div class="ci-active-meta" aria-live="polite">
            <span class="ci-active-count"></span>
            <strong class="ci-active-title"></strong>
            <span class="ci-active-subtitle">SELECT A CARD TO EXPLORE THE STYLE</span>
          </div>
          <div class="ci-control-right">
            <span class="ci-wheel-hint">SCROLL TO ROTATE <span aria-hidden="true">↔</span></span>
            <button type="button" class="ci-arrow" data-ci-prev aria-label="Previous style">←</button>
            <button type="button" class="ci-arrow" data-ci-next aria-label="Next style">→</button>
          </div>
        </div>
      </div>
      <div class="ci-landing-bottom"><span>DESIGN <span class="ci-gold">·</span> BUILD <span class="ci-gold">·</span> CREATE</span><span>FIVE STYLES / ENDLESS POSSIBILITIES</span></div>`;
    page.appendChild(content);
    app.replaceChildren(page);

    const ring = content.querySelector('.ci-orbit-ring');
    const frame = content.querySelector('.ci-orbit-frame');
    const cards = [];
    styles.forEach((style, i) => {
      const anchor = make('a', 'ci-orbit-card');
      anchor.href = styleUrl(style.id);
      anchor.setAttribute('aria-label', `Explore ${style.name} inspirations`);
      anchor.style.setProperty('--ci-angle', `${i * (360 / styles.length)}deg`);
      anchor.style.setProperty('--ci-card-index', String(i));
      const face = make('span', 'ci-orbit-face');
      const photo = make('span', 'ci-orbit-image');
      setImage(photo, style.cover, `${style.name} interior cabinetry inspiration`, i === 0);
      const info = make('span', 'ci-orbit-card-info');
      info.append(make('strong', '', style.name), make('small', '', `${style.count || style.concepts.length} inspirations  ↗`));
      face.append(photo, info);
      anchor.appendChild(face);
      ring.appendChild(anchor);
      cards.push(anchor);
    });

    const count = content.querySelector('.ci-active-count');
    const title = content.querySelector('.ci-active-title');
    let step = 0;
    let hovered = false;
    let engagedUntil = 0;
    let inView = true;
    let wheelSum = 0;
    let lastWheel = 0;
    let start = null;
    const angle = 360 / styles.length;
    const normalized = i => ((i % styles.length) + styles.length) % styles.length;
    const slot = i => ((i - normalized(step) + styles.length + Math.floor(styles.length / 2)) % styles.length) - Math.floor(styles.length / 2);
    const paint = () => {
      ring.style.setProperty('--ci-rotation', `${-step * angle}deg`);
      count.textContent = `${String(normalized(step) + 1).padStart(2, '0')} / ${String(styles.length).padStart(2, '0')}`;
      title.textContent = styles[normalized(step)].name;
      cards.forEach((card, i) => {
        const d = slot(i);
        card.style.setProperty('--ci-slot', String(d));
        const spacingWide = Math.min(295, Math.max(125, (frame.clientWidth - card.offsetWidth) / 4));
        card.style.setProperty('--ci-x', `${(d * spacingWide).toFixed(1)}px`);
        card.style.setProperty('--ci-y', `${Math.abs(d) * 10}px`);
        card.style.setProperty('--ci-z', `${Math.abs(d) === 0 ? 95 : Math.abs(d) === 1 ? -25 : -145}px`);
        card.style.setProperty('--ci-tilt', `${-d * 18}deg`);
        card.style.setProperty('--ci-card-scale', Math.abs(d) === 0 ? '1' : Math.abs(d) === 1 ? '.94' : '.85');
        card.style.zIndex = String(10 - Math.abs(d));
        const spacing = Math.min(frame.clientWidth * .70, 270);
        card.style.setProperty('--ci-shift', `${(d * spacing).toFixed(1)}px`);
        card.style.setProperty('--ci-sway', `${-d * 22}deg`);
        card.style.setProperty('--ci-mobile-scale', d === 0 ? '1' : '.82');
        card.dataset.ciDistance = String(Math.abs(d));
        card.classList.toggle('ci-is-front', d === 0);
        if (d === 0) card.setAttribute('aria-current', 'true');
        else card.removeAttribute('aria-current');
      });
    };
    const turn = direction => {
      step += direction;
      engagedUntil = performance.now() + 8500;
      paint();
    };
    paint();
    window.addEventListener('resize', paint, { passive: true });
    content.querySelector('[data-ci-prev]').addEventListener('click', () => turn(-1));
    content.querySelector('[data-ci-next]').addEventListener('click', () => turn(1));

    // Wheel control only inside the carousel frame; ordinary page scrolling is untouched elsewhere.
    frame.addEventListener('wheel', event => {
      if (event.ctrlKey || event.metaKey) return; // preserve browser zoom gesture
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel > 260) wheelSum = 0;
      lastWheel = now;
      wheelSum += delta;
      if (Math.abs(wheelSum) < 38) return;
      turn(wheelSum > 0 ? 1 : -1);
      wheelSum = 0;
    }, { passive: false });

    frame.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        turn(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    frame.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') return;
      start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }, { passive: true });
    frame.addEventListener('pointerup', event => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      // On touch layouts a horizontal swipe navigates while vertical scroll remains native.
      turn(dx < 0 ? 1 : -1);
      frame.dataset.ciSwiped = 'true';
      setTimeout(() => { delete frame.dataset.ciSwiped; }, 350);
    }, { passive: true });
    frame.addEventListener('pointercancel', () => { start = null; });
    frame.addEventListener('click', event => {
      if (frame.dataset.ciSwiped && event.target.closest('a')) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    frame.addEventListener('pointerenter', () => { if (finePointer.matches) hovered = true; });
    frame.addEventListener('pointerleave', () => { hovered = false; });
    frame.addEventListener('focusin', () => { hovered = true; });
    frame.addEventListener('focusout', event => {
      if (!frame.contains(event.relatedTarget)) hovered = false;
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => { inView = !!entries[0]?.isIntersecting; }, { threshold: 0.15 });
      observer.observe(frame);
    }
    // A measured, one-step turn rather than an endless fast spin.
    if (!reduceMotion.matches) {
      setInterval(() => {
        if (!inView || hovered || document.hidden || reduceMotion.matches || performance.now() < engagedUntil) return;
        step += 1;
        paint();
      }, 4700);
    }
  }

  function createDetailsDialog() {
    const dialog = make('dialog', 'ci-dialog');
    dialog.setAttribute('aria-labelledby', 'ci-dialog-heading');
    dialog.innerHTML = `
      <div class="ci-dialog-inner">
        <button type="button" class="ci-dialog-close" aria-label="Close concept details">×</button>
        <div class="ci-dialog-photo"></div>
        <div class="ci-dialog-copy">
          <p class="ci-dialog-kicker"></p>
          <h2 id="ci-dialog-heading"></h2>
          <p class="ci-dialog-desc"></p>
          <div class="ci-dialog-actions">
            <a class="ci-dialog-consult" href="">Discuss this concept  ↗</a>
            <a class="ci-dialog-zoom" href="" target="_blank" rel="noopener" hidden>Open full photograph  ↗</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    const close = () => dialog.close();
    dialog.querySelector('.ci-dialog-close').addEventListener('click', close);
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    return (item, style) => {
      const photo = dialog.querySelector('.ci-dialog-photo');
      photo.replaceChildren();
      const src = safeImage(item.src);
      setImage(photo, src, item.title, true);
      dialog.querySelector('.ci-dialog-kicker').textContent = `${style} / ${item.room || 'CABINETRY'}`;
      dialog.querySelector('#ci-dialog-heading').textContent = item.title || 'Cabinet inspiration';
      dialog.querySelector('.ci-dialog-desc').textContent = item.description || `A ${style} concept designed to inspire a personalised ${String(item.room || 'cabinetry').toLowerCase()} project. Dimensions, materials and details can be tailored to your space.`;
      dialog.querySelector('.ci-dialog-consult').href = appointmentUrl(style, item.title);
      const zoom = dialog.querySelector('.ci-dialog-zoom');
      zoom.hidden = !src;
      if (src) zoom.href = src;
      dialog.showModal();
    };
  }

  function renderDetail(styles, initial) {
    app.classList.add('ci-is-detail');
    const section = make('section', 'ci-detail');
    section.setAttribute('aria-labelledby', 'ci-detail-title');
    const wrap = shell();
    section.appendChild(wrap);
    app.replaceChildren(section);
    const openDetails = createDetailsDialog();
    let style = initial;
    let room = 'All';

    const render = () => {
      const allRooms = ['All', 'Kitchen', 'Media Wall', 'Wardrobe'];
      const options = style.concepts.some(item => item.room === 'Other') ? [...allRooms, 'Other'] : allRooms;
      const shown = style.concepts.filter(item => room === 'All' || item.room === room);
      const existingExtras = wrap.querySelector('.ci-extras');
      wrap.replaceChildren();
      const masthead = make('nav', 'ci-detail-nav');
      masthead.setAttribute('aria-label', 'Inspiration navigation');
      const back = make('a', 'ci-back', '← ALL DESIGN STYLES');
      back.href = url('pages/inspiration.php');
      masthead.append(back, make('span', 'ci-detail-mast-label', 'IDEARE / CABINET INSPIRATIONS'));
      const header = make('header', 'ci-detail-heading');
      const headingCopy = make('div');
      headingCopy.append(make('p', 'ci-detail-eyebrow', 'DESIGN DIRECTION / ' + String(styles.indexOf(style) + 1).padStart(2, '0')));
      const h1 = make('h1', '', style.name);
      h1.id = 'ci-detail-title';
      headingCopy.append(h1, make('p', 'ci-detail-description', style.description));
      const tools = make('div', 'ci-detail-tools');
      const consult = make('a', 'ci-detail-consult', 'Start a project  ↗');
      consult.href = appointmentUrl(style.name, '');
      tools.append(make('span', '', `${style.count} concepts to explore`), consult);
      header.append(headingCopy, tools);
      const stylesNav = make('nav', 'ci-style-tabs');
      stylesNav.setAttribute('aria-label', 'Switch design style');
      styles.forEach(candidate => {
        const link = make('a', 'ci-style-tab', candidate.name);
        link.href = styleUrl(candidate.id);
        if (candidate.id === style.id) {
          link.classList.add('ci-selected');
          link.setAttribute('aria-current', 'page');
        }
        link.addEventListener('click', event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          if (style.id === candidate.id) return;
          style = candidate;
          room = 'All';
          history.pushState({ style: style.id }, '', styleUrl(style.id));
          render();
        });
        stylesNav.appendChild(link);
      });
      const filterbar = make('div', 'ci-gallery-bar');
      const filters = make('div', 'ci-room-filters');
      filters.setAttribute('aria-label', 'Filter by room');
      options.forEach(option => {
        const chip = make('button', 'ci-room-chip', option === 'All' ? 'All concepts' : option);
        chip.type = 'button';
        chip.classList.toggle('ci-selected', option === room);
        chip.setAttribute('aria-pressed', String(option === room));
        chip.addEventListener('click', () => { room = option; render(); });
        filters.appendChild(chip);
      });
      filterbar.append(filters, make('span', 'ci-gallery-result', `${shown.length} CONCEPT${shown.length === 1 ? '' : 'S'}`));
      const gallery = make('div', 'ci-detail-grid');
      shown.forEach((item, i) => {
        const card = make('button', 'ci-concept-card');
        card.type = 'button';
        card.setAttribute('aria-label', `View ${item.title} details`);
        const media = make('span', 'ci-concept-photo');
        setImage(media, item.src, `${item.title}, ${style.name} cabinetry concept`, i === 0);
        const info = make('span', 'ci-concept-overlay');
        info.append(make('small', '', item.room || 'INTERIORS'), make('strong', '', item.title), make('span', 'ci-concept-view', 'VIEW CONCEPT  ↗'));
        card.append(media, info);
        card.addEventListener('click', () => openDetails(item, style.name));
        gallery.appendChild(card);
      });
      if (!shown.length) gallery.appendChild(make('p', 'ci-no-results', 'No concepts in this category yet. Choose another room.'));
      const foot = make('div', 'ci-detail-bottom');
      const designer = make('a', '', 'Create your own in Cabinet Designer  ↗');
      designer.href = url('designer/index.php');
      foot.append(make('span', '', 'MADE TO FIT YOUR SPACE'), designer);
      wrap.append(masthead, header, stylesNav, filterbar, gallery, foot);
      if (existingExtras) wrap.appendChild(existingExtras);
    };
    render();
    window.addEventListener('popstate', () => {
      const found = selectedStyle(styles);
      if (!found) { location.reload(); return; }
      style = found;
      room = 'All';
      render();
    });
    mountPublished(wrap, openDetails);
  }

  async function mountPublished(wrap, openDetails) {
    // Keep staff-published inspiration projects, but in a compact disclosure.
    try {
      const response = await fetch(url('api/inspiration.php'), { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data.projects) || !data.projects.length) return;
      const extras = make('details', 'ci-extras');
      extras.appendChild(make('summary', '', `More IDEARE inspirations (${data.projects.length})`));
      const grid = make('div', 'ci-extras-grid');
      data.projects.forEach(item => {
        const card = make('button', 'ci-extra-card');
        card.type = 'button';
        const photo = make('span', 'ci-extra-photo');
        setImage(photo, item.cover?.src, item.title || 'Published IDEARE design');
        const info = make('span', 'ci-extra-copy');
        info.append(make('strong', '', item.title || 'Cabinet inspiration'), make('small', '', `${item.style || 'IDEARE'} · ${item.room || 'Cabinetry'}`));
        card.append(photo, info);
        card.addEventListener('click', () => openDetails({ title: item.title, description: item.description, room: item.room, src: item.cover?.src }, item.style || 'IDEARE'));
        grid.appendChild(card);
      });
      extras.appendChild(grid);
      wrap.appendChild(extras);
    } catch (_) {
      // Database-dependent extras are optional; curated Concepts are independent.
    }
  }

  async function start() {
    try {
      const response = await fetch(url('api/concepts.php'), { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const styles = Array.isArray(data.styles) ? data.styles.filter(s => s && typeof s.id === 'string' && typeof s.name === 'string' && Array.isArray(s.concepts)) : [];
      if (!styles.length) throw new Error('No design styles found');
      const active = selectedStyle(styles);
      if (active) renderDetail(styles, active); else renderLanding(styles);
    } catch (error) {
      console.warn('IDEARE Inspiration: gallery unavailable', error);
      const message = make('div', 'ci-shell ci-loading');
      message.append(make('p', '', 'IDEARE / CABINET INSPIRATION'), make('h1', '', 'Designs are temporarily unavailable.'), make('p', '', 'The concepts could not be loaded. You can return to the homepage or try again later.'));
      const back = make('a', '', '← Back to homepage');
      back.href = url('index.php#inspiration');
      message.append(back);
      app.replaceChildren(message);
    }
  }
  start();
})();
