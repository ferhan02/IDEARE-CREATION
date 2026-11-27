/* Keep the real stage buttons and their existing event listeners. */
(() => {
  const app = document.getElementById('id3-app');
  if (!app) return;
  const bar = app.querySelector('.id3-topline');
  const nav = app.querySelector('.id3-steps');
  const actions = bar?.querySelector('.id3-top-actions');
  if (!bar || !nav || !actions) return;
  for (const button of nav.querySelectorAll('button[data-step]')) {
    const number = button.querySelector('span');
    if (number) number.textContent = String(Number(button.dataset.step));
  }
  bar.insertBefore(nav, actions);
  bar.classList.add('id3-compact-bar');
})();
