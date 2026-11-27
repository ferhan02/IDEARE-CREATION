/* IDEARE: isolated, on-demand previews of the actual scene objects. */
export function installItemPreviews({THREE, getSource, getSpec, isBuild}) {
  const panel = document.getElementById('studio-items');
  const list = document.getElementById('cabinet-list');
  if (!panel || !list) return {refresh(){}};
  const header = panel.querySelector('.id3-list-header');
  if (header) {
    const title = header.querySelector('strong');
    if (title) title.textContent = 'Items in design';
    const count = document.createElement('span'); count.className='ideare-items-count';
    const close = document.createElement('button'); close.type='button'; close.className='ideare-items-close'; close.textContent='×'; close.title='Close items'; close.setAttribute('aria-label','Close items');
    close.onclick=()=>{panel.hidden=true;document.getElementById('list-toggle')?.setAttribute('aria-expanded','false');document.getElementById('list-toggle')?.focus();};
    if(title) title.after(count); header.append(close);
  }
  let renderer, scene, camera, failed=false, frame=0, queue=[], generation=0;
  const cache=new Map(), MAX_CACHE=100;
  const fallback=(type)=>{const paths={cabinet:'M4 5 12 2l8 3v14l-8 3-8-3zM4 5l8 3 8-3M12 8v14M7 10v6',extra:'M4 3h16v18H4zM4 8h16M7 5h1M10 5h1M7 11h10v7H7z',splash:'M3 5h18v14H3zM3 12h18M9 5v7m6 0v7'};return `<svg viewBox="0 0 24 24" width="29" height="29" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[type]}"/></svg>`;};
  function init(){if(renderer||failed)return !!renderer;try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(216,176,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xfff9ef,0xb7b5b0,2.4));
    const key=new THREE.DirectionalLight(0xfff0db,2.3);key.position.set(3,5,6);scene.add(key);const fill=new THREE.DirectionalLight(0xe4edff,1.15);fill.position.set(-4,3,-2);scene.add(fill);
    camera=new THREE.PerspectiveCamera(35,216/176,.01,150);return true;
  }catch(error){failed=true;console.warn('IDEARE item previews unavailable',error);return false;}}
  function render(source,type){if(!source||!init())return null;let clone;
    try{clone=source.clone(true);clone.position.set(0,0,0);clone.rotation.set(0,0,0);clone.visible=true;
      // Hide selection wireframes, not materials or cabinet details. Geometry and textures are shared read-only.
      clone.traverse(o=>{if(o.isLineSegments||/outline|selection_highlight/i.test(o.name||''))o.visible=false;});
      scene.add(clone);clone.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(clone);if(box.isEmpty())return null;const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
      const dir=type==='splash'?new THREE.Vector3(.18,.10,1):new THREE.Vector3(.66,.42,1);dir.normalize();
      const radius=Math.max(.03,size.length()/2),angle=Math.min(camera.fov*Math.PI/360,Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect));const dist=radius/Math.sin(angle)*1.10;
      camera.near=Math.max(.001,dist-radius*1.4);camera.far=Math.max(10,dist+radius*4);camera.position.copy(center).addScaledVector(dir,dist);camera.lookAt(center);camera.updateProjectionMatrix();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');
    }catch(error){console.warn('IDEARE item thumbnail',error);return null;}finally{if(clone)scene.remove(clone);/* Do not dispose shared live-scene geometry/materials. */}}
  const keyFor=(type,id,spec,source)=>{
    // Positions don't change the preview. Include finish/door state and texture load status.
    const data={...spec};for(const k of ['x','z','rotation','offset','bottom','wallIndex'])delete data[k];
    const textures=[];source?.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m?.map)textures.push([m.map.uuid,m.map.version,!!(m.map.image?.width||m.map.image?.videoWidth)]);});
    return JSON.stringify([type,id,data,textures]);
  };
  function put(task,url){if(!task.box.isConnected)return;if(url){const img=document.createElement('img');img.alt='';img.draggable=false;img.src=url;task.box.replaceChildren(img);}else{task.box.innerHTML=fallback(task.type);task.box.title='Model preview unavailable';}}
  function next(){frame=0;if(panel.hidden||!isBuild()){queue=[];return;}const task=queue.shift();if(!task)return;if(task.generation===generation&&task.box.isConnected){try{const source=getSource(task.type,task.id);const key=keyFor(task.type,task.id,getSpec(task.type,task.id),source);if(cache.has(key))put(task,cache.get(key));else{const url=render(source,task.type);if(url){cache.set(key,url);while(cache.size>MAX_CACHE)cache.delete(cache.keys().next().value);}put(task,url);}}catch(error){console.warn('IDEARE item preview row',error);put(task,null);}}if(queue.length)frame=requestAnimationFrame(next);}
  function refresh(){if(panel.hidden||!isBuild())return;generation++;if(frame)cancelAnimationFrame(frame);frame=0;queue=[];const rows=[...list.querySelectorAll('button[data-select],button[data-select-extra],button[data-select-splash]')];
    list.classList.toggle('ideare-items-has-rows',rows.length>0);const count=panel.querySelector('.ideare-items-count');if(count)count.textContent=`${rows.length} ${rows.length===1?'item':'items'}`;
    // Keep original buttons, handlers, selected state and dimensions; only decorate their content.
    for(const b of rows){const type=b.hasAttribute('data-select')?'cabinet':b.hasAttribute('data-select-extra')?'extra':'splash';const id=b.dataset.select||b.dataset.selectExtra||b.dataset.selectSplash;let box=b.querySelector('.ideare-item-thumb');if(!box){box=document.createElement('span');box.className='ideare-item-thumb';box.setAttribute('aria-hidden','true');box.innerHTML=fallback(type);const copy=document.createElement('span');copy.className='ideare-item-copy';while(b.firstChild)copy.append(b.firstChild);b.append(box,copy);}b.classList.add('ideare-item-row');b.setAttribute('aria-pressed',String(b.classList.contains('selected')));queue.push({type,id,box,generation});}
    // Original empty-state text refers only to cabinets, not appliances or backsplash.
    for(const empty of list.querySelectorAll(':scope > .id3-muted'))empty.hidden=rows.length>0;
    if(queue.length)frame=requestAnimationFrame(next);
  }
  let scheduled=0;function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(()=>{scheduled=0;refresh();});}
  new MutationObserver(schedule).observe(list,{childList:true});new MutationObserver(()=>{if(panel.hidden){generation++;queue=[];if(frame)cancelAnimationFrame(frame);frame=0;}else {schedule();for(const delay of [500,1600])setTimeout(()=>{if(!panel.hidden)schedule();},delay);}}).observe(panel,{attributes:true,attributeFilter:['hidden']});
  // Render once more after asynchronously loaded finish textures have arrived.
  panel.addEventListener('scroll',()=>{if(!frame&&queue.length)frame=requestAnimationFrame(next);},{passive:true});
  return {refresh:schedule};
}
