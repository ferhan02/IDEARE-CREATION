/* IDEARE Design Studio: extension to the repository's existing Three.js module.
 * All units in model space are millimetres; render space is metres. */
(() => {
'use strict';
const app=$('#id3-app'), wrap=$('#canvas-wrap'), inspector=$('#inspector');
const hud=$('#studio-hud'), hoverTip=$('#studio-hover'), preview=$('#studio-library-preview');
const STEP=50, EPS=.001, SNAP=115, WALL_PULL=150, RELEASE=260;
let wallsVisible=false, gridVisible=true, hoverUid=null, move=null, dragTemplate=null, ghost=null;
let detailsCollapsed=false,lastSelection=null;
let allFinishes=[], materialReady=false, finishFilter='all', finishQuery='', recentFinishes=[], defaultMaterial=null;
const rememberedStyle=new Map();
let previewRenderer=null, previewScene=null, previewModel=null, previewCamera=null;
const baseRenderInspector=renderInspector, baseAddRoom=addRoom, baseRenderList=renderList;
const baseShowStep=showStep, baseApplyHistory=applyHistory, baseWarnings=warningsFor;
const roomKind=v=>/^(wet kitchen|dry kitchen|kitchen)$/i.test(v||'')?'Kitchen':/^(wardrobe|bedroom)$/i.test(v||'')?'Bedroom':/^living room$/i.test(v||'')?'Living room':'Other';
model.roomType='Kitchen'; $('#room-kind').value='Kitchen';
const rect=c=>{const q=((Math.round(n(c.rotation)/90)%4)+4)%4, w=q%2?c.depth:c.width, d=q%2?c.width:c.depth;return {l:c.x-w/2,r:c.x+w/2,t:c.z-d/2,b:c.z+d/2,w,d};};
const low=c=>c.category==='wall-cabinets'?1350:0;
const top=c=>low(c)+c.height;
const verticallyOverlaps=(a,b)=>Math.min(top(a),top(b))-Math.max(low(a),low(b))>EPS;
const overlaps=(a,b)=>{const x=rect(a),y=rect(b);return verticallyOverlaps(a,b)&&Math.min(x.r,y.r)-Math.max(x.l,y.l)>EPS&&Math.min(x.b,y.b)-Math.max(x.t,y.t)>EPS;};
function onEdge(x,z,a,b){const vx=b.x-a.x,vz=b.z-a.z,wx=x-a.x,wz=z-a.z;return Math.abs(vx*wz-vz*wx)<=EPS*Math.max(1,Math.hypot(vx,vz))&&wx*vx+wz*vz>=-EPS&&wx*vx+wz*vz<=vx*vx+vz*vz+EPS;}
function inside(x,z,poly){return poly.some((a,i)=>onEdge(x,z,a,poly[(i+1)%poly.length]))||pointInsidePolygon(x,z,poly);}
// Clip a segment to an open rectangle; a room boundary crossing its interior
// means a concave notch or angled edge would pass through the cabinet.
function crossesInterior(a,b,r){const l=r.l+EPS,rr=r.r-EPS,t=r.t+EPS,bb=r.b-EPS;if(l>=rr||t>=bb)return false;let u0=0,u1=1;const dx=b.x-a.x,dz=b.z-a.z;for(const [p,q] of [[-dx,a.x-l],[dx,rr-a.x],[-dz,a.z-t],[dz,bb-a.z]]){if(Math.abs(p)<1e-12){if(q<0)return false;continue;}const v=q/p;if(p<0)u0=Math.max(u0,v);else u1=Math.min(u1,v);if(u0>u1)return false;}return u1-u0>1e-8;}
function fits(c,poly=roomVertices()){const r=rect(c);return [[r.l,r.t],[r.r,r.t],[r.r,r.b],[r.l,r.b]].every(([x,z])=>inside(x,z,poly))&&!poly.some((a,i)=>crossesInterior(a,poly[(i+1)%poly.length],r));}
cabinetFitsPolygon=c=>fits(c);
function invalid(c,ignore=c.uid,others=model.cabinets){if(![c.width,c.depth,c.height,c.x,c.z].every(Number.isFinite)||Math.min(c.width,c.depth,c.height)<100)return 'Enter valid cabinet dimensions.';if(top(c)>model.room.height+EPS)return 'Cabinet exceeds the ceiling height.';if(!fits(c))return 'Cabinet must stay inside the room.';if(others.some(o=>o.uid!==ignore&&overlaps(c,o)))return 'Cabinet overlaps another cabinet.';return '';}
function allFit(){return model.cabinets.every(c=>!invalid(c));}
function studioMessage(message){notify(message,true);}
function detachRun(c){model.shared=model.shared.filter(s=>!s.cabinetUids?.includes(c.uid));}
function syncRoomFields(){for(const [id,k] of [['room-width','width'],['room-depth','depth'],['room-height','height']])$('#'+id).value=model.room[k];$('#room-kind').value=model.roomType;$$('[data-shape]').forEach(b=>b.classList.toggle('selected',b.dataset.shape===model.room.shape));}
function setRoom(k,value,el){const old=model.room[k];if(k!=='shape'){if(String(value).trim()===''||!Number.isFinite(Number(value))){syncRoomFields();if(el)el.value=old;studioMessage('Enter a valid measurement in millimetres.');return false;}value=Math.round(clamp(value,...(k==='height'?[1800,8000]:[1200,20000])));}if(value===old){if(el)el.value=old;return true;}
 model.room[k]=value;const ok=allFit();model.room[k]=old;
 if(!ok){syncRoomFields();if(el)el.value=old;studioMessage('That room change would leave a cabinet outside the room or cause an invalid placement. Move or resize cabinets first.');return false;}
 history();model.room[k]=value;syncRoomFields();renderAll();if(camera){model.camera='orbit';$$('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera==='orbit'));fitCamera();}changed(false);return true;}
for(const [id,k] of [['room-width','width'],['room-depth','depth'],['room-height','height']])$('#'+id).addEventListener('change',e=>{e.stopImmediatePropagation();setRoom(k,e.target.value,e.target);},true);
$$('[data-shape]').forEach(b=>b.addEventListener('click',e=>{e.stopImmediatePropagation();setRoom('shape',b.dataset.shape);},true));
$('#room-kind').onchange=e=>{history();model.roomType=roomKind(e.target.value);renderPlan();changed(false);};
applyHistory=s=>{const a=JSON.parse(s);a.roomType=roomKind(a.roomType);baseApplyHistory(JSON.stringify(a));syncRoomFields();};
for(const id of ['undo','redo']){const original=$('#'+id).onclick;$('#'+id).onclick=e=>{original(e);changed(false);};}
// Directly editable labels on a scaled drawing; no openings/services in the UI.
renderPlan=()=>{const p=roomVertices(),w=model.room.width,d=model.room.depth,s=340/Math.max(w,d),ox=108,oy=67,ww=w*s,dd=d*s;
 const points=p.map(v=>`${ox+v.x*s},${oy+v.z*s}`).join(' ');let area=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];area+=a.x*b.z-b.x*a.z;}
 const dim=(key,val,x,y)=>`<foreignObject x="${x}" y="${y}" width="102" height="31"><div xmlns="http://www.w3.org/1999/xhtml" class="studio-dimension"><input aria-label="Room ${key} in millimetres" data-plan-dimension="${key}" type="number" min="1200" max="20000" step="1" value="${val}"/><span>mm</span></div></foreignObject>`;
 const id='studio-plan-clip';const lines=[];for(let x=0;x<=w;x+=500)lines.push(`<path d="M${ox+x*s} ${oy}v${dd}"/>`);for(let z=0;z<=d;z+=500)lines.push(`<path d="M${ox} ${oy+z*s}h${ww}"/>`);
 $('#plan-svg').innerHTML=`<svg viewBox="0 0 510 445" aria-label="Editable room plan"><defs><clipPath id="${id}"><polygon points="${points}"/></clipPath></defs><rect class="studio-plan-bg" width="510" height="445" rx="0"/><polygon class="studio-plan-fill" points="${points}" stroke-width="2"/><g class="studio-plan-grid" clip-path="url(#${id})">${lines.join('')}</g><g class="studio-plan-rulers" fill="none"><path d="M${ox} 53H${ox+ww}M${ox} 48v10M${ox+ww} 48v10M101 ${oy}V${oy+dd}M96 ${oy}h10M96 ${oy+dd}h10"/></g>${dim('width',w,ox+ww/2-51,15)}${dim('depth',d,0,oy+dd/2-15)}<text class="studio-plan-title" text-anchor="middle" x="${ox+ww/2}" y="${oy+dd/2}">${safe(model.roomType)}</text></svg>`;
 $$('[data-plan-dimension]', $('#plan-svg')).forEach(input=>{input.addEventListener('change',()=>setRoom(input.dataset.planDimension,input.value,input));input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur();}if(e.key==='Escape'){input.value=model.room[input.dataset.planDimension];input.blur();}});});
 $('#room-area').textContent=(Math.abs(area)/2e6).toFixed(2)+' m²';$('#room-badge').textContent=`${mm(w)} × ${mm(d)}`;};
