/* IDEARE homepage: scroll-responsive hero fade, refined parallax and section reveals. */
(() => {
    'use strict';
    const script = document.currentScript;
    const assetBase = script?.src ? new URL('../', script.src) : new URL('assets/', document.baseURI);
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
            const progress = prefersReducedMotion.matches ? 0 : Math.min(1, scrolled / range);
            const maxHeroShift = phoneLayout.matches ? 14 : tabletLayout.matches ? 26 : 48;
            const heroShift = prefersReducedMotion.matches ? 0 : Math.min(maxHeroShift, scrolled * (phoneLayout.matches ? .035 : .075));
            hero.style.setProperty('--hero-scroll-progress', progress.toFixed(3));
            hero.style.setProperty('--hero-image-shift', `${heroShift.toFixed(1)}px`);
        }
        if (studio) {
            const rect = studio.getBoundingClientRect();
            const centerOffset = rect.top + rect.height * .5 - window.innerHeight * .5;
            const maxStudioShift = phoneLayout.matches ? 8 : tabletLayout.matches ? 14 : 24;
            const studioShift = prefersReducedMotion.matches ? 0 : clamp(centerOffset * -.025, -maxStudioShift, maxStudioShift);
            studio.style.setProperty('--studio-parallax-y', `${studioShift.toFixed(1)}px`);
        }
    };
    const requestScrollUpdate = () => { if (!frame) frame = window.requestAnimationFrame(updateScrollEffects); };
    if (hero || studio) {
        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
        window.addEventListener('resize', requestScrollUpdate);
        updateScrollEffects();
    }
    const markVisible = element => {
        if (element.classList.contains('home-reveal')) element.classList.add('is-visible');
        else element.classList.add('is-motion-visible');
    };
    if (!prefersReducedMotion.matches && 'IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                markVisible(entry.target);
                revealObserver.unobserve(entry.target);
            }
        }, { threshold: .12, rootMargin: '0px 0px -38px 0px' });
        root.classList.add('home-motion-ready');
    }
    const observeReveal = element => {
        if (!element || observed.has(element)) return;
        observed.add(element);
        if (revealObserver && !prefersReducedMotion.matches) revealObserver.observe(element);
        else markVisible(element);
    };
    const observePageSections = () => {
        document.querySelectorAll('.home-reveal, .home-studio, .service-story-opening, .service-story-outro').forEach(observeReveal);
    };
    const attachPortfolioMotion = () => {
        const portfolio = document.getElementById('portfolio');
        if (!portfolio) return;
        portfolio.classList.add('portfolio-motion-ready');
        portfolio.querySelectorAll('.portfolio-intro, .portfolio-intro-side, .portfolio-project, [data-portfolio-card]').forEach(observeReveal);
    };
    observePageSections();
    attachPortfolioMotion();
    document.addEventListener('portfolio:ready', attachPortfolioMotion);
    const revealEverything = () => {
        document.querySelectorAll('.home-reveal').forEach(element => element.classList.add('is-visible'));
        document.querySelectorAll('.home-studio, .service-story-opening, .service-story-outro').forEach(element => element.classList.add('is-motion-visible'));
        document.querySelectorAll('#portfolio .portfolio-intro, #portfolio .portfolio-intro-side, #portfolio .portfolio-project, #portfolio [data-portfolio-card]').forEach(element => element.classList.add('is-motion-visible'));
    };
    const onMotionPreferenceChange = () => {
        if (prefersReducedMotion.matches) {
            root.classList.remove('home-motion-ready');
            revealObserver?.disconnect();
            revealEverything();
        }
        requestScrollUpdate();
    };
    if (typeof prefersReducedMotion.addEventListener === 'function') prefersReducedMotion.addEventListener('change', onMotionPreferenceChange);
    else if (typeof prefersReducedMotion.addListener === 'function') prefersReducedMotion.addListener(onMotionPreferenceChange);
})();

