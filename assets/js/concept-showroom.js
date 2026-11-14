/**
 * IDEARE Cabinet Inspiration / style-first showroom.
 * Supports the separate Concepts folder feed while retaining database-published
 * designs in a secondary section of the full showroom.
 */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || !script.src) return;
  const homepage = document.getElementById('inspiration');
  const pageMount = document.querySelector('[data-inspiration-page="all"]');
  if (!homepage && !pageMount) return;

  const rootUrl = new URL('../../', script.src);
  const siteUrl = path => new URL(path, rootUrl).href;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const styleSheet = document.createElement('link');
  styleSheet.rel = 'stylesheet';
  styleSheet.href = new URL('../css/concept-showroom.css', script.src).href;
  styleSheet.dataset.conceptShowroom = 'styles';
  document.head.appendChild(styleSheet);

  const element = (tag, className, value) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined && value !== null) el.textContent = String(value);
    return el;
  };
  const button = (className, value) => {
    const el = element('button', className, value);
    el.type = 'button';
    return el;
  };
  const safeUrl = value => {
    if (!value || typeof value !== 'string') return '';
    try {
      const parsed = new URL(value, rootUrl);
      return (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? parsed.href : '';
    } catch (_) { return ''; }
  };
  const stylePath = id => {
    const url = new URL('pages/inspiration.php', rootUrl);
    url.searchParams.set('style', id);
    return url.href;
  };
  const bookingPath = (style, concept) => {
    const url = new URL('pages/book-appointment.php', rootUrl);
    if (style) url.searchParams.set('style', style);
    if (concept) url.searchParams.set('concept', concept);
    return url.href;
  };

  const art = (src, title, variant, eager = false) => {
    const wrap = element('span', `cs-art cs-art-${variant}`);
    const url = safeUrl(src);
    if (url) {
      const img = element('img', 'cs-art-image');
      img.src = url;
      img.alt = title;
      img.loading = eager ? 'eager' : 'lazy';
      img.decoding = 'async';
      wrap.appendChild(img);
    } else {
      const placeholder = element('span', 'cs-art-empty');
      placeholder.append(
        element('span', 'cs-art-mark', 'IDEARE'),
        element('span', 'cs-art-message', 'Photography coming soon')
      );
      wrap.appendChild(placeholder);
    }
    return wrap;
  };

  function renderHomepage(styles) {
    if (!homepage) return;
    const shell = element('div', 'cs-home cs-shell site-wrap');
    const intro = element('header', 'cs-home-intro');
    const copy = element('div', 'cs-home-intro-copy');
    copy.append(
      element('p', 'cs-eyebrow', 'IDEARE  /  CABINET INSPIRATION'),
      element('h2', 'cs-display', 'Designed around your way of living.'),
      element('p', 'cs-lead', 'Discover cabinetry ideas through five distinctive styles. Find a look you love, then explore how it can shape your home.')
    );
    const explore = element('a', 'cs-text-link', 'Explore all inspirations  ↗');
    explore.href = siteUrl('pages/inspiration.php');
    intro.append(copy, explore);

    const rail = element('div', 'cs-home-rail');
    rail.setAttribute('aria-label', 'Cabinet design style collections');
    styles.forEach(style => {
      const card = element('a', 'cs-style-card cs-style-card-home');
      card.href = stylePath(style.id);
      card.setAttribute('aria-label', `Explore ${style.name} cabinetry inspirations`);
      card.appendChild(art(style.cover, `${style.name} cabinet inspiration`, 'style'));
      const info = element('span', 'cs-style-info');
      info.append(
        element('strong', 'cs-style-name', style.name),
        element('span', 'cs-style-action', 'Explore style  ↗')
      );
      card.append(info);
      rail.appendChild(card);
    });

    const mobileControls = element('div', 'cs-rail-controls');
    const prev = button('cs-rail-arrow', '←');
    const next = button('cs-rail-arrow', '→');
    prev.setAttribute('aria-label', 'Previous design styles');
    next.setAttribute('aria-label', 'Next design styles');
    prev.addEventListener('click', () => rail.scrollBy({ left: -rail.clientWidth * 0.78, behavior: reducedMotion.matches ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * 0.78, behavior: reducedMotion.matches ? 'auto' : 'smooth' }));
    mobileControls.append(prev, next);

    const footer = element('p', 'cs-home-footnote', 'Five design directions. Endless possibilities.');
    shell.append(intro, rail, mobileControls, footer);
    homepage.replaceChildren(shell);
    homepage.classList.add('cs-home-section');
    homepage.setAttribute('aria-label', 'Cabinet inspiration styles');
  }

  // One accessible overlay shared by both the style concepts and legacy published designs.
  function createDialog() {
    const overlay = element('div', 'cs-modal');
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="cs-modal-backdrop" data-cs-close="true"></div>
      <div class="cs-dialog" role="dialog" aria-modal="true" aria-labelledby="cs-dialog-title" tabindex="-1">
        <button type="button" class="cs-dialog-close" aria-label="Close concept details" data-cs-close="true">×</button>
        <div class="cs-dialog-main">
          <div class="cs-dialog-media">
            <button type="button" class="cs-dialog-zoom" aria-label="Expand concept photograph"></button>
            <div class="cs-dialog-thumbnails" aria-label="Additional photographs"></div>
          </div>
          <div class="cs-dialog-copy">
            <p class="cs-eyebrow cs-dialog-kicker"></p>
            <h2 id="cs-dialog-title"></h2>
            <p class="cs-dialog-description"></p>
            <div class="cs-dialog-tags"></div>
            <a class="cs-consult-link" href="">Book a consultation  ↗</a>
            <a class="cs-designer-link" href="" hidden>Open in Cabinet Designer  ↗</a>
            <p class="cs-dialog-note">A source of inspiration — dimensions and finishes can be discussed with the IDEARE team.</p>
          </div>
        </div>
      </div>
      <div class="cs-lightbox" hidden role="dialog" aria-modal="true" aria-label="Expanded inspiration photograph" tabindex="-1">
        <button type="button" class="cs-lightbox-close" aria-label="Close expanded photograph">×</button>
        <img alt="" />
      </div>`;
    document.body.appendChild(overlay);
    const dialog = overlay.querySelector('.cs-dialog');
    const lightbox = overlay.querySelector('.cs-lightbox');
    const mainImage = overlay.querySelector('.cs-dialog-zoom');
    let open = false;
    let imageOpen = false;
    let previousFocus = null;
    let imageFocus = null;
    let activeImages = [];
    let activeIndex = 0;

    const updateImage = index => {
      activeIndex = index;
      const photo = activeImages[index];
      mainImage.replaceChildren();
      mainImage.disabled = !photo;
      if (photo) {
        const img = element('img');
        img.src = photo.src;
        img.alt = photo.alt;
        img.decoding = 'async';
        mainImage.appendChild(img);
        mainImage.setAttribute('aria-label', `Expand photograph: ${photo.alt}`);
      } else {
        const empty = element('span', 'cs-modal-image-empty');
        empty.append(element('span', '', 'IDEARE'), element('strong', '', 'Concept photography coming soon'));
        mainImage.appendChild(empty);
      }
      const tray = overlay.querySelector('.cs-dialog-thumbnails');
      tray.replaceChildren();
      if (activeImages.length < 2) {
        tray.hidden = true;
      } else {
        tray.hidden = false;
        activeImages.forEach((candidate, i) => {
          const thumb = button('cs-dialog-thumbnail');
          thumb.classList.toggle('is-active', i === index);
          thumb.setAttribute('aria-label', `View image ${i + 1} of ${activeImages.length}`);
          const img = element('img');
          img.src = candidate.src;
          img.alt = '';
          img.loading = 'lazy';
          thumb.appendChild(img);
          thumb.addEventListener('click', () => updateImage(i));
          tray.appendChild(thumb);
        });
      }
    };

    const closeLightbox = () => {
      if (!imageOpen) return;
      imageOpen = false;
      lightbox.hidden = true;
      dialog.inert = false;
      overlay.querySelector('.cs-lightbox img').removeAttribute('src');
      if (imageFocus && imageFocus.isConnected) imageFocus.focus();
      imageFocus = null;
    };
    const close = () => {
      if (!open) return;
      closeLightbox();
      open = false;
      overlay.hidden = true;
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      previousFocus = null;
    };
    const openImage = () => {
      const selected = activeImages[activeIndex];
      if (!selected || !open) return;
      imageFocus = document.activeElement;
      dialog.inert = true;
      const img = overlay.querySelector('.cs-lightbox img');
      img.src = selected.src;
      img.alt = selected.alt;
      lightbox.hidden = false;
      imageOpen = true;
      overlay.querySelector('.cs-lightbox-close').focus();
    };

    overlay.addEventListener('click', event => {
      if (event.target.closest('[data-cs-close]')) close();
      if (event.target === lightbox || event.target.closest('.cs-lightbox-close')) closeLightbox();
    });
    mainImage.addEventListener('click', openImage);
    const trap = (event, scope) => {
      const focusables = [...scope.querySelectorAll('button:not(:disabled),a[href]')]
        .filter(el => !el.hidden && !el.closest('[hidden]') && !el.closest('[inert]'));
      if (!focusables.length) { event.preventDefault(); scope.focus(); return; }
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', event => {
      if (!open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (imageOpen) closeLightbox(); else close();
      } else if (event.key === 'Tab') trap(event, imageOpen ? lightbox : dialog);
    });

    return {
      open(item, trigger) {
        previousFocus = trigger || document.activeElement;
        const style = item.style || 'IDEARE';
        const room = item.room || 'Cabinetry';
        overlay.querySelector('.cs-dialog-kicker').textContent = `${style}  /  ${room}`;
        overlay.querySelector('#cs-dialog-title').textContent = item.title || 'Cabinet inspiration';
        overlay.querySelector('.cs-dialog-description').textContent = item.description || `Explore this ${style} cabinetry concept for your ${room.toLowerCase()} space.`;
        const tags = overlay.querySelector('.cs-dialog-tags');
        tags.replaceChildren();
        [room, style].forEach(tag => tags.appendChild(element('span', 'cs-dialog-pill', tag)));
        const consult = overlay.querySelector('.cs-consult-link');
        consult.href = bookingPath(style, item.title);
        const designerLink = overlay.querySelector('.cs-designer-link');
        const designerUrl = safeUrl(item.designerUrl);
        designerLink.hidden = !(item.hasBaseDesign && designerUrl);
        if (!designerLink.hidden) designerLink.href = designerUrl;
        // Query parameters are passed to the booking URL; the booking form will
        // use them only when its own prefill feature is implemented.
        activeImages = (item.photos || [])
          .map(photo => ({ src: safeUrl(photo.src), alt: photo.label || item.title }))
          .filter(photo => photo.src);
        if (!activeImages.length && safeUrl(item.src)) {
          activeImages = [{ src: safeUrl(item.src), alt: item.title }];
        }
        updateImage(0);
        overlay.hidden = false;
        open = true;
        overlay.querySelector('.cs-dialog-close').focus();
      }
    };
  }

  function createStyleSelector(styles, state, select) {
    const list = element('div', 'cs-page-style-list');
    list.setAttribute('aria-label', 'Choose an interior style');
    styles.forEach(style => {
      const card = button('cs-style-card cs-style-card-selector');
      const active = style.id === state.style;
      card.classList.toggle('is-selected', active);
      card.setAttribute('aria-pressed', String(active));
      card.setAttribute('aria-label', `View ${style.name} inspiration concepts`);
      card.appendChild(art(style.cover, `${style.name} cabinetry style`, 'style'));
      card.appendChild(element('strong', 'cs-style-name', style.name));
      card.addEventListener('click', () => select(style.id));
      list.appendChild(card);
    });
    return list;
  }

  function createConceptCard(concept, style, dialog) {
    const card = button('cs-concept-card');
    card.appendChild(art(concept.src, concept.title, 'concept'));
    const info = element('span', 'cs-concept-info');
    info.append(
      element('small', 'cs-concept-room', concept.room),
      element('strong', 'cs-concept-name', concept.title),
      element('span', 'cs-concept-action', concept.src ? 'View concept  ↗' : 'Preview details  ↗')
    );
    card.appendChild(info);
    card.setAttribute('aria-label', `View ${concept.title} details`);
    card.addEventListener('click', () => dialog.open({
      title: concept.title,
      room: concept.room,
      style: style.name,
      src: concept.src,
    }, card));
    return card;
  }

  function renderPage(styles, dialog) {
    if (!pageMount) return;
    const readStyle = () => {
      const value = new URLSearchParams(window.location.search).get('style');
      const normal = String(value || '').trim().toLocaleLowerCase().replace(/\s+/g, '-');
      const match = styles.find(s => s.id === normal || s.name.toLocaleLowerCase().replace(/\s+/g, '-') === normal);
      return match ? match.id : styles[0].id;
    };
    const state = { style: readStyle(), room: 'All' };
    const shell = element('div', 'cs-page-showroom cs-shell site-wrap');
    const label = element('h2', 'cs-page-section-label', 'Choose a design style');
    const selector = element('div', 'cs-selector-slot');
    const collection = element('section', 'cs-collection');
    collection.id = 'concept-gallery';
    collection.setAttribute('aria-label', 'Selected style concepts');
    shell.append(label, selector, collection);
    pageMount.replaceWith(shell);

    function renderSelector() {
      selector.replaceChildren(createStyleSelector(styles, state, chooseStyle));
    }
    function chooseStyle(id) {
      if (id === state.style) {
        collection.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      state.style = id;
      state.room = 'All';
      const url = new URL(window.location.href);
      url.searchParams.set('style', id);
      window.history.pushState({ conceptStyle: id }, '', url);
      renderSelector();
      renderCollection();
      collection.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
    function renderCollection() {
      collection.replaceChildren();
      const style = styles.find(s => s.id === state.style) || styles[0];
      const head = element('header', 'cs-collection-head');
      const copy = element('div');
      copy.append(
        element('p', 'cs-eyebrow', 'NOW EXPLORING'),
        element('h2', 'cs-collection-title', style.name),
        element('p', 'cs-collection-description', style.description)
      );
      const count = element('span', 'cs-count', `${style.count} concept${style.count === 1 ? '' : 's'}`);
      head.append(copy, count);
      const filters = element('div', 'cs-filters');
      filters.setAttribute('aria-label', 'Filter cabinet concepts by room');
      const options = ['All', 'Kitchen', 'Media Wall', 'Wardrobe'];
      if (style.concepts.some(item => item.room === 'Other')) options.push('Other');
      options.forEach(room => {
        const chip = button('cs-filter', room === 'All' ? 'All designs' : room);
        chip.classList.toggle('is-active', state.room === room);
        chip.setAttribute('aria-pressed', String(state.room === room));
        chip.addEventListener('click', () => { state.room = room; renderCollection(); });
        filters.appendChild(chip);
      });
      const visible = style.concepts.filter(item => state.room === 'All' || item.room === state.room);
      const grid = element('div', 'cs-concept-grid');
      visible.forEach(item => grid.appendChild(createConceptCard(item, style, dialog)));
      if (!visible.length) grid.appendChild(element('p', 'cs-empty-result', 'No concepts in this room category yet. Try another filter.'));
      const status = element('p', 'cs-availability');
      status.setAttribute('aria-live', 'polite');
      if (style.availableImages < style.count) {
        status.textContent = `${style.availableImages} of ${style.count} concept photos uploaded. More photos will appear here automatically when added to the Concepts folder.`;
      } else {
        status.textContent = `${visible.length} concept${visible.length === 1 ? '' : 's'} to explore.`;
      }
      collection.append(head, filters, grid, status);
    }
    renderSelector();
    renderCollection();
    window.addEventListener('popstate', () => {
      state.style = readStyle();
      state.room = 'All';
      renderSelector();
      renderCollection();
    });
    // Keep current database-driven inspirations available alongside the new
    // curated Concepts folders, without mixing the two collections.
    mountPublishedDesigns(shell, dialog);
  }

  async function mountPublishedDesigns(shell, dialog) {
    try {
      const response = await fetch(siteUrl('api/inspiration.php'), { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data.projects) || !data.projects.length) return;
      const section = element('section', 'cs-published');
      const fold = element('details', 'cs-published-details');
      const summary = element('summary', '', `More IDEARE inspirations (${data.projects.length})`);
      const intro = element('p', 'cs-published-intro', 'Explore additional published ideas from the IDEARE design collection.');
      const grid = element('div', 'cs-published-grid');
      data.projects.forEach(project => {
        const card = button('cs-published-card');
        const cover = project.cover?.src || '';
        card.append(art(cover, project.title || 'IDEARE design', 'published'));
        const info = element('span', 'cs-published-info');
        info.append(element('strong', '', project.title || 'Cabinet design'), element('small', '', `${project.style || 'IDEARE'} / ${project.room || 'Cabinetry'}`));
        card.appendChild(info);
        card.addEventListener('click', () => dialog.open({
          title: project.title,
          style: project.style,
          room: project.room,
          description: project.description,
          src: cover,
          photos: Array.isArray(project.photos) ? project.photos : [],
          designerUrl: project.designerUrl,
          hasBaseDesign: project.hasBaseDesign,
        }, card));
        grid.appendChild(card);
      });
      fold.append(summary, intro, grid);
      section.appendChild(fold);
      shell.appendChild(section);
    } catch (_) {
      // The separate staff database may be unavailable; the folder-driven
      // Concepts collection remains fully functional.
    }
  }

  async function start() {
    try {
      const response = await fetch(siteUrl('api/concepts.php'), { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Concept feed returned HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.styles) || !data.styles.length) throw new Error('No concept styles found');
      const styles = data.styles.filter(item => item && typeof item.id === 'string' && Array.isArray(item.concepts));
      if (!styles.length) throw new Error('No usable style collections');
      if (homepage && !pageMount) renderHomepage(styles);
      if (pageMount) renderPage(styles, createDialog());
    } catch (error) {
      console.warn('IDEARE Concepts showroom is temporarily unavailable:', error);
      // Keep the server-rendered homepage content as the fallback.
      if (pageMount) {
        const label = pageMount.querySelector('.ic-loading-message');
        if (label) label.textContent = 'Cabinet inspirations are temporarily unavailable. Please refresh or return later.';
      }
    }
  }
  start();
})();