// New grid follows every room edge, including concave and angled spaces.
function gridGeometry(poly){const minor=[],major=[];for(const axis of ['x','z']){const across=axis==='x'?'z':'x',max=axis==='x'?model.room.width:model.room.depth,other=axis==='x'?model.room.depth:model.room.width;
 for(let v=0;v<=max+EPS;v+=STEP){const cuts=[0,other];poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length],av=a[axis],bv=b[axis];if(Math.abs(av-bv)<EPS){if(Math.abs(v-av)<EPS)cuts.push(a[across],b[across]);return;}if(v>=Math.min(av,bv)-EPS&&v<=Math.max(av,bv)+EPS)cuts.push(a[across]+(b[across]-a[across])*(v-av)/(bv-av));});cuts.sort((a,b)=>a-b);
 for(let j=1;j<cuts.length;j++){const a=cuts[j-1],b=cuts[j],mid=(a+b)/2;if(b-a<EPS||!inside(axis==='x'?v:mid,axis==='x'?mid:v,poly))continue;const arr=v%500===0?major:minor;if(axis==='x')arr.push(v/1000,.003,a/1000,v/1000,.003,b/1000);else arr.push(a/1000,.003,v/1000,b/1000,.003,v/1000);}}}
 const group=new THREE.Group();group.name='studio_room_grid';for(const [arr,col,op] of [[minor,0x796f62,.12],[major,0x675a4a,.42]]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));group.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false})));}group.visible=gridVisible;return group;}
addRoom=()=>{const features=model.features;try{model.features=[];baseAddRoom();}finally{model.features=features;}
 for(const child of [...worldGroup.children])if(child.type==='GridHelper'){worldGroup.remove(child);disposeGroup(child);}
 worldGroup.traverse(o=>{if(o.name==='room_wall'){o.material.opacity=wallsVisible?.94:.055;o.material.depthWrite=wallsVisible;o.castShadow=false;}});worldGroup.add(gridGeometry(roomVertices()));};
