/* IDEARE v8: independent wall finishes and persistent, screen-projected edge handles.
   All persisted dimensions and wall offsets are millimetres. */
(()=>{
'use strict';
const wrap=$('#canvas-wrap'),hud=$('#studio-hud');if(!wrap||!hud)return;
const css=document.createElement('link');css.rel='stylesheet';css.href='../assets/css/designer-resize-v8.css?v=20261125-8';document.head.append(css);
const clamp8=(n,a,b)=>Math.max(a,Math.min(b,n)),num=(n,f=0)=>Number.isFinite(Number(n))?Number(n):f;
const panels=()=>Array.isArray(model.room.backsplashes)?model.room.backsplashes:(model.room.backsplashes=[]);
let splashId=null,mode=false,modeKey=null,drag=null,raf=0,latest=null,splashGroup=null;
const panelSelected=()=>model.selected||model.selectedExtra?null:panels().find(p=>p.id===splashId)||null;
const target=()=>selected()||extraSelected()||panelSelected();
const key=c=>c?.uid||c?.id||null;
const isSplash=c=>!!c&&c.kind==='ideare-wall-backsplash';
const finish=p=>v7Splash.find(f=>f.id===p.style)||v7Splash[0];
function walls(){const v=roomVertices(),a=[];for(let i=0;i<v.length;i++){
 if((['open','u_open'].includes(model.room.shape)&&i===2)||(model.room.shape==='l_open'&&i===3))continue;
 const p=v[i],q=v[(i+1)%v.length],len=Math.hypot(q.x-p.x,q.z-p.z);if(len<1)continue;
 const tx=(q.x-p.x)/len,tz=(q.z-p.z)/len,mx=(p.x+q.x)/2,mz=(p.z+q.z)/2;
 const sign=pointInsidePolygon(mx-tz*10,mz+tx*10,v)?1:-1;
 a.push({index:i,x:p.x,z:p.z,len,tx,tz,nx:-tz*sign,nz:tx*sign});
 }return a;}
const wall=p=>walls().find(w=>w.index===p.wallIndex);
const wallPoint=(w,u,y,offset=43)=>new THREE.Vector3((w.x+w.tx*u+w.nx*offset)/1000,y/1000,(w.z+w.tz*u+w.nz*offset)/1000);
function panelValid(p){const w=wall(p);if(!w||![p.offset,p.bottom,p.width,p.height].every(Number.isFinite)||p.width<50||p.height<50||p.offset<-.01||p.bottom<-.01||p.offset+p.width>w.len+.01||p.bottom+p.height>model.room.height+.01)return false;
 const overlap=(a,b,c,d)=>Math.min(b,d)-Math.max(a,c)>.01;
 if(panels().some(o=>o.id!==p.id&&o.wallIndex===p.wallIndex&&overlap(p.offset,p.offset+p.width,o.offset,o.offset+o.width)&&overlap(p.bottom,p.bottom+p.height,o.bottom,o.bottom+o.height)))return false;
 return !model.features.some(f=>Number(f.wallIndex)===p.wallIndex&&['door','window'].includes(f.type)&&overlap(p.offset,p.offset+p.width,num(f.offset,.5)*w.len-num(f.width)/2,num(f.offset,.5)*w.len+num(f.width)/2)&&overlap(p.bottom,p.bottom+p.height,num(f.y),num(f.y)+num(f.height)));
}
function initialPanel(w,style,prefer=null){const width=Math.min(1000,w.len),height=Math.min(450,model.room.height),bottom=Math.min(900,model.room.height-height),center=clamp8(prefer??w.len/2,width/2,w.len-width/2);const p={id:uuid(),kind:'ideare-wall-backsplash',wallIndex:w.index,style,width,height,bottom,offset:center-width/2};
 if(panelValid(p))return p;
 const spots=[];for(let u=0;u<=w.len-width;u+=100)spots.push(u);spots.push(w.len-width);spots.sort((a,b)=>Math.abs(a-p.offset)-Math.abs(b-p.offset));const heights=[bottom];for(let y=0;y<=model.room.height-height;y+=100)heights.push(y);heights.push(model.room.height-height);heights.sort((a,b)=>Math.abs(a-bottom)-Math.abs(b-bottom));for(const y of heights)for(const u of spots){const q={...p,offset:u,bottom:y};if(panelValid(q))return q;}return null;}
// Legacy v7 finishes become independent panels when their cabinet back is on a wall.
function migrate(){for(const c of model.cabinets){if(!c.backsplash||!v7Base(c))continue;const a=(num(c.rotation))*Math.PI/180,bx=c.x+Math.sin(a)*c.depth/2,bz=c.z-Math.cos(a)*c.depth/2;
 const w=walls().map(w=>({...w,dist:Math.abs((bx-w.x)*w.nx+(bz-w.z)*w.nz)})).sort((a,b)=>a.dist-b.dist)[0];if(!w)continue;
 const u=(bx-w.x)*w.tx+(bz-w.z)*w.tz,width=Math.min(c.width,w.len),bottom=c.height+28,height=Math.min(450,model.room.height-bottom,1350-bottom>50?1350-bottom:450);
 const p={id:uuid(),kind:'ideare-wall-backsplash',wallIndex:w.index,style:c.backsplashStyle||v7Splash[0].id,width,height,bottom,offset:clamp8(u-width/2,0,w.len-width)};
 const next=panelValid(p)?p:initialPanel(w,p.style,u);if(next){panels().push(next);c.backsplash=false;delete c.backsplashStyle;}
 }}
function meshPanel(p){const w=wall(p);if(!w||p.width<1||p.height<1)return null;
 const g=new THREE.Group();g.userData.splashId=p.id;g.position.copy(wallPoint(w,p.offset+p.width/2,p.bottom+p.height/2,43));g.rotation.y=-Math.atan2(w.tz,w.tx);
 const mesh=addBox(g,p.width/1000,p.height/1000,.008,0,0,0,v7SplashMaterial(finish(p)),'wall_backsplash');mesh.castShadow=false;
 const uv=mesh.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*p.width/500,uv.getY(i)*p.height/500);uv.needsUpdate=true;return g;}
const oldDraw=drawScene;drawScene=()=>{oldDraw();if(!scene||!renderer||!worldGroup)return;splashGroup=new THREE.Group();splashGroup.name='ideare_wall_backsplashes';worldGroup.add(splashGroup);for(const p of panels()){const w=wall(p);if(!w||p.offset<0||p.offset+p.width>w.len+.01||p.bottom<0||p.bottom+p.height>model.room.height+.01)continue;try{const g=meshPanel(p);if(g)splashGroup.add(g);}catch(e){console.error('IDEARE backsplash',e);}}};
const oldSelect=select,oldSelectExtra=selectExtra;select=id=>{splashId=null;oldSelect(id);};selectExtra=id=>{splashId=null;oldSelectExtra(id);};
const oldHistory=applyHistory;applyHistory=s=>{splashId=null;mode=false;modeKey=null;oldHistory(s);};
function selectPanel(p){model.selected=null;model.selectedExtra=null;model.doorsOpen=false;splashId=p.id;mode=false;modeKey=null;renderInspector();renderList();drawScene();}
function dialog(opts){if(window.IdeaREAlert?.fire)return window.IdeaREAlert.fire(opts);if(window.Swal?.fire)return window.Swal.fire({buttonsStyling:false,reverseButtons:true,heightAuto:false,focusCancel:false,showClass:{popup:'ideare-swal-in'},hideClass:{popup:'ideare-swal-out'},...opts,customClass:{popup:'ideare-swal ideare-swal-info ideare-swal-dialog v8-wall-dialog',title:'ideare-swal-title',htmlContainer:'ideare-swal-text',actions:'ideare-swal-actions',confirmButton:'ideare-swal-confirm',cancelButton:'ideare-swal-cancel',icon:'ideare-swal-icon',input:'v8-wall-select'}});notify('The styled dialog is unavailable. Refresh the designer and try again.',true);return Promise.resolve({isConfirmed:false});}
$('#catalog-menu')?.addEventListener('click',async e=>{const b=e.target.closest('[data-v7-splash]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const style=b.dataset.v7Splash;if(!v7Splash.some(f=>f.id===style))return;closeMenu();const ws=walls();if(!ws.length){notify('There is no solid wall in this room.',true);return;}
 const vertices=roomVertices(),w0=model.room.width,d0=model.room.depth,sc=180/Math.max(w0,d0),pts=vertices.map(v=>`${15+v.x*sc},${15+v.z*sc}`).join(' ');
 const svg=`<svg viewBox="0 0 ${w0*sc+30} ${d0*sc+30}" style="width:100%;max-height:185px" aria-label="Room wall numbers"><polygon points="${pts}" fill="#c6ad8a" fill-opacity=".18" stroke="#a3927b"/>${ws.map(w=>`<line x1="${15+w.x*sc}" y1="${15+w.z*sc}" x2="${15+(w.x+w.tx*w.len)*sc}" y2="${15+(w.z+w.tz*w.len)*sc}" stroke="#b3905c" stroke-width="3"/><text x="${15+(w.x+w.tx*w.len/2+w.nx*100)*sc}" y="${15+(w.z+w.tz*w.len/2+w.nz*100)*sc}" fill="currentColor" font-size="10" text-anchor="middle" dominant-baseline="middle">${w.index+1}</text>`).join('')}</svg>`;
 const result=await dialog({title:'Choose a wall',html:svg+'<p>Place this backsplash on one of the numbered walls.</p>',input:'select',inputOptions:Object.fromEntries(ws.map(w=>[String(w.index),`Wall ${w.index+1} · ${Math.round(w.len)} mm`])),inputPlaceholder:'Select a wall',showCancelButton:true,confirmButtonText:'Add backsplash',inputValidator:v=>v===''?'Choose a wall first.':undefined});
 if(!result.isConfirmed)return;const w=walls().find(w=>w.index===Number(result.value));if(!w)return;const p=initialPanel(w,style);if(!p){notify('No clear 1000 × 450 mm area on that wall. Try another wall or move existing panels.',true);return;}history();panels().push(p);selectPanel(p);mode=true;modeKey=p.id;changed(false);notify('Backsplash added. Drag its edges to resize.');},true);
// List and floating panel controls; no changes to the old cabinet/extra database model.
const tools=document.createElement('div');tools.className='v8-panel-tools';tools.hidden=true;tools.innerHTML='<strong></strong><span></span><button type="button" data-v8-panel-action="resize">Resize</button><button type="button" data-v8-panel-action="remove">Remove</button><button type="button" data-v8-panel-action="close" aria-label="Deselect backsplash">×</button>';wrap.append(tools);
tools.addEventListener('click',async e=>{const act=e.target.closest('[data-v8-panel-action]')?.dataset.v8PanelAction,p=panelSelected();if(!p)return;if(act==='resize'){toggleMode();}else if(act==='close'){splashId=null;mode=false;renderAll();}else if(act==='remove'){const r=await dialog({title:'Remove backsplash?',text:finish(p).name,showCancelButton:true,confirmButtonText:'Remove'});if(r.isConfirmed){history();model.room.backsplashes=panels().filter(x=>x.id!==p.id);splashId=null;mode=false;renderAll();changed(false);}}});
const oldList=renderList;renderList=()=>{migrate();oldList();const list=$('#cabinet-list');if(list)for(const p of panels()){const b=document.createElement('button');b.type='button';b.className=p.id===splashId?'selected':'';b.innerHTML=`<b>Backsplash · ${safe(finish(p).name)}</b><small>Wall ${p.wallIndex+1} · ${Math.round(p.width)} × ${Math.round(p.height)} mm</small>`;b.onclick=()=>selectPanel(p);list.append(b);}if(panelSelected())$('#selection-badge').textContent='Backsplash · '+finish(panelSelected()).name;};
// Raycast actual scene surfaces; cabinet or appliance in front wins the click.
function pointerDown(e){if(e.target!==canvas||e.button!==0||model.step!==3||!camera||!raycaster||!splashGroup||drag)return false;
 const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
 const hits=raycaster.intersectObjects([splashGroup,cabinetGroup,extraGroup],true);for(const h of hits){if(!h.object.isMesh||!h.object.visible)continue;let o=h.object;while(o&&!o.userData.splashId&&!o.userData.uid&&!o.userData.extraId)o=o.parent;if(!o)continue;if(!o.userData.splashId)break;
 const p=panels().find(p=>p.id===o.userData.splashId);if(!p)break;e.preventDefault();e.stopImmediatePropagation();const was=mode&&splashId===p.id;selectPanel(p);mode=was;modeKey=was?p.id:null;begin(e,p,{move:true,point:h.point,axes:['u','y']},canvas);return true;}
 return false;}
window.IDEAREV8={pointerDown,roomValid:()=>panels().every(panelValid)};
// Persistent projected selection rectangle and direct edge handles.
const resizeButton=document.createElement('button');resizeButton.type='button';resizeButton.id='ideare-resize-toggle';resizeButton.title='Resize selected object';resizeButton.setAttribute('aria-label','Resize selected object');resizeButton.textContent='⤡';hud.append(resizeButton);
const overlay=document.createElement('div');overlay.className='v8-resize-overlay';overlay.hidden=true;overlay.innerHTML='<svg aria-hidden="true"><polygon/><path/></svg><div class="v8-resize-size"></div><div class="v8-resize-toolbar"><span>Resize mode · drag the edges</span><button type="button">Done</button></div>';wrap.append(overlay);overlay.querySelector('.v8-resize-toolbar button').onclick=()=>{if(!drag){mode=false;modeKey=null;}};
const polygon=overlay.querySelector('polygon'),depthGuide=overlay.querySelector('path'),sizeLabel=overlay.querySelector('.v8-resize-size');
const specs=[['left',-1,0],['right',1,0],['top',0,1],['bottom',0,-1],['top-left',-1,1],['top-right',1,1],['bottom-left',-1,-1],['bottom-right',1,-1],['depth-front',0,0],['depth-back',0,0]];
const handles=specs.map(([id,x,y])=>{const b=document.createElement('button');b.type='button';b.className='v8-grip';b.dataset.edge=id;b.title=id.startsWith('depth')?'Drag to adjust depth':`Drag ${id.replace('-',' ')} edge`;b.setAttribute('aria-label',b.title);overlay.append(b);const h={id,x,y,b,info:null};b.addEventListener('pointerdown',e=>{const c=target();if(c&&h.info)begin(e,c,h.info,b);});return h;});
function toggleMode(){const c=target();if(!c||drag)return;mode=!(mode&&modeKey===key(c));modeKey=mode?key(c):null;}
resizeButton.onclick=toggleMode;
const inspector=$('#selected-inspector');const row=inspector?.querySelector('.id3-object-actions');if(row){const b=document.createElement('button');b.type='button';b.id='v8-inspector-resize';b.textContent='⤡ Resize';b.onclick=toggleMode;row.insertBefore(b,$('#rotate'));}
function frame(c){if(isSplash(c)){const w=wall(c);if(!w)return null;return{width:c.width,height:c.height,depth:0,front:0,point:(u,y)=>wallPoint(w,c.offset+c.width/2+u,c.bottom+y,48),axis:{u:new THREE.Vector3(w.tx,0,w.tz),y:new THREE.Vector3(0,1,0)},wall:true};}
 const a=num(c.rotation)*Math.PI/180,co=Math.cos(a),si=Math.sin(a),g=c.uid?meshById.get(c.uid):extraGroup?.children.find(o=>o.userData.extraId===c.id);if(!g)return null;
 const wallCab=c.category==='wall-cabinets',mountedExtra=!c.uid&&['wall-shelf','rack','organiser','rail','lighting','safety','hood','wall-table'].includes(window.IDEAREDesignerCatalogV3?.findProfile(c)?.shape);let bottom=wallCab?1350:0;
 if(mountedExtra){const outline=g.getObjectByName('ideare_extra_outline');bottom=Math.max(0,num(outline?.position.y)*1000-c.height/2);}
 const ax=new THREE.Vector3(co,0,si),az=new THREE.Vector3(-si,0,co),front=wallCab||mountedExtra||((camera.position.x-c.x/1000)*az.x+(camera.position.z-c.z/1000)*az.z)>=0?1:-1;
 return{width:c.width,height:c.height,depth:c.depth,front,wall:wallCab||mountedExtra,axis:{u:ax,y:new THREE.Vector3(0,1,0),z:az},point:(u,y,z)=>new THREE.Vector3((c.x+u*co-z*si)/1000,(bottom+y)/1000,(c.z+u*si+z*co)/1000)};}
function project(p){const r=wrap.getBoundingClientRect(),v=p.clone().project(camera);return{x:(v.x+1)*r.width/2,y:(1-v.y)*r.height/2,visible:v.z>=-1&&v.z<=1};}
function place(h,info){h.info=info;h.b.hidden=!info;if(!info)return;const p=project(info.point);h.b.hidden=!p.visible;h.b.style.left=p.x+'px';h.b.style.top=p.y+'px';}
function tick(){requestAnimationFrame(tick);const c=target(),p=panelSelected(),wallCab=selected()?.category==='wall-cabinets';for(const id of ['rotate','object-rotate']){const b=$('#'+id);if(b)b.classList.toggle('v8-no-rotate',wallCab);}resizeButton.hidden=!c||isSplash(c);if(!drag&&modeKey!==key(c))mode=false;const active=!!(c&&camera&&model.step===3&&mode);resizeButton.setAttribute('aria-pressed',String(active));tools.hidden=!(p&&model.step===3);if(p){const content=[['strong',finish(p).name],['span',`Wall ${p.wallIndex+1} · ${Math.round(p.width)} × ${Math.round(p.height)} mm`],['[data-v8-panel-action="resize"]',active?'Done':'Resize']];for(const [sel,value] of content){const node=tools.querySelector(sel);if(node.textContent!==value)node.textContent=value;}}
 overlay.hidden=!active;wrap.classList.toggle('v8-resize-mode',active&&!isSplash(c));if(!active)return;const f=frame(c);if(!f){overlay.hidden=true;return;}const z=f.front*f.depth/2,pts=[[-f.width/2,0],[f.width/2,0],[f.width/2,f.height],[-f.width/2,f.height]].map(([u,y])=>project(f.point(u,y,z)));polygon.setAttribute('points',pts.map(p=>`${p.x},${p.y}`).join(' '));
 for(const h of handles){if(h.id.startsWith('depth')){const sign=h.id==='depth-front'?1:-1;if(!f.depth||f.wall&&sign<0){place(h,null);continue;}place(h,{point:f.point(f.width*.23,f.height,sign*f.depth/2),axes:['z'],sz:sign});continue;}if(h.y<0&&!isSplash(c)){place(h,null);continue;}place(h,{point:f.point(h.x*f.width/2,(h.y+1)*f.height/2,z),axes:[...(h.x?['u']:[]),...(h.y?['y']:[])],sx:h.x,sy:h.y});}
 if(f.depth){const a=project(f.point(f.width*.23,f.height,-f.depth/2)),b=project(f.point(f.width*.23,f.height,f.depth/2));depthGuide.setAttribute('d',`M${a.x},${a.y}L${b.x},${b.y}`);}else depthGuide.setAttribute('d','');
 const top=pts.reduce((a,b)=>a.y<b.y?a:b);sizeLabel.style.left=(pts.reduce((a,b)=>a+b.x,0)/4)+'px';sizeLabel.style.top=(top.y-20)+'px';const label=`W ${Math.round(c.width)} × H ${Math.round(c.height)}${isSplash(c)?'':' × D '+Math.round(c.depth)} mm`;if(sizeLabel.textContent!==label)sizeLabel.textContent=label;}
requestAnimationFrame(tick);
// Screen-space axis solve: stable even with oblique perspective. One axis for
// edge grips, two for corners. A nearly edge-on view disables the ambiguous axis.
function solve(v,dx,dy){if(v.length===1){const a=v[0],d=a.x*a.x+a.y*a.y;return[d>.000004?(a.x*dx+a.y*dy)/d:0];}const [a,b]=v,det=a.x*b.y-a.y*b.x,aa=Math.hypot(a.x,a.y),bb=Math.hypot(b.x,b.y);if(Math.abs(det)<aa*bb*.12||aa<.002||bb<.002)return aa>=bb?[solve([a],dx,dy)[0],0]:[0,solve([b],dx,dy)[0]];return[(dx*b.y-dy*b.x)/det,(a.x*dy-a.y*dx)/det];}
function begin(e,c,info,el){if(e.button!==0||drag)return;const f=frame(c);if(!f)return;e.preventDefault();e.stopImmediatePropagation();camera.updateMatrixWorld();const origin=project(info.point),vectors=info.axes.map(k=>{const p=project(info.point.clone().addScaledVector(f.axis[k],.1));return{x:(p.x-origin.x)/100,y:(p.y-origin.y)/100};});if(vectors.every(v=>Math.hypot(v.x,v.y)<.002))return;
 drag={id:e.pointerId,el,key:key(c),base:deep(c),info,f,vectors,x:e.clientX,y:e.clientY,recorded:false,oldControls:controls?.enabled,shared:deep(model.shared)};if(controls)controls.enabled=false;try{el.setPointerCapture(e.pointerId);}catch(_){}wrap.classList.add('v8-resizing');}
function nearest(v,targets){let best=Math.round(v/10)*10,dist=36;for(const t of targets){const d=Math.abs(t-v);if(d<dist){best=t;dist=d;}}return best;}
function panelCandidate(b,d,info){const w=wall(b);if(!w)return b;let l=b.offset,r=l+b.width,bot=b.bottom,top=bot+b.height;const xs=[0,w.len],ys=[0,model.room.height,900,1350];for(const p of panels())if(p.id!==b.id&&p.wallIndex===b.wallIndex){xs.push(p.offset,p.offset+p.width);ys.push(p.bottom,p.bottom+p.height);}
 if(info.move){l=clamp8(nearest(l+d.u,xs),0,w.len-b.width);bot=clamp8(nearest(bot+d.y,ys),0,model.room.height-b.height);r=l+b.width;top=bot+b.height;}
 else{if(info.sx<0)l=clamp8(nearest(l+d.u,xs),0,r-50);if(info.sx>0)r=clamp8(nearest(r+d.u,xs),l+50,w.len);if(info.sy<0)bot=clamp8(nearest(bot+d.y,ys),0,top-50);if(info.sy>0)top=clamp8(nearest(top+d.y,ys),bot+50,model.room.height);}
 return {...b,offset:l,bottom:bot,width:r-l,height:top-bot};}
function cabCandidate(b,d,info,f){const q={...b},a=num(b.rotation)*Math.PI/180,co=Math.cos(a),si=Math.sin(a);const t=b.uid?template(b.templateId):null;
 const limits=k=>[Math.max(b.uid?100:k==='height'?30:50,Math.min(num(t?.['min_'+k],0)||0,b[k])),Math.max(num(t?.['max_'+k],10000)||10000,b[k])];
 const edges=(axis)=>{const values=[];const pr=(x,z)=>axis==='u'?x*co+z*si:-x*si+z*co;for(const p of roomVertices())values.push(pr(p.x,p.z));for(const o of [...model.cabinets,...model.extras]){if(key(o)===key(b))continue;for(const [x,z] of v6World(o,v6Local(o)))values.push(pr(x,z));}return values;};
 let du=0,dz=0;if(info.sx){const s=info.sx,origin=b.x*co+b.z*si+s*b.width/2,delta=nearest(origin+d.u,edges('u'))-origin;const [lo,hi]=limits('width');q.width=clamp8(b.width+s*delta,lo,hi);du=s*(q.width-b.width)/2;}
 if(info.sz){const s=info.sz,origin=-b.x*si+b.z*co+s*b.depth/2,delta=nearest(origin+d.z,edges('z'))-origin;const [lo,hi]=limits('depth');q.depth=clamp8(b.depth+s*delta,lo,hi);dz=s*(q.depth-b.depth)/2;}
 if(info.sy>0){const [lo,hi]=limits('height');const base=b.category==='wall-cabinets'?1350:0,targets=[model.room.height-base];for(const o of model.cabinets)if(o.uid!==b.uid)targets.push((o.category==='wall-cabinets'?1350:0)+o.height-base);q.height=clamp8(nearest(b.height+d.y,targets),lo,Math.min(hi,Math.max(lo,model.room.height-base)));if(q.height!==b.height)q.shelfPositions=[];}
 q.x=b.x+du*co-dz*si;q.z=b.z+du*si+dz*co;return q;}
function repaint(c){if(isSplash(c)){const old=splashGroup?.children.find(o=>o.userData.splashId===c.id);const next=meshPanel(c);if(old&&next){splashGroup.remove(old);disposeGroup(old);splashGroup.add(next);}return;}const old=c.uid?meshById.get(c.uid):extraGroup.children.find(o=>o.userData.extraId===c.id),group=c.uid?cabinetGroup:extraGroup;if(!old)return;const next=c.uid?makeCabinet(c):window.IDEAREDesignerCatalogV3.realizeItem(c);group.remove(old);group.add(next);if(c.uid)meshById.set(c.uid,next);disposeGroup(old);}
function update(e){const m=drag;if(!m)return;const c=target();if(!c||key(c)!==m.key)return;const dx=e.clientX-m.x,dy=e.clientY-m.y;if(!m.recorded&&Math.hypot(dx,dy)<3)return;const vals=solve(m.vectors,dx,dy),d={u:0,y:0,z:0};m.info.axes.forEach((k,i)=>d[k]=vals[i]);const q=isSplash(c)?panelCandidate(m.base,d,m.info):cabCandidate(m.base,d,m.info,m.f);const valid=isSplash(c)?panelValid(q):window.IDEAREPlacementV4?.valid(q);overlay.classList.toggle('v8-blocked',!valid);if(!valid)return;
 const props=isSplash(c)?['offset','bottom','width','height']:['x','z','width','height','depth'];if(props.every(k=>Math.abs(c[k]-q[k])<.001))return;const previous={...c};if(!m.recorded){history();m.recorded=true;if(c.uid){model.shared=model.shared.filter(s=>!s.cabinetUids?.includes(c.uid));drawScene();}}
 try{Object.assign(c,q);repaint(c);}catch(err){Object.assign(c,previous);console.error('IDEARE resize',err);overlay.classList.add('v8-blocked');}}
function finishDrag(e,cancel=false){const m=drag;if(!m||e&&e.pointerId!==m.id)return;if(raf){cancelAnimationFrame(raf);raf=0;}if(!cancel&&e)update(e);drag=null;try{m.el.releasePointerCapture(m.id);}catch(_){}if(controls)controls.enabled=m.oldControls;wrap.classList.remove('v8-resizing');overlay.classList.remove('v8-blocked');if(m.recorded){if(cancel){const prev=undo.pop();if(prev)applyHistory(prev);refreshUndo();}else renderAll();changed(false);}}
window.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopImmediatePropagation();latest={clientX:e.clientX,clientY:e.clientY};if(!raf)raf=requestAnimationFrame(()=>{raf=0;update(latest);});},true);
window.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id){e.stopImmediatePropagation();finishDrag(e);}},true);
window.addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.id){e.stopImmediatePropagation();finishDrag(e,true);}},true);
window.addEventListener('blur',()=>{if(drag)finishDrag(null,true);});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(drag||mode)){e.preventDefault();e.stopImmediatePropagation();if(drag)finishDrag(null,true);mode=false;modeKey=null;}},true);
// Also expose the pure geometry math for local regression tests.
window.IDEAREV8.test={solve,panelCandidate,panelValid,cabCandidate,walls};
})();
