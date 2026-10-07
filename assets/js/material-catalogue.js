(() => {
    const filterForm = document.getElementById('catalogueFilters');
    document.querySelectorAll('[data-auto-submit]').forEach((select) => {
        select.addEventListener('change', () => {
            if (!filterForm) return;
            const pageInput = filterForm.querySelector('input[name="page"]');
            if (pageInput) pageInput.remove();
            filterForm.submit();
        });
    });

    const dialog = document.getElementById('materialDialog');
    if (!dialog) return;

    const image = document.getElementById('dialogMaterialImage');
    const imageFallback = document.getElementById('dialogImageFallback');
    const supplier = document.getElementById('dialogSupplier');
    const brand = document.getElementById('dialogBrand');
    const code = document.getElementById('dialogMaterialCode');
    const title = document.getElementById('materialDialogTitle');
    const category = document.getElementById('dialogCategory');
    const series = document.getElementById('dialogSeries');
    const finish = document.getElementById('dialogFinish');
    const copyButton = document.getElementById('copyMaterialCode');

    let currentCode = '';

    const setText = (element, value, fallback = '—') => {
        if (!element) return;
        element.textContent = String(value || '').trim() || fallback;
    };

    const openDialog = (payload) => {
        currentCode = payload.code || '';

        setText(supplier, payload.supplier, 'Material');
        setText(brand, payload.brand, '');
        setText(code, payload.code, 'No code');
        setText(title, payload.name, 'Material finish');
        setText(category, payload.category);
        setText(series, payload.series);
        setText(finish, payload.finish);

        if (image && imageFallback) {
            image.hidden = true;
            imageFallback.hidden = true;
            image.removeAttribute('src');

            if (payload.image) {
                image.src = payload.image;
                image.alt = `${payload.name || 'Material'} ${payload.code || ''}`.trim();
                image.hidden = false;
            } else {
                imageFallback.hidden = false;
            }
        }

        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    };

    document.querySelectorAll('.material-view-btn').forEach((button) => {
        button.addEventListener('click', () => {
            try {
                openDialog(JSON.parse(button.dataset.material || '{}'));
            } catch (error) {
                console.error('Unable to open material details.', error);
            }
        });
    });

    if (image && imageFallback) {
        image.addEventListener('error', () => {
            image.hidden = true;
            imageFallback.hidden = false;
        });
    }

    document.querySelectorAll('[data-dialog-close]').forEach((button) => {
        button.addEventListener('click', () => dialog.close());
    });

    dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        const outside =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;

        if (outside) {
            dialog.close();
        }
    });

    copyButton?.addEventListener('click', async () => {
        if (!currentCode) return;

        const original = copyButton.textContent;

        try {
            await navigator.clipboard.writeText(currentCode);
            copyButton.textContent = 'Copied';
        } catch (error) {
            const temp = document.createElement('textarea');
            temp.value = currentCode;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            temp.remove();
            copyButton.textContent = 'Copied';
        }

        window.setTimeout(() => {
            copyButton.textContent = original;
        }, 1400);
    });
})();