$('#wall-toggle').onclick=()=>{wallsVisible=!wallsVisible;$('#wall-toggle').setAttribute('aria-pressed',String(wallsVisible));$('#wall-toggle').textContent=wallsVisible?'Hide walls':'Show walls';worldGroup?.traverse(o=>{if(o.name==='room_wall'){o.material.opacity=wallsVisible?.94:.055;o.material.depthWrite=wallsVisible;}});};
$('#grid-toggle').onclick=()=>{gridVisible=!gridVisible;$('#grid-toggle').setAttribute('aria-pressed',String(gridVisible));$('#grid-toggle').textContent=gridVisible?'Grid on':'Grid off';const g=worldGroup?.getObjectByName('studio_room_grid');if(g)g.visible=gridVisible;};
$('#list-toggle').onclick=()=>{const items=$('#studio-items');items.hidden=!items.hidden;$('#list-toggle').setAttribute('aria-expanded',String(!items.hidden));};
// Anchor the lower-left cabinet edge to a 50 mm grid and allow precise wall / adjacent edge snaps.
function snap(c,x,z,lock=null){
 const r=rect(c),w=r.w,d=r.d,poly=roomVertices(), wallLines=[];
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];
  if(Math.abs(a.x-b.x)<EPS)wallLines.push({axis:'x',value:a.x,start:Math.min(a.z,b.z),end:Math.max(a.z,b.z)});
  else if(Math.abs(a.z-b.z)<EPS)wallLines.push({axis:'z',value:a.z,start:Math.min(a.x,b.x),end:Math.max(a.x,b.x)});
 }
 const gx=Math.round((x-w/2)/STEP)*STEP+w/2,gz=Math.round((z-d/2)/STEP)*STEP+d/2;
 let xs=[{v:gx,priority:0}],zs=[{v:gz,priority:0}];
 const offer=(arr,v,near,threshold,priority)=>{if(Math.abs(v-near)<=threshold)arr.push({v,priority});};
 for(const wall of wallLines){if(wall.axis==='x' && z>=wall.start-d/2 && z<=wall.end+d/2){
   offer(xs,wall.value+w/2,x,WALL_PULL,3);offer(xs,wall.value-w/2,x,WALL_PULL,3);
  }else if(wall.axis==='z' && x>=wall.start-w/2 && x<=wall.end+w/2){
   offer(zs,wall.value+d/2,z,WALL_PULL,3);offer(zs,wall.value-d/2,z,WALL_PULL,3);
  }}
 for(const o of model.cabinets){if(o.uid===c.uid || !verticallyOverlaps(c,o))continue;const a=rect(o);
  if(Math.abs(z-o.z)<(d+a.d)/2+SNAP){offer(xs,a.l-w/2,x,SNAP,4);offer(xs,a.r+w/2,x,SNAP,4);offer(xs,a.l+w/2,x,65,2);offer(xs,a.r-w/2,x,65,2);}
  if(Math.abs(x-o.x)<(w+a.w)/2+SNAP){offer(zs,a.t-d/2,z,SNAP,4);offer(zs,a.b+d/2,z,SNAP,4);offer(zs,a.t+d/2,z,65,2);offer(zs,a.b-d/2,z,65,2);}
  offer(xs,o.x,x,70,1);offer(zs,o.z,z,70,1);
 }
 // A wall-lock maintains its normal coordinate and lets the cabinet glide laterally.
 if(lock){const v=lock.value+(lock.side==='positive'?1:-1)*(lock.axis==='x'?w:d)/2;
  if(lock.axis==='x')xs=[{v,priority:12}];else zs=[{v,priority:12}];}
 const options=[];
 for(const a of xs)for(const b of zs){const q={...c,x:a.v,z:b.v};if(invalid(q))continue;
  const displacement=Math.hypot(a.v-x,b.v-z),score=displacement-60*(a.priority+b.priority);
  options.push({q,score,priority:a.priority+b.priority});}
 options.sort((a,b)=>a.score-b.score || b.priority-a.priority);
 return options[0]?.q||null;
}
function detectWallLock(c){const r=rect(c),vertices=roomVertices();let best=null;
 vertices.forEach((a,i)=>{const b=vertices[(i+1)%vertices.length];let axis,value,start,end,side,dist;
  if(Math.abs(a.x-b.x)<EPS){axis='x';value=a.x;start=Math.min(a.z,b.z);end=Math.max(a.z,b.z);
   if(c.z<start-r.d/2||c.z>end+r.d/2)return;let left=Math.abs(r.l-value),right=Math.abs(r.r-value);
   dist=Math.min(left,right);side=left<=right?'positive':'negative';
  }else if(Math.abs(a.z-b.z)<EPS){axis='z';value=a.z;start=Math.min(a.x,b.x);end=Math.max(a.x,b.x);
   if(c.x<start-r.w/2||c.x>end+r.w/2)return;let near=Math.abs(r.t-value),far=Math.abs(r.b-value);
   dist=Math.min(near,far);side=near<=far?'positive':'negative';
  }else return;
  if(dist<=WALL_PULL&&(!best||dist<best.dist))best={axis,value,side,dist};
 });return best;
}
function findSpace(c,near=null){if(top(c)>model.room.height+EPS||model.cabinets.length>=100)return null;const r=rect(c), candidates=[];const maxX=model.room.width-r.w/2,maxZ=model.room.depth-r.d/2;if(maxX<r.w/2||maxZ<r.d/2)return null;const target=near||{x:r.w/2,z:r.d/2};
 const add=(x,z)=>{if(x>=r.w/2-EPS&&x<=maxX+EPS&&z>=r.d/2-EPS&&z<=maxZ+EPS)candidates.push([x,z]);};
 add(target.x,target.z);for(const o of model.cabinets){const a=rect(o);add(a.r+r.w/2,o.z);add(a.l-r.w/2,o.z);add(o.x,a.b+r.d/2);add(o.x,a.t-r.d/2);if(!verticallyOverlaps(c,o))add(o.x,o.z);}
 const xs=[],zs=[];for(let x=r.w/2;x<=maxX+EPS;x+=STEP)xs.push(x);for(let z=r.d/2;z<=maxZ+EPS;z+=STEP)zs.push(z);xs.push(maxX);zs.push(maxZ);
 // Try a small local list first, then scan positions in increasing distance from the target.
 candidates.sort((a,b)=>Math.hypot(a[0]-target.x,a[1]-target.z)-Math.hypot(b[0]-target.x,b[1]-target.z));for(const [x,z] of candidates){const q={...c,x,z};if(!invalid(q))return q;}
 xs.sort((a,b)=>Math.abs(a-target.x)-Math.abs(b-target.x));zs.sort((a,b)=>Math.abs(a-target.z)-Math.abs(b-target.z));for(const z of zs)for(const x of xs){const q={...c,x,z};if(!invalid(q))return q;}return null;}
function commitNew(c){
 const ref=model.cabinets.filter(o=>o.category===c.category).at(-1);
 if(ref){for(const key of ['material','color','doorStyle','handle','worktopType','worktopMaterial','plinthHeight','carcass'])c[key]=deep(ref[key]);
  }
 else if(defaultMaterial){c.material=deep(defaultMaterial);c.color='#907053';}
 c.thickness=18;
 if(model.cabinets.length>=100){studioMessage('A design can contain up to 100 cabinets.');return;}history();model.cabinets.push(c);model.selected=c.uid;model.selectedExtra=null;model.doorsOpen=false;closeMenu();renderAll();changed(false);notify('Added '+c.name+'.');}
addCabinet=t=>{const c=standardCab(t),last=model.cabinets.at(-1);
 if(window.__ideareReplaceSelected){commitNew(c);return;}let near=null;if(last){const a=rect(last);near={x:a.r+c.width/2,z:last.z};}const q=findSpace(c,near);if(!q){studioMessage('There is no free space for this cabinet. Try a smaller cabinet or a larger room.');return;}commitNew(q);};
$('#duplicate').onclick=()=>{const c=selected();if(!c)return;const copy={...deep(c),uid:uuid()},r=rect(c);const q=findSpace(copy,{x:r.r+r.w/2,z:c.z});if(!q){studioMessage('No free space for a duplicate.');return;}commitNew(q);};
function updateCab(c,patch,{record=true,redraw=true}={}){const q={...c,...patch},why=invalid(q);if(why){studioMessage(why);return false;}if(Object.keys(patch).every(k=>c[k]===patch[k]))return true;if(record)history();Object.assign(c,patch);if('height'in patch)c.shelfPositions=[];detachRun(c);if(redraw){renderAll();changed(false);}return true;}
$('#rotate').onclick=()=>{const c=selected();if(c)updateCab(c,{rotation:(c.rotation+90)%360});};
$('#object-rotate').onclick=()=>$('#rotate').click();
// The original inspector still manages materials and internal configurations.
$('#selected-inspector').addEventListener('change',e=>{const el=e.target,k=el.dataset.property,c=selected();if(!c||!['x','z'].includes(k))return;e.stopImmediatePropagation();const raw=Number(el.value);if(el.value.trim()===''||!Number.isFinite(raw)||!updateCab(c,{[k]:Math.round(raw)})){el.value=c[k];}},true);
updateDimension=(key,value,final=false)=>{const c=selected();if(!c)return;const v=String(value).trim()===''?c[key]:Math.round(clamp(value,100,10000));const q={...c,[key]:v};const why=invalid(q);if(!why&&c[key]!==v){c[key]=v;if(key==='height')c.shelfPositions=[];detachRun(c);}else if(why)studioMessage(why);
 const input=$(`[data-dimension="${key}"]`),slider=$(`[data-slider="${key}"]`);if(input)input.value=c[key];if(slider){slider.min=Math.min(n(slider.min),c[key]);slider.max=Math.max(n(slider.max),c[key]);slider.value=c[key];}drawScene();if(final){renderInspector();renderList();changed(false);}else $('#selected-size').textContent=`${mm(c.width)} × ${mm(c.height)} × ${mm(c.depth)}`;};
