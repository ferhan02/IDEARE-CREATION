/* IDEARE CONSOLIDATED DESIGNER — v10.2
 * Source: repository snapshot 78aa856e. Keep the original extension order.
 * Three.js, OrbitControls, jsPDF and shared IDEARE alerts stay external.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
function ideareStartupError(error){
 console.error("IDEARE designer startup:",error);
 const loader=document.querySelector("#canvas-loader");
 if(loader&&!loader.hidden)loader.textContent="Unable to start designer: "+(error?.message||String(error));
}
window.addEventListener("error",event=>{if(event.error&&document.querySelector("#canvas-loader")&&!document.querySelector("#canvas-loader").hidden)ideareStartupError(event.error);});
window.addEventListener("unhandledrejection",event=>{if(document.querySelector("#canvas-loader")&&!document.querySelector("#canvas-loader").hidden)ideareStartupError(event.reason);});

/* IDEARE cabinet designer v1: true parametric WebGL scene, not production CAD. */
const $ = (s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const API=window.IDEARE_DESIGNER3D.api,ROOT=window.IDEARE_DESIGNER3D.root;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=(v,def=0)=>Number.isFinite(Number(v))?Number(v):def;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,n(v,min)));
const uuid=()=>crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const deep=v=>JSON.parse(JSON.stringify(v));
const roomShapes={rectangle:'Rectangular',notch:'Notched',angled:'Angled',open:'Open plan',l_open:'L-shaped',u_open:'U-style open'};
const model={step:1,room:{shape:'rectangle',width:4000,depth:4000,height:2700},roomType:'Wet kitchen',features:[],cabinets:[],extras:[],shared:[],selected:null,selectedExtra:null,camera:'orbit',activeMenu:0,doorsOpen:false,designCode:null,editToken:null,revision:0,contact:null};
let catalog={categories:[],templates:[],doors:[],handles:[],finishes:[]},csrf='',undo=[],redo=[],busy=false,meshById=new Map(),textureCache=new Map(),loaded=false,needsRender=false,frameHandle=null,scene,renderer,camera,controls,raycaster,ground,highlight;
const canvas=$('#designer-canvas');
const roomVertices=()=>{let {shape,width:w,depth:d}=model.room;const custom=model.room.customOutline;const expected=shape==="angled"?5:["notch","l_open"].includes(shape)?6:4;if(custom?.shape===shape&&Array.isArray(custom.points)&&custom.points.length===expected&&custom.points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=0&&p.x<=1&&p.z>=0&&p.z<=1))return custom.points.map(p=>({x:p.x*w,z:p.z*d}));switch(shape){
 case'notch':return[{x:0,z:0},{x:w*.75,z:0},{x:w*.75,z:d*.25},{x:w,z:d*.25},{x:w,z:d},{x:0,z:d}];
 case'angled':return[{x:0,z:0},{x:w*.72,z:0},{x:w,z:d*.25},{x:w,z:d},{x:0,z:d}];
 case'l_open':return[{x:0,z:0},{x:w,z:0},{x:w,z:d*.48},{x:w*.56,z:d*.48},{x:w*.56,z:d},{x:0,z:d}];
 default:return[{x:0,z:0},{x:w,z:0},{x:w,z:d},{x:0,z:d}];
}};
const mm=v=>Math.round(n(v))+' mm';
const template=id=>catalog.templates.find(t=>Number(t.id)===Number(id));
const category=t=>catalog.categories.find(c=>Number(c.id)===Number(t.category_id))?.slug||'base-cabinets';
function notify(msg,err=false){const el=$('#designer-message');el.hidden=false;el.textContent=msg;el.classList.toggle('id3-error',err);clearTimeout(notify.t);notify.t=setTimeout(()=>{el.hidden=true},7000);}
async function request(path,options={}){let r=await fetch(API+path,{credentials:'same-origin',cache:'no-store',...options});let j=await r.json().catch(()=>({ok:false,error:'Server returned an invalid response.'}));if(!r.ok||!j.ok)throw Error(j.error||`Request failed (${r.status})`);return j;}
const send=(path,obj)=>request(path,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(obj)});
function history(){undo.push(JSON.stringify(sceneData()));if(undo.length>55)undo.shift();redo.length=0;refreshUndo();}
function refreshUndo(){$('#undo').disabled=!undo.length;$('#redo').disabled=!redo.length;}
function snapshot(){return JSON.stringify(sceneData());}
function applyHistory(s){const a=JSON.parse(s);model.room=a.room;model.roomType=a.roomType;model.cabinets=a.cabinets||[];model.extras=a.extras||[];model.features=a.features||[];model.shared=a.shared||[];model.selected=null;model.selectedExtra=null;$('#room-width').value=model.room.width;$('#room-depth').value=model.room.depth;$('#room-height').value=model.room.height;$('#room-kind').value=model.roomType;$$('[data-shape]').forEach(b=>b.classList.toggle('selected',b.dataset.shape===model.room.shape));renderAll();}
$('#undo').onclick=()=>{if(!undo.length)return;redo.push(snapshot());applyHistory(undo.pop());refreshUndo()};
$('#redo').onclick=()=>{if(!redo.length)return;undo.push(snapshot());applyHistory(redo.pop());refreshUndo()};
let autoTimer=null;
function changed(record=true){if(record)history();clearTimeout(autoTimer);autoTimer=setTimeout(()=>{try{localStorage.setItem('ideare3d_draft_v1',JSON.stringify({scene:sceneData()}));$('#autosave-status').textContent='Draft backed up in this browser';}catch(e){$('#autosave-status').textContent='Local draft unavailable';}},600);}
function sceneData(){return {schemaVersion:1,room:deep(model.room),roomType:model.roomType,vertices:roomVertices(),features:deep(model.features),cabinets:deep(model.cabinets),extras:deep(model.extras),shared:deep(model.shared)};}
function showStep(i){i=clamp(i,1,4);model.step=i;$$('[data-panel]').forEach(p=>p.hidden=Number(p.dataset.panel)!==i);$$('[data-step]').forEach(b=>{const v=Number(b.dataset.step);b.classList.toggle('current',v===i);b.classList.toggle('done',v<i)});if(i===2){renderPlan();renderFeatures()}if(i===3){setTimeout(()=>{resize();drawScene();},30)}if(i===4)renderSummary();window.scrollTo({top:0,behavior:'smooth'});}
$$('[data-step]').forEach(b=>b.addEventListener('click',()=>showStep(Number(b.dataset.step))));$$('[data-next]').forEach(b=>b.addEventListener('click',()=>showStep(Number(b.dataset.next))));
$$('[data-shape]').forEach(b=>b.addEventListener('click',()=>{history();model.room.shape=b.dataset.shape;$$('[data-shape]').forEach(x=>x.classList.toggle('selected',x===b));renderPlan();drawScene();changed(false);}));
for(const [id,k] of [['room-width','width'],['room-depth','depth'],['room-height','height']]){$('#'+id).addEventListener('change',e=>{const limits=k==='height'?[1800,8000]:[1200,20000];const v=clamp(e.target.value,...limits);history();model.room[k]=v;e.target.value=v;renderPlan();drawScene();changed(false);});}
$('#room-kind').onchange=e=>{history();model.roomType=e.target.value;changed(false)};
function renderPlan(){let verts=roomVertices(),w=model.room.width,d=model.room.depth;let scale=350/Math.max(w,d),ox=70,oy=38;let pts=verts.map(v=>`${(ox+v.x*scale).toFixed(1)},${(oy+v.z*scale).toFixed(1)}`).join(' ');let featureIcons=model.features.map(f=>{let v=verts[f.wallIndex]||verts[0],q=verts[(f.wallIndex+1)%verts.length]||verts[1],pct=clamp(f.offset??.5,.05,.95),mid={x:v.x+(q.x-v.x)*pct,z:v.z+(q.z-v.z)*pct};return `<circle cx="${ox+mid.x*scale}" cy="${oy+mid.z*scale}" r="7" fill="${f.type==='door'?'#c6a076':f.type==='window'?'#90b6d2':'#8a8a86'}" stroke="#5a5045"/><text x="${ox+mid.x*scale+11}" y="${oy+mid.z*scale-7}" font-size="10" fill="currentColor">${safe(f.type)}</text>`}).join('');
 $('#plan-svg').innerHTML=`<svg viewBox="0 0 510 480" role="img" aria-label="Plan ${safe(roomShapes[model.room.shape])}, ${Math.round(w)} by ${Math.round(d)} millimetres"><rect x="3" y="3" width="504" height="474" rx="10" fill="#f6f3ee"/><polygon points="${pts}" fill="#e2cfb0" stroke="#99938b" stroke-width="9" stroke-linejoin="round"/><polygon points="${pts}" fill="none" stroke="#f5ede1" stroke-width="4"/>${featureIcons}<path d="M${ox} 18H${ox+w*scale}M${ox} 15v8M${ox+w*scale} 15v8M35 ${oy}V${oy+d*scale}M31 ${oy}h8M31 ${oy+d*scale}h8" stroke="#5d5348" stroke-width="1"/><text x="${ox+w*scale/2}" y="13" text-anchor="middle" font-size="11" fill="#4c463f">${Math.round(w)} mm</text><text x="21" y="${oy+d*scale/2}" transform="rotate(-90 21 ${oy+d*scale/2})" text-anchor="middle" font-size="11" fill="#4c463f">${Math.round(d)} mm</text><text x="${ox+w*scale/2}" y="${oy+d*scale/2}" text-anchor="middle" font-size="15" fill="#605546">${safe(model.roomType)}</text></svg>`;
 let area=0;for(let i=0;i<verts.length;i++){let a=verts[i],b=verts[(i+1)%verts.length];area+=a.x*b.z-b.x*a.z;}$('#room-area').textContent=(Math.abs(area)/2e6).toFixed(2)+' m²';$('#room-badge').textContent=`${mm(w)} × ${mm(d)}`;
}
function renderFeatures(){let walls=roomVertices().length;
 $('#feature-list').innerHTML=model.features.map((f,i)=>`<div style="display:grid;gap:6px"><b>${safe(f.type)} ${i+1}</b><label>Wall<select data-feature-wall="${i}">${Array.from({length:walls},(_,j)=>`<option value="${j}" ${Number(f.wallIndex)===j?'selected':''}>Wall ${j+1}</option>`).join('')}</select></label><label>Position on wall: ${Math.round((f.offset??.5)*100)}%<input type="range" data-feature-offset="${i}" min="10" max="90" step="5" value="${Math.round((f.offset??.5)*100)}"></label><label>Width (mm)<input type="number" min="100" max="4000" data-feature-width="${i}" value="${n(f.width,900)}"></label><button data-delete-feature="${i}" type="button" aria-label="Remove ${safe(f.type)}">Remove</button></div>`).join('');
 $$('[data-delete-feature]').forEach(b=>b.onclick=()=>{history();model.features.splice(Number(b.dataset.deleteFeature),1);renderFeatures();renderPlan();drawScene();changed(false)});
 for(const [attr,key,transform] of [['data-feature-wall','wallIndex',v=>Number(v)],['data-feature-offset','offset',v=>Number(v)/100],['data-feature-width','width',v=>clamp(v,100,4000)]]){
   $$(`[${attr}]`).forEach(el=>el.addEventListener('change',()=>{history();model.features[Number(el.getAttribute(attr))][key]=transform(el.value);renderFeatures();renderPlan();drawScene();changed(false)}));
 }
}
$$('[data-feature]').forEach(b=>b.onclick=()=>{history();let typ=b.dataset.feature;model.features.push({id:uuid(),type:typ,wallIndex:0,offset:.5,x:Math.round(model.room.width/2),y:typ==='window'?1100:typ==='door'?0:500,z:0,width:typ==='door'?900:typ==='window'?1200:150,height:typ==='door'?2100:typ==='window'?1100:100});renderFeatures();renderPlan();drawScene();changed(false)});
function standardCab(t){let cat=category(t),wall=cat==='wall-cabinets',tall=cat==='tall-cabinets',open=/open/i.test(t.name),drawer=/drawer/i.test(t.name),special=cat==='special-cabinets';return {uid:uuid(),templateId:Number(t.id),name:t.name,category:cat,width:n(t.default_width,600),height:n(t.default_height,850),depth:n(t.default_depth,600),x:model.room.width/2,z:Math.min(model.room.depth-400,400+n(t.default_depth,600)/2),rotation:0,thickness:18,partitions:0,shelves:drawer?0:2,bayShelves:[],shelfPositions:[],drawers:drawer?3:0,drawerLayout:'equal',drawerRatios:[],front:open?'open':drawer?'drawers':'doors',doorCount:/single/i.test(t.name)?1:2,hingeSide:'left',opening:'swing',doorStyle:Number(catalog.doors[0]?.id)||null,handle:Number(catalog.handles[0]?.id)||null,color:'#907053',material:null,carcass:'plywood',softClose:true,pushOpen:false,led:false,basket:false,worktop:!wall&&!tall,worktopType:'sintered',worktopMaterial:null,plinth:!wall,plinthHeight:100,backsplash:false,needsReview:true};}
function pointInsidePolygon(px,pz,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if(((a.z>pz)!==(b.z>pz))&&(px<(b.x-a.x)*(pz-a.z)/(b.z-a.z)+a.x))inside=!inside;}return inside;}
function cabinetFitsPolygon(c){const poly=roomVertices(),rad=c.rotation*Math.PI/180,ca=Math.cos(rad),sa=Math.sin(rad);for(let xx of [-c.width/2,c.width/2])for(let zz of [-c.depth/2,c.depth/2]){let x=c.x+xx*ca-zz*sa,z=c.z+xx*sa+zz*ca;if(!pointInsidePolygon(x,z,poly))return false;}return true;}
function warningsFor(c){let res=[],t=template(c.templateId);if(!t)return [{type:'error',text:'Cabinet template is unavailable.'}];for(let key of ['width','height','depth']){let low=n(t['min_'+key],0),hi=n(t['max_'+key],999999);if(c[key]<low||c[key]>hi)res.push({type:'review',text:`${key[0].toUpperCase()+key.slice(1)} ${mm(c[key])} is outside the template's suggested ${mm(low)}–${mm(hi)} band. IDEARE will review.`});}
 const wall=c.category==='wall-cabinets',tall=c.category==='tall-cabinets';
 if(c.worktop&&(wall||tall))res.push({type:'error',text:'Worktop is not normally applicable to wall/tall cabinets. Remove or ask staff for a custom solution.'});
 if(c.plinth&&wall)res.push({type:'error',text:'Wall-mounted cabinets cannot use a floor plinth.'});
 if(c.front==='drawers'&&c.shelves>0)res.push({type:'review',text:'Shelves may interfere with drawer boxes; interior clearances must be checked.'});
 if(c.front==='doors'&&c.drawers>0)res.push({type:'review',text:'Internal pull-out drawers need hinge and extension clearances.'});
 if(c.opening!=='swing')res.push({type:'review',text:'Lift/sliding hardware size and weight must be verified.'});
 if(c.pushOpen||c.basket)res.push({type:'review',text:'Push-open / pull-out hardware model and clearances require staff confirmation.'});
 if(/sink|hob|oven|microwave|fridge|extractor/i.test(c.name))res.push({type:'review',text:'Verify appliance model, service access, ventilation and cut-out dimensions.'});
 if(c.shelves>0)res.push({type:'info',text:'Shelf spans, load ratings and panel thickness will be verified by IDEARE.'});
 if(wall)res.push({type:'info',text:'Wall type and mounting design require a site check.'});
 let innerW=c.width-2*c.thickness,innerH=c.height-(c.plinth?c.plinthHeight:0)-2*c.thickness;
 if(innerW<=0||innerH<=0)res.push({type:'error',text:'Cabinet dimensions leave no internal space.'});
 if((c.shelfPositions||[]).some(v=>v<=0||v>=innerH))res.push({type:'error',text:'One or more shelves sit outside the usable internal height.'});
 if(c.x-c.width/2<0||c.z-c.depth/2<0||c.x+c.width/2>model.room.width||c.z+c.depth/2>model.room.depth)res.push({type:'review',text:'Cabinet footprint extends beyond the room bounding dimensions.'});
 if(!cabinetFitsPolygon(c))res.push({type:'review',text:'Part of the cabinet lies outside the actual room outline. Check the selected room shape and cabinet position.'});
 for(const other of model.cabinets){if(c===other)continue;const ax=c.rotation%180===0?c.width:c.depth,az=c.rotation%180===0?c.depth:c.width,bx=other.rotation%180===0?other.width:other.depth,bz=other.rotation%180===0?other.depth:other.width;const cY=c.category==='wall-cabinets'?1350:0,oY=other.category==='wall-cabinets'?1350:0;const verticalOverlap=Math.min(cY+c.height,oY+other.height)>Math.max(cY,oY)+5;if(Math.abs(c.x-other.x)<(ax+bx)/2-5&&Math.abs(c.z-other.z)<(az+bz)/2-5&&verticalOverlap){res.push({type:'error',text:'Cabinet overlaps another cabinet. Move it or adjust its size.'});break;}}
 return res;}
function allWarnings(){return model.cabinets.flatMap(c=>warningsFor(c).filter(w=>w.type!=='info').map(w=>({...w,cabinet:c.name})));}
function emitValidation(){for(const c of model.cabinets)c.needsReview=warningsFor(c).some(w=>w.type!=='info')||true;}
function addCabinet(t){history();const c=standardCab(t);let prev=model.cabinets[model.cabinets.length-1];if(prev){c.x=prev.x+prev.width/2+c.width/2;c.z=prev.z;if(c.x+c.width/2>model.room.width-20){c.x=model.room.width/2;c.z=prev.z+Math.max(c.depth,prev.depth);}}c.x=clamp(c.x,c.width/2,Math.max(c.width/2,model.room.width-c.width/2));c.z=clamp(c.z,c.depth/2,Math.max(c.depth/2,model.room.depth-c.depth/2));model.cabinets.push(c);model.selected=c.uid;model.doorsOpen=false;closeMenu();renderAll();changed(false);notify('Added '+c.name+'. Adjust its dimensions in the Modify panel.');}
const extrasLibrary={Appliances:['Refrigerator','Oven','Microwave','Dishwasher','Hob','Extractor hood'],Dining:['Dining table','Dining chair','Bar stool','Bench','Island table'],Accessories:['Soft-close hardware','Pull-out basket','LED lighting','Push-to-open','Corner organizer'],Materials:['Topmix HPL','DGTango HPL','Casero Sintered Stone','Casero Quartz']};
function addExtra(kind){history();let item={id:uuid(),kind,x:model.room.width*.53,z:model.room.depth*.53,width:kind.includes('table')?1500:600,height:kind.includes('chair')?900:kind==='Refrigerator'?1800:750,depth:kind.includes('table')?850:600};model.extras.push(item);model.selected=null;model.selectedExtra=item.id;renderAll();changed(false);notify(kind+' added as conceptual 3D placeholder. Exact product dimensions require staff review.');}
function closeMenu(){model.activeMenu=0;$('#catalog-menu').hidden=true;$$('[data-menu]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-expanded','false')});}
function openMenu(menu,hover=false){if(model.activeMenu===menu){if(!hover)closeMenu();return;}model.activeMenu=menu;$$('[data-menu]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.menu)===menu);b.setAttribute('aria-expanded',String(Number(b.dataset.menu)===menu))});let groups=[];
 if(menu===1)groups=catalog.categories.map(cat=>({title:cat.name,items:catalog.templates.filter(t=>Number(t.category_id)===Number(cat.id)).map(t=>({label:t.name,kind:'cab',id:t.id}))}));
 else if(menu===2)groups=[{title:'Appliances',items:extrasLibrary.Appliances.map(label=>({label,kind:'extra'}))}];
 else if(menu===3)groups=[{title:'Dining',items:extrasLibrary.Dining.map(label=>({label,kind:'extra'}))}];
 else if(menu===4)groups=[{title:'Cabinet fittings',items:extrasLibrary.Accessories.map(label=>({label,kind:'accessory'}))}];
 else groups=[{title:'HPL',items:extrasLibrary.Materials.slice(0,2).map(label=>({label,kind:'material'}))},{title:'Stone',items:extrasLibrary.Materials.slice(2).map(label=>({label,kind:'material'}))}];
 $('#catalog-menu').innerHTML=`<div class="id3-megagrid">${groups.map(g=>`<div><h4>${safe(g.title)}</h4>${g.items.map(it=>`<button data-kind="${it.kind}" ${it.id?`data-template="${Number(it.id)}"`:''}>${safe(it.label)}</button>`).join('')}</div>`).join('')}</div>`;$('#catalog-menu').hidden=false;
 const items=groups.flatMap(g=>g.items);$$('#catalog-menu button').forEach((btn,i)=>{const entry=items[i];btn.onclick=()=>{if(entry.kind==='cab'){const t=template(entry.id);if(t)addCabinet(t);}else if(entry.kind==='extra')addExtra(entry.label);else{let c=selected();if(!c){notify('Select a cabinet first to customize its fittings or materials.');return;}if(entry.kind==='accessory'){history();if(/LED/.test(entry.label))c.led=true;else if(/Push/.test(entry.label))c.pushOpen=true;else if(/basket|organizer/i.test(entry.label))c.basket=true;else c.softClose=true;renderAll();changed(false);}else{let src=entry.label.includes('Topmix')?'topmix':entry.label.includes('DGTango')?'dgtango':entry.label.includes('Sintered')?'casero_stone_sintered':'casero_stone_quartz';if(src==='topmix'||src==='dgtango'){ $('#material-source').value=src;$('#material-source').dispatchEvent(new Event('change'));}else{if(!c.worktop){c.worktop=true;}$('#stone-source').value=src;$('#stone-source').dispatchEvent(new Event('change'));}$$('#inspector-tabs details').forEach(d=>d.open=false);$('#inspector-tabs details:nth-child('+(src==='topmix'||src==='dgtango'?4:6)+')').open=true;}}closeMenu();}});
}
$$('[data-menu]').forEach(b=>{b.addEventListener('click',()=>openMenu(Number(b.dataset.menu)));b.addEventListener('mouseenter',()=>{if(window.matchMedia('(hover:hover)').matches)openMenu(Number(b.dataset.menu),true)});});
document.addEventListener('click',e=>{if(!$('#catalog-bar').contains(e.target))closeMenu()});
function selected(){return model.cabinets.find(c=>c.uid===model.selected)||null;}
function select(uid){model.selected=uid;model.selectedExtra=null;model.doorsOpen=false;renderInspector();renderList();drawScene();}
function selectExtra(uid){model.selected=null;model.selectedExtra=uid;model.doorsOpen=false;renderInspector();renderList();drawScene();}
function extraSelected(){return model.extras.find(e=>e.id===model.selectedExtra)||null;}
const extraPanel=document.createElement('div');extraPanel.id='extra-inspector';extraPanel.hidden=true;$('#inspector').appendChild(extraPanel);
extraPanel.addEventListener('change',e=>{const el=e.target,item=extraSelected(),key=el.dataset.extra;if(!item||!key)return;history();item[key]=clamp(el.value,key==='x'||key==='z'?-20000:100, key==='x'||key==='z'?20000:6000);renderAll();changed(false);});
extraPanel.addEventListener('click',e=>{let item=extraSelected();if(!item)return;if(e.target.id==='extra-remove'){history();model.extras=model.extras.filter(x=>x!==item);selectExtra(null);renderAll();changed(false);}if(e.target.id==='extra-duplicate'){history();const cp=deep(item);cp.id=uuid();cp.x+=500;model.extras.push(cp);selectExtra(cp.id);renderAll();changed(false);}});

$('#deselect').onclick=()=>select(null);
$$('[data-edit-mode]').forEach(b=>b.addEventListener('click',()=>{const advanced=b.dataset.editMode==='advanced';$$('[data-edit-mode]').forEach(x=>x.classList.toggle('active',x===b));$('#inspector').classList.toggle('id3-quick',!advanced)}));
$('#remove').onclick=()=>{let c=selected();if(!c||!confirm('Remove '+c.name+'?'))return;history();model.cabinets=model.cabinets.filter(x=>x!==c);select(null);renderAll();changed(false)};
$('#duplicate').onclick=()=>{let c=selected();if(!c)return;history();let cp=deep(c);cp.uid=uuid();cp.x+=Math.round(c.width/50)*50;model.cabinets.push(cp);select(cp.uid);renderAll();changed(false)};
$('#rotate').onclick=()=>{let c=selected();if(!c)return;history();c.rotation=(c.rotation+90)%360;renderAll();changed(false)};
$('#open-doors').onclick=()=>{model.doorsOpen=!model.doorsOpen;$('#open-doors').textContent=model.doorsOpen?'◫ Close':'◫ Open';drawScene()};
$('#clear-scene').onclick=()=>{if(!model.cabinets.length||!confirm('Remove all cabinets from this design?'))return;history();model.cabinets=[];select(null);renderAll();changed(false)};
function renderList(){$('#object-count').textContent=`${model.cabinets.length} cabinet${model.cabinets.length===1?'':'s'} · ${model.extras.length} other item${model.extras.length===1?'':'s'}`;$('#selection-badge').textContent=selected()?.name||extraSelected()?.kind||'No object selected';$('#cabinet-list').innerHTML=model.cabinets.length?model.cabinets.map((c,i)=>`<button data-select="${safe(c.uid)}" class="${c.uid===model.selected?'selected':''}"><b>${i+1}. ${safe(c.name)}</b><small>${mm(c.width)} × ${mm(c.height)} × ${mm(c.depth)}</small></button>`).join(''):'<p class="id3-muted">Add your first cabinet from the Cabinets menu.</p>';
 $('#cabinet-list').insertAdjacentHTML('beforeend',model.extras.map((e,i)=>`<button data-select-extra="${safe(e.id)}" class="${e.id===model.selectedExtra?'selected':''}"><b>Extra ${i+1}. ${safe(e.kind)}</b><small>${mm(e.width)} × ${mm(e.height)} × ${mm(e.depth)}</small></button>`).join(''));
 $$('[data-select]').forEach(b=>b.onclick=()=>select(b.dataset.select));$$('[data-select-extra]').forEach(b=>b.onclick=()=>selectExtra(b.dataset.selectExtra));}
function inspectorValue(el,c){const key=el.dataset.property;if(!key)return;if(el.type==='checkbox')el.checked=!!c[key];else el.value=c[key]??'';}
function renderInspector(){let c=selected();const extra=extraSelected();$('#empty-inspector').hidden=!!c||!!extra;$('#selected-inspector').hidden=!c;extraPanel.hidden=!extra;if(extra){extraPanel.innerHTML=`<div class="id3-inspector-title"><div><p class="id3-kicker">CONCEPT ITEM</p><h3>${safe(extra.kind)}</h3><small>Indicative placeholder · dimensions require verification</small></div><button class="id3-close" id="extra-close" type="button">×</button></div><div class="id3-detail">${[['width','Width'],['height','Height'],['depth','Depth'],['x','X position'],['z','Z position']].map(([key,label])=>`<label>${label} (mm)<input data-extra="${key}" type="number" value="${Math.round(extra[key])}" step="10"></label>`).join('')}<div class="id3-final-buttons"><button class="id3-btn id3-secondary" id="extra-duplicate" type="button">Duplicate</button><button class="id3-btn id3-secondary" id="extra-remove" type="button">Remove</button></div><p class="id3-note">This item is only a simple 3D placeholder, not a manufacturer-specific appliance or furniture model.</p></div>`;$('#extra-close').onclick=()=>selectExtra(null);}if(!c)return;let t=template(c.templateId);$('#selected-name').textContent=c.name;$('#selected-size').textContent=`${mm(c.width)} × ${mm(c.height)} × ${mm(c.depth)}`;$('#open-doors').textContent=model.doorsOpen?'◫ Close':'◫ Open';
 const props=[['width','Width'],['height','Height'],['depth','Depth']];
 $('#dimension-fields').innerHTML=props.map(([key,label])=>{let lo=n(t?.['min_'+key],300),hi=n(t?.['max_'+key],1200),v=n(c[key]);return `<div class="id3-dim-row"><div class="id3-dim-head"><label for="dim-${key}">${label}</label><input id="dim-${key}" data-dimension="${key}" type="number" min="100" max="10000" step="1" value="${v}" aria-label="${label} in millimetres"></div><div class="id3-dim-range"><input aria-label="${label} slider" type="range" data-slider="${key}" min="${Math.min(lo,v)}" max="${Math.max(hi,v)}" step="10" value="${v}"><small><span>Suggested ${mm(lo)}</span><span>${mm(hi)}</span></small></div></div>`}).join('');
 $$('[data-property]', $('#selected-inspector')).forEach(el=>inspectorValue(el,c));
 const doors=$('[data-property="doorStyle"]'),handles=$('[data-property="handle"]');
 doors.innerHTML=catalog.doors.map(a=>`<option value="${Number(a.id)}">${safe(a.name)}</option>`).join('');
 handles.innerHTML=catalog.handles.map(a=>`<option value="${Number(a.id)}">${safe(a.name)}</option>`).join('');
 doors.value=c.doorStyle??'';handles.value=c.handle??'';
 for(const key of ['doorCount','opening']){let el=$(`[data-property="${key}"]`);if(el)el.value=c[key]??'';}
 const wall=c.category==='wall-cabinets',tall=c.category==='tall-cabinets';
 $('[data-property="worktop"]').disabled=wall||tall;$('[data-property="plinth"]').disabled=wall;
 $('[data-property="doorCount"]').disabled=c.front!=='doors';$('[data-property="opening"]').disabled=c.front!=='doors';
 $('#material-source').value=c.material?.source||'standard';$('#standard-colours').hidden=!!c.material;$('#hpl-picker').hidden=!c.material;
 $('#stone-source').value=c.worktopMaterial?.source||'';$('#stone-picker').hidden=!c.worktopMaterial;
 renderShelfEditor();renderDrawerEditor();renderWarnings();
}
function renderShelfEditor(){let c=selected();if(!c)return;let count=clamp(c.shelves,0,8),inner=Math.max(1,c.height-(c.plinth?c.plinthHeight:0)-2*c.thickness);if(!Array.isArray(c.shelfPositions))c.shelfPositions=[];
 if(c.shelfPositions.length!==count)c.shelfPositions=Array.from({length:count},(_,i)=>Math.round((i+1)*inner/(count+1)));
 if(!Array.isArray(c.bayShelves))c.bayShelves=[];
 let bayHtml=c.partitions>0?'<h4 style="font-size:12px;margin:15px 0 7px">Shelves by compartment</h4>'+Array.from({length:c.partitions+1},(_,i)=>`<div class="id3-collection-row"><span>Bay ${i+1}</span><input type="number" min="0" max="8" value="${c.bayShelves[i]??c.shelves}" data-bay="${i}" aria-label="Bay ${i+1} shelf count"></div>`).join(''):'';
 $('#shelf-editor').innerHTML=(count?'<h4 style="font-size:12px;margin:13px 0 8px">Shelf height from internal base</h4>'+c.shelfPositions.map((v,i)=>`<div class="id3-collection-row"><span>Shelf ${i+1}</span><input type="range" min="1" max="${Math.round(inner)}" step="1" value="${Math.round(v)}" data-shelf="${i}" aria-label="Shelf ${i+1} height"><input type="number" min="1" max="${Math.round(inner)}" value="${Math.round(v)}" data-shelf-value="${i}" style="width:77px" aria-label="Shelf ${i+1} exact height"></div>`).join(''):'<p class="id3-note">No shelves added.</p>')+bayHtml;
 $$('[data-bay]').forEach(el=>el.onchange=()=>{let cur=selected();if(!cur)return;history();cur.bayShelves[+el.dataset.bay]=clamp(Math.round(n(el.value)),0,8);drawScene();renderShelfEditor();changed(false)});
 $$('[data-shelf]').forEach(el=>el.addEventListener('input',()=>{let current=selected();if(!current)return;let i=+el.dataset.shelf;current.shelfPositions[i]=n(el.value);$(`[data-shelf-value="${i}"]`).value=el.value;drawScene()}));
 $$('[data-shelf]').forEach(el=>el.addEventListener('pointerdown',history));
 $$('[data-shelf]').forEach(el=>el.addEventListener('change',()=>{renderWarnings();changed(false)}));
 $$('[data-shelf-value]').forEach(el=>el.addEventListener('change',()=>{let cur=selected();if(!cur)return;history();let i=+el.dataset.shelfValue;cur.shelfPositions[i]=clamp(el.value,1,inner);renderShelfEditor();drawScene();renderWarnings();changed(false)}));
}
function drawerRatios(c){let d=clamp(c.drawers,0,6);if(d===0)return[];if(c.drawerLayout==='shallow-top')return [0.5,...Array.from({length:d-1},()=>1)];if(c.drawerLayout==='custom'&&Array.isArray(c.drawerRatios)&&c.drawerRatios.length===d)return c.drawerRatios.map(v=>clamp(v,.2,5));return Array.from({length:d},()=>1);}
function renderDrawerEditor(){let c=selected();if(!c)return;let rows=drawerRatios(c);$('#drawer-editor').innerHTML=c.drawers?`<p class="id3-note">Front height proportions (not hardware-certified drawer boxes)</p>${rows.map((x,i)=>`<div class="id3-collection-row"><span>Drawer ${i+1}</span><input type="range" min="0.2" max="3" step="0.1" value="${x}" data-ratio="${i}" ${c.drawerLayout!=='custom'?'disabled':''}><span>${x.toFixed(1)}×</span></div>`).join('')}`:'';
 $$('[data-ratio]').forEach(el=>el.onchange=()=>{let cur=selected();if(!cur)return;history();cur.drawerRatios=drawerRatios(cur);cur.drawerRatios[+el.dataset.ratio]=n(el.value,1);renderDrawerEditor();drawScene();changed(false)});
}
function renderWarnings(){const c=selected();if(!c){$('#cabinet-notices').innerHTML='';return}let warnings=warningsFor(c).filter(x=>x.type!=='info');$('#cabinet-notices').innerHTML=warnings.slice(0,5).map(a=>`<div class="id3-warning ${a.type==='error'?'id3-error':''}">${safe(a.text)}</div>`).join('')+'<p class="id3-note" style="padding:0 13px">Workshop verification is required before fabrication or pricing.</p>';}
$('#selected-inspector').addEventListener('change',e=>{
 let el=e.target,key=el.dataset.property,c=selected();if(!c||!key||el.dataset.shelfValue!==undefined||el.dataset.shelf!==undefined||el.dataset.ratio!==undefined)return;
 history();let v=el.type==='checkbox'?el.checked:el.type==='number'?n(el.value):el.value;
 if(['doorCount','shelves','partitions','drawers'].includes(key))v=clamp(Math.round(n(v)),0,key==='shelves'?8:key==='drawers'?6:4);
 if(key==='plinthHeight')v=clamp(v,50,200);if(key==='thickness')v=clamp(v,12,36);
 if(['x','z'].includes(key))v=Math.round(n(v)/10)*10;
 if(['doorStyle','handle'].includes(key))v=Number(v)||null;
 c[key]=v;
 if(key==='shelves'){c.shelfPositions=[];c.bayShelves=[];}
 if(key==='partitions')c.bayShelves=[];
 if(key==='drawers'||key==='drawerLayout')c.drawerRatios=[];
 if(key==='front'&&v==='drawers'&&c.drawers===0)c.drawers=3;
 if(key==='front'&&v==='open'){c.doorCount=0;c.drawers=0;}
 if(key==='front'&&v==='doors'&&c.doorCount===0)c.doorCount=2;
 if(key==='worktop'&&!v)c.worktopMaterial=null;
 renderAll();changed(false);
});
$('#selected-inspector').addEventListener('input',e=>{
 let el=e.target,key=el.dataset.property,c=selected();if(!c)return;
 if(['x','z'].includes(key))return; // commit positions on change
});
function updateDimension(key,value,final=false){let c=selected();if(!c)return;let v=clamp(value,100,10000);c[key]=v;if(key==='height')c.shelfPositions=[];
 if(final){drawScene();renderInspector();renderList();changed(false)}else{const input=$(`[data-dimension="${key}"]`),slider=$(`[data-slider="${key}"]`);if(input)input.value=v;if(slider){slider.min=Math.min(n(slider.min),v);slider.max=Math.max(n(slider.max),v);slider.value=v;}drawScene();$('#selected-size').textContent=`${mm(c.width)} × ${mm(c.height)} × ${mm(c.depth)}`;}
}
$('#dimension-fields').addEventListener('pointerdown',e=>{if(e.target.dataset.slider)history();});
$('#dimension-fields').addEventListener('focusin',e=>{if(e.target.dataset.dimension)history();});
$('#dimension-fields').addEventListener('input',e=>{let el=e.target,key=el.dataset.slider;if(!key)return;updateDimension(key,el.value,false);$(`[data-dimension="${key}"]`).value=el.value;});
$('#dimension-fields').addEventListener('change',e=>{let el=e.target,key=el.dataset.slider||el.dataset.dimension;if(!key)return;updateDimension(key,el.value,true);});
$('#material-source').addEventListener('change',()=>{let c=selected();if(!c)return;history();let source=$('#material-source').value;c.material=null;$('#standard-colours').hidden=source!=='standard';$('#hpl-picker').hidden=source==='standard';if(source!=='standard')searchMaterials(source,$('#hpl-search').value,'hpl-results');drawScene();changed(false);});
$('#hpl-search').addEventListener('input',()=>{clearTimeout(window._id3_mat_timer);window._id3_mat_timer=setTimeout(()=>searchMaterials($('#material-source').value,$('#hpl-search').value,'hpl-results'),250)});
// Append a genuine stone catalogue search to the worktop controls.
const panel=$('#inspector-tabs details:nth-child(6) .id3-detail');
const stoneBlock=document.createElement('div');stoneBlock.innerHTML='<label>Actual worktop material<select id="stone-source"><option value="">Choose catalogue</option><option value="casero_stone_sintered">Casero Sintered Stone</option><option value="casero_stone_quartz">Casero Quartz</option></select></label><div id="stone-picker" hidden><label>Search stone catalogue<input id="stone-search" placeholder="Stone product code or name"></label><div id="stone-results" class="id3-material-results"></div></div>';
panel.insertBefore(stoneBlock,panel.querySelector('.id3-note'));
const runBox=document.createElement('div');runBox.innerHTML='<div class="id3-separator"></div><p class="id3-note">Link adjacent cabinets in the same run:</p><div class="id3-button-grid"><button type="button" data-run="worktop">Continuous worktop</button><button type="button" data-run="plinth">Continuous plinth</button><button type="button" data-run="backsplash">Continuous backsplash</button></div>';panel.appendChild(runBox);
$$('[data-run]',runBox).forEach(b=>b.onclick=()=>makeRun(b.dataset.run));
$('#stone-source').addEventListener('change',()=>{let c=selected();if(!c)return;history();c.worktopMaterial=null;let src=$('#stone-source').value;$('#stone-picker').hidden=!src;if(src)searchMaterials(src,'','stone-results');drawScene();changed(false)});
$('#stone-search').addEventListener('input',()=>{clearTimeout(window._id3_stone_timer);window._id3_stone_timer=setTimeout(()=>searchMaterials($('#stone-source').value,$('#stone-search').value,'stone-results'),250)});
function mediaPath(path){if(!path)return '';path=String(path).replace(/^\/+/, '');if(/^https?:/i.test(path)||path.includes('..'))return '';return ROOT+path;}
async function searchMaterials(source,q,target){if(!source||source==='standard')return;let box=$('#'+target);box.innerHTML='<span class="id3-note">Searching catalogue…</span>';try{let data=await request(`materials.php?source=${encodeURIComponent(source)}&q=${encodeURIComponent(q||'')}`);if((target==='hpl-results'&&source!==$('#material-source').value)||(target==='stone-results'&&source!==$('#stone-source').value))return;box.innerHTML=data.items.length?data.items.map(a=>`<button type="button" data-material-id="${Number(a.id)}"><img src="${safe(mediaPath(a.image))}" loading="lazy" alt=""><span><b>${safe(a.product_code)}</b> · ${safe(a.product_name)}</span></button>`).join(''):'<span class="id3-note">No matching items. Try a different name or code.</span>';
 $$('button',box).forEach((button,i)=>{const item=data.items[i];button.onclick=()=>{let c=selected();if(!c)return;history();if(target==='hpl-results')c.material=item;else{c.worktopMaterial=item;c.worktop=true;}drawScene();renderInspector();changed(false);notify('Selected '+item.product_code+' · '+item.product_name);};});
}catch(e){box.textContent='Catalogue unavailable: '+e.message;}}
function renderAll(){renderPlan();renderList();renderInspector();drawScene();}

function makeRun(type){
 const focus=selected();if(!focus){notify('Select a cabinet first.');return;}
 if(focus.rotation%360!==0){notify('Continuous runs currently require cabinets facing the same unrotated wall. Rotate the run to 0° first.',true);return;}
 if(focus.category==='wall-cabinets'||focus.category==='tall-cabinets'){notify('Continuous worktops, plinths and backsplashes require floor cabinetry.');return;}
 const group=model.cabinets.filter(c=>c.category!=='wall-cabinets'&&c.category!=='tall-cabinets'&&c.rotation===focus.rotation&&Math.abs(c.z-focus.z)<=40&&Math.abs(c.height-focus.height)<=25).sort((a,b)=>a.x-b.x);
 let run=[focus],changedRun=true;
 while(changedRun){changedRun=false;for(const cab of group){if(run.includes(cab))continue;if(run.some(other=>Math.abs(Math.abs(cab.x-other.x)-(cab.width+other.width)/2)<45)){run.push(cab);changedRun=true;}}}
 if(run.length<2){notify('Place at least two adjacent aligned floor cabinets to create a continuous '+type+'.',true);return;}
 history();model.shared=model.shared.filter(s=>s.type!==type||!s.cabinetUids.some(id=>run.some(c=>c.uid===id)));
 model.shared.push({id:uuid(),type,cabinetUids:run.map(c=>c.uid),material:type==='worktop'?deep(focus.worktopMaterial):null});
 run.forEach(c=>c[type==='worktop'?'worktop':type==='plinth'?'plinth':'backsplash']=true);
 renderAll();changed(false);notify(`Continuous ${type} created across ${run.length} aligned cabinets. Final joins and fabrication require staff review.`);
}
// ---------- Three.js renderer ----------
let worldGroup=new THREE.Group(),cabinetGroup=new THREE.Group(),extraGroup=new THREE.Group(), pointerStart=null,draggingId=null,draggingExtraId=null;
const mat=(color,roughness=.78)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0.02});
function addBox(group,w,h,d,x,y,z,material,name=''){let g=new THREE.BoxGeometry(Math.max(w,.001),Math.max(h,.001),Math.max(d,.001));let mesh=new THREE.Mesh(g,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=name;group.add(mesh);return mesh;}
function init3D(){try{
 scene=new THREE.Scene();scene.background=new THREE.Color('#eceae5');
 camera=new THREE.PerspectiveCamera(48,1,.04,200);
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene.add(new THREE.AmbientLight(0xffffff,1.4));
 let sunlight=new THREE.DirectionalLight(0xfff0d9,2.0);sunlight.position.set(6,11,8);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);sunlight.shadow.camera.left=-15;sunlight.shadow.camera.right=15;sunlight.shadow.camera.top=15;sunlight.shadow.camera.bottom=-15;scene.add(sunlight);
 scene.add(worldGroup);raycaster=new THREE.Raycaster();ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI/2-.025;controls.minDistance=.5;controls.maxDistance=55;controls.target.set(2,1,2);
 canvas.addEventListener('pointerdown',onPointerDown);window.addEventListener('pointermove',onPointerMove);window.addEventListener('pointerup',onPointerUp);
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 window.addEventListener('resize',resize);const observer=new ResizeObserver(resize);observer.observe($('#canvas-wrap'));
 fitCamera();resize();drawScene();
 const loop=()=>{requestAnimationFrame(loop);if(!renderer||!camera)return;controls.update();if(!$('#canvas-wrap').offsetWidth)return;renderer.render(scene,camera)};loop();loaded=true;$('#canvas-loader').hidden=true;
 }catch(e){console.error(e);$('#canvas-loader').textContent='3D viewer could not initialize. Your browser may not support WebGL.';notify('WebGL failed: '+e.message,true);}}
