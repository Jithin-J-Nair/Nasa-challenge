import { $ } from '../lib/dom.js';
import { formatNumber } from '../lib/utils.js';

/* ============================================================
   14. LIVE COUNTERS
   ============================================================ */
const AU=149597870.7, C=299792.458;
const V1_EPOCH=Date.UTC(2026,10,18,10,16,7), V1_KM=25902068371.2, V1_RATE=16.6;
const V2_EPOCH=Date.UTC(2026,1,15,0,0,0),     V2_KM=143.05*AU,      V2_RATE=15.3;
const NH_EPOCH=Date.UTC(2026,10,12,0,0,0),    NH_KM=62.9*AU,        NH_RATE=13.6;
export function liveNumbers(){
  const now=Date.now(), t=(now-V1_EPOCH)/1000;
  const v1=V1_KM+V1_RATE*t, v2=V2_KM+V2_RATE*((now-V2_EPOCH)/1000), nh=NH_KM+NH_RATE*((now-NH_EPOCH)/1000);
  const s1=$('#v1km'), s2=$('#v2km'), s3=$('#nhkm');
  if(s1) s1.textContent=formatNumber(Math.round(v1));
  if(s2) s2.textContent=formatNumber(Math.round(v2));
  if(s3) s3.textContent=formatNumber(Math.round(nh));
  const a1=$('#v1au'), a2=$('#v2au'), a3=$('#nhau');
  if(a1) a1.textContent=(v1/AU).toFixed(3);
  if(a2) a2.textContent=(v2/AU).toFixed(3);
  if(a3) a3.textContent=(nh/AU).toFixed(2);
  const rt=$('#rtt'); if(rt) rt.textContent=((v1/C)*2/3600).toFixed(2);
  const hv=$('#heroV1'); if(hv) hv.textContent=(v1/AU).toFixed(2);
  const diff=V1_EPOCH-now;
  const cd=$('#cdD');
  if(cd){
    if(diff>0){
      const D=Math.floor(diff/86400000), H=Math.floor(diff%86400000/3600000), M=Math.floor(diff%3600000/60000), S=Math.floor(diff%60000/1000);
      $('#cdD').textContent=String(D).padStart(2,'0'); $('#cdH').textContent=String(H).padStart(2,'0');
      $('#cdM').textContent=String(M).padStart(2,'0'); $('#cdS').textContent=String(S).padStart(2,'0');
    } else {
      const abs=Math.abs(diff);
      $('#cdD').textContent='00'; $('#cdH').textContent='+'+Math.floor(abs/3600000);
      $('#cdM').textContent=String(Math.floor(abs%3600000/60000)).padStart(2,'0');
      $('#cdS').textContent=String(Math.floor(abs%60000/1000)).padStart(2,'0');
      $('.countdown .lbl').innerHTML='<i></i>Milestone reached · Voyager 1 is now more than one light-day from Earth';
    }
  }
  const d=new Date();
  const cl=$('#clock'); if(cl) cl.textContent=d.toISOString().substr(11,8);
}
setInterval(liveNumbers,250);

export function buildTicker(){
  const items=[
   '<b>DSN</b> · TRACKING VOYAGER 1 · <i>SIGNAL NOMINAL</i>',
   '<b>VOYAGER 1</b> · <span data-tick-v1>—</span> KM · <u>173 AU</u>',
   '<b>PERSEVERANCE</b> · JEZERO CRATER · <i>ACTIVE</i> · ODOMETER 45.22 KM · RECORD SET 11 OCT 2026',
   '<b>CURIOSITY</b> · GALE CRATER · <i>ACTIVE</i> · SOL 5070 · 38.29 KM DRIVEN',
   '<b>APOLLO 15 RETROREFLECTOR</b> · <i>RETURNING PHOTONS</i> · 54 YEARS CONTINUOUS',
   '<b>MILESTONE</b> · VOYAGER 1 REACHES ONE LIGHT-DAY · <u>18 NOV 2026 10:16:07 UTC</u>',
   '<b>OPPORTUNITY</b> · MERIDIANI PLANUM · SILENT SINCE 10 JUN 2018 · 45.16 KM',
   '<b>DAWN</b> · STILL ORBITING CERES · DERELICT SINCE 01 NOV 2018',
   '<b>MARINER 9</b> · IN MARTIAN ORBIT · PREDICTED IMPACT ~2034',
   '<b>NEW HORIZONS</b> · <span data-tick-nh>—</span> KM · KUIPER BELT · <i>ACTIVE</i>'
  ];
  const html=items.concat(items).map(x=>'<span>'+x+'</span>').join('');
  $('#telwrap').innerHTML=html;
}
setInterval(()=>{
  const now=Date.now();
  const v1=V1_KM+V1_RATE*((now-V1_EPOCH)/1000), nh=NH_KM+NH_RATE*((now-NH_EPOCH)/1000);
  document.querySelectorAll('[data-tick-v1]').forEach(e=>e.textContent=formatNumber(Math.round(v1)));
  document.querySelectorAll('[data-tick-nh]').forEach(e=>e.textContent=formatNumber(Math.round(nh)));
},1000);

