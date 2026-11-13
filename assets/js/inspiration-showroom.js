/**
 * IDEARE / Hybrid inspiration showroom
 * - All content comes from the existing published inspiration records.
 * - Homepage shows a curated interactive feature; /pages/inspiration.php adds a grid.
 * - Device-specific interaction modules are mounted on viewport changes.
 * - Project detail and photograph viewer use accessible, separate modal layers.
 */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script?.src) return;

  const asset = path => new URL(path, script.src).href;
  const homePage = document.documentElement.dataset.idearePage === 'home';
  const pageTarget = document.querySelector('[data-inspiration-page="all"]');
  if (!homePage && !pageTarget) return;
  const apiUrl = asset('../../api/inspiration.php');
  const allUrl = asset('../../pages/inspiration.php');
  const genericDesignerUrl = asset('../../designer/index.php');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1200px)');
  const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1199px)');
  const cssFiles = [
    ['../css/inspiration-showroom.css', null],
    ['../css/responsive/inspiration-desktop.css', '(min-width: 1200px)'],
    ['../css/responsive/inspiration-tablet.css', '(min-width: 768px) and (max-width: 1199px)'],
    ['../css/responsive/inspiration-phone.css', '(max-width: 767px)']
  ];
  for (const [file, media] of cssFiles) {
    if (document.querySelector(`link[data-ic-styles="${file}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = asset(file);
    link.dataset.icStyles = file;
    if (media) link.media = media;
    document.head.appendChild(link);
  }

  const safeUrl = value => {
    try {
      const parsed = new URL(String(value || ''), document.baseURI);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : '';
    } catch (_) { return ''; }
  };
  const text = (el, value) => { el.textContent = String(value ?? ''); return el; };
  const el = (tag, className, content) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (content !== undefined) text(item, content);
    return item;
  };
  const humanRoom = value => String(value || 'Custom cabinetry').trim();
  const isSameRoom = (a, b) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

  function buildShell(mode) {
    const root = el('section', 'ic-showroom');
    root.dataset.icMode = mode;
    root.id = 'inspiration';
    root.setAttribute('aria-labelledby', 'ic-heading');
    root.innerHTML = `
      <div class="ic-shell site-wrap">
        <header class="ic-intro ic-appear">
          <div class="ic-intro-copy">
            <p class="ic-eyebrow"><span class="ic-eyebrow-line"></span> IDEARE / CABINET INSPIRATIONS</p>
            <h2 id="ic-heading">Designed to inspire.<em> Made for you.</em></h2>
            <p class="ic-intro-desc">Discover cabinetry concepts for every room. Choose a starting point, explore its details and make it your own.</p>
          </div>
          <a class="ic-browse-link" href="${allUrl}"><span>Explore all inspirations</span><span aria-hidden="true">↗</span></a>
        </header>
        <div class="ic-filter-bar ic-appear">
          <div class="ic-filters" aria-label="Filter designs by room"></div>
          <span class="ic-results" aria-live="polite"></span>
        </div>
        <div class="ic-stage ic-appear">
          <div class="ic-hero">
            <button class="ic-hero-media" type="button" data-ic-action="details" aria-label="View cabinet design details">
              <img class="ic-hero-image" alt="" decoding="async" />
              <span class="ic-placeholder" hidden aria-hidden="true"><span class="ic-placeholder-geometry"></span><small>DESIGN VISUAL COMING SOON</small></span>
              <span class="ic-hero-corner">IDEARE / DESIGN STUDIES</span>
              <span class="ic-image-view">Explore concept <span aria-hidden="true">↗</span></span>
            </button>
            <div class="ic-hero-foot"><span class="ic-hero-serial">01 / 01</span><span>REAL IDEAS · MADE TO MEASURE</span></div>
          </div>
          <div class="ic-feature">
            <div class="ic-feature-main">
              <p class="ic-feature-kicker">FEATURED INSPIRATION <span class="ic-feature-count">01 / 01</span></p>
              <span class="ic-feature-room"></span>
              <h3 class="ic-feature-title"></h3>
              <p class="ic-feature-description"></p>
              <div class="ic-feature-tags"></div>
              <div class="ic-feature-actions">
                <button type="button" class="ic-button ic-button-primary" data-ic-action="details">Explore this design <span aria-hidden="true">↗</span></button>
                <a class="ic-button ic-button-quiet" data-ic-designer href="${genericDesignerUrl}">Start customizing <span aria-hidden="true">↗</span></a>
              </div>
            </div>
            <div class="ic-feature-bottom">
              <div class="ic-preview-heading"><span>DISCOVER MORE</span><span class="ic-preview-counter"></span></div>
              <div class="ic-preview-list" aria-label="Select an inspiration concept"></div>
              <div class="ic-feature-controls">
                <span>AN IDEA IS ONLY THE BEGINNING.</span>
                <div class="ic-nav-buttons">
                  <button class="ic-nav" type="button" data-ic-action="prev" aria-label="Previous concept">←</button>
                  <button class="ic-nav" type="button" data-ic-action="next" aria-label="Next concept">→</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ic-collection" hidden>
          <header class="ic-collection-head"><h3>All design inspirations</h3><p>Select a design to see its details.</p></header>
          <div class="ic-collection-grid"></div>
        </div>
        <div class="ic-endline"><span>BEYOND OFF-THE-SHELF</span><span>CRAFTED AROUND YOUR SPACE</span></div>
      </div>`;
    if (mode !== 'all') root.querySelector('.ic-collection').remove();
    else root.querySelector('.ic-collection').hidden = false;
    return root;
  }

  function mountEmpty(root, mode) {
    root.classList.add('ic-empty-mode');
    root.querySelector('.ic-filter-bar').remove();
    root.querySelector('.ic-stage').remove();
    root.querySelector('.ic-collection')?.remove();
    const empty = el('div', 'ic-empty');
    empty.innerHTML = `<div class="ic-empty-art" aria-hidden="true"><span></span><span></span><span></span></div>
      <div><p class="ic-eyebrow">THE NEXT DESIGN STORY</p><h3>Something beautiful is taking shape.</h3>
      <p>Our cabinet inspiration gallery is being prepared. You can still explore a custom cabinet layout or speak with the IDEARE team about your ideas.</p>
      <a class="ic-button ic-button-primary" href="${genericDesignerUrl}">Open Cabinet Designer <span aria-hidden="true">↗</span></a></div>`;
    root.querySelector('.ic-shell').insertBefore(empty, root.querySelector('.ic-endline'));
    root.querySelector('.ic-browse-link').textContent = mode === 'home' ? 'Explore the gallery ↗' : 'Return to home ↗';
    if (mode === 'all') root.querySelector('.ic-browse-link').href = asset('../../index.php');
  }

  function createPhoto(image, className, alt) {
    const src = safeUrl(image?.src);
    if (!src) return null;
    const node = el('img', className);
    node.src = src;
    node.alt = alt || '';
    node.loading = 'lazy';
    node.decoding = 'async';
    return node;
  }

  function makePreview(project, index, selected) {
    const button = el('button', 'ic-preview');
    button.type = 'button';
    button.dataset.icIndex = String(index);
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `Show ${project.title}`);
    const thumb = el('span', 'ic-preview-image');
    const photo = createPhoto(project.cover, '', '');
    if (photo) thumb.appendChild(photo); else thumb.appendChild(el('span', 'ic-preview-noimage', 'IDEARE'));
    const info = el('span', 'ic-preview-name');
    info.append(el('span', '', project.title), el('small', '', humanRoom(project.room)));
    button.append(thumb, info);
    return button;
  }

  function makeGalleryCard(project, index) {
    const button = el('button', 'ic-tile');
    button.type = 'button';
    button.dataset.icOpenIndex = String(index);
    button.setAttribute('aria-label', `View ${project.title} design`);
    const photoWrap = el('span', 'ic-tile-photo');
    const photo = createPhoto(project.cover, '', `${project.title} cabinet inspiration`);
    if (photo) photoWrap.appendChild(photo); else photoWrap.appendChild(el('span', 'ic-tile-empty', 'IDEARE'));
    photoWrap.appendChild(el('span', 'ic-tile-overlay', 'View details ↗'));
    const copy = el('span', 'ic-tile-info');
    copy.append(el('small', '', `${project.room} / ${project.style}`), el('strong', '', project.title));
    button.append(photoWrap, copy);
    return button;
  }

  class Showroom {
    constructor(root, projects, mode) {
      this.root = root;
      this.projects = projects;
      this.mode = mode;
      this.category = 'all';
      this.current = 0;
      this.filtered = projects;
      this.modal = null;
      this.openItem = null;
      this.photoIndex = 0;
      this.previousFocus = null;
      this.dialogScrollY = '';
      this.isLightbox = false;
      this.deviceCleanup = null;
      this.deviceEpoch = 0;
      this.deviceMode = '';

      if (!projects.length) {
        mountEmpty(root, mode);
        return;
      }
      this.renderFilters();
      this.paint();
      this.bind();
      this.renderCollection();
      this.mountDevice = this.mountDevice.bind(this);
      desktop.addEventListener('change', this.mountDevice);
      tablet.addEventListener('change', this.mountDevice);
      this.mountDevice();
    }

    getActive() { return this.filtered[this.current]; }
    indexOf(item) { return this.filtered.indexOf(item); }

    renderFilters() {
      const host = this.root.querySelector('.ic-filters');
      host.replaceChildren();
      const distinct = [];
      this.projects.forEach(project => {
        const room = humanRoom(project.room);
        if (!distinct.some(other => isSameRoom(other, room))) distinct.push(room);
      });
      const categories = [{ label: 'All spaces', key: 'all' }, ...distinct.map(room => ({ label: room, key: room }))];
      categories.forEach(category => {
        const button = el('button', 'ic-filter', category.label);
        button.type = 'button';
        button.dataset.icFilter = category.key;
        const active = this.category === category.key;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        host.appendChild(button);
      });
    }

    selectCategory(category) {
      if (category === this.category) return;
      this.category = category;
      this.filtered = category === 'all'
        ? [...this.projects]
        : this.projects.filter(project => isSameRoom(humanRoom(project.room), category));
      this.current = 0;
      this.renderFilters();
      this.paint();
      this.renderCollection();
    }

    select(index, focusPreview = false) {
      if (!this.filtered.length) return;
      this.current = ((index % this.filtered.length) + this.filtered.length) % this.filtered.length;
      this.paint();
      if (focusPreview) {
        const selected = this.root.querySelector('.ic-preview.is-active');
        selected?.scrollIntoView({ behavior: motionPreference.matches ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }

    next(step = 1) { this.select(this.current + step); }

    paint() {
      const item = this.getActive();
      if (!item) return;
      const root = this.root;
      const media = root.querySelector('.ic-hero-media');
      const image = root.querySelector('.ic-hero-image');
      const placeholder = root.querySelector('.ic-placeholder');
      const src = safeUrl(item.cover?.src);
      if (src) {
        image.hidden = false;
        placeholder.hidden = true;
        image.src = src;
        image.alt = `${item.title} — cabinet inspiration`;
        if (!motionPreference.matches) {
          media.classList.remove('ic-image-swapping');
          void media.offsetWidth;
          media.classList.add('ic-image-swapping');
        }
      } else {
        image.removeAttribute('src');
        image.hidden = true;
        placeholder.hidden = false;
      }
      const count = `${String(this.current + 1).padStart(2, '0')} / ${String(this.filtered.length).padStart(2, '0')}`;
      text(root.querySelector('.ic-hero-serial'), count);
      text(root.querySelector('.ic-feature-count'), count);
      text(root.querySelector('.ic-feature-room'), `${humanRoom(item.room)} / ${item.style}`);
      text(root.querySelector('.ic-feature-title'), item.title);
      text(root.querySelector('.ic-feature-description'), item.description || 'An adaptable idea for a space that is entirely your own.');
      const tags = root.querySelector('.ic-feature-tags');
      tags.replaceChildren();
      [...item.finishes, ...item.features].slice(0, 3).forEach(label => tags.append(el('span', 'ic-tag', label)));
      if (item.finishes.length === 0 && item.features.length === 0) {
        tags.append(el('span', 'ic-tag', 'Made to measure'));
        tags.append(el('span', 'ic-tag', item.style || 'Custom cabinetry'));
      }
      const link = root.querySelector('[data-ic-designer]');
      link.href = safeUrl(item.designerUrl) || genericDesignerUrl;
      link.firstChild.textContent = item.hasBaseDesign ? 'Customize in 3D ' : 'Start custom design ';
      const previews = root.querySelector('.ic-preview-list');
      previews.replaceChildren();
      this.filtered.forEach((project, index) => previews.append(makePreview(project, index, index === this.current)));
      text(root.querySelector('.ic-preview-counter'), `${this.filtered.length} CONCEPT${this.filtered.length === 1 ? '' : 'S'}`);
      text(root.querySelector('.ic-results'), `${this.filtered.length} design${this.filtered.length === 1 ? '' : 's'}`);
      root.querySelectorAll('.ic-nav').forEach(button => {button.disabled = this.filtered.length < 2;});
    }

    renderCollection() {
      if (this.mode !== 'all') return;
      const host = this.root.querySelector('.ic-collection-grid');
      if (!host) return;
      host.replaceChildren();
      this.filtered.forEach((project, index) => host.append(makeGalleryCard(project, index)));
    }

    bind() {
      this.root.addEventListener('click', event => {
        const filter = event.target.closest('[data-ic-filter]');
        if (filter) return this.selectCategory(filter.dataset.icFilter);
        const preview = event.target.closest('[data-ic-index]');
        if (preview) return this.select(Number(preview.dataset.icIndex));
        const tile = event.target.closest('[data-ic-open-index]');
        if (tile) {
          this.select(Number(tile.dataset.icOpenIndex));
          return this.openDetails(tile);
        }
        const action = event.target.closest('[data-ic-action]');
        if (!action) return;
        if (action.dataset.icAction === 'prev') this.next(-1);
        else if (action.dataset.icAction === 'next') this.next(1);
        else if (action.dataset.icAction === 'details') this.openDetails(action);
      });
    }

    async mountDevice() {
      const mode = desktop.matches ? 'desktop' : tablet.matches ? 'tablet' : 'phone';
      if (mode === this.deviceMode) return;
      this.deviceMode = mode;
      const epoch = ++this.deviceEpoch;
      if (this.deviceCleanup) { this.deviceCleanup(); this.deviceCleanup = null; }
      this.root.dataset.icDevice = mode;
      try {
        const module = await import(asset(`./responsive/inspiration-${mode}.js`));
        if (epoch !== this.deviceEpoch || !this.root.isConnected) return;
        this.deviceCleanup = module.mount?.(this.root, this) || null;
      } catch (error) {
        console.warn('IDEARE inspiration device enhancement:', error);
      }
    }

    getDialog() {
      if (this.modal) return this.modal;
      const modal = el('div', 'ic-dialog');
      modal.hidden = true;
      modal.inert = true;
      modal.innerHTML = `
        <div class="ic-dialog-backdrop" data-ic-close></div>
        <div class="ic-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="ic-dialog-title" tabindex="-1">
          <button class="ic-dialog-close" type="button" data-ic-close aria-label="Close design details">×</button>
          <header class="ic-dialog-header">
            <p class="ic-detail-kicker"></p><h2 id="ic-dialog-title"></h2><p class="ic-detail-description"></p>
          </header>
          <div class="ic-dialog-gallery">
            <button class="ic-detail-main-image" type="button" data-ic-expand aria-label="Enlarge photograph"><img alt="" />
              <span class="ic-detail-noimage" hidden>PROJECT PHOTOGRAPHS COMING SOON</span>
              <span class="ic-detail-zoom" aria-hidden="true">View full image ↗</span>
            </button>
            <div class="ic-detail-thumbnails" aria-label="Select a project photograph"></div>
          </div>
          <div class="ic-dialog-footer">
            <div><p class="ic-detail-foot-heading">THE DESIGN LANGUAGE</p><div class="ic-detail-materials"></div><p class="ic-detail-note"></p></div>
            <div class="ic-dialog-cta"><p>Inspired by this design? Adapt its dimensions, arrangement and finishes to your space.</p>
              <a class="ic-button ic-button-primary ic-dialog-designer" href="${genericDesignerUrl}">Start customizing <span aria-hidden="true">↗</span></a></div>
          </div>
        </div>
        <div class="ic-lightbox" role="dialog" aria-modal="true" aria-label="Enlarged cabinet inspiration photo" tabindex="-1" hidden>
          <img alt="" /><p></p>
        </div>`;
      document.body.append(modal);
      modal.addEventListener('click', event => {
        if (event.target.closest('[data-ic-close]')) return this.closeDetails();
        const imgTrigger = event.target.closest('[data-ic-photo]');
        if (imgTrigger) return this.setDetailPhoto(Number(imgTrigger.dataset.icPhoto));
        if (event.target.closest('[data-ic-expand]')) return this.openLightbox();
        const lightbox = event.target.closest('.ic-lightbox');
        if (lightbox && event.target !== lightbox.querySelector('img')) this.closeLightbox();
      });
      this.modal = modal;
      return modal;
    }

    openDetails(trigger) {
      const item = this.getActive();
      if (!item) return;
      const modal = this.getDialog();
      this.openItem = item;
      this.photoIndex = 0;
      this.previousFocus = trigger || document.activeElement;
      text(modal.querySelector('.ic-detail-kicker'), `${humanRoom(item.room)} / ${item.style}`);
      text(modal.querySelector('#ic-dialog-title'), item.title);
      text(modal.querySelector('.ic-detail-description'), item.description || 'Your home is unique. Use this concept as a starting point and shape every detail around your space.');
      const tags = modal.querySelector('.ic-detail-materials');
      tags.replaceChildren();
      [...item.finishes, ...item.features].forEach(tag => tags.append(el('span', 'ic-detail-pill', tag)));
      if (!tags.children.length) tags.append(el('span', 'ic-detail-pill', 'Fully customizable'));
      const note = modal.querySelector('.ic-detail-note');
      text(note, item.note || 'Finishes and fittings can be discussed during your design consultation.');
      const designer = modal.querySelector('.ic-dialog-designer');
      designer.href = safeUrl(item.designerUrl) || genericDesignerUrl;
      designer.firstChild.textContent = item.hasBaseDesign ? 'Customize this design in 3D ' : 'Start a custom design ';
      const thumbHost = modal.querySelector('.ic-detail-thumbnails');
      thumbHost.replaceChildren();
      item.photos.forEach((photo, index) => {
        const button = el('button', 'ic-detail-thumb');
        button.type = 'button';
        button.dataset.icPhoto = String(index);
        button.setAttribute('aria-label', `View image ${index + 1}: ${photo.label || 'Design detail'}`);
        const image = createPhoto(photo, '', '');
        if (image) button.append(image);
        thumbHost.append(button);
      });
      this.setDetailPhoto(0);
      this.dialogScrollY = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      modal.hidden = false;
      modal.inert = false;
      modal.querySelector('.ic-dialog-panel').scrollTop = 0;
      modal.classList.add('is-open');
      this.root.classList.add('ic-dialog-open');
      modal.querySelector('.ic-dialog-close').focus();
      if (!this.onModalKeydown) {
        this.onModalKeydown = event => this.keydown(event);
      }
      document.addEventListener('keydown', this.onModalKeydown, true);
    }

    setDetailPhoto(index) {
      if (!this.openItem) return;
      const modal = this.getDialog();
      const photo = this.openItem.photos[index];
      if (photo) this.photoIndex = index;
      const image = modal.querySelector('.ic-detail-main-image img');
      const placeholder = modal.querySelector('.ic-detail-noimage');
      const enlarge = modal.querySelector('[data-ic-expand]');
      const url = safeUrl(photo?.src);
      if (url) {
        image.hidden = false;
        placeholder.hidden = true;
        image.src = url;
        image.alt = `${this.openItem.title} — ${photo.label || 'Design photograph'}`;
        enlarge.disabled = false;
      } else {
        image.hidden = true;
        image.removeAttribute('src');
        placeholder.hidden = false;
        enlarge.disabled = true;
      }
      modal.querySelectorAll('.ic-detail-thumb').forEach((button, i) => {
        button.classList.toggle('is-active', i === this.photoIndex);
        button.setAttribute('aria-pressed', String(i === this.photoIndex));
      });
      modal.querySelector('.ic-detail-zoom').hidden = !url;
    }

    openLightbox() {
      if (!this.openItem || !this.openItem.photos[this.photoIndex]) return;
      const modal = this.getDialog();
      const viewer = modal.querySelector('.ic-lightbox');
      const photo = this.openItem.photos[this.photoIndex];
      const image = viewer.querySelector('img');
      image.src = safeUrl(photo.src);
      image.alt = `${this.openItem.title} — ${photo.label || 'Cabinet photograph'}`;
      text(viewer.querySelector('p'), photo.label || this.openItem.title);
      modal.querySelector('.ic-dialog-panel').inert = true;
      viewer.hidden = false;
      viewer.inert = false;
      viewer.focus();
      this.isLightbox = true;
    }

    closeLightbox() {
      if (!this.isLightbox) return;
      const modal = this.getDialog();
      const viewer = modal.querySelector('.ic-lightbox');
      viewer.hidden = true;
      viewer.inert = true;
      viewer.querySelector('img').removeAttribute('src');
      modal.querySelector('.ic-dialog-panel').inert = false;
      this.isLightbox = false;
      modal.querySelector('[data-ic-expand]').focus();
    }

    closeDetails() {
      if (!this.modal || this.modal.hidden) return;
      if (this.isLightbox) this.closeLightbox();
      this.modal.classList.remove('is-open');
      this.modal.hidden = true;
      this.modal.inert = true;
      document.body.style.overflow = this.dialogScrollY;
      this.root.classList.remove('ic-dialog-open');
      document.removeEventListener('keydown', this.onModalKeydown, true);
      if (this.previousFocus?.isConnected) this.previousFocus.focus();
      this.openItem = null;
      this.previousFocus = null;
    }

    keydown(event) {
      if (!this.modal || this.modal.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (this.isLightbox) this.closeLightbox(); else this.closeDetails();
        return;
      }
      if (this.isLightbox) {
        if (event.key === 'Tab') { event.preventDefault(); this.modal.querySelector('.ic-lightbox').focus(); }
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        if (this.openItem?.photos.length > 1) {
          event.preventDefault();
          const step = event.key === 'ArrowRight' ? 1 : -1;
          this.setDetailPhoto((this.photoIndex + step + this.openItem.photos.length) % this.openItem.photos.length);
        }
      }
      if (event.key !== 'Tab') return;
      const panel = this.modal.querySelector('.ic-dialog-panel');
      const focusable = [...panel.querySelectorAll('button:not([disabled]):not([hidden]),a[href]')].filter(e => !e.closest('[hidden]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); panel.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  async function main() {
    try {
      const response = await fetch(apiUrl, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Inspiration feed returned ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.projects)) throw new Error('Unexpected inspiration response');
      const projects = payload.projects.map(project => ({
        id: Number(project.id),
        title: String(project.title || 'Cabinet concept'),
        style: String(project.style || 'IDEARE design'),
        room: humanRoom(project.room),
        description: String(project.description || ''),
        featured: Boolean(project.featured),
        cover: project.cover,
        photos: Array.isArray(project.photos) ? project.photos : [],
        finishes: Array.isArray(project.finishes) ? project.finishes : [],
        features: Array.isArray(project.features) ? project.features : [],
        note: String(project.note || ''),
        hasBaseDesign: Boolean(project.hasBaseDesign),
        designerUrl: project.designerUrl
      }));
      const mode = homePage ? 'home' : 'all';
      // Keep the homepage intentionally curated: featured designs first,
      // representation from available room types, then fill up to nine.
      let showcased = projects;
      if (homePage && projects.length > 9) {
        const pool = [];
        const add = project => { if (!pool.includes(project) && pool.length < 9) pool.push(project); };
        projects.filter(project => project.featured).slice(0, 3).forEach(add);
        const rooms = new Set();
        projects.forEach(project => {
          const room = humanRoom(project.room).toLocaleLowerCase();
          if (!rooms.has(room)) { rooms.add(room); add(project); }
        });
        projects.forEach(add);
        showcased = pool;
      }
      const root = buildShell(mode);
      if (homePage) {
        const previous = document.getElementById('inspiration');
        if (previous) previous.replaceWith(root);
        else {
          const next = document.getElementById('materials-overview');
          if (next) next.before(root);
          else document.querySelector('main')?.append(root);
        }
      } else if (pageTarget) pageTarget.replaceWith(root);
      const gallery = new Showroom(root, showcased, mode);
      root.classList.add('ic-mounted');
      if (!motionPreference.matches && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('ic-visible');
            observer.unobserve(entry.target);
          }
        }, { threshold: .10 });
        root.querySelectorAll('.ic-appear').forEach(node => observer.observe(node));
      } else root.querySelectorAll('.ic-appear').forEach(node => node.classList.add('ic-visible'));
      window.addEventListener('pagehide', () => gallery.closeDetails(), { once: true });
    } catch (error) {
      console.warn('IDEARE inspiration showroom could not load; original content remains available.', error);
      if (pageTarget) {
        const status = pageTarget.querySelector('.ic-loading-message');
        if (status) status.textContent = 'The inspiration gallery is temporarily unavailable. Please try again later.';
      }
    }
  }
  main();
})();
