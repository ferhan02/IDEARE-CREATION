// Concept geometry in metres. Contact is allowed; positive-volume intersections are not.
// The editor uses axis-aligned wall segments and rectangular footprints, like the
// cabinet designer's footprint + vertical-envelope validation.
const EPS=.006, STOREY=3.2;
const ROOMS=new Set(['Room','Wet kitchen','Ground-floor suite']);
const OPENINGS=new Set(['Door','Window']);
const LINE=new Set(['Wall','Fence']);
const SLABS=new Set([...ROOMS,'Tiles','Patio','Car porch']);
const GROUND=new Set(['Pool','Foundation','Fence','Car porch','Patio','Ground-floor suite']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const horizontal=o=>Math.abs(o.w)>=Math.abs(o.h);
const intersects=(a,b,c,d)=>Math.min(b,d)-Math.max(a,c)>EPS;
function wallRange(o){const h=horizontal(o),v=h?o.x:o.y,d=h?o.w:o.h;return {h,coord:h?o.y:o.x,a:Math.min(v,v+d),b:Math.max(v,v+d)};}
export function footprint(o){let x=Math.min(o.x,o.x+o.w),r=Math.max(o.x,o.x+o.w),z=Math.min(o.y,o.y+o.h),b=Math.max(o.y,o.y+o.h);if(LINE.has(o.type)){const w=o.type==='Wall'?.09:.06;if(horizontal(o)){z-=w;b+=w;}else{x-=w;r+=w;}if(o.type==='Fence'){if(horizontal(o)){x-=w;r+=w;}else{z-=w;b+=w;}}}else if(o.type==='Roof'){x-=.125;r+=.125;z-=.125;b+=.125;}return {x,r,z,b};}
function height(o,l){let y=l*STOREY;switch(o.type){case 'Wall':return [y,y+clamp(Number(o.height)||2.8,.5,2.8)];case 'Fence':return [y,y+1.1];case 'Stairs':return [y,y+STOREY];case 'Roof':return [y+2.84,y+2.84+(o.style==='gable'?clamp(Math.min(o.w,o.h)*.3,.55,2.6)+.12:.18)];case 'Foundation':return [y-.02,y+clamp(Number(o.height)||.18,.1,.6)-.02];case 'Pool':return [y-1.5,y+.035];case 'Door':return [y,y+clamp(Number(o.height)||2.1,.4,2.7)];case 'Window':return [y+.9,y+.9+clamp(Number(o.height)||1.2,.4,1.85)];case 'Tiles':return [y+.04,y+.075];default:return [y-.135,y+.035];}}
function hosts(w,o){if(w.type!=='Wall'||!OPENINGS.has(o.type))return false;const a=wallRange(w),h=horizontal(o),mid=h?o.x+o.w/2:o.y+o.h/2,c=h?o.y+o.h/2:o.x+o.w/2,half=(h?o.w:o.h)/2,top=(o.type==='Window'?.9:0)+clamp(Number(o.height)||(o.type==='Door'?2.1:1.2),.4,o.type==='Door'?2.7:1.85);return a.h===h&&Math.abs(a.coord-c)<.025&&mid-half>=a.a-EPS&&mid+half<=a.b+EPS&&top<=clamp(Number(w.height)||2.8,.5,2.8)+EPS;}
export function openingSupported(o,floor){return !OPENINGS.has(o.type)||floor.some(w=>hosts(w,o));}
export function geometryValid(o,l,bounds){if(!o||!['x','y','w','h'].every(k=>Number.isFinite(o[k])))return false;if(l>0&&GROUND.has(o.type))return false;const [w,d,s,e]=bounds;const x=Math.min(o.x,o.x+o.w),z=Math.min(o.y,o.y+o.h),r=Math.max(o.x,o.x+o.w),b=Math.max(o.y,o.y+o.h);if(x<s-EPS||z<e-EPS||r>w-s+EPS||b>d-e+EPS)return false;if(LINE.has(o.type))return Math.hypot(o.w,o.h)>=.15&&Math.min(Math.abs(o.w),Math.abs(o.h))<EPS;const min=['Pool','Stairs'].includes(o.type)?.5:.15;return o.w>=min&&o.h>=min;}
export function pairConflict(a,la,b,lb){const A=footprint(a),B=footprint(b);if(!intersects(A.x,A.r,B.x,B.r)||!intersects(A.z,A.b,B.z,B.b))return false;const same=la===lb,ta=a.type,tb=b.type;
 // Reserve the stair opening on the next floor, including any tiles or room slab.
 if((ta==='Stairs'&&lb===la+1&&(SLABS.has(tb)||tb==='Wall'))||(tb==='Stairs'&&la===lb+1&&(SLABS.has(ta)||ta==='Wall')))return true;
 const ha=height(a,la),hb=height(b,lb);if(!intersects(...ha,...hb))return false;
 if(!same)return true;
 if(ta==='Pool'||tb==='Pool')return true;
 if(ta==='Wall'&&tb==='Wall'){const u=wallRange(a),v=wallRange(b);if(u.h!==v.h)return false; // structural T/cross junctions
  // Shared room boundaries are merged by the wall renderer. Explicit duplicates are blocked.
  return !(Math.abs(u.coord-v.coord)<EPS&&(a.owner||b.owner)&&intersects(u.a,u.b,v.a,v.b));}
 if(OPENINGS.has(ta)&&tb==='Wall')return !hosts(b,a);
 if(OPENINGS.has(tb)&&ta==='Wall')return !hosts(a,b);
 if(OPENINGS.has(ta)&&OPENINGS.has(tb))return true;
 if(SLABS.has(ta)&&SLABS.has(tb)){if(ta==='Tiles'||tb==='Tiles')return ta===tb;return true;}
 // Floors are horizontal supports/finishes, not solid room-sized volumes.
 // Walls and stair feet can meet their floor, but elevated platforms cannot intersect stairs.
 if(SLABS.has(ta)||SLABS.has(tb)){const other=SLABS.has(ta)?tb:ta;return !['Wall','Door','Window','Stairs','Foundation'].includes(other);}
 if(ta==='Foundation'||tb==='Foundation'){const other=ta==='Foundation'?tb:ta;return !['Wall','Door','Window'].includes(other);}
 return true;
}
export function checkCandidate(o,l,floors,bounds,ignore=null){if(!geometryValid(o,l,bounds))return false;if(!openingSupported(o,floors[l]||[]))return false;for(let i=0;i<floors.length;i++)for(const q of floors[i])if(q!==ignore&&q!==o&&pairConflict(o,l,q,i))return false;return true;}
// Check only changed pairs so old saved designs with pre-existing overlaps can
// still be edited. Any changed relative geometry must be collision-free.
export function checkTransition(before,after,bounds){const all=[];for(let l=0;l<after.length;l++){const f=after[l];for(let i=0;i<f.length;i++){const o=f[i],old=before[l]?.[i],changed=JSON.stringify(o)!==JSON.stringify(old);if(changed&&!geometryValid(o,l,bounds))return false;if(OPENINGS.has(o.type)&&!openingSupported(o,f)&&(changed||openingSupported(old||o,before[l]||[])))return false;all.push({o,old,l,changed});}}
 for(const a of all)if(a.changed)for(const b of all){if(a===b)continue; // moved pairs only
 if(a.old&&b.old&&a.o.w===a.old.w&&a.o.h===a.old.h&&b.o.w===b.old.w&&b.o.h===b.old.h&&a.o.height===a.old.height&&b.o.height===b.old.height&&a.o.style===a.old.style&&b.o.style===b.old.style&&Math.abs((a.o.x-a.old.x)-(b.o.x-b.old.x))<EPS&&Math.abs((a.o.y-a.old.y)-(b.o.y-b.old.y))<EPS)continue;
 if(pairConflict(a.o,a.l,b.o,b.l))return false;}
 return true;}
