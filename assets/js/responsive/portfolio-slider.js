/* Shared tablet/phone slider mechanics. The visual cards and images are shared;
 * only the responsive CSS and this device-mounted behaviour change.
 */
export function mountPortfolioSlider({ motion, device = 'phone' } = {}) {
    const root = document.querySelector('#portfolio.portfolio-showcase');
    const viewport = root?.querySelector('[data-portfolio-viewport]');
    const group = root?.querySelector('[data-portfolio-group]');
    const counter = root?.querySelector('[data-portfolio-counter]');
    if (!root || !viewport || !group) return () => {};

    group.querySelectorAll('[data-portfolio-clone]').forEach(node => node.remove());
    const originalSlides = [...group.querySelectorAll('.portfolio-project')];
    if (originalSlides.length < 2) {
        root.dataset.portfolioLayout = device;
        return () => { delete root.dataset.portfolioLayout; };
    }

    const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
    const firstClone = originalSlides[0].cloneNode(true);
    [lastClone, firstClone].forEach(clone => {
        clone.dataset.portfolioClone = 'true';
        clone.setAttribute('aria-hidden', 'true');
        clone.tabIndex = -1;
        clone.querySelectorAll('*').forEach(child => { if ('tabIndex' in child) child.tabIndex = -1; });
        clone.querySelectorAll('img').forEach(image => { image.alt = ''; });
    });
    group.insertBefore(lastClone, group.firstChild);
    group.appendChild(firstClone);

    root.dataset.portfolioLayout = device;
    let current = 1;
    let timer = null;
    let pointerStart = null;
    let ignoreNextClick = false;
    let transitionReset = false;
    let hoveredByMouse = false;
    let keyboardNavigation = false;
    const slideCount = originalSlides.length;

    const activeIndex = () => ((current - 1) % slideCount + slideCount) % slideCount;
    const updateCounter = () => {
        if (counter) counter.textContent = `${String(activeIndex() + 1).padStart(2, '0')}  /  ${String(slideCount).padStart(2, '0')}`;
    };
    const paint = () => {
        group.style.transform = `translate3d(-${current * 100}%, 0, 0)`;
        updateCounter();
    };
    const goTo = next => {
        if (transitionReset) return;
        current = next;
        paint();
    };
    const next = () => goTo(current + 1);
    const previous = () => goTo(current - 1);

    const onTransitionEnd = event => {
        if (event.target !== group || event.propertyName !== 'transform') return;
        if (current === slideCount + 1 || current === 0) {
            transitionReset = true;
            current = current === 0 ? slideCount : 1;
            group.style.transition = 'none';
            paint();
            // Force the reset frame, then restore the responsive stylesheet transition.
            group.getBoundingClientRect();
            group.style.removeProperty('transition');
            window.requestAnimationFrame(() => { transitionReset = false; });
        }
    };

    const stop = () => {
        if (timer !== null) window.clearInterval(timer);
        timer = null;
    };
    const canAutoplay = () => !motion?.matches && !document.hidden &&
        !root.classList.contains('is-modal-open') && !hoveredByMouse &&
        !(keyboardNavigation && root.contains(document.activeElement));
    const start = () => {
        stop();
        if (canAutoplay()) timer = window.setInterval(next, 6500);
    };

    const onPointerEnter = event => {
        if (event.pointerType === 'mouse') { hoveredByMouse = true; stop(); }
    };
    const onPointerLeave = event => {
        if (event.pointerType === 'mouse') { hoveredByMouse = false; start(); }
    };
    const onFocusIn = () => { if (keyboardNavigation) stop(); };
    const onFocusOut = event => {
        if (!root.contains(event.relatedTarget)) { keyboardNavigation = false; start(); }
    };
    const onKeyboardNavigation = event => { if (event.key === 'Tab') keyboardNavigation = true; };
    const onModalOpen = () => stop();
    const onModalClose = () => start();
    const onVisibility = () => document.hidden ? stop() : start();
    const onMotion = () => motion?.matches ? stop() : start();

    const onPointerDown = event => {
        keyboardNavigation = false;
        if (event.pointerType !== 'mouse') pointerStart = { x: event.clientX, y: event.clientY };
        stop();
    };
    const onPointerCancel = () => { pointerStart = null; start(); };
    const onPointerUp = event => {
        if (!pointerStart) return;
        const dx = event.clientX - pointerStart.x;
        const dy = event.clientY - pointerStart.y;
        pointerStart = null;
        if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.25) {
            ignoreNextClick = true;
            if (dx < 0) next(); else previous();
            window.setTimeout(() => { ignoreNextClick = false; }, 450);
        }
        start();
    };
    const suppressSwipeClick = event => {
        if (!ignoreNextClick) return;
        event.preventDefault();
        event.stopPropagation();
        ignoreNextClick = false;
    };

    paint();
    group.addEventListener('transitionend', onTransitionEnd);
    root.addEventListener('pointerenter', onPointerEnter);
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    document.addEventListener('keydown', onKeyboardNavigation);
    viewport.addEventListener('pointerdown', onPointerDown, { passive: true });
    viewport.addEventListener('pointerup', onPointerUp, { passive: true });
    viewport.addEventListener('pointercancel', onPointerCancel, { passive: true });
    root.addEventListener('click', suppressSwipeClick, true);
    document.addEventListener('portfolio:modal-open', onModalOpen);
    document.addEventListener('portfolio:modal-close', onModalClose);
    document.addEventListener('visibilitychange', onVisibility);
    motion?.addEventListener?.('change', onMotion);
    start();

    return () => {
        stop();
        group.removeEventListener('transitionend', onTransitionEnd);
        root.removeEventListener('pointerenter', onPointerEnter);
        root.removeEventListener('pointerleave', onPointerLeave);
        root.removeEventListener('focusin', onFocusIn);
        root.removeEventListener('focusout', onFocusOut);
        document.removeEventListener('keydown', onKeyboardNavigation);
        viewport.removeEventListener('pointerdown', onPointerDown);
        viewport.removeEventListener('pointerup', onPointerUp);
        viewport.removeEventListener('pointercancel', onPointerCancel);
        root.removeEventListener('click', suppressSwipeClick, true);
        document.removeEventListener('portfolio:modal-open', onModalOpen);
        document.removeEventListener('portfolio:modal-close', onModalClose);
        document.removeEventListener('visibilitychange', onVisibility);
        motion?.removeEventListener?.('change', onMotion);
        lastClone.remove();
        firstClone.remove();
        group.style.removeProperty('transform');
        group.style.removeProperty('transition');
        delete root.dataset.portfolioLayout;
    };
}
