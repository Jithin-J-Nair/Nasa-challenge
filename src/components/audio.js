import { gsap } from 'gsap';
import { $ } from '../lib/dom.js';

/* ============================================================
   17. AUDIO
   ============================================================ */
let AC=null, masterGain=null, droneOn=false;
function audioInit(){
  if(AC) return;
  const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return;
  AC=new Ctx(); masterGain=AC.createGain(); masterGain.gain.value=0.0; masterGain.connect(AC.destination);
}
export function beep(freq=660,dur=.04,vol=.05){
  if(!AC||!droneOn) return;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type='sine'; o.frequency.value=freq;
  g.gain.setValueAtTime(0,AC.currentTime);
  g.gain.linearRampToValueAtTime(vol,AC.currentTime+.006);
  g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+dur);
  o.connect(g); g.connect(masterGain); o.start(); o.stop(AC.currentTime+dur+.02);
}
export function blip(){ if(!AC||!droneOn) return; if(Math.random()>.35) return; beep(1100+Math.random()*700,.014,.014); }
function startDrone(){
  if(!AC) return;
  [55,82.5,110.3].forEach((f,i)=>{
    const o=AC.createOscillator(),g=AC.createGain(),lfo=AC.createOscillator(),lg=AC.createGain();
    o.type=i===2?'triangle':'sine'; o.frequency.value=f;
    g.gain.value=i===2?.05:.11;
    lfo.frequency.value=.04+i*.021; lg.gain.value=.035;
    lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(masterGain); o.start(); lfo.start();
  });
  const bufSize=2*AC.sampleRate, nb=AC.createBuffer(1,bufSize,AC.sampleRate), d=nb.getChannelData(0);
  for(let i=0;i<bufSize;i++) d[i]=(Math.random()*2-1)*0.4;
  const src=AC.createBufferSource(); src.buffer=nb; src.loop=true;
  const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1400; bp.Q.value=.6;
  const ng=AC.createGain(); ng.gain.value=.012;
  src.connect(bp); bp.connect(ng); ng.connect(masterGain); src.start();
}
$('#soundBtn').addEventListener('click',()=>{
  audioInit(); if(!AC) return;
  if(AC.state==='suspended') AC.resume();
  droneOn=!droneOn;
  const b=$('#soundBtn'); b.classList.toggle('on',droneOn); b.setAttribute('aria-pressed',droneOn);
  gsap.to(masterGain.gain,{value:droneOn?.6:0,duration:1.2});
  if(droneOn) startDrone();
  if(droneOn) beep(880,.08,.06);
});

