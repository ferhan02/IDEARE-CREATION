const menuBtn=document.getElementById('menuBtn'),sidebar=document.getElementById('sidebar');
if(menuBtn&&sidebar)menuBtn.addEventListener('click',()=>sidebar.classList.toggle('open'));
document.querySelectorAll('.flash').forEach(el=>setTimeout(()=>el.classList.add('fade'),3500));
