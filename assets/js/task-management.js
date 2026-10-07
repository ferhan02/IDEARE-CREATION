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

    document.querySelectorAll('[data-comment-type]').forEach(select => {
        const form = select.closest('form');
        const progressField = form?.querySelector('[data-progress-field]');

        if (!progressField) return;

        const sync = () => {
            progressField.hidden = select.value !== 'progress';
        };

        select.addEventListener('change', sync);
        sync();
    });

    document.querySelectorAll('[data-task-edit-form]').forEach(form => {
        const status = form.querySelector('[data-task-status-select]');
        const completionWrap = form.querySelector('[data-completion-note-wrap]');
        const completionNote = completionWrap?.querySelector('textarea');

        if (!status || !completionWrap || !completionNote) return;

        const sync = () => {
            const needsNote = status.value === 'completed';
            completionWrap.classList.toggle('is-required', needsNote);
            completionNote.required = needsNote;
        };

        status.addEventListener('change', sync);
        sync();
    });
})();
