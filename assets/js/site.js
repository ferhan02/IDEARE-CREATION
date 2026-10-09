const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
    const setOpen = (open) => {
        siteNav.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    navToggle.addEventListener('click', () => {
        setOpen(!siteNav.classList.contains('open'));
    });

    siteNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setOpen(false);
    });
}

/*
 * Home contact section scroll scrub.
 * The horizontal position is calculated directly from the section's
 * position in the viewport, so the motion follows the scrollbar in
 * both directions instead of playing as a one-off entrance animation.
 */
const contactSection = document.querySelector('.contact-section');
const contactGrid = contactSection?.querySelector('.contact-grid');

if (contactSection && contactGrid) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const updateContactScroll = () => {
        animationFrame = 0;

        if (reduceMotion.matches) {
            contactGrid.style.transform = '';
            contactGrid.style.opacity = '';
            contactGrid.style.willChange = '';
            return;
        }

        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const rect = contactSection.getBoundingClientRect();

        // Starts sliding in as the contact section reaches the bottom 8% of
        // the viewport and is fully settled around 24% down from the top.
        const startLine = viewportHeight * 0.92;
        const endLine = viewportHeight * 0.24;
        const progress = clamp((startLine - rect.top) / (startLine - endLine), 0, 1);

        // Keep the travel responsive so it feels deliberate on desktop but
        // does not push the section excessively far away on smaller screens.
        const maxTravel = Math.min(220, Math.max(72, window.innerWidth * 0.13));
        const translateX = (1 - progress) * maxTravel;
        const opacity = 0.35 + (progress * 0.65);

        contactGrid.style.willChange = 'transform, opacity';
        contactGrid.style.transform = `translate3d(${translateX.toFixed(2)}px, 0, 0)`;
        contactGrid.style.opacity = opacity.toFixed(3);
    };

    const requestContactUpdate = () => {
        if (animationFrame) return;
        animationFrame = window.requestAnimationFrame(updateContactScroll);
    };

    window.addEventListener('scroll', requestContactUpdate, { passive: true });
    window.addEventListener('resize', requestContactUpdate);

    if (typeof reduceMotion.addEventListener === 'function') {
        reduceMotion.addEventListener('change', requestContactUpdate);
    }

    updateContactScroll();
}
