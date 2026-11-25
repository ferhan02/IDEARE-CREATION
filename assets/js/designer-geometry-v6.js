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
  addBox(pivot,len-.008,h-.008,.019,sign*len/2,h/2,0,front,'door_panel');
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
 addBox(g,w*.42,lower*.76,d*.58,0,lower*.57,-d*.14,steel,'v6_hood_chimney');
 const dy=bodyH*.86,dz=frontTop-frontBottom,len=Math.hypot(dy,dz),tilt=Math.atan2(dz,dy);
 const face=new THREE.Group();face.name='v6_hood_angled_glass';face.position.set(0,lower*.12+dy/2,(frontBottom+frontTop)/2);face.rotation.x=tilt;g.add(face);
 for(let i=0;i<3;i++)addBox(face,w*.96,len/3-.003,.018,0,(i-1)*len/3,0,glass,'v6_hood_glass_panel');
 addBox(face,w*.96,.021,.024,0,-len/2+.009,.002,steel,'v6_hood_front_trim');
 for(let i=0;i<3;i++)addBox(face,.012,.009,.004,w*.12+i*.027,len*.36,.011,steel,'v6_hood_touch_control');
 for(let i=0;i<8;i++)addBox(g,w*.60,.003,.004,0,.025,-d*.30+i*d*.047,steel,'v6_hood_filter_slats');
 for(const k of [-1,1])addBox(g,.06,.006,.035,k*w*.35,.023,d*.25,new THREE.MeshStandardMaterial({color:0xffecc0,emissive:0xffdeb2,emissiveIntensity:.8}),'v6_hood_light');
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.01,H+.01,d+.015)),new THREE.LineBasicMaterial({color:0xb3905c}));outline.position.y=H/2;outline.visible=model.selected===c.uid;g.add(outline);return g;
}
