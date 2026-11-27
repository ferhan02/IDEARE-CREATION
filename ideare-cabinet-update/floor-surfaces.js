/* Material-specific seamless floor samples. The existing material IDs and UV scale stay intact. */
function ideareFloorSurface(p){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d'),S=512;let seed=2166136261;for(const ch of String(p.id||p.name||p.color))seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const col=p.color,style=p.style,rgba=(v,a)=>`rgba(${v},${v},${v},${a})`;
 g.fillStyle=col;g.fillRect(0,0,S,S);
 const stroke=(x,y,X,Y,colour,w=1)=>{g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.lineWidth=w;g.strokeStyle=colour;g.stroke();};
 // A board contains independent, interrupted grain and short end joints instead of full-length bands.
 function board(x,y,w,h,vertical=true,serial=0){g.save();g.translate(x+w/2,y+h/2);if(!vertical)g.rotate(Math.PI/2);const W=vertical?w:h,H=vertical?h:w;g.translate(-W/2,-H/2);g.beginPath();g.rect(0,0,W,H);g.clip();g.fillStyle=col;g.fillRect(0,0,W,H);g.fillStyle=rgba(serial%2?255:0,.025+rand()*.055);g.fillRect(0,0,W,H);
  for(let i=0;i<Math.max(45,Math.ceil(W*H/100));i++){const xx=rand()*W,yy=rand()*H,len=4+rand()*Math.min(H*.42,90),wave=(rand()-.5)*W*.18;g.strokeStyle=i%4===0?'rgba(255,246,222,.13)':'rgba(65,39,20,.10)';g.lineWidth=.35+rand()*.8;g.beginPath();g.moveTo(xx,yy);g.bezierCurveTo(xx+wave,yy+len*.34,xx-wave*.6,yy+len*.72,xx+wave*.4,yy+len);g.stroke();}
  for(let i=0;i<Math.max(8,Math.ceil(W*H/260));i++){g.fillStyle=rgba(rand()>.5?255:0,.05);g.fillRect(rand()*W,rand()*H,.5+rand(),1+rand()*2);}
  g.strokeStyle='rgba(46,31,22,.26)';g.lineWidth=1.2;g.strokeRect(.55,.55,W-1.1,H-1.1);g.restore();}
 if(style==='plank'){
  // 8 staggered rows; the top and bottom are a continuous repeat, not long uniform strips.
  const w=S/8;for(let i=0;i<8;i++){const offset=[0,136,272,68,204,340,102,238][i],first=S-offset;const segments=offset?[[0,first],[first,offset]]:[[0,S]];for(let j=0;j<segments.length;j++)board(i*w,segments[j][0],w,segments[j][1],true,i+j);}
 }else if(style==='herringbone'){
  const unit=32,L=4;for(let x=-L;x<16;x++)for(let y=-L;y<16;y++){const k=((x+y)%(2*L)+2*L)%(2*L);if(k===0)board(x*unit,y*unit,unit,L*unit,true,x+y);else if(k===L)board(x*unit,y*unit,L*unit,unit,false,x+y);}
 }else if(style==='parquet'){
  for(let x=0;x<4;x++)for(let y=0;y<4;y++){const v=(x+y)%2===0;for(let j=0;j<4;j++)board(x*128+(v?j*32:0),y*128+(v?0:j*32),v?32:128,v?128:32,v,x+y+j);}
 }else{
  // Soft, isotropic texture; wrapped clouding keeps the repeat from showing as a grid of stripes.
  if(/marble|cement|tile/.test(style))for(let i=0;i<68;i++){const x=rand()*S,y=rand()*S,r=18+rand()*100,a=.014+rand()*.038,v=i%2?255:45;for(const dx of [-S,0,S])for(const dy of [-S,0,S]){const X=x+dx,Y=y+dy;if(X+r<0||X-r>S||Y+r<0||Y-r>S)continue;const grad=g.createRadialGradient(X,Y,0,X,Y,r);grad.addColorStop(0,rgba(v,a));grad.addColorStop(1,rgba(v,0));g.fillStyle=grad;g.fillRect(X-r,Y-r,r*2,r*2);}}
  for(let i=0;i<(style.includes('carpet')?27000:14000);i++){const x=rand()*S,y=rand()*S;g.fillStyle=rgba(rand()>.5?255:0,.025+rand()*(style.includes('carpet')?.14:.07));g.fillRect(x,y,.6+rand()*1.6,.6+rand()*1.6);}
  if(style.includes('marble'))for(let i=0;i<16;i++){const x=rand()*S,y=rand()*S,len=30+rand()*150,a=rand()*Math.PI*2,dx=Math.cos(a)*len,dy=Math.sin(a)*len;for(const X of [-S,0,S])for(const Y of [-S,0,S]){g.beginPath();g.moveTo(x+X,y+Y);g.bezierCurveTo(x+X+dx*.2-dy*.18,y+Y+dy*.2+dx*.18,x+X+dx*.7+dy*.14,y+Y+dy*.7-dx*.14,x+X+dx,y+Y+dy);g.lineWidth=.5+rand()*1.3;g.strokeStyle=i%3===0?'rgba(255,255,255,.36)':'rgba(71,67,64,.17)';g.stroke();}}
  if(style==='granite'||style==='terrazzo'){const count=style==='granite'?3400:450;for(let i=0;i<count;i++){const x=rand()*S,y=rand()*S,r=style==='granite'?.6+rand()*2:1.5+rand()*6,k=Math.floor(rand()*4);g.fillStyle=['#ffffff55','#38363277','#a98b7066','#e3d0b66b'][k];const pts=Array.from({length:5},(_,j)=>{const a=j*Math.PI*2/5,rr=r*(.6+rand()*.4);return [Math.cos(a)*rr,Math.sin(a)*rr];});for(const X of [-S,0,S])for(const Y of [-S,0,S]){if(x+X+r<0||x+X-r>S||y+Y+r<0||y+Y-r>S)continue;g.beginPath();pts.forEach(([dx,dy],j)=>j?g.lineTo(x+X+dx,y+Y+dy):g.moveTo(x+X+dx,y+Y+dy));g.closePath();g.fill();}}}
  if(['tile','marble-tile','pattern-tile','carpet-tile'].includes(style)){
   const step=256;for(let x=0;x<S;x+=step)for(let y=0;y<S;y+=step){g.fillStyle=rgba(rand()>.5?255:0,.015+rand()*.025);g.fillRect(x,y,step,step);if(style==='pattern-tile'){g.lineWidth=3;g.strokeStyle='rgba(246,240,222,.48)';g.beginPath();g.moveTo(x+128,y+30);g.lineTo(x+226,y+128);g.lineTo(x+128,y+226);g.lineTo(x+30,y+128);g.closePath();g.stroke();g.beginPath();g.arc(x+128,y+128,42,0,Math.PI*2);g.stroke();}}
   for(let i=0;i<=S;i+=step){const line=style==='carpet-tile'?'rgba(40,39,39,.16)':'rgba(86,79,69,.35)';stroke(i,0,i,S,line,2);stroke(0,i,S,i,line,2);}
  }
 }
 return c;
}