function resize(){if(!renderer||!camera)return;const rect=$('#canvas-wrap').getBoundingClientRect();if(rect.width<5||rect.height<5)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
function fitCamera(){if(!camera||!controls)return;const w=model.room.width/1000,d=model.room.depth/1000;const size=Math.max(w,d);let center=new THREE.Vector3(w/2,Math.min(model.room.height/1000,1.4),d/2);controls.target.copy(center);camera.position.set(w/2+size*.88,size*.95+2,d/2+size*1.10);controls.enableRotate=true;controls.enablePan=true;camera.lookAt(center);controls.update();}
$('#recenter').onclick=fitCamera;
$$('[data-camera]').forEach(b=>b.onclick=()=>{model.camera=b.dataset.camera;$$('[data-camera]').forEach(x=>x.classList.toggle('active',x===b));if(!camera)return;let w=model.room.width/1000,d=model.room.depth/1000,s=Math.max(w,d);if(model.camera==='plan'){controls.enableRotate=false;camera.position.set(w/2,Math.max(s*2,7),d/2+.001);controls.target.set(w/2,0,d/2);camera.lookAt(controls.target);}else if(model.camera==='walk'){controls.enableRotate=true;camera.position.set(Math.max(.35,w/2),1.6,Math.max(.35,d*.8));controls.target.set(w/2,1.55,Math.max(.1,d*.45));camera.lookAt(controls.target);}else fitCamera();controls.update();});
function polygonFloor(vertices){let shape=new THREE.Shape();vertices.forEach((v,i)=>{let x=v.x/1000,z=-v.z/1000;i?shape.lineTo(x,z):shape.moveTo(x,z)});shape.closePath();return new THREE.ShapeGeometry(shape);}
let floorTexture=null;function makeFloorTexture(){if(floorTexture){floorTexture.repeat.set(Math.max(1,model.room.width/850),Math.max(1,model.room.depth/850));return floorTexture;}const c=document.createElement('canvas');c.width=256;c.height=256;let ctx=c.getContext('2d');ctx.fillStyle='#d7bca0';ctx.fillRect(0,0,256,256);for(let r=0;r<8;r++){let y=r*32;for(let j=0;j<4;j++){let x=j*68+(r%2)*26;ctx.fillStyle=['#cbaa85','#dfc4a6','#d5b590','#d3ac83'][(r+j)%4];ctx.fillRect(x,y,69,31);ctx.strokeStyle='#a9866455';ctx.strokeRect(x+.5,y+.5,68,30);}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(Math.max(1,model.room.width/850),Math.max(1,model.room.depth/850));t.colorSpace=THREE.SRGBColorSpace;floorTexture=t;return t;}
function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){let a=Array.isArray(o.material)?o.material:[o.material];a.forEach(m=>m.dispose());}});}
function worldPointFromPointer(evt){let rect=canvas.getBoundingClientRect();let mouse=new THREE.Vector2((evt.clientX-rect.left)/rect.width*2-1,-(evt.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);let pos=new THREE.Vector3();return raycaster.ray.intersectPlane(ground,pos)?pos:null;}
function onPointerDown(e){if(model.step!==3||!camera||!renderer)return;if(e.button!==0)return;const r=canvas.getBoundingClientRect();let mouse=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects([...cabinetGroup.children,...extraGroup.children],true);let hit=hits[0],uid=null,extraUid=null;if(hit){let o=hit.object;while(o){if(o.userData?.uid){uid=o.userData.uid;break;}if(o.userData?.extraId){extraUid=o.userData.extraId;break;}o=o.parent;}}if(uid){select(uid);draggingId=uid;controls.enabled=false;canvas.setPointerCapture?.(e.pointerId);}else if(extraUid){selectExtra(extraUid);draggingExtraId=extraUid;controls.enabled=false;canvas.setPointerCapture?.(e.pointerId);}else{if(model.selected||model.selectedExtra)select(null);}pointerStart={x:e.clientX,y:e.clientY,started:false,uid:uid||extraUid};}
function onPointerMove(e){if((!draggingId&&!draggingExtraId)||!pointerStart||!camera)return;let dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;if(Math.hypot(dx,dy)<4&&!pointerStart.started)return;if(!pointerStart.started){history();pointerStart.started=true;}let p=worldPointFromPointer(e);if(!p)return;let c=draggingId?model.cabinets.find(a=>a.uid===draggingId):model.extras.find(a=>a.id===draggingExtraId);if(!c)return;c.x=Math.round(p.x*1000/25)*25;c.z=Math.round(p.z*1000/25)*25;const g=draggingId?meshById.get(c.uid):extraGroup.children.find(x=>x.userData.extraId===c.id);if(g)g.position.set(c.x/1000,draggingId&&c.category==='wall-cabinets'?1.35:0,c.z/1000);$('#selection-badge').textContent=`Moved to ${mm(c.x)}, ${mm(c.z)}`;}
function onPointerUp(){if(pointerStart?.started){renderAll();changed(false)}draggingId=null;draggingExtraId=null;pointerStart=null;if(controls)controls.enabled=true;}
function fetchTexture(obj){let src=mediaPath(obj?.image);if(!src)return null;if(textureCache.has(src))return textureCache.get(src);let t=new THREE.TextureLoader().load(src,()=>{if(renderer)drawScene()},undefined,()=>{textureCache.set(src,null)});t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;textureCache.set(src,t);return t;}
function finishMat(c){let texture=fetchTexture(c.material);return texture?new THREE.MeshStandardMaterial({color:'#fff',map:texture,roughness:.8}):mat(c.color||'#907053');}
function addRoom(){let vertices=roomVertices();let floor=new THREE.Mesh(polygonFloor(vertices),new THREE.MeshStandardMaterial({map:makeFloorTexture(),roughness:.9,side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.y=-.011;floor.receiveShadow=true;worldGroup.add(floor);
 let walls=new THREE.Group(),h=model.room.height/1000;
 vertices.forEach((a,i)=>{let b=vertices[(i+1)%vertices.length];if((model.room.shape==='open'||model.room.shape==='u_open')&&i===2)return;if(model.room.shape==='l_open'&&i===3)return;let ax=a.x/1000,az=a.z/1000,bx=b.x/1000,bz=b.z/1000,len=Math.hypot(bx-ax,bz-az);let color=mat(i%2?'#dedbd5':'#f0efeb');color.transparent=true;color.opacity=.73;color.depthWrite=false;ideareJoinedWall(walls,vertices,i,model.room,h,color,'room_wall');});worldGroup.add(walls);
 for(const f of model.features){let a=vertices[f.wallIndex%vertices.length],b=vertices[(f.wallIndex+1)%vertices.length];if(!a||!b)continue;let portion=clamp(f.offset??.5,.05,.95),x=(a.x+(b.x-a.x)*portion)/1000,z=(a.z+(b.z-a.z)*portion)/1000;let feature=addBox(worldGroup,Math.max(.1,n(f.width,700)/1000),Math.max(.1,n(f.height,800)/1000),.028,x,(n(f.y,500)+n(f.height,800)/2)/1000,z,mat(f.type==='door'?'#b99070':f.type==='window'?'#7fa9bb':f.type==='plumbing'?'#417cb2':'#c4ac79'),'room_feature');feature.material.transparent=true;feature.material.opacity=.65;}
 // Simple ground grid helps navigation and measurement intuition.
 const grid=new THREE.GridHelper(Math.max(model.room.width,model.room.depth)/1000+2,Math.max(4,Math.round(Math.max(model.room.width,model.room.depth)/500)),0xbbb2a5,0xcfc8ba);grid.position.set(model.room.width/2000,.002,model.room.depth/2000);grid.material.transparent=true;grid.material.opacity=.18;worldGroup.add(grid);
}
function makeCabinet(c){let w=c.width/1000,d=c.depth/1000,t=clamp(c.thickness/1000,.01,.05),g=new THREE.Group();g.userData.uid=c.uid;
 const carcass=mat(c.carcass==='plywood'?'#c8b49b':c.carcass==='blockboard'?'#d8c0a1':'#e7e4dc');
 const inside=mat('#dfd4c6');let front=finishMat(c);const hardware=mat('#323437',.25);hardware.metalness=.65;
 let plinthOn=c.category!=='wall-cabinets'&&c.plinth;let plinthH=plinthOn?clamp(c.plinthHeight,50,200)/1000:0;let y0=plinthH;let h=Math.max(.12,c.height/1000-y0); // overall cabinet height includes plinth, excludes worktop
 addBox(g,w,t,d,0,y0+t/2,0,carcass,'bottom_panel');addBox(g,w,t,d,0,y0+h-t/2,0,carcass,'top_panel');
 addBox(g,t,h-t*2,d,-w/2+t/2,y0+h/2,0,carcass,'left_panel');addBox(g,t,h-t*2,d,w/2-t/2,y0+h/2,0,carcass,'right_panel');
 addBox(g,w-2*t,h-2*t,t,0,y0+h/2,-d/2+t/2,inside,'back_panel');
 let insideW=Math.max(.001,w-2*t),insideH=Math.max(.001,h-2*t),insideD=Math.max(.001,d-2*t);
 for(let i=0;i<c.partitions;i++){let px=-insideW/2+(i+1)*insideW/(c.partitions+1);addBox(g,t,insideH,insideD,px,y0+h/2,0,carcass,'partition');}
 const bays=c.partitions+1,bayWidth=insideW/bays;
 for(let j=0;j<bays;j++){let bx=-insideW/2+(j+.5)*bayWidth,sh=clamp(c.bayShelves?.[j]??c.shelves,0,8);for(let i=0;i<sh;i++){let Y=sh===c.shelves&&c.shelfPositions[i]!==undefined?n(c.shelfPositions[i])/1000:(i+1)*insideH/(sh+1);addBox(g,Math.max(.02,bayWidth-(j===0||j===bays-1?t/2:t)),t,insideD*.94,bx,y0+t+Y,0,carcass,'adjustable_shelf');}}
 const frontZ=d/2+.008;const doors=Math.max(1,n(c.doorCount,2));
 if(c.front==='doors'){
  for(let i=0;i<doors;i++){let dw=Math.max(.01,w/doors-.002);let pivot=new THREE.Group();const hingesLeft=doors===1?c.hingeSide!=='right':i%2===0;const hingeX=-w/2+i*(w/doors)+(hingesLeft?0:w/doors);pivot.position.set(hingeX,y0,frontZ);const leaf=addBox(pivot,dw,h-.003,.019,(hingesLeft?1:-1)*(w/doors)/2,h/2,0,front,'door_panel');if(c.opening==='swing'&&model.selected===c.uid&&model.doorsOpen)pivot.rotation.y=hingesLeft?-.9:.9;else if(c.opening==='lift'&&model.selected===c.uid&&model.doorsOpen)pivot.rotation.x=-.6;
   if(/shaker/i.test(catalog.doors.find(x=>Number(x.id)===Number(c.doorStyle))?.name||''))addBox(pivot,Math.max(.02,dw-.08),Math.max(.05,h-.10),.002,(hingesLeft?1:-1)*(w/doors)/2,h/2,.011,mat('#af9479'),'door_inset');
   if(!/handleless/i.test(catalog.handles.find(x=>Number(x.id)===Number(c.handle))?.name||'')){addBox(pivot,.012,Math.min(.14,h*.18),.017,(hingesLeft?1:-1)*(dw-.055),Math.min(h*.54,h-.06),.023,hardware,'handle');}
   g.add(pivot);
  }
 }else if(c.front==='drawers'){
  let count=Math.max(1,n(c.drawers,3)),ratios=drawerRatios(c),sum=ratios.reduce((a,b)=>a+b,0)||1,at=0;
  for(let i=0;i<count;i++){let vh=(h-.015)*ratios[i]/sum,cy=y0+at+vh/2+.007;
   let dz=model.selected===c.uid&&model.doorsOpen?Math.min(.4,d*.65):0;
   addBox(g,w-.008,vh-.004,.019,0,cy,frontZ+dz,front,'drawer_front');
   addBox(g,Math.max(.03,insideW-.07),Math.max(.025,vh*.75),Math.max(.06,insideD*.75),0,cy,Math.min(d*.2,dz*.75),inside,'drawer_box');
   addBox(g,Math.min(w*.3,.16),.011,.018,0,cy,frontZ+.025+dz,hardware,'drawer_handle');
   at+=vh;
  }
 }
 if(plinthOn&&!model.shared.some(x=>x.type==='plinth'&&x.cabinetUids.includes(c.uid))){let kick=mat('#555451');addBox(g,w-.03,plinthH-.01,d-.10,0,plinthH/2,-.035,kick,'recessed_plinth');}
 if(c.worktop&&c.category!=='wall-cabinets'&&c.category!=='tall-cabinets'&&!model.shared.some(x=>x.type==='worktop'&&x.cabinetUids.includes(c.uid))){
  let stone=fetchTexture(c.worktopMaterial);let top=stone?new THREE.MeshStandardMaterial({map:stone,color:'#fff',roughness:.32}):mat(c.worktopType==='laminate'?'#947655':c.worktopType==='quartz'?'#dddcd9':'#707478',.38);
  addBox(g,w,.028,d+.032,0,y0+h+.014,.016,top,'worktop');
  if(c.backsplash&&!model.shared.some(x=>x.type==='backsplash'&&x.cabinetUids.includes(c.uid)))addBox(g,w+.035,.18,.022,0,y0+h+.105,-d/2,top,'backsplash');
 }
 if(c.led)addBox(g,Math.max(.03,w-.04),.012,.015,0,y0+h-.065,d/2-.10,mat('#ffeeb2',.3),'led_strip');
 if(c.basket){let organizer=mat('#a4a8a9',.3);organizer.metalness=.8;addBox(g,insideW*.75,.018,insideD*.72,0,y0+.17,0,organizer,'basket_tray');}
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.01,h+y0+.03,d+.04)),new THREE.LineBasicMaterial({color:0xb3905c}));outline.position.y=(y0+h)/2;outline.visible=model.selected===c.uid;g.add(outline);
 // Select by group identity no matter which carcass part is clicked.
 g.position.set(c.x/1000,c.category==='wall-cabinets'?1.35:0,c.z/1000);g.rotation.y=-n(c.rotation)*Math.PI/180;return g;
}

function addSharedElements(){for(const element of model.shared){
 const parts=model.cabinets.filter(c=>element.cabinetUids.includes(c.uid));if(parts.length<2)continue;
 const minx=Math.min(...parts.map(c=>c.x-c.width/2)),maxx=Math.max(...parts.map(c=>c.x+c.width/2));
 const first=parts[0],z=first.z/1000,d=Math.max(...parts.map(c=>c.depth))/1000,width=(maxx-minx)/1000;
 const h=first.height/1000;
 let material=element.type==='worktop'?fetchTexture(element.material):null;
 let finish=material?new THREE.MeshStandardMaterial({map:material,color:'#fff',roughness:.36}):mat(element.type==='worktop'?'#777675':element.type==='backsplash'?'#a5a5a2':'#4b4947');
 if(element.type==='worktop')addBox(worldGroup,width,.03,d+.032,(minx+maxx)/2000,h+.015,z+.016,finish,'continuous_worktop');
 if(element.type==='plinth')addBox(worldGroup,width-.035,Math.max(.03,first.plinthHeight/1000),d-.1,(minx+maxx)/2000,first.plinthHeight/2000,z-.03,finish,'continuous_plinth');
 if(element.type==='backsplash')addBox(worldGroup,width+.035,.2,.022,(minx+maxx)/2000,h+.12,z-d/2,finish,'continuous_backsplash');
 }}
function addExtras(){for(let item of model.extras){let group=new THREE.Group();group.userData.extraId=item.id;group.position.set(item.x/1000,0,item.z/1000);let w=item.width/1000,d=item.depth/1000,h=item.height/1000;let silver=mat(/fridge|oven|dishwasher|microwave|refrigerator/i.test(item.kind)?'#9a9da0':'#af987c');addBox(group,w,h,d,0,h/2,0,silver,'concept_extra');const label=document.createElement('canvas');label.width=256;label.height=64;const c=label.getContext('2d');c.fillStyle='#f8f6f0';c.fillRect(0,0,256,64);c.font='bold 21px Arial';c.fillStyle='#4b4a46';c.textAlign='center';c.fillText(String(item.kind).slice(0,19),128,40);const t=new THREE.CanvasTexture(label);let flag=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false}));flag.position.set(0,h+.24,0);flag.scale.set(.82,.22,1);group.add(flag);const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.01,h+.01,d+.01)),new THREE.LineBasicMaterial({color:0xb3905c}));outline.position.y=h/2;outline.visible=item.id===model.selectedExtra;group.add(outline);extraGroup.add(group);}}
function drawScene(){if(!scene||!renderer)return;scene.remove(worldGroup);disposeGroup(worldGroup);worldGroup=new THREE.Group();cabinetGroup=new THREE.Group();extraGroup=new THREE.Group();scene.add(worldGroup);meshById.clear();addRoom();worldGroup.add(cabinetGroup);worldGroup.add(extraGroup);const failed=[];for(let c of model.cabinets){try{let g=makeCabinet(c);cabinetGroup.add(g);meshById.set(c.uid,g);}catch(error){console.error("IDEARE cabinet geometry:",c.name,c.uid,error);failed.push(c.name||"Cabinet");}}addSharedElements();addExtras();if(failed.length)notify("Could not display: "+failed.join(", ")+". See browser console for details.",true);}
// ---------- Finalize, download and persistence ----------
function formContact(check=true){const form=$('#customer-form');let p=Object.fromEntries(new FormData(form).entries());p.consent=$('input[name="consent"]',form).checked;return p;}
function renderSummary(){const target=$('#final-summary');target.innerHTML=[['Room',model.roomType],['Room size',`${mm(model.room.width)} × ${mm(model.room.depth)} × ${mm(model.room.height)}`],['Cabinets',String(model.cabinets.length)],['Concept furniture / appliances',String(model.extras.length)],['Material selections',String(model.cabinets.filter(c=>c.material||c.worktopMaterial).length)]].map(([a,b])=>`<div class="id3-summary-row"><span>${safe(a)}</span><b>${safe(b)}</b></div>`).join('');let list=allWarnings();$('#final-findings').innerHTML=`<h3 style="margin-top:22px">Design checks</h3>${list.length?list.slice(0,15).map(w=>`<div class="id3-warning ${w.type==='error'?'id3-error':''}"><b>${safe(w.cabinet)}</b>: ${safe(w.text)}</div>`).join(''):'<p class="id3-muted">No geometric placement issues detected. All designs still require staff manufacturing review.</p>'}`;}
async function generatePdf(){if(!window.jspdf?.jsPDF){notify('PDF library could not load. Use your browser Print → Save as PDF.',true);window.print();return null;}
 const doc=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});let y=19;
 const section=(title)=>{if(y>265){doc.addPage();y=18;}doc.setTextColor(75,61,42);doc.setFontSize(12);doc.setFont('helvetica','bold');doc.text(title,17,y);y+=8;};
 const text=(line,fontsize=10)=>{doc.setTextColor(55,56,55);doc.setFont('helvetica','normal');doc.setFontSize(fontsize);let lines=doc.splitTextToSize(String(line),173);for(let l of lines){if(y>279){doc.addPage();y=18;}doc.text(l,17,y);y+=5.5;}};
 doc.setFillColor(51,43,34);doc.rect(0,0,210,34,'F');doc.setTextColor(255,250,240);doc.setFontSize(22);doc.setFont('helvetica','bold');doc.text('IDEARE',17,21);doc.setFontSize(9);doc.text('3D SPACE & CABINET DESIGN | CONCEPT DOCUMENT',17,28);y=45;
 section(formContact(false).design_name||'My Cabinet Design');text(`Room: ${model.roomType}   |   ${model.room.width} x ${model.room.depth} x ${model.room.height} mm`);
 const originalCamera=model.camera;try{if(renderer){renderer.render(scene,camera);let snap=renderer.domElement.toDataURL('image/jpeg',.82);const imgH=Math.min(91,178/camera.aspect),imgW=imgH*camera.aspect;doc.addImage(snap,'JPEG',16,y,imgW,imgH);y+=imgH+12;}}catch(e){text('3D preview unavailable in PDF.');}
 section('Cabinet schedule');
 model.cabinets.forEach((c,i)=>{text(`${i+1}. ${c.name} — W ${Math.round(c.width)} x H ${Math.round(c.height)} x D ${Math.round(c.depth)} mm`);text(`   Front: ${c.front} | Shelves: ${c.shelves} | Dividers: ${c.partitions} | Drawers: ${c.drawers} | Carcass: ${c.carcass}`,8);if(c.material)text(`   HPL: ${c.material.source.toUpperCase()} ${c.material.product_code} ${c.material.product_name}`,8);if(c.worktopMaterial)text(`   Worktop: ${c.worktopMaterial.product_code} ${c.worktopMaterial.product_name}`,8);});
 section('Design notes and review');let info=formContact(false);if(info.customer_name)text(`Customer: ${info.customer_name} | ${info.customer_phone||''} | ${info.customer_email||''}`,9);if(info.project_location)text('Location: '+info.project_location,9);if(info.notes)text('Notes: '+info.notes,9);let warns=allWarnings();if(warns.length)warns.slice(0,18).forEach(a=>text(`REVIEW: ${a.cabinet} - ${a.text}`,8));else text('No obvious placement conflicts detected. Manufacturing checks remain outstanding.',9);
 y+=4;text('CONCEPT ONLY. Not a final quotation, manufacturing drawing or verified site measurement.',8);text('IDEARE staff must confirm all dimensions, materials, hardware and installation conditions.',8);
 return doc;
}
$('#download-pdf').onclick=async()=>{try{const doc=await generatePdf();if(doc)doc.save(`IDEARE-${(formContact(false).design_name||'cabinet-design').replace(/[^a-z0-9_-]/gi,'-').slice(0,60)}.pdf`);}catch(e){notify('PDF creation failed: '+e.message,true)}};
async function save(mode){if(busy)return;const form=$('#customer-form');if(!form.reportValidity())return;if(!$('input[name="consent"]',form).checked){notify('Please consent to being contacted.',true);return;}if(!model.cabinets.length){notify('Please add at least one cabinet before saving.',true);showStep(3);return;}
 busy=true;$('#save-design').disabled=$('#submit-design').disabled=true;$('#save-result').textContent='Saving editable design…';
 try{
   const info=formContact();const result=await send('save.php',{scene:sceneData(),contact:info,mode,design_code:model.designCode,edit_token:model.editToken});
   model.designCode=result.design_code;model.editToken=result.edit_token||model.editToken;model.revision=result.revision_no;
   const link=new URL(window.location.pathname,window.location.href);link.searchParams.set('code',model.designCode);link.searchParams.set('token',model.editToken);window.history.replaceState?.(null,'',link.toString());
   const editUrl=link.toString();$('#save-result').innerHTML=`<strong>${mode==='submit'?'Submitted to IDEARE':'Editable design saved'} · ${safe(model.designCode)}</strong><p class="id3-note">Keep this private edit link. Anyone with the link can edit your saved design.</p><a href="${safe(editUrl)}" target="_blank" rel="noopener">Open saved design</a> <button class="id3-tiny" id="copy-design-link" type="button">Copy link</button>`;
   $('#copy-design-link').onclick=async()=>{try{await navigator.clipboard.writeText(editUrl);notify('Private design link copied.')}catch(e){prompt('Copy your edit link:',editUrl);}};
   if(mode==='submit'){
     try{const doc=await generatePdf();if(doc){let blob=doc.output('blob'),formData=new FormData();formData.append('pdf',blob,model.designCode+'-concept.pdf');formData.append('design_code',model.designCode);formData.append('edit_token',model.editToken);await request('upload-pdf.php',{method:'POST',headers:{'X-CSRF-Token':csrf},body:formData});$('#save-result').insertAdjacentHTML('beforeend','<p>Concept PDF attached for IDEARE staff.</p>');}else $('#save-result').insertAdjacentHTML('beforeend','<p>The editable 3D scene was submitted; PDF attachment was unavailable.</p>');}
     catch(e){$('#save-result').insertAdjacentHTML('beforeend',`<p>The editable 3D scene was submitted. PDF attachment could not be added: ${safe(e.message)}.</p>`);}
   }
   notify(mode==='submit'?'Design submitted for staff review.':'Design saved. Keep the private edit link.');
 }catch(e){$('#save-result').textContent='Could not save: '+e.message;notify(e.message,true)}finally{busy=false;$('#save-design').disabled=$('#submit-design').disabled=false;}
}
$('#save-design').onclick=()=>save('save');$('#submit-design').onclick=()=>save('submit');
function setContact(data){if(!data)return;for(let [k,v] of Object.entries(data)){let el=$(`[name="${k}"]`,$('#customer-form'));if(el&&v!=null&&el.type!=='checkbox')el.value=v;}}
async function boot(){try{
  let sec=await request('csrf.php');csrf=sec.csrf;
  const cat=await request('catalog.php');catalog=cat;
  const link=new URL(location.href),code=link.searchParams.get('code'),token=link.searchParams.get('token');
  if(code&&token){const data=await request(`load.php?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`);applyHistory(JSON.stringify(data.scene));setContact(data.contact);model.designCode=code;model.editToken=token;model.revision=data.revision_no;showStep(3);notify(`Loaded ${code} · revision ${model.revision}.`);}
  else{try{let local=localStorage.getItem('ideare3d_draft_v1');if(local&&confirm('Restore your locally saved unfinished 3D design?')){let draft=JSON.parse(local);applyHistory(JSON.stringify(draft.scene));notify('Local draft restored.');}}catch(e){}}
  renderAll();init3D();if(model.step===3)setTimeout(resize,60);
 }catch(e){console.error(e);$('#canvas-loader').textContent='Unable to start designer: '+e.message;notify(e.message,true);}
}

;
/* IDEARE v6: footprint geometry and collision helpers. Same ES module as base engine.
   All footprint coordinates are millimetres. Rendered surfaces use metres. */
