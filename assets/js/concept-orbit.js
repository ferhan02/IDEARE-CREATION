/**
 * IDEARE Cabinet Inspiration | compact 3D orbit / style detail showroom.
 * All images and concept metadata are supplied by the existing folder-driven API.
 * Homepage orbit and style-specific inspiration collections only.
 */
(() => {
  'use strict';
  const app = document.getElementById('ci-app');
  const script = document.currentScript;
  const isHome = document.documentElement.dataset.idearePage === 'home';
  if ((!app && !isHome) || !script?.src) return;

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

  /** One shared, genuine circular 3D orbit for the homepage and showroom landing. */
  function renderLanding(styles, isHome = false) {
    let mount = app;
    if (isHome) {
      mount = document.getElementById('inspiration');
      if (!mount) {
        mount = make('section');
        mount.id = 'inspiration';
      }
      // Keep Inspiration directly after Portfolio even if server-side featured
      // records are empty. Replace only the former homepage inspiration section.
      const portfolio = document.getElementById('portfolio');
      const materials = document.getElementById('materials-overview');
      if (portfolio?.parentElement && portfolio.nextElementSibling !== mount) {
        portfolio.insertAdjacentElement('afterend', mount);
      } else if (!mount.isConnected && materials?.parentElement) {
        materials.insertAdjacentElement('beforebegin', mount);
      } else if (!mount.isConnected) {
        document.querySelector('main')?.appendChild(mount);
      }
      mount.className = 'home-section ci-home-section';
    } else {
      mount.classList.add('ci-is-landing');
    }

    const total = styles.length;
    const page = make('section', `ci-landing${isHome ? ' ci-home-landing' : ''}`);
    page.setAttribute('aria-labelledby', isHome ? 'ci-home-title' : 'ci-landing-title');
    const content = shell();
    const eyebrow = `DESIGN DIRECTION${total === 1 ? '' : 'S'}`;
    content.innerHTML = `
      <div class="ci-masthead">
        ${isHome ? '<span>IDEARE <span class="ci-gold">/</span> CABINET INSPIRATION</span><span>CHOOSE A STYLE TO DISCOVER MORE</span>' : '<a class="ci-back" href="' + url('index.php#inspiration') + '">← BACK TO HOMEPAGE</a><span>IDEARE <span class="ci-gold">/</span> CABINET INSPIRATIONS</span>'}
      </div>
      <header class="ci-heading">
        <div>
          <p class="ci-kicker"><span class="ci-dot"></span><span class="ci-direction-count"></span></p>
          <h${isHome ? '2' : '1'} id="${isHome ? 'ci-home-title' : 'ci-landing-title'}">A space that feels <em>like you.</em></h${isHome ? '2' : '1'}>
        </div>
        <p>Explore the styles, discover your favourite and find the details that make it yours.</p>
      </header>
      <div class="ci-orbit-area">
        <div class="ci-orbit-frame" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Rotating cabinet inspiration styles. Scroll over the gallery, drag, swipe or use the arrows to rotate.">
          <span class="ci-orbit-aura" aria-hidden="true"></span>
          <span class="ci-orbit-track" aria-hidden="true"></span>
          <div class="ci-orbit-ring"></div>
        </div>
        <div class="ci-orbit-controls">
          <div class="ci-active-meta" aria-live="polite" aria-atomic="true">
            <strong class="ci-active-title"></strong>
            <span class="ci-active-subtitle">SELECT A STYLE TO EXPLORE ITS CONCEPTS</span>
          </div>
          <div class="ci-control-right">
            <span class="ci-wheel-hint">SCROLL / DRAG TO ROTATE <span aria-hidden="true">↔</span></span>
            <button type="button" class="ci-arrow" data-ci-prev aria-label="Previous design style">←</button>
            <button type="button" class="ci-arrow" data-ci-next aria-label="Next design style">→</button>
          </div>
        </div>
      </div>
      <div class="ci-landing-bottom"><span>DESIGN <span class="ci-gold">·</span> BUILD <span class="ci-gold">·</span> CREATE</span><span>ENDLESS POSSIBILITIES</span></div>`;
    content.querySelector('.ci-direction-count').textContent = eyebrow;
    page.appendChild(content);
    mount.replaceChildren(page);

    const ring = content.querySelector('.ci-orbit-ring');
    const frame = content.querySelector('.ci-orbit-frame');
    const cards = styles.map((style, index) => {
      const anchor = make('a', 'ci-orbit-card');
      anchor.href = styleUrl(style.id);
      anchor.setAttribute('aria-label', `Explore ${style.name}: ${style.count ?? style.concepts?.length ?? 0} inspirations`);
      anchor.dataset.ciIndex = String(index);
      const depth = make('span', 'ci-orbit-depth');
      depth.setAttribute('aria-hidden', 'true');
      const face = make('span', 'ci-orbit-face');
      const shine = make('span', 'ci-orbit-shine');
      shine.setAttribute('aria-hidden', 'true');
      const photo = make('span', 'ci-orbit-image');
      setImage(photo, style.cover, `${style.name} cabinetry inspiration`, index < 3);
      const info = make('span', 'ci-orbit-card-info');
      info.append(make('strong', '', style.name), make('small', '', 'Explore style ↗'));
      face.append(photo, shine, info);
      anchor.append(depth, face);
      ring.appendChild(anchor);
      return anchor;
    });

    const title = content.querySelector('.ci-active-title');
    const TAU = Math.PI * 2;
    const normalize = index => ((index % total) + total) % total;
    let position = 0;       // continuous fractional position, not snapped chapters
    let target = null;
    let previousFrame = 0;
    let lastActive = -1;
    let viewable = true;
    let hovering = false;
    let focused = false;
    let pauseUntil = 0;
    let gesture = null;
    let suppressClick = false;
    let suppressTimer = 0;
    let frameWidth = 0, frameHeight = 0, cardWidth = 0;
    const autoSpeed = total / 43; // one smooth revolution approximately every 43s

    function updateDimensions() {
      const rect = frame.getBoundingClientRect();
      frameWidth = rect.width;
      frameHeight = rect.height;
      cardWidth = cards[0]?.offsetWidth || 270;
    }
    const pause = (duration = 2200) => { pauseUntil = performance.now() + duration; };
    const activeIndex = () => normalize(Math.round(position));
    function updateMeta() {
      const active = activeIndex();
      if (active === lastActive) return;
      lastActive = active;
      title.textContent = styles[active].name;
      cards.forEach((card, index) => {
        if (index === active) card.setAttribute('aria-current', 'true');
        else card.removeAttribute('aria-current');
      });
    }
    function draw() {
      if (!frameWidth) updateDimensions();
      const mobile = frameWidth <= 700;
      const radiusX = Math.max(30, (frameWidth - cardWidth) * (mobile ? .43 : .47));
      const radiusY = mobile ? Math.min(30, frameHeight * .08) : Math.min(58, frameHeight * .13);
      const radiusZ = mobile ? 100 : 210;
      cards.forEach((card, index) => {
        const theta = (index - position) * TAU / total;
        const depth = (1 + Math.cos(theta)) / 2; // front=1, back=0
        const x = Math.sin(theta) * radiusX;
        const y = (Math.cos(theta) * radiusY * .34) - ((1 - depth) * radiusY * .9);
        const z = Math.cos(theta) * radiusZ;
        const scale = (mobile ? .72 : .64) + depth * (mobile ? .24 : .28);
        const yaw = -Math.sin(theta) * (mobile ? 31 : 46);
        card.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px),calc(-50% + ${y.toFixed(2)}px),${z.toFixed(2)}px) rotateY(${yaw.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        card.style.opacity = '1';
        card.style.zIndex = String(10 + Math.round(depth * 80));
        card.style.setProperty('--ci-depth-shade', '0');
      });
      updateMeta();
    }
    function next(direction) {
      pause(4200);
      target = Math.round(target ?? position) + direction;
      if (reduceMotion.matches) { position = target; target = null; draw(); }
    }
    function tick(time) {
      const dt = previousFrame ? Math.min(.055, (time - previousFrame) / 1000) : 0;
      previousFrame = time;
      if (target !== null) {
        const diff = target - position;
        if (reduceMotion.matches || Math.abs(diff) < .002) { position = target; target = null; }
        else position += diff * (1 - Math.exp(-dt * 8.2));
      } else if (!reduceMotion.matches && viewable && !hovering && !focused && !document.hidden && time > pauseUntil) {
        position += autoSpeed * dt;
      }
      if (viewable && !document.hidden) draw();
      requestAnimationFrame(tick);
    }
    content.querySelector('[data-ci-prev]').addEventListener('click', () => next(-1));
    content.querySelector('[data-ci-next]').addEventListener('click', () => next(1));

    frame.addEventListener('wheel', event => {
      if (event.ctrlKey || event.metaKey) return;
      const raw = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!raw) return;
      event.preventDefault();
      const pixels = event.deltaMode === 1 ? raw * 18 : event.deltaMode === 2 ? raw * frameHeight : raw;
      const amount = Math.sign(pixels) * Math.min(1.2, Math.max(.065, Math.abs(pixels) / 290));
      target = (target ?? position) + amount;
      pause(3100);
      if (reduceMotion.matches) { position = target; target = null; draw(); }
    }, { passive: false });
    frame.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      next(event.key === 'ArrowRight' ? 1 : -1);
    });

    frame.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button')) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, initial: position, moved: false };
      pause(4400);
    });
    frame.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.moved && Math.abs(dx) < 8) return;
      if (!gesture.moved && Math.abs(dx) < Math.abs(dy) * 1.2) return; // native vertical touch scroll
      gesture.moved = true;
      target = gesture.initial - dx / Math.max(110, cardWidth * .75);
      pause(4000);
      if (reduceMotion.matches) { position = target; target = null; draw(); }
    });
    const finish = event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const moved = gesture.moved;
      gesture = null;
      if (!moved) return;
      suppressClick = true;
      clearTimeout(suppressTimer);
      suppressTimer = setTimeout(() => { suppressClick = false; }, 500);
      if (target !== null) target = Math.round(target);
      pause(4500);
    };
    frame.addEventListener('pointerup', finish);
    frame.addEventListener('pointercancel', event => { if (gesture?.id === event.pointerId) gesture = null; });
    frame.addEventListener('click', event => {
      if (!suppressClick || !event.target.closest('a')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }, true);

    frame.addEventListener('pointerenter', () => { if (finePointer.matches) hovering = true; });
    frame.addEventListener('pointerleave', () => { hovering = false; });
    frame.addEventListener('focusin', () => { focused = true; });
    frame.addEventListener('focusout', event => { if (!frame.contains(event.relatedTarget)) focused = false; });
    cards.forEach((card, index) => {
      const face = card.querySelector('.ci-orbit-face');
      card.addEventListener('focus', () => {
        const nearest = index + Math.round((position - index) / total) * total;
        target = nearest;
        pause(4800);
      });
      card.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse' || !finePointer.matches) return;
        const rect = face.getBoundingClientRect();
        const u = (event.clientX - rect.left) / Math.max(1, rect.width) - .5;
        const v = (event.clientY - rect.top) / Math.max(1, rect.height) - .5;
        face.style.setProperty('--ci-pointer-ry', `${(u * 13).toFixed(1)}deg`);
        face.style.setProperty('--ci-pointer-rx', `${(-v * 11).toFixed(1)}deg`);
        face.style.setProperty('--ci-light-x', `${((u + .5) * 100).toFixed(1)}%`);
        face.style.setProperty('--ci-light-y', `${((v + .5) * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        face.style.removeProperty('--ci-pointer-ry');
        face.style.removeProperty('--ci-pointer-rx');
      });
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { viewable = !!entries[0]?.isIntersecting; }, { threshold: .08 }).observe(frame);
    }
    window.addEventListener('resize', () => { updateDimensions(); draw(); }, { passive: true });
    updateDimensions();
    draw();
    requestAnimationFrame(tick);
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
      back.href = url('index.php#inspiration');
      masthead.append(back, make('span', 'ci-detail-mast-label', 'IDEARE / CABINET INSPIRATIONS'));
      const header = make('header', 'ci-detail-heading');
      const headingCopy = make('div');
      headingCopy.append(make('p', 'ci-detail-eyebrow', 'DESIGN DIRECTION'));
      const h1 = make('h1', '', style.name);
      h1.id = 'ci-detail-title';
      headingCopy.append(h1, make('p', 'ci-detail-description', style.description));
      const tools = make('div', 'ci-detail-tools');
      const consult = make('a', 'ci-detail-consult', 'Start a project  ↗');
      consult.href = appointmentUrl(style.name, '');
      tools.append(make('span', '', 'Explore the collection'), consult);
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
      if (isHome) renderLanding(styles, true);
      else if (app && active) renderDetail(styles, active);
      else if (app) window.location.replace(url('index.php#inspiration'));
    } catch (error) {
      console.warn('IDEARE Inspiration: gallery unavailable', error);
      const message = make('div', 'ci-shell ci-loading');
      message.append(make('p', '', 'IDEARE / CABINET INSPIRATION'), make('h1', '', 'Designs are temporarily unavailable.'), make('p', '', 'The concepts could not be loaded. You can return to the homepage or try again later.'));
      const back = make('a', '', '← Back to homepage');
      back.href = url('index.php#inspiration');
      message.append(back);
      if (app) app.replaceChildren(message); // On the homepage, retain existing fallback content.
    }
  }
  start();
})();
