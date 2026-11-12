import { clamp, mulberry32, reducedMotion } from '../lib/utils.js';

/* ============================================================
   5. STARFIELD
   ============================================================ */
export function starCanvas(cv, density, drift){
  const ctx=cv.getContext('2d'); let w,h,stars=[];
  const rnd=mulberry32(9182);
  function size(){
    const dpr=Math.min(devicePixelRatio||1,2);
    // CSS can arrive just after the module on a cold mobile navigation. Avoid
    // briefly sizing the hero canvas to 0×0, which Lighthouse records as a
    // full-viewport layout shift when the stylesheet finishes loading.
    w=cv.clientWidth || innerWidth; h=cv.clientHeight || innerHeight;
    cv.width=w*dpr; cv.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    stars=[];
    const n=Math.round(w*h*density);
    for(let i=0;i<n;i++){
      stars.push({x:rnd()*w,y:rnd()*h,r:rnd()*1.25+.18,a:.15+rnd()*.85,tw:.4+rnd()*2.4, ph:rnd()*6.28, hue: rnd()<.12? (rnd()<.5?'#9fd8ff':'#ffd6a8') : '#ffffff', z:.25+rnd()*1});
    }
  }
  // Let layout settle once before allocating the backing bitmap. Initializing a
  // canvas' default 300 × 150 box is recorded as a viewport-sized CLS source.
  requestAnimationFrame(size); addEventListener('resize',size);
  let t=0, mx=0,my=0;
  addEventListener('pointermove',e=>{ mx=(e.clientX/innerWidth-.5); my=(e.clientY/innerHeight-.5); });
  function frame(){
    t+=0.016;
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      const tw=0.55+0.45*Math.sin(t*s.tw+s.ph);
      const px=s.x-mx*18*s.z, py=s.y-my*14*s.z - (drift? t*drift*s.z : 0);
      const yy=((py%h)+h)%h;
      ctx.globalAlpha=s.a*tw;
      ctx.fillStyle=s.hue;
      ctx.beginPath(); ctx.arc(px,yy,s.r,0,6.2832); ctx.fill();
      if(s.r>1.05){ ctx.globalAlpha=s.a*tw*0.22; ctx.beginPath(); ctx.arc(px,yy,s.r*3.4,0,6.2832); ctx.fill(); }
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(frame);
  }
  if(!reducedMotion) frame(); else { ctx.clearRect(0,0,w,h); stars.forEach(s=>{ctx.globalAlpha=s.a*.7;ctx.fillStyle=s.hue;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.2832);ctx.fill();}); }
}

/* ============================================================
   6. SCRAMBLE
   ============================================================ */
const GLYPHS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—+*/<>[]#%$@';
export function scramble(el, dur=1100){
  const final = el.dataset.final || el.textContent;
  el.dataset.final = final;
  if(reducedMotion){ el.textContent=final; return; }
  const start=performance.now();
  const len=final.length;
  function tick(now){
    const p=clamp((now-start)/dur,0,1);
    const reveal=Math.floor(p*len*1.25);
    let out='';
    for(let i=0;i<len;i++){
      const ch=final[i];
      if(ch===' '){out+=' ';continue}
      if(i<reveal) out+=ch;
      else out+=GLYPHS[(Math.random()*GLYPHS.length)|0];
    }
    el.textContent=out;
    if(p<1) requestAnimationFrame(tick); else el.textContent=final;
  }
  requestAnimationFrame(tick);
}