function v6Kind(c){
 if(!c?.uid)return 'rect';
 const t=template(c.templateId)||{},g=String(t.geometry_type||c.geometry_type||'').toLowerCase(),name=String(t.slug||c.name||'').toLowerCase();
 if(g==='blind_corner'||/blind.corner/.test(name))return 'blind';
 if(g==='diagonal_corner'||/diagonal.corner/.test(name))return 'diagonal';
 if(g==='l_corner'||/l.shaped.corner|corner.carousel|^corner.base.cabinet$/.test(name))return 'l';
 if(/peninsula/.test(name))return 'peninsula';
 if(/island/.test(name))return 'island';
 return 'rect';
}
function v6Local(c){
 const w=Number(c.width),d=Number(c.depth),l=-w/2,r=w/2,b=-d/2,f=d/2;
 const armW=Math.min(w*.78,Math.max(w*.55,600)),armD=Math.min(d*.78,Math.max(d*.55,600));
 const x=l+armW,z=b+armD,kind=v6Kind(c);
 if(kind==='l')return [[l,b],[r,b],[r,z],[x,z],[x,f],[l,f]];
 if(kind==='diagonal')return [[l,b],[r,b],[r,z],[x,f],[l,f]];
 return [[l,b],[r,b],[r,f],[l,f]];
}
function v6Pieces(c){const p=v6Local(c);return v6Kind(c)==='l'?[[p[0],p[1],p[2],[p[0][0],p[2][1]]],[[p[0][0],p[2][1]],p[3],p[4],p[5]]]:[p];}
function v6World(c,poly){const a=(Number(c.rotation)||0)*Math.PI/180,co=Math.cos(a),si=Math.sin(a);return poly.map(([x,z])=>[c.x+x*co-z*si,c.z+x*si+z*co]);}
function v6ConvexOverlap(a,b,eps=.01){
 for(const p of [a,b])for(let i=0;i<p.length;i++){
  const u=p[i],v=p[(i+1)%p.length],dx=v[0]-u[0],dz=v[1]-u[1],len=Math.hypot(dx,dz);if(len<1e-7)continue;
  const proj=q=>q.map(([x,z])=>(-dz*x+dx*z)/len),aa=proj(a),bb=proj(b);
  if(Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))<=eps)return false;
 }return true;
}
function v6Overlap(a,b,eps=.01){return v6Pieces(a).some(p=>v6Pieces(b).some(q=>v6ConvexOverlap(v6World(a,p),v6World(b,q),eps)));}
function v6Fits(c,poly=roomVertices()){
 const shape=v6World(c,v6Local(c));
 const inside=([x,z])=>poly.some((a,i)=>{const b=poly[(i+1)%poly.length],dx=b.x-a.x,dz=b.z-a.z,px=x-a.x,pz=z-a.z;return Math.abs(dx*pz-dz*px)<=.01*Math.max(1,Math.hypot(dx,dz))&&px*dx+pz*dz>=-.01&&px*dx+pz*dz<=dx*dx+dz*dz+.01;})||pointInsidePolygon(x,z,poly);
 if(!shape.every(inside))return false;
 // Check every interval between intersections, including concave room notches.
 for(let i=0;i<shape.length;i++){
  const a=shape[i],b=shape[(i+1)%shape.length],dx=b[0]-a[0],dz=b[1]-a[1],cuts=[0,1];
  for(let j=0;j<poly.length;j++){const u=poly[j],v=poly[(j+1)%poly.length],ex=v.x-u.x,ez=v.z-u.z,det=dx*ez-dz*ex;if(Math.abs(det)<1e-8)continue;const px=u.x-a[0],pz=u.z-a[1],t=(px*ez-pz*ex)/det,s=(px*dz-pz*dx)/det;if(t>0&&t<1&&s>=0&&s<=1)cuts.push(t);}
  cuts.sort((x,y)=>x-y);for(let j=1;j<cuts.length;j++){const t=(cuts[j-1]+cuts[j])/2;if(!inside([a[0]+dx*t,a[1]+dz*t]))return false;}
 }return true;
}
function v6Special(c){return ['l','diagonal','blind'].includes(v6Kind(c));}
function v6Slab(g,points,y,thick,material,name){
 const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();
 const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,thick),bevelEnabled:false,steps:1}),material);
 mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
}
function v6Panel(g,a,b,y,h,t,material,name,offset=0){
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.006)return null;
 const mesh=addBox(g,len,h,t,(a[0]+b[0])/2-dz/len*offset,y,(a[1]+b[1])/2+dx/len*offset,material,name);mesh.rotation.y=-Math.atan2(dz,dx);return mesh;
}
function v6CornerModel(c){
 const kind=v6Kind(c),p=v6Local(c).map(q=>q.map(v=>v/1000)),w=c.width/1000,d=c.depth/1000,H=c.height/1000,t=Math.min(.035,Math.max(.012,(Number(c.thickness)||18)/1000)),pl=c.plinth?Math.min(.2,Math.max(.05,(Number(c.plinthHeight)||100)/1000)):0,h=H-pl;
 const g=new THREE.Group();g.userData.uid=c.uid;
 const carcass=mat(c.carcass==='plywood'?'#c8b49b':c.carcass==='blockboard'?'#d8c0a1':'#e7e4dc'),front=finishMat(c);
 const materialName=String(catalog.handles.find(x=>Number(x.id)===Number(c.handle))?.name||'').toLowerCase(),metal=new THREE.MeshStandardMaterial({color:/gold|brass|bronze/.test(materialName)?0xb68a57:/black|hack/.test(materialName)?0x242424:0xb2b6b5,metalness:.76,roughness:.27});
 v6Slab(g,p,pl,t,carcass,'bottom_panel');v6Slab(g,p,H-t,t,carcass,'top_panel');
 const opening=kind==='l'?[2,3]:kind==='diagonal'?[2]:[2];
 for(let i=0;i<p.length;i++)if(!opening.includes(i))v6Panel(g,p[i],p[(i+1)%p.length],pl+h/2,h-2*t,t,carcass,'carcass_side',t/2);
 // Keep shelf geometry inside the actual corner footprint, not the missing notch.
 const center=[p.reduce((s,q)=>s+q[0],0)/p.length,p.reduce((s,q)=>s+q[1],0)/p.length];
 const inset=p.map(([x,z])=>[x+(center[0]-x)*.055,z+(center[1]-z)*.055]);
 for(let i=0;i<Math.min(8,Number(c.shelves)||0);i++){
  const y=pl+t+(i+1)*(h-2*t)/(Number(c.shelves)+1);
  v6Slab(g,inset,y,t,carcass,'adjustable_shelf');
 }
 if(c.plinth)v6Slab(g,p.map(([x,z])=>[x*.92,z*.92]),0,Math.max(.001,pl-.008),mat('#555451'),'recessed_plinth');
 if(c.worktop){const tex=fetchTexture(c.worktopMaterial),m=tex?new THREE.MeshStandardMaterial({map:tex,color:'#fff',roughness:.32}):mat(c.worktopType==='laminate'?'#947655':c.worktopType==='quartz'?'#dddcd9':'#707478',.38);v6Slab(g,p,H,.028,m,'worktop');}
 const opened=model.selected===c.uid&&model.doorsOpen;
 // Door leaves sit on the open edges. For an L unit they swing separately
 // from the outer ends; a blind corner has a fixed blank and one access door.
 for(const i of opening){let a=p[i],b=p[(i+1)%p.length];if(kind==='blind'){
   const mid=[a[0]+(b[0]-a[0])*.50,a[1]+(b[1]-a[1])*.50];v6Panel(g,a,mid,pl+h/2,h-.008,.019,front,'blind_fixed_panel',-.01);a=mid;
  }
  if(c.front==='open')continue;
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.07)continue;
  const angle=-Math.atan2(dz,dx),out=[dz/len,-dx/len];
  // Local -Z faces outward on these oriented polygon edges.
  const outer=(i===3&&kind==='l')?b:a,sign=(i===3&&kind==='l')?-1:1;
  const anchor=new THREE.Group();anchor.name='v6_corner_door_anchor';anchor.position.set(outer[0]+out[0]*.012,pl,outer[1]+out[1]*.012);anchor.rotation.y=angle;g.add(anchor);
  const pivot=new THREE.Group();pivot.name='v6_corner_door_pivot';anchor.add(pivot);pivot.rotation.y=opened?sign*1.25:0;
  addBox(pivot,len-.003,h-.003,.019,sign*len/2,h/2,0,front,'door_panel');
  if(!v7ResolvedHandle(c)&&!/handleless|push.?open|no handle|finger pull/.test(materialName)){
   const xx=sign*(len-.045),yy=Math.min(h-.06,h*.65);
   if(/knob|eneryda/.test(materialName)){const knob=new THREE.Mesh(new THREE.SphereGeometry(.016,16,10),metal);knob.position.set(xx,yy,-.026);pivot.add(knob);}
   else if(/edge|recess|billsbro/.test(materialName))addBox(pivot,.025,.115,.008,xx,yy,-.015,metal,'ideare_edge_pull');
   else{addBox(pivot,.013,Math.min(.20,h*.36),.013,xx,yy,-.037,metal,'ideare_hardware');for(const k of [-1,1])addBox(pivot,.012,.012,.026,xx,yy+k*Math.min(.07,h*.12),-.024,metal,'handle_mount');}
  }
 }
 if(/carousel/.test(String(c.name).toLowerCase())){const r=Math.min(w,d)*.28,material=mat('#b4b6b4',.35);for(const y of [pl+.10,pl+h*.50]){const tray=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.025,40),material);tray.position.set(-w*.13,y,-d*.13);tray.name='corner_carousel_tray';g.add(tray);}}
 const pts=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];for(const y of [0,H+.03])pts.push(new THREE.Vector3(a[0],y,a[1]),new THREE.Vector3(b[0],y,b[1]));pts.push(new THREE.Vector3(a[0],0,a[1]),new THREE.Vector3(a[0],H+.03,a[1]));}
 const outline=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xb3905c}));outline.visible=model.selected===c.uid;g.add(outline);
 g.position.set(c.x/1000,0,c.z/1000);g.rotation.y=-(Number(c.rotation)||0)*Math.PI/180;return g;
}
function v6Hood(c,make){
 const H=c.height/1000,w=c.width/1000,d=c.depth/1000;
 // Reserve the lower portion of the declared cabinet height for the exposed hood.
 const lower=Math.min(.38,Math.max(.14,H*.47)),upper=Math.max(.12,H-lower),g=make({...c,height:upper*1000,plinth:false,worktop:false,shelfPositions:[]});
 for(const o of [...g.children]){
  if(/^integrated_hood|^hood_/.test(o.name)||o.isLineSegments){g.remove(o);disposeGroup(o);continue;}
  o.position.y+=lower;
 }
 const glass=new THREE.MeshStandardMaterial({color:0x111317,metalness:.38,roughness:.19}),steel=new THREE.MeshStandardMaterial({color:0xbcc1c3,metalness:.76,roughness:.29}),black=mat('#232629',.4);
 const bodyH=lower*.91,frontBottom=d*.11,frontTop=d*.49;
 // Slim visible angled black glass front; slope stays inside declared depth.
 addBox(g,w*.94,lower*.10,d*.90,0,lower*.065,0,steel,'v6_hood_lower_trim');
 addBox(g,w*.90,lower*.11,d*.62,0,lower*.15,-d*.13,black,'v6_hood_filter_body');
 addBox(g,w*.42,lower*.84,d*.58,0,lower*.58,-d*.14,steel,'v6_hood_chimney');
 const dy=lower*.875,dz=frontTop-frontBottom,len=Math.hypot(dy,dz),tilt=Math.atan2(dz,dy);
 const face=new THREE.Group();face.name='v6_hood_angled_glass';face.position.set(0,lower*.12+dy/2,(frontBottom+frontTop)/2);face.rotation.x=tilt;g.add(face);
 for(let i=0;i<3;i++)addBox(face,w*.96,len/3-.003,.018,0,(i-1)*len/3,0,glass,'v6_hood_glass_panel');
 addBox(face,w*.96,.021,.024,0,-len/2+.009,.002,steel,'v6_hood_front_trim');
 for(let i=0;i<3;i++)addBox(face,.012,.009,.004,w*.12+i*.027,len*.36,.011,steel,'v6_hood_touch_control');
 for(let i=0;i<8;i++)addBox(g,w*.60,.003,.004,0,.025,-d*.30+i*d*.047,steel,'v6_hood_filter_slats');
 for(const k of [-1,1])addBox(g,.06,.006,.035,k*w*.35,.023,d*.25,new THREE.MeshStandardMaterial({color:0xffecc0,emissive:0xffdeb2,emissiveIntensity:.8}),'v6_hood_light');
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.01,H+.01,d+.015)),new THREE.LineBasicMaterial({color:0xb3905c}));outline.position.y=H/2;outline.visible=model.selected===c.uid;g.add(outline);return g;
}

;
let commitNew;
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
const overlaps=(a,b)=>verticallyOverlaps(a,b)&&v6Overlap(a,b);
function onEdge(x,z,a,b){const vx=b.x-a.x,vz=b.z-a.z,wx=x-a.x,wz=z-a.z;return Math.abs(vx*wz-vz*wx)<=EPS*Math.max(1,Math.hypot(vx,vz))&&wx*vx+wz*vz>=-EPS&&wx*vx+wz*vz<=vx*vx+vz*vz+EPS;}
function inside(x,z,poly){return poly.some((a,i)=>onEdge(x,z,a,poly[(i+1)%poly.length]))||pointInsidePolygon(x,z,poly);}
// Clip a segment to an open rectangle; a room boundary crossing its interior
// means a concave notch or angled edge would pass through the cabinet.
function crossesInterior(a,b,r){const l=r.l+EPS,rr=r.r-EPS,t=r.t+EPS,bb=r.b-EPS;if(l>=rr||t>=bb)return false;let u0=0,u1=1;const dx=b.x-a.x,dz=b.z-a.z;for(const [p,q] of [[-dx,a.x-l],[dx,rr-a.x],[-dz,a.z-t],[dz,bb-a.z]]){if(Math.abs(p)<1e-12){if(q<0)return false;continue;}const v=q/p;if(p<0)u0=Math.max(u0,v);else u1=Math.min(u1,v);if(u0>u1)return false;}return u1-u0>1e-8;}
function fits(c,poly=roomVertices()){return v6Fits(c,poly);}
cabinetFitsPolygon=c=>fits(c);
function invalid(c,ignore=c.uid,others=model.cabinets){if(![c.width,c.depth,c.height,c.x,c.z].every(Number.isFinite)||Math.min(c.width,c.depth,c.height)<100)return 'Enter valid cabinet dimensions.';if(top(c)>model.room.height+EPS)return 'Cabinet exceeds the ceiling height.';if(!fits(c))return 'Cabinet must stay inside the room.';if(others.some(o=>o.uid!==ignore&&overlaps(c,o)))return 'Cabinet overlaps another cabinet.';if(window.IDEAREPlacementV4?.collisionFree&&!window.IDEAREPlacementV4.collisionFree(c))return 'Cabinet overlaps another object or leaves the room.';return '';}
function allFit(){return model.cabinets.every(c=>!invalid(c));}
function studioMessage(message){notify(message,true);}
function detachRun(c){model.shared=model.shared.filter(s=>!s.cabinetUids?.includes(c.uid));}
function syncRoomFields(){for(const [id,k] of [['room-width','width'],['room-depth','depth'],['room-height','height']])$('#'+id).value=model.room[k];$('#room-kind').value=model.roomType;$$('[data-shape]').forEach(b=>b.classList.toggle('selected',b.dataset.shape===model.room.shape));}
function setRoom(k,value,el){const old=model.room[k];if(k!=='shape'){if(String(value).trim()===''||!Number.isFinite(Number(value))){syncRoomFields();if(el)el.value=old;studioMessage('Enter a valid measurement in millimetres.');return false;}value=Math.round(clamp(value,...(k==='height'?[1800,8000]:[1200,20000])));}if(value===old){if(el)el.value=old;return true;}
 model.room[k]=value;const ok=allFit()&&(!window.IDEAREV8||window.IDEAREV8.roomValid())&&(!window.IDEARESpaceV10||window.IDEARESpaceV10.roomValid());model.room[k]=old;
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
commitNew = function(c){
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
function rebuildAutoRuns(){const originals=model.shared.filter(run=>!run.auto&&!model.cabinets.some(c=>(v6Special(c)||(run.type==='worktop'&&ideareSink(c)))&&run.cabinetUids?.includes(c.uid)));
 const available=model.cabinets.filter(c=>!v6Special(c)&&!ideareSink(c)&&c.category!=='wall-cabinets'&&c.category!=='tall-cabinets'&&c.rotation%360===0);
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
  if(false)auto.push({id:`auto-back-${ids[0]}`,auto:true,type:'backsplash',cabinetUids:ids});
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

;
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
/* Styles are consolidated in designer.css. */
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

;
/* IDEARE Cabinet Studio v3: streamlined edit options and dimensioned 3D objects.
   Loaded after designer-3d.js, designer-studio.js and designer-interactions-v2.js
   in the SAME ES module scope by designer/studio-engine.php. */
(() => {
'use strict';
const app=document.querySelector('#id3-app');
if(!app)return;
/* Styles are consolidated in designer.css. */

// A curated, concept-level catalogue. All measurements are W x H x D in mm,
// common planning STARTING sizes, not manufacturer specifications or constraints.
const products=[
 ['Integrated in cabinet','integrated-fridge','Fridge & freezer',600,2000,600,'fridge'],
 ['Integrated in cabinet','integrated-hob','Hob',600,850,600,'hob-unit'],
 ['Integrated in cabinet','integrated-oven','Oven',600,850,600,'oven-unit'],
 ['Integrated in cabinet','integrated-hob-oven','Hob & oven',600,850,600,'range'],
 ['Integrated in cabinet','integrated-microwave','Microwave oven',600,600,600,'microwave-unit'],
 ['Integrated in cabinet','integrated-combi','Combi oven',600,850,600,'combi-unit'],
 ['Integrated in cabinet','integrated-oven-micro','Oven & microwave oven',600,2000,600,'tower-combi'],
 ['Integrated in cabinet','integrated-dishwasher','Dishwasher',600,820,600,'dishwasher'],
 ['Integrated in cabinet','integrated-hood','Extractor hood',600,550,500,'hood'],
 ['Freestanding','free-fridge','Fridge & freezer',700,1850,700,'fridge'],
 ['Freestanding','free-fridge-side','Side-by-side refrigerator',900,1800,750,'fridge'],
 ['Freestanding','free-hob','Hob with cooker',600,900,600,'range'],
 ['Freestanding','free-hood','Extractor hood',600,550,500,'hood'],
 ['Freestanding','free-microwave','Microwave oven',520,320,420,'microwave'],
 ['Freestanding','free-dishwasher','Dishwasher',600,850,600,'dishwasher'],
 ['Freestanding','free-fridge-french','French-door refrigerator',910,1820,760,'fridge'],
 ['Freestanding','free-fridge-four','Four-door refrigerator',910,1820,750,'fridge'],
 ['Freestanding','free-upright-freezer','Upright freezer',600,1750,650,'upright-freezer'],
 ['Freestanding','free-chest-freezer','Chest freezer',950,850,600,'chest-freezer'],
 ['Freestanding','free-wine-cooler','Wine cooler',595,820,570,'wine-cooler'],
 ['Freestanding','free-beverage-cooler','Beverage cooler',480,850,510,'wine-cooler'],
 ['Freestanding','free-compact-dishwasher','Slimline dishwasher',450,850,600,'dishwasher'],
 ['Freestanding','free-wide-range','900 mm range cooker',900,900,650,'range'],
 ['Freestanding','free-washer','Front-load washing machine',600,850,600,'washer'],
 ['Freestanding','free-dryer','Tumble dryer',600,850,650,'dryer'],
 ['Freestanding','free-water-dispenser','Water dispenser',330,1050,370,'dispenser'],
 ['Integrated in cabinet','integrated-steam-oven','Steam oven unit',600,850,600,'oven-unit'],
 ['Integrated in cabinet','integrated-coffee','Coffee machine tower',600,2050,600,'coffee-tower'],
 ['Tables','table-2','Up to 2 seats',800,750,800,'table'],
 ['Tables','table-4','Up to 4 seats',1200,750,800,'table'],
 ['Tables','table-6','Up to 6 seats',1600,750,850,'table'],
 ['Tables','table-8','Up to 8 seats',2200,750,900,'table'],
 ['Tables','wall-table','Wall-mounted table',1000,750,500,'wall-table'],
 ['Dining chairs','chair-padded','Upholstered chair',470,850,520,'chair-padded'],
 ['Dining chairs','chair-wood','Non-upholstered chair',450,850,500,'chair'],
 ['Dining chairs','chair-fold','Foldable chair',450,820,480,'chair'],
 ['Dining chairs','chair-stack','Stackable chair',460,800,480,'chair'],
 ['Dining chairs','chair-kids',"Children’s chair",360,650,380,'chair'],
 ['Bar furniture','bar-table','Bar table',1200,1050,550,'bar-table'],
 ['Bar furniture','bar-stool','Bar stool',420,750,420,'bar-stool'],
 ['Bar furniture','bar-fold','Foldable bar stool',420,740,420,'bar-stool'],
 ['Bar furniture','bar-adjust','Height-adjustable stool',420,720,420,'bar-stool'],
 ['Stools & benches','stool','Stool',420,450,420,'stool'],
 ['Stools & benches','bench','Bench',1200,450,420,'bench'],
 ['Stools & benches','step-stool','Step stool',420,400,420,'step'],
 ['Extras','trolley','Trolley',600,850,400,'trolley'],
 ['Extras','step-ladder','Step stool & ladder',480,1200,700,'ladder'],
 ['Extras','island','Kitchen island',1600,900,900,'island'],
 ['Extras','wall-shelf','Wall shelves',900,40,250,'wall-shelf'],
 ['Extras','accessory-rack','Kitchen accessories rack',600,320,180,'rack'],
 ['Extras','waste','Freestanding waste sorting',500,750,450,'waste'],
 ['Wall organisers','wall-organiser','Wall organiser',800,500,140,'organiser'],
 ['Wall organisers','wall-rail','Utensil rail',800,45,100,'rail'],
 ['Wall organisers','dish-rack','Dish drainer',650,260,300,'rack'],
 ['Complementary items','lighting','Under-cabinet lighting',900,30,80,'lighting'],
 ['Complementary items','storage','Interior organiser',550,150,450,'storage'],
 ['Complementary items','safety','Child safety latch',80,45,50,'safety']
].map(([group,id,name,width,height,depth,shape])=>({group,id,name,width,height,depth,shape}));
const productById=new Map(products.map(p=>[p.id,p]));
const findProfile=item=>{
 if(item?.catalogId&&productById.has(item.catalogId))return productById.get(item.catalogId);
 const kind=String(item?.kind||item||'').toLowerCase();
 return products.find(p=>p.name.toLowerCase()===kind)||
  (/fridge|freezer|refrigerator/.test(kind)?productById.get('free-fridge'):
   /microwave/.test(kind)?productById.get('free-microwave'):
   /dishwasher/.test(kind)?productById.get('free-dishwasher'):
   /extractor|hood/.test(kind)?productById.get('free-hood'):
   /oven/.test(kind)?productById.get('integrated-oven'):
   /hob/.test(kind)?productById.get('integrated-hob'):
   /island/.test(kind)?productById.get('island'):
   /trolley/.test(kind)?productById.get('trolley'):
   /bar stool|bar chair/.test(kind)?productById.get('bar-stool'):
   /chair/.test(kind)?productById.get('chair-wood'):
   /bench/.test(kind)?productById.get('bench'):
   /stool/.test(kind)?productById.get('stool'):
   /table/.test(kind)?productById.get('table-4'):
   /rail/.test(kind)?productById.get('wall-rail'):
   /lighting|led/.test(kind)?productById.get('lighting'):
   /waste/.test(kind)?productById.get('waste'):
   /rack/.test(kind)?productById.get('accessory-rack'):
   /wall shel/.test(kind)?productById.get('wall-shelf'):
   productById.get('storage'));
};
const escV3=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const dims=p=>`${Math.round(p.width)} × ${Math.round(p.height)} × ${Math.round(p.depth)} mm`;

// Remove Search and Materials *tabs*; cabinet finishes remain available under Modify.
const catalogBar=document.querySelector('#catalog-bar');
if(catalogBar){
 const materialsButton=catalogBar.querySelector('[data-menu="5"]');
 materialsButton?.remove();
 catalogBar.querySelectorAll('.ideare-menu-extra').forEach(b=>{if(/search/i.test(b.textContent))b.remove();});
 const previousOpenMenu=openMenu;
 openMenu=(menu,hover=false)=>{
  if(menu===5)return;
  previousOpenMenu(menu,hover);
  if(![2,3,4].includes(menu))return;
  const panel=document.querySelector('#catalog-menu');if(!panel||panel.hidden)return;
  const groups=menu===2?['Integrated in cabinet','Freestanding']:
               menu===3?['Tables','Dining chairs','Bar furniture','Stools & benches']:
                        ['Extras','Wall organisers','Complementary items'];
  panel.innerHTML=`<div class="id3-megagrid ideare-catalog-v3-grid">${groups.map(group=>{
   const entries=products.filter(p=>p.group===group);
   return `<section class="ideare-catalog-v3-group"><h4>${escV3(group)}</h4>${entries.map(p=>`<button type="button" class="ideare-product-item" data-ideare-product="${p.id}"><span>${escV3(p.name)}</span><small>W ${p.width} · H ${p.height} · D ${p.depth} mm</small></button>`).join('')}</section>`;
  }).join('')}</div>`;
 };
 document.querySelector('#catalog-menu')?.addEventListener('click',e=>{
  const button=e.target.closest('button[data-ideare-product]');if(!button)return;
  const p=productById.get(button.dataset.ideareProduct);if(p)addExtra(p.id);
 });
}
// Override the old placeholder placement. Dimensions persist in the saved scene.
const oldAddExtra=addExtra;
addExtra=key=>{
 const p=productById.get(key)||findProfile(key);
 if(!p)return oldAddExtra(key);
 if(model.extras.length>=100){notify('This design has reached the 100-item limit.',true);return;}
 const width=p.width,depth=p.depth;
 if(width>model.room.width||depth>model.room.depth){notify(`${p.name} needs more floor space than the room. Try a smaller item.`,true);return;}
 const item={id:uuid(),kind:p.name,catalogId:p.id,width:p.width,height:p.height,depth:p.depth,
  x:Math.round(Math.max(width/2,Math.min(model.room.width-width/2,model.room.width*.55))/25)*25,
  z:Math.round(Math.max(depth/2,Math.min(model.room.depth-depth/2,model.room.depth*.48))/25)*25,
  rotation:0};
 // Wall fittings sit against a wall; freestanding items prefer an empty part
 // of the floor plan. Irregular room outlines use the existing polygon test.
 const wallMounted=['wall-shelf','rack','organiser','rail','lighting','safety','hood','wall-table'].includes(p.shape);
 if(wallMounted)item.z=Math.max(depth/2,Math.round((depth/2+25)/25)*25);
 const area=c=>({l:c.x-c.width/2,r:c.x+c.width/2,t:c.z-c.depth/2,b:c.z+c.depth/2});
 const blocked=c=>{if(!cabinetFitsPolygon(c))return true;if(wallMounted)return false;
  const a=area(c);return [...model.cabinets.filter(x=>x.category!=='wall-cabinets'),...model.extras.filter(x=>!['wall-shelf','rack','organiser','rail','lighting','safety','hood','wall-table'].includes(findProfile(x).shape))].some(other=>{
   const b=area(other);return Math.min(a.r,b.r)>Math.max(a.l,b.l)+10&&Math.min(a.b,b.b)>Math.max(a.t,b.t)+10;
  });
 };
 if(p.height>model.room.height&&!wallMounted){notify('This item is taller than your room. Increase ceiling height or choose another item.',true);return;}
 if(blocked(item)){
  const spots=[];for(let z=depth/2;z<=model.room.depth-depth/2;z+=150)for(let x=width/2;x<=model.room.width-width/2;x+=150){
   spots.push({x,z,distance:Math.hypot(x-model.room.width*.52,z-model.room.depth*.50)});
  }
  spots.sort((a,b)=>a.distance-b.distance);
  const place=spots.find(pos=>!blocked({...item,x:pos.x,z:pos.z}));
  if(!place){notify(`No suitable space for ${p.name}. Move other items or increase the room size.`,true);return;}
  item.x=place.x;item.z=place.z;
 }
 history();model.extras.push(item);model.selected=null;model.selectedExtra=item.id;
 closeMenu();renderAll();changed(false);
 notify(`${p.name} added at ${dims(p)}. Select it to adjust the measurements.`);
};

// Real 3D silhouettes: bodies, doors, frames, glass, legs, burners, handles,
// trays, slats and wheels. No fake rectangular placeholders or downloaded assets.
const steel=new THREE.MeshStandardMaterial({color:0x9b9f9f,metalness:.70,roughness:.31});
const darkSteel=new THREE.MeshStandardMaterial({color:0x3a3d40,metalness:.64,roughness:.33});
const glass=new THREE.MeshStandardMaterial({color:0x222e35,metalness:.25,roughness:.16});
const white=new THREE.MeshStandardMaterial({color:0xeae7df,metalness:.08,roughness:.65});
const wood=new THREE.MeshStandardMaterial({color:0xb59370,metalness:.02,roughness:.75});
const paleWood=new THREE.MeshStandardMaterial({color:0xd4bea0,metalness:.01,roughness:.8});
const upholstery=new THREE.MeshStandardMaterial({color:0x817d76,roughness:1});
const black=new THREE.MeshStandardMaterial({color:0x252525,roughness:.5});
const lit=new THREE.MeshStandardMaterial({color:0xfbe3ac,emissive:0xffd88a,emissiveIntensity:1.1});
const silver=new THREE.MeshStandardMaterial({color:0xc7c9c7,metalness:.75,roughness:.26});
function realizeItem(item){
 const p=findProfile(item),w=Math.max(.08,Number(item.width)||p.width)/1000,h=Math.max(.03,Number(item.height)||p.height)/1000,d=Math.max(.05,Number(item.depth)||p.depth)/1000;
 const g=new THREE.Group();g.name='ideare_realistic_'+p.shape;g.userData.extraId=item.id;
 const box=(w1,h1,d1,x,y,z,material=wood,name='')=>addBox(g,Math.max(.003,w1),Math.max(.003,h1),Math.max(.003,d1),x,y,z,material,name);
 const cylinder=(r,height,x,y,z,material=steel,sides=18)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(Math.max(.002,r),Math.max(.002,r),Math.max(.003,height),sides),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;};
 const tube=(x1,y1,z1,x2,y2,z2,r=.008,material=steel)=>{const a=new THREE.Vector3(x1,y1,z1),b=new THREE.Vector3(x2,y2,z2),delta=b.clone().sub(a);const obj=cylinder(r,delta.length(),(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,material,10);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());};
 const leg=(x,z,topY=h)=>box(.038,Math.max(.05,topY-.02),.038,x,(topY-.02)/2,z,steel,'furniture_leg');
 const handle=(x,y,z,span=.14)=>{tube(x-span/2,y,z,x+span/2,y,z,.008,silver);tube(x-span/2,y,z-.02,x-span/2,y,z,.006,silver);tube(x+span/2,y,z-.02,x+span/2,y,z,.006,silver);};
 const burner=(x,z,r)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,.007,6,26),darkSteel);t.rotation.x=Math.PI/2;t.position.set(x,h+.023,z);g.add(t);cylinder(r*.55,.009,x,h+.019,z,black);};
 const frontZ=d/2+.009;
 const applianceBody=()=>{box(w,h,d,0,h/2,0,white,'appliance_body');box(w*.98,.07,d*.93,0,.038,0,darkSteel,'appliance_plinth');};
 const ovenFace=(y,size)=>{const hh=Math.max(.12,size);box(w*.93,hh,.026,0,y,frontZ,steel,'oven_facade');box(w*.80,hh*.63,.029,0,y-hh*.08,frontZ+.019,glass,'oven_window');box(w*.79,.01,.01,0,y-hh*.08,frontZ+.038,darkSteel);handle(0,y+hh*.36,frontZ+.042,Math.min(.27,w*.55));for(let i=-1;i<=1;i++)cylinder(.014,.012,(w*.24)*i,y+hh*.34,frontZ+.034,darkSteel);};
 const microwaveFace=(y,size)=>{box(w*.92,size,.027,0,y,frontZ,steel,'microwave_body');box(w*.64,size*.70,.029,-w*.10,y,frontZ+.02,glass,'microwave_window');box(w*.14,size*.69,.03,w*.35,y,frontZ+.024,darkSteel,'microwave_controls');for(let k=0;k<3;k++)box(.04,.014,.006,w*.35,y+size*.20-k*size*.18,frontZ+.049,silver);};
 const fridge=()=>{applianceBody();const frontMat=p.id.startsWith('integrated-')?wood:steel;if(['free-fridge-french','free-fridge-four'].includes(p.id)){const low=h*.34,upper=h-low;for(const k of [-1,1]){box(w/2-.004,upper-.008,.027,k*w/4,low+upper/2,frontZ,frontMat,'fridge_door');box(.014,Math.min(.34,upper*.55),.032,k*.045,low+upper*.48,frontZ+.035,silver,'fridge_pull');}if(p.id==='free-fridge-four'){for(const k of [-1,1]){box(w/2-.004,low-.008,.027,k*w/4,low/2,frontZ,frontMat,'freezer_door');box(.014,low*.55,.032,k*.045,low/2,frontZ+.035,silver,'fridge_pull');}}else{box(w-.004,low-.008,.027,0,low/2,frontZ,frontMat,'freezer_door');handle(0,low*.78,frontZ+.04,w*.55);}return;}if(p.id==='free-fridge-side'){const cell=w/2;for(const sign of [-1,1]){box(cell-.004,h-.015,.027,sign*cell/2,h/2,frontZ,frontMat,'fridge_door');const x=sign*.044;box(.014,Math.min(.48,h*.30),.034,x,h*.56,frontZ+.036,silver,'fridge_pull');}box(w*.13,h*.075,.008,-w*.24,h*.65,frontZ+.020,darkSteel,'fridge_display');return;}const freeH=Math.min(h*.39,.66),mainH=h-freeH-.023;box(w*.965,freeH-.015,.027,0,freeH/2,frontZ,frontMat,'freezer_door');box(w*.965,mainH-.015,.027,0,freeH+.012+mainH/2,frontZ,frontMat,'fridge_door');box(w*.92,.007,.03,0,freeH+.009,frontZ+.02,darkSteel);handle(w*.31,freeH*.63,frontZ+.045,.14);handle(w*.31,freeH+mainH*.39,frontZ+.045,.22);};
 const hob=()=>{box(w*.96,.027,d*.88,0,h-.016,0,glass,'ceramic_hob');for(const [x,z,r] of [[-.26,-.24,.08],[.26,-.24,.07],[-.26,.24,.065],[.26,.24,.08]]){const rr=Math.min(w,d)*r;cylinder(rr,.003,x*w*.78,h+.003,z*d*.75,darkSteel);const ring=new THREE.Mesh(new THREE.TorusGeometry(rr*.77,.003,5,22),silver);ring.rotation.x=Math.PI/2;ring.position.set(x*w*.78,h+.009,z*d*.75);g.add(ring);}for(let i=0;i<4;i++)cylinder(.009,.003,(i-1.5)*w*.10,h+.010,d*.34,white);};
 const hood=()=>{const mount=Math.max(1.4,Math.min(model.room.height/1000-.14,1.95));box(w*.95,.11,d*.90,0,mount,0,steel,'hood_canopy');box(w*.43,Math.max(.13,model.room.height/1000-mount),d*.37,0,(mount+model.room.height/1000)/2,0,silver,'hood_chimney');for(let j=-1;j<=1;j++)box(w*.21,.006,d*.60,j*w*.24,mount-.063,0,darkSteel,'hood_vent');for(let j of [-1,1])box(.08,.008,.06,j*w*.36,mount-.065,d*.25,lit,'hood_light');};
 const legs=(height=h)=>{for(const x of [-w*.40,w*.40])for(const z of [-d*.35,d*.35])leg(x,z,height);};
 const table=(topY=h,top=wood)=>{box(w,.055,d,0,topY-.028,0,top,'table_top');legs(topY-.04);};
 const chair=(padded=false)=>{const seatY=h*.52;const zz=-d*.25;for(const x of [-w*.38,w*.38])for(const z of [-d*.32,d*.32])leg(x,z,seatY);box(w*.91,.062,d*.77,0,seatY,0,padded?upholstery:wood,'chair_seat');box(w*.89,h*.43,.058,0,seatY+h*.23,zz,padded?upholstery:paleWood,'chair_back');};
 const stool=(bar=false)=>{const seatY=bar?h*.96:h*.96;box(w*.86,.057,d*.82,0,seatY,0,wood,'stool_seat');for(const x of [-w*.35,w*.35])for(const z of [-d*.32,d*.32])leg(x,z,seatY-.02);if(bar){tube(-w*.34,h*.25,d*.33,w*.34,h*.25,d*.33,.01,silver);tube(-w*.34,h*.25,-d*.33,w*.34,h*.25,-d*.33,.01,silver);}};
 const wallY=Math.min(Math.max(1.1,model.room.height/1000*.57),2);
 const s=p.shape;
 if(s==='upright-freezer'){applianceBody();box(w*.97,h*.95,.027,0,h*.51,frontZ,steel,'freezer_door');box(.017,h*.32,.032,w*.38,h*.58,frontZ+.035,silver,'freezer_pull');box(w*.17,.042,.008,0,h*.92,frontZ+.02,darkSteel,'freezer_display');}
 else if(s==='chest-freezer'){applianceBody();box(w*.99,.07,d*.98,0,h-.035,0,steel,'freezer_door');box(w*.3,.018,.032,0,h-.055,d/2+.025,silver,'freezer_pull');box(.055,.04,.009,w*.33,h*.20,frontZ,darkSteel,'freezer_controls');}
 else if(s==='wine-cooler'){applianceBody();box(w*.95,h*.84,.025,0,h*.49,frontZ,steel,'appliance_body');box(w*.80,h*.72,.026,0,h*.49,frontZ+.012,glass,'wine_window');for(let i=1;i<=5;i++){const y=h*(.13+i*.12);box(w*.69,.015,.008,0,y,frontZ+.027,wood,'wine_shelf');for(let j=0;j<3;j++){const bottle=cylinder(Math.min(w*.045,.022),Math.min(d*.24,.12),(j-1)*w*.18,y+.025,frontZ+.029,darkSteel,12);bottle.rotation.x=Math.PI/2;bottle.scale.y=.32;}}box(.013,h*.46,.035,w*.41,h*.5,frontZ+.035,silver,'wine_pull');}
 else if(s==='washer'||s==='dryer'){applianceBody();box(w*.96,h*.90,.026,0,h*.52,frontZ,steel,'appliance_body');const rr=Math.min(w,h)*.29;const ring=new THREE.Mesh(new THREE.TorusGeometry(rr,.022,10,40),silver);ring.position.set(0,h*.47,frontZ+.029);g.add(ring);const disk=cylinder(rr-.012,.018,0,h*.47,frontZ+.022,glass,36);disk.rotation.x=Math.PI/2;box(w*.94,h*.13,.03,0,h*.89,frontZ,darkSteel,'washer_controls');const knob=cylinder(.026,.02,w*.26,h*.89,frontZ+.026,silver);knob.rotation.x=Math.PI/2;box(w*.20,.037,.006,-w*.23,h*.89,frontZ+.02,lit,'washer_display');}
 else if(s==='dispenser'){box(w,h,d,0,h/2,0,steel,'appliance_body');box(w*.78,h*.30,.024,0,h*.62,frontZ,darkSteel,'dispenser_recess');box(w*.75,.035,.10,0,h*.47,frontZ-.025,silver,'drip_tray');for(const k of [-1,1])box(.025,.06,.03,k*w*.18,h*.77,frontZ+.018,k<0?white:darkSteel,'water_tap');box(w*.85,h*.15,.024,0,h*.13,frontZ,steel,'appliance_body');}
 else if(s==='coffee-tower'){applianceBody();box(w*.92,h*.24,.025,0,h*.66,frontZ,steel,'appliance_body');box(w*.72,h*.12,.025,0,h*.63,frontZ+.012,darkSteel,'coffee_recess');box(w*.68,.025,.10,0,h*.57,frontZ+.012,silver,'drip_tray');for(const x of [-w*.12,w*.12])box(.025,.07,.035,x,h*.68,frontZ+.04,silver,'coffee_spout');box(w*.24,.045,.009,0,h*.75,frontZ+.02,lit,'coffee_display');for(const y of [h*.25,h*.88])box(w*.93,h*.20,.025,0,y,frontZ,paleWood,'tower_cupboard');}
 else if(s==='fridge')fridge();
 else if(s==='dishwasher'){applianceBody();box(w*.94,h*.76,.027,0,h*.48,frontZ,steel,'dishwasher_door');box(w*.94,.095,.027,0,h*.90,frontZ,darkSteel,'dishwasher_controls');handle(0,h*.83,frontZ+.035,Math.min(.29,w*.58));for(let i=0;i<5;i++)box(.012,.012,.005,-w*.27+i*w*.10,h*.91,frontZ+.034,lit);}
 else if(s==='microwave'||s==='microwave-unit'){if(s.endsWith('unit')){applianceBody();microwaveFace(h*.62,h*.48);}else{box(w,h,d,0,h/2,0,steel,'microwave_body');microwaveFace(h/2,h*.96);} }
 else if(s==='oven-unit'||s==='combi-unit'||s==='range'||s==='hob-unit'||s==='tower-combi'){
  applianceBody();if(s==='hob-unit'){box(w*.95,h*.91,d*.94,0,h*.47,0,wood);hob();}
  else if(s==='tower-combi'){ovenFace(h*.40,h*.34);microwaveFace(h*.70,h*.23);box(w*.88,h*.14,.03,0,h*.91,frontZ,paleWood,'tower_cupboard');}
  else {ovenFace(h*.47,h*.68);if(s==='range')hob();if(s==='combi-unit')microwaveFace(h*.81,h*.17);}
 }
 else if(s==='hood')hood();
 else if(s==='table'||s==='bar-table'||s==='wall-table'){if(s==='wall-table'){box(w,.048,d,0,h-.028,0,wood,'folding_table_top');for(const x of [-w*.33,w*.33])tube(x,h-.05,-d*.40,x,h*.46,-d*.04,.015,steel);}else table();}
 else if(s==='chair'||s==='chair-padded')chair(s==='chair-padded');
 else if(s==='bar-stool')stool(true);
 else if(s==='stool')stool(false);
 else if(s==='bench'){box(w,.072,d*.76,0,h-.04,0,paleWood,'bench_seat');for(const x of [-w*.41,w*.41])leg(x,0,h-.06);}
 else if(s==='step'||s==='ladder'){const steps=s==='ladder'?4:2;for(let i=0;i<steps;i++){const y=(i+1)*h/(steps+.1);box(w*(1-i*.07),.036,d*.46,0,y,(i-(steps-1)/2)*d*.21,paleWood,'ladder_step');}for(const x of [-w*.41,w*.41]){tube(x,.03,d*.37,x,h,-d*.32,.018,steel);tube(x,.03,-d*.39,x,h,-d*.32,.018,steel);}}
 else if(s==='trolley'){for(const y of [h*.19,h*.49,h*.83])box(w*.92,.038,d*.88,0,y,0,paleWood,'trolley_shelf');for(const x of [-w*.43,w*.43])for(const z of [-d*.39,d*.39]){tube(x,.12,z,x,h*.94,z,.014,steel);const wheel=cylinder(.05,.037,x,.052,z,darkSteel);wheel.rotation.x=Math.PI/2;}tube(-w*.43,h*.96,-d*.39,w*.43,h*.96,-d*.39,.013,steel);}
 else if(s==='island'){box(w*.99,h*.87,d*.98,0,h*.43,0,paleWood,'island_cabinets');box(w*1.055,.045,d*1.06,0,h+.016,0,white,'island_worktop');for(const x of [-w*.26,w*.26]){box(w*.43,h*.70,.026,x,h*.45,d/2+.018,wood,'island_front');handle(x,h*.53,d/2+.044,.16);}box(w*.94,.08,d*.93,0,.048,0,darkSteel,'island_plinth');}
 else if(s==='waste'){for(let i=0;i<2;i++){const x=(i-.5)*w*.52;box(w*.46,h*.84,d*.93,x,h*.44,0,darkSteel,'waste_bin');box(w*.48,.06,d*.96,x,h*.87,0,steel,'waste_lid');} }
 else if(s==='wall-shelf'){box(w,h,d,0,wallY,0,paleWood,'wall_shelf');for(const x of [-w*.4,w*.4]){box(.015,.19,.04,x,wallY-.095,-d*.3,steel,'shelf_bracket');}}
 else if(s==='organiser'||s==='rack'||s==='storage'){
  const baseY=s==='storage'?h*.5:wallY;box(w,.024,d,0,baseY,0,steel,'organiser_base');for(const x of [-w*.48,w*.48])box(.012,Math.max(.10,h*.75),d*.75,x,baseY+h*.20,0,silver,'organiser_side');for(let j=0;j<4;j++){const x=-w*.4+j*w*.27;box(.015,Math.max(.10,h*.65),.012,x,baseY+h*.19,-d*.22,silver,'organiser_rail');}}
 else if(s==='rail'){tube(-w*.49,wallY,0,w*.49,wallY,0,.012,steel);for(let i=0;i<5;i++){const x=(i-2)*w*.17;tube(x,wallY,0,x,wallY-.10,.006,steel);const tor=new THREE.Mesh(new THREE.TorusGeometry(.022,.005,6,16),silver);tor.position.set(x,wallY-.11,0);g.add(tor);}}
 else if(s==='lighting'){box(w,.027,d,0,wallY,0,steel,'light_bar');box(w*.89,.008,d*.62,0,wallY-.017,0,lit,'light_diffuser');}
 else if(s==='safety'){box(w,h,d,0,wallY,0,white,'safety_clip');box(w*.32,h*.7,.012,0,wallY,d/2,steel);}
 else{box(w,h,d,0,h/2,0,paleWood,'storage_cabinet');for(let i=0;i<3;i++)box(w*.9,.024,d*.90,0,h*(i+1)/4,0,wood,'storage_shelf');}
 const isMounted=['wall-shelf','rail','organiser','rack','lighting','safety','hood'].includes(s);
 const outlineHeight=s==='hood'?Math.max(1.4,Math.min(model.room.height/1000-.14,1.95)):(isMounted?wallY:h/2);
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.012,h+.018,d+.014)),new THREE.LineBasicMaterial({color:0xb3905c}));
 outline.position.y=outlineHeight;outline.visible=item.id===model.selectedExtra;outline.name='ideare_extra_outline';g.add(outline);
 g.rotation.y=-Number(item.rotation||0)*Math.PI/180;
 g.position.set(item.x/1000,0,item.z/1000);ideareTintAppliance(g,item);
 return g;
}
addExtras=()=>{for(const item of model.extras){if(!item.id)continue;const group=realizeItem(item);extraGroup.add(group);}};

