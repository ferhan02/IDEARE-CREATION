/* IDEARE Selected Works: reusable state and image-navigation logic.
 * The device controller chooses desktop marquee vs single-project slideshow.
 * All photos/labels come from the shared PHP markup, not duplicate JS catalogs. */
export function mountPortfolio({ mode, motion }) {
  const section = document.querySelector('[data-portfolio-gallery]');
  if (!section) return () => {};
  const track = section.querySelector('[data-portfolio-track]');
  const group = section.querySelector('[data-portfolio-group]');
  const viewport = section.querySelector('[data-portfolio-viewport]');
  const originalCards = [...group.querySelectorAll('[data-portfolio-card]')];
  const prev = section.querySelector('[data-portfolio-prev]');
  const next = section.querySelector('[data-portfolio-next]');
  const activeLabel = section.querySelector('[data-portfolio-active]');
  const titleLabel = section.querySelector('[data-portfolio-current-title]');
  const progress = section.querySelector('[data-portfolio-progress]');
  const motionLabel = section.querySelector('[data-portfolio-motion-label]');
  if (!originalCards.length) return () => {};

  const total = originalCards.length;
  const projects = originalCards.map(card => {
    let photos = [];
    try { photos = JSON.parse(card.dataset.projectPhotos || '[]'); } catch (_) {}
    return { title: card.querySelector('h3')?.textContent?.trim() || 'IDEARE project', photos, photoIndex: 0 };
  });
  const listeners = [];
  const listen = (node, name, handler, options) => {
    node.addEventListener(name, handler, options);
    listeners.push(() => node.removeEventListener(name, handler, options));
  };
  const isDesktop = mode === 'desktop';
  let activeIndex = 0;
  let offset = 0;
  let step = 1;
  let cycleWidth = 1;
  let visible = true;
  let hovering = false;
  let focusWithin = false;
  let keyboardNavigation = false;
  let touching = false;
  let raf = 0;
  let lastFrame = 0;
  let autoTimer = 0;
  let sliding = false;
  let manual = null;
  const norm = (value, distance) => ((value % distance) + distance) % distance;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function markClone(card) {
    card.setAttribute('aria-hidden', 'true');
    card.querySelectorAll('button, a, [tabindex]').forEach(control => control.tabIndex = -1);
    return card;
  }
  // The desktop duplicate creates an uninterrupted loop, while tablet/phone
  // only clone the two boundary cards for a seamless leftward wrap.
  const clones = [];
  if (isDesktop) {
    // Three identical groups keep forward AND reverse navigation seamless.
    const previous = group.cloneNode(true);
    const following = group.cloneNode(true);
    for (const copy of [previous, following]) {
      copy.removeAttribute('data-portfolio-group');
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('[data-portfolio-card]').forEach(markClone);
    }
    track.insertBefore(previous, group);
    track.append(following);
    clones.push(previous, following);
    section.dataset.portfolioMode = 'marquee';
    motionLabel.textContent = 'CONTINUOUS EXHIBITION';
  } else {
    const left = markClone(originalCards[total - 1].cloneNode(true));
    const right = markClone(originalCards[0].cloneNode(true));
    group.prepend(left);
    group.append(right);
    clones.push(left, right);
    section.dataset.portfolioMode = 'slides';
    motionLabel.textContent = 'NEXT PROJECT / 06.5 SEC';
  }

  function allCardsOf(index) {
    return [...section.querySelectorAll(`[data-portfolio-card][data-project-index="${index}"]`)];
  }
  function updatePhoto(index) {
    const project = projects[index];
    if (!project || !project.photos.length) return;
    const photo = project.photos[project.photoIndex];
    allCardsOf(index).forEach(card => {
      const stage = card.querySelector('[data-photo-stage]');
      const primary = stage?.querySelector('.portfolio-exhibit-image');
      const backdrop = stage?.querySelector('.portfolio-exhibit-backdrop');
      if (!primary || !backdrop) return;
      primary.src = photo.src;
      backdrop.src = photo.src;
      primary.alt = `${project.title} — ${photo.label}`;
      stage.querySelector('[data-photo-label]').textContent = photo.label;
      const counter = stage.querySelector('[data-photo-counter]');
      if (counter) counter.textContent = `${String(project.photoIndex + 1).padStart(2, '0')} / ${String(project.photos.length).padStart(2, '0')}`;
      stage.classList.remove('photo-changing');
      // Force a single reflow so repeated photo changes restart the soft reveal.
      void stage.offsetWidth;
      if (!motion.matches) stage.classList.add('photo-changing');
    });
  }

  function showStatus(index) {
    activeIndex = norm(index, total);
    activeLabel.innerHTML = `${String(activeIndex + 1).padStart(2, '0')} <span>/ ${String(total).padStart(2, '0')}</span>`;
    titleLabel.textContent = projects[activeIndex].title;
    progress.style.width = `${100 / total}%`;
    progress.style.transform = `translateX(${activeIndex * 100}%)`;
  }
  const measure = () => {
    const styles = getComputedStyle(group);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    step = originalCards[0].getBoundingClientRect().width + gap;
    cycleWidth = originalCards.length * step;
    if (isDesktop) {
      const previousCycle = cycleWidth;
      const fraction = previousCycle > 1 ? norm(offset - previousCycle, previousCycle) / previousCycle : 0;
      const trackGap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      cycleWidth = group.getBoundingClientRect().width + trackGap;
      offset = cycleWidth * (1 + fraction);
      track.style.transform = `translate3d(${-offset.toFixed(2)}px,0,0)`;
    } else {
      track.style.transition = 'none';
      track.style.transform = `translate3d(${-(activeIndex + 1) * step}px,0,0)`;
    }
  };
  showStatus(0);
  measure();

  function onExitScroll() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    // Starts as the section's bottom approaches the lower half of the screen.
    const t = Math.max(0, Math.min(1, (vh * .72 - rect.bottom) / (vh * .58)));
    section.style.setProperty('--pex-exit-opacity', (t * .93).toFixed(3));
  }
  listen(window, 'scroll', onExitScroll, { passive: true });
  onExitScroll();

  const visibilityObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        if (isDesktop) { if (visible) startDrift(); else stopDrift(); }
        else resetTimer();
      }, { threshold: .02 })
    : null;
  visibilityObserver?.observe(section);

  function stopDrift() { cancelAnimationFrame(raf); raf = 0; lastFrame = 0; }
  function driftFrame(now) {
    raf = requestAnimationFrame(driftFrame);
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .06) : 0;
    lastFrame = now;
    if (manual) {
      const elapsed = (now - manual.started) / manual.duration;
      const t = Math.max(0, Math.min(1, elapsed));
      offset = manual.from + (manual.to - manual.from) * ease(t);
      if (t === 1) manual = null;
    } else if (!hovering && !focusWithin && visible && !document.hidden && !motion.matches) {
      offset += dt * 47; // pixels per second, matching the reference's steady lateral drift
    }
    if (cycleWidth > 0) {
      offset = cycleWidth + norm(offset - cycleWidth, cycleWidth);
      track.style.transform = `translate3d(${-offset.toFixed(2)}px,0,0)`;
      const candidate = Math.floor((offset - cycleWidth + step * .42) / step) % total;
      if (candidate !== activeIndex) showStatus(candidate);
    }
  }
  function startDrift() {
    if (isDesktop && !raf && visible && !document.hidden) raf = requestAnimationFrame(driftFrame);
  }
  function moveDesktop(delta) {
    // A deliberate arrow click works even while the pointer is pausing the drift.
    if (manual) return;
    manual = { from: offset, to: offset + delta * step, started: performance.now(), duration: motion.matches ? 1 : 720 };
    startDrift();
  }

  function resetTimer() {
    clearInterval(autoTimer); autoTimer = 0;
    if (isDesktop || !visible || document.hidden || motion.matches || touching || focusWithin) return;
    autoTimer = setInterval(() => slideOne(1, true), 6500);
  }
  // Slide index needs a distinct *physical* position while at either clone.
  // On wrap, animate toward the clone then snap to the identical real card.
  let physical = 1;
  function slideOne(delta, byTimer = false) {
    if (isDesktop) { moveDesktop(delta); return; }
    if (sliding) return;
    physical += delta;
    sliding = !motion.matches;
    showStatus(physical - 1);
    track.style.transition = motion.matches ? 'none' : 'transform 760ms cubic-bezier(.21,.72,.17,1)';
    track.style.transform = `translate3d(${-physical * step}px,0,0)`;
    if (motion.matches) snapBoundary();
    if (!byTimer) resetTimer();
  }
  function snapBoundary() {
    if (physical === 0) physical = total;
    else if (physical === total + 1) physical = 1;
    track.style.transition = 'none';
    track.style.transform = `translate3d(${-physical * step}px,0,0)`;
    sliding = false;
  }
  if (!isDesktop) {
    // Override index calculation in resize: physical position includes boundary clone.
    const recalc = () => {
      const styles = getComputedStyle(group);
      step = originalCards[0].getBoundingClientRect().width + (Number.parseFloat(styles.gap) || 0);
      track.style.transition = 'none';
      track.style.transform = `translate3d(${-physical * step}px,0,0)`;
    };
    recalc();
    listen(track, 'transitionend', event => { if (event.target === track && event.propertyName === 'transform') snapBoundary(); });
    listen(prev, 'click', () => slideOne(-1));
    listen(next, 'click', () => slideOne(1));
    const startPoint = { x: 0, y: 0, isTouch: false };
    listen(viewport, 'touchstart', e => {
      if (e.touches.length !== 1) return;
      startPoint.x = e.touches[0].clientX;
      startPoint.y = e.touches[0].clientY;
      startPoint.isTouch = true;
      touching = true;
      resetTimer();
    }, { passive: true });
    listen(viewport, 'touchend', e => {
      if (!startPoint.isTouch || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - startPoint.x;
      const dy = e.changedTouches[0].clientY - startPoint.y;
      startPoint.isTouch = false;
      touching = false;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) slideOne(dx < 0 ? 1 : -1);
      resetTimer();
    }, { passive: true });
    listen(viewport, 'touchcancel', () => { touching = false; startPoint.isTouch = false; resetTimer(); }, { passive: true });
    const ro = 'ResizeObserver' in window ? new ResizeObserver(recalc) : null;
    if (ro) ro.observe(viewport);
    listen(window, 'resize', recalc);
    resetTimer();
    listeners.push(() => ro?.disconnect());
  } else {
    listen(prev, 'click', () => moveDesktop(-1));
    listen(next, 'click', () => moveDesktop(1));
    listen(section, 'pointerenter', e => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') hovering = true; });
    listen(section, 'pointerleave', () => { hovering = false; });
    const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(viewport);
    listen(window, 'resize', measure);
    listeners.push(() => ro?.disconnect());
    startDrift();
  }

  // Event delegation means cloned cards can show the same photo as originals.
  listen(section, 'click', event => {
    const control = event.target.closest('[data-photo-direction]');
    if (!control) return;
    const card = control.closest('[data-portfolio-card]');
    if (!card) return;
    const index = Number(card.dataset.projectIndex);
    const project = projects[index];
    if (!project || project.photos.length < 2) return;
    project.photoIndex = norm(project.photoIndex + Number(control.dataset.photoDirection), project.photos.length);
    updatePhoto(index);
    resetTimer();
  });
  // Keyboard focus pauses the animation; mouse clicks do not leave it paused
  // after the pointer leaves the section.
  listen(document, 'keydown', e => { if (e.key === 'Tab') keyboardNavigation = true; });
  listen(document, 'pointerdown', () => { keyboardNavigation = false; focusWithin = false; });
  listen(section, 'focusin', () => { focusWithin = keyboardNavigation; if (!isDesktop) resetTimer(); });
  listen(section, 'focusout', e => {
    if (!e.relatedTarget || !section.contains(e.relatedTarget)) { focusWithin = false; if (!isDesktop) resetTimer(); }
  });
  listen(document, 'visibilitychange', () => { if (isDesktop) document.hidden ? stopDrift() : startDrift(); else resetTimer(); });
  listen(motion, 'change', () => { if (!isDesktop) resetTimer(); });

  return () => {
    stopDrift();
    clearInterval(autoTimer);
    visibilityObserver?.disconnect();
    listeners.forEach(dispose => dispose());
    clones.forEach(clone => clone.remove());
    track.style.transition = '';
    track.style.transform = '';
    section.style.removeProperty('--pex-exit-opacity');
    delete section.dataset.portfolioMode;
  };
}
