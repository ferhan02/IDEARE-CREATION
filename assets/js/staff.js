const menuBtn=document.getElementById('menuBtn'),sidebar=document.getElementById('sidebar');
if(menuBtn&&sidebar)menuBtn.addEventListener('click',()=>sidebar.classList.toggle('open'));

document.querySelectorAll('.flash').forEach(el=>setTimeout(()=>el.classList.add('fade'),3500));

/* IDEARE profile menu: CSS handles hover; JS makes it reliable for touch/click. */
(() => {
    const menus = [...document.querySelectorAll('.profile-menu')];
    if (!menus.length) return;

    const closeMenu = (menu) => {
        menu.classList.remove('is-open');
        const trigger = menu.querySelector('.profile-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
    };

    const closeAll = (except = null) => {
        menus.forEach(menu => {
            if (menu !== except) closeMenu(menu);
        });
    };

    menus.forEach(menu => {
        const trigger = menu.querySelector('.profile-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            const opening = !menu.classList.contains('is-open');
            closeAll(menu);
            menu.classList.toggle('is-open', opening);
            trigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
        });

        menu.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenu(menu);
                trigger.focus();
            }
        });
    });

    document.addEventListener('click', () => closeAll());
    window.addEventListener('resize', () => closeAll());
})();