// Expose only catalogue metadata / geometry for the next scoped studio upgrade.
window.IDEAREDesignerCatalogV3={products,findProfile,realizeItem};

// Drawers: always equal-height fronts and internal pull-outs. Saved custom ratios
// are ignored, and the former layout/ratio controls are removed from the UI.
drawerRatios=c=>Array.from({length:Math.max(0,Math.min(6,Math.round(Number(c.drawers)||0)))},()=>1);
const previousStandardCab=standardCab;
standardCab=t=>{const c=previousStandardCab(t);c.drawerLayout='equal';c.drawerRatios=[];return c;};
const previousApplyHistory=applyHistory;
applyHistory=serialized=>{
 const s=JSON.parse(serialized);(s.cabinets||[]).forEach(c=>{c.drawerLayout='equal';c.drawerRatios=[];});
 previousApplyHistory(JSON.stringify(s));
};
const previousSceneData=sceneData;
sceneData=()=>{const s=previousSceneData();s.cabinets.forEach(c=>{c.drawerLayout='equal';c.drawerRatios=[];});return s;};

// Simplified, IKEA-inspired (not copied) cabinet options: a short list of
// selected components and measurements, with the existing functional editors
// revealed one at a time. This avoids duplicating business logic.
const selectedInspector=document.querySelector('#selected-inspector');
const accordion=document.querySelector('#inspector-tabs');
let activeEditor=null,previousUid=null;
const optionSections=[
 ['Front','door','1'],['Handles','handle','1'],['Worktop & plinth','worktop','5'],
 ['Frame & finish','frame','3'],['Interior','interior','2'],['Measurements','size','0'],['Additional fittings','fittings','4']
];
const optionIcon={door:'▥',handle:'⌇',worktop:'▭',frame:'◫',interior:'≡',size:'⤢',fittings:'✧'};
function optionValue(key,c){
 if(key==='door')return c.front==='drawers'?`${Number(c.drawers)||3} equal-height drawers`:c.front==='open'?'Open shelving':`${c.doorCount||2} door${Number(c.doorCount)===1?'':'s'}`;
 if(key==='handle')return v7Handle(c)?.name||catalog.handles.find(x=>Number(x.id)===Number(c.handle))?.name||'Choose a handle';
 if(key==='worktop')return (c.worktop?`${c.worktopType||'Worktop'}`:'No worktop')+(c.plinth?' · Plinth':'');
 if(key==='frame')return `${String(c.carcass||'Plywood').replace(/\b\w/g,x=>x.toUpperCase())} · ${c.material?.product_name||'Standard finish'}`;
 if(key==='interior')return `${c.shelves||0} shelves · ${c.partitions||0} dividers${c.front==='drawers'?' · Equal drawers':''}`;
 if(key==='size')return dims(c);
 return [c.led?'LED lights':null,c.basket?'Pull-out basket':null].filter(Boolean).join(', ')||'Optional accessories';
}
const optionShell=document.createElement('div');optionShell.id='ideare-option-shell';
optionShell.innerHTML='<div id="ideare-options-list"></div><div id="ideare-option-toolbar" hidden><button id="ideare-option-back" type="button">← All cabinet options</button><strong id="ideare-option-title"></strong></div>';
accordion?.parentNode?.insertBefore(optionShell,accordion);
function renderOptions(){
 if(!selectedInspector)return;
 const c=selected();if(!c)return;
 if(c.uid!==previousUid){previousUid=c.uid;activeEditor=null;}
 const l=document.querySelector('#ideare-options-list');
 if(l){l.innerHTML=`<p class="ideare-modify-eyebrow">MODIFY CABINET</p><h4 class="ideare-modify-title">Options</h4><div class="ideare-option-rows">${optionSections.filter(([,key])=>key!=='worktop'||c.category!=='wall-cabinets').filter(([,key])=>key!=='handle'||c.front!=='open').map(([title,key,index])=>`<button type="button" class="ideare-option-row" data-option-editor="${index}" data-option-title="${escV3(title)}" data-option-focus="${key}"><span class="ideare-option-glyph" aria-hidden="true">${optionIcon[key]}</span><span class="ideare-option-body"><strong>${escV3(title)}</strong><small>${escV3(optionValue(key,c))}</small></span><span class="ideare-option-chevron" aria-hidden="true">›</span></button>`).join('')}</div><p class="ideare-modify-footnote">Concept measurements and fittings are reviewed by IDEARE before manufacture.</p>`;}
 selectedInspector.classList.toggle('ideare-editor-open',activeEditor!==null);
 selectedInspector.dataset.optionFocus=activeEditor?.focus||'';
 const t=document.querySelector('#ideare-option-toolbar');if(t){t.hidden=activeEditor===null;document.querySelector('#ideare-option-title').textContent=activeEditor?.title||'';}
 [...accordion.querySelectorAll(':scope > details')].forEach((d,i)=>{d.classList.toggle('ideare-active-detail',activeEditor?.index===String(i));if(activeEditor?.index===String(i))d.open=true;});
 const ratioLabel=document.querySelector('[data-property="drawerLayout"]')?.closest('label');if(ratioLabel)ratioLabel.hidden=true;
 const drawerEditor=document.querySelector('#drawer-editor');if(drawerEditor){drawerEditor.innerHTML='';drawerEditor.hidden=true;}
 const shelfEditor=document.querySelector('#shelf-editor');if(shelfEditor)shelfEditor.hidden=true;
 const frontCount=document.querySelector('[data-property="drawers"]')?.closest('label');if(frontCount)frontCount.hidden=c.front!=='drawers';
 const info=document.querySelector('.studio-style-actions');if(info)info.hidden=activeEditor?.index!=='3';
}
const oldRenderInspectorV3=renderInspector;
renderInspector=()=>{oldRenderInspectorV3();renderOptions();const extra=extraSelected();if(extra){
 const panel=document.querySelector('#extra-inspector');if(panel){
  const note=panel.querySelector('.id3-inspector-title small');if(note)note.textContent=`Typical starting size · ${dims(extra)} · adjustable`;
  const oldNote=panel.querySelector('.id3-note');if(oldNote)oldNote.textContent='Conceptual 3D furniture / appliance. Dimensions are starting values, not manufacturer specifications.';
  const buttons=panel.querySelector('.id3-final-buttons');if(buttons&&!panel.querySelector('#ideare-extra-rotate'))buttons.insertAdjacentHTML('afterbegin','<button type="button" class="id3-btn id3-secondary" id="ideare-extra-rotate">↻ Rotate 90°</button>');
 }
}};
selectedInspector?.addEventListener('click',e=>{
 const action=e.target.closest('[data-option-editor]');if(action){activeEditor={index:action.dataset.optionEditor,title:action.dataset.optionTitle,focus:action.dataset.optionFocus};renderOptions();accordion?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
 if(e.target.closest('#ideare-option-back')){activeEditor=null;renderOptions();selectedInspector?.scrollTo?.({top:0,behavior:'smooth'});}
});
// The original extra editor has a 100 mm minimum, which is too high for
// real thin objects such as shelves, light bars and safety latches.
document.querySelector('#extra-inspector')?.addEventListener('change',e=>{
 const input=e.target.closest('input[data-extra]'),item=extraSelected();if(!input||!item)return;
 e.stopImmediatePropagation();const key=input.dataset.extra,number=Number(input.value);
 if(!Number.isFinite(number)||input.value.trim()===''){input.value=item[key];notify('Enter a valid measurement in millimetres.',true);return;}
 const limit=['x','z'].includes(key)?[0,key==='x'?model.room.width:model.room.depth]:[10,6000];
 const value=Math.max(limit[0],Math.min(limit[1],Math.round(number)));
 const candidate={...item,[key]:value};
 if(key==='width'||key==='depth'||key==='x'||key==='z'){
  // Use the same polygon geometry check as cabinetry, including angled rooms.
  if(!cabinetFitsPolygon(candidate)){input.value=item[key];notify('This item would extend beyond the room. Try another size or position.',true);return;}
 }
 if(key==='height'&&value>model.room.height){input.value=item[key];notify('Item height exceeds your room.',true);return;}
 if(value===item[key])return;
 history();item[key]=value;renderAll();changed(false);
},true);
document.querySelector('#extra-inspector')?.addEventListener('click',e=>{if(!e.target.closest('#ideare-extra-rotate'))return;
 const obj=extraSelected();if(!obj)return;history();obj.rotation=(Number(obj.rotation||0)+90)%360;renderAll();changed(false);});
// The selected object's compact options remain usable after changing panels.
const oldShowStep=showStep;
showStep=n=>{if(Number(n)!==3)activeEditor=null;oldShowStep(n);};
renderInspector();
})();

;
/* IDEARE Studio v4 — direct object manipulation, true wall mounts, collision rules,
   cabinet-specific hardware and product model images. Runs after the v3 extension
   in the same ES module scope. All scene coordinates are millimetres. */
(() => {
'use strict';
const app=document.querySelector('#id3-app'), canvas=document.querySelector('#designer-canvas');
if(!app||!canvas)return;
/* Styles are consolidated in designer.css. */
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
 const bounds=ideareExtraBounds(c);if(bounds)return [bounds.y0,bounds.y1];
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
const ideareBoundsCache=new Map();
function ideareExtraBounds(c){
 const k=[c.catalogId||c.kind,c.width,c.height,c.depth,model.room.height].join('|');if(ideareBoundsCache.has(k))return ideareBoundsCache.get(k);
 let g;try{g=api.realizeItem({...c,x:0,z:0,rotation:0,applianceColor:null});g.updateMatrixWorld(true);const box=new THREE.Box3();box.makeEmpty();g.traverse(o=>{if(!o.isMesh||!o.visible)return;o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));});if(box.isEmpty())return null;
 const b={l:box.min.x*1000,r:box.max.x*1000,t:box.min.z*1000,b:box.max.z*1000,y0:box.min.y*1000,y1:box.max.y*1000};if(ideareBoundsCache.size>=256)ideareBoundsCache.clear();ideareBoundsCache.set(k,b);return b;
 }catch(error){console.warn('IDEARE appliance envelope',error);return null;}finally{g?.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
}
function ideareEnvelope(c){if(isCab(c))return c;const b=ideareExtraBounds(c);if(!b)return null;const angle=(Number(c.rotation)||0)*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),u=(b.l+b.r)/2,v=(b.t+b.b)/2;return {...c,width:b.r-b.l,depth:b.b-b.t,x:c.x+u*co-v*si,z:c.z+u*si+v*co};}
function noCollision(c,ignoreId=c.uid||c.id){
 if(![c.x,c.z,c.width,c.depth,c.height].every(Number.isFinite)||Math.min(c.width,c.depth,c.height)<10)return false;
 const envelope=ideareEnvelope(c),ay=visibleHeight(c);if(!envelope||ay[0]<-1||ay[1]>model.room.height+1||!v6Fits(envelope)||!ideareCabinetInterior(c))return false;
 return ![...model.cabinets,...model.extras].some(o=>{if((o.uid||o.id)===ignoreId)return false;const by=visibleHeight(o),other=ideareEnvelope(o);return other&&Math.min(ay[1],by[1])-Math.max(ay[0],by[0])>1&&v6Overlap(envelope,other,.01);});
}
// A cabinet is wall-mounted only if the entire back is flush with a real,
// solid wall segment (not an opening or an imaginary room boundary).
window.IDEAREPlacementV4={valid:c=>noCollision(c)&&(!wallMounted(c)||hasWallSupport(c)),collisionFree:c=>noCollision(c),findOpenSpot};
function backFace(c){const r=measure(c),rot=((Math.round((Number(c.rotation)||0)/90)%4)+4)%4;return rot===0?{axis:'z',v:r.t}:rot===1?{axis:'x',v:r.r}:rot===2?{axis:'z',v:r.b}:{axis:'x',v:r.l};}
function hasWallSupport(c){if(!wallMounted(c))return true;
 const r=measure(c),back=backFace(c),eps=3;
 return actualWalls().some(w=>w.axis===back.axis&&Math.abs(back.v-w.v)<eps&&(w.axis==='z'?r.l>=w.min-eps&&r.r<=w.max+eps:r.t>=w.min-eps&&r.b<=w.max+eps));}
function attachToWall(c,x,z,maxDistance=Infinity,drag=false,lock=null){
 const placements=[],previous=backFace(c);
 for(const w of actualWalls()){
  if(lock&&(w.axis!==lock.axis||Math.abs(w.v-lock.v)>3))continue;
  for(const rot of (w.axis==='z'?[0,180]:[90,270])){
   if(lock&&rot!==lock.rotation)continue;
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
   const guides=ideareMoveTargets(q,along).filter(v=>v>=lo-.01&&v<=hi+.01);
   const snapped=ideareNearest(q[along],guides,drag?30:45,drag?75:120);
   if(Math.abs(snapped-q[along])>.001)targets.unshift({v:clampV(snapped,lo,hi),bonus:Math.abs(snapped-raw)+Math.abs(q[along]-raw)+1});
   for(const candidate of targets){const v={...q,[along]:candidate.v};if(!noCollision(v)||!hasWallSupport(v))continue;
    const dist=Math.abs(candidate.v-raw)+(drag&&same?Math.min(normalDist,120):normalDist)+(same?-110:0)-candidate.bonus;
    placements.push({q:v,dist});
   }
  }
 }
 placements.sort((a,b)=>a.dist-b.dist);return placements[0]?.q||null;
}
function snapNearby(c,x,z){
 const base={...c,x:clampV(x,0,model.room.width),z:clampV(z,0,model.room.depth)};
 if(wallMounted(c))return attachToWall(c,base.x,base.z,Infinity,true);
 const env=ideareEnvelope(base);if(!env)return null;const m=measure(env),dx0=env.x-base.x,dz0=env.z-base.z;
 const xs=ideareMoveTargets(base,'x'),zs=ideareMoveTargets(base,'z');
 // Include the rendered envelope as a collision-safe alternative to nominal edge alignment.
 xs.push(m.w/2-dx0,model.room.width-m.w/2-dx0);zs.push(m.d/2-dz0,model.room.depth-m.d/2-dz0);
 for(const other of [...model.cabinets,...model.extras]){if((other.uid||other.id)===(c.uid||c.id))continue;const o=ideareEnvelope(other);if(!o)continue;const r=measure(o);xs.push(r.l-m.w/2-dx0,r.r+m.w/2-dx0);zs.push(r.t-m.d/2-dz0,r.b+m.d/2-dz0);}
 const x1=ideareNearest(base.x,xs),z1=ideareNearest(base.z,zs),x2=clampV(base.x,m.w/2-dx0,model.room.width-m.w/2-dx0),z2=clampV(base.z,m.d/2-dz0,model.room.depth-m.d/2-dz0);
 for(const [X,Z] of [[x1,z1],[x1,base.z],[base.x,z1],[base.x,base.z],[x2,z2],[x2,base.z],[base.x,z2]]){const q={...base,x:X,z:Z};if(noCollision(q))return q;}
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
  if(noCollision(c)&&(!wallMounted(c)||hasWallSupport(c)))continue;
  const fit=findOpenSpot(c);
  if(fit){Object.assign(c,{x:fit.x,z:fit.z,rotation:fit.rotation});fixed++;}else notFixed++;
 }
 if(fixed)renderAll();
 if(notFixed)notify(`${notFixed} item(s) could not be placed inside the room. Review their placement.`,true);
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
   if(o.userData?.uid){const c=model.cabinets.find(x=>x.uid===o.userData.uid);if(c)return {c,point:h.point};break;}
   o=o.parent;
  }
 }return null;
}
function begin(e,c,hit=null){if(e.button!==0||model.step!==3||!camera||!controls)return false;
 e.preventDefault();e.stopImmediatePropagation();
 const mounted=wallMounted(c),y=clampV(hit?.y??(visibleHeight(c)[0]+visibleHeight(c)[1])/2000,.05,model.room.height/1000-.05);
 const origin=rayFloor(e,y)||new THREE.Vector3(c.x/1000,y,c.z/1000),anchor=hit?.clone()||new THREE.Vector3(c.x/1000,y,c.z/1000);
 const lock=mounted?{...backFace(c),rotation:((Number(c.rotation)||0)%360+360)%360}:null;
 const rect=canvas.getBoundingClientRect(), project=p=>{const v=p.clone().project(camera);return {x:v.x*rect.width/2,y:-v.y*rect.height/2};};
 const wallPlane=lock?new THREE.Plane(new THREE.Vector3(lock.axis==='x'?1:0,0,lock.axis==='z'?1:0),-anchor[lock.axis]):null;
 const wallStart=wallPlane?raycaster.ray.intersectPlane(wallPlane,new THREE.Vector3()):null;
 const base=project(anchor),vectors={};for(const axis of ['x','z']){const p=anchor.clone();p[axis]+=.5;const v=project(p);vectors[axis]={x:(v.x-base.x)/500,y:(v.y-base.y)/500};}
 const isExtra=!isCab(c);if(isExtra){if(model.selectedExtra!==c.id)selectExtra(c.id);}else if(model.selected!==c.uid)select(c.uid);
 controls.enabled=false;action={id:c.id||c.uid,isExtra,pointer:e.pointerId,y,start:origin,origin:{x:c.x,z:c.z},last:{x:c.x,z:c.z},screen:{x:e.clientX,y:e.clientY},recorded:false,lock,vectors,wallPlane,wallStart};
 try{canvas.setPointerCapture(e.pointerId);}catch(_){}
 canvas.classList.add('ideare-dragging-surface');selectedMove?.classList.add('ideare-direct-moving');$v('#studio-hover')?.setAttribute('hidden','');return true;
}
window.addEventListener('pointerdown',e=>{
 if(model.step!==3||action)return;
 if(window.IDEAREV8?.pointerDown(e))return;
 if(e.target===canvas){const hit=locateHit(e);if(hit)begin(e,hit.c,hit.point);}
 else if(e.target.closest?.('#object-move')){const c=model.extras.find(x=>x.id===model.selectedExtra)||model.cabinets.find(x=>x.uid===model.selected);
  if(c)begin(e,c);
 }
},true);
const oneFrame=e=>{
 const a=action;if(!a)return;
 if(!a.recorded&&Math.hypot(e.clientX-a.screen.x,e.clientY-a.screen.y)<3)return;
 const c=a.isExtra?model.extras.find(o=>o.id===a.id):model.cabinets.find(o=>o.uid===a.id);
 if(!c)return;
 const q=rayFloor(e,a.y);let x,z,valid;
 const dx=e.clientX-a.screen.x,dy=e.clientY-a.screen.y;
 if(a.lock){
  const along=a.lock.axis==='z'?'x':'z',v=a.vectors[along],den=v.x*v.x+v.y*v.y;
  if(den<.000004&&!a.wallStart)return;
  let mmDelta=den>.000004?(dx*v.x+dy*v.y)/den:0;
  if(a.wallStart&&a.wallPlane&&Math.abs(raycaster.ray.direction[a.lock.axis])>.075){const at=raycaster.ray.intersectPlane(a.wallPlane,new THREE.Vector3());if(at&&Math.abs(at[along]-a.wallStart[along])<Math.max(model.room.width,model.room.depth)/500)mmDelta=(at[along]-a.wallStart[along])*1000;}
  x=a.origin.x+(along==='x'?mmDelta:0);z=a.origin.z+(along==='z'?mmDelta:0);
  valid=attachToWall(c,x,z,Infinity,true,a.lock);
  const seg=actualWalls().find(w=>w.axis===a.lock.axis&&Math.abs(w.v-a.lock.v)<3&&(along==='x'?a.origin.x:a.origin.z)>=w.min-3&&(along==='x'?a.origin.x:a.origin.z)<=w.max+3);
  const raw=along==='x'?x:z;
  // A deliberate pull past the end can transfer to a nearby perpendicular wall.
  if(seg&&(raw<seg.min-160||raw>seg.max+160)&&q&&Math.hypot(q.x-a.start.x,q.z-a.start.z)<Math.max(model.room.width,model.room.depth)/1000*2){
   const xx=a.origin.x+(q.x-a.start.x)*1000,zz=a.origin.z+(q.z-a.start.z)*1000;
   const other=attachToWall(c,xx,zz,300,false);if(other&&other.rotation!==a.lock.rotation)valid=other;
  }
 }else{
  if(q&&Math.hypot(q.x-a.start.x,q.z-a.start.z)<Math.max(model.room.width,model.room.depth)/1000*2){x=a.origin.x+(q.x-a.start.x)*1000;z=a.origin.z+(q.z-a.start.z)*1000;}
  else{const u=a.vectors.x,v=a.vectors.z,det=u.x*v.y-u.y*v.x;if(Math.abs(det)<.000004)return;x=a.origin.x+(dx*v.y-dy*v.x)/det;z=a.origin.z+(u.x*dy-u.y*dx)/det;}
  valid=snapNearby(c,x,z)||snapNearby(c,x,c.z)||snapNearby(c,c.x,z);
 }
 if(!valid){ideareClearGuides();canvas.classList.add('ideare-placement-blocked');return;}
 ideareShowGuides(valid,a.lock?[a.lock.axis==='z'?'x':'z']:['x','z']);
 canvas.classList.remove('ideare-placement-blocked');
 if(valid.x===c.x&&valid.z===c.z&&valid.rotation===c.rotation)return;
 if(!a.recorded){history();a.recorded=true;if(c.uid){model.shared=model.shared.filter(s=>!s.cabinetUids?.includes(c.uid));drawScene();}}
 Object.assign(c,{x:valid.x,z:valid.z,rotation:valid.rotation});
 const g=a.isExtra?extraGroup.children.find(o=>o.userData.extraId===c.id):meshById.get(c.uid);
 if(g){g.position.x=c.x/1000;g.position.z=c.z/1000;g.rotation.y=-(Number(c.rotation)||0)*Math.PI/180;}
 a.last={x:c.x,z:c.z};
 const badge=$v('#selection-badge');if(badge)badge.title=`Position ${Math.round(c.x)} × ${Math.round(c.z)} mm`;
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
 action=null;ideareClearGuides();controls&&(controls.enabled=true);
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
window.addEventListener('blur',()=>{if(action)endDrag(null,true);});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&action){e.preventDefault();e.stopImmediatePropagation();endDrag(null,true);}},true);
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
 // Wall units follow their wall orientation automatically; no manual rotation.
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
makeCabinet=function buildCabinetV4(c,skipHood=false){
 if(v6Special(c))return v6CornerModel(c);
 if(!skipHood&&/hood|extractor/i.test(c.name)&&c.category==='wall-cabinets')return v6Hood(c,small=>buildCabinetV4(small,true));
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
 if(!handleless&&!v7ResolvedHandle(c)){
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

;
/* IDEARE v5: category-specific catalog, no new dining or kitchen-extra items.
 * Loaded in the existing ES module AFTER v4, before boot().
 * Keep v2/v3/v4 geometry and saved-scene compatibility. */
(() => {
  'use strict';
  const bar = document.querySelector('#catalog-bar');
  const panel = document.querySelector('#catalog-menu');
  if (!bar || !panel) return;
  /* Styles are consolidated in designer.css. */
  const categoriesV5 = [
    ['base-cabinets','Base Cabinets','<rect x="5" y="5" width="14" height="14" rx="1"/><path d="M5 12h14M10 9h4M10 16h4M7 19v2m10-2v2"/>'],
    ['wall-cabinets','Wall / Upper Cabinets','<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M12 4v13m-2-7v3m4-3v3M3 20h18"/>'],
    ['tall-cabinets','Tall / Pantry Cabinets','<rect x="6" y="2" width="12" height="20" rx="1"/><path d="M6 14h12M15 7v4m0 6v2"/>'],
    ['special-cabinets','Specialty & Corner Cabinets','<path d="M3 4h10v7h8v9H3zM3 11h10v9m-6-5h2m7-1h2"/>'],
    ['appliances','Appliances','<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 8h16m-11-2h.01M12 6h.01M15 6h.01"/><rect x="7" y="11" width="10" height="7" rx="1"/>'],
    ['backsplash','Backsplash','<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14h18M9 4v5m6 0v5m-6 0v6"/>']
  ];
  const known = new Set(categoriesV5.map(x => x[0]));
  const slugFor = value => {
    const key = String(value || '').toLowerCase();
    if (known.has(key)) return key;
    if (/wall|upper/.test(key)) return 'wall-cabinets';
    if (/tall|pantry|high/.test(key)) return 'tall-cabinets';
    if (/special|corner/.test(key)) return 'special-cabinets';
    if (/base/.test(key)) return 'base-cabinets';
    return null;
  };
  // Keep the existing photo action, but move it outside the category header.
  const photo = Array.from(bar.querySelectorAll(':scope > button')).find(b => /photo studio/i.test(b.textContent));
  if (photo) {
    photo.remove();
    const target = document.querySelector('.studio-controls');
    if (target) {
      photo.className = 'ideare-photo-v5';
      photo.textContent = 'Photo';
      photo.setAttribute('aria-label','Capture a photo of the 3D design');
      target.insertBefore(photo,target.querySelector('[data-next="4"]'));
    }
  }
  // Remove old controls, including v2/v3 dining/extras/search/materials tabs.
  // The underlying model factories stay available for historical saved designs.
  Array.from(bar.querySelectorAll(':scope > button')).forEach(button => button.remove());
  bar.classList.add('ideare-catalog-v5');
  panel.setAttribute('aria-label','Catalog items');
  const buttons = new Map();
  let current = null;
  let pointerMode = 'mouse';
  let pendingKeyboardFocus = false;
  const openPrevious = openMenu;
  const closePrevious = closeMenu;
  function activeButton() { return buttons.get(current); }
  function positionPanel() {
    const button = activeButton();
    if (!button || panel.hidden) return;
    const bounds = button.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const requested = current === 'appliances' ? 785 : current === 'backsplash' ? 620 : 420;
    const width = Math.min(requested, Math.max(1,viewportWidth - 16));
    const left = Math.max(8,Math.min(bounds.left,viewportWidth - width - 8));
    // The popup touches the button's bottom edge, without a hover gap.
    panel.style.setProperty('--v5-menu-top',`${Math.floor(bounds.bottom - 1)}px`);
    panel.style.setProperty('--v5-menu-left',`${Math.round(left)}px`);
    panel.style.setProperty('--v5-menu-width',`${Math.round(width)}px`);
    panel.style.setProperty('--v5-menu-max-height',`${Math.max(100,window.innerHeight - bounds.bottom - 10)}px`);
  }
  function clearActive() {
    current = null;
    panel.classList.remove('ideare-category-only','ideare-backsplash-menu');
    for (const button of buttons.values()) {
      button.classList.remove('active');
      button.setAttribute('aria-expanded','false');
    }
  }
  closeMenu = () => { closePrevious(); clearActive(); };
  function filterCabinets(key) {
    const all = Array.from(panel.querySelectorAll('[data-template]'));
    let count = 0;
    for (const button of all) {
      const t = template(button.dataset.template);
      const slug = t ? slugFor(category(t)) : null;
      button.hidden = slug !== key;
      if (!button.hidden) count++;
    }
    const grid = panel.querySelector('.id3-megagrid');
    if (grid) for (const group of grid.children) {
      group.hidden = !group.querySelector('[data-template]:not([hidden])');
    }
    panel.classList.add('ideare-category-only');
    if (!count) {
      const p = document.createElement('p');
      p.className = 'ideare-catalog-v5-empty';
      p.textContent = catalog.templates.length ? 'No cabinets in this category are available.' : 'The cabinet catalog is still loading.';
      panel.append(p);
    }
  }
  function openCategory(key) {
    if (!known.has(key) || model.step !== 3) return;
    if (current === key && !panel.hidden) { positionPanel(); return; }
    // Reset the original engine's numeric active-menu state so switching
    // between two cabinet categories always regenerates the template menu.
    closeMenu();
    if(key==='backsplash'){panel.hidden=false;model.activeMenu=6;panel.classList.add('ideare-backsplash-menu');v7RenderBacksplash(panel);}else openPrevious(key === 'appliances' ? 2 : 1, false);
    if (panel.hidden) return;
    current = key;
    if (key !== 'appliances' && key !== 'backsplash') filterCabinets(key);
    const button = activeButton();
    button.classList.add('active');
    button.setAttribute('aria-expanded','true');
    positionPanel();
    if (pendingKeyboardFocus) {
      pendingKeyboardFocus = false;
      panel.querySelector('button:not([hidden])')?.focus();
    }
  }
  // Preserve the built-in Replace action, which still calls openMenu(1).
  // Removed menu IDs cannot be reopened through older code paths.
  openMenu = (menu, hover = false) => {
    if (Number(menu) === 1) openCategory(slugFor(selected()?.category) || 'base-cabinets');
    else if (Number(menu) === 2) openCategory('appliances');
    else if (Number(menu) === 6) openCategory('backsplash');
    else closeMenu();
  };
  function leavesActiveArea(event) {
    const next = event.relatedTarget;
    const button = activeButton();
    if (next instanceof Node && (panel.contains(next) || button?.contains(next))) return false;
    return true;
  }
  for (const [key,label,paths] of categoriesV5) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ideare-catalog-category';
    button.dataset.categoryV5 = key;
    button.title = label;
    button.setAttribute('aria-controls','catalog-menu');
    button.setAttribute('aria-expanded','false');
    button.innerHTML = `<span class="ideare-catalog-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span><span>${safe(label)}</span>`;
    buttons.set(key,button);
    bar.insertBefore(button,panel);
    button.addEventListener('pointerenter',event => {
      if (event.pointerType === 'mouse') { pointerMode = 'mouse'; openCategory(key); }
    });
    button.addEventListener('pointerdown',event => { pointerMode = event.pointerType || 'mouse'; });
    button.addEventListener('pointerleave',event => {
      if (event.pointerType === 'mouse' && current === key && leavesActiveArea(event)) closeMenu();
    });
    button.addEventListener('click',event => {
      // A mouse click on a hover-open category should not instantly close it.
      // Touch and keyboard users get ordinary toggle behavior.
      if (current === key && !panel.hidden && (pointerMode !== 'mouse' || event.detail === 0)) closeMenu();
      else openCategory(key);
    });
    button.addEventListener('keydown',event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (current === key && !panel.hidden) panel.querySelector('button:not([hidden])')?.focus();
        else { pendingKeyboardFocus = true; openCategory(key); }
      }
    });
  }
  panel.addEventListener('pointerleave',event => {
    if (event.pointerType === 'mouse' && leavesActiveArea(event)) closeMenu();
  });
  // Close when keyboard focus leaves the whole catalog.
  bar.addEventListener('focusout',event => {
    const next = event.relatedTarget;
    if (next instanceof Node && !bar.contains(next)) closeMenu();
  });
  bar.addEventListener('keydown',event => {
    if (event.key === 'Escape' && current) {
      const button = activeButton();
      closeMenu();
      button?.focus();
      event.stopPropagation();
    }
  });
  window.addEventListener('resize',positionPanel,{passive:true});
  window.addEventListener('blur',() => { if(current) closeMenu(); });
  document.querySelectorAll('[data-step],[data-next]').forEach(button => button.addEventListener('click',closeMenu));
  closeMenu();
})();

