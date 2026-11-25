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
function v7Normalize(c){c.worktop=v7Base(c);c.plinth=c.category!=='wall-cabinets';if(!c.plinthHeight||c.plinthHeight<50)c.plinthHeight=100;return c;}
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
 const root=document.querySelector('#id3-app');if(!root)return;const link=document.createElement('link');link.rel='stylesheet';link.href='../assets/css/designer-finishes-v7.css?v=20261125-7';document.head.append(link);
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
