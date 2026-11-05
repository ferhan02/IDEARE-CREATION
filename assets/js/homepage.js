/* IDEARE homepage: scroll-responsive hero fade, reversible on scroll;
   lightweight entrance reveals, with reduced-motion support. */
(() => {
    const hero = document.querySelector('.home-hero');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const updateHero = () => {
        frame = 0;
        if (!hero) return;
        const scrolled = Math.max(0, -hero.getBoundingClientRect().top);
        const range = Math.max(1, hero.offsetHeight * .72);
        const progress = prefersReducedMotion.matches ? 0 : Math.min(1, scrolled / range);
        hero.style.setProperty('--hero-scroll-progress', progress.toFixed(3));
    };
    const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(updateHero);
    };
    if (hero) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        updateHero();
    }

    if (!prefersReducedMotion.matches && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        }, { threshold: .10, rootMargin: '0px 0px -30px 0px' });
        document.querySelectorAll('.home-reveal').forEach(element => observer.observe(element));
        document.documentElement.classList.add('home-motion-ready');
    }
    if (typeof prefersReducedMotion.addEventListener === 'function') {
        prefersReducedMotion.addEventListener('change', () => {
            if (prefersReducedMotion.matches) {
                document.documentElement.classList.remove('home-motion-ready');
                document.querySelectorAll('.home-reveal').forEach(e => e.classList.add('is-visible'));
            }
            onScroll();
        });
    }
})();
