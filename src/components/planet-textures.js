import { clamp, mulberry32 } from '../lib/utils.js';

/* ============================================================
   4. PROCEDURAL PLANET TEXTURES
   ============================================================ */
function blob(ctx,x,y,r,col,a){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,col.replace('ALPHA',a));
  g.addColorStop(.55,col.replace('ALPHA',a*0.55));
  g.addColorStop(1,col.replace('ALPHA',0));
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill();
}
function drawCrater(ctx,W,H,lon,lat,angR,palette,rnd){
  const cl = Math.max(0.14, Math.cos(lat*Math.PI/180));
  const cx = ((lon+180)/360)*W;
  const cy = ((90-lat)/180)*H;
  const rx = (angR/cl/360)*W;
  const ry = (angR/180)*H;
  if(rx<0.6||ry<0.6) return;
  for(const ox of [0,-W,W]){
    const X=cx+ox;
    if(X+rx<-40||X-rx>W+40) continue;
    ctx.save(); ctx.translate(X,cy); ctx.scale(1, ry/rx);
    let g=ctx.createRadialGradient(0,0,rx*0.05,0,0,rx);
    g.addColorStop(0,palette.floor0); g.addColorStop(.62,palette.floor1); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,rx,0,6.2832); ctx.fill();
    ctx.rotate(-0.7);
    g=ctx.createRadialGradient(rx*0.12,0,rx*0.55,rx*0.12,0,rx*1.06);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.72,palette.rim); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,rx*1.06,0,6.2832); ctx.fill();
    ctx.restore();
  }
}
function makeRays(ctx,W,H,lon,lat,angR,col,rnd){
  const cx=((lon+180)/360)*W, cy=((90-lat)/180)*H;
  ctx.save(); ctx.globalAlpha=.5; ctx.strokeStyle=col; ctx.lineWidth=Math.max(1,W/900);
  for(let i=0;i<26;i++){
    const a=rnd()*6.2832, len=(1.6+rnd()*5.2)*angR;
    const x1=cx+Math.cos(a)*angR*0.55*W/360*3, y1=cy+Math.sin(a)*angR*0.55*H/180*3;
    const x2=cx+Math.cos(a)*len*W/360, y2=cy+Math.sin(a)*len*H/180;
    ctx.globalAlpha=.08+rnd()*.34;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }
  ctx.restore();
}
function grainPass(ctx,W,H,amt,rnd){
  const img=ctx.getImageData(0,0,W,H), d=img.data;
  for(let i=0;i<d.length;i+=4){
    const n=(rnd()*2-1)*amt;
    d[i]=clamp(d[i]+n,0,255); d[i+1]=clamp(d[i+1]+n,0,255); d[i+2]=clamp(d[i+2]+n,0,255);
  }
  ctx.putImageData(img,0,0);
}
export function toBump(src){
  const c=document.createElement('canvas'); c.width=src.width; c.height=src.height;
  const x=c.getContext('2d'); x.drawImage(src,0,0);
  const img=x.getImageData(0,0,c.width,c.height), d=img.data;
  for(let i=0;i<d.length;i+=4){
    const L=(d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114);
    const v=clamp(128+(L-128)*1.5,0,255);
    d[i]=d[i+1]=d[i+2]=v;
  }
  x.putImageData(img,0,0);
  return c;
}
export function generateMoon(W,H){
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const ctx=c.getContext('2d'); const rnd=mulberry32(20260419);
  ctx.fillStyle='#9a968d'; ctx.fillRect(0,0,W,H);
  for(let i=0;i<220;i++){
    const lon=(rnd()*2-1)*180, lat=(rnd()*2-1)*80;
    const x=((lon+180)/360)*W, y=((90-lat)/180)*H;
    const r=(8+rnd()*70)*W/1600;
    blob(ctx,x,y,r, rnd()>.5?'rgba(190,186,178,ALPHA)':'rgba(96,93,88,ALPHA)', .10+rnd()*.14);
  }
  const maria=[[-57,18,52,'mare'],[-15,35,26,'mare'],[-19,22,20,'mare'],[18,28,17,'mare'],[31,10,15,'mare'],[58,-6,15,'mare'],[35,-16,10,'mare'],[62,17,9,'mare'],[-17,-21,12,'mare'],[38,-25,10,'mare'],[-3,56,26,'mare'],[-45,-3,20,'mare'],[25,20,10,'mare'],[50,32,10,'mare'],[-70,-40,16,'mare'],[-25,-8,14,'mare']];
  maria.forEach(m=>{
    const x=((m[0]+180)/360)*W, y=((90-m[1])/180)*H, r=m[2]*W/360*1.15;
    blob(ctx,x,y,r,'rgba(56,57,64,ALPHA)',.72);
    blob(ctx,x+r*.2,y-r*.15,r*.6,'rgba(44,45,52,ALPHA)',.5);
  });
  ctx.save(); ctx.globalAlpha=.16; ctx.strokeStyle='#2b2c33'; ctx.lineWidth=Math.max(1,W/1200);
  for(let i=0;i<120;i++){
    const m=maria[(rnd()*maria.length)|0];
    const bx=((m[0]+180)/360)*W, by=((90-m[1])/180)*H;
    ctx.beginPath();
    let px=bx+(rnd()-.5)*m[2]*W/360*2, py=by+(rnd()-.5)*m[2]*H/180*2;
    ctx.moveTo(px,py);
    for(let k=0;k<4;k++){ px+=(rnd()-.5)*40; py+=(rnd()-.5)*14; ctx.lineTo(px,py); }
    ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha=.10; ctx.fillStyle='#cfcac0';
  ctx.fillRect(0,0,W*0.16,H); ctx.fillRect(W*0.84,0,W*0.16,H); ctx.restore();
  const pal={floor0:'rgba(72,70,66,.42)',floor1:'rgba(120,116,109,.16)',rim:'rgba(226,221,210,.55)'};
  for(let i=0;i<1150;i++){
    const lat=Math.asin(rnd()*2-1)*180/Math.PI;
    let lon=(rnd()*2-1)*180;
    let r=0.35+Math.pow(rnd(),3.1)*9.5;
    if(rnd()<0.006) r=9+Math.pow(rnd(),1.4)*16;
    drawCrater(ctx,W,H,lon,lat,r,pal,rnd);
  }
  const bright=[[-11.2,-21.6,10,'Tycho'],[-19.7,7.0,9,'Copernicus'],[-20.3,-15.4,6,'Kepler'],[26.1,18.2,5,'Aristarchus']];
  bright.forEach(b=>{
    makeRays(ctx,W,H,b[0],b[1],b[2],'#f0ece2',rnd);
    drawCrater(ctx,W,H,b[0],b[1],b[2],{floor0:'rgba(210,205,196,.5)',floor1:'rgba(150,146,138,.2)',rim:'rgba(246,242,233,.85)'},rnd);
  });
  blob(ctx,W*0.5,H*0.94,W*0.34,'rgba(70,68,72,ALPHA)',.30);
  grainPass(ctx,W,H,7,rnd);
  return c;
}
export function generateMars(W,H){
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const ctx=c.getContext('2d'); const rnd=mulberry32(77123);
  ctx.fillStyle='#a4593a'; ctx.fillRect(0,0,W,H);
  let g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#c07a52'); g.addColorStop(.34,'#b06a45'); g.addColorStop(.52,'#96502f'); g.addColorStop(1,'#7d3f26');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const feats=[[69,8,26,'rgba(58,36,26,ALPHA)',.55],[-58,-6,20,'rgba(66,40,28,ALPHA)',.45],[30,-24,22,'rgba(72,44,30,ALPHA)',.4],[-110,2,34,'rgba(206,150,112,ALPHA)',.42],[-104,-6,26,'rgba(198,142,104,ALPHA)',.34],[70,-42,26,'rgba(214,178,148,ALPHA)',.45],[-30,-30,20,'rgba(60,38,26,ALPHA)',.35],[160,-46,22,'rgba(64,40,28,ALPHA)',.35],[-45,45,26,'rgba(200,150,118,ALPHA)',.3],[-150,-30,18,'rgba(70,42,28,ALPHA)',.3],[20,-8,20,'rgba(58,36,24,ALPHA)',.3],[140,20,24,'rgba(190,138,100,ALPHA)',.28]];
  feats.forEach(f=>{ const x=((f[0]+180)/360)*W, y=((90-f[1])/180)*H; blob(ctx,x,y,f[2]*W/360*1.2,f[3],f[4]); });
  ctx.save(); ctx.globalAlpha=.55; ctx.strokeStyle='#5a3220'; ctx.lineWidth=Math.max(3,W/340); ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(((-90+180)/360)*W,((90+12)/180)*H);
  ctx.bezierCurveTo(((-70+180)/360)*W,((90+14)/180)*H,((-50+180)/360)*W,((90+13)/180)*H,((-30+180)/360)*W,((90+9)/180)*H);
  ctx.stroke(); ctx.restore();
  [[-133.8,18.7,7],[-112,1.5,10],[-113.5,-2.8,9],[-104.5,-8.4,8],[-110,-1,4]].forEach(v=>{
    const x=((v[0]+180)/360)*W,y=((90-v[1])/180)*H,r=v[2]*W/360;
    blob(ctx,x,y,r*2.4,'rgba(200,150,116,ALPHA)',.4);
    drawCrater(ctx,W,H,v[0],v[1],v[2],{floor0:'rgba(60,34,22,.55)',floor1:'rgba(120,74,50,.2)',rim:'rgba(226,186,150,.6)'},rnd);
  });
  drawCrater(ctx,W,H,70,-42,20,{floor0:'rgba(214,186,160,.5)',floor1:'rgba(180,140,112,.2)',rim:'rgba(226,200,178,.5)'},rnd);
  const pal={floor0:'rgba(70,40,26,.45)',floor1:'rgba(140,90,62,.18)',rim:'rgba(224,186,152,.55)'};
  for(let i=0;i<1000;i++){
    const lat=Math.asin(rnd()*2-1)*180/Math.PI;
    const lon=(rnd()*2-1)*180;
    const southern = lat<0 ? 1 : 0.34;
    if(rnd()>southern) continue;
    let r=0.4+Math.pow(rnd(),3.0)*7;
    if(rnd()<0.005) r=7+Math.pow(rnd(),1.3)*13;
    drawCrater(ctx,W,H,lon,lat,r,pal,rnd);
  }
  [[-207,10,5,'Zunil'],[-126,16,4.5,'Mojave'],[-58,-42,4,'']].forEach(b=>{ makeRays(ctx,W,H,b[0],b[1],b[2],'#f2dcc4',rnd); });
  const cap=(y0,h,alph)=>{
    ctx.save();
    const cg=ctx.createLinearGradient(0,y0,0,y0+h);
    cg.addColorStop(0,'rgba(246,246,250,'+alph+')'); cg.addColorStop(1,'rgba(246,246,250,0)');
    ctx.fillStyle=cg; ctx.fillRect(0,y0,W,h);
    ctx.restore();
  };
  cap(0,H*0.075,.92); cap(H*0.925,H*0.075,.92);
  ctx.save(); ctx.fillStyle='rgba(240,242,248,.65)';
  for(let i=0;i<220;i++){
    const top = rnd()>.5;
    const x=rnd()*W;
    const y= top ? H*0.07+rnd()*H*0.05 : H*0.90-rnd()*H*0.05;
    ctx.beginPath(); ctx.arc(x,y,2+rnd()*9,0,6.2832); ctx.fill();
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha=.13; ctx.strokeStyle='#d8a878';
  for(let i=0;i<90;i++){
    const x=rnd()*W,y=rnd()*H; ctx.lineWidth=1+rnd()*4;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+30+rnd()*90,y+(rnd()-.5)*12); ctx.stroke();
  }
  ctx.restore();
  grainPass(ctx,W,H,8,rnd);
  return c;
}