warningsFor=c=>{const results=baseWarnings(c).filter(v=>!v.text.startsWith('Cabinet footprint extends beyond')&&!v.text.startsWith('Part of the cabinet lies outside')&&!v.text.startsWith('Cabinet overlaps another cabinet'));const why=invalid(c);if(why)results.push({type:'error',text:why});return results;};
const baseSave=save;save=mode=>{if(!allFit()){studioMessage('Resolve invalid cabinet positions before saving this existing design.');showStep(3);return;}return baseSave(mode);};
renderInspector=()=>{baseRenderInspector();const id=model.selected||model.selectedExtra;if(id!==lastSelection){detailsCollapsed=false;lastSelection=id;}inspector.hidden=!id||detailsCollapsed;const btn=$('#details-toggle');btn.disabled=!id;btn.setAttribute('aria-expanded',String(!!id&&!detailsCollapsed));btn.textContent=id&&detailsCollapsed?'Show details':'Details';};
$('#details-toggle').onclick=()=>{detailsCollapsed=!detailsCollapsed;renderInspector();};
renderList=()=>{baseRenderList();};
showStep=i=>{const step=clamp(i,1,4);if(move)endMove(true);app.dataset.studioStep=String(step);document.documentElement.classList.toggle('studio-fullscreen',step===2||step===3);if(step!==3){preview.hidden=true;hoverTip.hidden=true;hud.hidden=true;clearGhost();}baseShowStep(step);if(step===3){renderInspector();requestAnimationFrame(resize);}};
// Hit-testing selects without dragging; camera orbit remains on empty space.
function hitObject(e){if(!camera||!raycaster||!renderer)return null;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return null;const mouse=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects([...cabinetGroup.children,...extraGroup.children],true);for(const hit of hits){let o=hit.object;if(o.isLineSegments||o.isSprite)continue;while(o){if(o.userData?.uid)return {uid:o.userData.uid};if(o.userData?.extraId)return {extraId:o.userData.extraId};o=o.parent;}}return null;}
onPointerDown=e=>{if(model.step!==3||!camera||!renderer||e.button!==0)return;const hit=hitObject(e);pointerStart={x:e.clientX,y:e.clientY,started:false,studioHit:hit};if(hit){e.stopImmediatePropagation();canvas.setPointerCapture?.(e.pointerId);}};
// On a cabinet, intercept before OrbitControls starts a camera gesture.
canvas.addEventListener('pointerdown',onPointerDown,{capture:true});
onPointerMove=()=>{};
onPointerUp=e=>{if(pointerStart){const p=pointerStart;const click=!e||Math.hypot(e.clientX-p.x,e.clientY-p.y)<7;if(click&&model.step===3){if(p.studioHit?.uid)select(p.studioHit.uid);else if(p.studioHit?.extraId)selectExtra(p.studioHit.extraId);else if(model.selected||model.selectedExtra)select(null);}}pointerStart=null;draggingId=null;draggingExtraId=null;if(controls&&!move)controls.enabled=true;};
canvas.addEventListener('pointercancel',()=>{pointerStart=null;if(controls&&!move)controls.enabled=true;});
function worldAt(e,height=0){if(!camera||!raycaster)return null;const r=canvas.getBoundingClientRect(),v=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(v,camera);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-height),p)?p:null;}
function moveStart(e){const c=selected()||extraSelected();if(!c||!camera||e.button!==0)return;e.preventDefault();e.stopPropagation();const isExtra=!c.uid, y=isExtra?c.height/1000:top(c)/1000;const p=worldAt(e,y);if(!p)return;move={item:c,isExtra,y,pointer:e.pointerId,origin:{x:c.x,z:c.z},start:p,recorded:false,wallLock:isExtra?null:detectWallLock(c)};controls.enabled=false;$('#object-move').setPointerCapture(e.pointerId);hud.classList.add('moving');hoverTip.hidden=true;}
function moveUpdate(e){if(!move||e.pointerId!==move.pointer)return;const p=worldAt(e,move.y);if(!p)return;const c=move.item,x=move.origin.x+(p.x-move.start.x)*1000,z=move.origin.z+(p.z-move.start.z)*1000;
 if(move.wallLock){const lock=move.wallLock,normal=lock.axis==='x'?x:z, r=rect(c),locked=lock.value+(lock.side==='positive'?1:-1)*(lock.axis==='x'?r.w:r.d)/2;
  if(Math.abs(normal-locked)>RELEASE)move.wallLock=null;}
 const q=move.isExtra?{...c,x:Math.round(x/STEP)*STEP,z:Math.round(z/STEP)*STEP}:snap(c,x,z,move.wallLock);if(!q||(move.isExtra&&!fits({...q,rotation:0}))){hud.classList.add('blocked');$('#selection-badge').textContent='Placement blocked · last valid position retained';return;}hud.classList.remove('blocked');if(!move.isExtra&&!move.wallLock)move.wallLock=detectWallLock(q);if(q.x===c.x&&q.z===c.z)return;if(!move.recorded){history();move.recorded=true;if(!move.isExtra)detachRun(c);}c.x=q.x;c.z=q.z;const mesh=move.isExtra?extraGroup.children.find(o=>o.userData.extraId===c.id):meshById.get(c.uid);if(mesh)mesh.position.set(c.x/1000,move.isExtra?0:low(c)/1000,c.z/1000);$('#selection-badge').textContent=`${mm(c.x)} · ${mm(c.z)}`;}
