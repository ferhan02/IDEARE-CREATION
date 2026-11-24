/* IDEARE — shared POV portfolio. Replaces only the homepage portfolio device
 * mount; the existing portfolio-showcase.js still owns the API and modal. */
let mounted = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function mountPOV() {
    if (mounted) return;
    const root = document.querySelector('#portfolio.portfolio-showcase');
    const viewport = root?.querySelector('[data-portfolio-viewport]');
    const group = root?.querySelector('[data-portfolio-group]');
    const track = root?.querySelector('[data-portfolio-track]');
    const modal = document.querySelector('.portfolio-modal');
    const panel = modal?.querySelector('.portfolio-modal-panel');
    const back = panel?.querySelector('.portfolio-modal-close');
    if (!root || !viewport || !group || !track || !back) return;
    const cards = [...group.querySelectorAll('.portfolio-project')];
    if (!cards.length) return;
    mounted = true;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL('../../css/portfolio-pov.css', import.meta.url).href;
    document.head.append(css);
    root.dataset.portfolioLayout = 'pov';
    modal.classList.add('portfolio-pov-modal');
    const nav = document.createElement('div');
    nav.className = 'pov-modal-nav';
    back.textContent = '←  Back to portfolio';
    back.setAttribute('aria-label', 'Back to portfolio');
    panel.prepend(nav);
    nav.append(back);
    const columns = [];
    for (let i = 0; i < cards.length; i += 2) {
        const col = document.createElement('div');
        col.className = 'pov-column';
        if (i % 4 === 2) col.classList.add('pov-column-reverse');
        if (!cards[i + 1]) col.classList.add('pov-column-single');
        col.append(...cards.slice(i, i + 2));
        group.append(col); columns.push(col);
    }
    const controls = document.createElement('div');
    controls.className = 'pov-controls';
    controls.innerHTML = '<button type="button" class="pov-arrow" aria-label="Browse previous projects">←</button><div class="pov-guide"><span>Hold &amp; drag to explore</span><div class="pov-progress" aria-hidden="true"><i></i></div></div><button type="button" class="pov-arrow" aria-label="Browse next projects">→</button>';
    viewport.after(controls);
    const [prev, next] = controls.querySelectorAll('button');
    const indicator = controls.querySelector('i');
    viewport.tabIndex = 0;
    viewport.setAttribute('aria-label', 'Portfolio gallery. Drag or use left and right arrow keys to browse projects.');
    viewport.setAttribute('data-scroll-native', '');
    let frame = 0, momentum = 0, gesture = null, suppress = false;
    const limit = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const stop = () => { cancelAnimationFrame(momentum); momentum = 0; };
    function paint() {
        frame = 0;
        const width = viewport.clientWidth || 1;
        const center = viewport.scrollLeft + width / 2;
        // Each column is a plane on a virtual curved wall. The tall/short
        // rhythm stays intact and all hit targets follow the CSS transforms.
        for (const col of columns) {
            const d = clamp((col.offsetLeft + col.offsetWidth / 2 - center) / (width / 2), -1.5, 1.5);
            const curve = reduced.matches ? 0 : d;
            col.style.setProperty('--pov-angle', `${-curve * 13}deg`);
            col.style.setProperty('--pov-scale', `${1 + Math.min(1.5, Math.abs(curve)) * .12}`);
            col.style.setProperty('--pov-depth', `${Math.abs(curve) * 26}px`);
        }
        const max = limit();
        const fraction = max ? clamp(viewport.scrollLeft / max, 0, 1) : 0;
        const thumb = Math.min(1, width / Math.max(width, viewport.scrollWidth));
        indicator.style.width = `${thumb * 100}%`;
        indicator.style.left = `${fraction * (1 - thumb) * 100}%`;
        prev.disabled = viewport.scrollLeft < 2;
        next.disabled = viewport.scrollLeft >= max - 2;
    }
    const requestPaint = () => { if (!frame) frame = requestAnimationFrame(paint); };
    viewport.addEventListener('scroll', requestPaint, {passive:true});
    window.addEventListener('resize', requestPaint);
    reduced.addEventListener?.('change', requestPaint);
    if ('ResizeObserver' in window) new ResizeObserver(requestPaint).observe(viewport);
    css.addEventListener('load', requestPaint, {once:true});
    function step(dir) {
        stop();
        viewport.scrollBy({left: dir * (columns[0].offsetWidth + 16), behavior: reduced.matches ? 'instant' : 'smooth'});
    }
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    viewport.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
    });
    viewport.addEventListener('focusin', e => {
        if (e.target.matches('.portfolio-project:focus-visible')) e.target.scrollIntoView({block:'nearest', inline:'nearest', behavior:'instant'});
    });
    viewport.addEventListener('dragstart', e => e.preventDefault());
    viewport.addEventListener('pointerdown', e => {
        if (!e.isPrimary || e.button !== 0) return;
        stop(); suppress = false;
        gesture = {id:e.pointerId, x:e.clientX, y:e.clientY, start:viewport.scrollLeft, lastX:e.clientX, last:performance.now(), v:0, drag:false};
    });
    window.addEventListener('pointermove', e => {
        const g = gesture;
        if (!g || e.pointerId !== g.id) return;
        const dx = e.clientX - g.x, dy = e.clientY - g.y;
        if (!g.drag) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { gesture = null; return; }
            if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)*1.2) return;
            g.drag = true; suppress = true;
            viewport.classList.add('is-gallery-dragging');
            try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
        }
        if (e.cancelable) e.preventDefault();
        const now = performance.now(), dt = now - g.last;
        if (dt > 0) g.v = .35*g.v + .65*(g.lastX-e.clientX)/dt;
        g.lastX = e.clientX; g.last = now;
        viewport.scrollLeft = g.start - dx;
    }, {passive:false});
    function finish(e, cancelled) {
        const g = gesture;
        if (!g || e.pointerId !== g.id) return;
        gesture = null;
        viewport.classList.remove('is-gallery-dragging');
        try { if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId); } catch (_) {}
        if (!g.drag) return;
        // Suppress only the release click, never the next intentional press.
        setTimeout(() => { if (!gesture) suppress = false; }, 400);
        if (cancelled || reduced.matches || performance.now()-g.last > 100) return;
        let speed = clamp(g.v, -2, 2), last = performance.now();
        function coast(now) {
            const dt = Math.min(32, now-last); last = now;
            viewport.scrollLeft += speed*dt;
            speed *= Math.exp(-dt/135);
            if (Math.abs(speed) > .025 && viewport.scrollLeft > 0 && viewport.scrollLeft < limit()) momentum = requestAnimationFrame(coast);
            else momentum = 0;
        }
        momentum = requestAnimationFrame(coast);
    }
    window.addEventListener('pointerup', e => finish(e,false));
    window.addEventListener('pointercancel', e => finish(e,true));
    viewport.addEventListener('lostpointercapture', e => finish(e,true));
    viewport.addEventListener('click', e => { if (suppress && e.detail !== 0) { e.preventDefault(); e.stopImmediatePropagation(); suppress = false; } }, true);
    viewport.addEventListener('wheel', e => {
        if (e.ctrlKey || e.metaKey) return;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) stop();
    }, {passive:true});
    document.addEventListener('portfolio:modal-open', stop);
    window.addEventListener('pagehide', stop);
    requestPaint();
}

// Existing desktop/tablet/phone controllers call this entry point. Mount the
// same gallery once; breakpoint changes are handled by CSS and ResizeObserver.
export function mountPortfolioWhenReady(_legacyMount) {
    if (document.querySelector('#portfolio.portfolio-showcase')) mountPOV();
    else document.addEventListener('portfolio:ready', mountPOV, {once:true});
    return () => document.removeEventListener('portfolio:ready', mountPOV);
}
