<?php
// Guarded CLI-only patch for the checked IDEARE consolidated designer.
if (PHP_SAPI !== 'cli') {http_response_code(404); exit;}
$root=dirname(__DIR__);
$jsPath=$root.'/assets/js/designer.js';
$cssPath=$root.'/assets/css/design-studio-spacing.css';
$headerPath=$root.'/includes/customer/header.php';
$indexPath=$root.'/designer/index.php';
function readSource(string $p): string { $s=@file_get_contents($p);if($s===false)throw new RuntimeException('Cannot read '.$p);return $s; }
function exact(string &$s,string $a,string $b,string $name): void { $n=substr_count($s,$a);if($n!==1)throw new RuntimeException("Unexpected source for $name ($n matches). No changes written.");$s=str_replace($a,$b,$s); }
try {
 $oldJs=readSource($jsPath);$oldCss=readSource($cssPath);$oldHeader=readSource($headerPath);$oldIndex=readSource($indexPath);
 if(str_contains($oldJs,'/* IDEARE cabinet refinement: shared 50 mm grid')){echo "Cabinet refinement is already installed.\n";exit(0);}
 $js=$oldJs;$css=$oldCss;$header=$oldHeader;$index=$oldIndex;
 exact($js,'let wallsVisible=false, gridVisible=true, hoverUid=null, move=null, dragTemplate=null, ghost=null;',"let wallsVisible=true, gridVisible=true, hoverUid=null, move=null, dragTemplate=null, ghost=null;\nlet ideareGridSnap=true,ideareGridCustom=null,ideareGridAuto='#292723';",'wall and grid defaults');
 exact($index,'id="wall-toggle" type="button" aria-pressed="false">Show walls','id="wall-toggle" type="button" aria-pressed="true">Hide walls','initial wall button');
 exact($js, <<<'JS'
for(const [arr,col,op] of [[minor,0x796f62,.12],[major,0x675a4a,.42]]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));group.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false})));}
JS
 ,'ideareMakeGridLines(minor,major,group);','grid geometry');
 exact($js,'const gx=Math.round((x-w/2)/STEP)*STEP+w/2,gz=Math.round((z-d/2)/STEP)*STEP+d/2;','const gx=ideareGridActive()?ideareGridAxis(c,\'x\',x):x,gz=ideareGridActive()?ideareGridAxis(c,\'z\',z):z;','legacy placement grid');
 exact($js,'x:Math.round(x/STEP)*STEP,z:Math.round(z/STEP)*STEP','x:ideareGridActive()?ideareGridAxis(c,\'x\',x):x,z:ideareGridActive()?ideareGridAxis(c,\'z\',z):z','legacy extra placement');
 exact($js,'const targets=[{v:q[along],bonus:0}];',"const targets=[{v:q[along],bonus:0}];if(ideareGridActive()){const gv=ideareGridAxis(q,along,q[along]);if(gv>=lo-.01&&gv<=hi+.01)targets.unshift({v:gv,bonus:80});}",'wall-mounted grid');
 exact($js,'for(const [X,Z] of [[x1,z1],[x1,base.z],[base.x,z1],[base.x,base.z],[x2,z2],[x2,base.z],[base.x,z2]])',"const grid=ideareGridActive()?ideareGridCandidate(base):null;for(const [X,Z] of [...(grid?[[grid.x,grid.z],[grid.x,z1],[x1,grid.z]]:[]),[x1,z1],[x1,base.z],[base.x,z1],[base.x,base.z],[x2,z2],[x2,base.z],[base.x,z2]])",'free cabinet and appliance movement');
 exact($js,'if(noCollision(c))return c;','if(ideareGridActive()){const q=ideareGridCandidate(c);if(noCollision(q))return q;}if(noCollision(c))return c;','new item placement');
 exact($js,'const q={...c,x:p.x,z:p.z};if(noCollision(q))return q;','let q={...c,x:p.x,z:p.z};if(ideareGridActive())q=ideareGridCandidate(q);if(noCollision(q))return q;','free position search');
 exact($js,'return best===null?raw:ideareMagnet(raw,best,enter,release);','return best===null?(ideareGridActive()?Math.round(raw/STEP)*STEP:raw):ideareMagnet(raw,best,enter,release);','resize and alignment snapping');
 exact($js, <<<'JS'
if(plinthOn&&!model.shared.some(x=>x.type==='plinth'&&x.cabinetUids.includes(c.uid))){let kick=mat('#555451');addBox(g,w-.03,plinthH-.01,d-.10,0,plinthH/2,-.035,kick,'recessed_plinth');}
JS
 , <<<'JS'
if(plinthOn)ideareCabinetSupports(g,c,plinthH,0,0,w,d,!model.shared.some(x=>x.type==='plinth'&&x.cabinetUids.includes(c.uid)));
JS
 ,'cabinet feet and plinth');
 exact($js, <<<'JS'
if(c.plinth)v6Slab(g,p.map(([x,z])=>[x*.92,z*.92]),0,Math.max(.001,pl-.008),mat('#555451'),'recessed_plinth');
JS
 ,'if(c.plinth)ideareCornerSupports(g,c,p,pl);','corner cabinet supports');
 exact($js, <<<'JS'
const h=hi-lo,SD=Math.max(.12,depth-.065),back=-D/2,cz=back+SD/2,fz=back+SD-.010;if(h<.08||W<.12)return;
JS
 , <<<'JS'
const SD=Math.max(.12,depth-.065),back=-D/2,cz=back+SD/2,fz=back+SD-.010;if(hi-lo<.08||W<.12)return;if(lo===0){const pl=Math.min(.2,Math.max(.05,(Number(c.plinthHeight)||100)/1000),Math.max(.01,hi-.12));ideareCabinetSupports(g,c,pl,x,cz,W,SD,true);lo=pl;}const h=hi-lo;if(h<.08)return;
JS
 ,'fridge surround pantry supports');
 // The floor material generator lives in a separate IIFE; call the new generator only for flooring.
 exact($js,"function image(p){if(images.has(p.id))return images.get(p.id);const c=document.createElement('canvas');","function image(p){if(images.has(p.id))return images.get(p.id);if(floors.includes(p)){const tex=ideareFloorSurface(p);images.set(p.id,tex);if(images.size>24)images.delete(images.keys().next().value);return tex;}const c=document.createElement('canvas');",'floor material generator');
 exact($js,'function materialize(mesh,p,floor=false){const mat=mesh.material;','function materialize(mesh,p,floor=false){if(floor)ideareSetFloorGrid(p.color);const mat=mesh.material;','adaptive contrast');
 exact($js,'t.anisotropy=4;textures.set(p.id,t);','t.anisotropy=Math.min(8,renderer?.capabilities?.getMaxAnisotropy?.()||4);textures.set(p.id,t);','texture filtering');
 $extension=readSource(__DIR__.'/floor-surfaces.js')."\n".readSource(__DIR__.'/refinement.js');
 exact($js,'Promise.resolve().then(()=>boot()).catch(ideareStartupError);',$extension."\nPromise.resolve().then(()=>boot()).catch(ideareStartupError);",'module entry');
 $css.="\n".readSource(__DIR__.'/refinement.css');
 if(!preg_match('~assets/css/design-studio-spacing\.css\?v=[^"\s]+~',$header))throw new RuntimeException('Shared designer stylesheet link not found. No changes written.');
 $header=preg_replace('~assets/css/design-studio-spacing\.css\?v=[^"\s]+~','assets/css/design-studio-spacing.css?v=20261127-cabinet-refinement',$header,1);
 $files=[$jsPath=>[$oldJs,$js],$cssPath=>[$oldCss,$css],$headerPath=>[$oldHeader,$header],$indexPath=>[$oldIndex,$index]];
 $backup=rtrim(sys_get_temp_dir(),DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'ideare-cabinet-'.date('Ymd-His').'-'.bin2hex(random_bytes(3));
 if(!mkdir($backup,0700))throw new RuntimeException('Could not create backup.');
 foreach($files as $path=>[$old,$new]){if(!is_writable($path))throw new RuntimeException('Not writable: '.$path);if(file_put_contents($backup.'/'.basename($path),$old,LOCK_EX)===false)throw new RuntimeException('Backup failed.');}
 $written=[];
 try{foreach($files as $path=>[$old,$new]){$written[]=$path;if(file_put_contents($path,$new,LOCK_EX)!==strlen($new))throw new RuntimeException('Could not write '.$path);}}
 catch(Throwable $e){foreach($written as $path)@file_put_contents($path,$files[$path][0],LOCK_EX);throw $e;}
 echo "Updated 4 existing files.\nBackup: $backup\nRefresh the cabinet designer with Ctrl+F5.\n";
}catch(Throwable $e){fwrite(STDERR,$e->getMessage()."\n");exit(1);}
