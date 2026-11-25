/* IDEARE designer enhancements. Executed after designer-studio.js, before boot().
 * Shares the existing module's parametric model and renderer, not a second engine. */
(() => {
'use strict';
const root=document.querySelector('#id3-app');
if(!root)return;
const V='ideare_designer_environment_v2';
const palette={
  floors:[
    ['oak','SPC natural oak','#c8ab83','spc'],['walnut','SPC smoked walnut','#80644d','spc'],
    ['ash','SPC pale ash','#e2d5c2','spc'],['marble','Calacatta marble','#e8e7e2','solid'],
    ['terrazzo','Warm terrazzo','#cdc6b6','solid'],['concrete','Polished concrete','#b3b3ae','solid'],
    ['slate','Slate tile','#5e6063','solid'],['sand','Sandstone','#c4b19a','solid'],
    ['ivory','Ivory porcelain','#f2eee6','solid'],['charcoal','Charcoal tile','#494b4d','solid']
  ],
  walls:[
    ['warm-white','Warm white','#f2eee6'],['ivory','Ivory','#e8e0d2'],
    ['linen','Linen','#d8cebc'],['greige','Greige','#bcb2a5'],
    ['sage','Sage','#a6afa0'],['olive','Olive','#8c937e'],
    ['dusty-blue','Dusty blue','#9baeb7'],['clay','Soft clay','#c7a493'],
    ['taupe','Taupe','#a89988'],['charcoal','Charcoal','#515356'],
    ['navy','Midnight blue','#465463'],['terracotta','Terracotta','#b87a62']
  ]
};
let environment={floor:'oak',wall:'warm-white',preview:'light'};
try{environment={...environment,...JSON.parse(localStorage.getItem(V)||'{}')};}catch(_){}
const saveEnvironment=()=>{try{localStorage.setItem(V,JSON.stringify(environment));}catch(_){}};
const style=document.createElement('link');style.rel='stylesheet';style.href='../assets/css/designer-interactions-v2.css?v=20261123';document.head.append(style);
const esc=str=>String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const optionTiles=(items,kind)=>items.map(([key,name,color])=>`<button type="button" class="ideare-swatch ${environment[kind]===key?'is-selected':''}" data-ideare-${kind}="${key}" aria-label="${esc(name)}" aria-pressed="${environment[kind]===key}"><i style="--swatch:${color}"></i><span>${esc(name)}</span></button>`).join('');
const roomTools=document.querySelector('.studio-room-tools');
if(roomTools){const group=document.createElement('div');group.className='ideare-environment';group.innerHTML=`<details class="ideare-room-palette" open><summary>Floor finish</summary><div class="ideare-swatch-grid" id="ideare-floor-options">${optionTiles(palette.floors,'floor')}</div></details><details class="ideare-room-palette" open><summary>Wall colour</summary><div class="ideare-swatch-grid" id="ideare-wall-options">${optionTiles(palette.walls,'wall')}</div></details><p class="id3-note">Room finishes are a visual preview, not an installation specification.</p>`;roomTools.insertBefore(group,roomTools.querySelector('.id3-note'));group.addEventListener('click',e=>{const btn=e.target.closest('button[data-ideare-floor],button[data-ideare-wall]');if(!btn)return;const kind=btn.dataset.ideareFloor?'floor':'wall';environment[kind]=btn.dataset.ideareFloor||btn.dataset.ideareWall;saveEnvironment();group.querySelectorAll(`[data-ideare-${kind}]`).forEach(b=>{const chosen=b===btn;b.classList.toggle('is-selected',chosen);b.setAttribute('aria-pressed',String(chosen));});drawScene();});}
// Organise the catalog into the same recognizable navigation as the references.
const catalogBar=document.querySelector('#catalog-bar');
if(catalogBar){
 const symbols=['▤','▣','♧','▥','◈'];
 const labels=['Cabinets','Appliances','Dining','Kitchen extras','Materials'];
 catalogBar.querySelectorAll(':scope > button[data-menu]').forEach((btn,i)=>{btn.innerHTML=`<span class="ideare-catalog-icon" aria-hidden="true">${symbols[i]}</span><span>${labels[i]}</span>`;btn.setAttribute('title',labels[i]);});
 catalogBar.classList.add('ideare-icon-catalog');
 const menuData={
  2:[['Integrated in cabinet',['Fridge & freezer','Hob','Oven','Hob & oven','Microwave oven','Combi oven','Oven & microwave oven','Dishwasher','Extractor hood']],['Freestanding',['Fridge & freezer','Hob','Extractor hood','Microwave oven']]],
  3:[['Tables',['2 seat table','4 seat table','6 seat table','8 seat table','Wall mounted table']],['Dining chairs',['Upholstered chair','Non-upholstered chair','Foldable chair','Stackable chair']],['Bar furniture',['Bar table','Bar stool','Foldable bar stool']],['Stools & benches',['Stool','Bench','Step stool']]],
  4:[['Kitchen extras',['Trolley','Kitchen island','Wall shelves','Kitchen accessories','Waste sorting']],['Wall organisers',['Wall storage rack','Utensil rail','Wall organiser']],['Complementary items',['Kitchen lighting','Interior organiser','Child safety fitting']]]
 };
 const oldOpenMenu=openMenu;
 openMenu=(menu,hover=false)=>{oldOpenMenu(menu,hover);if(!menuData[menu])return;const panel=document.querySelector('#catalog-menu');if(panel.hidden)return;
  panel.innerHTML=`<div class="id3-megagrid ideare-megagrid">${menuData[menu].map(([heading,items])=>`<div><h4>${esc(heading)}</h4>${items.map(it=>`<button type="button" data-ideare-extra="${esc(it)}">${esc(it)}</button>`).join('')}</div>`).join('')}</div>`;
 };
 document.querySelector('#catalog-menu')?.addEventListener('click',e=>{const el=e.target.closest('[data-ideare-extra]');if(!el)return;addExtra(el.dataset.ideareExtra);closeMenu();});
 const searchButton=document.createElement('button');searchButton.type='button';searchButton.className='ideare-menu-extra';searchButton.innerHTML='<span class="ideare-catalog-icon">⌕</span><span>Search</span>';searchButton.title='Search cabinets';
 searchButton.onclick=async()=>{let keyword='';if(window.Swal?.fire){const result=await window.Swal.fire({title:'Find a cabinet',input:'text',inputPlaceholder:'Search by name or cabinet type',showCancelButton:true,confirmButtonText:'Search',customClass:{popup:'ideare-swal-popup',confirmButton:'ideare-swal-confirm',cancelButton:'ideare-swal-cancel'},buttonsStyling:false});if(!result.isConfirmed)return;keyword=String(result.value||'');}else keyword=window.prompt('Search cabinets','')||'';if(!keyword)return;closeMenu();openMenu(1);const buttons=[...document.querySelectorAll('#catalog-menu [data-template]')];let found=0;buttons.forEach(b=>{const match=b.textContent.toLowerCase().includes(keyword.toLowerCase());b.hidden=!match;if(match)found++;});if(!found)notify('No cabinet matches your search. Try another keyword.');};
 const photo=document.createElement('button');photo.type='button';photo.className='ideare-menu-extra';photo.innerHTML='<span class="ideare-catalog-icon">▣</span><span>Photo studio</span>';photo.title='Save a snapshot of your room design';photo.onclick=()=>{if(!renderer||!scene||!camera){notify('Open the 3D designer to capture a photo.');return;}try{renderer.render(scene,camera);const a=document.createElement('a');a.download='IDEARE-cabinet-design.png';a.href=renderer.domElement.toDataURL('image/png');a.click();}catch(err){notify('Could not capture this view.');}};
 catalogBar.insertBefore(searchButton,document.querySelector('#catalog-menu'));catalogBar.insertBefore(photo,document.querySelector('#catalog-menu'));
}

const canvasWrap=document.querySelector('#canvas-wrap');
if(canvasWrap){const themeButton=document.createElement('button');themeButton.type='button';themeButton.id='ideare-preview-theme';themeButton.className='ideare-preview-theme';themeButton.setAttribute('aria-label','Toggle preview light and dark theme');canvasWrap.append(themeButton);const sync=()=>{canvasWrap.dataset.previewTheme=environment.preview;themeButton.textContent=environment.preview==='light'?'☾ Dark preview':'☀ Light preview';if(scene)scene.background=new THREE.Color(environment.preview==='light'?'#eceae5':'#22252a');};themeButton.addEventListener('click',()=>{environment.preview=environment.preview==='light'?'dark':'light';saveEnvironment();sync();});sync();}
// Shared room textures are generated once per finish choice and reused through redraws.
const textures=new Map();
function roomTexture(key){if(textures.has(key))return textures.get(key);const entry=palette.floors.find(x=>x[0]===key)||palette.floors[0];const [, ,color,type]=entry,c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,512,512);let seed=11;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 // Only SPC flooring receives visible panel seams and subtle wood grain.
 // All other finishes are completely plain, even when the optional measurement grid is on.
 if(type==='spc'){
  const panels=6, panelW=512/panels;
  for(let i=0;i<panels;i++){
   const x=i*panelW;
   g.fillStyle=i%2?'#ffffff0a':'#00000008';g.fillRect(x,0,panelW,512);
   g.strokeStyle='#392b1b32';g.lineWidth=1.2;g.beginPath();g.moveTo(x,0);g.lineTo(x,512);g.stroke();
   for(let j=0;j<8;j++){
    const y=j*64+(i%2)*32;
    g.strokeStyle='#30201518';g.beginPath();g.moveTo(x,y);g.lineTo(x+panelW,y);g.stroke();
   }
   for(let j=0;j<12;j++){
    const cx=x+rand()*panelW, shift=(rand()-.5)*10;
    g.strokeStyle=j%3===0?'#ffffff21':'#3e2b191b';g.lineWidth=.6+rand()*1.2;
    g.beginPath();g.moveTo(cx,-2);g.bezierCurveTo(cx+shift,130,cx-shift,350,cx+shift,514);g.stroke();
   }
  }
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(Math.max(1,model.room.width/1100),Math.max(1,model.room.depth/1100));textures.set(key,t);return t;}
function applyEnvironment(){if(!worldGroup)return;const floor=worldGroup.children.find(o=>o.isMesh&&o.geometry?.type==='ShapeGeometry');if(floor){const texture=roomTexture(environment.floor);texture.repeat.set(Math.max(1,model.room.width/1100),Math.max(1,model.room.depth/1100));floor.material.map=texture;floor.material.color.set('#fff');floor.material.needsUpdate=true;}const wall=palette.walls.find(o=>o[0]===environment.wall)||palette.walls[0];worldGroup.traverse(o=>{if(o.name==='room_wall')o.material.color.set(wall[2]);});if(scene)scene.background=new THREE.Color(environment.preview==='light'?'#eceae5':'#22252a');}
const oldAddRoom=addRoom;addRoom=()=>{oldAddRoom();applyEnvironment();};
// New cabinetry inherits the most recently selected door, carcass and worktop
// independently (rather than accidentally reverting when adding another type).
const finishKeys=['color','material','carcass','worktopType','worktopMaterial'];
const defaults={};
function setDefaults(c){finishKeys.forEach(key=>{if(Object.hasOwn(defaults,key))c[key]=JSON.parse(JSON.stringify(defaults[key]));});}
function remember(c,key){if(!c||!finishKeys.includes(key))return;defaults[key]=JSON.parse(JSON.stringify(c[key]??null));}
const oldMakeStandard=standardCab;standardCab=t=>{const c=oldMakeStandard(t);setDefaults(c);return c;};
const oldRenderAll=renderAll;renderAll=()=>{oldRenderAll();const c=selected();if(c&&c.uid!==lastSelected){lastSelected=c.uid;}syncResizeUI();};
let lastSelected=null;
const inspector=document.querySelector('#selected-inspector');
inspector?.addEventListener('change',e=>{const k=e.target.dataset.property;if(finishKeys.includes(k))queueMicrotask(()=>remember(selected(),k));});
inspector?.addEventListener('click',e=>{if(e.target.closest('[data-finish-id]'))setTimeout(()=>remember(selected(),'material'),0);});
// Track finish selection even when the original finish library updates models itself.
const oldDrawScene=drawScene;drawScene=()=>{oldDrawScene();applyEnvironment();const c=selected();if(c&&model.cabinets.includes(c))finishKeys.forEach(k=>{if(defaults[k]===undefined)remember(c,k);});};
// Drawer fronts, open-top boxes and handles are mounted on a single sliding rail.
// This prevents the original independent meshes from diverging when opened.
const oldMakeCabinet=makeCabinet;
makeCabinet=c=>{const group=oldMakeCabinet(c);if(c.front!=='drawers')return group;
 const fronts=group.children.filter(x=>x.name==='drawer_front').sort((a,b)=>a.position.y-b.position.y);
 const boxes=group.children.filter(x=>x.name==='drawer_box').sort((a,b)=>a.position.y-b.position.y);
 const handles=group.children.filter(x=>x.name==='drawer_handle_premium'||x.name==='drawer_handle').sort((a,b)=>a.position.y-b.position.y);
 fronts.forEach((front,i)=>{const source=boxes[i];if(!source)return;const y=front.position.y,depth=Math.max(.08,Math.min(c.depth/1000-.055,source.geometry.parameters.depth));const width=Math.max(.05,source.geometry.parameters.width),height=Math.min(source.geometry.parameters.height,front.geometry.parameters.height*.78);
 const rail=new THREE.Group();rail.name='ideare_drawer_rail';rail.position.set(0,y,0);const opened=model.selected===c.uid&&model.doorsOpen;
 const travel=opened?Math.min(.42,c.depth/1000*.68):0;rail.position.z=travel;
 const panelMaterial=source.material,thick=.012,bodyZ=c.depth/2000-depth/2-.035;
 const part=(w,h,d,x,yy,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),panelMaterial);m.position.set(x,yy,z);m.castShadow=true;m.receiveShadow=true;rail.add(m);};
 part(width,thick,depth,0,-height/2+thick/2,bodyZ);
 part(thick,height,depth,-width/2+thick/2,0,bodyZ);
 part(thick,height,depth,width/2-thick/2,0,bodyZ);
 part(width-2*thick,height,thick,0,0,bodyZ-depth/2+thick/2);
 // Front already includes applied colour / texture and is reparented unchanged.
 group.remove(front);front.position.y=0;front.position.z-=travel;rail.add(front);
 for(const handle of handles.filter(x=>Math.abs(x.position.y-y)<.025)){group.remove(handle);handle.position.y-=y;handle.position.z-=travel;rail.add(handle);}
 group.remove(source);source.geometry.dispose();rail.userData.uid=c.uid;group.add(rail);
 });return group;};
