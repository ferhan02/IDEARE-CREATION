/* IDEARE Studio v4 — direct object manipulation, true wall mounts, collision rules,
   cabinet-specific hardware and product model images. Runs after the v3 extension
   in the same ES module scope. All scene coordinates are millimetres. */
(() => {
'use strict';
const app=document.querySelector('#id3-app'), canvas=document.querySelector('#designer-canvas');
if(!app||!canvas)return;
const st=document.createElement('link');st.rel='stylesheet';st.href='../assets/css/designer-enhancements-v4.css?v=20261123-v4';document.head.append(st);
const api=window.IDEAREDesignerCatalogV3;
const profiles=api?.products||[], profilesById=new Map(profiles.map(p=>[p.id,p]));
const $v=s=>document.querySelector(s);
const clampV=(v,min,max)=>Math.max(min,Math.min(max,v));
const copyV=v=>JSON.parse(JSON.stringify(v));
const mountedShapes=new Set(['wall-shelf','rack','organiser','rail','lighting','safety','hood','wall-table']);
const itemProfile=c=>c?.catalogId?profilesById.get(c.catalogId)||api?.findProfile(c):api?.findProfile(c);
const mountedExtra=c=>!!c?.id && mountedShapes.has(itemProfile(c)?.shape);
const mountedCab=c=>!!c?.uid && c.category==='wall-cabinets';
const wallMounted=c=>mountedCab(c)||mountedExtra(c);
const isCab=c=>!!c?.uid;
const measure=c=>{const swapped=Math.round((Number(c.rotation)||0)/90)%2!==0;
 const w=swapped?Number(c.depth):Number(c.width),d=swapped?Number(c.width):Number(c.depth);
 return {w,d,l:c.x-w/2,r:c.x+w/2,t:c.z-d/2,b:c.z+d/2};};
function visibleHeight(c){
 if(isCab(c)){const base=mountedCab(c)?1350:0;return [base,base+Number(c.height)];}
 const p=itemProfile(c),s=p?.shape||'',h=Number(c.height)||500,roomH=model.room.height;
 const cy=clampV(roomH*.57,1100,2000);
 if(s==='hood'){const m=clampV(roomH-140,1400,1950);return [m-140,roomH];}
 if(s==='wall-table')return [Math.max(0,h-380),h+50];
 if(s==='wall-shelf')return [cy-h/2-25,cy+h/2+25];
 if(s==='lighting'||s==='rail')return [cy-130,cy+100];
 if(mountedExtra(c))return [cy-160,Math.min(roomH,cy+h*.8+80)];
 return [0,h];
}
function actualWalls(){const vertices=roomVertices(),arr=[];for(let i=0;i<vertices.length;i++){
 if((model.room.shape==='open'||model.room.shape==='u_open')&&i===2)continue;
 if(model.room.shape==='l_open'&&i===3)continue;
 const a=vertices[i],b=vertices[(i+1)%vertices.length];
 if(Math.abs(a.x-b.x)<.01)arr.push({axis:'x',v:a.x,min:Math.min(a.z,b.z),max:Math.max(a.z,b.z)});
 else if(Math.abs(a.z-b.z)<.01)arr.push({axis:'z',v:a.z,min:Math.min(a.x,b.x),max:Math.max(a.x,b.x)});
 }return arr;}
function noCollision(c,ignoreId=c.uid||c.id){
 if(![c.x,c.z,c.width,c.depth,c.height].every(Number.isFinite))return false;
 if(c.width<10||c.depth<10||c.height<10)return false;
 if(visibleHeight(c)[1]>model.room.height+1)return false;
 if(!cabinetFitsPolygon(c))return false;
 const a=measure(c),ay=visibleHeight(c),others=[...model.cabinets,...model.extras];
 return !others.some(o=>{
  if((o.uid||o.id)===ignoreId)return false;
  const b=measure(o),by=visibleHeight(o);
  return Math.min(ay[1],by[1])-Math.max(ay[0],by[0])>1&&v6Overlap(c,o,.01);
 });
}
// A cabinet is wall-mounted only if the entire back is flush with a real,
// solid wall segment (not an opening or an imaginary room boundary).
window.IDEAREPlacementV4={valid:c=>noCollision(c)&&(!wallMounted(c)||hasWallSupport(c)),collisionFree:c=>noCollision(c)};
function backFace(c){const r=measure(c),rot=((Math.round((Number(c.rotation)||0)/90)%4)+4)%4;return rot===0?{axis:'z',v:r.t}:rot===1?{axis:'x',v:r.r}:rot===2?{axis:'z',v:r.b}:{axis:'x',v:r.l};}
function hasWallSupport(c){if(!wallMounted(c))return true;
 const r=measure(c),back=backFace(c),eps=3;
 return actualWalls().some(w=>w.axis===back.axis&&Math.abs(back.v-w.v)<eps&&(w.axis==='z'?r.l>=w.min-eps&&r.r<=w.max+eps:r.t>=w.min-eps&&r.b<=w.max+eps));}
function attachToWall(c,x,z,maxDistance=Infinity,drag=false){
 const placements=[],previous=backFace(c);
 for(const w of actualWalls()){
  for(const rot of (w.axis==='z'?[0,180]:[90,270])){
   const q={...c,rotation:rot},b=measure(q),half=w.axis==='z'?b.w/2:b.d/2,along=w.axis==='z'?'x':'z',normal=w.axis==='z'?'z':'x';
   if(w.max-w.min<half*2-.01)continue;
   const lo=w.min+half,hi=w.max-half,raw=along==='x'?x:z;
   q[normal]=w.v+(rot===0||rot===270?1:-1)*(w.axis==='z'?b.d:b.w)/2;
   q[along]=clampV(raw,lo,hi);
   const same=rot===((Number(c.rotation)||0)%360+360)%360&&previous.axis===w.axis&&Math.abs(previous.v-w.v)<3;
   const normalDist=Math.abs(q[normal]-(normal==='x'?x:z));
   // Keep dragging on the current wall even when the pointer drifts away.
   // Another wall can take over only when the pointer approaches its face.
   if(drag&&!same&&normalDist>420)continue;
   if(!drag&&Math.hypot(q.x-x,q.z-z)>maxDistance)continue;
   const targets=[{v:q[along],bonus:0}];
   const offer=(v,bonus)=>{if(v>=lo-.01&&v<=hi+.01&&Math.abs(v-raw)<=170)targets.push({v:clampV(v,lo,hi),bonus});};
   for(const o of model.cabinets){if(o.uid===c.uid)continue;
    const ob=backFace(o),r=measure(o),edge1=along==='x'?r.l:r.t,edge2=along==='x'?r.r:r.b;
    if(ob.axis!==w.axis||Math.abs(ob.v-w.v)>180)continue;
    const isUpper=mountedCab(o),isBase=o.category==='base-cabinets'||o.category==='special-cabinets';
    if(!isUpper&&!isBase)continue;
    if(isUpper){offer(edge1-half,115);offer(edge2+half,115);}
    else if(mountedCab(c)){
     // Align centre or either edge above the lower run; the upper unit's
     // back stays flush with the wall rather than matching the base depth.
     offer((edge1+edge2)/2,145);offer(edge1+half,155);offer(edge2-half,155);
     offer(edge1-half,65);offer(edge2+half,65);
    }
   }
   for(const candidate of targets){const v={...q,[along]:candidate.v};if(!noCollision(v)||!hasWallSupport(v))continue;
    const dist=Math.abs(candidate.v-raw)+(drag&&same?Math.min(normalDist,120):normalDist)+(same?-110:0)-candidate.bonus;
    placements.push({q:v,dist});
   }
  }
 }
 placements.sort((a,b)=>a.dist-b.dist);return placements[0]?.q||null;
}
function snapNearby(c,x,z){
 const step=25,base={...c,x:clampV(x,0,model.room.width),z:clampV(z,0,model.room.depth)};
 if(wallMounted(c))return attachToWall(c,base.x,base.z,Infinity,true);
 const candidates=[base,{...base,x:Math.round(base.x/step)*step,z:Math.round(base.z/step)*step}];
 const m=measure(base);
 for(const other of [...model.cabinets,...model.extras]){
  if((other.uid||other.id)===(c.uid||c.id))continue;
  const r=measure(other),ox=Math.max(0,Math.min(m.b,r.b)-Math.max(m.t,r.t)),oz=Math.max(0,Math.min(m.r,r.r)-Math.max(m.l,r.l));
  for(const goal of [r.l-m.w/2,r.r+m.w/2,r.l+m.w/2,r.r-m.w/2])if(Math.abs(base.x-goal)<62&&ox+m.d>0)candidates.push({...base,x:goal});
  for(const goal of [r.t-m.d/2,r.b+m.d/2,r.t+m.d/2,r.b-m.d/2])if(Math.abs(base.z-goal)<62&&oz+m.w>0)candidates.push({...base,z:goal});
 }
 const valid=candidates.filter(q=>noCollision(q));
 if(valid.length)return valid.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
 return null;
}
function findOpenSpot(c,near={x:c.x,z:c.z}){
 if(wallMounted(c)){
  const q=attachToWall(c,near.x,near.z);if(q)return q;
  // Sample each real wall so a crowded primary wall can fall back to a free one.
  for(const w of actualWalls())for(let k=0;k<=20;k++){
   const at=w.min+(w.max-w.min)*k/20;
   const q=attachToWall(c,w.axis==='z'?at:w.v,w.axis==='x'?at:w.v,Math.max(model.room.width,model.room.depth)*2);
   if(q)return q;
  }return null;
 }
 if(noCollision(c))return c;
 const list=[];
 for(let z=25;z<=model.room.depth;z+=100)for(let x=25;x<=model.room.width;x+=100)list.push({x,z,score:Math.hypot(x-near.x,z-near.z)});
 list.sort((a,b)=>a.score-b.score);
 for(const p of list){const q={...c,x:p.x,z:p.z};if(noCollision(q))return q;}
 return null;
}
// Wrap additions rather than modifying the original database-backed template library.
const addCabinetBeforeV4=commitNew;
commitNew=c=>{
 if(mountedCab(c)){
  const replacement=window.__ideareReplaceSelected;
  if(!replacement){const last=model.cabinets.at(-1);const base=last&&!mountedCab(last)&&last.category!=='tall-cabinets'&&actualWalls().some(w=>{const b=backFace(last);return w.axis===b.axis&&Math.abs(w.v-b.v)<180;})?last:null;const fitted=(base&&attachToWall({...c,rotation:base.rotation},base.x,base.z,500))||findOpenSpot(c);if(!fitted){notify('No free solid wall can support this cabinet. Move nearby items or change the room.',true);return;}c=fitted;}
 }
 return addCabinetBeforeV4(c);
};
const addExtraBeforeV4=addExtra;
addExtra=id=>{
 const p=profilesById.get(id)||api?.findProfile(id);if(!p)return addExtraBeforeV4(id);
 if(model.extras.length>=100){notify('The designer supports up to 100 furniture and appliance objects.',true);return;}
 const c={id:uuid(),kind:p.name,catalogId:p.id,width:p.width,height:p.height,depth:p.depth,
  x:Math.round(model.room.width*.54),z:Math.round(model.room.depth*.5),rotation:0};
 const fitted=findOpenSpot(c);
 if(!fitted){notify(`There is no suitable ${mountedExtra(c)?'solid wall':'free space'} for ${p.name}. Move another item first.`,true);return;}
 history();model.extras.push(fitted);model.selected=null;model.selectedExtra=fitted.id;
 closeMenu();renderAll();changed(false);notify(`${p.name} added · ${Math.round(p.width)} × ${Math.round(p.height)} × ${Math.round(p.depth)} mm`);
};
// Loaded or legacy rooms may have wall units in mid-air. Relocate them to a
// valid physical wall without losing their dimensions or materials.
function repairLegacyMounts(){let fixed=0,notFixed=0;
 for(const c of [...model.cabinets,...model.extras]){
  if(!wallMounted(c)||hasWallSupport(c)&&noCollision(c))continue;
  const fit=findOpenSpot(c);
  if(fit){Object.assign(c,{x:fit.x,z:fit.z,rotation:fit.rotation});fixed++;}else notFixed++;
 }
 if(fixed)renderAll();
 if(notFixed)notify(`${notFixed} item(s) could not be attached to a free wall. Review their placement.`,true);
 return fixed;
}
const applyHistoryBeforeV4=applyHistory;
applyHistory=s=>{applyHistoryBeforeV4(s);repairLegacyMounts();};

// Fluid direct drag on every mesh of an appliance, dining or extra item, and
// on wall cabinets. The hit point determines the motion plane so the object
// doesn't jump to the pointer. Perform inexpensive bounds checks per frame;
// commit one Undo snapshot per drag and rebuild scene once on release.
const selectedMove=$v('#object-move');
let action=null,dragRaf=0;
const mouseNdc=e=>{const r=canvas.getBoundingClientRect();return new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);};
const rayFloor=(e,y)=>{if(!camera||!raycaster)return null;raycaster.setFromCamera(mouseNdc(e),camera);return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),new THREE.Vector3());};
function locateHit(e){if(!camera||!raycaster||!extraGroup)return null;
 raycaster.setFromCamera(mouseNdc(e),camera);
 const hits=raycaster.intersectObjects([...extraGroup.children,...cabinetGroup.children],true);
 for(const h of hits){if(h.object.isLineSegments||h.object.isSprite)continue;
  let o=h.object;while(o){if(o.userData?.extraId){const c=model.extras.find(x=>x.id===o.userData.extraId);if(c)return {c,point:h.point};}
   if(o.userData?.uid){const c=model.cabinets.find(x=>x.uid===o.userData.uid);if(mountedCab(c))return {c,point:h.point};if(c)return null;break;}
   o=o.parent;
  }
 }return null;
}
function begin(e,c,hitY=null){if(e.button!==0||model.step!==3||!camera||!controls)return false;
 e.preventDefault();e.stopImmediatePropagation();
 const mounted=wallMounted(c),y=clampV(hitY??(visibleHeight(c)[0]+visibleHeight(c)[1])/2000,.05,model.room.height/1000-.05);
 const origin=rayFloor(e,y)||new THREE.Vector3(c.x/1000,y,c.z/1000);
 const isExtra=!isCab(c);
 if(isExtra)selectExtra(c.id);else select(c.uid);
 controls.enabled=false;action={id:c.id||c.uid,isExtra,pointer:e.pointerId,y,start:origin,origin:{x:c.x,z:c.z},last:{x:c.x,z:c.z},screen:{x:e.clientX,y:e.clientY},recorded:false};
 try{canvas.setPointerCapture(e.pointerId);}catch(_){}
 canvas.classList.add('ideare-dragging-surface');selectedMove?.classList.add('ideare-direct-moving');
 $v('#studio-hover')?.setAttribute('hidden','');
 return true;
}
window.addEventListener('pointerdown',e=>{
 if(model.step!==3||action)return;
 if(e.target===canvas){const hit=locateHit(e);if(hit)begin(e,hit.c,hit.point.y);}
 else if(e.target.closest?.('#object-move')){const c=model.extras.find(x=>x.id===model.selectedExtra)||model.cabinets.find(x=>x.uid===model.selected);
  if(c&&(mountedCab(c)||!isCab(c)))begin(e,c);
 }
},true);
const oneFrame=e=>{
 const a=action;if(!a)return;
 if(!a.recorded&&Math.hypot(e.clientX-a.screen.x,e.clientY-a.screen.y)<3)return;
 const c=a.isExtra?model.extras.find(o=>o.id===a.id):model.cabinets.find(o=>o.uid===a.id);
 if(!c)return;
 const q=rayFloor(e,a.y);let x,z;
 if(q&&Math.hypot(q.x-a.start.x,q.z-a.start.z)<Math.max(model.room.width,model.room.depth)/1000*2){x=a.origin.x+(q.x-a.start.x)*1000;z=a.origin.z+(q.z-a.start.z)*1000;}
 else if(wallMounted(c)){
  // At shallow viewing angles the horizontal ray plane becomes unstable.
  // Project the wall tangent onto the screen instead of jumping or freezing.
  const b=backFace(c),r=canvas.getBoundingClientRect(),along=b.axis==='z'?'x':'z',p0=new THREE.Vector3(a.origin.x/1000,a.y,a.origin.z/1000),p1=p0.clone();p1[along]+=.5;
  p0.project(camera);p1.project(camera);const sx=(p1.x-p0.x)*r.width/2,sy=-(p1.y-p0.y)*r.height/2,den=sx*sx+sy*sy;if(den<4)return;
  const mmDelta=((e.clientX-a.screen.x)*sx+(e.clientY-a.screen.y)*sy)/den*500;
  x=a.origin.x+(along==='x'?mmDelta:0);z=a.origin.z+(along==='z'?mmDelta:0);
 }else return;
 let valid=snapNearby(c,x,z);
 // If the desired point is occupied, slide along the unobstructed axis.
 if(!valid&&!wallMounted(c))valid=snapNearby(c,x,c.z)||snapNearby(c,c.x,z);
 if(!valid){canvas.classList.add('ideare-placement-blocked');return;}
 canvas.classList.remove('ideare-placement-blocked');
 if(valid.x===c.x&&valid.z===c.z&&valid.rotation===c.rotation)return;
 if(!a.recorded){history();a.recorded=true;worldGroup?.traverse(o=>{if(/^continuous_/.test(o.name))o.visible=false;});}
 Object.assign(c,{x:valid.x,z:valid.z,rotation:valid.rotation});
 const g=a.isExtra?extraGroup.children.find(o=>o.userData.extraId===c.id):meshById.get(c.uid);
 if(g){g.position.x=c.x/1000;g.position.z=c.z/1000;g.rotation.y=-(Number(c.rotation)||0)*Math.PI/180;}
 a.last={x:c.x,z:c.z};
 const badge=$v('#selection-badge');if(badge)badge.textContent=`Position ${Math.round(c.x)} × ${Math.round(c.z)} mm`;
};
window.addEventListener('pointermove',e=>{
 if(!action||e.pointerId!==action.pointer)return;
 e.stopImmediatePropagation();e.preventDefault();
 // Store only the latest pointer position to coalesce expensive ray casts.
 const latest={clientX:e.clientX,clientY:e.clientY};
 if(dragRaf)cancelAnimationFrame(dragRaf);
 dragRaf=requestAnimationFrame(()=>{dragRaf=0;oneFrame(latest);});
},true);
function endDrag(e,cancel=false){const a=action;if(!a||e&&e.pointerId!==a.pointer)return;
 if(dragRaf){cancelAnimationFrame(dragRaf);dragRaf=0;}
 if(e&&!cancel)oneFrame(e);
 action=null;controls&&(controls.enabled=true);
 canvas.classList.remove('ideare-dragging-surface','ideare-placement-blocked');selectedMove?.classList.remove('ideare-direct-moving');
 try{canvas.releasePointerCapture(a.pointer);}catch(_){}
 if(cancel&&a.recorded){const undoState=undo.pop();if(undoState)applyHistory(undoState);refreshUndo();changed(false);}
 else if(a.recorded){const c=a.isExtra?model.extras.find(o=>o.id===a.id):model.cabinets.find(o=>o.uid===a.id);
  if(c?.uid)model.shared=model.shared.filter(s=>!s.cabinetUids?.includes(c.uid));
  renderAll();changed(false);
 }else renderAll();
}
window.addEventListener('pointerup',e=>{if(!action||e.pointerId!==action.pointer)return;e.stopImmediatePropagation();endDrag(e);},true);
window.addEventListener('pointercancel',e=>{if(!action||e.pointerId!==action.pointer)return;e.stopImmediatePropagation();endDrag(e,true);},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&action){e.preventDefault();endDrag(null,true);}},true);
// Changing X/Z values or rotating wall cabinetry must not detach it from the wall.
window.addEventListener('change',e=>{
 const prop=e.target.dataset?.property;
 const c=model.cabinets.find(o=>o.uid===model.selected);
 if(!mountedCab(c)||!['x','z'].includes(prop))return;
 e.stopImmediatePropagation();e.preventDefault();
 const num=Number(e.target.value);if(!Number.isFinite(num)||e.target.value.trim()===''){e.target.value=c[prop];return;}
 const q=attachToWall(c,prop==='x'?num:c.x,prop==='z'?num:c.z,Infinity);
 if(!q){e.target.value=c[prop];notify('A wall cabinet must remain attached to a solid wall with no collisions.',true);return;}
 history();Object.assign(c,{x:q.x,z:q.z,rotation:q.rotation});renderAll();changed(false);
},true);
window.addEventListener('click',e=>{
 const b=e.target.closest?.('#rotate,#object-rotate');if(!b)return;
 const c=model.cabinets.find(o=>o.uid===model.selected);if(!mountedCab(c))return;
 e.preventDefault();e.stopImmediatePropagation();
 // Keep the back flush with its wall even when the requested quarter-turn
 // requires a different wall or orientation.
 const desired={...c,rotation:(Number(c.rotation||0)+90)%360};
 const q=attachToWall(desired,c.x,c.z,Infinity);
 if(!q){notify('There is no free wall position for the rotated cabinet.',true);return;}
 history();Object.assign(c,{x:q.x,z:q.z,rotation:q.rotation});renderAll();changed(false);
},true);
window.addEventListener('keydown',e=>{
 if(!e.target.closest?.('#object-move'))return;
 const c=model.cabinets.find(o=>o.uid===model.selected),v={ArrowLeft:[-25,0],ArrowRight:[25,0],ArrowUp:[0,-25],ArrowDown:[0,25]}[e.key];
 if(!v||!mountedCab(c))return;
 e.preventDefault();e.stopImmediatePropagation();
 const q=attachToWall(c,c.x+v[0],c.z+v[1],450);
 if(q&&(q.x!==c.x||q.z!==c.z)){history();Object.assign(c,{x:q.x,z:q.z,rotation:q.rotation});renderAll();changed(false);}
},true);
// Validate exact inputs and rotation too: not just pointer manipulation.
window.addEventListener('change',e=>{
 const input=e.target.closest?.('#extra-inspector [data-extra]');if(!input)return;
 const c=model.extras.find(o=>o.id===model.selectedExtra);if(!c)return;
 e.stopImmediatePropagation();e.preventDefault();const key=input.dataset.extra,number=Number(input.value);
 if(!Number.isFinite(number)||input.value.trim()===''){input.value=c[key];return;}
 const q={...c,[key]:Math.round(number)},v=wallMounted(q)?attachToWall(q,q.x,q.z,Number.POSITIVE_INFINITY):q;
 if(!v||!noCollision(v)||wallMounted(v)&&!hasWallSupport(v)){
  input.value=c[key];notify('This measurement would overlap another item, leave the room or detach from its wall.',true);return;
 }
 history();Object.assign(c,v);renderAll();changed(false);
},true);
window.addEventListener('click',async e=>{
 const removal=e.target.closest?.('#extra-remove'),duplicate=e.target.closest?.('#extra-duplicate');
 if(!removal&&!duplicate)return;
 const c=model.extras.find(o=>o.id===model.selectedExtra);if(!c)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(duplicate){const duplicated={...copyV(c),id:uuid(),x:c.x+Math.max(200,c.width/2)};
  const position=findOpenSpot(duplicated,{x:duplicated.x,z:duplicated.z});
  if(!position){notify('There is no clear location for the duplicate. Move nearby objects first.',true);return;}
  history();model.extras.push(position);selectExtra(position.id);renderAll();changed(false);return;
 }
 if(!window.Swal?.fire){notify('A confirmation is required. SweetAlert2 could not be loaded.',true);return;}
 const result=window.IdeaREAlert?.confirm?await window.IdeaREAlert.confirm({title:'Remove this item?',text:`Remove ${c.kind} from the design?`,confirmText:'Remove item',danger:true}):await window.Swal.fire({title:'Remove item?',text:`Remove ${c.kind}?`,icon:'warning',showCancelButton:true,confirmButtonText:'Remove item',customClass:{popup:'ideare-swal-popup',confirmButton:'ideare-swal-confirm',cancelButton:'ideare-swal-cancel'},buttonsStyling:false});
 if(!result.isConfirmed)return;
 history();model.extras=model.extras.filter(o=>o.id!==c.id);selectExtra(null);renderAll();changed(false);
},true);
window.addEventListener('click',e=>{
 const rot=e.target.closest?.('#ideare-extra-rotate');if(!rot)return;
 const c=model.extras.find(o=>o.id===model.selectedExtra);if(!c)return;
 e.preventDefault();e.stopImmediatePropagation();
 const candidate={...c,rotation:(Number(c.rotation||0)+90)%360};
 const q=wallMounted(candidate)?attachToWall(candidate,c.x,c.z,Infinity):candidate;
 if(!q||!noCollision(q)||wallMounted(q)&&!hasWallSupport(q)){notify('Rotation would collide with another item or detach from the wall.',true);return;}
 history();Object.assign(c,q);renderAll();changed(false);
},true);

