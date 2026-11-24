/* Shared horizontal interaction; preserve real card clicks and native vertical touch scrolling. */
export function mountGalleryGestures(viewport, {begin=()=>{}, move=()=>{}, end=()=>{}, wheel=()=>{}, key=()=>{}}) {
    let gesture=null, suppressUntil=0;
    const oldTab=viewport.getAttribute('tabindex');
    viewport.tabIndex=0;
    const oldLabel=viewport.getAttribute('aria-label');
    if(!oldLabel) viewport.setAttribute('aria-label','Project gallery. Drag or use left and right arrow keys to browse projects.');
    const down=e=>{
        if(!e.isPrimary || e.button!==0) return;
        suppressUntil=0;
        gesture={id:e.pointerId,x:e.clientX,y:e.clientY,drag:false,lastX:e.clientX,lastTime:performance.now(),velocity:0};
    };
    const motion=e=>{
        if(!gesture || e.pointerId!==gesture.id) return;
        const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
        if(!gesture.drag){
            if(Math.abs(dy)>10 && Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
            if(Math.abs(dx)<8 || Math.abs(dx)<Math.abs(dy)*1.2) return;
            gesture.drag=true;begin();viewport.classList.add('is-gallery-dragging');
            try{viewport.setPointerCapture(e.pointerId);}catch(_){}
        }
        if(e.cancelable)e.preventDefault();
        const now=performance.now(),dt=now-gesture.lastTime;
        if(dt>0){const v=(e.clientX-gesture.lastX)/dt;gesture.velocity=gesture.velocity*.35+v*.65;}
        gesture.lastX=e.clientX;gesture.lastTime=now;
        move(dx);
    };
    const finish=(e,cancel=false)=>{
        if(!gesture || e.pointerId!==gesture.id)return;
        const g=gesture;gesture=null;
        if(g.drag){
            suppressUntil=performance.now()+500;
            end(e.clientX-g.x,cancel,performance.now()-g.lastTime<100?g.velocity:0);
            viewport.classList.remove('is-gallery-dragging');
        }
        try{if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);}catch(_){}
    };
    const up=e=>finish(e),cancel=e=>finish(e,true);
    const click=e=>{if(e.detail!==0 && performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();suppressUntil=0;}};
    const drag=e=>e.preventDefault();
    const scroll=e=>{
        if(e.ctrlKey||e.metaKey||!e.cancelable)return;
        const delta=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientWidth:1);
        if(!delta)return;
        e.preventDefault();e.stopPropagation();wheel(delta);
    };
    const keyboard=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();key(e.key==='ArrowRight'?1:-1);}};
    viewport.addEventListener('pointerdown',down);
    window.addEventListener('pointermove',motion,{passive:false});
    window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);
    viewport.addEventListener('lostpointercapture',cancel);
    viewport.addEventListener('click',click,true);viewport.addEventListener('dragstart',drag,true);
    viewport.addEventListener('wheel',scroll,{passive:false});viewport.addEventListener('keydown',keyboard);
    return ()=>{
        if(gesture){const id=gesture.id;gesture=null;try{if(viewport.hasPointerCapture(id))viewport.releasePointerCapture(id);}catch(_){} }
        viewport.classList.remove('is-gallery-dragging');
        viewport.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',motion);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);
        viewport.removeEventListener('lostpointercapture',cancel);viewport.removeEventListener('click',click,true);viewport.removeEventListener('dragstart',drag,true);viewport.removeEventListener('wheel',scroll);viewport.removeEventListener('keydown',keyboard);
        if(oldTab===null)viewport.removeAttribute('tabindex');else viewport.setAttribute('tabindex',oldTab);
        if(oldLabel===null)viewport.removeAttribute('aria-label');else viewport.setAttribute('aria-label',oldLabel);
    };
}