/* Service cards: replace the legacy five-stage DOM without requiring an installer or index.php edits. */
(() => {
  'use strict';
  const render = () => {
    const old = document.querySelector('section.service-story#services-overview');
    if (!old || old.hasAttribute('data-services-cards')) return;
    const template = document.createElement('template');
    template.innerHTML = "    <!-- SERVICES: Eight disciplines, presented as a native vertical grid. -->\n    <section class=\"service-story home-section\" id=\"services-overview\" data-services-cards aria-labelledby=\"service-story-heading\">\n        <div class=\"site-wrap service-story-header\">\n            <div>\n                <p class=\"service-story-eyebrow\">What we do <span aria-hidden=\"true\">/</span> Our expertise</p>\n                <h2 id=\"service-story-heading\">Everything you need.<br><em>One team.</em></h2>\n            </div>\n            <div class=\"service-story-header-side\">\n                <p>From a first design conversation to the final finishing detail, our expertise brings every part of your space together — thoughtfully and seamlessly.</p>\n                <span class=\"service-story-meta\">Eight specialities · One coordinated vision</span>\n            </div>\n        </div>\n\n        <div class=\"site-wrap service-story-grid\" aria-label=\"Our eight services\">\n            <article class=\"service-card\">\n                <span class=\"service-card-number\">01</span>\n                <div class=\"service-card-media service-card-media-duo\" aria-label=\"Service photography\"><img src=\"assets/images/Services/3D Design.png\" alt=\"3D visual planning\" loading=\"lazy\" decoding=\"async\"><img src=\"assets/images/Services/Consultation.png\" alt=\"Client consultation\" loading=\"lazy\" decoding=\"async\"></div>\n                <div class=\"service-card-body\">\n                    <h3>3D Design &amp; Consultation</h3>\n                    <p>Visual planning and design advice tailored to your layout, priorities and budget.</p>\n                </div>\n            </article>\n            <article class=\"service-card\">\n                <span class=\"service-card-number\">02</span>\n                <div class=\"service-card-media\" aria-label=\"Service photography\"><img src=\"assets/images/Services/Construction.png\" alt=\"Construction site\" loading=\"lazy\" decoding=\"async\"></div>\n                <div class=\"service-card-body\">\n                    <h3>Construction</h3>\n                    <p>Building and development works, from project preparation to practical completion.</p>\n                </div>\n            </article>\n            <article class=\"service-card\">\n                <span class=\"service-card-number\">03</span>\n                <div class=\"service-card-media\" aria-label=\"Service photography\"><img src=\"assets/images/Services/Cabinetry.png\" alt=\"Custom cabinetry installation\" loading=\"lazy\" decoding=\"async\"></div>\n                <div class=\"service-card-body\">\n                    <h3>Custom Cabinetry</h3>\n                    <p>Kitchen cabinets, built-in storage and made-to-measure furniture produced for each space.</p>\n                </div>\n            </article>\n            <article class=\"service-card\">\n                <span class=\"service-card-number\">04</span>\n                <div class=\"service-card-media\" aria-label=\"Service photography\"><img src=\"assets/images/Services/Aluminium.png\" alt=\"Aluminium, glass and metal fabrication\" loading=\"lazy\" decoding=\"async\"></div>\n                <div class=\"service-card-body\">\n                    <h3>Aluminium, Glass &amp; Metal</h3>\n                    <p>Aluminium and glass works alongside welding and related fabrication.</p>\n                </div>\n            </article>\n            <article class=\"service-card\">\n                <span class=\"service-card-number\">05</span>\n                <div class=\"service-card-media\" aria-label=\"Service photography\"><img src=\"assets/images/Services/Flooring.png\" alt=\"Flooring materials and installation\" loading=\"lazy\" decoding=\"async\"></div>\n                <div class=\"service-card-body\">\n                    <h3>Flooring</h3>\n                    <p>Timber-look and other flooring options selected to suit the use and character of each space.</p>\n                </div>\n            </article>\n            <article class=\"service-card\">\n                <span class=\"service-card-number\">06</span>\n                <div class=\"service-card-media\" aria-label=\"Service photography\"><img src=\"assets/images/Services/Interior.png\" alt=\"Completed interior and wall finishes\" loading=\"lazy\" decoding=\"async\"></div>\n                <div class=\"service-card-body\">\n                    <h3>Wall Finishes</h3>\n                    <p>Wallpaper and decorative wall treatments as part of a coordinated interior scheme.</p>\n                </div>\n            </article>\n            <article class=\"service-card\">\n                <span class=\"service-card-number\">07</span>\n                <div class=\"service-card-media\" aria-label=\"Service photography\"><img src=\"assets/images/Services/Sofas.png\" alt=\"Custom sofas and upholstery\" loading=\"lazy\" decoding=\"async\"></div>\n                <div class=\"service-card-body\">\n                    <h3>Sofas &amp; Upholstery</h3>\n                    <p>Custom sofa and seating design with a focus on comfort, function and interior coordination.</p>\n                </div>\n            </article>\n            <article class=\"service-card\">\n                <span class=\"service-card-number\">08</span>\n                <div class=\"service-card-media\" aria-label=\"Service photography\"><img src=\"assets/images/Services/Blinds.png\" alt=\"Window blinds and curtains\" loading=\"lazy\" decoding=\"async\"></div>\n                <div class=\"service-card-body\">\n                    <h3>Blinds &amp; Curtains</h3>\n                    <p>Roller and automated blinds, curtains and other window-covering solutions.</p>\n                </div>\n            </article>\n        </div>\n\n        <div class=\"service-story-footer\">\n            <div class=\"site-wrap service-story-footer-inner\">\n                <p>Have a space in mind? Let's bring it to life.</p>\n                <div class=\"service-story-footer-actions\">\n                    <a class=\"btn primary\" href=\"public/pages/services.php\">Explore All Services <span aria-hidden=\"true\">↗</span></a>\n                    <a class=\"btn\" href=\"pages/book-appointment.php\">Book a Consultation</a>\n                </div>\n            </div>\n        </div>\n    </section>\n\n";
    const replacement = template.content.querySelector('section');
    if (!replacement) return;
    old.replaceWith(replacement);
    // Resolve the exact local Services PNG filenames relative to the site's assets folder.
    // This also works when the homepage is served with a query string or a different base URL.
    const assetsURL = document.querySelector('script[src*="assets/js/homepage.js"]')?.src;
    const servicesImageBase = assetsURL
      ? new URL('../images/Services/', assetsURL)
      : new URL('assets/images/Services/', document.baseURI);
    replacement.querySelectorAll('.service-card-media img').forEach((img) => {
      const imageFile = img.getAttribute('src').split('/').pop();
      img.src = new URL(imageFile, servicesImageBase).href;
      const handleError = () => {
        img.hidden = true;
        img.classList.add('image-unavailable');
        const media = img.closest('.service-card-media');
        if (media && !media.querySelector('img:not(.image-unavailable)')) {
          media.classList.add('service-card-media-missing');
        }
      };
      img.addEventListener('error', handleError, {once:true});
      if (img.complete && img.naturalWidth === 0) handleError();
    });
    /* IDEARE / Services card entrance. No pinned sections and no scroll interception. */
(() => {
  'use strict';
  const section = document.querySelector('.service-story[data-services-cards]');
  if (!section) return;
  const cards = [...section.querySelectorAll('.service-card')];
  if (!cards.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in-view');
      observer.unobserve(entry.target);
    }
  }, {threshold:.08,rootMargin:'0px 0px -28px 0px'});
  cards.forEach((card, index) => {
    card.style.setProperty('--reveal-delay', `${(index % 4) * 75}ms`);
    observer.observe(card);
  });
  section.classList.add('cards-motion-ready');
  /* Make cards visible if the user enables reduced motion while browsing. */
  const revealAll = () => {
    if (!reduced.matches) return;
    section.classList.remove('cards-motion-ready');
    cards.forEach(card => card.classList.add('is-in-view'));
    observer.disconnect();
  };
  reduced.addEventListener?.('change', revealAll);
  window.addEventListener('pagehide', () => observer.disconnect(), {once:true});
})();

  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, {once:true});
  else render();
})();


