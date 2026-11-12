/* IDEARE homepage: scroll-responsive hero fade, refined parallax and
   section reveals. The motion layer is loaded only on the homepage. */
(() => {
    'use strict';

    const script = document.currentScript;
    const assetBase = script?.src
        ? new URL('../', script.src)
        : new URL('assets/', document.baseURI);
    const motionStylesheet = new URL('css/home-motion.css', assetBase).href;

    if (!document.querySelector('link[data-ideare-home-motion]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = motionStylesheet;
        link.dataset.ideareHomeMotion = 'true';
        document.head.appendChild(link);
    }

    const hero = document.querySelector('.home-hero');
    const studio = document.querySelector('.home-studio');
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phoneLayout = window.matchMedia('(max-width: 767px)');
    const tabletLayout = window.matchMedia('(min-width: 768px) and (max-width: 1199px)');

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    let frame = 0;
    let revealObserver = null;
    const observed = new WeakSet();

    const updateScrollEffects = () => {
        frame = 0;

        if (hero) {
            const scrolled = Math.max(0, -hero.getBoundingClientRect().top);
            const range = Math.max(1, hero.offsetHeight * .72);
            const progress = prefersReducedMotion.matches
                ? 0
                : Math.min(1, scrolled / range);

            const maxHeroShift = phoneLayout.matches ? 14 : tabletLayout.matches ? 26 : 48;
            const heroShift = prefersReducedMotion.matches
                ? 0
                : Math.min(maxHeroShift, scrolled * (phoneLayout.matches ? .035 : .075));

            hero.style.setProperty('--hero-scroll-progress', progress.toFixed(3));
            hero.style.setProperty('--hero-image-shift', `${heroShift.toFixed(1)}px`);
        }

        if (studio) {
            const rect = studio.getBoundingClientRect();
            const centerOffset = rect.top + rect.height * .5 - window.innerHeight * .5;
            const maxStudioShift = phoneLayout.matches ? 8 : tabletLayout.matches ? 14 : 24;
            const studioShift = prefersReducedMotion.matches
                ? 0
                : clamp(centerOffset * -.025, -maxStudioShift, maxStudioShift);

            studio.style.setProperty('--studio-parallax-y', `${studioShift.toFixed(1)}px`);
        }
    };

    const requestScrollUpdate = () => {
        if (!frame) frame = window.requestAnimationFrame(updateScrollEffects);
    };

    if (hero || studio) {
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
        window.addEventListener('resize', requestScrollUpdate);
        updateScrollEffects();
    }

    const markVisible = element => {
        if (element.classList.contains('home-reveal')) {
            element.classList.add('is-visible');
        } else {
            element.classList.add('is-motion-visible');
        }
    };

    if (!prefersReducedMotion.matches && 'IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                markVisible(entry.target);
                revealObserver.unobserve(entry.target);
            }
        }, {
            threshold: .12,
            rootMargin: '0px 0px -38px 0px'
        });

        root.classList.add('home-motion-ready');
    }

    const observeReveal = element => {
        if (!element || observed.has(element)) return;
        observed.add(element);

        if (revealObserver && !prefersReducedMotion.matches) {
            revealObserver.observe(element);
        } else {
            markVisible(element);
        }
    };

    const observePageSections = () => {
        document.querySelectorAll(
            '.home-reveal, .home-studio, .service-story-opening, .service-story-outro'
        ).forEach(observeReveal);
    };

    const attachPortfolioMotion = () => {
        const portfolio = document.getElementById('portfolio');
        if (!portfolio) return;

        portfolio.classList.add('portfolio-motion-ready');
        portfolio.querySelectorAll(
            '.portfolio-intro, .portfolio-intro-side, .portfolio-project, [data-portfolio-card]'
        ).forEach(observeReveal);
    };

    observePageSections();
    attachPortfolioMotion();

    // The portfolio is rebuilt from the live project feed after this script loads.
    // Observe its finished cards only after the existing ready event is dispatched.
    document.addEventListener('portfolio:ready', attachPortfolioMotion);

    const revealEverything = () => {
        document.querySelectorAll('.home-reveal').forEach(element => element.classList.add('is-visible'));
        document.querySelectorAll(
            '.home-studio, .service-story-opening, .service-story-outro'
        ).forEach(element => element.classList.add('is-motion-visible'));
        document.querySelectorAll(
            '#portfolio .portfolio-intro, #portfolio .portfolio-intro-side, ' +
            '#portfolio .portfolio-project, #portfolio [data-portfolio-card]'
        ).forEach(element => element.classList.add('is-motion-visible'));
    };

    const onMotionPreferenceChange = () => {
        if (prefersReducedMotion.matches) {
            root.classList.remove('home-motion-ready');
            revealObserver?.disconnect();
            revealEverything();
        }
        requestScrollUpdate();
    };

    if (typeof prefersReducedMotion.addEventListener === 'function') {
        prefersReducedMotion.addEventListener('change', onMotionPreferenceChange);
    } else if (typeof prefersReducedMotion.addListener === 'function') {
        prefersReducedMotion.addListener(onMotionPreferenceChange);
    }
})();
