/* Both studios: native top-layer for viewport-positioned popups; CSS fallback elsewhere. */
(()=>{
 const root=document.documentElement;if(!['designer','home-configurator'].includes(root.dataset.idearePage))return;
 const fixedSelectors='#studio-items.ideare-anchored-items,#catalog-menu,#hc-card-guide,#hc-colour-pop';
 const allSelectors=fixedSelectors+',#studio-library-preview,#studio-hover,#inspector,.hc-context,#hc-final-panel,.swal2-container,dialog[open],.id3-megamenu,.v9-picker';
 const managed=new Set();let pending=0;
 const displayed=el=>!!el&&!el.hidden&&!el.closest('[hidden]')&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none'&&el.getClientRects().length>0;
 const modalOpen=()=>[...document.querySelectorAll('dialog[open],.swal2-container')].some(displayed);
 function lower(el){if(managed.has(el)){try{if(el.matches(':popover-open'))el.hidePopover();}catch(_){}el.removeAttribute('popover');managed.delete(el);}}
 function sync(){pending=0;const modal=modalOpen();for(const el of [...managed])if(!el.isConnected||el.hidden||el.closest('[hidden]')||modal)lower(el);
   // Keep existing DOM ancestry, event handlers, theme variables and positioning.
   if(!modal)for(const el of document.querySelectorAll(fixedSelectors)){
     if(managed.has(el)||!displayed(el)||typeof el.showPopover!=='function'||getComputedStyle(el).position!=='fixed')continue;
     try{el.setAttribute('popover','manual');el.showPopover();managed.add(el);}catch(_){el.removeAttribute('popover');}
   }
   const active=modal||[...document.querySelectorAll(allSelectors)].some(displayed);root.classList.toggle('ideare-studio-popup-active',active);
 }
 function schedule(){if(!pending)pending=requestAnimationFrame(sync);}
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open','aria-hidden','class']});
 window.addEventListener('resize',schedule);document.addEventListener('click',schedule,true);document.addEventListener('pointerover',schedule,{passive:true});schedule();
})();