;
/* IDEARE v7. Parametric handles, glazed doors, microwave bays and backsplashes.
 * Added after v5, before boot; persisted in existing cabinet JSON. */
const v7Handles=[
 ['bar-black','Straight bar · matte black','bar',0x252629],['bar-steel','Straight bar · brushed steel','bar',0xb7bdc0],['bar-brass','Straight bar · brass','bar',0xb28b50],
 ['square-black','Square D pull · black','square',0x252629],['square-steel','Square D pull · steel','square',0xb7bdc0],['arch-brass','Arched pull · brass','arch',0xb28b50],['arch-steel','Arched pull · steel','arch',0xb7bdc0],
 ['knob-brass','Round knob · brass','knob',0xb28b50],['knob-black','Round knob · black','knob',0x252629],['knob-steel','Square knob · steel','squareknob',0xb7bdc0],
 ['cup-bronze','Cup pull · bronze','cup',0x896248],['cup-black','Cup pull · black','cup',0x252629],['edge-black','Edge pull · black','edge',0x252629],['edge-steel','Edge pull · aluminium','edge',0xb7bdc0],
 ['long-black','Long rail · matte black','long',0x252629],['long-brass','Long rail · brass','long',0xb28b50],['leather-brown','Leather loop · tan','leather',0xa87442],['push','Handleless · push to open','none',0x252629]
].map(([id,name,kind,color])=>({id,name,kind,color}));
function v7Handle(c){return v7Handles.find(p=>p.id===c?.handleVariant)||null;}
function v7ResolvedHandle(c){const custom=v7Handle(c);if(custom)return custom;if(!v7Glass(c))return null;const name=String(catalog.handles.find(x=>Number(x.id)===Number(c.handle))?.name||'').toLowerCase(),finish=/gold|brass/.test(name)?'brass':/black/.test(name)?'black':'steel';const key=/handleless|push.?open/.test(name)?'push':/knob/.test(name)?(finish==='steel'?'knob-steel':'knob-'+finish):/edge|recess|finger/.test(name)?(finish==='black'?'edge-black':'edge-steel'):'bar-'+finish;return v7Handles.find(p=>p.id===key)||v7Handles[0];}
function v7KindLabel(c){const t=template(c.templateId)||{};return `${t.slug||''} ${t.name||''} ${c.name||''}`.toLowerCase();}
function v7Glass(c){return /glass/.test(v7KindLabel(c))||/glass/i.test(catalog.doors.find(x=>Number(x.id)===Number(c.doorStyle))?.name||'');}
function v7Micro(c){return c.category==='wall-cabinets'&&/microwave/.test(v7KindLabel(c));}
function v7Base(c){return c&&c.category!=='wall-cabinets'&&c.category!=='tall-cabinets';}
function v7Normalize(c){c.worktop=v7Base(c);c.plinth=c.category!=='wall-cabinets'&&!ideareFridgeHousing(c);if(!c.plinthHeight||c.plinthHeight<50)c.plinthHeight=100;return c;}
// Hardware is built in a local coordinate frame: X = length, Z = outward.
function v7Hardware(p,len=.16){const g=new THREE.Group();g.name='ideare_v7_hardware';const m=new THREE.MeshStandardMaterial({color:p.color,metalness:p.kind==='leather'?.05:.78,roughness:p.kind==='leather'?.72:.3});
 const box=(w,h,d,x,y,z)=>addBox(g,w,h,d,x,y,z,m,'v7_hardware_part');
 const cyl=(r,h,x,y,z,axis='z')=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),m);if(axis==='z')o.rotation.x=Math.PI/2;else if(axis==='x')o.rotation.z=Math.PI/2;o.position.set(x,y,z);g.add(o);return o;};
 const rod=(a,b,r=.006)=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),delta=v.clone().sub(u),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),12),m);o.position.copy(u.add(v).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());g.add(o);};
 if(p.kind==='none')return g;
 if(p.kind==='knob'||p.kind==='squareknob'){cyl(.008,.018,0,0,.009);if(p.kind==='knob'){const o=new THREE.Mesh(new THREE.SphereGeometry(.018,20,12),m);o.scale.z=.52;o.position.z=.024;g.add(o);}else box(.032,.032,.014,0,0,.023);}
 else if(p.kind==='edge'){box(len,.024,.006,0,0,.004);box(len,.006,.026,0,.012,.017);}
 else if(p.kind==='square'){for(const k of [-1,1])box(.012,.012,.029,k*(len/2-.008),0,.015);box(len,.012,.012,0,0,.032);}
 else if(p.kind==='arch'){const pts=[];for(let i=0;i<=16;i++){const a=i/16;pts.push([-len/2+len*a,0,.009+.035*Math.sin(Math.PI*a)]);}for(let i=1;i<pts.length;i++)rod(pts[i-1],pts[i]);for(const k of [-1,1])cyl(.009,.012,k*len/2,0,.006);}
 else if(p.kind==='cup'){// Curved half shell with open underside.
  const o=new THREE.Mesh(new THREE.CylinderGeometry(len*.48,len*.48,.034,32,1,true,0,Math.PI),m);o.rotation.x=Math.PI/2;o.scale.y=.72;o.position.z=.018;g.add(o);box(len,.009,.008,0,0,.004);for(const k of [-1,1])cyl(.006,.009,k*len*.43,0,.008);}
 else if(p.kind==='leather'){const pts=[];for(let i=0;i<=20;i++){const a=i/20;pts.push([-.024+.048*a,0,.008+.038*Math.sin(Math.PI*a)]);}for(let i=1;i<pts.length;i++)rod(pts[i-1],pts[i],.010);const rivet=new THREE.MeshStandardMaterial({color:0xb8a17a,metalness:.8,roughness:.3});addBox(g,.012,.018,.006,0,0,.007,rivet,'v7_rivet');}
 else {const r=p.kind==='long'?.008:.0065;cyl(r,len,0,0,.032,'x');for(const k of [-1,1])cyl(r*.83,.03,k*len*.38,0,.015);}
 return g;
}
function v7MountHardware(g,c){const p=v7ResolvedHandle(c);if(!p||p.kind==='none')return;const leaves=[];g.traverse(o=>{if(o.name==='door_panel'||o.name==='drawer_front')leaves.push(o);});
 for(const leaf of leaves){const par=leaf.parent,a=leaf.geometry?.parameters||{},w=a.width||.3,h=a.height||.3,d=a.depth||.019,drawer=leaf.name==='drawer_front',corner=par.name==='v6_corner_door_pivot',out=corner?-1:1;
  const sign=leaf.position.x<0?-1:1;let x=leaf.position.x,y=leaf.position.y;const compact=['knob','squareknob','cup','leather'].includes(p.kind),vertical=!drawer&&!['cup','edge'].includes(p.kind)&&!compact;
  if(!drawer){if(p.kind==='edge'){y+=c.category==='wall-cabinets'?-h/2+.015:h/2-.015;}else{x+=sign*Math.max(0,w/2-(v7Glass(c)?.022:.045));y+=c.category==='wall-cabinets'?-h*.30:0;}}
  else if(p.kind==='edge')y+=h/2-.014;else y+=Math.min(.045,h*.15);
  const span=vertical?h:w,desired=p.kind==='long'?.42:p.kind==='cup'?.115:p.kind==='edge'?.20:.16,len=Math.max(.025,Math.min(desired,span*.72));
  const hardware=v7Hardware(p,len);hardware.position.set(x,y,leaf.position.z+out*(d/2+.002));if(out<0)hardware.rotation.y=Math.PI;if(vertical)hardware.rotation.z=Math.PI/2;par.add(hardware);
 }
}
function v7Glaze(g){const doors=[];g.traverse(o=>{if(o.name==='door_panel')doors.push(o);});for(const leaf of doors){const p=leaf.geometry?.parameters;if(!p?.width||!p.height)continue;const parent=leaf.parent,{width:w,height:h,depth:d}=p,x=leaf.position.x,y=leaf.position.y,z=leaf.position.z,b=Math.min(.044,w*.17,h*.15),frame=leaf.material;
 // Keep the door_panel node as an actual transparent panel so existing animations still find it.
 leaf.geometry.dispose();leaf.geometry=new THREE.BoxGeometry(Math.max(.01,w-2*b),Math.max(.01,h-2*b),.005);leaf.material=new THREE.MeshPhysicalMaterial({color:0xdce9ed,metalness:0,roughness:.12,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide});leaf.castShadow=false;
 for(const k of [-1,1]){addBox(parent,b,h,d,x+k*(w-b)/2,y,z,frame,'v7_glass_stile');addBox(parent,w-2*b,b,d,x,y+k*(h-b)/2,z,frame,'v7_glass_rail');}
 for(const o of parent.children)if(o.name==='door_inset')o.visible=false;
 }}
function v7Microwave(c,make){const H=c.height/1000,w=c.width/1000,d=c.depth/1000,t=Math.min(.035,Math.max(.012,(c.thickness||18)/1000)),lower=Math.min(H*.62,.40),upper=Math.max(.12,H-lower);
 const g=make({...c,height:upper*1000,plinth:false,worktop:false,backsplash:false,front:c.front==='drawers'?'doors':c.front,shelfPositions:[],partitions:0,bayShelves:[],shelves:Math.min(1,Number(c.shelves)||0)});for(const o of [...g.children]){if(o.isLineSegments){g.remove(o);disposeGroup(o);}else o.position.y+=lower;}
 const frame=mat(c.carcass==='plywood'?'#c8b49b':c.carcass==='blockboard'?'#d8c0a1':'#e7e4dc');addBox(g,w,t,d,0,t/2,0,frame,'v7_microwave_bottom');for(const k of [-1,1])addBox(g,t,lower-t,d,k*(w-t)/2,(lower+t)/2,0,frame,'v7_microwave_side');addBox(g,w-2*t,lower-t,t,0,(lower+t)/2,-d/2+t/2,frame,'v7_microwave_back');
 const mw=Math.max(.04,Math.min(.59,w-2*t-.024)),mh=Math.max(.04,Math.min(.33,lower-t-.023)),md=Math.max(.035,Math.min(.39,d-t-.026)),cy=t+mh/2+.006,z=d/2-.012-md/2;
 const steel=new THREE.MeshStandardMaterial({color:0xaeb5b7,metalness:.75,roughness:.28}),black=mat('#181c20',.28),glass=new THREE.MeshStandardMaterial({color:0x202a30,metalness:.22,roughness:.12});addBox(g,mw,mh,md,0,cy,z,steel,'v7_microwave_body');addBox(g,mw*.98,mh*.96,.015,0,cy,z+md/2,black,'v7_microwave_face');addBox(g,mw*.70,mh*.73,.012,-mw*.12,cy,z+md/2+.010,glass,'v7_microwave_window');addBox(g,mw*.10,mh*.14,.008,mw*.34,cy+mh*.29,z+md/2+.012,new THREE.MeshStandardMaterial({color:0x5da9a3,emissive:0x236966,emissiveIntensity:.45}),'v7_microwave_display');for(let i=0;i<4;i++)addBox(g,mw*.08,mh*.055,.008,mw*.34,cy+mh*.10-i*mh*.12,z+md/2+.014,steel,'v7_microwave_button');addBox(g,.012,mh*.57,.017,mw*.20,cy,z+md/2+.025,steel,'v7_microwave_pull');
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.01,H+.01,d+.015)),new THREE.LineBasicMaterial({color:0xb3905c}));outline.position.y=H/2;outline.visible=model.selected===c.uid;g.add(outline);return g;}
// Curated concept palette, independent of supplier inventory. Tile swatches
// and the 3D model use the same generated canvas artwork.
const v7Splash=[
 ['Plain & glass','plain-white','Warm white','#eee9e0','#d7d2c9','plain'],['Plain & glass','plain-ivory','Ivory','#e1d3bc','#c9bca6','plain'],['Plain & glass','plain-grey','Soft grey','#b9bdbb','#8e9899','plain'],['Plain & glass','plain-charcoal','Charcoal','#3e4142','#2b2d2e','plain'],['Plain & glass','glass-sage','Sage glass','#9cafa0','#c4d3c3','glass'],['Plain & glass','glass-blue','Smoky blue glass','#688591','#c5d4da','glass'],
 ['Subway & stacked tile','subway-white','White subway','#f2eee5','#a6a5a0','subway'],['Subway & stacked tile','subway-black','Black subway','#292c2d','#757979','subway'],['Subway & stacked tile','subway-sage','Sage subway','#9ead96','#e5e2d7','subway'],['Subway & stacked tile','subway-blue','Deep blue subway','#3a6575','#c1c8c8','subway'],['Subway & stacked tile','stacked-cream','Cream stacked tile','#dfd0b8','#aaa291','stack'],['Subway & stacked tile','stacked-terracotta','Terracotta stacked','#b97860','#ead7c1','stack'],
 ['Mosaic & herringbone','mosaic-white','Pearl mosaic','#e7e4db','#aaa9a3','mosaic'],['Mosaic & herringbone','mosaic-blue','Ocean mosaic','#597a86','#e1e1d8','mosaic'],['Mosaic & herringbone','mosaic-grey','Grey mosaic','#91989a','#d6d8d8','mosaic'],['Mosaic & herringbone','herringbone-white','White herringbone','#ebe9e1','#aaa69e','herringbone'],['Mosaic & herringbone','herringbone-green','Forest herringbone','#506a57','#c8cabc','herringbone'],['Mosaic & herringbone','herringbone-clay','Clay herringbone','#b98370','#ead5bd','herringbone'],
 ['Stone & marble','marble-white','Calacatta inspired','#f2efe9','#9c9489','marble'],['Stone & marble','marble-grey','Grey marble inspired','#a8a6a3','#e4e1da','marble'],['Stone & marble','marble-black','Black marble inspired','#292d31','#c9b18b','marble'],['Stone & marble','stone-travertine','Travertine inspired','#d5c0a4','#b19a7c','stone'],['Stone & marble','stone-concrete','Concrete inspired','#aaa9a5','#888984','stone'],['Stone & marble','stone-sand','Sandstone inspired','#d6c7ad','#baa785','stone'],
 ['Textured & metallic','fluted-white','White fluted','#eee9df','#a9a197','flute'],['Textured & metallic','fluted-sage','Sage fluted','#9cae9c','#5a705c','flute'],['Textured & metallic','steel','Brushed stainless','#afb5b6','#e0e4e3','metal'],['Textured & metallic','copper','Brushed copper','#a66e4d','#d7a783','metal']
].map(([category,id,name,color,accent,style])=>({category,id,name,color,accent,style}));
const v7SplashImages=new Map(),v7SplashTextures=new Map();
function v7Swatch(p){if(v7SplashImages.has(p.id))return v7SplashImages.get(p.id);const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=p.color;ctx.fillRect(0,0,256,256);ctx.strokeStyle=p.accent;ctx.fillStyle=p.accent;let seed=97;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 if(['subway','stack','mosaic'].includes(p.style)){const tw=p.style==='mosaic'?32:128,th=p.style==='mosaic'?32:64;ctx.lineWidth=3;for(let y=0;y<256;y+=th){const off=p.style==='subway'?(y/th%2)*64:0;for(let x=-tw;x<256;x+=tw){ctx.strokeRect(x+off,y,tw,th);if(p.style==='mosaic'){ctx.save();ctx.globalAlpha=.05+rnd()*.15;ctx.fillRect(x+off+2,y+2,tw-4,th-4);ctx.restore();}}}}
 else if(p.style==='herringbone'){ctx.save();ctx.translate(128,128);ctx.rotate(-Math.PI/4);ctx.lineWidth=2.5;for(let y=-320;y<320;y+=64)for(let x=-320;x<320;x+=128){ctx.strokeRect(x,y,96,32);ctx.strokeRect(x+96,y,32,64);ctx.strokeRect(x,y+32,96,32);}ctx.restore();}
 else if(p.style==='marble'||p.style==='stone'){for(let i=0;i<55;i++){ctx.globalAlpha=p.style==='marble'?.06+rnd()*.20:.035+rnd()*.09;ctx.lineWidth=.4+rnd()*2.4;let x=rnd()*350-60,y=rnd()*256;ctx.beginPath();ctx.moveTo(x-70,y-120);ctx.bezierCurveTo(x+80,y-60,x-45,y+65,x+110,y+160);ctx.stroke();}ctx.globalAlpha=1;}
 else if(p.style==='flute'){for(let i=0;i<256;i+=18){const grad=ctx.createLinearGradient(i,0,i+18,0);grad.addColorStop(0,p.accent);grad.addColorStop(.35,p.color);grad.addColorStop(.8,p.color);grad.addColorStop(1,p.accent);ctx.fillStyle=grad;ctx.fillRect(i,0,18,256);}}
 else if(p.style==='metal'||p.style==='glass'){for(let y=0;y<256;y++){ctx.globalAlpha=p.style==='metal'?rnd()*.20:.04*Math.sin(y/256*Math.PI);ctx.fillRect(0,y,256,1);}ctx.globalAlpha=1;}
 v7SplashImages.set(p.id,c);return c;}
function v7SplashMaterial(p){if(!v7SplashTextures.has(p.id)){const tex=new THREE.CanvasTexture(v7Swatch(p));tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;v7SplashTextures.set(p.id,tex);}return new THREE.MeshStandardMaterial({color:0xffffff,map:v7SplashTextures.get(p.id),roughness:p.style==='glass'?.18:p.style==='metal'?.36:.62,metalness:p.style==='metal'?.65:0});}
function v7BacksplashMesh(g,c){if(!c.backsplash||!v7Base(c))return;const p=v7Splash.find(x=>x.id===c.backsplashStyle)||v7Splash[0],w=c.width/1000,d=c.depth/1000,H=c.height/1000,base=H+.028;let ht=Math.min(.45,Math.max(0,model.room.height/1000-base));
 // Limit height to the underside of any upper cabinet overlapping this run.
 for(const o of model.cabinets){if(o.category!=='wall-cabinets'||!v6Overlap(c,o,.01))continue;ht=Math.min(ht,Math.max(0,1.35-base-.006));}if(ht<.02)return;
 const material=v7SplashMaterial(p),th=.008;
 const add=(len,x,z,rotation=0)=>{const mesh=addBox(g,len,ht,th,x,base+ht/2,z,material,'v7_backsplash');mesh.rotation.y=rotation;const uv=mesh.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.max(1,len/.5),uv.getY(i)*Math.max(1,ht/.5));uv.needsUpdate=true;};
 add(w,0,-d/2+th/2);if(v6Kind(c)==='l'||v6Kind(c)==='diagonal')add(d-th,-w/2+th/2,th/2,Math.PI/2);
}
function v7RenderBacksplash(panel){panel.innerHTML=`<div class="v7-splash-head"><strong>Backsplash finishes</strong><p>Choose a finish, then select a wall.</p><small>Independent wall panels. Select a panel to move or resize it.</small></div><div class="v7-splash-body">${[...new Set(v7Splash.map(p=>p.category))].map(category=>`<section><h4>${safe(category)}</h4><div class="v7-splash-grid">${v7Splash.filter(p=>p.category===category).map(p=>`<button type="button" data-v7-splash="${p.id}"><img src="${v7Swatch(p).toDataURL('image/png')}" alt="" loading="lazy"><span>${safe(p.name)}</span></button>`).join('')}</div></section>`).join('')}</div>`;panel.scrollTop=0;}
// Existing scene JSON is authoritative; no new SQL IDs or tables are required.
(()=>{
 const root=document.querySelector('#id3-app');if(!root)return;/* Styles are consolidated in designer.css. */
 const beforeStandard=standardCab;standardCab=t=>{const c=v7Normalize(beforeStandard(t));if(v7Micro(c)){c.shelves=1;c.shelfPositions=[];}if(v7Glass(c)){const glass=catalog.doors.find(x=>/glass/i.test(x.name));if(glass)c.doorStyle=Number(glass.id);}return c;};
 const beforeMake=makeCabinet;makeCabinet=(c,skipHood=false)=>{const normalized={...c,backsplash:false};v7Normalize(normalized);const g=v7Micro(c)?v7Microwave(normalized,beforeMake):beforeMake(normalized,skipHood);v7MountHardware(g,c);if(v7Glass(c)&&c.front==='doors')v7Glaze(g);if(c.backsplash)v7BacksplashMesh(g,c);return g;};
 const beforeRenderAll=renderAll;renderAll=()=>{model.cabinets.forEach(v7Normalize);model.shared=model.shared.filter(s=>s.type!=='backsplash');beforeRenderAll();};
 // Keep defaults valid when replacement and duplicate actions bypass standardCab.
 const beforeCommit=commitNew;commitNew=c=>{v7Normalize(c);return beforeCommit(c);};
 // Separate Front and Handles without moving the original inputs and listeners.
 const handleGallery=document.querySelector('#studio-handle-gallery');const doorDetail=handleGallery?.closest('.id3-detail');if(doorDetail)doorDetail.classList.add('v7-front-detail');
 for(const key of ['worktop','plinth','backsplash'])document.querySelector(`[data-property="${key}"]`)?.closest('label')?.classList.add('v7-auto-option');
 document.querySelector('[data-run="backsplash"]')?.classList.add('v7-auto-option');
 const handlePreviewCache=new Map();
 // Software-render a small shaded orthographic view of the exact 3D hardware;
 // no extra WebGL context, avoiding another source of viewer startup failures.
 function preview(p){if(handlePreviewCache.has(p.id))return handlePreviewCache.get(p.id);const c=document.createElement('canvas');c.width=240;c.height=134;const ctx=c.getContext('2d');if(!ctx)return '';const bg=ctx.createLinearGradient(0,0,240,134);bg.addColorStop(0,'#ddc9ad');bg.addColorStop(1,'#b29b7f');ctx.fillStyle=bg;ctx.fillRect(0,0,240,134);
  if(p.kind==='none'){ctx.fillStyle='#52473b';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('Push to open',120,72);}else{const g=v7Hardware(p,p.kind==='long'?.23:p.kind==='cup'?.115:.16);g.updateMatrixWorld(true);const cameraP=new THREE.OrthographicCamera(-.16,.16,.089,-.089,.01,4);cameraP.position.set(.32,.24,.65);cameraP.lookAt(0,0,.02);cameraP.updateMatrixWorld(true);cameraP.updateProjectionMatrix();const tris=[],v=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),normal=new THREE.Vector3(),light=new THREE.Vector3(.25,.65,1).normalize();g.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.attributes.position,idx=o.geometry.index,count=idx?idx.count:pos.count;for(let j=0;j<count;j+=3){const world=[0,1,2].map(k=>v.fromBufferAttribute(pos,idx?idx.getX(j+k):j+k).applyMatrix4(o.matrixWorld).clone());normal.crossVectors(a.subVectors(world[1],world[0]),b.subVectors(world[2],world[0])).normalize();const intensity=.44+.56*Math.max(0,normal.dot(light)),col=o.material.color.clone().multiplyScalar(intensity),points=world.map(q=>q.clone().project(cameraP));tris.push({points,z:points.reduce((n,q)=>n+q.z,0)/3,color:'#'+col.getHexString()});}});tris.sort((a,b)=>b.z-a.z);for(const t of tris){ctx.beginPath();t.points.forEach((q,i)=>{const x=(q.x+1)*120,y=(1-q.y)*67;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.fillStyle=t.color;ctx.fill();}disposeGroup(g);}
  const url=c.toDataURL('image/png');handlePreviewCache.set(p.id,url);return url;}
 const oldInspector=renderInspector;renderInspector=()=>{oldInspector();const c=selected();if(!c||!handleGallery)return;const original=handleGallery.innerHTML;handleGallery.innerHTML=`<p class="studio-handle-title">Handle style</p><div class="studio-handle-grid v7-handle-grid">${v7Handles.map(p=>`<button type="button" class="studio-handle-tile ${c.handleVariant===p.id?'active':''}" data-v7-handle="${p.id}" aria-pressed="${c.handleVariant===p.id}"><img alt="" src="${(()=>{try{return preview(p);}catch(err){console.warn('Handle preview unavailable',err);return '';}})()}"><small>${safe(p.name)}</small></button>`).join('')}</div><details class="v7-original-handles"><summary>Original catalogue handles</summary>${original}</details>`;
  const current=v7Handle(c);if(current)handleGallery.querySelectorAll('[data-handle-id]').forEach(b=>b.classList.remove('active'));
  const wall=c.category==='wall-cabinets',tall=c.category==='tall-cabinets';for(const el of ['[data-property="worktopType"]','#stone-source','#stone-picker','[data-run="worktop"]']){const node=document.querySelector(el);if(node){const target=node.closest('label')||node;target.classList.toggle('v7-inapplicable',wall||tall);}}};
 handleGallery?.addEventListener('click',e=>{const b=e.target.closest('[data-v7-handle],[data-handle-id]'),c=selected();if(!b||!c)return;e.preventDefault();e.stopImmediatePropagation();history();if(b.dataset.v7Handle){c.handleVariant=b.dataset.v7Handle;}else{delete c.handleVariant;c.handle=Number(b.dataset.handleId);}renderAll();changed(false);},true);
 // v8 handles independent wall placement and selection.

})();

;
/* IDEARE v9: camera cutaways, interactive wall picker and editable finishes.
   Retains v8 independent wall panels and persistent resize handles.
   All persisted dimensions and wall offsets are millimetres. */
(()=>{
'use strict';
const wrap=$('#canvas-wrap'),hud=$('#studio-hud');if(!wrap||!hud)return;
/* Styles are consolidated in designer.css. */
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
// Only cut away a wall when it intersects a sightline to visible room content.
// Camera and target coordinates in millimetres; works for concave and angled rooms.
function wallBlocks(w,eye,p,height){
 const ex=(eye.x-w.x)*w.nx+(eye.z-w.z)*w.nz;
 const px=(p.x-w.x)*w.nx+(p.z-w.z)*w.nz;
 const delta=ex-px;if(Math.abs(delta)<.0001)return false;
 const t=ex/delta;if(t<=.0001||t>=.9999)return false;
 const x=eye.x+(p.x-eye.x)*t,z=eye.z+(p.z-eye.z)*t;
 const u=(x-w.x)*w.tx+(z-w.z)*w.tz,y=eye.y+(p.y-eye.y)*t;
 return u>1&&u<w.len-1&&y>=0&&y<height-1;
}
const wallToggle=$('#wall-toggle');let wallWorld=null,wallMeshes=[],wallSamples=[],wallStamp='';
function rebuildCutaway(){
 wallWorld=worldGroup;wallMeshes=[];wallSamples=[];wallStamp='';
 const ws=walls(),poly=roomVertices(),meshes=[];
 worldGroup?.traverse(o=>{if(o.name==='room_wall'&&o.isMesh)meshes.push(o);});
 // addRoom emits solid wall meshes in the same polygon order, excluding open edges.
 wallMeshes=meshes.map((mesh,i)=>({mesh,w:ws[i]}));
 const push=(x,y,z)=>{if(pointInsidePolygon(x,z,poly))wallSamples.push({x,y,z});};
 // Sample the room's working area and the centres of its actual objects.
 for(const x of [.18,.35,.5,.65,.82])for(const z of [.18,.35,.5,.65,.82])push(model.room.width*x,Math.min(850,model.room.height*.4),model.room.depth*z);
 for(const c of model.cabinets)push(c.x,(c.category==='wall-cabinets'?1350:0)+c.height/2,c.z);
 for(const c of model.extras)push(c.x,Math.min(model.room.height-10,Math.max(100,c.height/2)),c.z);
}
function syncCutaway(force=false){
 if(!worldGroup||!wallToggle)return;
 if(wallWorld!==worldGroup)rebuildCutaway();
 const show=wallToggle.getAttribute('aria-pressed')==='true';
 const stamp=show&&camera?[show,...camera.position.toArray(),...camera.quaternion.toArray(),camera.aspect,camera.fov].join('|'):String(show);
 if(!force&&stamp===wallStamp)return;wallStamp=stamp;
 let blockers=new Set();
 if(show&&camera){
  camera.updateMatrixWorld();const eye={x:camera.position.x*1000,y:camera.position.y*1000,z:camera.position.z*1000};
  const samples=wallSamples.slice(),target=controls?.target;
  if(target&&pointInsidePolygon(target.x*1000,target.z*1000,roomVertices())&&target.y>=0&&target.y<model.room.height/1000)samples.push({x:target.x*1000,y:target.y*1000,z:target.z*1000});
  const v=new THREE.Vector3();
  for(const p of samples){v.set(p.x/1000,p.y/1000,p.z/1000).project(camera);
   if(v.z<-1||v.z>1||Math.abs(v.x)>1||Math.abs(v.y)>1)continue;
   for(const {w} of wallMeshes)if(w&&!blockers.has(w.index)&&wallBlocks(w,eye,p,model.room.height))blockers.add(w.index);
  }
 }
 for(const {mesh,w} of wallMeshes){mesh.visible=show&&(!w||!blockers.has(w.index));mesh.castShadow=false;
  const m=mesh.material;if(m){m.opacity=1;if(m.transparent||!m.depthWrite){m.transparent=false;m.depthWrite=true;m.needsUpdate=true;}}
 }
}
if(wallToggle){const originalWallToggle=wallToggle.onclick;wallToggle.onclick=e=>{originalWallToggle?.call(wallToggle,e);syncCutaway(true);};}
const wall=p=>walls().find(w=>w.index===p.wallIndex);
const wallPoint=(w,u,y,offset=4.5)=>new THREE.Vector3((w.x+w.tx*u+w.nx*offset)/1000,y/1000,(w.z+w.tz*u+w.nz*offset)/1000);
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
 const g=new THREE.Group();g.userData.splashId=p.id;g.position.copy(wallPoint(w,p.offset+p.width/2,p.bottom+p.height/2,4.5));g.rotation.y=-Math.atan2(w.tz,w.tx);
 const mesh=addBox(g,p.width/1000,p.height/1000,.008,0,0,0,v7SplashMaterial(finish(p)),'wall_backsplash');mesh.castShadow=false;
 const uv=mesh.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*p.width/500,uv.getY(i)*p.height/500);uv.needsUpdate=true;return g;}
