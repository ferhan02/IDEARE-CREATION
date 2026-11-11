/* Wait for the shared PHP image feed to finish before mounting a device layout. */
export function mountPortfolioWhenReady(mount) {
    let cleanup = () => {};
    let cancelled = false;

    const attach = () => {
        if (cancelled) return;
        const result = mount();
        if (typeof result === 'function') cleanup = result;
    };

    if (document.querySelector('#portfolio.portfolio-showcase')) attach();
    else document.addEventListener('portfolio:ready', attach, { once: true });

    return () => {
        cancelled = true;
        document.removeEventListener('portfolio:ready', attach);
        cleanup();
    };
}
