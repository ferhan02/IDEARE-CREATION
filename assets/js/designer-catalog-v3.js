/* IDEARE Cabinet Studio v3: streamlined edit options and dimensioned 3D objects.
   Loaded after designer-3d.js, designer-studio.js and designer-interactions-v2.js
   in the SAME ES module scope by designer/studio-engine.php. */
(() => {
'use strict';
const app=document.querySelector('#id3-app');
if(!app)return;
const css=document.createElement('link');
css.rel='stylesheet';css.href='../assets/css/designer-catalog-v3.css?v=20261123b';
document.head.appendChild(css);

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
 ['Freestanding','free-hob','Hob with cooker',600,900,600,'range'],
 ['Freestanding','free-hood','Extractor hood',600,550,500,'hood'],
 ['Freestanding','free-microwave','Microwave oven',520,320,420,'microwave'],
 ['Freestanding','free-dishwasher','Dishwasher',600,850,600,'dishwasher'],
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
 const fridge=()=>{applianceBody();const frontMat=p.id.startsWith('integrated-')?wood:steel;const freeH=Math.min(h*.39,.66),mainH=h-freeH-.023;box(w*.965,freeH-.015,.027,0,freeH/2,frontZ,frontMat,'freezer_door');box(w*.965,mainH-.015,.027,0,freeH+.012+mainH/2,frontZ,frontMat,'fridge_door');box(w*.92,.007,.03,0,freeH+.009,frontZ+.02,darkSteel);handle(w*.31,freeH*.63,frontZ+.045,.14);handle(w*.31,freeH+mainH*.39,frontZ+.045,.22);};
 const hob=()=>{box(w*.96,.027,d*.88,0,h-.016,0,glass,'ceramic_hob');for(const [x,z,r] of [[-.26,-.24,.08],[.26,-.24,.07],[-.26,.24,.065],[.26,.24,.08]]){const rr=Math.min(w,d)*r;cylinder(rr,.003,x*w*.78,h+.003,z*d*.75,darkSteel);const ring=new THREE.Mesh(new THREE.TorusGeometry(rr*.77,.003,5,22),silver);ring.rotation.x=Math.PI/2;ring.position.set(x*w*.78,h+.009,z*d*.75);g.add(ring);}for(let i=0;i<4;i++)cylinder(.009,.003,(i-1.5)*w*.10,h+.010,d*.34,white);};
 const hood=()=>{const mount=Math.max(1.4,Math.min(model.room.height/1000-.14,1.95));box(w*.95,.11,d*.90,0,mount,0,steel,'hood_canopy');box(w*.43,Math.max(.13,model.room.height/1000-mount),d*.37,0,(mount+model.room.height/1000)/2,0,silver,'hood_chimney');for(let j=-1;j<=1;j++)box(w*.21,.006,d*.60,j*w*.24,mount-.063,0,darkSteel,'hood_vent');for(let j of [-1,1])box(.08,.008,.06,j*w*.36,mount-.065,d*.25,lit,'hood_light');};
 const legs=(height=h)=>{for(const x of [-w*.40,w*.40])for(const z of [-d*.35,d*.35])leg(x,z,height);};
 const table=(topY=h,top=wood)=>{box(w,.055,d,0,topY-.028,0,top,'table_top');legs(topY-.04);};
 const chair=(padded=false)=>{const seatY=h*.52;const zz=-d*.25;for(const x of [-w*.38,w*.38])for(const z of [-d*.32,d*.32])leg(x,z,seatY);box(w*.91,.062,d*.77,0,seatY,0,padded?upholstery:wood,'chair_seat');box(w*.89,h*.43,.058,0,seatY+h*.23,zz,padded?upholstery:paleWood,'chair_back');};
 const stool=(bar=false)=>{const seatY=bar?h*.96:h*.96;box(w*.86,.057,d*.82,0,seatY,0,wood,'stool_seat');for(const x of [-w*.35,w*.35])for(const z of [-d*.32,d*.32])leg(x,z,seatY-.02);if(bar){tube(-w*.34,h*.25,d*.33,w*.34,h*.25,d*.33,.01,silver);tube(-w*.34,h*.25,-d*.33,w*.34,h*.25,-d*.33,.01,silver);}};
 const wallY=Math.min(Math.max(1.1,model.room.height/1000*.57),2);
 const s=p.shape;
 if(s==='fridge')fridge();
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
 g.position.set(item.x/1000,0,item.z/1000);
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
 if(key==='handle')return catalog.handles.find(x=>Number(x.id)===Number(c.handle))?.name||'Choose a handle';
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
 if(l){l.innerHTML=`<p class="ideare-modify-eyebrow">MODIFY CABINET</p><h4 class="ideare-modify-title">Options</h4><div class="ideare-option-rows">${optionSections.map(([title,key,index])=>`<button type="button" class="ideare-option-row" data-option-editor="${index}" data-option-title="${escV3(title)}" data-option-focus="${key}"><span class="ideare-option-glyph" aria-hidden="true">${optionIcon[key]}</span><span class="ideare-option-body"><strong>${escV3(title)}</strong><small>${escV3(optionValue(key,c))}</small></span><span class="ideare-option-chevron" aria-hidden="true">›</span></button>`).join('')}</div><p class="ideare-modify-footnote">Concept measurements and fittings are reviewed by IDEARE before manufacture.</p>`;}
 selectedInspector.classList.toggle('ideare-editor-open',activeEditor!==null);
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
 const action=e.target.closest('[data-option-editor]');if(action){activeEditor={index:action.dataset.optionEditor,title:action.dataset.optionTitle};renderOptions();accordion?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
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
