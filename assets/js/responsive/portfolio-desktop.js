/* Desktop: seamless left-moving project marquee. Hovering anywhere in the
 * portfolio section pauses it; the modal and reduced-motion mode pause it too.
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

    measure();
    onVisibility();
    onMotion();
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('portfolio:modal-open', pauseForModal);
    document.addEventListener('portfolio:modal-close', resumeAfterModal);
    motion?.addEventListener?.('change', onMotion);

    return () => {
        window.removeEventListener('resize', measure);
        document.removeEventListener('visibilitychange', onVisibility);
        document.removeEventListener('portfolio:modal-open', pauseForModal);
        document.removeEventListener('portfolio:modal-close', resumeAfterModal);
        motion?.removeEventListener?.('change', onMotion);
        clone.remove();
        track.style.removeProperty('--portfolio-marquee-duration');
        root.classList.remove('is-modal-open', 'is-page-hidden', 'is-static-motion');
        delete root.dataset.portfolioLayout;
    };
}
