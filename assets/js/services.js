(() => {
    const page = document.querySelector('.services-page');
    if (!page) return;

    const stages = [...page.querySelectorAll('[data-service-stage]')];
    const phaseLinks = [...page.querySelectorAll('[data-phase-link]')];
    const phaseNav = page.querySelector('.services-phase-nav');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastActiveId = '';

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const setActiveStage = (activeStage) => {
        if (!activeStage || activeStage.id === lastActiveId) return;
        lastActiveId = activeStage.id;

        stages.forEach((stage) => {
            stage.classList.toggle('is-current', stage === activeStage);
        });

        phaseLinks.forEach((link) => {
            const active = link.dataset.phaseLink === activeStage.id;
            link.classList.toggle('is-active', active);
            if (active) {
                link.setAttribute('aria-current', 'step');

                if (phaseNav && !reduceMotion.matches) {
                    const navRect = phaseNav.getBoundingClientRect();
                    const linkRect = link.getBoundingClientRect();
                    const outside = linkRect.left < navRect.left + 12 || linkRect.right > navRect.right - 12;
                    if (outside) link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    const updateServicesScroll = () => {
        frame = 0;

        const pageTop = page.getBoundingClientRect().top + window.scrollY;
        const scrollStart = pageTop;
        const scrollEnd = Math.max(scrollStart + 1, pageTop + page.offsetHeight - window.innerHeight);
        const progress = clamp((window.scrollY - scrollStart) / (scrollEnd - scrollStart), 0, 1);
        page.style.setProperty('--services-progress', `${(progress * 100).toFixed(2)}%`);

        if (!stages.length) return;

        const activationLine = window.innerWidth <= 900 ? 138 : 158;
        let activeStage = stages[0];

        for (const stage of stages) {
            if (stage.getBoundingClientRect().top <= activationLine) {
                activeStage = stage;
            } else {
                break;
            }
        }

        const lastStage = stages[stages.length - 1];
        if (lastStage.getBoundingClientRect().bottom <= window.innerHeight * .72) {
            activeStage = lastStage;
        }

        setActiveStage(activeStage);
    };

    const requestUpdate = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(updateServicesScroll);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    if (typeof reduceMotion.addEventListener === 'function') {
        reduceMotion.addEventListener('change', requestUpdate);
    }

    phaseLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const target = document.getElementById(link.dataset.phaseLink || '');
            if (target) setActiveStage(target);
        });
    });

    updateServicesScroll();
})();
