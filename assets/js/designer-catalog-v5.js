/* IDEARE v5: category-specific catalog, no new dining or kitchen-extra items.
 * Loaded in the existing ES module AFTER v4, before boot().
 * Keep v2/v3/v4 geometry and saved-scene compatibility. */
(() => {
  'use strict';
  const bar = document.querySelector('#catalog-bar');
  const panel = document.querySelector('#catalog-menu');
  if (!bar || !panel) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '../assets/css/designer-catalog-v5.css?v=20261125-1';
  document.head.append(link);
  const categoriesV5 = [
    ['base-cabinets','Base Cabinets','<rect x="5" y="5" width="14" height="14" rx="1"/><path d="M5 12h14M10 9h4M10 16h4M7 19v2m10-2v2"/>'],
    ['wall-cabinets','Wall / Upper Cabinets','<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M12 4v13m-2-7v3m4-3v3M3 20h18"/>'],
    ['tall-cabinets','Tall / Pantry Cabinets','<rect x="6" y="2" width="12" height="20" rx="1"/><path d="M6 14h12M15 7v4m0 6v2"/>'],
    ['special-cabinets','Specialty & Corner Cabinets','<path d="M3 4h10v7h8v9H3zM3 11h10v9m-6-5h2m7-1h2"/>'],
    ['appliances','Appliances','<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 8h16m-11-2h.01M12 6h.01M15 6h.01"/><rect x="7" y="11" width="10" height="7" rx="1"/>'],
    ['backsplash','Backsplash','<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v5m6 0v5m-6 0v6"/>']
  ];
  const known = new Set(categoriesV5.map(x => x[0]));
  const slugFor = value => {
    const key = String(value || '').toLowerCase();
    if (known.has(key)) return key;
    if (/wall|upper/.test(key)) return 'wall-cabinets';
    if (/tall|pantry|high/.test(key)) return 'tall-cabinets';
    if (/special|corner/.test(key)) return 'special-cabinets';
    if (/base/.test(key)) return 'base-cabinets';
    return null;
  };
  // Keep the existing photo action, but move it outside the category header.
  const photo = Array.from(bar.querySelectorAll(':scope > button')).find(b => /photo studio/i.test(b.textContent));
  if (photo) {
    photo.remove();
    const target = document.querySelector('.studio-controls');
    if (target) {
      photo.className = 'ideare-photo-v5';
      photo.textContent = 'Photo';
      photo.setAttribute('aria-label','Capture a photo of the 3D design');
      target.insertBefore(photo,target.querySelector('[data-next="4"]'));
    }
  }
  // Remove old controls, including v2/v3 dining/extras/search/materials tabs.
  // The underlying model factories stay available for historical saved designs.
  Array.from(bar.querySelectorAll(':scope > button')).forEach(button => button.remove());
  bar.classList.add('ideare-catalog-v5');
  panel.setAttribute('aria-label','Catalog items');
  const buttons = new Map();
  let current = null;
  let pointerMode = 'mouse';
  let pendingKeyboardFocus = false;
  const openPrevious = openMenu;
  const closePrevious = closeMenu;
  function activeButton() { return buttons.get(current); }
  function positionPanel() {
    const button = activeButton();
    if (!button || panel.hidden) return;
    const bounds = button.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const requested = current === 'appliances' ? 785 : current === 'backsplash' ? 620 : 420;
    const width = Math.min(requested, Math.max(1,viewportWidth - 16));
    const left = Math.max(8,Math.min(bounds.left,viewportWidth - width - 8));
    // The popup touches the button's bottom edge, without a hover gap.
    panel.style.setProperty('--v5-menu-top',`${Math.floor(bounds.bottom - 1)}px`);
    panel.style.setProperty('--v5-menu-left',`${Math.round(left)}px`);
    panel.style.setProperty('--v5-menu-width',`${Math.round(width)}px`);
    panel.style.setProperty('--v5-menu-max-height',`${Math.max(100,window.innerHeight - bounds.bottom - 10)}px`);
  }
  function clearActive() {
    current = null;
    panel.classList.remove('ideare-category-only','ideare-backsplash-menu');
    for (const button of buttons.values()) {
      button.classList.remove('active');
      button.setAttribute('aria-expanded','false');
    }
  }
  closeMenu = () => { closePrevious(); clearActive(); };
  function filterCabinets(key) {
    const all = Array.from(panel.querySelectorAll('[data-template]'));
    let count = 0;
    for (const button of all) {
      const t = template(button.dataset.template);
      const slug = t ? slugFor(category(t)) : null;
      button.hidden = slug !== key;
      if (!button.hidden) count++;
    }
    const grid = panel.querySelector('.id3-megagrid');
    if (grid) for (const group of grid.children) {
      group.hidden = !group.querySelector('[data-template]:not([hidden])');
    }
    panel.classList.add('ideare-category-only');
    if (!count) {
      const p = document.createElement('p');
      p.className = 'ideare-catalog-v5-empty';
      p.textContent = catalog.templates.length ? 'No cabinets in this category are available.' : 'The cabinet catalog is still loading.';
      panel.append(p);
    }
  }
  function openCategory(key) {
    if (!known.has(key) || model.step !== 3) return;
    if (current === key && !panel.hidden) { positionPanel(); return; }
    // Reset the original engine's numeric active-menu state so switching
    // between two cabinet categories always regenerates the template menu.
    closeMenu();
    if(key==='backsplash'){panel.hidden=false;model.activeMenu=6;panel.classList.add('ideare-backsplash-menu');v7RenderBacksplash(panel);}else openPrevious(key === 'appliances' ? 2 : 1, false);
    if (panel.hidden) return;
    current = key;
    if (key !== 'appliances' && key !== 'backsplash') filterCabinets(key);
    const button = activeButton();
    button.classList.add('active');
    button.setAttribute('aria-expanded','true');
    positionPanel();
    if (pendingKeyboardFocus) {
      pendingKeyboardFocus = false;
      panel.querySelector('button:not([hidden])')?.focus();
    }
  }
  // Preserve the built-in Replace action, which still calls openMenu(1).
  // Removed menu IDs cannot be reopened through older code paths.
  openMenu = (menu, hover = false) => {
    if (Number(menu) === 1) openCategory(slugFor(selected()?.category) || 'base-cabinets');
    else if (Number(menu) === 2) openCategory('appliances');
    else if (Number(menu) === 6) openCategory('backsplash');
    else closeMenu();
  };
  function leavesActiveArea(event) {
    const next = event.relatedTarget;
    const button = activeButton();
    if (next instanceof Node && (panel.contains(next) || button?.contains(next))) return false;
    return true;
  }
  for (const [key,label,paths] of categoriesV5) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ideare-catalog-category';
    button.dataset.categoryV5 = key;
    button.title = label;
    button.setAttribute('aria-controls','catalog-menu');
    button.setAttribute('aria-expanded','false');
    button.innerHTML = `<span class="ideare-catalog-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span><span>${safe(label)}</span>`;
    buttons.set(key,button);
    bar.insertBefore(button,panel);
    button.addEventListener('pointerenter',event => {
      if (event.pointerType === 'mouse') { pointerMode = 'mouse'; openCategory(key); }
    });
    button.addEventListener('pointerdown',event => { pointerMode = event.pointerType || 'mouse'; });
    button.addEventListener('pointerleave',event => {
      if (event.pointerType === 'mouse' && current === key && leavesActiveArea(event)) closeMenu();
    });
    button.addEventListener('click',event => {
      // A mouse click on a hover-open category should not instantly close it.
      // Touch and keyboard users get ordinary toggle behavior.
      if (current === key && !panel.hidden && (pointerMode !== 'mouse' || event.detail === 0)) closeMenu();
      else openCategory(key);
    });
    button.addEventListener('keydown',event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (current === key && !panel.hidden) panel.querySelector('button:not([hidden])')?.focus();
        else { pendingKeyboardFocus = true; openCategory(key); }
      }
    });
  }
  panel.addEventListener('pointerleave',event => {
    if (event.pointerType === 'mouse' && leavesActiveArea(event)) closeMenu();
  });
  // Close when keyboard focus leaves the whole catalog.
  bar.addEventListener('focusout',event => {
    const next = event.relatedTarget;
    if (next instanceof Node && !bar.contains(next)) closeMenu();
  });
  bar.addEventListener('keydown',event => {
    if (event.key === 'Escape' && current) {
      const button = activeButton();
      closeMenu();
      button?.focus();
      event.stopPropagation();
    }
  });
  window.addEventListener('resize',positionPanel,{passive:true});
  window.addEventListener('blur',() => { if(current) closeMenu(); });
  document.querySelectorAll('[data-step],[data-next]').forEach(button => button.addEventListener('click',closeMenu));
  closeMenu();
})();