// Override the previous door animation for drawers; animate the rail as a unit.
const redraw=drawScene;
let animateRail=false,railRaf=0;
document.querySelector('#open-doors')?.addEventListener('click',()=>{animateRail=selected()?.front==='drawers';},true);
drawScene=()=>{if(railRaf)cancelAnimationFrame(railRaf);redraw();if(!animateRail)return;animateRail=false;const c=selected(),g=c&&meshById.get(c.uid);if(!g)return;const rails=g.children.filter(o=>o.name==='ideare_drawer_rail');const start=performance.now();const total=Math.min(.42,c.depth/1000*.68);const target=model.doorsOpen?total:0;for(const rail of rails)rail.position.z=total-target;const tick=now=>{const u=Math.min(1,(now-start)/320),ease=1-(1-u)**3;rails.forEach(o=>o.position.z=(total-target)+(target-(total-target))*ease);if(u<1)railRaf=requestAnimationFrame(tick);else railRaf=0;};railRaf=requestAnimationFrame(tick);};
// Resize is a viewport action; preserve the anchored left/back edge and snap
// the resized right/front sides to adjacent geometry and the room boundary.
const hud=document.querySelector('#studio-hud');const moveBtn=document.querySelector('#object-move');
// v8 owns the persistent edge resize overlay. Keep this hook for the earlier render wrapper.
function syncResizeUI(){}
function hideShared(flag){worldGroup?.children.forEach(o=>{if(/^continuous_/.test(o.name))o.visible=!flag;});}
// While cabinets are moved using the existing handle, their shared surfaces
// must not remain floating at their previous world coordinates.
moveBtn?.addEventListener('pointerdown',()=>{hideShared(true);},false);
moveBtn?.addEventListener('pointerup',()=>{hideShared(false);},false);
moveBtn?.addEventListener('pointercancel',()=>{hideShared(false);},false);
// Use the project's SweetAlert2 theme when available for destructive actions.
// Capture before the original native confirm handlers run.
const studioConfirm=async(title,text,confirmText)=>{
 const S=window.Swal;if(!S?.fire){notify('Design confirmation is unavailable. Check the SweetAlert2 connection.',true);return false;}
 const r=await S.fire({title,text,icon:'warning',showCancelButton:true,confirmButtonText:confirmText,cancelButtonText:'Cancel',reverseButtons:true,customClass:{popup:'ideare-swal-popup',confirmButton:'ideare-swal-confirm',cancelButton:'ideare-swal-cancel'},buttonsStyling:false});return r.isConfirmed;
};
function deleteAction(id,one){const button=document.querySelector(id);button?.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const c=selected();if(one&&!c)return;if(!one&&!model.cabinets.length)return;
 const yes=await studioConfirm(one?'Remove cabinet?':'Clear your design?',one?`Remove ${c.name} from your design?`:'This will remove all cabinets from the workspace.',one?'Remove cabinet':'Clear cabinets');if(!yes)return;
 history();if(one){model.cabinets=model.cabinets.filter(o=>o.uid!==c.uid);select(null);}else{model.cabinets=[];select(null);}renderAll();changed(false);
 },true);}
deleteAction('#remove',true);deleteAction('#clear-scene',false);
// Restore confirmation runs during boot; temporarily shim native confirm for
// that single call and offer a themed restore dialog afterwards instead.
const bootBefore=boot;
boot=async function(...args){
 const isLoadedProject=new URL(location.href).searchParams.has('code')||new URL(location.href).searchParams.has('staff_design');
 const stored=isLoadedProject?null:localStorage.getItem('ideare3d_draft_v1');
 const originalConfirm=window.confirm;
 if(stored)window.confirm=()=>false;
 try{await bootBefore(...args);}finally{window.confirm=originalConfirm;}
 if(stored){const ok=await studioConfirm('Restore your saved design?','Continue where you left off in the cabinet designer.','Restore design');if(ok){try{const json=JSON.parse(stored);applyHistory(JSON.stringify(json.scene));notify('Your saved design has been restored.');}catch(err){console.warn('Unable to restore local design',err);}}}
};
syncResizeUI();
})();