const oldDraw=drawScene;drawScene=()=>{oldDraw();if(!scene||!renderer||!worldGroup)return;splashGroup=new THREE.Group();splashGroup.name='ideare_wall_backsplashes';worldGroup.add(splashGroup);for(const p of panels()){const w=wall(p);if(!w||p.offset<0||p.offset+p.width>w.len+.01||p.bottom<0||p.bottom+p.height>model.room.height+.01)continue;try{const g=meshPanel(p);if(g)splashGroup.add(g);}catch(e){console.error('IDEARE backsplash',e);}}syncCutaway(true);};
const oldSelect=select,oldSelectExtra=selectExtra;select=id=>{splashId=null;oldSelect(id);};selectExtra=id=>{splashId=null;oldSelectExtra(id);};
const oldHistory=applyHistory;applyHistory=s=>{splashId=null;mode=false;modeKey=null;oldHistory(s);};
function selectPanel(p){model.selected=null;model.selectedExtra=null;model.doorsOpen=false;splashId=p.id;mode=false;modeKey=null;renderInspector();renderList();drawScene();}
function dialog(opts){
 const classes={popup:'ideare-swal ideare-swal-info ideare-swal-dialog v8-wall-dialog',title:'ideare-swal-title',htmlContainer:'ideare-swal-text',actions:'ideare-swal-actions',confirmButton:'ideare-swal-confirm',cancelButton:'ideare-swal-cancel',icon:'ideare-swal-icon',input:'v8-wall-select'};
 if(opts.customClass){const popup=opts.customClass.popup;Object.assign(classes,opts.customClass);if(popup)classes.popup='ideare-swal ideare-swal-info ideare-swal-dialog v8-wall-dialog '+popup;}
 if(window.Swal?.fire)return window.Swal.fire({buttonsStyling:false,reverseButtons:true,heightAuto:false,focusCancel:false,showClass:{popup:'ideare-swal-in'},hideClass:{popup:'ideare-swal-out'},...opts,customClass:classes});
 notify('The styled dialog is unavailable. Refresh the designer and try again.',true);return Promise.resolve({isConfirmed:false});
}
// All buttons are real HTML buttons, not tiny SVG labels. Confirmation is explicit.
function wallPickerHtml(ws,style){
 const vertices=roomVertices(),W=400,H=300,sc=Math.min(280/model.room.width,200/model.room.depth),ox=(W-model.room.width*sc)/2,oy=(H-model.room.depth*sc)/2;
 const xy=(x,z)=>[ox+x*sc,oy+z*sc];const pts=vertices.map(v=>xy(v.x,v.z).join(',')).join(' ');
 const lines=ws.map(w=>{const a=xy(w.x,w.z),b=xy(w.x+w.tx*w.len,w.z+w.tz*w.len);return `<line data-v9-wall-line="${w.index}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;}).join('');
 const positions=ws.map(w=>{const [x,y]=xy(w.x+w.tx*w.len/2,w.z+w.tz*w.len/2);return {w,x,y};});
 // Small notches can have nearby midpoints; spread overlapping buttons along the wall normals.
 for(let k=0;k<10;k++)for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){const a=positions[i],b=positions[j],dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);if(dist>=53)continue;const ux=dist>.01?dx/dist:1,uy=dist>.01?dy/dist:0,step=(53-dist)/2;a.x=clamp8(a.x-ux*step,28,W-28);a.y=clamp8(a.y-uy*step,28,H-28);b.x=clamp8(b.x+ux*step,28,W-28);b.y=clamp8(b.y+uy*step,28,H-28);}
 const buttons=positions.map(({w,x,y})=>`<button type="button" class="v9-wall-number" style="left:${x/W*100}%;top:${y/H*100}%" data-v9-wall="${w.index}" aria-pressed="false" aria-label="Wall ${w.index+1}, ${Math.round(w.len)} millimetres" title="Wall ${w.index+1} · ${Math.round(w.len)} mm">${w.index+1}</button>`).join('');
 const p=v7Splash.find(f=>f.id===style)||v7Splash[0];
 return `<div class="v9-dialog-intro"><span class="v9-kicker">WALL FINISH</span><p>Choose a numbered wall on the plan.</p></div><div class="v9-wall-plan"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><polygon points="${pts}"/>${lines}</svg>${buttons}</div><div class="v9-wall-selection"><span class="v9-choice-dot"></span><span data-v9-wall-status aria-live="polite">No wall selected</span></div><div class="v9-finish-current"><img src="${v7Swatch(p).toDataURL('image/png')}" alt=""><div><small>Selected finish</small><strong>${safe(p.name)}</strong></div></div>`;
}
async function chooseWall(ws,style){let chosen=null;
 return dialog({title:'Choose a wall',html:wallPickerHtml(ws,style),customClass:{popup:'v9-picker v9-wall-picker'},showCancelButton:true,confirmButtonText:'Add backsplash',cancelButtonText:'Cancel',focusConfirm:false,
  didOpen:()=>{const popup=window.Swal.getPopup();const confirm=window.Swal.getConfirmButton();confirm.disabled=true;const buttons=[...popup.querySelectorAll('[data-v9-wall]')];for(const button of buttons)button.addEventListener('click',()=>{chosen=Number(button.dataset.v9Wall);const w=ws.find(w=>w.index===chosen);if(!w)return;for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));for(const line of popup.querySelectorAll('[data-v9-wall-line]'))line.classList.toggle('is-selected',Number(line.dataset.v9WallLine)===chosen);popup.querySelector('[data-v9-wall-status]').textContent=`Wall ${chosen+1} · ${Math.round(w.len)} mm`;confirm.disabled=false;});buttons[0]?.focus();},
  preConfirm:()=>{if(chosen===null){window.Swal.showValidationMessage('Choose a numbered wall first.');return false;}return chosen;}});
}
$('#catalog-menu')?.addEventListener('click',async e=>{const b=e.target.closest('[data-v7-splash]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const style=b.dataset.v7Splash;if(!v7Splash.some(f=>f.id===style))return;closeMenu();const ws=walls();if(!ws.length){notify('There is no solid wall in this room.',true);return;}
 const result=await chooseWall(ws,style);if(!result.isConfirmed)return;const w=walls().find(w=>w.index===Number(result.value));if(!w)return;const p=initialPanel(w,style);if(!p){notify('No clear 1000 × 450 mm area on that wall. Try another wall or move existing panels.',true);return;}history();panels().push(p);selectPanel(p);mode=true;modeKey=p.id;changed(false);notify('Backsplash added. Drag its edges to resize.');},true);
// Edit only the finish of an existing panel. No new panel or wall prompt.
async function changePanelFinish(p){
 const id=p.id;let chosen=finish(p).id;const categories=[...new Set(v7Splash.map(f=>f.category))];
 const html=`<div class="v9-dialog-intro"><span class="v9-kicker">BACKSPLASH FINISH</span><p>Choose a new finish. Your panel size and position stay the same.</p></div><div class="v9-finish-status" aria-live="polite">Selected · ${safe(finish(p).name)}</div><div class="v9-finish-list">${categories.map(category=>`<section><h3>${safe(category)}</h3><div class="v9-finish-grid">${v7Splash.filter(f=>f.category===category).map(f=>`<button type="button" class="v9-finish-tile" data-v9-finish="${safe(f.id)}" aria-pressed="${f.id===chosen}"><img src="${v7Swatch(f).toDataURL('image/png')}" alt=""><span>${safe(f.name)}</span></button>`).join('')}</div></section>`).join('')}</div>`;
 const result=await dialog({title:'Change backsplash finish',html,customClass:{popup:'v9-picker v9-finish-picker'},showCancelButton:true,confirmButtonText:'Apply finish',cancelButtonText:'Cancel',focusConfirm:false,didOpen:()=>{const popup=window.Swal.getPopup(),buttons=[...popup.querySelectorAll('[data-v9-finish]')];for(const b of buttons)b.addEventListener('click',()=>{const f=v7Splash.find(f=>f.id===b.dataset.v9Finish);if(!f)return;chosen=f.id;for(const btn of buttons)btn.setAttribute('aria-pressed',String(btn===b));popup.querySelector('.v9-finish-status').textContent='Selected · '+f.name;});},preConfirm:()=>chosen});
 if(!result.isConfirmed||!v7Splash.some(f=>f.id===result.value))return;const current=panels().find(p=>p.id===id);if(!current||current.style===result.value)return;history();current.style=result.value;renderAll();changed(false);notify('Backsplash finish updated.');
}
// List and floating panel controls; no changes to the old cabinet/extra database model.
const tools=document.createElement('div');tools.className='v8-panel-tools';tools.hidden=true;tools.innerHTML='<strong></strong><span></span><button type="button" data-v8-panel-action="finish">Change finish</button><button type="button" data-v8-panel-action="resize">Resize</button><button type="button" data-v8-panel-action="remove">Remove</button><button type="button" data-v8-panel-action="close" aria-label="Deselect backsplash">×</button>';wrap.append(tools);
tools.addEventListener('click',async e=>{const act=e.target.closest('[data-v8-panel-action]')?.dataset.v8PanelAction,p=panelSelected();if(!p)return;if(act==='finish'){await changePanelFinish(p);}else if(act==='resize'){toggleMode();}else if(act==='close'){splashId=null;mode=false;renderAll();}else if(act==='remove'){const r=await dialog({title:'Remove backsplash?',text:finish(p).name,showCancelButton:true,confirmButtonText:'Remove'});if(r.isConfirmed){history();model.room.backsplashes=panels().filter(x=>x.id!==p.id);splashId=null;mode=false;renderAll();changed(false);}}});
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
function toggleMode(){const c=target();if(!c||drag)return;ideareClearGuides();mode=!(mode&&modeKey===key(c));modeKey=mode?key(c):null;}
resizeButton.onclick=toggleMode;
const inspector=$('#selected-inspector');const row=inspector?.querySelector('.id3-object-actions');if(row){const b=document.createElement('button');b.type='button';b.id='v8-inspector-resize';b.textContent='⤡ Resize';b.onclick=toggleMode;row.insertBefore(b,$('#rotate'));}
function frame(c){if(isSplash(c)){const w=wall(c);if(!w)return null;return{width:c.width,height:c.height,depth:0,front:0,point:(u,y)=>wallPoint(w,c.offset+c.width/2+u,c.bottom+y,9),axis:{u:new THREE.Vector3(w.tx,0,w.tz),y:new THREE.Vector3(0,1,0)},wall:true};}
 const a=num(c.rotation)*Math.PI/180,co=Math.cos(a),si=Math.sin(a),g=c.uid?meshById.get(c.uid):extraGroup?.children.find(o=>o.userData.extraId===c.id);if(!g)return null;
 const wallCab=c.category==='wall-cabinets',mountedExtra=!c.uid&&['wall-shelf','rack','organiser','rail','lighting','safety','hood','wall-table'].includes(window.IDEAREDesignerCatalogV3?.findProfile(c)?.shape);let bottom=wallCab?1350:0;
 if(mountedExtra){const outline=g.getObjectByName('ideare_extra_outline');bottom=Math.max(0,num(outline?.position.y)*1000-c.height/2);}
 if(ideareFridgeHousing(c)){const p=ideareFridgePart(c),ax=new THREE.Vector3(co,0,si),az=new THREE.Vector3(-si,0,co);return {width:p.w,height:p.h,depth:p.d,front:1,wall:true,axis:{u:ax,y:new THREE.Vector3(0,1,0),z:az},point:(u,y,z)=>new THREE.Vector3((c.x+(u+p.u)*co-(z+p.z)*si)/1000,(p.y+y)/1000,(c.z+(u+p.u)*si+(z+p.z)*co)/1000)};}
 const ax=new THREE.Vector3(co,0,si),az=new THREE.Vector3(-si,0,co),front=wallCab||mountedExtra||((camera.position.x-c.x/1000)*az.x+(camera.position.z-c.z/1000)*az.z)>=0?1:-1;
 return{width:c.width,height:c.height,depth:c.depth,front,wall:wallCab||mountedExtra,axis:{u:ax,y:new THREE.Vector3(0,1,0),z:az},point:(u,y,z)=>new THREE.Vector3((c.x+u*co-z*si)/1000,(bottom+y)/1000,(c.z+u*si+z*co)/1000)};}
function project(p){const r=wrap.getBoundingClientRect(),v=p.clone().project(camera);return{x:(v.x+1)*r.width/2,y:(1-v.y)*r.height/2,visible:v.z>=-1&&v.z<=1};}
function place(h,info){h.info=info;h.b.hidden=!info;if(!info)return;const p=project(info.point);h.b.hidden=!p.visible;h.b.style.left=p.x+'px';h.b.style.top=p.y+'px';}
function tick(){requestAnimationFrame(tick);if(model.step===3)syncCutaway();const c=target(),p=panelSelected(),wallCab=selected()?.category==='wall-cabinets';for(const id of ['rotate','object-rotate']){const b=$('#'+id);if(b)b.classList.toggle('v8-no-rotate',wallCab);}resizeButton.hidden=!c||isSplash(c);if(!drag&&modeKey!==key(c))mode=false;const active=!!(c&&camera&&model.step===3&&mode);resizeButton.setAttribute('aria-pressed',String(active));tools.hidden=!(p&&model.step===3);if(p){const content=[['strong',finish(p).name],['span',`Wall ${p.wallIndex+1} · ${Math.round(p.width)} × ${Math.round(p.height)} mm`],['[data-v8-panel-action="resize"]',active?'Done':'Resize']];for(const [sel,value] of content){const node=tools.querySelector(sel);if(node.textContent!==value)node.textContent=value;}}
 overlay.hidden=!active;wrap.classList.toggle('v8-resize-mode',active&&!isSplash(c));if(!active)return;const f=frame(c);if(!f){overlay.hidden=true;return;}const z=f.front*f.depth/2,pts=[[-f.width/2,0],[f.width/2,0],[f.width/2,f.height],[-f.width/2,f.height]].map(([u,y])=>project(f.point(u,y,z)));polygon.setAttribute('points',pts.map(p=>`${p.x},${p.y}`).join(' '));
 for(const h of handles){if(h.id.startsWith('depth')){const sign=h.id==='depth-front'?1:-1;if(!f.depth||f.wall&&sign<0){place(h,null);continue;}place(h,{point:f.point(f.width*.23,f.height,sign*f.depth/2),axes:['z'],sz:sign});continue;}if(h.y<0&&!isSplash(c)){place(h,null);continue;}if(ideareFridgeHousing(c)&&((ideareFridgeResizePart==='left'&&h.x>0)||(ideareFridgeResizePart==='right'&&h.x<0))){place(h,null);continue;}place(h,{point:f.point(h.x*f.width/2,(h.y+1)*f.height/2,z),axes:[...(h.x?['u']:[]),...(h.y?['y']:[])],sx:h.x,sy:h.y});}
 if(f.depth){const a=project(f.point(f.width*.23,f.height,-f.depth/2)),b=project(f.point(f.width*.23,f.height,f.depth/2));depthGuide.setAttribute('d',`M${a.x},${a.y}L${b.x},${b.y}`);}else depthGuide.setAttribute('d','');
 const top=pts.reduce((a,b)=>a.y<b.y?a:b);sizeLabel.style.left=(pts.reduce((a,b)=>a+b.x,0)/4)+'px';sizeLabel.style.top=(top.y-20)+'px';const label=`W ${Math.round(f.width)} × H ${Math.round(f.height)}${isSplash(c)?'':' × D '+Math.round(f.depth)} mm`;if(sizeLabel.textContent!==label)sizeLabel.textContent=label;}
requestAnimationFrame(tick);
// Screen-space axis solve: stable even with oblique perspective. One axis for
// edge grips, two for corners. A nearly edge-on view disables the ambiguous axis.
function solve(v,dx,dy){if(v.length===1){const a=v[0],d=a.x*a.x+a.y*a.y;return[d>.000004?(a.x*dx+a.y*dy)/d:0];}const [a,b]=v,det=a.x*b.y-a.y*b.x,aa=Math.hypot(a.x,a.y),bb=Math.hypot(b.x,b.y);if(Math.abs(det)<aa*bb*.12||aa<.002||bb<.002)return aa>=bb?[solve([a],dx,dy)[0],0]:[0,solve([b],dx,dy)[0]];return[(dx*b.y-dy*b.x)/det,(a.x*dy-a.y*dx)/det];}
function begin(e,c,info,el){if(e.button!==0||drag)return;const f=frame(c);if(!f)return;e.preventDefault();e.stopImmediatePropagation();camera.updateMatrixWorld();const origin=project(info.point),vectors=info.axes.map(k=>{const p=project(info.point.clone().addScaledVector(f.axis[k],.1));return{x:(p.x-origin.x)/100,y:(p.y-origin.y)/100};});if(vectors.every(v=>Math.hypot(v.x,v.y)<.002))return;
 drag={id:e.pointerId,el,key:key(c),base:deep(c),info,f,vectors,x:e.clientX,y:e.clientY,recorded:false,oldControls:controls?.enabled,shared:deep(model.shared)};if(controls)controls.enabled=false;try{el.setPointerCapture(e.pointerId);}catch(_){}wrap.classList.add('v8-resizing');}
function nearest(v,targets){return ideareNearest(v,targets);}
function panelTargets(p,w){const xs=[0,w.len],ys=[0,model.room.height,900,1350];for(const o of panels())if(o.id!==p.id&&o.wallIndex===p.wallIndex){xs.push(o.offset,o.offset+o.width);ys.push(o.bottom,o.bottom+o.height);}for(const o of [...model.cabinets,...model.extras]){const v=ideareAlignBounds(o);const corners=v6World(o,v6Local(o));const normals=corners.map(([x,z])=>(x-w.x)*w.nx+(z-w.z)*w.nz);if(Math.min(...normals)>200||Math.max(...normals)<-2)continue;const along=corners.map(([x,z])=>(x-w.x)*w.tx+(z-w.z)*w.tz);xs.push(Math.min(...along),Math.max(...along));ys.push(...v.y);}return {xs,ys};}
function panelCandidate(b,d,info){const w=wall(b);if(!w)return b;let l=b.offset,r=l+b.width,bot=b.bottom,top=bot+b.height;const {xs,ys}=panelTargets(b,w);
 if(info.move){l=clamp8(nearest(l+d.u,[...xs,...xs.map(x=>x-b.width)]),0,w.len-b.width);bot=clamp8(nearest(bot+d.y,[...ys,...ys.map(y=>y-b.height)]),0,model.room.height-b.height);r=l+b.width;top=bot+b.height;}
 else{if(info.sx<0)l=clamp8(nearest(l+d.u,xs),0,r-50);if(info.sx>0)r=clamp8(nearest(r+d.u,xs),l+50,w.len);if(info.sy<0)bot=clamp8(nearest(bot+d.y,ys),0,top-50);if(info.sy>0)top=clamp8(nearest(top+d.y,ys),bot+50,model.room.height);}
 return {...b,offset:l,bottom:bot,width:r-l,height:top-bot};}
function cabCandidate(b,d,info,f){if(ideareFridgeHousing(b))return ideareResizeFridge(b,d,info);const q={...b},a=num(b.rotation)*Math.PI/180,co=Math.cos(a),si=Math.sin(a);const t=b.uid?template(b.templateId):null;
 const limits=k=>[Math.max(b.uid?100:k==='height'?30:50,Math.min(num(t?.['min_'+k],0)||0,b[k])),Math.max(num(t?.['max_'+k],10000)||10000,b[k])];
 const edges=(axis)=>{const values=[];const pr=(x,z)=>axis==='u'?x*co+z*si:-x*si+z*co;for(const p of roomVertices())values.push(pr(p.x,p.z));for(const o of ideareAlignmentObjects()){if(key(o)===key(b))continue;for(const [x,z] of v6World(o,v6Local(o)))values.push(pr(x,z));}return values;};
 let du=0,dz=0;if(info.sx){const s=info.sx,origin=b.x*co+b.z*si+s*b.width/2,delta=nearest(origin+d.u,edges('u'))-origin;const [lo,hi]=limits('width');q.width=clamp8(b.width+s*delta,lo,hi);du=s*(q.width-b.width)/2;}
 if(info.sz){const s=info.sz,origin=-b.x*si+b.z*co+s*b.depth/2,delta=nearest(origin+d.z,edges('z'))-origin;const [lo,hi]=limits('depth');q.depth=clamp8(b.depth+s*delta,lo,hi);dz=s*(q.depth-b.depth)/2;}
 if(info.sy>0){const [lo,hi]=limits('height');const base=b.category==='wall-cabinets'?1350:0,targets=[model.room.height-base];for(const o of ideareAlignmentObjects())if(key(o)!==key(b))targets.push(...ideareAlignBounds(o).y.map(y=>y-base));q.height=clamp8(nearest(b.height+d.y,targets),lo,Math.min(hi,Math.max(lo,model.room.height-base)));if(q.height!==b.height)q.shelfPositions=[];}
 q.x=b.x+du*co-dz*si;q.z=b.z+du*si+dz*co;return q;}
function repaint(c){if(isSplash(c)){const old=splashGroup?.children.find(o=>o.userData.splashId===c.id);const next=meshPanel(c);if(old&&next){splashGroup.remove(old);disposeGroup(old);splashGroup.add(next);}return;}const old=c.uid?meshById.get(c.uid):extraGroup.children.find(o=>o.userData.extraId===c.id),group=c.uid?cabinetGroup:extraGroup;if(!old)return;const next=c.uid?makeCabinet(c):window.IDEAREDesignerCatalogV3.realizeItem(c);group.remove(old);group.add(next);if(c.uid)meshById.set(c.uid,next);disposeGroup(old);}
function update(e){const m=drag;if(!m)return;const c=target();if(!c||key(c)!==m.key)return;const dx=e.clientX-m.x,dy=e.clientY-m.y;if(!m.recorded&&Math.hypot(dx,dy)<3)return;const vals=solve(m.vectors,dx,dy),d={u:0,y:0,z:0};m.info.axes.forEach((k,i)=>d[k]=vals[i]);const candidate=()=>isSplash(c)?panelCandidate(m.base,d,m.info):cabCandidate(m.base,d,m.info,m.f),check=q=>isSplash(c)?panelValid(q):window.IDEAREPlacementV4?.valid(q);let q=candidate(),valid=check(q);if(!valid){ideareSnapSuppressed=true;try{q=candidate();valid=check(q);}finally{ideareSnapSuppressed=false;}}overlay.classList.toggle('v8-blocked',!valid);if(!valid){ideareClearGuides();return;}if(isSplash(q)){const w=wall(q);if(w)idearePanelGuide(q,w,panelTargets(q,w));}else ideareShowGuides(q,['x','z',...(m.info.sy?['y']:[])]);
 const props=isSplash(c)?['offset','bottom','width','height']:['x','z','width','height','depth'];if(props.every(k=>Math.abs(c[k]-q[k])<.001)&&JSON.stringify(c.fridgeLayout)===JSON.stringify(q.fridgeLayout))return;const previous={...c};if(!m.recorded){history();m.recorded=true;if(c.uid){model.shared=model.shared.filter(s=>!s.cabinetUids?.includes(c.uid));drawScene();}}
 try{Object.assign(c,q);repaint(c);}catch(err){Object.assign(c,previous);console.error('IDEARE resize',err);overlay.classList.add('v8-blocked');}}
function finishDrag(e,cancel=false){const m=drag;if(!m||e&&e.pointerId!==m.id)return;if(raf){cancelAnimationFrame(raf);raf=0;}if(!cancel&&e)update(e);drag=null;ideareClearGuides();try{m.el.releasePointerCapture(m.id);}catch(_){}if(controls)controls.enabled=m.oldControls;wrap.classList.remove('v8-resizing');overlay.classList.remove('v8-blocked');if(m.recorded){if(cancel){const prev=undo.pop();if(prev)applyHistory(prev);refreshUndo();}else renderAll();changed(false);}}
window.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopImmediatePropagation();latest={clientX:e.clientX,clientY:e.clientY};if(!raf)raf=requestAnimationFrame(()=>{raf=0;update(latest);});},true);
window.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id){e.stopImmediatePropagation();finishDrag(e);}},true);
window.addEventListener('pointercancel',e=>{if(drag&&e.pointerId===drag.id){e.stopImmediatePropagation();finishDrag(e,true);}},true);
window.addEventListener('blur',()=>{if(drag)finishDrag(null,true);});window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(drag||mode)){e.preventDefault();e.stopImmediatePropagation();if(drag)finishDrag(null,true);mode=false;modeKey=null;}},true);
// Also expose the pure geometry math for local regression tests.
window.IDEAREV8.test={solve,panelCandidate,panelValid,cabCandidate,walls,wallBlocks};
})();

;
try {
/* IDEARE v10 — Define Space. Room geometry in mm, textures in world metres. */
(()=>{
'use strict';
const section=$('[data-panel="2"]'), plan=$('#plan-svg'), tools=$('.studio-room-tools'), layout=section?.querySelector('.id3-room-layout');
if(!section||!plan||!tools||!layout)return;
/* Styles are consolidated in designer.css. */
const MIN=1200,MAX=20000,EDGE=250,round=(x)=>Math.round(x/10)*10,limit=(x,a,b)=>Math.max(a,Math.min(b,x));
const preset=roomVertices;
function vertices(r=model.room){const saved=r.customOutline;if(saved?.shape===r.shape&&Array.isArray(saved.points)&&saved.points.length>=4&&saved.points.length<=6&&saved.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=0&&p.x<=1&&p.z>=0&&p.z<=1))return saved.points.map(p=>({x:p.x*r.width,z:p.z*r.depth}));if(r===model.room)return preset();const prev=model.room;try{model.room=r;return preset();}finally{model.room=prev;}}
// The combined PHP loader now supplies custom room outlines directly.
// Do not reassign the original roomVertices binding.
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
function validPoly(p){if(p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.z)))return false;if(area(p)<MIN*MIN*.2)return false;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(Math.hypot(b.x-a.x,b.z-a.z)<EDGE)return false;for(let j=i+2;j<p.length;j++){if(i===0&&j===p.length-1)continue;const c=p[j],d=p[(j+1)%p.length];if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))+.001&&Math.max(Math.min(a.z,b.z),Math.min(c.z,d.z))<=Math.min(Math.max(a.z,b.z),Math.max(c.z,d.z))+.001)return false;}}return true;}
function intersect(a,b,c,d){const x=b.x-a.x,z=b.z-a.z,u=d.x-c.x,v=d.z-c.z,det=x*v-z*u;if(Math.abs(det)<1e-8)return null;const t=((c.x-a.x)*v-(c.z-a.z)*u)/det;return{x:a.x+x*t,z:a.z+z*t};}
function moveEdge(p,i,dx,dz){const n=p.length,a=p[i],b=p[(i+1)%n],len=Math.hypot(b.x-a.x,b.z-a.z),nx=-(b.z-a.z)/len,nz=(b.x-a.x)/len,t=round(dx*nx+dz*nz),A={x:a.x+nx*t,z:a.z+nz*t},B={x:b.x+nx*t,z:b.z+nz*t};const first=intersect(p[(i+n-1)%n],a,A,B),last=intersect(A,B,b,p[(i+2)%n]);if(!first||!last)return null;const q=p.map(v=>({...v}));q[i]=first;q[(i+1)%n]=last;return q;}
function bounds(p){return {l:Math.min(...p.map(v=>v.x)),r:Math.max(...p.map(v=>v.x)),t:Math.min(...p.map(v=>v.z)),b:Math.max(...p.map(v=>v.z))};}
function candidate(p,r){if(!p||!validPoly(p))return null;const b=bounds(p),w=Math.round(b.r-b.l),d=Math.round(b.b-b.t);if(w<MIN||d<MIN||w>MAX||d>MAX)return null;return {room:{...r,width:w,depth:d,customOutline:{shape:r.shape,points:p.map(v=>({x:limit((v.x-b.l)/(b.r-b.l),0,1),z:limit((v.z-b.t)/(b.b-b.t),0,1)}))}},dx:-b.l,dz:-b.t,raw:p};}
function contentsFit(r,dx=0,dz=0){const old=model.room,all=[...model.cabinets,...model.extras],pos=all.map(o=>[o.x,o.z]);try{model.room=r;for(const o of all){o.x+=dx;o.z+=dz;}return validPoly(vertices())&&all.every(o=>window.IDEAREPlacementV4?.valid?window.IDEAREPlacementV4.valid(o):cabinetFitsPolygon(o))&&(!window.IDEAREV8||window.IDEAREV8.roomValid());}catch(e){console.warn('IDEARE room validation',e);return false;}finally{model.room=old;all.forEach((o,i)=>{[o.x,o.z]=pos[i];});}}
window.IDEARESpaceV10={roomValid:()=>contentsFit(model.room),test:{validPoly,moveEdge,candidate}};
function solid(i,r=model.room){return !((['open','u_open'].includes(r.shape)&&i===2)||(r.shape==='l_open'&&i===3));}
// Curated concept finishes. Every catalogue entry has a deterministic material swatch.
const floors=[],wallFinishes=[];
function group(list,category,style,items,rough=.65,scale=1.2){for(const [name,color] of items){list.push({id:(list===floors?'f':'w')+'-'+list.length,category,style,name,color,rough,scale});}}
const timber=[['Natural oak','#b8996b'],['Whitewashed oak','#d5c6a9'],['Honey oak','#bf9055'],['Smoked oak','#776049'],['American walnut','#70513b'],['Dark walnut','#47382f'],['Ash grey','#9e9a8e'],['Maple','#e0bd88'],['Teak','#a66e43'],['Black oak','#4b4640']];
const neutral=[['Ivory','#e9e3d7'],['Sand beige','#c9b69c'],['Greige','#b5ab9e'],['Warm grey','#92938e'],['Charcoal','#505254'],['Chalk white','#f2efea']];
const tiles=[['Carrara white','#e8e6e1'],['Calacatta gold','#e6ddca'],['Travertine beige','#cbb398'],['Concrete grey','#9a9b96'],['Graphite','#4b4e50'],['Sage green','#91a18b'],['Terracotta','#b77558'],['Midnight blue','#46576c']];
group(floors,'Porcelain & ceramic tiles','tile',neutral,.48,1.2);group(floors,'Porcelain & ceramic tiles','marble-tile',tiles.slice(0,3),.33,1.2);group(floors,'Porcelain & ceramic tiles','pattern-tile',tiles.slice(3),.62,1.2);group(floors,'Porcelain & ceramic tiles','terrazzo',[['Cream terrazzo','#d8ceba'],['Grey terrazzo','#a5a5a0'],['Pink terrazzo','#d1a59b']],.5,1.2);
group(floors,'SPC flooring','plank',timber,.62,1.2);group(floors,'SPC flooring','herringbone',timber.slice(0,5).map(([n,c])=>[n+' herringbone',c]),.62,1.2);group(floors,'SPC flooring','tile',neutral.slice(0,4).map(([n,c])=>[n+' stone SPC',c]));
group(floors,'Vinyl (LVP / LVT)','plank',timber.slice(0,8),.58);group(floors,'Vinyl (LVP / LVT)','tile',neutral);group(floors,'Laminate flooring','plank',timber,.58);group(floors,'Laminate flooring','herringbone',timber.slice(0,4),.58);
group(floors,'Engineered wood / solid timber','plank',timber,.5);group(floors,'Engineered wood / solid timber','herringbone',timber.slice(0,5),.5);group(floors,'Engineered wood / solid timber','parquet',timber.slice(0,4),.5);
group(floors,'Natural stone','marble',[['Carrara','#e9e7e3'],['Calacatta gold','#e7d9bd'],['Statuario','#ecebe7'],['Nero Marquina','#353638'],['Emperador','#82654e'],['Green marble','#556e5e'],['Travertine','#c6ac8a']],.34,1.2);group(floors,'Natural stone','granite',[['Salt & pepper','#a8a8a2'],['Absolute black','#383a3b'],['Rose granite','#b58e85'],['Steel grey','#6c7375']],.4,.8);
group(floors,'Cement render / microcement','cement',[...neutral,['Clay','#bd9782'],['Olive grey','#8d9380'],['Industrial grey','#747773']],.9,1.5);
group(floors,'Carpet / carpet tiles','carpet',[...neutral,['Oatmeal','#b7a88c'],['Dusty blue','#8297a8'],['Forest green','#576e61'],['Burgundy','#88545b']],1,.65);group(floors,'Carpet / carpet tiles','carpet-tile',[['Graphite modular','#53565a'],['Grey modular','#8b8d8e'],['Sand modular','#b9a88e'],['Blue modular','#607987']],1,1);
const paint=[...neutral,['Pure white','#f9f8f4'],['Warm white','#f2eee6'],['Linen','#d8cebc'],['Taupe','#a89988'],['Sage','#a6afa0'],['Olive','#8c937e'],['Forest','#4b6956'],['Dusty blue','#9baeb7'],['Navy','#465463'],['Sky blue','#a9c7d6'],['Teal','#467e80'],['Soft clay','#c7a493'],['Terracotta','#b87a62'],['Blush','#d9b5b4'],['Rose','#b57f88'],['Ochre','#c4a052'],['Butter yellow','#e9d7a3'],['Lavender','#b2a6c3'],['Plum','#6f536a'],['Black','#333333']];
group(wallFinishes,'Paint · matte','paint',paint,.95);group(wallFinishes,'Paint · satin','paint',paint,.48);group(wallFinishes,'Paint · gloss','paint',paint,.25);group(wallFinishes,'Textured plaster & limewash','cement',[...neutral,['Clay','#b98e7b'],['Olive','#88937e'],['Dusty blue','#8b9eaa']],.95,1.2);group(wallFinishes,'Textured plaster & limewash','stucco',[...neutral,['Venetian rose','#c2a39a'],['Travertine','#bba88c']],.68,1.2);group(wallFinishes,'Wallpaper & fabric','linen',[...neutral,['Dusty blue','#8595a0'],['Sage','#899b89']],.95,.5);group(wallFinishes,'Wallpaper & fabric','pattern-tile',[['Art deco gold','#9c865d'],['Botanical sage','#859781'],['Geometric greige','#b0a496'],['Midnight motif','#465263']],.9,.6);group(wallFinishes,'Wood & decorative panels','slat',timber,.68,.6);group(wallFinishes,'Wood & decorative panels','wainscot',[...neutral,['Sage','#92a18a'],['Navy','#465463']],.55,1.2);group(wallFinishes,'Wood & decorative panels','plank',timber.slice(0,6),.6,1.2);group(wallFinishes,'Stone, brick & wall tiles','marble',tiles.slice(0,3),.38);group(wallFinishes,'Stone, brick & wall tiles','brick',[['White brick','#e4dfd6'],['Red brick','#ad6b55'],['Grey brick','#99978f'],['Dark brick','#575352']],.85);group(wallFinishes,'Stone, brick & wall tiles','tile',tiles,.5);group(wallFinishes,'Stone, brick & wall tiles','granite',[['Grey granite','#9c9c96'],['Black granite','#484a4b']],.45);
const all=[...floors,...wallFinishes],byId=new Map(all.map(p=>[p.id,p]));
const legacyFloor={oak:'Natural oak',walnut:'American walnut',ash:'Whitewashed oak',marble:'Calacatta gold',terrazzo:'Cream terrazzo',concrete:'Industrial grey',slate:'Graphite',sand:'Travertine beige',ivory:'Ivory',charcoal:'Charcoal'};
const oldPalette=()=>{try{const p=JSON.parse(localStorage.getItem('ideare_designer_environment_v2')||'{}');return p&&typeof p==='object'?p:{};}catch(_){return {};}};
function selectedFinish(kind,r=model.room){const id=r.spaceFinishes?.[kind],list=kind==='floor'?floors:wallFinishes;if(kind==='wall'&&id==='custom'&&/^#[0-9a-f]{6}$/i.test(r.spaceFinishes?.customWall||''))return{id:'custom-'+r.spaceFinishes.customWall,name:'Custom paint',color:r.spaceFinishes.customWall,style:'paint',rough:.9,scale:1};if(byId.has(id)&&list.includes(byId.get(id)))return byId.get(id);const old=oldPalette();if(kind==='floor'){const name=legacyFloor[old.floor]||'Natural oak';return list.find(p=>p.name===name&&p.category==='SPC flooring')||list.find(p=>p.name===name)||list[0];}const name=(typeof old.wall==='string'?old.wall:'warm-white').replaceAll('-',' ');return list.find(p=>p.name.toLowerCase()===name)||list.find(p=>p.name==='Warm white')||list[0];}
// Real-scale procedural texture maps. Measurement grids are independent of material joints.
const images=new Map(),textures=new Map();
function image(p){if(images.has(p.id))return images.get(p.id);const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d'),S=512;let seed=177;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const rect=(x,y,w,h,a)=>{g.fillStyle=a;g.fillRect(x,y,w,h);};const line=(x,y,u,v,col,sw=1)=>{g.strokeStyle=col;g.lineWidth=sw;g.beginPath();g.moveTo(x,y);g.lineTo(u,v);g.stroke();};rect(0,0,S,S,p.color);const style=p.style;
if(style!=='paint'){
 for(let i=0;i<11000;i++){const a=rand(),v=rand()*S,z=rand()*S;rect(v,z,1+rand()*2,1+rand()*2,a>.5?'#ffffff10':'#00000010');}
 if(['plank','slat','herringbone','parquet'].includes(style)){const grain=(x,y,w,h)=>{rect(x,y,w,h,rand()>.5?'#ffffff0e':'#0000000d');g.save();g.beginPath();g.rect(x,y,w,h);g.clip();for(let i=0;i<24;i++){const xx=x+rand()*w,amp=(rand()-.5)*w*.18;g.strokeStyle=i%3?'#42271328':'#ffffff26';g.lineWidth=.4+rand()*1.2;g.beginPath();g.moveTo(xx,y);g.bezierCurveTo(xx+amp,y+h*.3,xx-amp,y+h*.65,xx,y+h);g.stroke();}g.restore();};
 if(style==='plank'||style==='slat'){const w=style==='slat'?32:85;for(let x=0;x<S;x+=w){grain(x,0,w,S);line(x,0,x,S,style==='slat'?'#2b221ccc':'#392d2444',style==='slat'?7:1.5);if(style==='slat')line(x+5,0,x+5,S,'#ffffff38',2);else for(let y=(Math.round(x/w)%2)*170;y<S;y+=340)line(x,y,x+w,y,'#34291e55',1.6);}}
 else {g.save();if(style==='herringbone'){g.translate(256,256);g.rotate(Math.PI/4);g.translate(-256,-256);const cell=32,L=4,mod=x=>((x%(2*L))+2*L)%(2*L);for(let x=-14;x<30;x++)for(let y=-14;y<30;y++){const k=mod(x+y);if(k!==0&&k!==L)continue;g.save();g.translate(x*cell,y*cell);if(k===L){g.translate(0,cell);g.rotate(-Math.PI/2);}grain(0,0,cell,L*cell);g.strokeStyle='#47342570';g.strokeRect(0,0,cell,L*cell);g.restore();}}else{for(let x=0;x<512;x+=128)for(let y=0;y<512;y+=128){g.save();g.translate(x+64,y+64);if((x/128+y/128)%2===0)g.rotate(Math.PI/2);for(let i=0;i<4;i++){grain(-64+i*32,-64,32,128);g.strokeStyle='#47342555';g.strokeRect(-64+i*32,-64,32,128);}g.restore();}}g.restore();}}
 if(['marble','marble-tile','cement','stucco'].includes(style)){for(let i=0;i<70;i++){const x=rand()*S,y=rand()*S,r=35+rand()*160,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,i%2?'#ffffff14':'#3c36321b');gr.addColorStop(1,'#ffffff00');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}if(style.includes('marble'))for(let i=0;i<12;i++){let y=rand()*S;g.strokeStyle=i%2?'#6c68644d':'#ffffff88';g.lineWidth=.7+rand()*4;g.beginPath();g.moveTo(-20,y);for(let x=0;x<=540;x+=40){y+=(rand()-.49)*50;g.lineTo(x,y);}g.stroke();}}
 if(['granite','terrazzo'].includes(style))for(let i=0;i<(style==='granite'?4300:600);i++){let x=rand()*S,y=rand()*S,r=style==='granite'?1+rand()*3:2+rand()*8;g.fillStyle=['#ffffff66','#393a3b65','#aa8b7066','#e9d5bd88'][Math.floor(rand()*4)];g.beginPath();for(let j=0;j<5;j++){let a=j*Math.PI*2/5,rr=r*(.5+rand()*.5);j?g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):g.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}g.closePath();g.fill();}
 if(['tile','marble-tile','pattern-tile','carpet-tile'].includes(style)){const step=256;for(let x=0;x<S;x+=step)for(let y=0;y<S;y+=step){rect(x,y,step,step,rand()>.5?'#ffffff0b':'#0000000b');g.strokeStyle=style==='carpet-tile'?'#33333355':'#aaa398aa';g.lineWidth=style==='carpet-tile'?2:4;g.strokeRect(x,y,step,step);if(style==='pattern-tile'){g.strokeStyle='#f2e9d477';g.lineWidth=5;g.beginPath();g.moveTo(x+128,y+25);g.lineTo(x+231,y+128);g.lineTo(x+128,y+231);g.lineTo(x+25,y+128);g.closePath();g.stroke();g.beginPath();g.arc(x+128,y+128,44,0,Math.PI*2);g.stroke();}}}
 if(['carpet','carpet-tile','linen'].includes(style)){for(let i=0;i<512;i+=3){line(i,0,i,S,'#ffffff18',1);line(0,i,S,i,'#00000018',1);}for(let i=0;i<8000;i++){let x=rand()*S,y=rand()*S;line(x,y,x+1+rand()*2,y+1+rand()*3,rand()>.5?'#ffffff38':'#00000028',.8);}}
 if(style==='brick'){for(let y=0;y<S;y+=64){for(let x=(y/64%2)*128-256;x<S;x+=256){rect(x+3,y+3,250,58,rand()>.5?'#ffffff14':'#00000014');g.strokeStyle='#d7cbb288';g.lineWidth=5;g.strokeRect(x,y,256,64);}}}
 if(style==='wainscot'){for(let x=0;x<S;x+=256){g.strokeStyle='#00000030';g.lineWidth=8;g.strokeRect(x+20,20,216,472);g.strokeStyle='#ffffff55';g.lineWidth=3;g.strokeRect(x+26,26,204,460);}}
}images.set(p.id,c);if(images.size>24)images.delete(images.keys().next().value);return c;}
function texture(p){if(!textures.has(p.id)){const t=new THREE.CanvasTexture(image(p));t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;textures.set(p.id,t);}return textures.get(p.id);}
function materialize(mesh,p,floor=false){const mat=mesh.material;if(!mat||Array.isArray(mat))return;mat.color.set(p.style==='paint'?p.color:'#ffffff');mat.map=p.style==='paint'?null:texture(p);mat.roughness=p.rough;mat.needsUpdate=true;if(!mat.map)return;const geo=mesh.geometry,uv=geo.attributes.uv,pos=geo.attributes.position;if(!uv||!pos)return;if(floor){for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/p.scale,-pos.getY(i)/p.scale);}else {const norm=geo.attributes.normal;for(let i=0;i<uv.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),nz=Math.abs(norm?.getZ(i)||0),ny=Math.abs(norm?.getY(i)||0);uv.setXY(i,(nz>.5?x:ny>.5?x:z)/p.scale,(ny>.5?z:y)/p.scale);}}uv.needsUpdate=true;}
const prevDraw=drawScene;drawScene=()=>{prevDraw();if(!worldGroup)return;try{const f=worldGroup.children.find(o=>o.isMesh&&o.geometry?.type==='ShapeGeometry');if(f)materialize(f,selectedFinish('floor'),true);worldGroup.traverse(o=>{if(o.name==='room_wall')materialize(o,selectedFinish('wall'));});}catch(e){console.warn('IDEARE room finishes',e);}};
// Define-space layout: separate lazy WebGL preview, so the cabinet scene remains intact.
const oldPaletteEl=tools.querySelector(':scope > .ideare-environment');
const finishUI=document.createElement('div');finishUI.className='v10-finish-ui';finishUI.innerHTML='<div class="v10-section-label">Surface library</div><div class="v10-tabs" role="group" aria-label="Surface type"><button type="button" data-v10-kind="floor">Flooring</button><button type="button" data-v10-kind="wall">Walls</button></div><div class="v10-current"><img alt=""><div><small>Selected finish</small><strong></strong></div></div><label>Material category<select id="v10-category"></select></label><label>Find a finish<input id="v10-search" type="search" placeholder="Oak, marble, sage…" autocomplete="off"></label><div class="v10-custom" hidden><label>Custom paint <input type="color" value="#f2eee6" aria-label="Custom wall paint colour"></label><button type="button">Apply</button></div><div class="v10-count" aria-live="polite"></div><div class="v10-gallery" role="group" aria-label="Material finishes"></div><p class="v10-caption">Concept finishes · actual samples to be confirmed.</p>';
// The legacy palette contains its own nested .id3-note. insertBefore
// requires a direct child of tools; using the nested note aborts initialization.
const insertionAnchor=oldPaletteEl || tools.querySelector(':scope > .id3-note');
tools.insertBefore(finishUI,insertionAnchor);
let kind='floor';const categories={floor:'all',wall:'all'},searches={floor:'',wall:''};
const category=finishUI.querySelector('#v10-category'),query=finishUI.querySelector('#v10-search'),gallery=finishUI.querySelector('.v10-gallery'),custom=finishUI.querySelector('.v10-custom');
function setFinish(p,customColor){const old=selectedFinish(kind);if(old.id===p&&!customColor||customColor&&old.id==='custom-'+customColor)return;history();const f=model.room.spaceFinishes||{floor:selectedFinish('floor').id,wall:selectedFinish('wall').id};model.room.spaceFinishes={...f,[kind]:p,...(customColor?{customWall:customColor}:{})};refreshCatalogue(false);renderPlan();drawScene();changed(false);}
function refreshCatalogue(rebuild=true){const list=kind==='floor'?floors:wallFinishes,p=selectedFinish(kind);finishUI.querySelectorAll('[data-v10-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v10Kind===kind)));finishUI.querySelector('.v10-current img').src=image(p).toDataURL('image/png');finishUI.querySelector('.v10-current strong').textContent=p.name;custom.hidden=kind!=='wall';if(kind==='wall')custom.querySelector('input').value=p.color;
if(rebuild){category.innerHTML='<option value="all">All materials</option>'+[...new Set(list.map(p=>p.category))].map(c=>`<option value="${safe(c)}">${safe(c)}</option>`).join('');category.value=categories[kind];query.value=searches[kind];}
const filtered=list.filter(p=>(categories[kind]==='all'||p.category===categories[kind])&&(`${p.name} ${p.category} ${p.style}`.toLowerCase().includes(searches[kind].toLowerCase())));finishUI.querySelector('.v10-count').textContent=`${filtered.length} of ${list.length} finishes`;
const oldScroll=gallery.scrollTop;gallery.replaceChildren();const fragment=document.createDocumentFragment();for(const p of filtered){const b=document.createElement('button');b.type='button';b.dataset.finish=p.id;b.setAttribute('aria-pressed',String(p.id===selectedFinish(kind).id));b.title=p.category+' · '+p.name;b.innerHTML=`<img alt="" loading="lazy"><span>${safe(p.name)}</span><small>${safe(p.style.replaceAll('-',' '))}</small>`;const source=p;const im=b.querySelector('img');im.dataset.finishImage=source.id;fragment.append(b);}gallery.append(fragment);gallery.scrollTop=rebuild?0:oldScroll;if(!filtered.length)gallery.textContent='No matching finishes. Try another category.';loadVisibleSwatches();}
// Limit thumbnail generation to the visible rows (and nearby rows).
const thumbURLs=new Map();let observer=null;
function fillThumb(im){if(im.hasAttribute('src'))return;const p=byId.get(im.dataset.finishImage);if(!p)return;if(!thumbURLs.has(p.id)){const c=document.createElement('canvas');c.width=c.height=144;c.getContext('2d').drawImage(image(p),0,0,144,144);thumbURLs.set(p.id,c.toDataURL('image/jpeg',.82));}im.src=thumbURLs.get(p.id);}
function loadVisibleSwatches(){observer?.disconnect();const imgs=gallery.querySelectorAll('img[data-finish-image]');if(typeof IntersectionObserver==='undefined'){imgs.forEach(fillThumb);return;}observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){try{fillThumb(e.target);}catch(error){console.warn('IDEARE finish swatch:',error);}observer.unobserve(e.target);}},{root:gallery,rootMargin:'140px'});imgs.forEach(im=>observer.observe(im));}
finishUI.addEventListener('click',e=>{const tab=e.target.closest('[data-v10-kind]'),b=e.target.closest('[data-finish]');if(tab){kind=tab.dataset.v10Kind;refreshCatalogue();}else if(b){setFinish(b.dataset.finish);}else if(e.target.closest('.v10-custom button'))setFinish('custom',custom.querySelector('input').value);});category.onchange=()=>{categories[kind]=category.value;refreshCatalogue(false);gallery.scrollTop=0;};query.oninput=()=>{searches[kind]=query.value;refreshCatalogue(false);gallery.scrollTop=0;};
const preview=document.createElement('div');preview.className='v10-preview';preview.innerHTML='<div class="v10-pane-head"><div><strong>Live room preview</strong><small>Orbit to inspect walls and finishes</small></div><button type="button" data-v10-fit>Fit view</button></div><div class="v10-preview-canvas"><canvas aria-label="Live 3D room preview"></canvas><div class="v10-preview-status">Preparing room preview…</div></div><div class="v10-preview-foot"><span>Drag to orbit · Scroll to zoom</span><span class="v10-preview-height"></span></div>';layout.append(preview);
const pc=preview.querySelector('canvas'),pvStatus=preview.querySelector('.v10-preview-status'),pvWrap=preview.querySelector('.v10-preview-canvas');let pr=null,ps=null,cam=null,orbit=null,pg=null,pvFailed=false,pvFrame=0,pendingRoom=null,lastRoomKey='',wallMeshes=[];
function initPreview(){if(pr||pvFailed)return !!pr;try{pr=new THREE.WebGLRenderer({canvas:pc,antialias:true,alpha:false});pr.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));pr.outputColorSpace=THREE.SRGBColorSpace;ps=new THREE.Scene();cam=new THREE.PerspectiveCamera(42,1,.04,120);orbit=new OrbitControls(cam,pc);orbit.enableDamping=false;orbit.enablePan=true;orbit.minDistance=.6;orbit.maxDistance=55;orbit.maxPolarAngle=Math.PI/2-.015;orbit.addEventListener('change',paintPreview);ps.add(new THREE.HemisphereLight(0xfff7e9,0x777c85,2.3));const sun=new THREE.DirectionalLight(0xfff0d8,2);sun.position.set(5,9,3);ps.add(sun);const fill=new THREE.DirectionalLight(0xe8f1ff,.8);fill.position.set(-5,5,-4);ps.add(fill);pvStatus.hidden=true;return true;}catch(e){pvFailed=true;console.warn('IDEARE room preview',e);pvStatus.textContent='3D preview unavailable. The floor plan and main designer remain available.';return false;}}
function resizePreview(){if(!pr||!cam)return;const r=pvWrap.getBoundingClientRect();if(r.width<4||r.height<4)return;pr.setSize(r.width,r.height,false);cam.aspect=r.width/r.height;cam.updateProjectionMatrix();}
function fitPreview(r=pendingRoom||model.room){if(!cam||!orbit)return;const w=r.width/1000,d=r.depth/1000,h=r.height/1000,size=Math.max(w,d,h);orbit.target.set(w/2,Math.min(h*.45,1.6),d/2);cam.position.set(w/2+size*.9,h*.75+size*.75,d/2+size*1.05);cam.lookAt(orbit.target);orbit.update();}
function paintPreview(){if(!pr||!ps||!cam||section.hidden||!pvWrap.clientWidth)return;const dark=document.documentElement.dataset.theme==='dark';ps.background=new THREE.Color(dark?'#292b2e':'#eae7e1');const eye=cam.position,t=orbit.target;for(const {mesh,a,b} of wallMeshes){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),side=(eye.x-a.x)*(-dz)+(eye.z-a.z)*dx,targetSide=(t.x-a.x)*(-dz)+(t.z-a.z)*dx;let blocked=false;if(side<-.0001&&targetSide>0){const s=side/(side-targetSide),x=eye.x+(t.x-eye.x)*s,z=eye.z+(t.z-eye.z)*s,y=eye.y+(t.y-eye.y)*s,u=((x-a.x)*dx+(z-a.z)*dz)/(len*len);blocked=u>=0&&u<=1&&y>=0&&y<=mesh.geometry.parameters.height;}mesh.visible=!blocked;}pr.render(ps,cam);}
function buildPreview(r){if(section.hidden||!initPreview())return;const first=!pg;if(pg){ps.remove(pg);disposeGroup(pg);}pg=new THREE.Group();ps.add(pg);const vs=vertices(r),f=new THREE.Mesh(polygonFloor(vs),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.7,side:THREE.DoubleSide}));f.rotation.x=-Math.PI/2;f.position.y=-.005;pg.add(f);materialize(f,selectedFinish('floor',r),true);wallMeshes=[];for(let i=0;i<vs.length;i++){if(!solid(i,r))continue;const v=vs[i],q=vs[(i+1)%vs.length],a={x:v.x/1000,z:v.z/1000},b={x:q.x/1000,z:q.z/1000},len=Math.hypot(b.x-a.x,b.z-a.z),h=r.height/1000;const m=ideareJoinedWall(pg,vs,i,r,h,new THREE.MeshStandardMaterial({color:0xffffff}),'preview-wall');materialize(m,selectedFinish('wall',r));wallMeshes.push({mesh:m,a,b});}preview.querySelector('.v10-preview-height').textContent=`Ceiling ${Math.round(r.height)} mm`;resizePreview();if(first)fitPreview(r);paintPreview();}
function schedulePreview(r=model.room){pendingRoom=r;if(section.hidden)return;if(pvFrame)return;pvFrame=requestAnimationFrame(()=>{pvFrame=0;if(section.hidden)return;try{const r=pendingRoom,k=JSON.stringify([r.shape,r.width,r.depth,r.height,r.customOutline,r.spaceFinishes]);if(k!==lastRoomKey||!pg){lastRoomKey=k;buildPreview(r);}else{resizePreview();paintPreview();}}catch(error){console.error('IDEARE Define Space preview:',error);pvStatus.hidden=false;pvStatus.textContent='Room preview unavailable. The main designer remains available.';}});}
preview.querySelector('[data-v10-fit]').onclick=()=>{if(initPreview()){fitPreview();paintPreview();}};if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(!section.hidden){resizePreview();schedulePreview(pendingRoom||model.room);}}).observe(pvWrap);if(typeof MutationObserver==='function')new MutationObserver(()=>{try{paintPreview();}catch(error){console.warn('IDEARE room preview theme:',error);}}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
// Screen-fixed drag frame: edges translate along their normal, adjacent lines intersect.
// Corner handles scale the bounding rectangle while retaining the polygon topology.
const planPanel=plan.closest('.id3-plan-panel');planPanel.classList.add('v10-plan-panel');const head=planPanel.querySelector('.id3-pane-head');const hint=document.createElement('span');hint.className='v10-plan-hint';hint.textContent='Drag edges or corners';head.append(hint);const planStatus=document.createElement('div');planStatus.className='v10-plan-status';planPanel.append(planStatus);
let drag=null,queued=0,latest=null;
function view(p){const b=bounds(p),span=Math.max(b.r-b.l,b.b-b.t),s=330/span;return{s,ox:300-(b.l+b.r)/2*s,oy:240-(b.t+b.b)/2*s};}
function displayPlan(p=vertices(),r=model.room,v=view(p),blocked=false){const {s,ox,oy}=v,X=x=>ox+x*s,Z=z=>oy+z*s,pts=p.map(a=>`${X(a.x)},${Z(a.z)}`).join(' '),b=bounds(p),selectedFloor=selectedFinish('floor',r);const w=Math.round(b.r-b.l),d=Math.round(b.b-b.t);const labels=[];const center={x:(b.l+b.r)/2,z:(b.t+b.b)/2};
const edgeMarkup=p.map((a,i)=>{const q=p[(i+1)%p.length],x=(a.x+q.x)/2,z=(a.z+q.z)/2,len=Math.hypot(q.x-a.x,q.z-a.z),nx=-(q.z-a.z)/len,nz=(q.x-a.x)/len;const angle=Math.atan2(nz,nx),cursor=Math.abs(Math.cos(angle))>.8?'ew-resize':Math.abs(Math.sin(angle))>.8?'ns-resize':nx*nz>0?'nwse-resize':'nesw-resize';labels.push(`<text class="v10-edge-label" x="${X(x)-nx*24}" y="${Z(z)-nz*24}" text-anchor="middle" dominant-baseline="middle">${Math.round(len)} mm</text>`);return `<line class="v10-plan-edge ${solid(i,r)?'':'v10-open-edge'}" x1="${X(a.x)}" y1="${Z(a.z)}" x2="${X(q.x)}" y2="${Z(q.z)}"/><line class="v10-edge-hit" data-edge="${i}" style="cursor:${cursor}" x1="${X(a.x)}" y1="${Z(a.z)}" x2="${X(q.x)}" y2="${Z(q.z)}"/><rect class="v10-plan-grip" data-edge="${i}" tabindex="0" role="button" aria-label="Resize edge ${i+1}, ${Math.round(len)} millimetres" x="${X(x)-7}" y="${Z(z)-7}" width="14" height="14" rx="3" style="cursor:${cursor}"/>`;}).join('');
const corners=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sz])=>{const x=sx<0?b.l:b.r,z=sz<0?b.t:b.b;return `<rect class="v10-plan-corner" data-corner="${sx},${sz}" tabindex="0" role="button" aria-label="Resize room corner" x="${X(x)-6}" y="${Z(z)-6}" width="12" height="12" rx="3" style="cursor:${sx===sz?'nwse-resize':'nesw-resize'}"/>`;}).join('');
const dim=(k,value,x,y)=>`<foreignObject x="${x-54}" y="${y-15}" width="108" height="30"><div xmlns="http://www.w3.org/1999/xhtml" class="v10-dimension"><input aria-label="Room ${k} in millimetres" data-v10-dimension="${k}" type="number" min="1200" max="20000" step="1" value="${value}"/><span>mm</span></div></foreignObject>`;
plan.innerHTML=`<svg viewBox="0 0 600 480" aria-label="Resizable room floor plan" class="${blocked?'v10-blocked':''}"><defs><pattern id="v10-plan-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" stroke-width=".5" opacity=".11"/></pattern></defs><rect width="600" height="480" fill="url(#v10-plan-grid)"/><rect class="v10-bounds" x="${X(b.l)}" y="${Z(b.t)}" width="${w*s}" height="${d*s}"/><polygon points="${pts}" fill="${selectedFloor.color}" fill-opacity=".52"/><g>${edgeMarkup}</g>${labels.join('')}${corners}<text x="${X(center.x)}" y="${Z(center.z)}" class="v10-plan-title" text-anchor="middle">${(area(p)/1e6).toFixed(2)} m²</text>${dim('width',w,300,24)}${dim('depth',d,535,32)}</svg>`;
$('#room-area').textContent=(area(p)/1e6).toFixed(2)+' m²';$('#room-badge').textContent=`${w} mm × ${d} mm`;planStatus.textContent=blocked?'That size would overlap an edge, cabinet or wall panel.':'Drag any edge to resize · drag corners to scale · dimensions in mm';}
const previousRenderPlan=renderPlan;renderPlan=()=>{if(drag)return;try{displayPlan();schedulePreview();}catch(e){console.warn('IDEARE floor plan',e);previousRenderPlan();}};
function updateFields(){for(const k of ['width','depth','height'])$('#room-'+k).value=model.room[k];}
function commit(q){if(!q)return;history();model.room=q.room;for(const o of [...model.cabinets,...model.extras]){o.x+=q.dx;o.z+=q.dz;}updateFields();renderAll();changed(false);}
function cornerMove(p,sx,sz,dx,dz){const b=bounds(p),anchorX=sx<0?b.r:b.l,anchorZ=sz<0?b.b:b.t,w=b.r-b.l,d=b.b-b.t,nw=limit(round(w+sx*dx),MIN,MAX),nd=limit(round(d+sz*dz),MIN,MAX);return p.map(v=>({x:anchorX+(v.x-anchorX)*nw/w,z:anchorZ+(v.z-anchorZ)*nd/d}));}
function makeCandidate(m,dx,dz){const p=m.corner?cornerMove(m.points,...m.corner,dx,dz):moveEdge(m.points,m.edge,dx,dz);return candidate(p,m.room);}
function fromPointer(e){const p=plan.querySelector('svg'),matrix=p?.getScreenCTM();if(!matrix)return null;const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());return {x:pt.x,z:pt.y};}
plan.addEventListener('pointerdown',e=>{const handle=e.target.closest('[data-edge],[data-corner]');if(!handle||e.button!==0||drag)return;const pt=fromPointer(e);if(!pt)return;e.preventDefault();const points=vertices(),v=view(points);drag={id:e.pointerId,start:pt,points,v,room:deep(model.room),edge:Number(handle.dataset.edge),corner:handle.dataset.corner?.split(',').map(Number),last:null};plan.setPointerCapture(e.pointerId);plan.classList.add('v10-dragging');});
function dragUpdate(e){if(!drag)return;const pt=fromPointer(e);if(!pt)return;const dx=(pt.x-drag.start.x)/drag.v.s,dz=(pt.z-drag.start.z)/drag.v.s,q=makeCandidate(drag,dx,dz);if(q&&contentsFit(q.room,q.dx,q.dz)){drag.last=q;displayPlan(q.raw,q.room,drag.v);schedulePreview(q.room);}else{displayPlan(drag.last?.raw||drag.points,drag.last?.room||drag.room,drag.v,true);}}
plan.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;latest={clientX:e.clientX,clientY:e.clientY};if(!queued)queued=requestAnimationFrame(()=>{queued=0;dragUpdate(latest);});});
function end(e,cancel=false){if(!drag||e&&e.pointerId!==drag.id)return;if(queued){cancelAnimationFrame(queued);queued=0;}if(!cancel&&e)dragUpdate(e);const m=drag;drag=null;plan.classList.remove('v10-dragging');try{plan.releasePointerCapture(m.id);}catch(_){}if(!cancel&&m.last&&m.last.raw.some((p,i)=>Math.hypot(p.x-m.points[i].x,p.z-m.points[i].z)>.01))commit(m.last);else renderPlan();}
plan.addEventListener('pointerup',e=>end(e));plan.addEventListener('pointercancel',e=>end(e,true));plan.addEventListener('lostpointercapture',e=>end(e,true));window.addEventListener('blur',()=>end(null,true));window.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();e.stopImmediatePropagation();end(null,true);}},true);
plan.addEventListener('keydown',e=>{const h=e.target.closest('[data-edge],[data-corner]');if(!h||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?100:10,[dx,dz]=({ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]})[e.key],p=vertices(),m={points:p,room:model.room,edge:Number(h.dataset.edge),corner:h.dataset.corner?.split(',').map(Number)},q=makeCandidate(m,dx,dz);if(q&&q.raw.some((p,i)=>Math.hypot(p.x-m.points[i].x,p.z-m.points[i].z)>.01)&&contentsFit(q.room,q.dx,q.dz)){commit(q);plan.querySelector(h.dataset.edge!==undefined?`rect[data-edge="${h.dataset.edge}"]`:`[data-corner="${h.dataset.corner}"]`)?.focus();}});
function typed(e){const field=e.target.closest('[data-v10-dimension]');if(!field)return;const key=field.dataset.v10Dimension,value=Number(field.value);if(!Number.isFinite(value)||value<MIN||value>MAX){notify('Room dimensions must be between 1200 and 20000 mm.',true);renderPlan();return;}const input=$('#room-'+key);input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));renderPlan();}
plan.addEventListener('change',typed);plan.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-v10-dimension]'))e.target.blur();});
const roomBar=section.querySelector('.studio-room-bar small');if(roomBar)roomBar.textContent='Drag the floor plan edges or enter exact dimensions. Preview finishes in 3D.';
// Populate the expensive canvas swatches only when Define Space is actually visible.
// A bad catalogue entry or unavailable canvas must not stop boot() or draft restoration.
function refreshSpace(){try{refreshCatalogue();}catch(error){console.error('IDEARE Define Space catalogue:',error);gallery.textContent='Unable to load finish previews. Reopen Define Space to retry.';}try{renderPlan();schedulePreview();}catch(error){console.error('IDEARE Define Space plan:',error);}}
const prevStep=showStep;showStep=i=>{prevStep(i);if(model.step===2)refreshSpace();};
const prevHistory=applyHistory;applyHistory=s=>{prevHistory(s);if(model.step===2)refreshSpace();};
// Only retire the legacy controls after all new controls and hooks exist.
if(oldPaletteEl)oldPaletteEl.hidden=true;
section.dataset.spaceEditor='10.2';
if(model.step===2&&!section.hidden)queueMicrotask(refreshSpace);
window.addEventListener('pagehide',()=>{observer?.disconnect();orbit?.dispose();pr?.dispose();for(const t of textures.values())t.dispose();});
})();

} catch(error){console.error('IDEARE Define Space startup:',error);const old=document.querySelector('.ideare-environment');if(old)old.hidden=false;const section=document.querySelector('[data-panel="2"]');if(section){section.querySelector('.v10-finish-ui')?.remove();section.querySelector('.v10-preview')?.remove();const note=document.createElement('p');note.className='id3-note';note.textContent='Define Space upgrade failed: '+(error?.message||String(error));section.querySelector('.studio-room-tools')?.append(note);}try{notify('Define Space upgrade could not initialize. The main designer is still available. See browser console.',true);}catch(_){} }
;
/* IDEARE interaction and integrated appliance update 2026-11-25 */
function ideareApplianceLabel(c){return [c.uid?template(c.templateId)?.slug:'',c.name,c.kind].filter(Boolean).join(' ').replace(/[-_]/g,' ').toLowerCase();}
function ideareSink(c){return !!c?.uid&&/\bsink\b/.test(ideareApplianceLabel(c))&&c.category!=='wall-cabinets';}
function ideareIntegrated(c){return !!c?.uid&&/\b(sink|oven|microwave|fridge|freezer|refrigerator|dishwasher|hob|cooker|hood|extractor)\b/.test(ideareApplianceLabel(c));}
function ideareTintAppliance(g,c){if(!/^#[0-9a-f]{6}$/i.test(c.applianceColor||''))return;
 const materials=new Map();g.traverse(o=>{if(!o.isMesh||!o.material?.color||!(/^(appliance_body|oven_facade|microwave_body|freezer_door|fridge_door|dishwasher_door|hood_canopy|hood_chimney|ceramic_hob|hob_cooktop|v6_hood_glass_panel|v6_hood_chimney|v6_hood_lower_trim|v7_microwave_body|v7_microwave_face|ideare_appliance_finish)/.test(o.name)))return;
  if(!materials.has(o.material)){const m=o.material.clone();m.color.set(c.applianceColor);m.map=null;materials.set(o.material,m);}o.material=materials.get(o.material);
 });}
(()=>{
 const oldMake=makeCabinet;
 const steel=()=>new THREE.MeshStandardMaterial({color:0xaeb5b8,metalness:.65,roughness:.31});
 const dark=()=>new THREE.MeshStandardMaterial({color:0x24282b,roughness:.24,metalness:.25});
 const glass=()=>new THREE.MeshStandardMaterial({color:0x141b21,roughness:.14,metalness:.25});
 const remove=(g,o)=>{g.remove(o);o.traverse(m=>m.geometry?.dispose());};
 function sink(g,c){
  const w=c.width/1000,d=c.depth/1000,H=c.height/1000,t=Math.max(.012,Math.min(.05,(c.thickness||18)/1000));
  const sw=Math.min(.72,w-.09),sd=Math.min(.43,d-.12);if(sw<.12||sd<.10)return;
  const x=0,z=.005,topH=H+.028,st=steel(),inner=new THREE.MeshStandardMaterial({color:0x777f82,metalness:.68,roughness:.27});
  const oldTop=g.getObjectByName('worktop'),oldPanel=g.getObjectByName('top_panel');
  const topMat=oldTop?.material||(fetchTexture(c.worktopMaterial)?new THREE.MeshStandardMaterial({map:fetchTexture(c.worktopMaterial),color:0xffffff,roughness:.32}):mat(c.worktopType==='laminate'?'#947655':c.worktopType==='quartz'?'#dddcd9':'#707478',.38));
  const frameMat=oldPanel?.material||mat('#dfd4c6');
  for(const o of [...g.children])if(['worktop','top_panel','adjustable_shelf','partition'].includes(o.name))remove(g,o);
  function surround(W,D,th,y,m,name){const l=-W/2,r=W/2,b=-D/2,f=D/2,L=x-sw/2,R=x+sw/2,B=z-sd/2,F=z+sd/2;
   const piece=(ww,dd,xx,zz)=>{if(ww>.001&&dd>.001)addBox(g,ww,th,dd,xx,y,zz,m,name);};
   piece(L-l,D,(l+L)/2,0);piece(r-R,D,(r+R)/2,0);piece(sw,B-b,x,(b+B)/2);piece(sw,f-F,x,(F+f)/2);
  }
  surround(w,d,t,H-t/2,frameMat,'sink_cutout_carcass');surround(w,d,.028,H+.014,topMat,'sink_cutout_worktop');
  const rim=.017,bh=Math.min(.19,H*.23);for(const sign of [-1,1]){addBox(g,sw+rim*2,.008,rim,0,topH+.004,z+sign*(sd+rim)/2,st,'ideare_appliance_finish_sink_rim');addBox(g,rim,.008,sd,sign*(sw+rim)/2,topH+.004,z,st,'ideare_appliance_finish_sink_rim');addBox(g,.007,bh,sd,sign*(sw-.007)/2,topH-bh/2,z,inner,'ideare_appliance_finish_sink_bowl_side');addBox(g,sw-.014,bh,.007,0,topH-bh/2,z+sign*(sd-.007)/2,inner,'ideare_appliance_finish_sink_bowl_side');}
  addBox(g,sw-.014,.009,sd-.014,0,topH-bh,z,inner,'ideare_appliance_finish_sink_bowl_bottom');const drain=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.006,24),dark());drain.position.set(0,topH-bh+.009,z);g.add(drain);
  const fz=-d/2+.043,fx=Math.min(sw*.25,.13),fh=topH+.24;
  const pipe=new THREE.CatmullRomCurve3([new THREE.Vector3(fx,topH,fz),new THREE.Vector3(fx,fh-.035,fz),new THREE.Vector3(fx,fh,fz+.065),new THREE.Vector3(fx,fh-.04,fz+.145),new THREE.Vector3(fx,fh-.085,fz+.17)]);
  const tap=new THREE.Mesh(new THREE.TubeGeometry(pipe,28,.011,12,false),st);tap.name='sink_tap';g.add(tap);
 }
 function storageFront(g,c,lo,hi){const h=hi-lo,w=c.width/1000,d=c.depth/1000;if(h<.065||c.front==='open')return;const count=Math.max(1,Math.min(2,Number(c.doorCount)||2)),cell=w/count,front=finishMat(c);for(let i=0;i<count;i++){const left=count===1?c.hingeSide!=='right':i%2===0,sign=left?1:-1,p=new THREE.Group();p.position.set(-w/2+i*cell+(left?0:cell),lo,d/2+.008);addBox(p,Math.max(.01,cell-.002),h-.003,.019,sign*cell/2,h/2,0,front,'door_panel');if(model.selected===c.uid&&model.doorsOpen)p.rotation.y=left?-1.2:1.2;const profile=v7ResolvedHandle(c)||v7Handles.find(p=>p.id==='bar-steel')||v7Handles[0];if(profile&&profile.kind!=='none'&&!/handleless|push/i.test(catalog.handles.find(x=>Number(x.id)===Number(c.handle))?.name||'')){const hw=v7Hardware(profile,Math.min(.16,h*.55,cell*.7));hw.position.set(sign*(cell-.045),h/2,.012);hw.rotation.z=Math.PI/2;p.add(hw);}g.add(p);}}
 function ovenFace(g,c,lo,hi,kind){const w=c.width/1000,d=c.depth/1000,h=hi-lo,cy=(lo+hi)/2,W=Math.min(.60,w-.024),D=Math.min(.55,d-.03),z=d/2-.012;
  if(h<.08||W<.08||D<.03)return;const s=steel(),b=dark(),v=glass();
  addBox(g,W,h-.007,D,0,cy,z-D/2,s,'ideare_appliance_finish_body');addBox(g,W,h-.006,.021,0,cy,z+.012,s,'ideare_appliance_finish_face');
  if(kind==='fridge'){const gap=.004,free=Math.min(h*.32,.6);addBox(g,W-.003,free-gap,.024,0,lo+free/2,z+.025,s,'ideare_appliance_finish_fridge');addBox(g,W-.003,h-free-gap,.024,0,lo+free+(h-free)/2,z+.025,s,'ideare_appliance_finish_fridge');for(const y of [lo+free*.65,lo+free+(h-free)*.43])addBox(g,.015,Math.min(.27,h*.22),.035,W*.38,y,z+.051,b,'fridge_pull');return;}
  if(kind==='dishwasher'){addBox(g,W*.93,h*.81,.019,0,cy-h*.055,z+.025,s,'ideare_appliance_finish_dishwasher');addBox(g,W*.92,h*.10,.020,0,hi-h*.065,z+.028,b,'dishwasher_controls');addBox(g,W*.53,.015,.038,0,hi-h*.16,z+.045,s,'dishwasher_pull');return;}
  const micro=kind==='microwave',wh=h*(micro?.69:.66),ww=W*(micro?.67:.86),wx=micro?-W*.12:0,wy=cy-(micro?0:h*.075);
  addBox(g,ww,wh,.014,wx,wy,z+.029,v,'built_in_glass_window');
  if(micro){addBox(g,W*.15,h*.74,.013,W*.36,cy,z+.031,b,'microwave_controls');for(let i=0;i<3;i++)addBox(g,W*.07,h*.045,.007,W*.36,cy-h*.10*i,z+.043,s,'microwave_button');}
  else{addBox(g,W*.96,h*.15,.013,0,hi-h*.09,z+.025,b,'oven_control_panel');for(const k of [-1,1]){const knob=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.012,20),s);knob.rotation.x=Math.PI/2;knob.position.set(k*W*.35,hi-h*.09,z+.039);g.add(knob);}addBox(g,W*.63,.015,.04,0,hi-h*.22,z+.048,s,'oven_pull');}
  const display=new THREE.MeshStandardMaterial({color:0x75bdb2,emissive:0x28584c,emissiveIntensity:.55});addBox(g,micro?W*.09:W*.19,h*.046,.004,micro?W*.36:0,hi-h*.09,z+.043,display,'appliance_display');
 }
 function integrated(g,c){const label=ideareApplianceLabel(c),H=c.height/1000,pl=c.plinth?Math.max(.05,Math.min(.2,(c.plinthHeight||100)/1000)):0;
  if(ideareSink(c)){sink(g,c);return;}
  if(c.category==='wall-cabinets')return; // v6 hood and v7 microwave already have dedicated models.
  const fridge=/fridge|freezer|refrigerator/.test(label),oven=/\boven\b/.test(label),micro=/microwave/.test(label),dish=/dishwasher/.test(label);if(!fridge&&!oven&&!micro&&!dish)return;
  const tall=c.category==='tall-cabinets',base=pl+.02,usable=H-base;if(usable<.19)return;
  let bays=[];if(fridge)bays=[[base,Math.min(H-.025,base+Math.min(1.88,usable*.89)),'fridge']];else if(dish)bays=[[base,H-.024,'dishwasher']];else if(tall){const lo=base+usable*.31,oh=Math.min(.60,usable*(micro?.30:.35));if(oven)bays.push([lo,lo+oh,'oven']);if(micro){const mlo=oven?lo+oh+.018:lo;bays.push([mlo,Math.min(H-.025,mlo+Math.min(.36,usable*.24)),'microwave']);}}
  else{const hi=H-.055,lo=Math.max(base,hi-Math.min(.60,usable*.91));bays=[[lo,hi,micro&&!oven?'microwave':'oven']];}
  bays=bays.filter(b=>b[1]-b[0]>.08);if(!bays.length)return;
  for(const o of [...g.children])if(o.name==='ideare_drawer_rail'||o.name==='partition'||o.name==='drawer_front'||o.name==='drawer_box'||o.name==='ideare_lpg_14kg_concept'||(o.isGroup&&o.children.some(k=>k.name==='door_panel'))||(o.name==='adjustable_shelf'&&bays.some(([lo,hi])=>o.position.y>=lo-.018&&o.position.y<=hi+.018)))remove(g,o);
  let at=pl;for(const [lo,hi,k] of bays){storageFront(g,c,at,lo-.002);ovenFace(g,c,lo,hi,k);at=hi+.002;}storageFront(g,c,at,H);
 }
 makeCabinet=(c,...args)=>{const g=oldMake(c,...args);if(ideareIntegrated(c))integrated(g,c);ideareTintAppliance(g,c);return g;};
 const oldDraw=drawScene;drawScene=()=>{model.shared=model.shared.filter(r=>r.type!=='worktop'||!model.cabinets.some(c=>ideareSink(c)&&r.cabinetUids?.includes(c.uid)));oldDraw();};
 const oldInspector=renderInspector;renderInspector=()=>{oldInspector();const c=selected()||extraSelected();if(!c||c.uid&&!ideareIntegrated(c))return;const panel=c.uid?$('#selected-inspector'):$('#extra-inspector');if(!panel)return;
  let el=panel.querySelector('.ideare-appliance-colour');if(!el){el=document.createElement('div');el.className='ideare-appliance-colour';const anchor=c.uid?panel.querySelector('#ideare-option-shell'):panel.querySelector('.id3-detail');if(anchor)anchor.before(el);else panel.append(el);}
  const current=/^#[0-9a-f]{6}$/i.test(c.applianceColor||'')?c.applianceColor:'#aeb5b8';el.innerHTML=`<strong>Appliance finish</strong><div class="ideare-appliance-swatches">${[['#26292b','Black'],['#aeb5b8','Stainless steel'],['#f2f0eb','White'],['#8b8f8e','Graphite'],['#bdab8c','Champagne']].map(([v,n])=>`<button type="button" data-appliance-colour="${v}" style="--appliance-swatch:${v}" title="${n}" aria-label="${n}" aria-pressed="${c.applianceColor===v}"></button>`).join('')}<input type="color" data-appliance-custom aria-label="Custom appliance colour" value="${current}"><button type="button" data-appliance-colour="default" class="ideare-appliance-reset">Reset</button></div><small>Changes the appliance finish, not the cabinet doors.</small>`;
 };
 const originalInspector=renderInspector;renderInspector=()=>{const old=$('#selected-inspector .ideare-appliance-colour');old?.remove();originalInspector();};
 function setColour(v){const c=selected()||extraSelected();if(!c||c.uid&&!ideareIntegrated(c)||v!=='default'&&!/^#[0-9a-f]{6}$/i.test(v))return;history();if(v==='default')delete c.applianceColor;else c.applianceColor=v;renderAll();changed(false);}
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-appliance-colour]');if(b){e.preventDefault();setColour(b.dataset.applianceColour);}});
 document.addEventListener('change',e=>{if(e.target.matches?.('[data-appliance-custom]'))setColour(e.target.value);});
 const oldSave=save;save=mode=>{if(model.extras.some(c=>!window.IDEAREPlacementV4.valid(c))){notify('Move appliances fully inside the room before saving.',true);showStep(3);return;}return oldSave(mode);};
})();
/* IDEARE: clear room dimensions and configurable refrigerator housing */
function ideareWallOffset(vertices,i,thickness=.075){const a=vertices[i],b=vertices[(i+1)%vertices.length];let area=0;for(let j=0;j<vertices.length;j++){const u=vertices[j],v=vertices[(j+1)%vertices.length];area+=u.x*v.z-u.z*v.x;}const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,sign=area>=0?1:-1;return {x:sign*dz/len*thickness/2,z:-sign*dx/len*thickness/2};}
function ideareFridgeHousing(c){return !!c?.uid&&(c.fridgeLayout||/fridge|refrigerator|freezer/.test(ideareApplianceLabel(c)))&&c.category==='tall-cabinets';}
function ideareFridgeSpec(c){const t=Math.max(12,Math.min(35,Number(c.thickness)||18)),f=c.fridgeLayout||{},num=(v,d)=>v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):d;const fw=num(f.fw,Math.max(300,c.width-2*(t+25))),fh=num(f.fh,Math.max(400,c.height-400)),fd=num(f.fd,Math.max(250,c.depth-50)),oh=num(f.oh,350),top=fh+50+oh,ph0=num(f.ph,top),ph=ph0<=fh+1?top:ph0,D=fd+50;return {fw,fh,fd,doors:num(f.doors,2),type:f.type==='side'?'side':'stack',left:num(f.left,0),right:num(f.right,0),ph,lh:num(f.lh,ph),rh:num(f.rh,ph),oh,t,ow:Math.max(fw+2*(t+25),num(f.ow,fw+2*(t+25))),od:num(f.od,D),ld:num(f.ld,D),rd:num(f.rd,D)};}
function ideareFridgeDimensions(s){return {width:s.ow+s.left+s.right,height:Math.max(s.fh+50+s.oh,s.left?s.lh:0,s.right?s.rh:0),depth:Math.max(s.fd+50,s.od,s.left?s.ld:0,s.right?s.rd:0)};}
function ideareFridgeSpecValid(s){return [s.fw,s.fh,s.fd,s.left,s.right,s.ph,s.lh,s.rh,s.oh,s.t,s.ow,s.od,s.ld,s.rd].every(Number.isFinite)&&s.fw>=300&&s.fw<=1800&&s.fh>=400&&s.fh<=3000&&s.fd>=250&&s.fd<=1200&&[1,2,3,4].includes(s.doors)&&[s.left,s.right].every(v=>v===0||v>=200&&v<=1200)&&[s.ph,s.lh,s.rh].every(v=>v>=400&&v<=3500)&&s.oh>=150&&s.oh<=1200&&s.ow>=s.fw+2*(s.t+25)-.01&&s.ow<=2200&&[s.od,s.ld,s.rd].every(v=>v>=180&&v<=1400);}
// Cabinet body collision uses existing shaped footprint. Front projections are
// checked separately against the interior wall polygon, not adjacent cabinetry.
function ideareCabinetInterior(c){if(!c.uid)return true;if(ideareFridgeHousing(c)&&c.fridgeLayout){const s=ideareFridgeSpec(c),d=ideareFridgeDimensions(s);if(!ideareFridgeSpecValid(s)||['width','height','depth'].some(k=>Math.abs(c[k]-d[k])>.1))return false;}
 if(v6Special(c)){const kind=v6Kind(c),points=v6World(c,v6Local(c)),open=kind==='l'?[2,3]:[2];return open.every(i=>{const p=points[i],q=points[(i+1)%points.length],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);if(len<5)return true;const pad=65;return v6Fits({width:len,depth:pad,x:(p[0]+q[0])/2+dz/len*pad/2,z:(p[1]+q[1])/2-dx/len*pad/2,rotation:Math.atan2(dz,dx)*180/Math.PI});});}const front=65,a=(Number(c.rotation)||0)*Math.PI/180;
 return v6Fits({...c,depth:c.depth+front,x:c.x-Math.sin(a)*front/2,z:c.z+Math.cos(a)*front/2});}
(()=>{
 const steel=()=>new THREE.MeshStandardMaterial({color:0xaeb5b8,metalness:.65,roughness:.28});
 const dark=()=>mat('#282b2d',.36);
 function housing(c){const s=ideareFridgeSpec(c),g=new THREE.Group();g.userData.uid=c.uid;const t=s.t/1000,w=c.width/1000,D=c.depth/1000,H=c.height/1000,fw=s.fw/1000,fh=s.fh/1000,fd=s.fd/1000,l=s.left/1000,r=s.right/1000,oh=s.oh/1000,ph=s.ph/1000,core=s.ow/1000,cx=(l-r)/2,face=finishMat(c),frame=mat(c.carcass==='plywood'?'#c8b49b':c.carcass==='blockboard'?'#d8c0a1':'#e7e4dc'),metal=steel(),black=dark();
 const box=(W,h,d,x,y,z,m,name)=>{if(W>.001&&h>.001&&d>.001)return addBox(g,W,h,d,x,y,z,m,name);};
 const open=model.selected===c.uid&&model.doorsOpen;
 function storage(x,W,lo,hi,depth,hingeAway=0){const h=hi-lo,SD=Math.max(.12,depth-.065),back=-D/2,cz=back+SD/2,fz=back+SD-.010;if(h<.08||W<.12)return;box(W,t,SD,x,lo+t/2,cz,frame,'fridge_storage_bottom');box(W,t,SD,x,hi-t/2,cz,frame,'fridge_storage_top');for(const k of [-1,1])box(t,h-2*t,SD,x+k*(W-t)/2,lo+h/2,cz,frame,'fridge_storage_side');box(W-2*t,h-2*t,t,x,lo+h/2,back+t/2,frame,'fridge_storage_back');const shelves=h>.9?Math.min(6,Math.max(2,Number(c.shelves)||4)):Math.max(1,Math.min(2,Number(c.shelves)||1));for(let i=1;i<=shelves;i++)box(W-2*t,t,SD-t-.025,x,lo+t+i*(h-2*t)/(shelves+1),cz,frame,'fridge_storage_shelf');if(c.front==='open')return;const count=hingeAway?1:W>.65?2:1,cell=W/count;for(let i=0;i<count;i++){const sign=hingeAway|| (i%2===0?1:-1),p=new THREE.Group();p.position.set(x-W/2+i*cell+(sign<0?cell:0),lo,fz);p.rotation.y=open?-sign*1.22:0;addBox(p,cell-.003,h-.003,.019,sign*cell/2,h/2,0,face,'door_panel');const handle=v7ResolvedHandle(c)||v7Handles.find(k=>k.id==='bar-steel');if(handle&&handle.kind!=='none'){const hw=v7Hardware(handle,Math.min(.16,h*.55));hw.rotation.z=Math.PI/2;hw.position.set(sign*(cell-.048),h*.52,.012);p.add(hw);}g.add(p);}}
 // Keep cabinetry and handles behind the refrigerator hinge plane. The fridge
 // body sits on the floor, not on a cabinet bottom. Pantries share the back line.
 const overBottom=fh+.05,gableD=Math.min(D,s.od/1000)-.065;for(const k of [-1,1])box(t,overBottom,gableD,cx+k*(core-t)/2,overBottom/2,-D/2+gableD/2,frame,'fridge_surround_gable');storage(cx,core,overBottom,overBottom+oh,s.od/1000);if(l)storage(-w/2+l/2,l,0,s.lh/1000,s.ld/1000,1);if(r)storage(w/2-r/2,r,0,s.rh/1000,s.rd/1000,-1);
 const front=D/2-.006,rear=front-fd,bodyD=Math.max(.05,fd-.027),bodyZ=rear+bodyD/2,wall=.018,inner=mat('#e7e9e8',.48),doorOpen=ideareFridgeDoorPreview(c);
 box(fw,wall,bodyD,cx,wall/2,bodyZ,metal,'ideare_appliance_finish_fridge_body');box(fw,wall,bodyD,cx,fh-wall/2,bodyZ,metal,'ideare_appliance_finish_fridge_body');for(const k of [-1,1])box(wall,fh-2*wall,bodyD,cx+k*(fw-wall)/2,fh/2,bodyZ,metal,'ideare_appliance_finish_fridge_body');box(fw-2*wall,fh-2*wall,wall,cx,fh/2,rear+wall/2,inner,'fridge_inner_back');for(let i=1;i<5;i++)box(fw-2*wall,.012,bodyD-.05,cx,fh*i/5,bodyZ,inner,'fridge_inner_shelf');
 function door(x,y,ww,hh,side){const pivot=new THREE.Group(),sign=side===1?1:-1;const hinge=x-sign*ww/2;pivot.position.set(hinge,y,front);const leafX=sign*ww/2;addBox(pivot,ww-.004,hh-.004,.023,leafX,0,0,metal,'ideare_appliance_finish_fridge_door');addBox(pivot,.014,Math.min(.34,hh*.55),.025,leafX+sign*(ww/2-.038),0,.024,black,'fridge_pull');pivot.rotation.y=doorOpen?-sign*Math.PI/2:0;g.add(pivot);}
 if(s.doors===1)door(cx,fh/2,fw,fh,1);else if(s.type==='side'||s.doors>=3){const split=s.doors===2?0:fh*.35,upper=fh-split;door(cx-fw/4,split+upper/2,fw/2,upper,1);door(cx+fw/4,split+upper/2,fw/2,upper,-1);if(s.doors===3)door(cx,split/2,fw,split,1);if(s.doors===4){door(cx-fw/4,split/2,fw/2,split,1);door(cx+fw/4,split/2,fw/2,split,-1);}}else{const split=fh*.35;door(cx,split/2,fw,split,1);door(cx,split+(fh-split)/2,fw,fh-split,1);}
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.01,H+.01,D+.01)),new THREE.LineBasicMaterial({color:0xb3905c}));outline.position.y=H/2;outline.visible=model.selected===c.uid;g.add(outline);g.position.set(c.x/1000,0,c.z/1000);g.rotation.y=-(Number(c.rotation)||0)*Math.PI/180;ideareTintAppliance(g,c);return g;}
 const oldMake=makeCabinet;makeCabinet=(c,...args)=>ideareFridgeHousing(c)?housing(c):oldMake(c,...args);
 const surroundTemplate=()=>catalog.templates.find(t=>category(t)==='tall-cabinets'&&/fridge|refrigerator/.test(String(t.slug||t.name).toLowerCase()));
 const storageTemplate=()=>catalog.templates.find(t=>category(t)==='tall-cabinets'&&/tall.storage/.test(String(t.slug||t.name).toLowerCase()))||catalog.templates.find(t=>category(t)==='tall-cabinets'&&!/fridge|oven|microwave|dishwasher/.test(String(t.slug||t.name).toLowerCase()));
 function configure(c,s){c.fridgeLayout={...s};Object.assign(c,ideareFridgeDimensions(s));c.plinth=false;c.worktop=false;return c;}
 const oldStandard=standardCab;standardCab=t=>{const c=oldStandard(t);if(ideareFridgeHousing(c))configure(c,ideareFridgeSpec(c));return c;};
 const menu=$('#catalog-menu');function addHousing(wide){const t=surroundTemplate();if(!t){notify('No active fridge surround template is available.',true);return;}const c=standardCab(t);if(wide){c.name='Side-by-side fridge surround';configure(c,{...ideareFridgeSpec(c),fw:900,fh:1800,fd:700,doors:2,type:'side',ph:2200,lh:2200,rh:2200,oh:350,ow:900+2*(ideareFridgeSpec(c).t+25),od:750,ld:750,rd:750});}c.x=c.width/2;c.z=c.depth/2;const q=window.IDEAREPlacementV4.findOpenSpot(c,{x:c.x,z:c.z});if(!q){notify('No clear space for this refrigerator cabinet.',true);return;}commitNew(q);}
 function addMatching(){const t=storageTemplate(),f=selected()&&ideareFridgeHousing(selected())?selected():model.cabinets.filter(ideareFridgeHousing).at(-1);if(!t||!f){notify('Add a fridge surround first, then choose matching storage.',true);return;}const c=standardCab(t);Object.assign(c,{name:'Matching tall storage cabinet',width:f.width,height:f.height,depth:f.depth,material:deep(f.material),color:f.color,carcass:f.carcass,rotation:f.rotation});const a=(Number(f.rotation)||0)*Math.PI/180,near={x:f.x+Math.cos(a)*(f.width+c.width)/2,z:f.z+Math.sin(a)*(f.width+c.width)/2};Object.assign(c,near);const q=window.IDEAREPlacementV4.findOpenSpot(c,near);if(!q){notify('No clear space for matching storage. Resize the surround or free some room.',true);return;}commitNew(q);}
 // Add buttons only to the tall cabinet dropdown, including pointer and keyboard opening.
 function augment(){if(!menu||menu.hidden||!$('#catalog-bar [data-category-v5="tall-cabinets"]')?.classList.contains('active')||menu.querySelector('.ideare-fridge-catalog'))return;const block=document.createElement('div');block.className='ideare-fridge-catalog';block.innerHTML='<strong>Refrigerator housing</strong><button type="button" data-fridge-add="wide">Side-by-side fridge surround <small>900 mm appliance · customizable</small></button><button type="button" data-fridge-add="matching">Matching tall storage cabinet <small>Matches the latest surround dimensions</small></button>';menu.prepend(block);}
 if(menu)new MutationObserver(augment).observe(menu,{childList:true,attributes:true,attributeFilter:['hidden','class']});const bar=$('#catalog-bar');if(bar)new MutationObserver(augment).observe(bar,{subtree:true,attributes:true,attributeFilter:['class']});menu?.addEventListener('click',e=>{const b=e.target.closest('[data-fridge-add]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();b.dataset.fridgeAdd==='wide'?addHousing(true):addMatching();},true);
 const fields=[['fw','Fridge width',300,1800],['fh','Fridge height',400,3000],['fd','Fridge depth',250,1200],['oh','Overhead cabinet height',150,1200],['left','Left pantry width',0,1200],['right','Right pantry width',0,1200],['ph','Pantry height (both sides)',400,3500]];
 const oldInspector=renderInspector;renderInspector=()=>{oldInspector();const panel=$('#selected-inspector'),c=selected();panel?.querySelector('.ideare-fridge-config')?.remove();$('#id3-app')?.classList.toggle('ideare-fridge-active',!!ideareFridgeHousing(c));if(!ideareFridgeHousing(c)||!panel)return;const s=ideareFridgeSpec(c),el=document.createElement('div');el.className='ideare-fridge-config';el.innerHTML=`<strong>Refrigerator housing</strong><small>Fridge rests directly on the floor. Measurements in mm.</small><div class="ideare-fridge-fields">${fields.map(([k,label,min,max])=>`<label>${label}<input type="number" min="${min}" max="${max}" step="1" data-fridge-field="${k}" value="${Math.round(s[k])}"></label>`).join('')}<label>Fridge doors<select data-fridge-field="doors">${[1,2,3,4].map(n=>`<option value="${n}" ${s.doors===n?'selected':''}>${n}</option>`).join('')}</select></label><label>Door arrangement<select data-fridge-field="type"><option value="stack" ${s.type==='stack'?'selected':''}>Top / bottom</option><option value="side" ${s.type==='side'?'selected':''}>Side by side</option></select></label><label>Pantries<select data-fridge-side><option value="none" ${!s.left&&!s.right?'selected':''}>None</option><option value="left" ${s.left&&!s.right?'selected':''}>Left</option><option value="right" ${!s.left&&s.right?'selected':''}>Right</option><option value="both" ${s.left&&s.right?'selected':''}>Both</option></select></label></div><small>Pantries start at the overhead cabinet top. Resize either pantry or the overhead section with the preview grips. Zero pantry width removes that side. Verify installation clearances with the appliance manual.</small><button type="button" class="id3-btn id3-secondary" data-fridge-apply>Apply dimensions</button>`;const anchor=panel.querySelector('.ideare-appliance-colour')||panel.querySelector('#ideare-option-shell');if(anchor)anchor.before(el);else panel.append(el);};
 document.addEventListener('change',e=>{const height=e.target.closest('[data-fridge-field="fh"]');if(height){const c=selected(),ph=height.closest('.ideare-fridge-config').querySelector('[data-fridge-field="ph"]');if(ideareFridgeHousing(c)){const old=ideareFridgeSpec(c),top=old.fh+50+old.oh;if(Number(ph.value)===top)ph.value=Number(height.value)+50+Number(height.closest('.ideare-fridge-config').querySelector('[data-fridge-field="oh"]').value);}}const select=e.target.closest('[data-fridge-side]');if(!select)return;const p=select.closest('.ideare-fridge-config'),left=p.querySelector('[data-fridge-field="left"]'),right=p.querySelector('[data-fridge-field="right"]'),ph=p.querySelector('[data-fridge-field="ph"]'),fh=p.querySelector('[data-fridge-field="fh"]');left.value=['left','both'].includes(select.value)?Number(left.value)||450:0;right.value=['right','both'].includes(select.value)?Number(right.value)||450:0;ph.value=Number(fh.value)+50+Number(p.querySelector('[data-fridge-field="oh"]').value);});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-fridge-apply]');if(!b)return;const c=selected();if(!ideareFridgeHousing(c))return;const s=ideareFridgeSpec(c),old={...s};for(const f of b.closest('.ideare-fridge-config').querySelectorAll('[data-fridge-field]')){const k=f.dataset.fridgeField;if(k!=='type'&&f.value.trim()===''){notify('Enter all refrigerator dimensions.',true);return;}s[k]=k==='type'?f.value:Number(f.value);}ideareSyncFridgeFields(s,old);if(!ideareFridgeSpecValid(s)){notify('Check fridge and pantry dimensions. Pantry width must be zero or at least 200 mm.',true);return;}const q=configure({...c},s),a=(Number(c.rotation)||0)*Math.PI/180,dd=(q.depth-c.depth)/2;q.x=c.x-Math.sin(a)*dd;q.z=c.z+Math.cos(a)*dd;if(!window.IDEAREPlacementV4.valid(q)){notify('These dimensions would overlap another object or extend outside the room. Move the surround or reduce its size.',true);return;}history();Object.assign(c,q);renderAll();changed(false);});
 // The surrounding assembly has separate measurements; prevent generic edits
 // from changing its outer bounding box without updating the actual components.
 const oldDimension=updateDimension;updateDimension=(k,v,final=false)=>{const c=selected();if(ideareFridgeHousing(c)){const el=$(`[data-dimension="${k}"]`),slider=$(`[data-slider="${k}"]`);if(el)el.value=c[k];if(slider)slider.value=c[k];return;}return oldDimension(k,v,final);};
})();
;
/* IDEARE unified alignment and joined walls */
function ideareSolidWall(i,r){return !((['open','u_open'].includes(r.shape)&&i===2)||(r.shape==='l_open'&&i===3));}
// Vertices represent the finished inner faces. Intersect adjacent offset lines
// to produce one continuous exterior corner, including angled and concave walls.
function ideareWallPolygon(v,i,r,th=.075){
 const n=v.length,pt=j=>({x:v[(j+n)%n].x/1000,z:v[(j+n)%n].z/1000});
 let area=0;for(let j=0;j<n;j++){const a=pt(j),b=pt(j+1);area+=a.x*b.z-b.x*a.z;}
 const sign=area>=0?1:-1;
 const edge=j=>{const a=pt(j),b=pt(j+1),l=Math.hypot(b.x-a.x,b.z-a.z)||1;return {a,b,tx:(b.x-a.x)/l,tz:(b.z-a.z)/l,nx:sign*(b.z-a.z)/l,nz:-sign*(b.x-a.x)/l};};
 const e=edge(i),prev=(i+n-1)%n,next=(i+1)%n;
 const joint=(p,other,enabled)=>{const a={x:p.x+e.nx*th,z:p.z+e.nz*th};if(!enabled)return a;const b={x:p.x+other.nx*th,z:p.z+other.nz*th},den=e.tx*other.tz-e.tz*other.tx;if(Math.abs(den)<1e-7)return a;const t=((b.x-a.x)*other.tz-(b.z-a.z)*other.tx)/den;if(Math.abs(t)>th*8)return a;return {x:a.x+e.tx*t,z:a.z+e.tz*t};};
 return [e.a,e.b,joint(e.b,edge(next),ideareSolidWall(next,r)),joint(e.a,edge(prev),ideareSolidWall(prev,r))];
}
function ideareJoinedWall(group,v,i,r,h,material,name){const p=ideareWallPolygon(v,i,r),a=p[0],b=p[1],cx=(a.x+b.x)/2,cz=(a.z+b.z)/2,angle=Math.atan2(b.z-a.z,b.x-a.x),co=Math.cos(angle),si=Math.sin(angle),s=new THREE.Shape();p.forEach((p,i)=>{const x=p.x-cx,z=p.z-cz,u=x*co+z*si,t=-x*si+z*co;i?s.lineTo(u,-t):s.moveTo(u,-t);});s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);geo.translate(0,-h/2,0);geo.parameters.height=h;const m=new THREE.Mesh(geo,material);m.name=name;m.position.set(cx,h/2,cz);m.rotation.y=-angle;m.receiveShadow=true;m.castShadow=false;group.add(m);return m;}
// Magnetic targets: a short exact-snap plateau and a continuous release band.
function ideareMagnet(raw,target,enter=30,release=75){const d=raw-target,a=Math.abs(d);if(a>=release)return raw;if(a<=enter)return target;const t=(a-enter)/(release-enter),smooth=t*t*(3-2*t);return target+d*smooth;}
let ideareSnapSuppressed=false;
function ideareNearest(raw,targets,enter=30,release=75){if(ideareSnapSuppressed)return raw;let best=null,dist=release;for(const t of targets){const d=Math.abs(t-raw);if(d<dist){best=t;dist=d;}}return best===null?raw:ideareMagnet(raw,best,enter,release);}
function ideareGuideHeight(c){if(c.ideareGuidePanel)return [c.bottom,c.bottom+c.height];if(c.uid){const y=c.category==='wall-cabinets'?1350:0;return [y,y+c.height];}const shape=window.IDEAREDesignerCatalogV3?.findProfile(c)?.shape;if(shape==='hood')return [Math.max(1400,Math.min(model.room.height-140,1950))-140,model.room.height];if(['wall-shelf','rack','organiser','rail','lighting','safety','wall-table'].includes(shape)){const y=Math.min(Math.max(1100,model.room.height*.57),2000);return [Math.max(0,y-c.height/2),Math.min(model.room.height,y+c.height/2)];}return [0,c.height];}
function ideareAlignBounds(c){const p=v6World(c,v6Local(c));return {x:[Math.min(...p.map(a=>a[0])),c.x,Math.max(...p.map(a=>a[0]))],z:[Math.min(...p.map(a=>a[1])),c.z,Math.max(...p.map(a=>a[1]))],y:ideareGuideHeight(c)};}
function ideareAlignmentObjects(){const v=roomVertices(),p=(Array.isArray(model.room.backsplashes)?model.room.backsplashes:[]).flatMap(b=>{const a=v[b.wallIndex],z=v[(b.wallIndex+1)%v.length];if(!a||!z)return [];const dx=z.x-a.x,dz=z.z-a.z,len=Math.hypot(dx,dz);if(len<1)return [];const at=b.offset+b.width/2;return [{id:b.id,x:a.x+at*dx/len,z:a.z+at*dz/len,width:b.width,depth:8,height:b.height,bottom:b.bottom,rotation:Math.atan2(dz,dx)*180/Math.PI,ideareGuidePanel:true}];});return [...model.cabinets,...model.extras,...p];}
function ideareMoveTargets(c,axis){const m=ideareAlignBounds(c),vals=[],id=c.uid||c.id;for(const o of ideareAlignmentObjects()){if((o.uid||o.id)===id)continue;const r=ideareAlignBounds(o);for(const a of m[axis])for(const b of r[axis])vals.push(c[axis]+b-a);}for(const p of roomVertices())for(const a of [m[axis][0],m[axis][2]])vals.push(c[axis]+p[axis]-a);return vals;}
let ideareGuideSvg=null;
function ideareClearGuides(){if(ideareGuideSvg){ideareGuideSvg.replaceChildren();ideareGuideSvg.hidden=true;}}
function ideareShowGuides(c,axes=['x','z']){ideareClearGuides();if(!camera||!c||model.step!==3)return;const wrap=$('#canvas-wrap');if(!wrap)return;if(!ideareGuideSvg){ideareGuideSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');ideareGuideSvg.setAttribute('class','ideare-align-guides');ideareGuideSvg.setAttribute('aria-hidden','true');wrap.append(ideareGuideSvg);}const rect=wrap.getBoundingClientRect();if(!rect.width||!rect.height)return;ideareGuideSvg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);camera.updateMatrixWorld();const m=ideareAlignBounds(c),id=c.uid||c.id;const project=p=>{const v=new THREE.Vector3(p[0]/1000,p[1]/1000,p[2]/1000).project(camera);return [(v.x+1)*rect.width/2,(1-v.y)*rect.height/2,v.z];};const line=(a,b)=>{const p=project(a),q=project(b);if([...p,...q].some(v=>!Number.isFinite(v))||p[2]<-1||p[2]>1||q[2]<-1||q[2]>1)return;const l=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [k,v] of Object.entries({x1:p[0],y1:p[1],x2:q[0],y2:q[1]}))l.setAttribute(k,v);ideareGuideSvg.append(l);};
 for(const axis of axes){let found=false;for(const o of ideareAlignmentObjects()){if((o.uid||o.id)===id)continue;const n=ideareAlignBounds(o),a=axis==='y'?[m.y[1]]:m[axis],b=axis==='y'?[n.y[1]]:n[axis];const match=a.find(x=>b.some(y=>Math.abs(x-y)<1));if(match===undefined)continue;if(axis==='x')line([match,m.y[1],m.z[2]],[match,n.y[1],n.z[2]]);else if(axis==='z')line([m.x[2],m.y[1],match],[n.x[2],n.y[1],match]);else line([m.x[0],match,m.z[2]],[n.x[2],match,n.z[2]]);if(ideareGuideSvg.childNodes.length>=3){found=true;break;}found=true;break;}if(!found&&axis!=='y'){const match=[m[axis][0],m[axis][2]].find(x=>roomVertices().some(p=>Math.abs(p[axis]-x)<1));if(match!==undefined){if(axis==='x')line([match,m.y[0],m.z[0]],[match,m.y[1],m.z[2]]);else line([m.x[0],m.y[0],match],[m.x[2],m.y[1],match]);}}}
 ideareGuideSvg.hidden=!ideareGuideSvg.childNodes.length;}
function idearePanelGuide(p,w,targets){ideareClearGuides();if(!camera||!w||!p)return;const wrap=$('#canvas-wrap');if(!wrap)return;if(!ideareGuideSvg){ideareGuideSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');ideareGuideSvg.setAttribute('class','ideare-align-guides');wrap.append(ideareGuideSvg);}const rect=wrap.getBoundingClientRect();ideareGuideSvg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);const line=(u,y,U,Y)=>{const points=[[u,y],[U,Y]].map(([x,h])=>new THREE.Vector3((w.x+w.tx*x+w.nx*15)/1000,h/1000,(w.z+w.tz*x+w.nz*15)/1000).project(camera));if(points.some(p=>p.z<-1||p.z>1))return;const l=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [k,v] of Object.entries({x1:(points[0].x+1)*rect.width/2,y1:(1-points[0].y)*rect.height/2,x2:(points[1].x+1)*rect.width/2,y2:(1-points[1].y)*rect.height/2}))l.setAttribute(k,v);ideareGuideSvg.append(l);};for(const u of [p.offset,p.offset+p.width])if(targets.xs.some(v=>Math.abs(v-u)<1))line(u,0,u,model.room.height);for(const y of [p.bottom,p.bottom+p.height])if(targets.ys.some(v=>Math.abs(v-y)<1))line(0,y,w.len,y);ideareGuideSvg.hidden=!ideareGuideSvg.childNodes.length;}
window.addEventListener('pointerup',ideareClearGuides);window.addEventListener('pointercancel',ideareClearGuides);window.addEventListener('blur',ideareClearGuides);window.addEventListener('keydown',e=>{if(e.key==='Escape')ideareClearGuides();});
// Refrigerator resize subframes, in the assembly's local millimetre coordinates.
let ideareFridgeResizePart='assembly';
function ideareFridgePart(c,part=ideareFridgeResizePart){const s=ideareFridgeSpec(c),cx=(s.left-s.right)/2,core=s.ow;const z=d=>(d-c.depth)/2;if(part==='left'&&s.left)return {u:-c.width/2+s.left/2,y:0,z:z(s.ld),w:s.left,h:s.lh,d:s.ld};if(part==='right'&&s.right)return {u:c.width/2-s.right/2,y:0,z:z(s.rd),w:s.right,h:s.rh,d:s.rd};if(part==='overhead')return {u:cx,y:s.fh+50,z:z(s.od),w:core,h:s.oh,d:s.od};if(part==='refrigerator')return {u:cx,y:0,z:(c.depth-s.fd)/2-6,w:s.fw,h:s.fh,d:s.fd};return {u:0,y:0,z:0,w:c.width,h:c.height,d:c.depth};}
function ideareResizeFridge(b,d,info){const s=ideareFridgeSpec(b),part=ideareFridgeResizePart,old={...s},q={...b},p=ideareFridgePart(b,part),a=(Number(b.rotation)||0)*Math.PI/180,co=Math.cos(a),si=Math.sin(a);let du=0,dz=0;const id=b.uid,others=ideareAlignmentObjects().filter(o=>(o.uid||o.id)!==id);const axes=axis=>{const pr=(x,z)=>axis==='u'?x*co+z*si:-x*si+z*co;return [...roomVertices().map(p=>pr(p.x,p.z)),...others.flatMap(o=>v6World(o,v6Local(o)).map(([x,z])=>pr(x,z)))];};
 if(info.sx){const origin=b.x*co+b.z*si+p.u+info.sx*p.w/2,delta=info.sx*(ideareNearest(origin+d.u,axes('u'))-origin);if(part==='refrigerator'){s.fw=Math.max(300,Math.min(1800,s.fw+delta));s.ow=Math.max(s.fw+2*(s.t+25),s.ow+s.fw-old.fw);du=info.sx*(s.ow-old.ow)/2;}else if(part==='left'||part==='right'){const k=part,side=part==='left'?-1:1;s[k]=Math.max(200,Math.min(1200,s[k]+delta));du=(s[k]-old[k])*side/2;}else{const n=Math.max(s.fw+2*(s.t+25),Math.min(2200,s.ow+delta));du=info.sx*(n-s.ow)/2;s.ow=n;}}
 if(info.sy>0){const targets=[model.room.height,...others.map(o=>(o.category==='wall-cabinets'?1350:0)+o.height)];const y=ideareNearest(p.y+p.h+d.y,targets);if(part==='refrigerator'){s.fh=Math.max(400,Math.min(3000,y));const oldTop=old.fh+50+old.oh,top=s.fh+50+s.oh;for(const k of ['lh','rh','ph'])if(Math.abs(s[k]-oldTop)<1)s[k]=top;}else if(part==='left'||part==='right'){const k=part==='left'?'lh':'rh';s[k]=Math.max(400,Math.min(3500,y));}else{const n=Math.max(150,Math.min(1200,y-s.fh-50)),oldTop=s.fh+50+s.oh;s.oh=n;const top=s.fh+50+n;if(Math.abs(s.lh-oldTop)<1)s.lh=top;if(Math.abs(s.rh-oldTop)<1)s.rh=top;if(Math.abs(s.ph-oldTop)<1)s.ph=top;}}
 if(info.sz){const origin=-b.x*si+b.z*co+p.z+info.sz*p.d/2,delta=info.sz*(ideareNearest(origin+d.z,axes('z'))-origin);if(part==='refrigerator'){s.fd=Math.max(250,Math.min(1200,s.fd+delta));for(const k of ['od','ld','rd'])if(Math.abs(old[k]-(old.fd+50))<1)s[k]=s.fd+50;}else if(part==='left'||part==='right'||part==='overhead'){const k=part==='left'?'ld':part==='right'?'rd':'od';s[k]=Math.max(180,Math.min(1400,s[k]+delta));}else{const n=Math.max(s.fd+50,Math.min(1400,b.depth+delta));s.od=n;if(s.left)s.ld=n;if(s.right)s.rd=n;}}
 const dims=ideareFridgeDimensions(s);dz=(dims.depth-b.depth)/2;Object.assign(q,dims,{fridgeLayout:s,x:b.x+du*co-dz*si,z:b.z+du*si+dz*co});return q;}
let ideareFridgeOpenUid=null;
// A separate refrigerator-door preview avoids swinging the neighboring storage doors at the same time.
function ideareFridgeDoorPreview(c){return model.selected===c.uid&&ideareFridgeOpenUid===c.uid&&!model.doorsOpen;}
(()=>{const before=renderInspector;renderInspector=()=>{before();const c=selected(),el=$('#selected-inspector .ideare-fridge-config');if(!ideareFridgeHousing(c)||!el)return;const s=ideareFridgeSpec(c);if(ideareFridgeResizePart==='left'&&!s.left||ideareFridgeResizePart==='right'&&!s.right)ideareFridgeResizePart='assembly';const row=document.createElement('div');row.className='ideare-fridge-part-tools';const opts=[['assembly','Entire surround'],['refrigerator','Refrigerator'],['overhead','Overhead storage'],...(s.left?[['left','Left pantry']]:[]),...(s.right?[['right','Right pantry']]:[])];row.innerHTML=`<label>Resize target<select data-fridge-resize-part>${opts.map(([v,n])=>`<option value="${v}" ${v===ideareFridgeResizePart?'selected':''}>${n}</option>`).join('')}</select></label><button type="button" class="id3-btn id3-secondary" data-fridge-resize-start>Resize selected part</button><button type="button" class="id3-btn id3-secondary" data-fridge-door-preview>${ideareFridgeDoorPreview(c)?'Close refrigerator':'Open refrigerator'}</button><small>Drag the outline grips to resize. Drag the surround itself to move all attached parts.</small>`;el.append(row);};document.addEventListener('change',e=>{if(e.target.matches('[data-fridge-resize-part]'))ideareFridgeResizePart=e.target.value;});document.addEventListener('click',e=>{if(e.target.closest('[data-fridge-resize-start]')){const b=$('#v8-inspector-resize')||$('#ideare-resize-toggle');if($('#ideare-resize-toggle')?.getAttribute('aria-pressed')!=='true')b?.click();}if(e.target.closest('[data-fridge-door-preview]')){const c=selected();if(!ideareFridgeHousing(c))return;ideareFridgeOpenUid=ideareFridgeDoorPreview(c)?null:c.uid;model.doorsOpen=false;renderAll();}});const oldSelect=select;select=id=>{if(id!==model.selected){ideareFridgeResizePart='assembly';ideareFridgeOpenUid=null;}oldSelect(id);};})();

function ideareSyncFridgeFields(s,old){const top=s.fh+50+s.oh,prevTop=old.fh+50+old.oh,depthDelta=s.fd-old.fd;s.ow=Math.max(s.fw+2*(s.t+25),old.ow+s.fw-old.fw);for(const k of ['od','ld','rd'])s[k]=Math.max(180,Math.min(1400,old[k]+depthDelta));const sharedChanged=Math.abs(s.ph-old.ph)>.01;if(!sharedChanged&&Math.abs(old.ph-prevTop)<1)s.ph=top;for(const [side,k] of [['left','lh'],['right','rh']]){if(!old[side]&&s[side])s[k]=top;else if(sharedChanged)s[k]=s.ph;else if(Math.abs(old[k]-prevTop)<1)s[k]=top;}if(s.ph<=s.fh+1)s.ph=top;}

;
Promise.resolve().then(()=>boot()).catch(ideareStartupError);
