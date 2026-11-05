/* IDEARE — five-stage What We Do scroll story.
 * Scroll position controls a reversible photograph + editorial copy crossfade.
 * No external dependencies, no scroll hijacking, no video or canvas rendering.
 * Without JS, the CSS leaves five ordinary readable sections in the document.
 */
(() => {
    'use strict';

    const root = document.querySelector('.service-story');
    const runway = root?.querySelector('[data-service-runway]');
    const sticky = root?.querySelector('[data-service-sticky]');
    const stages = Array.from(root?.querySelectorAll('[data-service-stage]') || []);
    const links = Array.from(root?.querySelectorAll('[data-service-jump]') || []);
    if (!root || !runway || !sticky || stages.length !== 5) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const smoothstep = x => x * x * (3 - 2 * x);
    let frame = 0;
    let lastActive = -1;

    const paint = () => {
        frame = 0;
        const runwayRect = runway.getBoundingClientRect();
        const offset = parseFloat(getComputedStyle(sticky).top) || 0;
        const available = Math.max(1, runway.offsetHeight - sticky.offsetHeight);
        const progress = clamp((offset - runwayRect.top) / available, 0, 1);
        const position = progress * (stages.length - 1);
        const reduced = motionPreference.matches;

        const preceding = Math.min(stages.length - 2, Math.floor(position));
        const local = position - preceding;
        // Each image remains clearly visible most of its chapter.
        // Only the centre of the transition crossfades with the next image.
        const mix = smoothstep(clamp((local - .23) / .54, 0, 1));
        const active = reduced ? Math.round(position) : Math.round(position);

        for (let i = 0; i < stages.length; i += 1) {
            const opacity = reduced
                ? (i === active ? 1 : 0)
                : (i === preceding ? 1 - mix : (i === preceding + 1 ? mix : 0));
            const visible = opacity > .002;
            // Text transitions in two beats: the outgoing caption clears
            // before the incoming one arrives, avoiding ghosted word overlap.
            const absoluteCopy = reduced ? opacity : (
                i === preceding ? 1 - clamp(mix / .45, 0, 1) :
                i === preceding + 1 ? clamp((mix - .55) / .45, 0, 1) : 0
            );
            const copyOpacity = opacity > 0 ? clamp(absoluteCopy / opacity, 0, 1) : 0;
            const distance = i - position;
            const translate = reduced ? 0 : clamp(distance * 36, -36, 36);
            const zoom = reduced ? 1 : 1.035 + Math.min(1, Math.abs(distance)) * .045;
            stages[i].style.setProperty('--ss-opacity', opacity.toFixed(4));
            stages[i].style.setProperty('--ss-copy-opacity', copyOpacity.toFixed(4));
            stages[i].style.setProperty('--ss-translate', `${translate.toFixed(2)}px`);
            stages[i].style.setProperty('--ss-blur', `${(reduced ? 0 : (1 - copyOpacity) * 5).toFixed(2)}px`);
            stages[i].style.setProperty('--ss-scale', zoom.toFixed(4));
            stages[i].style.visibility = visible ? 'visible' : 'hidden';
            stages[i].style.pointerEvents = (i === active) ? 'auto' : 'none';
        }

        root.style.setProperty('--ss-progress', `${(progress * 100).toFixed(3)}%`);
        if (lastActive !== active) {
            lastActive = active;
            for (let i = 0; i < stages.length; i += 1) {
                stages[i].setAttribute('aria-hidden', i === active ? 'false' : 'true');
            }
            for (let i = 0; i < links.length; i += 1) {
                if (i === active) links[i].setAttribute('aria-current', 'step');
                else links[i].removeAttribute('aria-current');
            }
        }
    };

    const requestPaint = () => {
        if (!frame) frame = requestAnimationFrame(paint);
    };

    root.classList.add('is-enhanced');
    for (const button of links) {
        button.addEventListener('click', () => {
            const stage = Number(button.dataset.serviceJump);
            if (!Number.isInteger(stage) || stage < 0 || stage >= stages.length) return;
            const topOfRunway = runway.getBoundingClientRect().top + window.scrollY;
            const topInset = parseFloat(getComputedStyle(sticky).top) || 0;
            const travel = Math.max(0, runway.offsetHeight - sticky.offsetHeight);
            const top = topOfRunway - topInset + travel * stage / (stages.length - 1);
            window.scrollTo({ top, behavior: motionPreference.matches ? 'auto' : 'smooth' });
        });
    }

    window.addEventListener('scroll', requestPaint, { passive: true });
    window.addEventListener('resize', requestPaint);
    window.addEventListener('pageshow', requestPaint);
    if (typeof motionPreference.addEventListener === 'function') {
        motionPreference.addEventListener('change', requestPaint);
    }
    paint();
})();
