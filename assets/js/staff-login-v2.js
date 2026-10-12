(() => {
    'use strict';
    const toggle = document.querySelector('.login-password-toggle');
    const password = document.getElementById('loginPassword');
    if (!toggle || !password) return;

    toggle.addEventListener('click', () => {
        const visible = password.type === 'password';
        password.type = visible ? 'text' : 'password';
        toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
        toggle.setAttribute('title', visible ? 'Hide password' : 'Show password');
        toggle.setAttribute('aria-pressed', String(visible));
        toggle.classList.toggle('is-visible', visible);
        password.focus({ preventScroll: true });
    });
})();
