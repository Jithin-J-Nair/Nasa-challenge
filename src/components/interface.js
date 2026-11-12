import { gsap } from 'gsap';
import { $, $$ } from '../lib/dom.js';
import { formatNumber, lerp, reducedMotion } from '../lib/utils.js';
import { scramble, starCanvas } from './visual-effects.js';
import { buildHelio, buildRecord, buildTicker, liveNumbers } from './telemetry.js';

/* ============================================================
   18. AFTER BOOT
   ============================================================ */
export function initInterface(){
  starCanvas($('#stars'), 0.00038, 0);
  const epi=$('#epiCanvas'); if(epi) starCanvas(epi,0.00022,2.2);

  $$('.count').forEach(el=>{
    const to=+el.dataset.to, sfx=el.dataset.suffix||'';
    const io=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){
      if(reducedMotion || typeof gsap === 'undefined') { el.textContent=formatNumber(to)+sfx; io.disconnect(); return; }
      gsap.fromTo(el,{innerText:0},{innerText:to,duration:2.1,ease:'power2.out',snap:{innerText:1}, onUpdate(){el.textContent=formatNumber(Math.round(+el.innerText))+sfx}});
      io.disconnect();
    }})},{threshold:.4}); io.observe(el);
  });

  const io2=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){
    const spans=e.target.querySelectorAll('.lm>span');
    if (typeof gsap === 'undefined') spans.forEach((span) => { span.style.transform = 'none'; span.style.opacity = '1'; });
    else spans.forEach((s,i)=>gsap.to(s,{y:0,opacity:1,duration:reducedMotion?0:1.05,delay:reducedMotion?0:i*.11,ease:'expo.out'}));
    io2.unobserve(e.target);
  }})},{threshold:.2});
  $$('.h1,.h2,.herotitle').forEach(h=>io2.observe(h));

  const io3=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io3.unobserve(e.target);} })},{threshold:.08,rootMargin:'0px 0px -8% 0px'});
  $$('[data-reveal]').forEach(el=>io3.observe(el));

  const io4=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ scramble(e.target); io4.unobserve(e.target);} })},{threshold:.6});
  $$('[data-scramble]').forEach(el=>io4.observe(el));

  if(!reducedMotion){
    const starsEl=$('#stars'), heroEl=$('#hero');
    if(starsEl && heroEl){
      let raf=0;
      const onScroll=()=>{
        if(raf) return;
        raf=requestAnimationFrame(()=>{
          raf=0;
          const y=Math.min(window.scrollY||0, heroEl.offsetHeight);
          starsEl.style.transform='translate3d(0,'+(y*0.16).toFixed(2)+'px,0)';
        });
      };
      addEventListener('scroll',onScroll,{passive:true});
    }
  }

  $$('[data-scroll]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const t=$(btn.dataset.scroll);
      if(!t) return;
      window.scrollTo({top:t.getBoundingClientRect().top+scrollY-40,behavior:reducedMotion?'auto':'smooth'});
    });
  });

  $$('.navlinks a').forEach(a=>a.addEventListener('click',e=>{
    const t=$(a.getAttribute('href')); if(!t) return; e.preventDefault();
    $('#navlinks').classList.remove('open'); $('#burger').setAttribute('aria-expanded','false');
    window.scrollTo({top:t.getBoundingClientRect().top+scrollY-40,behavior:reducedMotion?'auto':'smooth'});
  }));
  $('#burger').addEventListener('click',()=>{
    const open=$('#navlinks').classList.toggle('open');
    $('#burger').setAttribute('aria-expanded',open);
  });

  if(matchMedia('(pointer:fine)').matches && !reducedMotion){
    const r=$('#reticle'); let rx=0,ry=0,tx=0,ty=0;
    addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;r.classList.add('on')});
    addEventListener('mouseleave',()=>r.classList.remove('on'));
    (function loop(){ rx=lerp(rx,tx,.19); ry=lerp(ry,ty,.19); r.style.transform='translate('+rx+'px,'+ry+'px)'; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover',e=>{
      const hot=e.target.closest('button,a,.acard,.tlcard,.sitem,.lcard,.srow,.hot');
      r.classList.toggle('hot',!!hot);
    });
  }

  buildTicker(); buildHelio(); buildRecord();
  liveNumbers();
}

