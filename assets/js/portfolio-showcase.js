/* IDEARE homepage portfolio — shared project cards, accessible project modal,
 * scroll fade and nested full-screen photograph viewer.
 */
(() => {
    'use strict';

    const section = document.getElementById('portfolio');
    if (!section) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

    const make = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    };

    const imageCaption = filename => filename
        .replace(/\.[^.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const createCard = (project, index) => {
        const title = project.title || 'IDEARE Project';
        const card = make('button', 'portfolio-project');
        card.type = 'button';
        card.dataset.portfolioOpen = 'true';
        card.dataset.projectIndex = String(index);
        card.setAttribute('aria-label', `Open ${title} project gallery`);

        if (project.cover && project.cover.src) {
            const image = make('img', 'portfolio-project-image');
            image.src = project.cover.src;
            image.alt = `${title} project cover`;
            image.loading = 'lazy';
            image.decoding = 'async';
            card.appendChild(image);
        } else {
            const placeholder = make('span', 'portfolio-project-placeholder');
            placeholder.append(
                make('span', 'portfolio-placeholder-index', 'IDEARE / SELECTED PROJECT'),
                make('strong', 'portfolio-placeholder-title', 'Project photographs coming soon'),
                make('span', 'portfolio-placeholder-note', 'Add the cover photograph to this project folder')
            );
            card.appendChild(placeholder);
        }

        card.appendChild(make('span', 'portfolio-project-shade'));

        const copy = make('span', 'portfolio-project-copy');
        const metaText = [project.category, project.location].filter(Boolean).join('  /  ');
        copy.appendChild(make('span', 'portfolio-project-meta', metaText || 'IDEARE PROJECT'));
        copy.appendChild(make('strong', 'portfolio-project-title', title));

        const bottom = make('span', 'portfolio-project-bottom');
        bottom.appendChild(make(
            'span',
            'portfolio-project-count',
            `${String(index + 1).padStart(2, '0')}  /  ${String(project.total || 0).padStart(2, '0')}`
        ));
        bottom.appendChild(make('span', 'portfolio-project-action', 'Explore project  ↗'));
        copy.appendChild(bottom);
        card.appendChild(copy);

        return card;
    };

    const buildSection = projects => {
        const shell = make('div', 'site-wrap portfolio-shell');

        const intro = make('div', 'portfolio-intro');
        const introCopy = make('div', 'portfolio-intro-copy');
        introCopy.append(
            make('p', 'portfolio-kicker', 'PORTFOLIO  /  SELECTED WORK'),
            make('h2', 'portfolio-heading', 'Spaces made memorable.'),
            make(
                'p',
                'portfolio-description',
                'A selection of places, interiors and environments shaped by the IDEARE team — each with its own story.'
            )
        );

        const introSide = make('div', 'portfolio-intro-side');
        introSide.append(
            make('span', 'portfolio-intro-rule'),
            make(
                'p',
                'portfolio-intro-note',
                'Explore a project to see the full collection of photographs and a little more about the work.'
            )
        );
        intro.append(introCopy, introSide);

        const gallery = make('div', 'portfolio-gallery');
        gallery.dataset.portfolioGallery = 'true';

        const viewport = make('div', 'portfolio-viewport');
        viewport.dataset.portfolioViewport = 'true';

        const track = make('div', 'portfolio-track');
        track.dataset.portfolioTrack = 'true';

        const group = make('div', 'portfolio-track-group');
        group.dataset.portfolioGroup = 'true';

        projects.forEach((project, index) => {
            project.total = projects.length;
            group.appendChild(createCard(project, index));
        });

        track.appendChild(group);
        viewport.appendChild(track);
        gallery.appendChild(viewport);

        const galleryFooter = make('div', 'portfolio-gallery-footer');
        galleryFooter.append(
            make('span', 'portfolio-gallery-hint', 'SELECT A PROJECT TO EXPLORE THE FULL GALLERY'),
            make('span', 'portfolio-gallery-counter', `01  /  ${String(projects.length).padStart(2, '0')}`)
        );
        galleryFooter.querySelector('.portfolio-gallery-counter').dataset.portfolioCounter = 'true';
        gallery.appendChild(galleryFooter);

        shell.append(intro, gallery);
        section.replaceChildren(shell);
        section.classList.add('portfolio-showcase');
        section.dataset.portfolioReady = 'true';
    };

    const buildModal = () => {
        const modal = make('div', 'portfolio-modal');
        modal.setAttribute('aria-hidden', 'true');
        modal.inert = true;

        const backdrop = make('div', 'portfolio-modal-backdrop');
        backdrop.dataset.portfolioClose = 'true';

        const panel = make('div', 'portfolio-modal-panel');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'portfolio-modal-title');
        panel.setAttribute('tabindex', '-1');

        const close = make('button', 'portfolio-modal-close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', 'Close project gallery');
        close.dataset.portfolioClose = 'true';

        const info = make('header', 'portfolio-modal-info');
        const meta = make('p', 'portfolio-modal-meta');
        const title = make('h2', 'portfolio-modal-title');
        title.id = 'portfolio-modal-title';
        const description = make('p', 'portfolio-modal-description');
        info.append(meta, title, description);

        const gallery = make('div', 'portfolio-modal-gallery');
        gallery.setAttribute('aria-label', 'Project photographs');

        panel.append(close, info, gallery);

        // This second overlay sits above the project popup. Its background is
        // clickable; the photograph itself is not, so it remains open until
        // the visitor clicks outside the image or presses Escape.
        const viewer = make('div', 'portfolio-image-viewer');
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-modal', 'true');
        viewer.setAttribute('aria-label', 'Expanded project photograph');
        viewer.setAttribute('aria-hidden', 'true');
        viewer.setAttribute('tabindex', '-1');
        viewer.inert = true;

        const viewerImage = make('img', 'portfolio-image-viewer-image');
        viewerImage.alt = '';
        const viewerCaption = make('p', 'portfolio-image-viewer-caption');
        viewer.append(viewerImage, viewerCaption);

        modal.append(backdrop, panel, viewer);
        document.body.appendChild(modal);

        return {
            modal,
            backdrop,
            panel,
            close,
            meta,
            title,
            description,
            gallery,
            viewer,
            viewerImage,
            viewerCaption
        };
    };

    const renderModalGallery = (gallery, project) => {
        gallery.replaceChildren();

        if (!project.images || !project.images.length) {
            const empty = make('div', 'portfolio-modal-empty');
            empty.append(
                make('span', 'portfolio-empty-mark', 'IDEARE'),
                make('strong', '', 'Photographs are being prepared'),
                make(
                    'p',
                    '',
                    'Add this project’s images to its folder inside assets/images/portfolio/. They will appear here automatically.'
                )
            );
            gallery.appendChild(empty);
            return;
        }

        project.images.forEach((photo, index) => {
            const captionText = imageCaption(photo.name || `Project photograph ${index + 1}`);
            const figure = make('figure', 'portfolio-modal-photo');
            if (index === 0) figure.classList.add('is-cover-photo');

            const trigger = make('button', 'portfolio-modal-photo-trigger');
            trigger.type = 'button';
            trigger.dataset.portfolioImageOpen = 'true';
            trigger.setAttribute('aria-label', `Enlarge photograph: ${captionText}`);

            const image = make('img');
            image.src = photo.src;
            image.alt = `${project.title} — ${captionText}`;
            image.loading = index < 2 ? 'eager' : 'lazy';
            image.decoding = 'async';

            const caption = make('figcaption', '', captionText);
            trigger.appendChild(image);
            figure.append(trigger, caption);
            gallery.appendChild(figure);
        });
    };

    const mountInteractions = projects => {
        const ui = buildModal();

        let lastTrigger = null;
        let lastImageTrigger = null;
        let previousOverflow = '';
        let isOpen = false;
        let imageViewerOpen = false;

        const openImageViewer = (image, trigger, caption) => {
            if (!image || !image.src) return;

            lastImageTrigger = trigger || null;
            ui.viewerImage.src = image.currentSrc || image.src;
            ui.viewerImage.alt = image.alt || caption || 'Project photograph';
            ui.viewerCaption.textContent = caption || '';

            ui.panel.inert = true;
            ui.viewer.inert = false;
            ui.viewer.setAttribute('aria-hidden', 'false');
            ui.viewer.classList.add('is-open');
            imageViewerOpen = true;

            window.requestAnimationFrame(() => ui.viewer.focus());
        };

        const closeImageViewer = () => {
            if (!imageViewerOpen) return;

            imageViewerOpen = false;
            ui.viewer.classList.remove('is-open');
            ui.viewer.setAttribute('aria-hidden', 'true');
            ui.viewer.inert = true;
            ui.viewerImage.removeAttribute('src');
            ui.panel.inert = false;

            if (lastImageTrigger && lastImageTrigger.isConnected) {
                lastImageTrigger.focus();
            }
            lastImageTrigger = null;
        };

        const openProject = (index, trigger) => {
            const project = projects[index];
            if (!project) return;

            lastTrigger = trigger || null;
            ui.meta.textContent = [project.category, project.location].filter(Boolean).join('  /  ');
            ui.title.textContent = project.title || 'IDEARE Project';
            ui.description.textContent = project.description || '';
            renderModalGallery(ui.gallery, project);

            ui.panel.scrollTop = 0;
            ui.gallery.scrollTop = 0;
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            document.body.classList.add('portfolio-modal-active');

            ui.modal.inert = false;
            ui.modal.setAttribute('aria-hidden', 'false');
            ui.modal.classList.add('is-open');
            isOpen = true;

            document.dispatchEvent(new CustomEvent('portfolio:modal-open'));
            window.requestAnimationFrame(() => ui.close.focus());
        };

        const closeModal = () => {
            if (!isOpen) return;

            if (imageViewerOpen) closeImageViewer();

            isOpen = false;
            ui.modal.classList.remove('is-open');
            ui.modal.setAttribute('aria-hidden', 'true');
            ui.modal.inert = true;
            document.body.classList.remove('portfolio-modal-active');
            document.body.style.overflow = previousOverflow;

            document.dispatchEvent(new CustomEvent('portfolio:modal-close'));
            if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus();
            lastTrigger = null;
        };

        section.addEventListener('click', event => {
            const trigger = event.target.closest('[data-portfolio-open]');
            if (!trigger || !section.contains(trigger)) return;

            const index = Number.parseInt(trigger.dataset.projectIndex, 10);
            if (Number.isInteger(index)) openProject(index, trigger);
        });

        ui.gallery.addEventListener('click', event => {
            const trigger = event.target.closest('[data-portfolio-image-open]');
            if (!trigger || !ui.gallery.contains(trigger)) return;

            const image = trigger.querySelector('img');
            const caption = trigger.closest('figure')?.querySelector('figcaption')?.textContent || '';
            openImageViewer(image, trigger, caption);
        });

        ui.viewer.addEventListener('click', event => {
            // Clicking the image keeps the image viewer open. Any surrounding
            // area returns to the still-open project popup.
            if (event.target !== ui.viewerImage) closeImageViewer();
        });

        ui.modal.addEventListener('click', event => {
            if (event.target === ui.backdrop || event.target.closest('[data-portfolio-close]')) {
                closeModal();
            }
        });

        const onKeydown = event => {
            if (!isOpen) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                if (imageViewerOpen) closeImageViewer();
                else closeModal();
                return;
            }

            if (event.key !== 'Tab') return;

            if (imageViewerOpen) {
                event.preventDefault();
                ui.viewer.focus();
                return;
            }

            const focusable = [...ui.panel.querySelectorAll(
                'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
            )].filter(element => !element.hasAttribute('hidden'));

            if (!focusable.length) {
                event.preventDefault();
                ui.panel.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeydown);

        return () => {
            document.removeEventListener('keydown', onKeydown);
            if (isOpen) closeModal();
            ui.modal.remove();
        };
    };

    const mountExitFade = () => {
        let frame = 0;
        const clamp = value => Math.max(0, Math.min(1, value));

        const update = () => {
            frame = 0;

            if (motionPreference.matches) {
                section.style.setProperty('--portfolio-exit-progress', '0');
                return;
            }

            const rect = section.getBoundingClientRect();
            const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight);
            const fadeStart = viewportHeight * 0.92;
            const fadeEnd = viewportHeight * 0.20;
            const progress = clamp((fadeStart - rect.bottom) / (fadeStart - fadeEnd));
            section.style.setProperty('--portfolio-exit-progress', progress.toFixed(3));
        };

        const requestUpdate = () => {
            if (!frame) frame = window.requestAnimationFrame(update);
        };

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);
        if (motionPreference.addEventListener) motionPreference.addEventListener('change', requestUpdate);
        update();

        return () => {
            window.removeEventListener('scroll', requestUpdate);
            window.removeEventListener('resize', requestUpdate);
            if (motionPreference.removeEventListener) motionPreference.removeEventListener('change', requestUpdate);
            if (frame) window.cancelAnimationFrame(frame);
            section.style.removeProperty('--portfolio-exit-progress');
        };
    };

    const start = async () => {
        try {
            const endpoint = new URL('api/portfolio.php', document.baseURI);
            const response = await fetch(endpoint.href, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error(`Portfolio feed returned ${response.status}`);

            const payload = await response.json();
            if (!Array.isArray(payload.projects) || !payload.projects.length) {
                throw new Error('Portfolio feed contains no projects');
            }

            buildSection(payload.projects);
            const cleanInteractions = mountInteractions(payload.projects);
            const cleanExitFade = mountExitFade();

            document.dispatchEvent(new CustomEvent('portfolio:ready'));

            window.addEventListener('pagehide', () => {
                cleanInteractions();
                cleanExitFade();
            }, { once: true });
        } catch (error) {
            console.warn(
                'IDEARE portfolio showcase could not be loaded; the original homepage portfolio remains available.',
                error
            );
        }
    };

    start();
})();