// Cabinet hardware — different physical forms, mounted on the front free edge
// rather than the hinge. No generic center handles duplicated under the new set.
// Specialty templates keep their own starting footprint, rather than inheriting
// the depth of a previously added rectangular cabinet in the same category.
const oldStandardCabV6=standardCab;
standardCab=t=>{const c=oldStandardCabV6(t);if(v6Special(c)||['island','peninsula'].includes(v6Kind(c))){c.depth=Number(t.default_depth)||c.depth;c.width=Number(t.default_width)||c.width;}return c;};
const oldInspectorV6=renderInspector;
renderInspector=()=>{oldInspectorV6();const c=selected(),field=$v('[data-property="front"]');if(!field)return;const drawer=field.querySelector('option[value="drawers"]');if(drawer)drawer.disabled=!!c&&v6Special(c);};
const oldMakeCabinetV4=makeCabinet;
makeCabinet=(c,skipHood=false)=>{
 if(v6Special(c))return v6CornerModel(c);
 if(!skipHood&&/hood|extractor/i.test(c.name)&&c.category==='wall-cabinets')return v6Hood(c,small=>makeCabinet(small,true));
 const g=oldMakeCabinetV4(c),w=c.width/1000,d=c.depth/1000,h=c.height/1000;
 const name=String(catalog.handles.find(x=>Number(x.id)===Number(c.handle))?.name||'Bar pull');
 const lower=name.toLowerCase(),handleless=/handleless|push.?open|no handle|finger pull/.test(lower),edge=/billsbro|edge|recess|flush|integrated|lip/.test(lower),isKnob=/eneryda|knob|button/.test(lower),long=/lansa|long|full height|tall/.test(lower),gold=/gold|brass|brushed bronze|champagne/.test(lower),blackFinish=/black|hackås|hackas|matte black/.test(lower);
 const colour=gold?0xb68a57:blackFinish?0x242424:0xb2b6b5;
 const metal=new THREE.MeshStandardMaterial({color:colour,metalness:.76,roughness:.27});
 g.traverse(o=>{if(/^(handle|handle_premium|handle_recessed|drawer_handle|drawer_handle_premium)$/.test(o.name))o.visible=false;});
 const bar=(par,x,y,z,length,vertical=false,r=.007)=>{
  const first=new THREE.Vector3(x+(vertical?0:-length/2),y+(vertical?-length/2:0),z),last=new THREE.Vector3(x+(vertical?0:length/2),y+(vertical?length/2:0),z);
  const delta=last.clone().sub(first);
  const obj=new THREE.Mesh(new THREE.CylinderGeometry(r,r,Math.max(.025,length),12),metal);
  obj.position.copy(first.add(last).multiplyScalar(.5));obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());obj.name='ideare_hardware';par.add(obj);
  for(const k of [-1,1]){const screw=new THREE.Mesh(new THREE.CylinderGeometry(r*.77,r*.77,.028,10),metal);
   screw.rotation.x=Math.PI/2;screw.position.set(x+(vertical?0:k*length*.39),y+(vertical?k*length*.39:0),z-.020);par.add(screw);}
 };
 const makeKnob=(par,x,y,z)=>{const body=new THREE.Mesh(new THREE.CylinderGeometry(.017,.014,.024,20),metal);body.rotation.x=Math.PI/2;body.position.set(x,y,z);par.add(body);
  const face=new THREE.Mesh(new THREE.SphereGeometry(.018,16,10),metal);face.scale.set(1,1,.38);face.position.set(x,y,z+.014);par.add(face);};
 if(!handleless){
  if(c.front==='doors'){
   const pivots=g.children.filter(o=>o.isGroup&&o.children.some(k=>k.name==='door_panel'));
   const doors=pivots.length,plinth=c.plinth?clampV(Number(c.plinthHeight||100)/1000,.05,.2):0;
   pivots.forEach((pivot,i)=>{
    const leaf=pivot.children.find(k=>k.name==='door_panel'),dw=leaf?.geometry?.parameters?.width||w/Math.max(1,doors);
    const hingeLeft=doors===1?c.hingeSide!=='right':i%2===0;
    const x=(hingeLeft?1:-1)*(dw-.055),y=(h-plinth)*.52;
    if(edge){const strip=addBox(pivot,.028,Math.min(.16,h*.22),.007,x,y,.022,metal,'ideare_edge_pull');strip.castShadow=false;}
    else if(isKnob)makeKnob(pivot,x,y,.038);
    else bar(pivot,x,y,.05,long?Math.min(.48,h*.66):Math.min(.23,h*.32),true,blackFinish?.008:.006);
   });
  }
  if(c.front==='drawers'){
   const rails=g.children.filter(o=>o.name==='ideare_drawer_rail');
   for(const rail of rails){const front=rail.children.find(o=>o.name==='drawer_front');if(!front)continue;
    const fh=front.geometry?.parameters?.height||.16;
    if(edge){addBox(rail,Math.min(w*.75,.32),.013,.028,0,fh/2-.009,d/2+.03,metal,'ideare_drawer_edge');}
    else if(isKnob)makeKnob(rail,0,0,d/2+.055);
    else bar(rail,0,Math.min(.04,fh*.17),d/2+.067,Math.min(long?.36:.24,w*.65),false,.006);
   }
  }
 }
 const kind=v6Kind(c);
 if(kind==='island'||kind==='peninsula'){
  // Finished backs are visible in freestanding cabinetry.
  addBox(g,w-.006,Math.max(.10,h-(c.plinth?Number(c.plinthHeight||100)/1000:0)),.018,0,(h+(c.plinth?Number(c.plinthHeight||100)/1000:0))/2,-d/2+.009,finishMat(c),'finished_exposed_back');
 }
 const label=c.name.toLowerCase();
 const hobCab=/\bhob\b|\bcooker\b/.test(label)&&c.category!=='wall-cabinets';
 if(hobCab){
  const hobTop=h+.038;const dark=new THREE.MeshStandardMaterial({color:0x1c2428,metalness:.18,roughness:.16}),ringMat=new THREE.MeshStandardMaterial({color:0xb5b7b6,metalness:.77,roughness:.22});
  addBox(g,Math.min(w*.91,.75),.016,Math.min(d*.82,.54),0,hobTop,0,dark,'hob_cooktop');
  for(const x of [-w*.22,w*.22])for(const z of [-d*.17,d*.17]){
   const tor=new THREE.Mesh(new THREE.TorusGeometry(.042,.005,7,24),ringMat);tor.rotation.x=Math.PI/2;tor.position.set(x,hobTop+.013,z);tor.name='hob_burner';g.add(tor);
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.012,20),dark);cap.position.set(x,hobTop+.017,z);g.add(cap);
  }
  // A removable illustration of the requested 14 kg cylinder (Ø333 × H600 mm),
  // only visible with door fronts open; installation/safety require staff review.
  const canFit=c.front!=='drawers'&&w> .375&&d>.39&&h-(c.plinth?Number(c.plinthHeight||100)/1000:0)>.65;
  if(canFit){
   const gas=new THREE.Group();gas.name='ideare_lpg_14kg_concept';
   const red=new THREE.MeshStandardMaterial({color:0xb53331,metalness:.27,roughness:.45});
   const gray=new THREE.MeshStandardMaterial({color:0x6f7778,metalness:.7,roughness:.38});
   const base=(c.plinth?Number(c.plinthHeight||100)/1000:0)+.020;
   const tank=new THREE.Mesh(new THREE.CylinderGeometry(.165,.1665,.49,24),red);tank.position.y=base+.28;gas.add(tank);
   for(const [radius,y] of [[.165,.04],[.15,.53]]){const tor=new THREE.Mesh(new THREE.TorusGeometry(radius,.013,8,24),red);tor.rotation.x=Math.PI/2;tor.position.y=base+y;gas.add(tor);}
   const handleRing=new THREE.Mesh(new THREE.TorusGeometry(.075,.013,8,24),gray);handleRing.rotation.x=Math.PI/2;handleRing.position.y=base+.56;gas.add(handleRing);
   const neck=new THREE.Mesh(new THREE.CylinderGeometry(.035,.038,.065,16),gray);neck.position.y=base+.566;gas.add(neck);
   gas.position.z=-.045;gas.visible=c.front==='open'||(model.selected===c.uid&&model.doorsOpen);g.add(gas);
  }
 }
 return g;
};

