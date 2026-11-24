/* Desktop: seamless continuous marquee with direct drag, wheel and keyboard control. */
import { mountGalleryGestures } from './portfolio-gestures.js';
export function mountPortfolioDesktop({motion}={}) {
    const root=document.querySelector('#portfolio.portfolio-showcase');
    const track=root?.querySelector('[data-portfolio-track]');
    const group=root?.querySelector('[data-portfolio-group]');
    const viewport=root?.querySelector('[data-portfolio-viewport]');
    if(!root||!track||!group||!viewport)return ()=>{};
    track.querySelector('[data-portfolio-clone]')?.remove();
    const clone=group.cloneNode(true);
    clone.dataset.portfolioClone='true';clone.setAttribute('aria-hidden','true');
    clone.querySelectorAll('[data-portfolio-open]').forEach(b=>b.tabIndex=-1);
    clone.querySelectorAll('img').forEach(i=>i.alt='');track.append(clone);
    root.dataset.portfolioLayout='desktop';
    track.style.setProperty('animation','none','important');
    let width=0,position=0,target=0,dragStart=0,dragging=false,last=0,until=0,raf=0,hover=false,focused=false,visible=true;
    const wrap=x=>width?((x%width)+width)%width:0;
    const paint=()=>{track.style.transform=`translate3d(${-wrap(position)}px,0,0)`;};
    const measure=()=>{width=group.getBoundingClientRect().width;paint();};
    const rest=()=>{until=performance.now()+3200;};
    const step=()=>{const cards=group.querySelectorAll('.portfolio-project');return cards.length>1?Math.abs(cards[1].offsetLeft-cards[0].offsetLeft):viewport.clientWidth;};
    function tick(t){
        const dt=last?Math.min(.05,(t-last)/1000):0;last=t;
        if(visible&&!document.hidden){
            if(!dragging&&!hover&&!focused&&!motion?.matches&&!root.classList.contains('is-modal-open')&&t>until)target+=dt*72;
            position+=motion?.matches?target-position:(target-position)*(1-Math.exp(-dt*(dragging?19:13)));paint();
            if(!dragging&&width&&Math.abs(position)>width*4){const shift=Math.trunc(position/width)*width;position-=shift;target-=shift;}
        }
        raf=requestAnimationFrame(tick);
    }
    const gestures=mountGalleryGestures(viewport,{
        begin(){dragging=true;dragStart=position;target=position;rest();},
        move(dx){target=dragStart-dx;rest();},
        end(dx,cancel,velocity){if(!cancel&&!motion?.matches)target-=Math.max(-step()*.65,Math.min(step()*.65,velocity*135));dragging=false;rest();},
        wheel(delta){target+=Math.sign(delta)*Math.min(Math.abs(delta),viewport.clientWidth*.8);rest();},
        key(dir){target+=dir*step();rest();}
    });
    const enter=e=>{if(e.pointerType!=='touch')hover=true;};
    const leave=e=>{if(e.pointerType!=='touch')hover=false;};
    const focus=()=>{focused=true;};const blur=e=>{if(!viewport.contains(e.relatedTarget))focused=false;};
    const modalOpen=()=>root.classList.add('is-modal-open');const modalClose=()=>{root.classList.remove('is-modal-open');rest();};
    viewport.addEventListener('pointerenter',enter);viewport.addEventListener('pointerleave',leave);
    viewport.addEventListener('focusin',focus);viewport.addEventListener('focusout',blur);
    document.addEventListener('portfolio:modal-open',modalOpen);document.addEventListener('portfolio:modal-close',modalClose);
    window.addEventListener('resize',measure);
    const ro='ResizeObserver'in window?new ResizeObserver(measure):null;ro?.observe(group);
    const io='IntersectionObserver'in window?new IntersectionObserver(es=>{visible=es[0].isIntersecting;}):null;io?.observe(viewport);
    measure();rest();raf=requestAnimationFrame(tick);
    return ()=>{cancelAnimationFrame(raf);gestures();ro?.disconnect();io?.disconnect();window.removeEventListener('resize',measure);
        viewport.removeEventListener('pointerenter',enter);viewport.removeEventListener('pointerleave',leave);viewport.removeEventListener('focusin',focus);viewport.removeEventListener('focusout',blur);
        document.removeEventListener('portfolio:modal-open',modalOpen);document.removeEventListener('portfolio:modal-close',modalClose);
        clone.remove();track.style.removeProperty('animation');track.style.removeProperty('transform');root.classList.remove('is-modal-open');delete root.dataset.portfolioLayout;};
}
