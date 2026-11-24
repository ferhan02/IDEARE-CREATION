/* Tablet/phone: frame-rate independent drag easing and seamless slide settling. */
import { mountGalleryGestures } from './portfolio-gestures.js';
export function mountPortfolioSlider({motion,device='phone'}={}) {
    const root=document.querySelector('#portfolio.portfolio-showcase');
    const viewport=root?.querySelector('[data-portfolio-viewport]');
    const group=root?.querySelector('[data-portfolio-group]');
    if(!root||!viewport||!group)return ()=>{};
    group.querySelectorAll('[data-portfolio-clone]').forEach(n=>n.remove());
    const slides=[...group.querySelectorAll('.portfolio-project')],count=slides.length;
    root.dataset.portfolioLayout=device;
    if(count<2)return ()=>{delete root.dataset.portfolioLayout;};
    const last=slides[count-1].cloneNode(true),first=slides[0].cloneNode(true);
    for(const c of [last,first]){c.dataset.portfolioClone='true';c.setAttribute('aria-hidden','true');c.tabIndex=-1;c.querySelectorAll('*').forEach(n=>{if('tabIndex'in n)n.tabIndex=-1;});c.querySelectorAll('img').forEach(n=>n.alt='');}
    group.prepend(last);group.append(first);
    group.style.setProperty('transition','none','important');
    let position=1,target=1,origin=1,anchor=1,dragging=false,hover=false,focused=false,visible=true,raf=0,lastTime=0,until=performance.now()+6500,wheelSum=0,wheelTime=0;
    const rest=()=>{until=performance.now()+6500;};
    const paint=()=>{group.style.transform=`translate3d(${-position*100}%,0,0)`;};
    const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    function normalize(){if(target===0&&Math.abs(position)<.001){position=target=count;}else if(target===count+1&&Math.abs(position-target)<.001){position=target=1;}}
    function go(dir){if(dragging)return;normalize();target=clamp(Math.round(target)+dir,0,count+1);rest();}
    function tick(t){const dt=lastTime?Math.min(.05,(t-lastTime)/1000):0;lastTime=t;
        if(visible&&!document.hidden){
            if(!dragging&&!hover&&!focused&&!motion?.matches&&!root.classList.contains('is-modal-open')&&t>until)go(1);
            const delta=target-position;position+=motion?.matches?delta:delta*(1-Math.exp(-dt*(dragging?19:13)));
            if(!dragging&&Math.abs(target-position)<.001){position=target;normalize();}paint();
        }raf=requestAnimationFrame(tick);
    }
    const gesture=mountGalleryGestures(viewport,{
        begin(){normalize();dragging=true;origin=position;anchor=clamp(Math.round(position),0,count+1);target=position;rest();},
        move(dx){target=clamp(origin-dx/Math.max(1,viewport.clientWidth),Math.max(0,anchor-1),Math.min(count+1,anchor+1));rest();},
        end(dx,cancel,velocity){dragging=false;const threshold=Math.min(55,viewport.clientWidth*.15);const travel=dx+(motion?.matches?0:velocity*100);target=clamp(anchor+(!cancel&&Math.abs(travel)>threshold?(travel<0?1:-1):0),0,count+1);rest();},
        wheel(delta){const now=performance.now();if(now-wheelTime>180)wheelSum=0;wheelTime=now;wheelSum+=delta;if(Math.abs(wheelSum)>=45){go(Math.sign(wheelSum));wheelSum=0;}},
        key(dir){go(dir);}
    });
    const enter=e=>{if(e.pointerType!=='touch')hover=true;};const leave=e=>{if(e.pointerType!=='touch'){hover=false;rest();}};
    const focus=e=>{if(e.target.matches(':focus-visible'))focused=true;};const blur=e=>{if(!viewport.contains(e.relatedTarget)){focused=false;rest();}};
    const open=()=>rest(),close=()=>rest(),visibility=()=>rest(),change=()=>rest();
    viewport.addEventListener('pointerenter',enter);viewport.addEventListener('pointerleave',leave);viewport.addEventListener('focusin',focus);viewport.addEventListener('focusout',blur);
    document.addEventListener('portfolio:modal-open',open);document.addEventListener('portfolio:modal-close',close);document.addEventListener('visibilitychange',visibility);motion?.addEventListener?.('change',change);
    const io='IntersectionObserver'in window?new IntersectionObserver(es=>{visible=es[0].isIntersecting;rest();}):null;io?.observe(viewport);
    paint();raf=requestAnimationFrame(tick);
    return ()=>{cancelAnimationFrame(raf);gesture();io?.disconnect();viewport.removeEventListener('pointerenter',enter);viewport.removeEventListener('pointerleave',leave);viewport.removeEventListener('focusin',focus);viewport.removeEventListener('focusout',blur);document.removeEventListener('portfolio:modal-open',open);document.removeEventListener('portfolio:modal-close',close);document.removeEventListener('visibilitychange',visibility);motion?.removeEventListener?.('change',change);last.remove();first.remove();group.style.removeProperty('transform');group.style.removeProperty('transition');delete root.dataset.portfolioLayout;};
}