// Catalogue images: render the *actual same* 3D geometry used in the designer to
// PNG thumbnails. One small WebGL context, cached; no misleading stock images.
const thumbCache=new Map();let thumbRenderer=null,thumbScene=null,thumbCamera=null,thumbFailed=false;
const ensureThumbnailRenderer=()=>{
 if(thumbRenderer||thumbFailed)return !!thumbRenderer;
 try{thumbRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});thumbRenderer.setPixelRatio(1);thumbRenderer.setSize(136,100,false);thumbRenderer.outputColorSpace=THREE.SRGBColorSpace;
  thumbScene=new THREE.Scene();thumbScene.add(new THREE.AmbientLight(0xffffff,2.0));
  const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(3,8,5);thumbScene.add(light);
  thumbCamera=new THREE.PerspectiveCamera(37,136/100,.01,90);return true;
 }catch(err){thumbFailed=true;console.warn('IDEARE model thumbnail renderer',err);return false;}
};
function renderThumbnail(p){if(thumbCache.has(p.id))return thumbCache.get(p.id);
 if(!ensureThumbnailRenderer()||!api?.realizeItem)return null;
 const item={id:'thumbnail_'+p.id,catalogId:p.id,kind:p.name,width:p.width,height:p.height,depth:p.depth,x:0,z:0,rotation:0};
 const g=api.realizeItem(item);g.position.set(0,0,0);g.rotation.set(0,0,0);
 // Avoid rendering selected outline and prevent shared cached materials disposal.
 g.traverse(o=>{if(o.name==='ideare_extra_outline')o.visible=false;});thumbScene.add(g);
 try{const bb=new THREE.Box3().setFromObject(g),sz=new THREE.Vector3(),center=new THREE.Vector3();bb.getSize(sz);bb.getCenter(center);
  const max=Math.max(sz.x,sz.y,sz.z,.2),dist=max*2.4;
  thumbCamera.position.set(center.x+dist*.65,center.y+dist*.55,center.z+dist*.85);thumbCamera.lookAt(center);thumbCamera.updateProjectionMatrix();
  thumbRenderer.render(thumbScene,thumbCamera);const data=thumbRenderer.domElement.toDataURL('image/png');thumbCache.set(p.id,data);return data;
 }catch(err){console.warn('IDEARE thumbnail',p.id,err);return null;}
 finally{thumbScene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
}
let thumbGeneration=0;
const oldOpenMenuV4=openMenu;
openMenu=(menu,hover=false)=>{
 oldOpenMenuV4(menu,hover);
 if(![2,3,4].includes(menu))return;
 const panel=$v('#catalog-menu');if(!panel||panel.hidden)return;
 const items=[...panel.querySelectorAll('[data-ideare-product]')];
 items.forEach(b=>{const p=profilesById.get(b.dataset.ideareProduct);if(!p||b.querySelector('.ideare-product-image'))return;
  const art=document.createElement('img');art.className='ideare-product-image';art.alt=`3D model of ${p.name}`;art.loading='lazy';art.decoding='async';
  art.src=thumbCache.get(p.id)||'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="136" height="100" viewBox="0 0 136 100"><rect width="136" height="100" rx="10" fill="#ebe7e0"/><path d="M37 74V35l31-13 32 13v39L68 87Z" fill="#c5b19c" stroke="#9b8b7b" stroke-width="2"/><path d="M68 87V48l32-13v39Z" fill="#958376"/></svg>`);
  b.prepend(art);
 });
 const seq=++thumbGeneration;
 const todo=items.filter(b=>!thumbCache.has(b.dataset.ideareProduct));let idx=0;
 const step=()=>{if(seq!==thumbGeneration)return;
  for(let k=0;k<2&&idx<todo.length;k++,idx++){
   const b=todo[idx],p=profilesById.get(b.dataset.ideareProduct),img=b.querySelector('img');
   if(p&&img){const url=renderThumbnail(p);if(url)img.src=url;}
  }
  if(idx<todo.length&&$v('#catalog-menu')?.hidden===false)requestAnimationFrame(step);
 };
 requestAnimationFrame(step);
};
const closeMenuV4=closeMenu;closeMenu=()=>{thumbGeneration++;closeMenuV4();};
window.addEventListener('pagehide',()=>{thumbRenderer?.dispose();thumbRenderer?.forceContextLoss?.();thumbRenderer=null;});

// Load IDEARE's existing SweetAlert2 wrapper before base boot/restore.
// No native browser alert/confirm/prompt is used by v4.
const loadScriptV4=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');const timer=setTimeout(()=>{s.remove();reject(new Error('Timed out loading '+src));},5000);s.src=src;s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);reject(new Error('Unable to load '+src));};document.head.append(s);});
async function ensureAlerts(){if(!window.Swal?.fire){try{await loadScriptV4('https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js');}catch(err){console.warn('SweetAlert2 unavailable',err);return false;}}
 if(!window.IdeaREAlert){try{await loadScriptV4('../assets/js/ideare-alerts.js');}catch(err){console.warn('IDEARE alert theme unavailable',err);}}
 return !!window.Swal?.fire;
}
// The original copy-link handler uses native prompt on clipboard failure;
// intercept before it and display an IDEARE-themed copy field instead.
window.addEventListener('click',async e=>{
 const b=e.target.closest?.('#copy-design-link');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const url=$v('#save-result a[href]')?.href;if(!url)return;
 try{await navigator.clipboard.writeText(url);notify('Private design link copied.');}
 catch(_){if(window.Swal?.fire)window.Swal.fire({title:'Your private design link',input:'text',inputValue:url,inputAttributes:{readonly:'readonly'},confirmButtonText:'Done',customClass:{popup:'ideare-swal-popup',confirmButton:'ideare-swal-confirm'},buttonsStyling:false});else notify('Clipboard permission was denied. Copy the link from the saved design panel.',true);}
},true);
const oldBootV4=boot;
boot=async()=>{await ensureAlerts().catch(err=>console.warn("IDEARE alert startup",err));await oldBootV4();const fixed=repairLegacyMounts();if(fixed)changed(false);};
})();
