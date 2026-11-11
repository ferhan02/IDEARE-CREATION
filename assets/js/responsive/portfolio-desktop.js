/* Desktop: seamless left-moving project marquee.
 * Only hovering an individual project card pauses the movement.
 */
export function mountPortfolioDesktop({ motion } = {}) {
    const root = document.querySelector('#portfolio.portfolio-showcase');
    const track = root?.querySelector('[data-portfolio-track]');
    const group = root?.querySelector('[data-portfolio-group]');
    if (!root || !track || !group) return () => {};

    track.querySelector('[data-portfolio-clone]')?.remove();

    const clone = group.cloneNode(true);
    clone.dataset.portfolioClone = 'true';
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('[data-portfolio-open]').forEach(button => { button.tabIndex = -1; });
    clone.querySelectorAll('img').forEach(image => { image.alt = ''; });
    track.appendChild(clone);

    root.dataset.portfolioLayout = 'desktop';

    const measure = () => {
        const width = group.getBoundingClientRect().width;
        const seconds = Math.max(38, width / 72);
        track.style.setProperty('--portfolio-marquee-duration', `${seconds.toFixed(2)}s`);
    };

    const pauseForModal = () => root.classList.add('is-modal-open');
    const resumeAfterModal = () => root.classList.remove('is-modal-open');
    const onVisibility = () => root.classList.toggle('is-page-hidden', document.hidden);
    const onMotion = () => root.classList.toggle('is-static-motion', Boolean(motion?.matches));

    const onCardEnter = event => {
        if (event.pointerType === 'touch') return;
        root.classList.add('is-card-hovered');
    };

    const onCardLeave = event => {
        if (event.pointerType === 'touch') return;
        if (event.relatedTarget?.closest?.('.portfolio-project')) return;
        root.classList.remove('is-card-hovered');
    };

    const cards = [...track.querySelectorAll('.portfolio-project')];
    cards.forEach(card => {
        card.addEventListener('pointerenter', onCardEnter);
        card.addEventListener('pointerleave', onCardLeave);
    });

    measure();
    onVisibility();
    onMotion();

    window.addEventListener('resize', measure);
    let resizeObserver = null;
    if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(group);
    }

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('portfolio:modal-open', pauseForModal);
    document.addEventListener('portfolio:modal-close', resumeAfterModal);
    motion?.addEventListener?.('change', onMotion);

    return () => {
        window.removeEventListener('resize', measure);
        resizeObserver?.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        document.removeEventListener('portfolio:modal-open', pauseForModal);
        document.removeEventListener('portfolio:modal-close', resumeAfterModal);
        motion?.removeEventListener?.('change', onMotion);

        cards.forEach(card => {
            card.removeEventListener('pointerenter', onCardEnter);
            card.removeEventListener('pointerleave', onCardLeave);
        });

        clone.remove();
        track.style.removeProperty('--portfolio-marquee-duration');
        root.classList.remove('is-modal-open', 'is-page-hidden', 'is-static-motion', 'is-card-hovered');
        delete root.dataset.portfolioLayout;
    };
}