/* ============================================================
   15. HELIOSPHERE DIAGRAM
   ============================================================ */
export function buildHelio(){
  const svg=$('#helioSvg'); const CX=210, CY=200;
  const maxR=190, logMax=Math.log10(180);
  const R = au => au<=0?0 : (Math.log10(Math.max(au,0.35))/logMax)*maxR;
  let out='';
  out+='<defs><radialGradient id="sunG"><stop offset="0" stop-color="#fff3d0"/><stop offset=".4" stop-color="#ff9d3d"/><stop offset="1" stop-color="#ff9d3d" stop-opacity="0"/></radialGradient>';
  out+='<radialGradient id="hG"><stop offset="0" stop-color="#1b2a44" stop-opacity=".75"/><stop offset=".72" stop-color="#12203a" stop-opacity=".28"/><stop offset="1" stop-color="#0a1224" stop-opacity="0"/></radialGradient></defs>';
  out+='<circle cx="'+CX+'" cy="'+CY+'" r="'+maxR+'" fill="url(#hG)"/>';
  out+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R(123)+'" fill="none" stroke="#5fe1ff" stroke-opacity=".3" stroke-width="1" stroke-dasharray="4 4"/>';
  out+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R(94)+'" fill="none" stroke="#a48bff" stroke-opacity=".28" stroke-width="1" stroke-dasharray="2 5"/>';
  out+='<text x="'+(CX+R(123)-4)+'" y="'+(CY-8)+'" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="7" fill="#5fe1ff" fill-opacity=".75">HELIOPAUSE ~123 AU</text>';
  out+='<text x="'+(CX+R(94)-4)+'" y="'+(CY+14)+'" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="7" fill="#a48bff" fill-opacity=".7">TERMINATION SHOCK ~94 AU</text>';
  const pl=[['Mercury',0.39],['Venus',0.72],['Earth',1],['Mars',1.52],['Jupiter',5.2],['Saturn',9.5],['Uranus',19.2],['Neptune',30.1]];
  pl.forEach(p=>{ const r=R(p[1]);
    out+='<circle cx="'+CX+'" cy="'+CY+'" r="'+r+'" fill="none" stroke="rgba(236,231,222,.11)" stroke-width=".8"/>';
    out+='<circle cx="'+(CX+r*Math.cos(-0.5))+'" cy="'+(CY+r*Math.sin(-0.5))+'" r="'+(p[1]>4?2.4:1.5)+'" fill="rgba(236,231,222,.5)"/>';
    out+='<text x="'+(CX+r+3)+'" y="'+(CY-2)+'" font-family="IBM Plex Mono,monospace" font-size="6" fill="#4d5566">'+p[0].toUpperCase()+'</text>';
  });
  out+='<circle cx="'+CX+'" cy="'+CY+'" r="14" fill="url(#sunG)"/><circle cx="'+CX+'" cy="'+CY+'" r="4.5" fill="#fff3d0"/>';
  const probes=[
   {n:'VOYAGER 1',au:173,a:-40,c:'#ff9d3d'},
   {n:'VOYAGER 2',au:144,a:-145,c:'#5fe1ff'},
   {n:'PIONEER 10',au:140,a:75,c:'#e2553b'},
   {n:'PIONEER 11',au:112,a:-20,c:'#a48bff'},
   {n:'NEW HORIZONS',au:63,a:150,c:'#8ee6a4'}
  ];
  probes.forEach(p=>{
    const rad=p.a*Math.PI/180, r=R(p.au);
    const x=CX+Math.cos(rad)*r, y=CY+Math.sin(rad)*r;
    out+='<line x1="'+CX+'" y1="'+CY+'" x2="'+x+'" y2="'+y+'" stroke="'+p.c+'" stroke-opacity=".22" stroke-width="1" stroke-dasharray="2 4"/>';
    out+='<circle cx="'+x+'" cy="'+y+'" r="3.6" fill="'+p.c+'"/><circle cx="'+x+'" cy="'+y+'" r="8" fill="none" stroke="'+p.c+'" stroke-opacity=".35"><animate attributeName="r" values="4;12;4" dur="3.4s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".5;0;.5" dur="3.4s" repeatCount="indefinite"/></circle>';
    const lx=x+(Math.cos(rad)>0?12:-12), anch=Math.cos(rad)>0?'start':'end';
    out+='<text x="'+lx+'" y="'+(y+3)+'" text-anchor="'+anch+'" font-family="IBM Plex Mono,monospace" font-size="7.4" fill="'+p.c+'">'+p.n+'</text>';
    out+='<text x="'+lx+'" y="'+(y+12)+'" text-anchor="'+anch+'" font-family="IBM Plex Mono,monospace" font-size="6.4" fill="#5f6779">'+p.au+' AU</text>';
  });
  out+='<text x="10" y="372" font-family="IBM Plex Mono,monospace" font-size="6.6" fill="#3f4757">LOGARITHMIC SCALE · DISTANCES AS OF NOV 2026 · 1 AU = 149.6 MILLION KM</text>';
  svg.innerHTML=out;
}