function endMove(cancel=false){if(!move)return;const m=move;move=null;hud.classList.remove('blocked','moving');if(controls)controls.enabled=true;if(cancel&&m.recorded){if(undo.length){const previous=undo.pop();applyHistory(previous);refreshUndo();}changed(false);}else if(m.recorded){renderAll();changed(false);}else renderList();}
$('#object-move').addEventListener('pointerdown',moveStart);$('#object-move').addEventListener('pointermove',moveUpdate);$('#object-move').addEventListener('pointerup',()=>endMove());$('#object-move').addEventListener('pointercancel',()=>endMove(true));$('#object-move').addEventListener('lostpointercapture',()=>{if(move)endMove();});
// Keyboard users can move the selected cabinet in exactly the same increments.
$('#object-move').addEventListener('keydown',e=>{const delta={ArrowLeft:[-STEP,0],ArrowRight:[STEP,0],ArrowUp:[0,-STEP],ArrowDown:[0,STEP]}[e.key],c=selected();if(!delta||!c)return;e.preventDefault();const q=snap(c,c.x+delta[0],c.z+delta[1]);if(q)updateCab(c,{x:q.x,z:q.z});else studioMessage('Placement blocked.');});
window.addEventListener('keydown',e=>{if(model.step!==3||e.target?.matches?.('input,textarea,select'))return;if(e.key==='Escape'){if(move)endMove(true);else{closeMenu();select(null);}}});
function setHover(uid){if(hoverUid===uid)return;hoverUid=uid;for(const [id,g] of meshById){const outline=g.children.find(o=>o.isLineSegments);if(outline){outline.visible=id===model.selected||id===uid;outline.material.color.set(id===model.selected?0xb3905c:0x786345);}}}
canvas.addEventListener('pointermove',e=>{if(model.step!==3||move||pointerStart||dragTemplate||e.pointerType==='touch')return;const hit=hitObject(e);setHover(hit?.uid||null);const c=model.cabinets.find(o=>o.uid===hit?.uid);canvas.style.cursor=c?'pointer':'grab';if(c&&c.uid!==model.selected){hoverTip.textContent=`${c.name} · ${mm(c.width)} × ${mm(c.depth)} × ${mm(c.height)}`;hoverTip.hidden=false;const r=wrap.getBoundingClientRect();hoverTip.style.left=Math.max(8,Math.min(r.width-235,e.clientX-r.left+15))+'px';hoverTip.style.top=Math.max(8,e.clientY-r.top+15)+'px';}else hoverTip.hidden=true;});
canvas.addEventListener('pointerleave',()=>{setHover(null);hoverTip.hidden=true;});
function zoom(f){if(!camera||!controls)return;const v=camera.position.clone().sub(controls.target);v.setLength(clamp(v.length()*f,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(v);controls.update();}
$('#studio-zoom-in').onclick=()=>zoom(.8);$('#studio-zoom-out').onclick=()=>zoom(1.25);
function hudFrame(){requestAnimationFrame(hudFrame);const c=selected()||extraSelected();if(model.step!==3||!c||!camera||!renderer){hud.hidden=true;return;}const isExtra=!c.uid,r=wrap.getBoundingClientRect();const p=new THREE.Vector3(c.x/1000,(isExtra?c.height:top(c))/1000,c.z/1000).project(camera);if(!move&&(p.z>1||p.z<-1||Math.abs(p.x)>1||Math.abs(p.y)>1)){hud.hidden=true;return;}hud.hidden=false;$('#object-rotate').hidden=isExtra;hud.style.left=`${clamp((p.x+1)*r.width/2,30,r.width-30)}px`;hud.style.top=`${clamp((1-p.y)*r.height/2,30,r.height-42)}px`;}
requestAnimationFrame(hudFrame);
// Render an actual model thumbnail from the same geometry as the room (not a stock image).
function previewCab(t,button){if(!t)return;const c=standardCab(t);$('#studio-preview-name').textContent=c.name;$('#studio-preview-size').textContent=`${mm(c.width)} × ${mm(c.depth)} × ${mm(c.height)}`;preview.hidden=false;const br=button.getBoundingClientRect(),ar=app.getBoundingClientRect();preview.style.left=`${clamp(br.right-ar.left+8,8,app.clientWidth-225)}px`;preview.style.top=`${clamp(br.top-ar.top,100,app.clientHeight-220)}px`;
 try{if(!previewRenderer){previewRenderer=new THREE.WebGLRenderer({canvas:$('#studio-preview-canvas'),antialias:true,alpha:false});previewRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));previewRenderer.setSize(200,145,false);previewRenderer.outputColorSpace=THREE.SRGBColorSpace;previewScene=new THREE.Scene();previewScene.background=new THREE.Color('#e8e1d6');previewScene.add(new THREE.AmbientLight(0xffffff,1.7));const light=new THREE.DirectionalLight(0xffeed7,2.2);light.position.set(3,5,4);previewScene.add(light);previewCamera=new THREE.PerspectiveCamera(35,200/145,.01,100);}
 if(previewModel){previewScene.remove(previewModel);disposeGroup(previewModel);}previewModel=makeCabinet(c);previewModel.position.set(0,0,0);const h=c.height/1000,size=Math.max(c.width,c.depth,c.height)/1000;previewCamera.position.set(size*1.65,h/2+size*.8,size*2);previewCamera.lookAt(0,h/2,0);previewScene.add(previewModel);previewRenderer.render(previewScene,previewCamera);}catch(e){console.warn('Cabinet thumbnail unavailable',e);}}