/** IDEARE homepage: cohesive editorial accent typography and an in-view typewriter. */
(() => {
  'use strict';
  if (document.documentElement.dataset.idearePage !== 'home') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [
    '#home-hero-title > span',
    '#home-about-title > span',
    '#pj-title > em',
    '#ci-home-title > em',
    '#service-title-04 > em'
  ];
  const initialized = new WeakSet();
  const observedContainer = new WeakMap();
  const observer = !reduced.matches && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const phrase = observedContainer.get(entry.target);
          if (phrase) activate(phrase);
        }
      }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' }) : null;

  function activate(element) {
    element.classList.remove('is-type-pending');
    if (reduced.matches || !observer) {
      element.classList.add('is-type-complete');
      return;
    }
    element.classList.add('is-typing');
    element.addEventListener('animationend', event => {
      if (event.animationName !== 'ideare-type-reveal') return;
      element.classList.remove('is-typing');
      element.classList.add('is-type-complete');
    }, { once: true });
  }

  function attach() {
    for (const selector of targets) {
      const element = document.querySelector(selector);
      if (!element || initialized.has(element)) continue;
      initialized.add(element);
      element.classList.add('ideare-artistic-phrase', 'ideare-typewriter');
      const chars = Array.from(element.textContent.trim()).length;
      element.style.setProperty('--ideare-typing-chars', String(Math.max(1, chars)));
      element.style.setProperty('--ideare-typing-duration', `${Math.min(2.35, Math.max(1.05, chars * .083)).toFixed(2)}s`);
      if (observer) {
        element.classList.add('is-type-pending');
        const container = element.parentElement || element;
        observedContainer.set(container, element);
        observer.observe(container);
      } else activate(element);
    }
  }

  // The About paragraph in the homepage HTML contains an unwanted em dash.
  const aboutCopy = document.querySelector('#about .studio-description');
  if (aboutCopy) aboutCopy.textContent = aboutCopy.textContent.replace('under one roof — from', 'under one roof, from');

  attach();
  // The project journey and rotating Inspiration gallery are injected by other scripts.
  // Observe additions only until all five phrases are attached.
  if (targets.every(selector => document.querySelector(selector))) return;
  const changes = new MutationObserver(() => {
    attach();
    if (targets.every(selector => document.querySelector(selector))) changes.disconnect();
  });
  changes.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => { changes.disconnect(); observer?.disconnect(); }, { once: true });
})();
