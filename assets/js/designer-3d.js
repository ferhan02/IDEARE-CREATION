import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
const roomVertices=()=>{let {shape,width:w,depth:d}=model.room;switch(shape){
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
 vertices.forEach((a,i)=>{let b=vertices[(i+1)%vertices.length];if((model.room.shape==='open'||model.room.shape==='u_open')&&i===2)return;if(model.room.shape==='l_open'&&i===3)return;let ax=a.x/1000,az=a.z/1000,bx=b.x/1000,bz=b.z/1000,len=Math.hypot(bx-ax,bz-az);let color=mat(i%2?'#dedbd5':'#f0efeb');color.transparent=true;color.opacity=.73;color.depthWrite=false;const w=addBox(walls,len,h,.075,(ax+bx)/2,h/2,(az+bz)/2,color,'room_wall');w.rotation.y=-Math.atan2(bz-az,bx-ax);w.castShadow=false;});worldGroup.add(walls);
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
  for(let i=0;i<doors;i++){let dw=w/doors-.005;let pivot=new THREE.Group();const hingesLeft=doors===1?c.hingeSide!=='right':i%2===0;const hingeX=-w/2+i*(w/doors)+(hingesLeft?0:w/doors);pivot.position.set(hingeX,y0,frontZ);const leaf=addBox(pivot,dw,h-.005,.019,(hingesLeft?1:-1)*dw/2,h/2,0,front,'door_panel');if(c.opening==='swing'&&model.selected===c.uid&&model.doorsOpen)pivot.rotation.y=hingesLeft?-.9:.9;else if(c.opening==='lift'&&model.selected===c.uid&&model.doorsOpen)pivot.rotation.x=-.6;
   if(/shaker/i.test(catalog.doors.find(x=>Number(x.id)===Number(c.doorStyle))?.name||''))addBox(pivot,Math.max(.02,dw-.08),Math.max(.05,h-.10),.002,(hingesLeft?1:-1)*dw/2,h/2,.011,mat('#af9479'),'door_inset');
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
  addBox(g,w+.035,.028,d+.040,0,y0+h+.014,.012,top,'worktop');
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
 if(element.type==='worktop')addBox(worldGroup,width+.035,.03,d+.05,(minx+maxx)/2000,h+.015,z,finish,'continuous_worktop');
 if(element.type==='plinth')addBox(worldGroup,width-.035,Math.max(.03,first.plinthHeight/1000),d-.1,(minx+maxx)/2000,first.plinthHeight/2000,z-.03,finish,'continuous_plinth');
 if(element.type==='backsplash')addBox(worldGroup,width+.035,.2,.022,(minx+maxx)/2000,h+.12,z-d/2,finish,'continuous_backsplash');
 }}
function addExtras(){for(let item of model.extras){let group=new THREE.Group();group.userData.extraId=item.id;group.position.set(item.x/1000,0,item.z/1000);let w=item.width/1000,d=item.depth/1000,h=item.height/1000;let silver=mat(/fridge|oven|dishwasher|microwave|refrigerator/i.test(item.kind)?'#9a9da0':'#af987c');addBox(group,w,h,d,0,h/2,0,silver,'concept_extra');const label=document.createElement('canvas');label.width=256;label.height=64;const c=label.getContext('2d');c.fillStyle='#f8f6f0';c.fillRect(0,0,256,64);c.font='bold 21px Arial';c.fillStyle='#4b4a46';c.textAlign='center';c.fillText(String(item.kind).slice(0,19),128,40);const t=new THREE.CanvasTexture(label);let flag=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false}));flag.position.set(0,h+.24,0);flag.scale.set(.82,.22,1);group.add(flag);const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.01,h+.01,d+.01)),new THREE.LineBasicMaterial({color:0xb3905c}));outline.position.y=h/2;outline.visible=item.id===model.selectedExtra;group.add(outline);extraGroup.add(group);}}
function drawScene(){if(!scene||!renderer)return;scene.remove(worldGroup);disposeGroup(worldGroup);worldGroup=new THREE.Group();cabinetGroup=new THREE.Group();extraGroup=new THREE.Group();scene.add(worldGroup);meshById.clear();addRoom();for(let c of model.cabinets){let g=makeCabinet(c);cabinetGroup.add(g);meshById.set(c.uid,g);}worldGroup.add(cabinetGroup);worldGroup.add(extraGroup);addSharedElements();addExtras();}
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
  const link=new URL(location.href),code=link.searchParams.get('code'),token=link.searchParams.get('token'),staffId=link.searchParams.get('staff_design');
  if(staffId){$('#save-design').disabled=true;$('#submit-design').disabled=true;const data=await request(`staff-load.php?id=${encodeURIComponent(staffId)}`);applyHistory(JSON.stringify(data.scene));setContact(data.contact);model.designCode=data.design_code;model.revision=data.revision_no;showStep(3);notify('Staff preview is read-only. Review actions are handled in the staff portal.');}
  else if(code&&token){const data=await request(`load.php?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`);applyHistory(JSON.stringify(data.scene));setContact(data.contact);model.designCode=code;model.editToken=token;model.revision=data.revision_no;showStep(3);notify(`Loaded ${code} · revision ${model.revision}.`);}
  else{try{let local=localStorage.getItem('ideare3d_draft_v1');if(local&&confirm('Restore your locally saved unfinished 3D design?')){let draft=JSON.parse(local);applyHistory(JSON.stringify(draft.scene));notify('Local draft restored.');}}catch(e){}}
  renderAll();init3D();if(model.step===3)setTimeout(resize,60);
 }catch(e){console.error(e);$('#canvas-loader').textContent='Unable to start designer: '+e.message;notify(e.message,true);}
}
boot();