const baseOpenMenu=openMenu;openMenu=(menu,hover=false)=>{baseOpenMenu(menu,hover);if(menu!==1)return;$$('#catalog-menu [data-template]').forEach(b=>{if(b.dataset.studioReady)return;b.dataset.studioReady='1';b.draggable=true;const t=template(b.dataset.template);b.addEventListener('mouseenter',()=>previewCab(t,b));b.addEventListener('focus',()=>previewCab(t,b));b.addEventListener('mouseleave',()=>preview.hidden=true);b.addEventListener('blur',()=>preview.hidden=true);b.addEventListener('dragstart',e=>{dragTemplate=t;preview.hidden=true;e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain',String(t.id));});b.addEventListener('dragend',()=>{dragTemplate=null;clearGhost();});});};
const baseCloseMenu=closeMenu;closeMenu=()=>{baseCloseMenu();preview.hidden=true;};
function clearGhost(){if(ghost){scene?.remove(ghost);disposeGroup(ghost);ghost=null;}}
function ghostAt(c,valid){clearGhost();const r=rect(c),box=new THREE.BoxGeometry(r.w/1000,c.height/1000,r.d/1000),edges=new THREE.EdgesGeometry(box);box.dispose();ghost=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:valid?0x348654:0xc44742,depthTest:false,transparent:true,opacity:.95}));ghost.position.set(c.x/1000,(low(c)+c.height/2)/1000,c.z/1000);ghost.renderOrder=99;scene.add(ghost);}
canvas.addEventListener('dragover',e=>{if(!dragTemplate||model.step!==3||!scene)return;e.preventDefault();const p=worldAt(e);if(!p)return;const c=standardCab(dragTemplate),q=snap(c,p.x*1000,p.z*1000);e.dataTransfer.dropEffect=q?'copy':'none';ghostAt(q||{...c,x:p.x*1000,z:p.z*1000},!!q);});
canvas.addEventListener('dragleave',clearGhost);canvas.addEventListener('drop',e=>{if(!dragTemplate)return;e.preventDefault();const t=dragTemplate;dragTemplate=null;clearGhost();const p=worldAt(e);if(!p)return;const q=snap(standardCab(t),p.x*1000,p.z*1000);if(q)commitNew(q);else studioMessage('That position is blocked. Drag to a free area.');});
window.addEventListener('dragend',()=>{dragTemplate=null;clearGhost();});

// ==============================================================
// Premium configurator: catalogue-driven finishes and live controls
// ==============================================================
const originalStandardCab=standardCab;
standardCab=t=>{const c=originalStandardCab(t);c.thickness=18;c.plinthHeight=102;
 if(defaultMaterial)c.material=deep(defaultMaterial);
 const peer=model.cabinets.filter(o=>o.category===c.category).at(-1);
 if(peer){for(const k of ['color','material','doorStyle','handle','carcass','worktopMaterial','worktopType','plinthHeight'])c[k]=deep(peer[k]);
  if(c.category!=='wall-cabinets'&&c.category!=='tall-cabinets'){c.height=peer.height;c.depth=peer.depth;}}
 return c;};
const materialId=m=>`${m.source}:${m.id}`;
const finishType=m=>{const str=[m.product_name,m.category,m.series].join(' ').toLowerCase();
 if(/oak|walnut|wood|ash|timber|maple|teak|cherry|pine|grain|elm|veneer/.test(str))return 'wood';
 if(/marble|stone|granite|concrete|travertine|slate/.test(str))return 'stone';return 'solid';};
const materialMatches=m=>finishFilter==='all'||finishType(m)===finishFilter;
function rememberFinish(m){if(!m)return;recentFinishes=[materialId(m),...recentFinishes.filter(id=>id!==materialId(m))].slice(0,8);
 try{localStorage.setItem('ideare_recent_finishes_v2',JSON.stringify(recentFinishes));const recent=recentFinishes.map(id=>allFinishes.find(x=>materialId(x)===id)).filter(Boolean);localStorage.setItem('ideare_recent_finish_entries_v2',JSON.stringify(recent));}catch(e){}}
function imgOf(m){return mediaPath(m?.image||'');}
function finishTile(m,small=false){const selectedMaterial=selected()?.material;
 const active=selectedMaterial&&materialId(selectedMaterial)===materialId(m);
 return `<button type="button" class="studio-finish-tile ${small?'compact':''} ${active?'active':''}" data-finish-id="${safe(materialId(m))}" title="${safe(m.product_name)}" aria-pressed="${active?'true':'false'}"><span class="studio-finish-thumb">${m.image?`<img src="${safe(imgOf(m))}" alt="" loading="lazy" onerror="this.style.display='none'">`:''}</span><span class="studio-finish-name">${safe(m.product_name||m.product_code)}</span>${active?'<span class="studio-finish-check">✓</span>':''}</button>`;}
function renderFinishLibrary(){const current=selected()?.material||defaultMaterial;
 const label=$('#studio-finish-current-name'),swatch=$('#studio-finish-current-swatch');
 if(label){label.textContent=current?.product_name||'Catalogue finish unavailable';swatch.style.backgroundImage=current?.image?`url("${encodeURI(imgOf(current)).replace(/"/g,'%22')}")`:'';}
 const recent=recentFinishes.map(id=>allFinishes.find(m=>materialId(m)===id)).filter(Boolean);
 $('#studio-finish-recents').innerHTML=recent.length?`<small>Recently selected</small><div class="studio-finish-grid">${recent.map(m=>finishTile(m,true)).join('')}</div>`:'';
 const q=finishQuery.trim().toLowerCase();const list=allFinishes.filter(materialMatches).filter(m=>!q||`${m.product_name} ${m.product_code} ${m.category||''} ${m.series||''}`.toLowerCase().includes(q));
 $('#studio-finish-results').innerHTML=list.length?list.slice(0,120).map(m=>finishTile(m)).join(''):`<p class="id3-note">${materialReady?'No matching finishes. Try another term.':'Catalogue is loading or unavailable. Confirm that the materials database is connected.'}</p>`;
 $$('[data-finish-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.finishFilter===finishFilter)));
}
function applyFinish(m){const c=selected();if(!c)return;
 const scope=$('#studio-finish-scope').value,targets=scope==='all'?model.cabinets:scope==='type'?model.cabinets.filter(x=>x.category===c.category):[c];
 history();targets.forEach(x=>{x.material=deep(m);x.color='#907053';});rememberFinish(m);renderAll();changed(false);}
let finishSearchTimer=0,finishSearchRequest=0;
$('#studio-finish-search').addEventListener('input',e=>{finishQuery=e.target.value;renderFinishLibrary();clearTimeout(finishSearchTimer);
 const term=finishQuery.trim();if(term.length<2)return;
 finishSearchTimer=setTimeout(async()=>{const seq=++finishSearchRequest;
 const results=await Promise.allSettled(['topmix','dgtango'].map(source=>request(`materials.php?source=${source}&q=${encodeURIComponent(term)}`)));
 if(seq!==finishSearchRequest||term!==finishQuery.trim())return;
 const updated=results.flatMap((r,i)=>r.status==='fulfilled'?r.value.items.map(m=>({...m,source:['topmix','dgtango'][i]})):[]);
 const cached=new Map(allFinishes.map(m=>[materialId(m),m]));updated.forEach(m=>cached.set(materialId(m),m));allFinishes=[...cached.values()];renderFinishLibrary();
 },250);});
$('#studio-finish-filters').addEventListener('click',e=>{const b=e.target.closest('[data-finish-filter]');if(!b)return;finishFilter=b.dataset.finishFilter;renderFinishLibrary();});
for(const id of ['studio-finish-results','studio-finish-recents'])$('#'+id).addEventListener('click',e=>{const b=e.target.closest('[data-finish-id]');if(!b)return;
 const m=allFinishes.find(x=>materialId(x)===b.dataset.finishId);if(m)applyFinish(m);});
async function loadFinishLibrary(){try{const sources=['topmix','dgtango'];const results=await Promise.allSettled(sources.map(src=>request(`materials.php?source=${src}&q=`)));
 allFinishes=results.flatMap((r,i)=>r.status==='fulfilled'?r.value.items.map(m=>({...m,source:sources[i]})):[]);
 const seen=new Set();allFinishes=allFinishes.filter(m=>{const k=materialId(m);if(seen.has(k))return false;seen.add(k);return true;});
 try{recentFinishes=JSON.parse(localStorage.getItem('ideare_recent_finishes_v2')||'[]');const saved=JSON.parse(localStorage.getItem('ideare_recent_finish_entries_v2')||'[]');const cache=new Map(allFinishes.map(m=>[materialId(m),m]));for(const m of saved)if(m?.source&&m?.id)cache.set(materialId(m),m);allFinishes=[...cache.values()];}catch(e){}
 defaultMaterial=allFinishes.find(m=>/oak/i.test(m.product_name))||allFinishes[0]||null;
 materialReady=true;
 // Only new cabinets inherit the default. Existing project finishes remain untouched.
 renderFinishLibrary();
 }catch(e){materialReady=true;renderFinishLibrary();console.warn('IDEARE finish library',e);}}
const baseBoot=boot;
boot=async()=>{await baseBoot();catalog.handles=catalog.handles.filter(h=>!/^demo\b/i.test(h.name||'')&&!/demo edge pull/i.test(h.name||''));
 const bar=catalog.handles.find(h=>/black.*bar|bar.*black/i.test(h.name))||catalog.handles[0];
 model.cabinets.forEach(c=>{if(c.handle&&!catalog.handles.some(h=>Number(h.id)===Number(c.handle)))c.handle=bar?.id||null;});
 await loadFinishLibrary();renderInspector();};
const oldInspector=renderInspector;
renderInspector=()=>{oldInspector();const c=selected();
 const hinge=$('.studio-hinge-control'),front=$('[data-property="front"]'),doorCount=$('[data-property="doorCount"]'),opening=$('[data-property="opening"]');
 if(hinge)hinge.hidden=!c||c.front!=='doors'||Number(c.doorCount)!==1||c.opening!=='swing';
 if(doorCount?.closest('label'))doorCount.closest('label').hidden=!c||c.front!=='doors';
 if(opening?.closest('label'))opening.closest('label').hidden=!c||c.front!=='doors';
 const handleSource=$('.studio-handle-source');if(handleSource)handleSource.hidden=true;
 const gallery=$('#studio-handle-gallery');if(gallery&&c){gallery.innerHTML=`<p class="studio-handle-title">Handle style</p><div class="studio-handle-grid">`+catalog.handles.map(h=>{
  const name=h.name||'',kind=/handleless|push/i.test(name)?'handleless':/recess|edge|finger/i.test(name)?'recessed':/gold|brass/i.test(name)?'gold':'bar';
  return `<button type="button" class="studio-handle-tile ${Number(c.handle)===Number(h.id)?'active':''}" data-handle-id="${Number(h.id)}"><span class="studio-handle-drawing ${kind}"><i></i></span><small>${safe(name)}</small></button>`;}).join('')+`</div>`;}
 renderFinishLibrary();};
$('#studio-handle-gallery').addEventListener('click',e=>{const b=e.target.closest('[data-handle-id]'),c=selected();if(!b||!c)return;history();c.handle=Number(b.dataset.handleId);
 renderAll();changed(false);});
$('#studio-inherit').addEventListener('click',()=>{const c=selected();if(!c)return;const peer=model.cabinets.filter(x=>x!==c&&x.category===c.category).sort((a,b)=>Math.hypot(a.x-c.x,a.z-c.z)-Math.hypot(b.x-c.x,b.z-c.z))[0];
 if(!peer){studioMessage('Add another compatible cabinet first.');return;}history();for(const k of ['material','color','doorStyle','handle','worktopMaterial','worktopType','plinthHeight','carcass'])c[k]=deep(peer[k]);renderAll();changed(false);});
$('#studio-apply-style').addEventListener('click',()=>{const c=selected();if(!c)return;history();model.cabinets.filter(x=>x!==c&&x.category===c.category).forEach(x=>{
 for(const k of ['material','color','doorStyle','handle','worktopMaterial','worktopType','plinthHeight','carcass'])x[k]=deep(c[k]);});renderAll();changed(false);});
$('#studio-replace').addEventListener('click',()=>{closeMenu();openMenu(1);notify('Select a replacement cabinet from the library. Compatible dimensions and materials are preserved.');window.__ideareReplaceSelected=model.selected;});
const originalCommit=commitNew;
commitNew=c=>{const replaceUid=window.__ideareReplaceSelected;
 if(replaceUid){window.__ideareReplaceSelected=null;const old=model.cabinets.find(o=>o.uid===replaceUid);if(old){const trial={...c,uid:old.uid,x:old.x,z:old.z,rotation:old.rotation,width:old.width,depth:old.depth,height:old.height};
  for(const key of ['color','material','handle','doorStyle','plinthHeight','carcass','worktopMaterial','worktopType'])trial[key]=deep(old[key]);
  if(invalid(trial,old.uid)){studioMessage('This replacement does not fit the current position. The original cabinet was kept.');return;}
  history();Object.assign(old,trial);model.selected=old.uid;closeMenu();renderAll();changed(false);return;}}
 originalCommit(c);};
// Toggle door animation while viewing internal settings; ensure it is visible immediately.
$('#inspector-tabs').addEventListener('toggle',e=>{if(e.target.matches?.('details:nth-child(3)')&&e.target.open&&selected()){model.doorsOpen=true;drawScene();}},true);
// Keep only customer-visible options whose state can affect the model.
$('#selected-inspector').addEventListener('change',e=>{if(['front','doorCount','opening','hingeSide'].includes(e.target.dataset.property))queueMicrotask(()=>renderInspector());},false);
// Animate the existing parametric doors and drawers without recreating their mechanics.
let doorMotion=false,doorFrame=0;
$('#open-doors').addEventListener('click',()=>{doorMotion=true;},true);
const previousDrawScene=drawScene;
drawScene=()=>{if(doorFrame)cancelAnimationFrame(doorFrame);previousDrawScene();
 if(!doorMotion)return;doorMotion=false;const c=selected(),g=c&&meshById.get(c.uid);
 if(!g)return;const startTime=performance.now(),duration=300,actors=[];
 for(const pivot of g.children){if(!pivot.isGroup||!pivot.children.some(o=>o.name==='door_panel'))continue;
  for(const axis of ['x','y']){const end=pivot.rotation[axis];if(Math.abs(end)<.01&&c.opening!=='swing'&&c.opening!=='lift')continue;
   const initial=model.doorsOpen?0:(c.opening==='lift'&&axis==='x'?-0.6:c.opening==='swing'&&axis==='y'?(pivot.position.x<=0?-.9:.9):0);
   if(Math.abs(initial-end)>0.01){pivot.rotation[axis]=initial;actors.push({mesh:pivot,axis,from:initial,to:end});}}
 }
 // Drawer fronts move along Z when the internal storage is opened.
 g.children.filter(o=>/^(drawer_front|drawer_box|drawer_handle_premium)$/.test(o.name)).forEach(o=>{const end=o.position.z;
  const span=Math.min(.4,c.depth/1000*.65),prev=model.doorsOpen?end-span:end+span;
  o.position.z=prev;actors.push({mesh:o,axis:'z',from:prev,to:end,position:true});});
 if(!actors.length)return;
 const frame=now=>{const t=Math.min(1,(now-startTime)/duration),ease=1-Math.pow(1-t,3);
  for(const a of actors){if(a.position)a.mesh.position[a.axis]=a.from+(a.to-a.from)*ease;
   else a.mesh.rotation[a.axis]=a.from+(a.to-a.from)*ease;}
  if(t<1)doorFrame=requestAnimationFrame(frame);else doorFrame=0;};
 doorFrame=requestAnimationFrame(frame);
};
// Realistic model details layered onto the existing parametric cabinet geometry.
const originalMakeCabinet=makeCabinet;
makeCabinet=c=>{const g=originalMakeCabinet(c),h=c.height/1000,w=c.width/1000,d=c.depth/1000;
 const handleName=catalog.handles.find(x=>Number(x.id)===Number(c.handle))?.name||'';
 const isHandleless=/handleless|push/i.test(handleName),isRecessed=/recess|finger|edge/i.test(handleName),isGold=/brass|gold/i.test(handleName);
 g.traverse(o=>{if(o.name==='handle'||o.name==='drawer_handle')o.visible=false;
  if(o.name==='led_strip'){o.material.emissive=new THREE.Color('#fff1ad');o.material.emissiveIntensity=.9;}
  if(o.name==='door_panel'&&c.opening==='sliding'&&model.doorsOpen&&model.selected===c.uid){o.position.x+=(o.position.x>0?-.48:.48)*w/Math.max(1,c.doorCount);}
 });
 if(!isHandleless&&c.front!=='open'){
  const hardware=new THREE.MeshStandardMaterial({color:isGold?'#c49b61':'#2b2926',metalness:.78,roughness:.28});
  const offset=.018;
  if(c.front==='doors'){
   const pivots=g.children.filter(child=>child.type==='Group'&&child.children.some(x=>x.name==='door_panel'));
   pivots.forEach((pivot,i)=>{const leaf=pivot.children.find(x=>x.name==='door_panel');if(!leaf)return;
    const x=leaf.position.x+(leaf.position.x<0?.06:-.06),y=leaf.position.y;
    if(isRecessed)addBox(pivot,.075,.008,.018,x,y+.07,.034,hardware,'handle_recessed');
    else addBox(pivot,isGold?.010:.012,Math.min(.17,h*.22),.02,x,y,.036,hardware,'handle_premium');
   });
  }else if(c.front==='drawers')g.children.filter(x=>x.name==='drawer_front').forEach(front=>{
   addBox(g,isRecessed?.11:.15,isRecessed?.012:.014,.018,0,front.position.y,d/2+.06,hardware,'drawer_handle_premium');
  });
 }
 if(c.led&&model.cabinets.length<25){const light=new THREE.PointLight(0xffe5a5,.35,Math.max(.8,d*1.5),2);light.position.set(0,h-.06,d*.25);g.add(light);}
 return g;};
// Automatic visually continuous surfaces whenever equal-height compatible base cabinets touch.
function rebuildAutoRuns(){const originals=model.shared.filter(run=>!run.auto);
 const available=model.cabinets.filter(c=>c.category!=='wall-cabinets'&&c.category!=='tall-cabinets'&&c.rotation%360===0);
 const groups=[];const visited=new Set();
 for(const seed of available){if(visited.has(seed.uid))continue;let part=[seed], work=true; visited.add(seed.uid);
  while(work){work=false;for(const c of available){if(visited.has(c.uid))continue;
   if(part.some(o=>Math.abs(o.z-c.z)<2&&Math.abs(o.depth-c.depth)<2&&Math.abs(o.height-c.height)<2&&Math.abs((o.x+o.width/2)-(c.x-c.width/2))<2||
    Math.abs(o.z-c.z)<2&&Math.abs(o.depth-c.depth)<2&&Math.abs(o.height-c.height)<2&&Math.abs((c.x+c.width/2)-(o.x-o.width/2))<2)){
     part.push(c);visited.add(c.uid);work=true;}}}
  if(part.length>1)groups.push(part.sort((a,b)=>a.x-b.x));}
 const auto=[];for(const part of groups){const first=part[0],ids=part.map(c=>c.uid),hasSameFinish=(k)=>part.every(c=>JSON.stringify(c[k])===JSON.stringify(first[k]));
  if(part.every(c=>c.worktop)&&hasSameFinish('worktopMaterial')&&hasSameFinish('worktopType'))auto.push({id:`auto-top-${ids[0]}`,auto:true,type:'worktop',cabinetUids:ids,material:first.worktopMaterial});
  if(part.every(c=>c.plinth)&&hasSameFinish('plinthHeight'))auto.push({id:`auto-plinth-${ids[0]}`,auto:true,type:'plinth',cabinetUids:ids});
  if(part.every(c=>c.backsplash)&&hasSameFinish('worktopMaterial'))auto.push({id:`auto-back-${ids[0]}`,auto:true,type:'backsplash',cabinetUids:ids});
 }
 model.shared=originals.concat(auto);}
const originalRenderAll=renderAll;
renderAll=()=>{rebuildAutoRuns();originalRenderAll();};
// Slider and direct dimension edits use an attachment anchor rather than always stretching centrally.
const originalUpdateDimension=updateDimension;
updateDimension=(key,value,final=false)=>{const c=selected();if(!c)return;const old={...c},r=rect(c),raw=String(value).trim()===''?c[key]:Math.round(clamp(value,100,10000));let target={...c,[key]:raw};
 if(['width','depth'].includes(key)){const axis=(key==='width'&&c.rotation%180===0)||(key==='depth'&&c.rotation%180!==0)?'x':'z';
  const lock=detectWallLock(c);if(lock?.axis===axis){const diff=(raw-c[key])/2;target[axis]+=lock.side==='positive'?diff:-diff;}
  else{const touching=model.cabinets.find(o=>o!==c&&verticallyOverlaps(c,o)&&Math.abs((axis==='x'?rect(o).r:rect(o).b)-(axis==='x'?r.l:r.t))<2);
   if(touching)target[axis]+=(raw-c[key])/2;}}
 if(!invalid(target)){Object.assign(c,target);if(key==='height')c.shelfPositions=[];detachRun(c);}
 else studioMessage('The cabinet cannot resize into a wall or another cabinet.');
 const input=$(`[data-dimension="${key}"]`),slider=$(`[data-slider="${key}"]`);if(input)input.value=c[key];if(slider)slider.value=c[key];
 if(final){renderAll();changed(false);}else{drawScene();$('#selected-size').textContent=`${mm(c.width)} × ${mm(c.height)} × ${mm(c.depth)}`;}};

// Browser navigation and existing theme switch remain unchanged outside studio mode.
renderPlan();renderInspector();
})();