/* ============================================================
   16. GOLDEN RECORD DIAGRAM
   ============================================================ */
export function buildRecord(){
  const svg=$('#recordSvg');
  let o='<defs><radialGradient id="rgold"><stop offset="0" stop-color="#4a3a22"/><stop offset=".55" stop-color="#b98a3e"/><stop offset=".92" stop-color="#f0c476"/><stop offset="1" stop-color="#8a6528"/></radialGradient></defs>';
  o+='<circle cx="160" cy="160" r="150" fill="#0a0d16" stroke="rgba(236,231,222,.14)"/>';
  o+='<g class="spin"><circle cx="160" cy="160" r="132" fill="url(#rgold)" opacity=".92"/>';
  for(let i=0;i<70;i++){ const r=26+i*1.5; o+='<circle cx="160" cy="160" r="'+r+'" fill="none" stroke="rgba(30,20,8,.28)" stroke-width=".7"/>'; }
  o+='<circle cx="160" cy="160" r="24" fill="#1a1509" stroke="rgba(240,196,118,.5)"/>';
  o+='<circle cx="160" cy="160" r="6" fill="#0a0d16"/>';
  o+='<g stroke="#0f0b04" stroke-width="1" opacity=".72" fill="#0f0b04">';
  for(let i=0;i<14;i++){ const a=(-90+i*(360/14))*Math.PI/180;
    const L=40+((i*37)%46);
    o+='<line x1="160" y1="160" x2="'+(160+Math.cos(a)*L).toFixed(1)+'" y2="'+(160+Math.sin(a)*L).toFixed(1)+'"/>';
    o+='<circle cx="'+(160+Math.cos(a)*(L+4)).toFixed(1)+'" cy="'+(160+Math.sin(a)*(L+4)).toFixed(1)+'" r="2.6" stroke="none"/>';
  }
  o+='<circle cx="160" cy="160" r="4.5"/>';
  o+='</g>';
  o+='<circle cx="160" cy="248" r="11" fill="none" stroke="#0f0b04" stroke-width="1.4" opacity=".7"/>';
  o+='<line x1="152" y1="256" x2="168" y2="240" stroke="#0f0b04" stroke-width="1.4" opacity=".7"/>';
  o+='</g>';
  o+='<text x="160" y="304" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8.5" letter-spacing="3" fill="#8a90a2">GOLDEN RECORD · 1977 · BOTH VOYAGERS</text>';
  svg.innerHTML=o;
}

