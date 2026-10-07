(() => {
    const forms = document.querySelectorAll('[data-task-confirm]');

    forms.forEach(form => {
        form.addEventListener('submit', async event => {
            if (form.dataset.confirmed === '1') return;

            event.preventDefault();

            const title = form.dataset.confirmTitle || 'Are you sure?';
            const text = form.dataset.confirmText || '';
            const confirmText = form.dataset.confirmButton || 'Continue';
            const danger = form.dataset.confirmDanger === '1';

            if (!window.IdeaREAlert) {
                if (window.confirm([title, text].filter(Boolean).join('\n\n'))) {
                    form.dataset.confirmed = '1';
                    form.submit();
                }
                return;
            }

            const result = await window.IdeaREAlert.confirm({
                title,
                text,
                confirmText,
                cancelText: 'Cancel',
                danger,
                icon: danger ? 'warning' : 'info'
            });

            if (result.isConfirmed) {
                form.dataset.confirmed = '1';
                form.submit();
            }
        });
    });
})();
