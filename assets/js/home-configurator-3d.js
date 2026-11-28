import * as THREE from 'three';

// Coordinates are metres: plan x/y maps to world X/Z, with Y as height.
const STOREY = 3.2, WALL = 2.8, THICK = .18;
const ROOM = new Set(['Room','Ground-floor suite','Wet kitchen']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const themeDark=()=>document.documentElement.dataset.theme==='dark';

export function createHomeScene(host){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.1,1000);
 const hemi=new THREE.HemisphereLight(0xfff6e9,0x9a9387,2.0),sun=new THREE.DirectionalLight(0xfff4e3,2.2);
 scene.add(hemi,sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;
 const content=new THREE.Group();scene.add(content);
 const target=new THREE.Vector3(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 let model=null,azimuth=Math.PI*.22,elevation=Math.PI*.34,distance=40,lastLevel=-1,lotKey='',walls=[],roofs=[],pick=[],handles=[],frame=0;
 const matCache=new Map();
 function material(color,opacity=1){let k=color+'|'+opacity;if(!matCache.has(k))matCache.set(k,new THREE.MeshStandardMaterial({color,roughness:.86,transparent:opacity<1,opacity}));return matCache.get(k)}
 // One reusable set of procedural, seamless ripple maps. No external textures.
 // Normal-map slopes + a bright sky reflection give water a glassy finish.
 let waterMaps=null;const waterMaterials=new Map();
 function makeWaterMaps(){
  if(waterMaps)return waterMaps;const n=256,canvas=document.createElement('canvas'),normal=document.createElement('canvas');canvas.width=canvas.height=normal.width=normal.height=n;
  const ctx=canvas.getContext('2d'),nx=normal.getContext('2d'),img=ctx.createImageData(n,n),nm=nx.createImageData(n,n),tau=Math.PI*2;
  function wave(x,z){return .46*Math.sin(tau*(3*x+2*z)+.8*Math.sin(tau*(z*2-x)))+.24*Math.sin(tau*(5*x-3*z)+.7*Math.sin(tau*2*x))+.13*Math.sin(tau*(9*x+7*z))+.09*Math.sin(tau*(13*x-8*z));}
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=i/n,z=j/n,k=(j*n+i)*4,v=wave(x,z),dx=(wave(x+1/n,z)-wave(x-1/n,z))*5,dz=(wave(x,z+1/n)-wave(x,z-1/n))*5,len=Math.hypot(dx,dz,1);const light=Math.pow(Math.max(0,1-Math.abs(v+.13)*9),3),base=210+v*23+light*22;img.data.set([base*.89,base*.98,Math.min(255,base+8),255],k);nm.data.set([128-dx/len*127,128-dz/len*127,128+127/len,255],k);}
  ctx.putImageData(img,0,0);nx.putImageData(nm,0,0);
  const colour=new THREE.CanvasTexture(canvas),norm=new THREE.CanvasTexture(normal);colour.colorSpace=THREE.SRGBColorSpace;for(const tex of [colour,norm]){tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  // A lightweight procedural sky reflection, generated once for all pools.
  const sky=document.createElement('canvas');sky.width=256;sky.height=128;const sc=sky.getContext('2d'),g=sc.createLinearGradient(0,0,0,128);g.addColorStop(0,'#91b8da');g.addColorStop(.43,'#e5f4fc');g.addColorStop(.51,'#b3c7c6');g.addColorStop(1,'#7e8c88');sc.fillStyle=g;sc.fillRect(0,0,256,128);const sunGlow=sc.createRadialGradient(76,35,0,76,35,29);sunGlow.addColorStop(0,'#ffffff');sunGlow.addColorStop(.18,'#fff8d9');sunGlow.addColorStop(1,'#ffffff00');sc.fillStyle=sunGlow;sc.fillRect(47,6,58,58);
  const env=new THREE.CanvasTexture(sky);env.colorSpace=THREE.SRGBColorSpace;env.mapping=THREE.EquirectangularReflectionMapping;waterMaps={colour,norm,env};return waterMaps;
 }
 function poolWaterMaterial(o,ghost){const color=o.catalogueId?o.color||'#76b5c7':'#76b5c7',key=[color,!!ghost].join('|');if(waterMaterials.has(key))return waterMaterials.get(key);const {colour,norm,env}=makeWaterMaps();const mat=new THREE.MeshPhysicalMaterial({color,map:colour,normalMap:norm,normalScale:new THREE.Vector2(.36,.36),envMap:env,envMapIntensity:1.05,roughness:.12,metalness:.06,clearcoat:1,clearcoatRoughness:.065,transparent:!!ghost,opacity:ghost?.55:1,depthWrite:!ghost});mat.userData.cached=true;waterMaterials.set(key,mat);return mat;}
 function disposeContent(){content.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&!o.material.userData.cached){if(o.material.map)o.material.map.dispose();if(![...matCache.values()].includes(o.material))o.material.dispose()}});content.clear();walls=[];roofs=[];pick=[];handles=[];for(const m of matCache.values())m.dispose();matCache.clear()}
 function box(parent,x,y,z,w,h,d,color,opacity=1){const m=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.005,w),Math.max(.005,h),Math.max(.005,d)),material(color,opacity));m.position.set(x,y,z);m.castShadow=opacity===1;m.receiveShadow=true;parent.add(m);return m}
 function line(parent,pts,color,opacity=1){const g=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p)));const m=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));parent.add(m);return m}
 function grid(parent,x,z,w,d,y,step,color,opacity){let p=[];for(let a=0;a<=w+.001;a+=step)p.push(x+a,y,z,x+a,y,z+d);for(let b=0;b<=d+.001;b+=step)p.push(x,y,z+b,x+w,y,z+b);let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));parent.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color,transparent:true,opacity})));}
 function outline(parent,x,z,w,d,y,color){return line(parent,[[x,y,z],[x+w,y,z],[x+w,y,z+d],[x,y,z+d],[x,y,z]],color)}
 function register(m,i,active){if(active){m.userData.i=i;pick.push(m)}return m}
 function label(parent,text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=themeDark()?'rgba(22,20,18,.85)':'rgba(255,252,246,.90)';ctx.beginPath();ctx.roundRect(10,15,492,98,20);ctx.fill();ctx.font='600 36px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=themeDark()?'#f2e8db':'#413429';ctx.fillText(text.slice(0,32),256,64,470);let tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false,transparent:true}));sprite.position.set(x,y,z);sprite.scale.set(Math.min(3.4,Math.max(1.2,text.length*.15)),.58,1);parent.add(sprite)}
 function corners(o,i,y){if(model.tool!=='Select'||ROOM.has(o.type)||['Wall','Tiles','Foundation','Patio','Car porch'].includes(o.type))return;if(o.type==='Roof'){if(model.wallMode==='hidden')return;let z=o.y,x=o.x,w=o.w,d=o.h;for(const [px,pz,h,dx,dz] of [[x,z+d/2,'w',-1,0],[x+w,z+d/2,'e',1,0],[x+w/2,z,'n',0,-1],[x+w/2,z+d,'s',0,1]]){const a=new THREE.ArrowHelper(new THREE.Vector3(dx,0,dz),new THREE.Vector3(px,y+2.95,pz),.95,0xd3944d,.38,.40);a.traverse(child=>{if(child.material){child.material.depthTest=false;child.renderOrder=20}});content.add(a);const pickBox=box(content,px+dx*.55,y+2.95,pz+dz*.55,dx?.95:.48,.45,dz?.95:.48,0xffffff,0);pickBox.material.depthWrite=false;pickBox.userData={i,handle:h};handles.push(pickBox);}return}let points=['Wall','Fence'].includes(o.type)?[[o.x,o.y,'start'],[o.x+o.w,o.y+o.h,'end']]:[[o.x,o.y,'nw'],[o.x+o.w,o.y,'ne'],[o.x,o.y+o.h,'sw'],[o.x+o.w,o.y+o.h,'se']];for(const [x,z,handle] of points){let m=box(content,x,y+.15,z,.34,.28,.34,0xffffff);m.material=material(0xfff5e6);let e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0xb47e42}));m.add(e);m.userData={i,handle};handles.push(m)}}
 function floorObject(o,i,y,active,ghost=false){let x=o.x,z=o.y,w=o.w,d=o.h;
  if(o.type==='Fence'){let horizontal=Math.abs(w)>=Math.abs(d),len=Math.abs(horizontal?w:d),a=Math.min(horizontal?x:z,horizontal?x+w:z+d),coord=horizontal?z:x;if(len<.01)return;let group=new THREE.Group();content.add(group);let color=o.color||'#a98d70',opacity=ghost?.55:1;let n=Math.max(1,Math.ceil(len/1.2));for(let k=0;k<=n;k++){let at=a+len*k/n;register(box(group,horizontal?at:coord,y+.55,horizontal?coord:at,.12,1.1,.12,color,opacity),i,active&&!ghost)}for(let h of [.35,.85])register(box(group,horizontal?a+len/2:coord,y+h,horizontal?coord:a+len/2,horizontal?len:.09,.09,horizontal?.09:len,color,opacity),i,active&&!ghost);if(active&&i===model.selected&&!ghost)corners(o,i,y);return;}
  if(w<.01||d<.01)return;let color=o.color||'#d9c7ac',opacity=ghost?.55:1,cx=x+w/2,cz=z+d/2;const group=new THREE.Group();content.add(group);
  if(o.type==='Roof'){
   const bottom=y+WALL+.04;let group2=new THREE.Group();content.add(group2);roofs.push({group:group2,active,ghost,i});
   if(o.style==='gable'){let ridgeAlongX=w>=d,span=ridgeAlongX?d:w,rise=Math.min(2.6,Math.max(.55,span*.30)),angle=Math.atan2(rise,span/2),slope=Math.hypot(span/2,rise);for(let side of [-1,1]){let m=box(group2,cx+(ridgeAlongX?0:side*w/4),bottom+rise/2,cz+(ridgeAlongX?side*d/4:0),ridgeAlongX?w+.25:slope,.12,ridgeAlongX?slope:d+.25,color,opacity);if(ridgeAlongX)m.rotation.x=side*angle;else m.rotation.z=-side*angle;register(m,i,active&&!ghost)}let gable=new THREE.Shape();gable.moveTo(-span/2,0);gable.lineTo(span/2,0);gable.lineTo(0,rise);gable.closePath();for(let side of [-1,1]){let mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(gable,{depth:.12,bevelEnabled:false}),material(color,opacity));mesh.position.set(cx+(ridgeAlongX?side*w/2:0),bottom,cz+(ridgeAlongX?0:side*d/2));if(ridgeAlongX)mesh.rotation.y=Math.PI/2;group2.add(mesh);register(mesh,i,active&&!ghost)}}else register(box(group2,cx,bottom+.09,cz,w+.2,.18,d+.2,color,opacity),i,active&&!ghost);
  }else if(o.type==='Foundation'){let depth=clamp(Number(o.height)||.18,.1,.6);register(box(group,cx,y+depth/2-.02,cz,w,depth,d,color,opacity),i,active&&!ghost);grid(group,x,z,w,d,y+depth,.5,0x847564,.3);
  }else if(o.type==='Pool'){
   // Flush stone coping, not raised perimeter walls. The pool surface sits
   // just above the conceptual terrain plane, hiding the grid underneath it.
   const trim=Math.min(.16,w*.18,d*.18),innerW=Math.max(.02,w-2*trim),innerD=Math.max(.02,d-2*trim);
   const coping='#e1d8c9';
   for(const [xx,zz,ww,dd] of [[cx,z+trim/2,w,trim],[cx,z+d-trim/2,w,trim],[x+trim/2,cz,trim,innerD],[x+w-trim/2,cz,trim,innerD]]){
    const rim=box(group,xx,y+.018,zz,ww,.032,dd,coping,opacity);rim.castShadow=false;register(rim,i,active&&!ghost);
   }
   const surface=new THREE.Mesh(new THREE.PlaneGeometry(innerW,innerD),poolWaterMaterial(o,ghost));const uv=surface.geometry.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*innerW/3,uv.getY(k)*innerD/3);uv.needsUpdate=true;surface.rotation.x=-Math.PI/2;surface.position.set(cx,y+.009,cz);surface.receiveShadow=true;group.add(surface);register(surface,i,active&&!ghost);
  }else if(o.type==='Stairs'){let n=12,along=d>=w;for(let k=0;k<n;k++){let h=(k+1)*STOREY/n;register(box(group,along?cx:x+(k+.5)*w/n,y+h/2,along?z+(k+.5)*d/n:cz,along?w:w/n,h,along?d/n:d,color,opacity),i,active&&!ghost)}}else if(o.type==='Door'||o.type==='Window'){
   let near=findOpening(o,model.floors[Math.round(y/STOREY)]||[]);if(!near){register(box(group,cx,y+.05,cz,w,.1,d,o.type==='Door'?'#ad8261':'#8ab7c0',opacity),i,active&&!ghost)}
   else{let {axis,coord,a,b}=near,len=b-a,mid=(a+b)/2,low=o.type==='Door'?0:.90,high=low+clamp(Number(o.height)||(o.type==='Door'?2.1:1.2),.4,o.type==='Door'?2.7:1.85),hh=high-low;const wg=new THREE.Group();wg.position.y=y;content.add(wg);let nearWall=near.wall;let center=axis==='x'?[mid,coord]:[coord,mid];const add=(along,vertical,width,height,dep,col,op=1)=>register(box(wg,axis==='x'?along:coord,vertical,axis==='x'?coord:along,axis==='x'?width:(ghost?Math.max(dep,.25):dep),height,axis==='x'?(ghost?Math.max(dep,.25):dep):width,col,op*opacity),i,active&&!ghost);
    add(a+.035,low+hh/2,.07,hh,.20,o.frameColor||'#765b46');add(b-.035,low+hh/2,.07,hh,.20,o.frameColor||'#765b46');add(mid,high-.035,len,.07,.20,o.frameColor||'#765b46');if(o.type==='Window'){add(mid,low+.035,len,.07,.20,o.frameColor||'#765b46');add(mid,low+hh/2,Math.max(.05,len-.12),Math.max(.05,hh-.12),.055,o.color||'#92c2d1',.55);add(mid,low+hh/2,.045,hh,.16,o.frameColor||'#765b46')}else{add(mid,low+hh/2,Math.max(.05,len-.13),Math.max(.05,hh-.09),.06,o.color||'#ad8261');add(b-.16,1.03,.07,.04,.13,'#c3ae8b');}
    walls.push({group:wg,x:center[0],z:center[1],axis,active,ghost,side:sideFor(nearWall,model.floors[Math.round(y/STOREY)]||[])});
   }
  }else{let top=o.type==='Tiles'?.075:ROOM.has(o.type)?.035:.025,depth=o.type==='Tiles'?.035:.16;register(box(group,cx,y+top-depth/2,cz,w,depth,d,color,opacity),i,active&&!ghost);if(o.type==='Tiles'||ROOM.has(o.type))grid(group,x,z,w,d,y+top+.008,.5,themeDark()?0x392f27:0x796b57,.28);if(active&&!ghost&&w>=2&&d>=1.5&&o.type!=='Tiles')label(group,o.label||o.type,cx,y+.19,cz);}
  if(active&&i===model.selected&&!ghost){outline(content,x,z,w,d,y+.10,0xd3944d);corners(o,i,y)}
  if(ghost)outline(content,x,z,w,d,y+.12,model.ghostValid===false?0xd34b44:0xd3944d);
 }
 function wallInfo(o){let axis=Math.abs(o.w)>=Math.abs(o.h)?'x':'z',start=axis==='x'?o.x:o.y,end=start+(axis==='x'?o.w:o.h);return {axis,coord:axis==='x'?o.y:o.x,a:Math.min(start,end),b:Math.max(start,end)}}
 function findOpening(o,f){let cx=o.x+o.w/2,cz=o.y+o.h/2,best=null;for(let wall of f){if(wall.type!=='Wall'||(wall.height||WALL)<2.1)continue;let {axis,coord,a,b}=wallInfo(wall),p=axis==='x'?cx:cz,dist=Math.abs((axis==='x'?cz:cx)-coord);if(dist>Math.max(.65,(axis==='x'?o.h:o.w)/2+.2)||p<a-.2||p>b+.2)continue;let span=Math.max(.15,axis==='x'?o.w:o.h),u=Math.max(a,p-span/2),v=Math.min(b,p+span/2);if(v-u<.4)continue;if(!best||dist<best.dist)best={axis,coord,a:u,b:v,dist,wall}}return best}
 function sideFor(o,f){let {axis,coord,a,b}=wallInfo(o),p=(a+b)/2,inside=(x,z)=>f.some(q=>ROOM.has(q.type)&&x>q.x+.005&&x<q.x+q.w-.005&&z>q.y+.005&&z<q.y+q.h-.005);let pos=axis==='x'?inside(p,coord+.08):inside(coord+.08,p),neg=axis==='x'?inside(p,coord-.08):inside(coord-.08,p);if(pos&&neg)return 0;if(pos)return -1;if(neg)return 1;let rooms=f.filter(q=>ROOM.has(q.type));let center=rooms.length?rooms.reduce((s,q)=>s+(axis==='x'?q.y+q.h/2:q.x+q.w/2),0)/rooms.length:(axis==='x'?model.bounds[1]:model.bounds[0])/2;return coord>=center?1:-1}
 function wallPiece(o,i,y,active,ghost,a,b,f){let info=wallInfo(o);a=a??info.a;b=b??info.b;if(b-a<.015)return;let {axis,coord}=info,group=new THREE.Group();group.position.y=y;content.add(group);let opacity=ghost?.55:1,color=ghost?(model.ghostValid===false?'#d34b44':'#c8ac85'):(o.color||'#d5c9b9');let opening=f?.filter(q=>q.type==='Door'||q.type==='Window').map(q=>({o:q,h:findOpening(q,f)})).find(q=>q.h&&q.h.axis===axis&&Math.abs(q.h.coord-coord)<.01&&q.h.a<(a+b)/2&&q.h.b>(a+b)/2);
  function segment(low,high){if(high-low<.01)return;let m=box(group,axis==='x'?(a+b)/2:coord,(low+high)/2,axis==='x'?coord:(a+b)/2,axis==='x'?b-a:THICK,high-low,axis==='x'?THICK:b-a,color,opacity);register(m,i,active&&!ghost)}
  let wallHeight=clamp(Number(o.height)||WALL,.5,WALL);if(opening&&wallHeight>=2.1){let low=opening.o.type==='Window'?.9:0,high=low+clamp(Number(opening.o.height)||(opening.o.type==='Door'?2.1:1.2),.4,opening.o.type==='Door'?2.7:1.85);if(low)segment(0,low);segment(high,wallHeight)}else segment(0,wallHeight);
  let side=sideFor({...o,x:axis==='x'?a:coord,y:axis==='x'?coord:a,w:axis==='x'?b-a:0,h:axis==='x'?0:b-a},f||[]);walls.push({group,x:axis==='x'?(a+b)/2:coord,z:axis==='x'?coord:(a+b)/2,axis,side,active,ghost});
 }
 function floorWalls(f,y,active){let groups=new Map(),openings=f.filter(q=>q.type==='Door'||q.type==='Window').map(q=>findOpening(q,f)).filter(Boolean);f.forEach((o,i)=>{if(o.type!=='Wall')return;let h=wallInfo(o);if(h.b-h.a<.015)return;let k=h.axis+':'+h.coord.toFixed(3);if(!groups.has(k))groups.set(k,[]);groups.get(k).push({...h,o,i})});for(let arr of groups.values()){let cuts=arr.flatMap(h=>[h.a,h.b]);for(const op of openings)if(op.axis===arr[0].axis&&Math.abs(op.coord-arr[0].coord)<.01)cuts.push(op.a,op.b);cuts=[...new Set(cuts)].sort((a,b)=>a-b);for(let j=0;j<cuts.length-1;j++){let a=cuts[j],b=cuts[j+1],mid=(a+b)/2,cover=arr.filter(h=>h.a<=mid&&h.b>=mid);let h=cover.find(h=>h.i===model.selected)||cover.sort((a,b)=>(b.o.height||WALL)-(a.o.height||WALL))[0];if(h)wallPiece(h.o,h.i,y,active,false,a,b,f)}}if(model.wallMode!=='hidden'&&active&&f[model.selected]?.type==='Wall'){let o=f[model.selected];line(content,[[o.x,y+.24,o.y],[o.x+o.w,y+.24,o.y+o.h]],0xd3944d);corners(o,model.selected,y)}}
 function rebuild(){if(!model)return;disposeContent();let [w,d,s,e]=model.bounds,dark=themeDark();scene.background=new THREE.Color(dark?'#25221f':'#e9e3da');hemi.intensity=dark?1.7:2.0;sun.intensity=dark?1.8:2.2;
  box(content,w/2,-.23,d/2,w,.4,d,dark?'#575747':'#b8bd9c').castShadow=false;grid(content,0,0,w,d,.002,.5,dark?0xb5b6a2:0x747c60,.23);outline(content,0,0,w,d,.012,dark?0xd4c5ae:0x5b604d);if(w>2*s&&d>2*e)outline(content,s,e,w-2*s,d-2*e,.018,0xb88b55);
  for(let l=0;l<=model.level;l++){let f=model.floors[l],y=l*STOREY,active=l===model.level;f.forEach((o,i)=>{if(o.type!=='Wall')floorObject(o,i,y,active)});floorWalls(f,y,active)}
  if(model.level){let y=model.level*STOREY;grid(content,0,0,w,d,y+.005,1,dark?0xc2b39e:0x8f8373,.17);outline(content,0,0,w,d,y+.015,0xb88b55)}
  if(model.ghost){let o=model.ghost,y=model.level*STOREY;if(o.type==='Wall')wallPiece(o,-1,y,true,true,null,null,model.floors[model.level]);else{floorObject(o,-1,y,true,true);if(ROOM.has(o.type)){for(let [x,z,ww,dd] of [[o.x,o.y,o.w,0],[o.x+o.w,o.y,0,o.h],[o.x,o.y+o.h,o.w,0],[o.x,o.y,0,o.h]])wallPiece({type:'Wall',x,y:z,w:ww,h:dd},-1,y,true,true,null,null,model.floors[model.level])}}}
  let radius=Math.max(w,d,12);sun.position.set(w/2-radius*.65,radius*1.6,d/2-radius*.55);sun.target.position.set(w/2,0,d/2);Object.assign(sun.shadow.camera,{left:-radius,right:radius,top:radius,bottom:-radius,far:radius*5});sun.shadow.camera.updateProjectionMatrix();updateCutaway();schedule();
 }
 function updateCutaway(){
  if(!model)return;
  // Full-wall mode is independent of the camera, active tool and wall side.
  // Restore all displayed storeys' wall/opening groups, including prior cutaways.
  if(model.wallMode==='full'){for(const wall of walls){wall.group.visible=true;wall.group.scale.y=1;}for(const roof of roofs)roof.group.visible=true;return;}
  if(model.wallMode==='hidden'){for(const wall of walls){wall.group.visible=!!wall.ghost;wall.group.scale.y=1;}for(const roof of roofs)roof.group.visible=!!roof.ghost||(roof.active&&model.tool==='Roof');return;}
  const vx=camera.position.x-target.x,vz=camera.position.z-target.z;
  for(const wall of walls){const facing=(wall.axis==='x'?vz:vx)*wall.side;wall.group.visible=true;wall.group.scale.y=wall.ghost?1:wall.side===0?(model.tool==='Wall'||model.tool==='Paint'?1:.34):facing>distance*.08?.065:1;}
  for(const roof of roofs)roof.group.visible=roof.ghost||(roof.active&&(model.tool==='Roof'||roof.i===model.selected));
 }
 function updateCamera(){camera.position.set(target.x+distance*Math.cos(elevation)*Math.sin(azimuth),target.y+distance*Math.sin(elevation),target.z+distance*Math.cos(elevation)*Math.cos(azimuth));camera.lookAt(target);camera.updateMatrixWorld();updateCutaway();schedule()}
 function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;renderer.render(scene,camera)})}
 function resize(){let w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();schedule()}
 function fit(){if(!model)return;let [w,d]=model.bounds;target.set(w/2,model.level*STOREY*.5,d/2);let r=Math.hypot(w,d)/2;distance=Math.max(8,r/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*Math.max(1,1/camera.aspect));
  for(let i=0;i<6;i++){updateCamera();let edge=0;for(const x of [0,w])for(const z of [0,d])for(const y of [0,model.level*STOREY+WALL]){let p=new THREE.Vector3(x,y,z).project(camera);edge=Math.max(edge,Math.abs(p.x),Math.abs(p.y));}if(edge<=.89)break;distance*=Math.max(1.05,edge/.86);}updateCamera();}
 function setModel(next){model=next;let k=model.bounds.slice(0,2).join(':');if(lastLevel!==model.level&&lastLevel!==-1)target.y+=(model.level-lastLevel)*STOREY;lastLevel=model.level;if(k!==lotKey){lotKey=k;fit()}rebuild();updateCamera()}
 function setRay(ev){let r=renderer.domElement.getBoundingClientRect();if(!r.width||!r.height)return false;pointer.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);scene.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);return true}
 function point(ev,height=0){if(!model||!setRay(ev))return null;plane.constant=-(model.level*STOREY+height);let p=new THREE.Vector3();return ray.ray.intersectPlane(plane,p)?{x:p.x,y:p.z}:null}
 function hit(ev,wallOnly=false){if(!setRay(ev))return null;if(!wallOnly){let h=ray.intersectObjects(handles,false)[0];if(h)return h.object.userData}let visible=m=>{for(let p=m;p;p=p.parent)if(!p.visible)return false;return true};let meshes=pick.filter(m=>visible(m)&&(!wallOnly||model.floors[model.level][m.userData.i]?.type==='Wall'));let result=ray.intersectObjects(meshes,false)[0];if(result)return {...result.object.userData,point:{x:result.point.x,y:result.point.z}};if(wallOnly){let p=point(ev),best=null;if(p)model.floors[model.level].forEach((o,i)=>{if(o.type!=='Wall')return;let h=wallInfo(o),along=h.axis==='x'?p.x:p.y,across=h.axis==='x'?p.y:p.x,dist=Math.abs(across-h.coord);if(along>=h.a-.18&&along<=h.b+.18&&dist<.35&&(!best||dist<best.dist))best={i,dist}});return best}return null}
 function orbit(dx,dy){azimuth-=dx*.007;elevation=clamp(elevation+dy*.006,.30,1.45);updateCamera()}
 function pan(dx,dy){let m=distance*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(1,host.clientHeight);let right=new THREE.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth)),forward=new THREE.Vector3(Math.sin(azimuth),0,Math.cos(azimuth));target.addScaledVector(right,-dx*m);target.addScaledVector(forward,-dy*m/Math.max(.45,Math.sin(elevation)));updateCamera()}
 function walk(x,z,dt){const right=new THREE.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth)),forward=new THREE.Vector3(-Math.sin(azimuth),0,-Math.cos(azimuth));let speed=clamp(distance*.45,2,32)*dt/Math.max(1,Math.hypot(x,z));target.addScaledVector(right,x*speed);target.addScaledVector(forward,z*speed);updateCamera()}
 function zoom(factor){distance=clamp(distance*factor,2.5,Math.max(160,Math.hypot(...(model?.bounds.slice(0,2)||[20,30]))*5));updateCamera()}
 new ResizeObserver(resize).observe(host);new MutationObserver(()=>rebuild()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});resize();
 // Ensure the canvas is ready before the browser's print snapshot.
 window.addEventListener('beforeprint',()=>renderer.render(scene,camera));
 return {setModel,point,hit,orbit,pan,zoom,fit,walk};
}
