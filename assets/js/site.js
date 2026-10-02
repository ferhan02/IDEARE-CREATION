const navToggle=document.querySelector('.nav-toggle'),siteNav=document.querySelector('.site-nav');
if(navToggle&&siteNav)navToggle.addEventListener('click',()=>siteNav.classList.toggle('open'));
