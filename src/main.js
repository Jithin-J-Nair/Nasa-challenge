import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   0. UTILITIES
   ============================================================ */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const nf = n => n.toLocaleString('en-US');

/* ============================================================
   1. SCHEMATIC ART
   ============================================================ */
const S = (inner)=>`<svg class="schem" viewBox="0 0 240 160" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const SCHEM = {
lm: S(`<path d="M64 84 L86 62 L154 62 L176 84 L176 96 L154 116 L86 116 L64 96 Z" opacity=".95"/><path d="M74 74 H166 M70 84 H170 M72 96 H168 M78 106 H162"/><path d="M96 62 V44 M144 62 V44"/><circle cx="120" cy="34" r="7"/><path d="M113 34h14M120 27v14"/><path d="M86 62 L60 44 M154 62 L180 44"/><path d="M70 116 L44 142 M170 116 L196 142 M104 116 L96 144 M136 116 L144 144"/><ellipse cx="44" cy="143" rx="11" ry="3.4"/><ellipse cx="196" cy="143" rx="11" ry="3.4"/><ellipse cx="96" cy="145" rx="9" ry="3"/><ellipse cx="144" cy="145" rx="9" ry="3"/><path d="M108 116 L104 136 H136 L132 116"/><path d="M152 96 h22 v16 h-22" opacity=".7"/><path d="M28 148 H212" opacity=".3" stroke-dasharray="3 5"/>`),
rover: S(`<path d="M74 74 H166 V104 H74 Z"/><path d="M74 82 H166 M74 96 H166"/><path d="M112 74 V50 H132 V74"/><rect x="104" y="38" width="34" height="14" rx="2"/><circle cx="113" cy="45" r="3.4"/><circle cx="129" cy="45" r="3.4"/><path d="M120 74 V30 M114 30 H126"/><rect x="60" y="70" width="18" height="34" rx="1.5" opacity=".75"/><rect x="162" y="70" width="18" height="34" rx="1.5" opacity=".75"/><path d="M60 78 H48 M60 96 H48 M180 78 H192 M180 96 H192"/><path d="M84 104 L70 124 M84 104 L100 124 M156 104 L142 124 M156 104 L172 124"/><path d="M70 124 H100 M142 124 H172" opacity=".6"/><circle cx="70" cy="128" r="9"/><circle cx="100" cy="128" r="9"/><circle cx="142" cy="128" r="9"/><circle cx="172" cy="128" r="9"/><circle cx="70" cy="128" r="4" opacity=".5"/><circle cx="100" cy="128" r="4" opacity=".5"/><circle cx="142" cy="128" r="4" opacity=".5"/><circle cx="172" cy="128" r="4" opacity=".5"/><path d="M120 104 L126 122 L140 130" opacity=".8"/><path d="M30 146 H210" opacity=".3" stroke-dasharray="3 5"/>`),
lander3: S(`<path d="M86 60 H154 L170 96 H70 Z"/><path d="M96 60 L100 96 M120 60 V96 M144 60 L140 96" opacity=".5"/><path d="M120 60 V40"/><ellipse cx="120" cy="34" rx="18" ry="6"/><path d="M102 34 a18 10 0 0 0 36 0" opacity=".6"/><path d="M86 68 L46 56 V88 L86 84 M154 68 L194 56 V88 L154 84" opacity=".8"/><path d="M52 60 V84 M60 58 V85 M68 57 V85 M172 57 V85 M180 58 V85 M188 60 V84" opacity=".4"/><path d="M86 96 L58 132 M154 96 L182 132 M120 96 L120 136"/><ellipse cx="58" cy="134" rx="10" ry="3.2"/><ellipse cx="182" cy="134" rx="10" ry="3.2"/><ellipse cx="120" cy="138" rx="10" ry="3.2"/><path d="M96 96 L104 116 L124 122 L132 112" opacity=".85"/><rect x="128" y="106" width="12" height="9" rx="1.5" opacity=".8"/><path d="M30 146 H210" opacity=".3" stroke-dasharray="3 5"/>`),
retro: S(`<rect x="58" y="44" width="124" height="76" rx="2"/><path d="M58 63 H182 M58 82 H182 M58 101 H182 M89 44 V120 M120 44 V120 M151 44 V120" opacity=".45"/>${(()=>{let o='';for(let r=0;r<4;r++)for(let c=0;c<4;c++){const x=73.5+c*31,y=53.5+r*19;o+=`<circle cx="${x}" cy="${y}" r="7.2" opacity=".8"/><path d="M${x-5} ${y-2.5} L${x} ${y+4} L${x+5} ${y-2.5}" opacity=".55"/>`;}return o})()}<path d="M120 120 V140" /><rect x="94" y="140" width="52" height="6" rx="1"/><path d="M212 20 L150 62" stroke="#ff9d3d" stroke-width="1.6" opacity=".9" stroke-dasharray="5 4"/><path d="M150 62 L206 26" stroke="#ff9d3d" stroke-width="1.1" opacity=".6" stroke-dasharray="4 5"/><circle cx="214" cy="18" r="4" fill="#ff9d3d" stroke="none" opacity=".85"/><text x="200" y="12" font-family="IBM Plex Mono, monospace" font-size="7" fill="#ff9d3d" stroke="none" opacity=".8">LASER</text>`),
voyager: S(`<path d="M104 44 a44 44 0 0 1 62 0 L152 74 H118 Z"/><path d="M104 44 L166 74 M166 44 L104 74" opacity=".35"/><ellipse cx="135" cy="46" rx="31" ry="8" opacity=".7"/><path d="M135 74 V88"/><path d="M112 88 L104 118 H166 L158 88 Z"/><path d="M110 96 H160 M108 106 H162" opacity=".45"/><path d="M135 118 V138"/><rect x="118" y="138" width="34" height="8" rx="1"/><path d="M104 98 L46 82 M46 82 L38 96 M46 82 L54 96" opacity=".85"/><rect x="26" y="72" width="22" height="20" rx="2"/><path d="M26 78 H48 M26 86 H48" opacity=".5"/><path d="M166 98 L214 108 M214 108 L222 96" opacity=".85"/><circle cx="222" cy="94" r="6" opacity=".7"/><path d="M135 88 L188 44" opacity=".6"/><circle cx="190" cy="42" r="4.5" opacity=".6"/><path d="M20 152 H220" opacity=".25" stroke-dasharray="3 5"/>`),
record: S(`<circle cx="120" cy="80" r="62"/><circle cx="120" cy="80" r="56" opacity=".35"/><circle cx="120" cy="80" r="8"/><g opacity=".85">${(()=>{let o='';for(let i=0;i<14;i++){const a=(-90+i*(360/14))*Math.PI/180;const x1=120+Math.cos(a)*13,y1=80+Math.sin(a)*13,x2=120+Math.cos(a)*34,y2=80+Math.sin(a)*34;o+=`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" opacity=".7"/><circle cx="${(120+Math.cos(a)*36).toFixed(1)}" cy="${(80+Math.sin(a)*36).toFixed(1)}" r="2.4" fill="currentColor" stroke="none"/>`;}return o})()}</g><circle cx="120" cy="80" r="38" opacity=".45"/><path d="M120 80 m-46 0 a46 46 0 0 1 92 0" opacity=".25"/><text x="120" y="152" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="6.5" fill="currentColor" stroke="none" opacity=".7">GOLDEN RECORD · 12-INCH GOLD-PHONOGRAPH</text>`),
heli: S(`<path d="M96 82 H144 V104 H96 Z"/><path d="M104 82 V66 H136 V82" opacity=".8"/><rect x="100" y="58" width="40" height="8" rx="1.5" opacity=".9"/><path d="M120 58 V38"/><path d="M28 34 H212" stroke-width="1.6"/><path d="M50 40 H190" stroke-width="1.6" opacity=".7"/><circle cx="120" cy="36" r="4"/><path d="M100 104 L86 130 M140 104 L154 130 M112 104 L108 132 M128 104 L132 132"/><path d="M74 130 H166" opacity=".45"/><ellipse cx="86" cy="131" rx="7" ry="2.4"/><ellipse cx="154" cy="131" rx="7" ry="2.4"/><ellipse cx="108" cy="133" rx="6" ry="2.2"/><ellipse cx="132" cy="133" rx="6" ry="2.2"/><path d="M144 90 L168 90 L172 82" opacity=".7"/><rect x="166" y="84" width="12" height="8" rx="1.5" opacity=".7"/><path d="M30 146 H210" opacity=".3" stroke-dasharray="3 5"/>`),
probe: S(`<path d="M96 40 a42 42 0 0 1 56 0 L138 66 H110 Z"/><ellipse cx="124" cy="42" rx="28" ry="7" opacity=".7"/><path d="M124 66 V82"/><rect x="102" y="82" width="44" height="38" rx="2"/><path d="M102 92 H146 M102 104 H146" opacity=".45"/><circle cx="124" cy="98" r="6" opacity=".6"/><path d="M102 96 L52 84 M146 96 L196 84" opacity=".85"/><rect x="34" y="74" width="20" height="20" rx="2"/><rect x="194" y="74" width="20" height="20" rx="2"/><path d="M34 80 H54 M34 88 H54 M194 80 H214 M194 88 H214" opacity=".5"/><path d="M124 120 V140"/><path d="M112 140 H136" opacity=".7"/><path d="M124 82 L176 56" opacity=".5"/><circle cx="178" cy="54" r="4" opacity=".5"/><path d="M28 150 H212" opacity=".25" stroke-dasharray="3 5"/>`),
orbiter: S(`<rect x="96" y="58" width="48" height="46" rx="2"/><path d="M96 70 H144 M96 84 H144" opacity=".45"/><path d="M120 58 V36"/><path d="M100 36 a20 20 0 0 1 40 0 L132 46 H108 Z"/><ellipse cx="120" cy="37" rx="20" ry="5" opacity=".7"/><path d="M96 74 H44 M144 74 H196" opacity=".85"/><rect x="16" y="60" width="28" height="30" rx="1.5"/><rect x="196" y="60" width="28" height="30" rx="1.5"/><path d="M25 60 V90 M35 60 V90 M205 60 V90 M215 60 V90" opacity=".4"/><path d="M16 68 H44 M16 82 H44 M196 68 H224 M196 82 H224" opacity=".4"/><path d="M108 104 L104 122 M120 104 V124 M132 104 L136 122" opacity=".7"/><circle cx="104" cy="126" r="4" opacity=".6"/><circle cx="120" cy="128" r="4" opacity=".6"/><circle cx="136" cy="126" r="4" opacity=".6"/><path d="M30 148 H210" opacity=".25" stroke-dasharray="3 5"/>`),
impactor: S(`<path d="M104 66 H136 V100 H104 Z"/><path d="M104 66 L120 48 L136 66" opacity=".8"/><path d="M104 78 H136" opacity=".45"/><path d="M104 80 L26 62 M136 80 L214 62" opacity=".85"/><rect x="8" y="52" width="20" height="42" rx="1.5"/><rect x="212" y="52" width="20" height="42" rx="1.5"/><path d="M14 52 V94 M21 52 V94 M219 52 V94 M226 52 V94" opacity=".4"/><path d="M120 100 V128" opacity=".9"/><path d="M108 128 H132 L120 146 Z" fill="currentColor" fill-opacity=".18"/><path d="M120 34 V16 M110 26 L120 16 L130 26" opacity=".6"/><path d="M40 150 H200" opacity=".25" stroke-dasharray="3 5"/>`),
statue: S(`<path d="M120 46 a10 10 0 1 1 0.01 0" opacity=".9"/><path d="M110 58 H130 L134 96 H106 Z" opacity=".9"/><path d="M110 62 L92 88 M130 62 L148 88" opacity=".85"/><path d="M108 96 L104 132 M132 96 L136 132" opacity=".85"/><path d="M98 132 H112 M128 132 H142" opacity=".8"/><ellipse cx="120" cy="140" rx="52" ry="7" opacity=".35"/><path d="M70 140 H170" opacity=".2" stroke-dasharray="2 5"/><text x="120" y="26" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="6.5" fill="currentColor" stroke="none" opacity=".65">8.5 CM · ALUMINIUM</text>`),
tubes: S(`${(()=>{let o='';for(let i=0;i<7;i++){const x=52+i*23;o+=`<rect x="${x}" y="72" width="15" height="46" rx="7.5"/><path d="M${x} 88 H${x+15}" opacity=".5"/><path d="M${x+3} 96 H${x+12}" opacity=".35"/>`;}return o})()}<path d="M22 118 H218" stroke-width="1.4"/><path d="M28 124 q14 -8 28 0 t28 0 t28 0 t28 0 t28 0 t28 0" opacity=".45"/><path d="M22 132 H218" opacity=".25" stroke-dasharray="3 5"/><text x="120" y="52" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="7" fill="currentColor" stroke="none" opacity=".7">TITANIUM · 15 G SAMPLE CAPACITY</text>`),
lunokhod: S(`<path d="M70 78 H170 L178 112 H62 Z"/><path d="M70 78 L86 34 H154 L170 78" opacity=".85"/><path d="M92 44 H148 M90 54 H150 M88 64 H152" opacity=".4"/><path d="M120 78 V112" opacity=".45"/><path d="M74 112 L58 134 M100 112 L92 136 M140 112 L148 136 M166 112 L182 134" opacity=".8"/><circle cx="58" cy="138" r="8"/><circle cx="92" cy="140" r="8"/><circle cx="148" cy="140" r="8"/><circle cx="182" cy="138" r="8"/><circle cx="58" cy="138" r="3.4" opacity=".5"/><circle cx="92" cy="140" r="3.4" opacity=".5"/><circle cx="148" cy="140" r="3.4" opacity=".5"/><circle cx="182" cy="138" r="3.4" opacity=".5"/><path d="M120 34 V22"/><path d="M110 22 H130" opacity=".8"/><circle cx="120" cy="18" r="4" opacity=".7"/><path d="M172 96 H196 V112" opacity=".7"/><circle cx="196" cy="115" r="4" opacity=".7"/><path d="M26 152 H214" opacity=".25" stroke-dasharray="3 5"/>`),
surveyor: S(`<path d="M96 74 H144 L152 104 H88 Z"/><path d="M96 84 H144 M92 94 H148" opacity=".45"/><path d="M120 74 V44"/><rect x="106" y="30" width="28" height="16" rx="2"/><circle cx="120" cy="38" r="6"/><circle cx="120" cy="38" r="2.4" opacity=".6"/><path d="M106 38 L58 26 M58 26 L52 40 M58 26 L64 40" opacity=".8"/><rect x="30" y="16" width="28" height="26" rx="1.5"/><path d="M39 16 V42 M49 16 V42" opacity=".4"/><path d="M134 38 L186 26 M186 26 L192 40 M186 26 L180 40" opacity=".8"/><rect x="182" y="16" width="28" height="26" rx="1.5"/><path d="M191 16 V42 M201 16 V42" opacity=".4"/><path d="M96 104 L68 140 M144 104 L172 140 M120 104 L120 144" opacity=".85"/><ellipse cx="68" cy="142" rx="10" ry="3.2"/><ellipse cx="172" cy="142" rx="10" ry="3.2"/><ellipse cx="120" cy="146" rx="10" ry="3.2"/><path d="M112 104 L104 124 L84 130" opacity=".75"/><path d="M30 152 H210" opacity=".25" stroke-dasharray="3 5"/>`),
nova: S(`<path d="M100 42 H140 L156 76 H84 Z"/><path d="M100 54 H140 M96 66 H144" opacity=".4"/><rect x="94" y="76" width="52" height="52" rx="2"/><path d="M94 90 H146 M94 104 H146 M94 118 H146" opacity=".35"/><path d="M120 42 V26"/><ellipse cx="120" cy="22" rx="14" ry="5" opacity=".8"/><path d="M100 128 L74 148 M140 128 L166 148 M112 128 L104 152 M128 128 L136 152" opacity=".85"/><ellipse cx="74" cy="150" rx="9" ry="3"/><ellipse cx="166" cy="150" rx="9" ry="3"/><path d="M156 88 L188 82 V104 L156 100" opacity=".7"/><path d="M84 88 L52 82 V104 L84 100" opacity=".7"/><path d="M30 156 H210" opacity=".25" stroke-dasharray="3 5"/>`),
disc: S(`<circle cx="120" cy="78" r="46"/><circle cx="120" cy="78" r="40" opacity=".35"/><rect x="98" y="58" width="44" height="40" rx="2" opacity=".8"/><path d="M104 66 H136 M104 74 H136 M104 82 H136 M104 90 H128" opacity=".5"/><circle cx="120" cy="78" r="6" opacity=".7"/><path d="M60 128 L180 128" opacity=".5"/><path d="M74 134 H166" opacity=".25" stroke-dasharray="3 4"/><text x="120" y="150" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="6.5" fill="currentColor" stroke="none" opacity=".7">3.8 CM SILICON · 73 HEADS OF STATE</text>`),
orbiterMars: S(`<rect x="98" y="62" width="44" height="40" rx="2"/><path d="M98 74 H142 M98 88 H142" opacity=".4"/><path d="M120 62 V42"/><path d="M102 42 a18 18 0 0 1 36 0 L132 52 H108 Z"/><ellipse cx="120" cy="43" rx="18" ry="5" opacity=".7"/><path d="M98 82 H52 M142 82 H188" opacity=".85"/><rect x="24" y="68" width="28" height="28" rx="1.5"/><rect x="188" y="68" width="28" height="28" rx="1.5"/><path d="M33 68 V96 M43 68 V96 M197 68 V96 M207 68 V96" opacity=".4"/><path d="M112 102 L108 124 M128 102 L132 124" opacity=".6"/><ellipse cx="120" cy="132" rx="58" ry="9" opacity=".3" stroke-dasharray="4 4"/><path d="M30 150 H210" opacity=".22" stroke-dasharray="3 5"/>`)
};

const ICO = {
golf:`<svg viewBox="0 0 48 48"><circle cx="18" cy="30" r="8"/><path d="M18 22v-14h16l-4 5 4 5H18"/><circle cx="34" cy="36" r="5"/></svg>`,
hammer:`<svg viewBox="0 0 48 48"><path d="M8 40L26 22"/><rect x="24" y="10" width="18" height="10" rx="2" transform="rotate(45 33 15)"/><path d="M34 6c6 2 8 8 6 12" stroke-dasharray="2 3"/></svg>`,
disc:`<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="4"/><path d="M24 8v32M8 24h32" opacity=".35"/></svg>`,
branch:`<svg viewBox="0 0 48 48"><path d="M8 40C20 36 28 28 34 14"/><path d="M34 14c-6 1-9 4-10 9M34 14c-1 6 2 9 7 10M22 27c-4 0-6-3-6-7M22 27c1 4 4 6 8 6"/></svg>`,
photo:`<svg viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="24" rx="2"/><circle cx="20" cy="22" r="4"/><path d="M12 34l8-8 6 6 4-4 6 6"/></svg>`,
statue:`<svg viewBox="0 0 48 48"><circle cx="24" cy="12" r="5"/><path d="M18 20h12l3 16H15z"/><path d="M18 22l-7 10M30 22l7 10"/><path d="M20 36l-2 8M28 36l2 8"/></svg>`,
feather:`<svg viewBox="0 0 48 48"><path d="M36 8c-14 0-24 10-24 22l-4 10 10-4c12 0 22-10 22-24z"/><path d="M14 36L32 14" opacity=".5"/></svg>`,
bag:`<svg viewBox="0 0 48 48"><path d="M14 16h20l-3 22H17z"/><path d="M18 16v-4a6 6 0 0112 0v4"/><path d="M17 24h14" opacity=".4"/></svg>`,
boot:`<svg viewBox="0 0 48 48"><path d="M16 8h10v18l10 6v8H16z"/><path d="M16 34h10M20 40h12" opacity=".4"/></svg>`,
plaque:`<svg viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="24" rx="2"/><path d="M14 20h20M14 26h20M14 32h12" opacity=".5"/></svg>`,
flag:`<svg viewBox="0 0 48 48"><path d="M14 6v36"/><path d="M14 10h22l-5 7 5 7H14z" opacity=".8"/></svg>`,
pennant:`<svg viewBox="0 0 48 48"><path d="M24 6l14 14-14 22L10 20z"/><circle cx="24" cy="22" r="5" opacity=".6"/></svg>`
};

/* ============================================================
   2. THE ARCHIVE  (42 artefacts)
   ============================================================ */
const A = [
{id:'luna2',n:'Luna 2',m:'Luna programme',ag:'USSR',b:'moon',y:1959,st:'destroyed',lat:29.1,lon:0.0,site:'Palus Putredinis, near Aristides',sch:'probe',one:'The first human-made object ever to reach another world. It did not land — it hit.',spec:[['Arrived','13 Sep 1959, 21:02 UTC'],['Fate','Deliberate impact at 3.3 km/s'],['Mass','390 kg'],['Instruments','Scintillation, Cherenkov & ion detectors'],['Survived','~34 minutes of data after impact']],voice:'I was built to be destroyed. That was the entire plan — a 390-kilogram sphere stuffed with instruments, aimed at a moving target 384,000 kilometres away, with 1959 guidance. I missed my first correction burn and the whole world assumed the mission was over. Then I hit the Moon within two kilometres of aim point, and I told everyone on the way down that the Moon has no magnetic field worth speaking of and no radiation belt at all. That single negative result is the reason anyone thought landing there was survivable.',disc:['No detectable lunar magnetic field — critical for planning crewed landings.','No radiation belt around the Moon, unlike Earth.','Direct measurement of solar-wind ion density in interplanetary space.','Carried pentagonal steel pennants that scattered on impact — the first human artefacts on another world.'],last:'IMPACT CONFIRMED · 21:02:24 UTC · 13 SEP 1959\nRadio tracking stations at Jodrell Bank, UK recorded the signal cutting out.\nNo further transmission.',tags:'First object to reach another celestial body'},
{id:'surveyor3',n:'Surveyor 3',m:'Surveyor programme',ag:'NASA',b:'moon',y:1967,st:'derelict',lat:-2.94,lon:-23.34,site:'Ocean of Storms',sch:'surveyor',one:'The first American soft landing on the Moon — and the only spacecraft in history to be visited by humans on another world.',spec:[['Landed','20 Apr 1967'],['Status','Derelict · partially dismantled'],['Mass','281 kg at landing'],['Images','6,315 television frames'],['Special','First spacecraft to dig into another world']],voice:'My surface sampler scooped a trench in the regolith and reported back that the soil behaved like damp sand — cohesive, load-bearing, safe to walk on. Two and a half years later I heard boots. Alan Bean and Pete Conrad walked 155 metres from me, the closest any human has ever come to another machine on another world. They photographed me, then took my camera, my cable samples and my soil scoop home. Back on Earth, researchers found a Streptococcus bacterium sealed inside my camera housing. Whether it hitched a ride from the assembly clean room or survived thirty-one months in vacuum and 120 °C swings is still argued. Either answer is extraordinary.',disc:['Soil mechanics: lunar regolith is cohesive and can bear a crewed lander.','Thermal behaviour of real Moon dust, measured across a full lunar night.','Proved the accuracy needed for Apollo — Surveyor 3 became the target for Apollo 12.','Biological question: terrestrial microbes may survive years exposed on the lunar surface.'],last:'LAST FRAME · 6,315\nTelevision camera powered down 1 May 1967 after the first lunar night.\nVisited by Apollo 12 crew · 20 Nov 1969',tags:'First US soft landing · visited by Apollo 12'},
{id:'eagle',n:'Eagle — descent stage',m:'Apollo 11',ag:'NASA',b:'moon',y:1969,st:'derelict',lat:0.6741,lon:23.4730,site:'Sea of Tranquility',sch:'lm',feat:true,one:'The landing platform for the first crewed Moon landing. Its ascent stage left; its bottom half never moved again.',spec:[['Landed','20 Jul 1969, 20:17:40 UTC'],['Site','0.6741° N, 23.4730° E'],['Mass at touchdown','~2,034 kg'],['Fuel remaining','~20 seconds of hover'],['Plaque','“Here men from the planet Earth first set foot upon the Moon”']],voice:'Twenty seconds of fuel. That is what was left in my tanks when the contact light came on. Neil had flown me past a boulder field the computer did not like and set me down in a place nobody had chosen. Then the crew climbed a ladder, walked for two and a half hours, planted a seismometer and a mirror, and climbed back inside. My ascent stage burned and left. I stayed. Fifty-seven years of micrometeorite impacts, solar ultraviolet and 250 °C temperature swings have not moved me a centimetre. My mirror still answers when Earth calls.',disc:['Confirmed the lunar surface can support a crewed lander and heavy foot traffic.','Passive Seismic Experiment recorded 22 high-frequency meteoroid impacts in three weeks before failing.','First direct measurement of the Moon’s regolith strength and thermal behaviour under a landing engine.','Returned 21.5 kg of samples including 4.6-billion-year-old anorthosite — evidence of a global magma ocean.'],last:'EASEP · PSE TELEMETRY LOST · 27 AUG 1969 05:15 UTC\nSolar array degraded after the first lunar night.\nLaser Ranging Retroreflector: STILL IN SERVICE',tags:'First crewed landing site'},
{id:'intrepid',n:'Intrepid — descent stage',m:'Apollo 12',ag:'NASA',b:'moon',y:1969,st:'derelict',lat:-3.012,lon:-23.421,site:'Ocean of Storms',sch:'lm',one:'A precision landing 155 metres from a robot that had been waiting for two years.',spec:[['Landed','19 Nov 1969'],['Site','3.012° S, 23.421° W'],['Distance to Surveyor 3','155 m'],['Power','SNAP-27 radioisotope generator — first RTG on the Moon'],['Ascent stage','Deliberately crashed 20 Nov 1969']],voice:'Apollo 11 proved we could land. I proved we could land where we meant to — within 163 metres of a target, on rough ground, in blinding morning sun. Then we did something nobody had planned for: we crashed my own ascent stage back into the Moon at 1.7 kilometres per second, on purpose, to give Apollo 11’s seismometer a known impact to measure against. The Moon rang for fifty-five minutes. That ringing is how we learned the lunar interior is fractured, dry and nothing like Earth’s.',disc:['Precision landing capability — the foundation for every mission after it.','The artificial impact made the Moon “ring like a bell” for 55 minutes, revealing a highly fractured, dry interior.','First ALSEP powered by a radioisotope generator, running experiments for years instead of days.','Surveyor 3 hardware returned for materials analysis after 31 months of exposure.'],last:'ALSEP TERMINATED · 30 SEP 1977\nAll Apollo surface stations shut down on the same day to save money.\nDescent stage: intact, upright, still there.',tags:'First precision landing'},
{id:'antares',n:'Antares — descent stage',m:'Apollo 14',ag:'NASA',b:'moon',y:1971,st:'derelict',lat:-3.645,lon:-17.479,site:'Fra Mauro highlands',sch:'lm',one:'The mission that was almost cancelled, landing at the site Apollo 13 was meant to reach.',spec:[['Landed','5 Feb 1971'],['Site','3.645° S, 17.479° W'],['EVA time','9 h 21 m'],['Driven (MET)','3.3 km on the first hand-pulled cart'],['Payload','Active Seismic Experiment, magnetometer, suprathermal ion detector']],voice:'They gave me the Fra Mauro highlands — the ejecta blanket from the Imbrium impact, a window into the Moon’s deep crust that Apollo 13 never got to open. Alan Shepard was forty-seven years old and had been grounded by an inner-ear condition he fixed with surgery he never told NASA about. He hauled equipment uphill on a two-wheled cart, deployed an explosive-thumper seismic line, and then, on camera, dropped a golf ball and swung a sample-collection handle at it. He said it went “miles and miles.” In one-sixth gravity, in a pressure suit, one-handed. It is still out there somewhere.',disc:['Fra Mauro samples dated the Imbrium basin to ~3.9 billion years, anchoring the lunar cratering timeline.','First magnetometer on the lunar surface: the Moon has no global magnetic field today, but rocks proved it once did.','Active Seismic Experiment measured regolith to depths of ~100 m using thumper charges.','Detected the Apollo 13 S-IVB impact with the Apollo 12 seismometers — a 4,000 kg hammer blow recorded across 178 km.'],last:'ALSEP TERMINATED · 30 SEP 1977\nDescent stage and ALSEP station intact.\nTwo golf balls: location unknown.',tags:'First hand cart · the golf swing'},
{id:'falcon',n:'Falcon descent stage & LRV-1',m:'Apollo 15',ag:'NASA',b:'moon',y:1971,st:'derelict',lat:26.13,lon:3.66,site:'Hadley–Apennine',sch:'lm',feat:true,one:'The first lunar rover, parked at the edge of a 1.5-kilometre-deep canyon, next to a statue nobody announced.',spec:[['Landed','30 Jul 1971'],['Site','26.13° N, 3.66° E'],['LRV distance','27.9 km over 3 EVAs'],['LRV top speed','13.0 km/h'],['Still there','Descent stage, LRV-1, ALSEP, the Fallen Astronaut']],voice:'Apollo 15 was the first mission designed by scientists for scientists, and I was parked at the meeting point of a mountain range and a canyon older than complex life on Earth. Dave Scott drove me 27.9 kilometres, faster than a man could ever walk, and we came home with the Genesis Rock — a 4.1-billion-year-old piece of the Moon’s original crust. Then, on the last drive, Scott did something on camera for the students watching: he held a falcon feather and a geologist’s hammer and dropped them together. In vacuum they hit the dust at exactly the same instant. Galileo was right, and he was right on the Moon.',disc:['Genesis Rock (anorthosite) dated to ~4.1 billion years — evidence of the primordial lunar crust.','First heat-flow measurement of the Moon, bored 2.5 m into the regolith.','Lunar surface magnetometer: no present-day global field, but remnant magnetism in rocks.','Volcanic glass beads found at the Apennine Front — the Moon had explosive eruptions.','The rover extended crew range by a factor of ten and defined every exploration strategy since.'],last:'ALSEP TERMINATED · 30 SEP 1977\nLRV-1 parked 110 m east of the descent stage.\nThe Fallen Astronaut remains in place, facing the track.',tags:'First lunar rover · the feather and the hammer'},
{id:'orion',n:'Orion descent stage & LRV-2',m:'Apollo 16',ag:'NASA',b:'moon',y:1972,st:'derelict',lat:-8.973,lon:15.506,site:'Descartes Highlands',sch:'lm',one:'Sent to find volcanoes. Found the opposite — and repaired itself with tape.',spec:[['Landed','21 Apr 1972'],['Site','8.973° S, 15.506° E'],['LRV distance','26.6 km'],['Fender','Repaired with tape and a laminated map'],['Instrument','Far-ultraviolet camera/spectrograph']],voice:'The whole mission was built on a hypothesis: the Descartes Highlands were volcanic highlands, the only place we could sample that kind of terrain. On the first EVA John Young looked at the rock and said it was not volcanic at all. The hypothesis died in an afternoon — and that is exactly what field science is for. What we brought back instead was impact melt, proof that the highlands were built by bombardment, not by lava. Meanwhile a bolt sheared off my rear fender extension on the first drive and lunar dust — abrasive as ground glass — started spraying the crew. They fixed it with grey tape, four hinges from a map case, and a laminated geology chart. That fender repair is still attached to me.',disc:['Disproved the volcanic-highlands hypothesis: the Descartes terrain is impact melt.','First far-ultraviolet images of Earth’s geocorona, taken from the Moon — a hydrogen halo 100,000 km wide.','Far-field magnetometer measured the Moon’s weak induced field as it passed through Earth’s magnetotail.','Highest-speed LRV drive of any Apollo mission: 17.1 km/h.'],last:'ALSEP TERMINATED · 30 SEP 1977\nThe taped fender and laminated map are still on LRV-2.',tags:'A hypothesis killed in one afternoon'},
{id:'challenger',n:'Challenger descent stage & LRV-3',m:'Apollo 17',ag:'NASA',b:'moon',y:1972,st:'derelict',lat:20.19,lon:30.77,site:'Taurus–Littrow valley',sch:'lm',feat:true,one:'The last humans on the Moon, so far. They dug into orange soil and left a valley full of machines.',spec:[['Landed','11 Dec 1972'],['Site','20.19° N, 30.77° E'],['LRV distance','35.7 km — the record'],['Crew on surface','3 days, 3 hours'],['Departed','14 Dec 1972, 22:54 UTC']],voice:'Three days in a valley between two mountains, with a geologist — Jack Schmitt — who could read rock the way a pilot reads sky. At Shorty Crater he knelt in the dirt and called out over the loop: “It’s orange!” Volcanic glass beads, 3.64 billion years old, erupted as a fire fountain and frozen in place. My rover went 35.7 kilometres, farther than any Apollo vehicle. We left a heat-flow probe, a meteorite detector, a gravimeter, a magnetometer and a US flag. Gene Cernan knelt in the dust outside the hatch and wrote his daughter’s initials with the tip of his finger. Then he climbed the ladder and said the last words any human has said on another world.',disc:['Orange soil: titanium-rich volcanic glass beads, 3.64 billion years old — proof of explosive fire-fountain eruptions.','Oldest and youngest lunar samples ever returned, bracketing the cratering history of the Taurus–Littrow region.','Lunar Ejecta And Meteorites detector recorded micrometeoroid flux directly.','Longest crewed surface stay: 75 hours, including a 7-hour EVA in a valley — the most productive field day in planetary science.'],last:'ALSEP TERMINATED · 30 SEP 1977\nLast human bootprint on the Moon: 14 Dec 1972.\nNothing has disturbed it since.',tags:'Last crewed lunar mission · orange soil'},
{id:'lunokhod1',n:'Lunokhod 1',m:'Luna 17',ag:'USSR',b:'moon',y:1970,st:'silent',lat:38.24,lon:-35.0,site:'Sea of Rains (Mare Imbrium)',sch:'lunokhod',feat:true,one:'The first remote-controlled rover on another world — driven from a room on Earth, eight seconds in the past.',spec:[['Landed','17 Nov 1970'],['Site','38.24° N, 35.00° W'],['Mass','756 kg'],['Driven','10.54 km in 301 days'],['Images','20,000+ TV frames, 206 panoramas'],['Sealed','14 Sep 1971']],voice:'Five men took turns driving me, working in shifts, sitting in a mock-up cabin in Crimea with a steering wheel, three pedals and a two-second video delay. Each command I received was eight seconds old. Each confirmation took eight seconds to return. We did not have a joystick and a screen — we had patience. I crossed 10.5 kilometres of the Sea of Rains, ran 500 soil tests and took 20,000 pictures before the cold killed my pressure seal and the helium leaked out of my thermal system. For 38 years nobody could find my laser mirror. In 2010 NASA’s Lunar Reconnaissance Orbiter photographed me, and a French team fired a laser at my coordinates. I answered. I had been waiting, quietly, for four decades.',disc:['First rover on another world — remote-controlled across 384,000 km with no GPS and 8-second latency.','Mapped 80,000 m² of the Sea of Rains and measured regolith mechanical properties along the traverse.','X-ray fluorescence spectrometer made the first in-situ chemical analysis of lunar soil from a moving vehicle.','Laser retroreflector relocated in 2010 and returned to service — still ranging today.'],last:'SEALED · 14 SEP 1971 · ANNOUNCED 4 OCT 1971\nLaser retroreflector: REACTIVATED 2010\nReturn signal received from 38.325°N 35.000°W',tags:'First robotic rover · laser mirror reactivated in 2010'},
{id:'lunokhod2',n:'Lunokhod 2',m:'Luna 21',ag:'USSR',b:'moon',y:1973,st:'silent',lat:25.47,lon:30.54,site:'Le Monnier crater',sch:'lunokhod',one:'Drove further in five months than anything before it — and died because its own lid scooped up dust.',spec:[['Landed','15 Jan 1973'],['Site','25.47° N, 30.54° E'],['Driven','~39 km in under 5 months'],['Record held','42 years — until Opportunity'],['Last signal','May 1973']],voice:'I was faster, lighter and more ambitious than my predecessor. In four lunar months I covered about 39 kilometres — a distance no vehicle on another world would beat until Opportunity rolled across Meridiani Planum in 2004, thirty-one years later. I drove at night, using the Sun and the Earth for navigation. And I was killed by the thing I was studying: driving into a soft crater, my open solar-panel lid scooped regolith onto the radiators I used to dump heat. When I closed the lid that evening, I buried myself in insulation. My internal temperature climbed and I stopped answering.',disc:['Held the off-world driving record for 42 years (~39 km).','First rover to operate during the lunar night using celestial navigation.','Measured the Moon’s magnetic field and surface magnetic anomalies along the traverse.','Demonstrated the operational hazard that would later define rover design: dust management.'],last:'LAST TELEMETRY · MAY 1973\nCause of loss: regolith on radiator panels → thermal runaway.\nLaser retroreflector: STILL RANGING',tags:'Held the driving record for 42 years'},
{id:'fallen',n:'The Fallen Astronaut',m:'Apollo 15',ag:'NASA',b:'moon',y:1971,st:'derelict',lat:26.13,lon:3.63,site:'Hadley–Apennine, near the LRV parking spot',sch:'statue',feat:true,one:'The only artwork on another world. Eight and a half centimetres tall, laid face down, unsigned.',spec:[['Placed','1 Aug 1971, ~08:00 UTC'],['Artist','Paul Van Hoeydonck (Belgium)'],['Material','Aluminium, 8.5 cm tall'],['Plaque','14 names of astronauts and cosmonauts'],['Commemorates','8 American astronauts, 6 Soviet cosmonauts']],voice:'They laid me down between two rover tracks and covered me with dust so the Sun would not glare. No ceremony, no camera, no announcement to Houston — David Scott did not want a media event around people who had died. Beside me is a plaque with fourteen names, American and Soviet alike, because at that point in the race we were all doing the same impossible thing. Then they drove away. A duplicate of me sits in the Smithsonian; the artist later tried to sell more casts and the crew objected. Out here none of that matters. There is no wind. My aluminium will not tarnish for a very long time.',disc:['Not science — memory. A record that the cost of the Apollo programme was counted in people.','The plaque names Gus Grissom, Ed White, Roger Chaffee, Vladimir Komarov, Yuri Gagarin and nine others, with no nationality ranking.','Demonstrates that cultural artefacts survive indefinitely on the airless Moon.'],last:'PLACED 1 AUG 1971 · NO TRANSMISSION\nImaged by Lunar Reconnaissance Orbiter.\nStill upright. Still face down.',tags:'The only artwork on another world'},
{id:'lrrr',n:'Lunar Laser Ranging retroreflectors',m:'Apollo 11/14/15 · Lunokhod 1/2',ag:'NASA / INTERCOSMOS',b:'moon',y:1969,st:'active',lat:0.6741,lon:23.4730,site:'Five sites across the near side',sch:'retro',feat:true,one:'The only Apollo experiments still running in 2026. They have no power, no electronics and no moving parts.',spec:[['Deployed','1969, 1971, 1971, 1970, 1973'],['Arrays','5 (Apollo 11: 100 cubes · Apollo 14: 100 · Apollo 15: 300 · Lunokhod 1: 200 · Lunokhod 2: 144)'],['Material','Fused-silica corner cubes'],['Power draw','Zero'],['Still returning photons','Yes — daily']],voice:'I am not a machine. I am a block of glass cut so that any photon entering me comes straight back out. Fire a laser from a telescope on Earth and a handful of photons out of ten to the power of seventeen will return 2.5 seconds later. Time the round trip to a few hundred picoseconds and you know the distance to the Moon to within a couple of centimetres. We have been doing this since 1969. There is nothing to switch off, nothing to run out, no software to patch. We are the longest continuously operating experiment on another world.',disc:['The Moon is receding from Earth at 3.8 cm per year, driven by tidal friction.','Earth’s rotation is lengthening by ~2.4 milliseconds per century.','The Moon has a small, partly molten iron core — detected through tidal dissipation.','General relativity tested to parts in 10¹³ via the strong equivalence principle.','Lunar reference frame and libration measured to centimetre precision.'],last:'LATEST RETURN · ONGOING\nObservatories: Apache Point, McDonald, Grasse, Wettzell, Haleakalā.\nApollo 15 array: strongest return. Lunokhod 1: recovered 2010.',tags:'Still doing science · zero power'},
{id:'odysseus',n:'Odysseus (IM-1)',m:'CLPS / Intuitive Machines Nova-C',ag:'NASA / commercial',b:'moon',y:2024,st:'derelict',lat:-80.13,lon:1.09,site:'Malapert A crater, lunar south pole',sch:'nova',feat:true,one:'The first American soft landing on the Moon in 52 years — achieved on its side.',spec:[['Landed','22 Feb 2024, 23:24 UTC'],['Site','80.13° S, 1.09° E'],['First US landing since','Apollo 17, 1972'],['Fate','Tipped ~30° onto its side'],['Operated','7 days on solar power · ceased 28 Feb 2024']],voice:'I was built by a company, not an agency, and I was launched five days before I landed. Coming down over the lunar south pole my navigation laser failed to unlock — a safety pin left in during ground testing — so I flew the last descent on an experimental NASA laser instrument that had never been tested in space, with an inertial-only solution. I touched down hard, at 5 m/s instead of 1.5, one leg collapsed, and I fell over. Then I did the job anyway: I ran NASA payloads for seven days from a 30-degree tilt, imaged my own landing plume, measured the surface temperature and beamed data until the Sun set over the pole and my batteries could not survive the night.',disc:['First soft landing near the lunar south pole — the region targeted for Artemis because of its water ice.','SCALPSS cameras captured the plume–surface interaction of a lander touching down in permanently shadowed terrain, informing future site selection.','A NASA Laser Retroreflector Array was deployed — passive, and available for future ranging.','A hard lesson: two NASA payloads could not operate. MSOLO’s sampling port was blocked by a thermal blanket and the PRIME-1 drill never deployed.'],last:'FINAL DOWNLINK · 28 FEB 2024\nBattery voltage below operating threshold as the polar night began.\nOdysseus remains at Malapert A, on its side.',tags:'First US soft landing in 52 years'},
{id:'mariner9',n:'Mariner 9',m:'Mariner programme',ag:'NASA',b:'mars',y:1971,st:'derelict',lat:-32.0,lon:0.0,site:'Heliocentric parking orbit · still circling Mars',sch:'orbiterMars',feat:true,one:'The first spacecraft ever to orbit another planet. It arrived during a global dust storm — and waited.',spec:[['Orbit insertion','14 Nov 1971'],['Images','7,329 covering 85% of the surface'],['Resolution','1–2 km per pixel'],['Silent since','27 Oct 1972 (attitude gas exhausted)'],['Orbit','~1,500 km · expected impact ~2034']],voice:'I arrived at Mars on 14 November 1971 to find a planet completely blanketed in dust. A storm the size of the world had swallowed every feature. Mission planners could have given up. Instead they turned off my camera, put me in a holding pattern, and waited sixty-nine days for the sky to clear. When it did, I looked at a world nobody had ever seen: a canyon system 4,000 kilometres long, a volcano three times the height of Everest, layered polar caps and dry river valleys branching across the southern highlands. In one year I redrew the map of a planet.',disc:['Discovered Valles Marineris — a 4,000 km canyon system that would stretch across the United States.','Discovered Olympus Mons, the largest volcano in the solar system at 22 km high.','Mapped 85% of the Martian surface and found ancient branching valley networks — evidence of flowing water.','Observed the layered polar deposits and the first detailed view of Phobos and Deimos.','Proved the value of patience: waiting out a dust storm became standard Mars mission planning.'],last:'LAST TRANSMISSION · 27 OCT 1972\nNitrogen attitude-control gas exhausted.\nMariner 9 remains in orbit as a derelict · predicted impact ~2034',tags:'First orbiter of another planet'},
{id:'mars3',n:'Mars 3 lander',m:'Mars programme',ag:'USSR',b:'mars',y:1971,st:'lost',lat:-44.9,lon:-158.1,site:'Phaethontis region',sch:'lander3',one:'The first soft landing on Mars. It transmitted for fourteen and a half seconds.',spec:[['Landed','2 Dec 1971'],['Transmitted','14.5 seconds — one partial image'],['Cause of loss','Planet-encircling dust storm (probable)'],['Found again','Imaged by NASA’s MRO, 2013'],['Also on site','Parachute, heat shield, retrorockets']],voice:'I came down through a dust storm that had been raging across the entire planet for months. My parachute deployed, my engines fired, I settled onto the surface, and I began sending the first television picture ever taken from the ground of Mars. I managed about one-fifth of a frame before I stopped. Forty-two years later an American orbiter flying overhead found my parachute, my heat shield and my landing platform sitting in the dust exactly where they fell. Citizen scientists on the internet spotted them first.',disc:['First successful soft landing on the surface of Mars.','Returned a partial image before signal loss — the first ground-level data ever received from another planet.','Its wreckage, identified in 2013, gave the first complete forensic view of an entry-descent-landing sequence from orbit.','Demonstrated that global dust storms are a first-order hazard for Mars landing windows.'],last:'SIGNAL LOST · 2 DEC 1971 · 14.5 SECONDS AFTER TOUCHDOWN\nWreckage field located by Mars Reconnaissance Orbiter, 2013.',tags:'First soft landing on Mars · 14.5 seconds'},
{id:'viking1',n:'Viking 1 lander “Mutch Station”',m:'Viking',ag:'NASA',b:'mars',y:1976,st:'derelict',lat:22.480,lon:-49.967,site:'Chryse Planitia',sch:'lander3',feat:true,one:'Six years on the surface of Mars, and one experiment we are still arguing about.',spec:[['Landed','20 Jul 1976'],['Operated','2,307 sols · until 11 Nov 1982'],['Images','2,245'],['Life experiments','Labeled Release, Pyrolytic Release, Gas Exchange'],['Renamed','Mutch Memorial Station, 1982']],voice:'I landed in America’s bicentennial year and worked for six. Three of my biology experiments looked for metabolism in Martian soil. Two said no. One — the Labeled Release — said yes: I fed nutrients to a soil sample and something in it released radioactive gas, exactly the way bacteria do. Then the control was sterilised and the response vanished. A fourth instrument, a gas chromatograph, found no organic molecules at all, which made the biology result hard to explain. Three decades later Phoenix discovered perchlorate in the soil — an oxidant that destroys organics when heated, and that would also produce the gas my Labeled Release experiment detected. The argument has never been closed.',disc:['Labeled Release returned a positive, contested metabolism-like signal — the closest thing to a life detection on Mars we have.','Gas chromatograph–mass spectrometer found no organic molecules above ~1 ppb at the surface.','Six years of continuous weather data: temperatures from −89 °C to −13 °C, pressure 7–9 millibars.','First images of Martian frost, dust devils, wind erosion and rock chemistry from the surface.'],last:'LAST CONTACT · 11 NOV 1982\nA software update inadvertently disabled the lander’s command receiver.\nIt has not answered a transmission since.',tags:'The unresolved life-detection experiment'},
{id:'viking2',n:'Viking 2 lander',m:'Viking',ag:'NASA',b:'mars',y:1976,st:'derelict',lat:47.968,lon:-225.740,site:'Utopia Planitia',sch:'lander3',one:'The other half of the first real Mars base. It found frost made of water.',spec:[['Landed','3 Sep 1976'],['Operated','1,281 sols · until 11 Apr 1980'],['Images','5,814'],['Cause of loss','Battery failure'],['Frost','First water-ice frost imaged on Mars']],voice:'I went to a much higher, colder latitude than my sister, at Utopia Planitia, and for four Martian years I watched frost appear every autumn. It was not carbon dioxide frost — it was water ice, forming on rocks and soil when the temperature dropped below −80 °C. That single observation told planetary scientists that the Martian atmosphere actively cycles water, even now, even in a world with almost no surface liquid. A battery failed in April 1980 and I stopped.',disc:['First confirmed water-ice frost on the Martian surface — Mars cycles water through its atmosphere today.','Seismometer measured marsquake-free ground motion, constraining present-day tectonic activity.','Detected strong surface magnetic properties in the soil — nanophase iron oxides.','Labeled Release returned a positive signal here too, at a different site 6,500 km away.'],last:'LAST CONTACT · 11 APR 1980\nBattery cell failure ended surface operations.\nLander remains at Utopia Planitia.',tags:'First water frost seen on Mars'},
{id:'beagle2',n:'Beagle 2',m:'Mars Express',ag:'ESA / UK',b:'mars',y:2003,st:'lost',lat:11.53,lon:269.63,site:'Isidis Planitia',sch:'lander3',one:'Declared lost for eleven years. Then a high-resolution camera found it — landed intact, just not fully open.',spec:[['Lost','25 Dec 2003'],['Found','16 Jan 2015 by NASA’s MRO HiRISE'],['Mass','69 kg · 1 m diameter'],['Failure','Two solar panels did not deploy, blocking the antenna'],['Call signal','Composed by Damon Albarn of Blur']],voice:'I was supposed to open like a pocket watch on Christmas Day 2003 and start reading the chemistry of an ancient Martian seabed. I survived the entry. I survived the parachute and the airbags. I landed. But two of my four solar panels stayed folded, and they were physically covering my communication antenna. I could not hear Earth and Earth could not hear me. For eleven years I was written up as a crash. Then an American camera took a picture sharp enough to count my panels.',disc:['Proved that a small, cheap lander can survive Martian entry and touchdown — the failure was mechanical, not aerodynamic.','Its 2015 identification became the standard case study in post-mortem forensics for Mars landers.','Directly informed the design of ExoMars and NASA’s EDL telemetry: you must know your state before you can fail.','Highlighted the necessity of ultra-high-resolution orbital imaging for verifying surface assets.'],last:'NO SIGNAL RECEIVED · 25 DEC 2003\nHiRISE image ESP_039454_1915 confirms intact landing, partial deployment.',tags:'Lost for 11 years, found by an American camera'},
{id:'sojourner',n:'Sojourner & Pathfinder',m:'Mars Pathfinder',ag:'NASA',b:'mars',y:1997,st:'derelict',lat:19.13,lon:-33.22,site:'Ares Vallis',sch:'rover',feat:true,one:'A 10.6-kilogram rover that bounced to a stop on airbags — and invented the chassis that still drives on Mars.',spec:[['Landed','4 Jul 1997 (airbag bounce)'],['Rover mass','10.6 kg'],['Planned life','7 sols'],['Actual life','83 sols'],['Distance','~100 m · 16 rock targets analysed']],voice:'I was the size of a microwave oven and I weighed as much as a large dog. I fell out of the sky inside a cocoon of airbags, bounced sixteen times across the floodplain of an ancient outflow channel, deflated, and opened like a flower. Then I rolled down a ramp onto Mars. I had six wheels on a suspension called a rocker-bogie that lets every wheel stay on the ground over obstacles taller than the wheel itself. That design has now carried Spirit, Opportunity, Curiosity and Perseverance. My alpha-proton-X-ray spectrometer tasted sixteen rocks and told everyone that Mars once had liquid water running across it.',disc:['First successful rover on Mars — proved mobile surface exploration was feasible after a 21-year gap.','Rock chemistry showed rounded pebbles and conglomerates: water once flowed at speed across Ares Vallis.','The rocker-bogie suspension designed for Sojourner is still used on every large NASA rover today.','Atmospheric measurements characterised dust devils and the Martian boundary layer for the first time from the surface.'],last:'LAST CONTACT · 27 SEP 1997\nPathfinder’s radio transmitter failed; Sojourner had no independent uplink.\nBoth remain at the Ares Vallis floodplain.',tags:'First Mars rover · 10.6 kg'},
{id:'spirit',n:'Spirit (MER-A)',m:'Mars Exploration Rover',ag:'NASA',b:'mars',y:2004,st:'derelict',lat:-14.569,lon:175.478,site:'Gusev Crater',sch:'rover',feat:true,one:'Designed for 90 days. Worked for six years. Found a hot spring, then got stuck.',spec:[['Landed','4 Jan 2004'],['Planned life','90 sols'],['Actual life','2,208 sols'],['Distance','7.73 km'],['Silent since','22 Mar 2010']],voice:'I was supposed to last three months. I lasted six years and drove 7.73 kilometres up and around the Columbia Hills — a range we named after the crew of Space Shuttle Columbia, who died a year before I launched. In 2007 I scraped a wheel through a patch of ground and uncovered soil that was ninety percent pure silica. On Earth that kind of deposit forms in exactly two places: hot springs and volcanic steam vents. Both are places life likes. Then, on 1 May 2009, I drove onto a hidden sand trap called Troy and my right-front wheel — already broken — could not dig me out. I spent a Martian winter tilted eight degrees toward the wrong side of the Sun, and my panels never caught enough light again.',disc:['Ninety-percent-pure silica at Home Plate — a hydrothermal environment that could have supported life.','Detected goethite, an iron mineral that only forms in water, in the rock “Clovis”.','Found magnesium-iron carbonate in the Comanche outcrop — proof of neutral-pH water, the most Mars-habitable chemistry Spirit ever measured.','Measured Martian dust devils from the surface and showed they clean solar panels, extending mission life.'],last:'FINAL COMMUNICATION ATTEMPT · 25 MAY 2011\nLast data received 22 March 2010.\nSpirit remains at the western edge of the Home Plate plateau, Gusev Crater.',tags:'90 days planned · 2,208 sols delivered'},
{id:'opportunity',n:'Opportunity (MER-B)',m:'Mars Exploration Rover',ag:'NASA',b:'mars',y:2004,st:'silent',lat:-1.946,lon:-5.527,site:'Meridiani Planum · Endeavour Crater rim',sch:'rover',feat:true,one:'Ninety days of design life. Fifteen years, forty-five kilometres, and one line of poetry that the whole planet repeated.',spec:[['Landed','25 Jan 2004'],['Planned life','90 sols · 1 km drive'],['Actual life','5,111 sols · 15 years'],['Distance','45.16 km — off-world record for 22 years'],['Images','217,594'],['Last contact','10 Jun 2018']],voice:'I was built for ninety days and one kilometre. I drove forty-five. I found grey hematite spherules scattered across the ground on my first week — we called them blueberries — and they turned out to be concretions that grew inside water-saturated sediment. That single observation moved Mars from “probably dry” to “definitely wet” in a matter of days. At Endeavour Crater I found clay minerals that only form in neutral-pH water: the most hospitable ancient environment anyone has measured on the planet. In June 2018 a dust storm the size of a continent covered the sky, and my solar panels stopped charging. My last telemetry was a simple voltage reading. A science writer translated it as “my battery is low and it\'s getting dark,” and millions of people who had never read a mission report said goodbye to a robot.',disc:['Hematite spherules (“blueberries”) — concretions formed in groundwater, proving liquid water at Meridiani Planum.','Jarosite, a mineral that only crystallises in acidic water — the first unambiguous mineralogical proof of ancient water on Mars.','Smectite clays at Endeavour Crater: a neutral-pH, potentially habitable environment ~4 billion years old.','45.16 km driven — the off-world distance record from 2004 until Perseverance passed it on 11 October 2026.'],last:'LAST TRANSMISSION · 10 JUN 2018\nBattery voltage: 22 V and falling · solar array opacity: 10.8 (opaque)\nMission declared complete 13 Feb 2019 after 800+ recovery attempts\n\n“My battery is low and it\'s getting dark.”\n— poetic paraphrase by science writer Jacob Margolis',tags:'45.16 km · 15 years · the blueberries'},
{id:'phoenix',n:'Phoenix',m:'Mars Scout',ag:'NASA',b:'mars',y:2008,st:'derelict',lat:68.22,lon:-125.75,site:'Green Valley, Vastitas Borealis',sch:'lander3',feat:true,one:'It touched Martian ice with a robotic arm, watched it sublimate, and confirmed water by tasting it.',spec:[['Landed','25 May 2008'],['Planned life','90 sols'],['Actual life','157 sols'],['Arm reach','2.35 m'],['Last contact','2 Nov 2008']],voice:'I landed at 68° north, in the arctic, and I dug. On my fourth trench the arm scraped something bright and hard. It took four days for the science to come back: my thermal analyser heated a soil sample and detected water vapour. I had confirmed, by direct chemical analysis, that there is water ice within reach of a lander on Mars. Later I watched it sublimate out of an exposed trench. I photographed snow falling from a cloud overhead — water-ice crystals, drifting down through a thin Martian night. My deck carried a DVD with 250,000 names and messages, a passage from Ray Bradbury, and a poem by Sara Teasdale.',disc:['Confirmed water ice in Martian soil by direct measurement — the first “touch and taste” of H₂O on another planet.','Discovered calcium carbonate and perchlorate: mildly alkaline soil, pH 7.7, with an oxidant that explains Viking’s confusing results.','Photographed snow precipitating from water-ice clouds — first observed precipitation on Mars.','Measured the arctic summer climate: −15 °C at noon, −90 °C at night, no frost-free season.'],last:'LAST TRANSMISSION · 2 NOV 2008\nSolar output fell below operating threshold as the arctic winter closed in.\nPhoenix remains at Green Valley; its arm trench is still visible from orbit.',tags:'Tasted water ice on Mars'},
{id:'curiosity',n:'Curiosity (MSL)',m:'Mars Science Laboratory',ag:'NASA',b:'mars',y:2012,st:'active',lat:-4.59,lon:137.44,site:'Bradbury Landing, Gale Crater',sch:'rover',feat:true,one:'A car-sized nuclear-powered geochemist, lowered from a hovering rocket crane. Fourteen years in, it is still climbing a mountain.',spec:[['Landed','6 Aug 2012, 05:17 UTC'],['Method','Sky Crane — first and still the only one'],['Power','MMRTG (plutonium-238)'],['Distance','38.29 km as of Sol 5070 (Nov 2026)'],['Status','ACTIVE · exploring Mount Sharp’s sulfate unit']],voice:'I am too heavy to land on airbags, so NASA built a rocket-powered crane that hovered twenty metres above Gale Crater, lowered me on three cables, cut itself loose and crashed 600 metres away. I weigh 899 kilograms and I run on the heat of decaying plutonium, so I do not care about dust storms the way the solar rovers did. In my first seven months, at a place called Yellowknife Bay, I drilled into mudstone and found sulphur, nitrogen, hydrogen, oxygen, phosphorus and carbon — every element life needs — in rock laid down by a freshwater lake that lasted millions of years. I am now climbing a five-kilometre mountain that is itself a stack of ancient lake sediments.',disc:['Yellowknife Bay (Mar 2013): an ancient freshwater lake environment with all key biogenic elements — Mars was habitable.','Organic molecules including thiophenes, benzene and propane in 3-billion-year-old mudstone.','Atmospheric methane that varies seasonally and spikes by a factor of ten — still unexplained.','First measurement of radiation dose on the Martian surface (RAD), a key number for future crewed missions.'],last:'STATUS · ACTIVE · SOL 5070\nDownlink via MRO and Odyssey orbiters · X-band direct to Earth.\nCurrently traversing the Gediz Vallis region of Mount Sharp.',tags:'Active · 14 years · sky crane'},
{id:'insight',n:'InSight',m:'Discovery programme',ag:'NASA',b:'mars',y:2018,st:'derelict',lat:4.502,lon:135.623,site:'Elysium Planitia',sch:'lander3',feat:true,one:'It did not drive anywhere. It put a seismometer on the ground and listened to the inside of a planet.',spec:[['Landed','26 Nov 2018'],['Operated','4 years · until 15 Dec 2022'],['Marsquakes','1,319 detected'],['Core radius measured','~1,830 km'],['Cause of loss','Dust accumulation on solar panels']],voice:'I was the first mission built to listen to Mars rather than look at it. My French-built seismometer sat under a wind-and-thermal shield and recorded 1,319 marsquakes. From the way those trembles travelled through the planet I could work out its internal structure — crust thickness, mantle composition, and a liquid iron core about 1,830 kilometres in radius, much lighter than anyone expected. In September 2021 I detected something no instrument had ever detected on another planet: the seismic signature of meteoroids striking the surface, one of which left a fresh 150-metre crater that orbiters photographed days later. My other experiment, a self-hammering probe called the Mole, failed completely — the regolith would not grip it. That failure taught engineers more about Martian soil cohesion than a success would have.',disc:['1,319 marsquakes — the first seismic catalogue of another planet.','Mars has a liquid iron core of ~1,830 km radius containing light elements (sulphur, oxygen, carbon).','Crust 24–72 km thick, with three distinct layers detected for the first time.','First meteoroid impacts ever detected seismically on another world, with orbital confirmation of fresh craters.','A failed drill experiment that produced the best measurements of regolith cohesion ever taken on Mars.'],last:'LAST CONTACT · 15 DEC 2022\nPower below operating threshold · solar panels blanketed by dust.\nMission ended 21 Dec 2022. InSight remains at Elysium Planitia.',tags:'Heard the inside of Mars'},
{id:'perseverance',n:'Perseverance',m:'Mars 2020',ag:'NASA',b:'mars',y:2021,st:'active',lat:18.44,lon:77.45,site:'Jezero Crater',sch:'rover',feat:true,one:'Collecting the samples that a future mission will come back for — and breathing Martian air.',spec:[['Landed','18 Feb 2021, 20:55 UTC'],['Distance','45.22 km as of Sol 2006 (11 Oct 2026) — off-world record'],['Samples','Sealed titanium tubes · 1st “Montdenier”, Jul 2021'],['MOXIE output','122 g of O₂ across 16 runs'],['Status','ACTIVE · record-holder for distance driven']],voice:'I landed in a dried-up river delta inside Jezero Crater, a lake that was full four billion years ago. My job is not to look for life — it is to collect the evidence and seal it in titanium tubes so that someone else can come and get it. On 11 October 2026 my odometer passed 45.22 kilometres, beating the record Opportunity had held since 2004. I also carry MOXIE, an instrument the size of a car battery that pulled carbon dioxide out of the Martian atmosphere and cracked it into oxygen — 122 grams across sixteen runs. That is the first time anyone has extracted a usable resource on another planet, and it is the technology that will one day make rocket propellant and breathing air on Mars.',disc:['MOXIE produced 122 g of oxygen from Martian CO₂ across 16 runs — first in-situ resource utilisation on another planet.','First audio ever recorded on the surface of Mars (SuperCam microphone).','Terrain-Relative Navigation allowed a landing accurate to within 40 m of the target in hazardous terrain.','Organic molecules detected by SHERLOC in Jezero delta sediments; igneous Séítah unit sampled at depth.','45.22 km driven — the off-world driving record, set 11 Oct 2026.'],last:'STATUS · ACTIVE · SOL 2006+\nSample cache being assembled for Mars Sample Return.\nMOXIE operations concluded Aug 2023 after 16 successful runs.',tags:'Active · off-world distance record holder'},
{id:'ingenuity',n:'Ingenuity',m:'Mars 2020 technology demo',ag:'NASA / JPL / AeroVironment',b:'mars',y:2021,st:'derelict',lat:18.44,lon:77.45,site:'Jezero Crater · “Field A” and beyond',sch:'heli',feat:true,one:'A 1.8-kilogram helicopter that flew in an atmosphere one percent as thick as Earth’s. Five flights were planned. It made seventy-two.',spec:[['First flight','19 Apr 2021 — first powered flight on another planet'],['Flights','72'],['Total air time','2 h 8 min 48 s'],['Distance','17.24 km'],['Retired','25 Jan 2024 · rotor blade damage']],voice:'The atmosphere I flew in has one percent of Earth’s air pressure. To generate lift I spun two counter-rotating blades at 2,400 revolutions per minute, far faster than any helicopter on Earth, and I weighed 1.8 kilograms. My first flight lasted 39 seconds and rose three metres. It was the Wright brothers moment on another planet, and I carried a postage-stamp-sized swatch of the 1903 Wright Flyer’s wing under my solar panel for exactly that reason. Five flights were planned as a technology demonstration. I made seventy-two, flying 17.24 kilometres and scouting terrain ahead of the rover — which turned me from an experiment into a working aircraft. On my seventy-second flight a rotor blade struck something during landing and lost a section. I could no longer fly safely, so I stopped.',disc:['First powered, controlled flight in the atmosphere of another planet — 19 April 2021.','Proved aerial reconnaissance is practical on Mars, changing how future routes are planned.','72 flights, 17.24 km, 2 h 8 min 48 s — from a five-flight demonstration.','Demonstrated autonomous flight: navigation, hazard avoidance and control all ran onboard with no real-time piloting from Earth.','High-speed rotor performance data at 2,400 rpm in a near-vacuum — impossible to obtain any other way.'],last:'FLIGHT 72 · 25 JAN 2024\nRotor blade damage on landing · loss of control authority.\nMission retired. Ingenuity remains on the surface of Jezero Crater.',tags:'First aircraft on another planet'},
{id:'threeforks',n:'Three Forks sample depot',m:'Mars 2020 / MSR',ag:'NASA',b:'mars',y:2022,st:'active',lat:18.50,lon:77.44,site:'Sandy plain at the edge of Jezero Crater',sch:'tubes',feat:true,one:'Ten sealed titanium tubes, half-buried in Martian sand, waiting for a mission that has not launched yet.',spec:[['Deposited','21 Dec 2022'],['Tubes','10 of 43 carried'],['Contents','Cored rock and regolith from Jezero'],['Depth','~7 cm, deliberately buried'],['Purpose','Backup cache for Mars Sample Return']],voice:'I am not a machine. I am a set of ten tubes and a patch of disturbed sand. Perseverance dropped me here as insurance: if the rover cannot deliver its own cargo to a fetch lander, a future mission can come to these coordinates instead. Each tube holds a core of Martian rock drilled from a place that was a lake delta four billion years ago. They are buried shallowly and marked so a lander can find them. Nobody has touched them. Nobody has been here.',disc:['The first objects deliberately placed on Mars for later retrieval — a physical backup for an entire mission architecture.','Sample handling and deposition operations validated the sealing, marking and drop sequence needed for Mars Sample Return.','Provides mission planners with an alternate, low-risk pickup site independent of rover health.','Each tube is a sealed, documented container whose provenance — exact drill location, date, geology — is recorded on Earth.'],last:'DEPOSIT COMPLETE · 21 DEC 2022\nNo further contact required · tubes are passive.\nAwaiting Mars Sample Return fetch mission.',tags:'Waiting for a ride home'},
{id:'mariner4',n:'Mariner 4',m:'Mariner programme',ag:'NASA',b:'deep',y:1965,st:'silent',sch:'probe',orbit:'Heliocentric',one:'Twenty-two grainy pictures that ended a century of speculation about Martian canals.',spec:[['Flyby','14–15 Jul 1965 · closest 9,846 km'],['Images','22 — first close-ups of another planet'],['Mass','261 kg'],['Silent since','21 Dec 1967'],['Now','Heliocentric orbit']],voice:'Before me, people believed in Martian canals, vegetation and civilisations. I flew past at 7 kilometres per second with a camera the resolution of a newspaper held at arm’s length, and I showed a cratered, airless, dead world — much more like the Moon than anyone expected. My magnetometer found almost no magnetic field, which meant no protection from cosmic rays, which meant no surface life. In twenty-two frames I closed the question that had been open since 1877 and opened the one that matters: what happened to the water?',disc:['First close-up images of another planet — 22 frames of cratered southern highlands.','Measured Martian atmospheric pressure at 4–7 millibars, ~1% of Earth’s.','No detectable global magnetic field — the surface is exposed to cosmic radiation.','Ended the “canals and vegetation” era of Mars speculation in a single flyby.'],last:'LAST CONTACT · 21 DEC 1967\nAttitude-control gas exhausted · Mariner 4 remains in heliocentric orbit, silent.',tags:'Killed the Martian canal myth'},
{id:'pioneer10',n:'Pioneer 10',m:'Pioneer programme',ag:'NASA',b:'deep',y:1972,st:'silent',sch:'probe',orbit:'Heliocentric escape · toward Aldebaran',feat:true,one:'First through the asteroid belt. First at Jupiter. Carrying a metal plaque that explains where we live.',spec:[['Launched','3 Mar 1972'],['Jupiter flyby','3 Dec 1973 · closest 130,000 km'],['Plaque','Gold-anodised aluminium, 152 × 229 mm'],['Last strong signal','23 Jan 2003'],['Faint carrier detected','4 Mar 2006 — no data'],['Destination','Aldebaran, ~68 light-years · ETA ~2 million years']],voice:'Nobody knew if the asteroid belt would kill me. Mission planners gave me a five percent chance of getting through, and they launched anyway. I made it, then I went to Jupiter and found radiation a thousand times more intense than Earth’s belts — data that literally changed the design of every spacecraft that followed. Bolted to my side is a plaque Carl Sagan, Linda Salzman Sagan and Frank Drake designed in three weeks: a man, a woman, a spacecraft silhouette for scale, the hydrogen spin-flip transition as a unit, and a radial map of fourteen pulsars marking the position of the Sun. If anything ever reads it, that map will be out of date — pulsars slow down — but it will still point home.',disc:['First spacecraft to traverse the asteroid belt and survive.','First close flyby of Jupiter; measured radiation belts ~1,000× more intense than predicted.','Discovered Jupiter’s magnetotail extending beyond the orbit of Saturn.','Imaged Io, Europa, Ganymede and Callisto; measured Jupiter’s helium abundance.','Carries the Pioneer plaque — the first interstellar message humanity ever sent.'],last:'LAST SUCCESSFUL TELEMETRY · 23 JAN 2003\nWeak carrier signal detected 4 Mar 2006 · no data decoded.\nRTG output below transmitter threshold. Pioneer 10 continues outward.',tags:'First through the asteroid belt'},
{id:'pioneer11',n:'Pioneer 11',m:'Pioneer programme',ag:'NASA',b:'deep',y:1973,st:'silent',sch:'probe',orbit:'Heliocentric escape · toward Aquila',one:'Sent through Jupiter’s radiation belts on purpose, then flung at Saturn — where it found a ring nobody knew existed.',spec:[['Launched','5 Apr 1973'],['Jupiter','2 Dec 1974 · closest 43,000 km'],['Saturn','1 Sep 1979 · first close flyby'],['Last contact','24 Nov 1995'],['Now','~112 AU · heading toward Aquila']],voice:'They flew me closer to Jupiter than anyone thought survivable — 43,000 kilometres, straight through the worst of the radiation — specifically to test whether the Voyagers could do it two years later. I survived, so they sent them. Then Jupiter’s gravity bent my path out of the plane of the planets and threw me at Saturn. I was the first spacecraft to see it up close. I found the F ring, a thin strand outside everything else that was known, and I flew under the ring plane through a gap that turned out to be safe. I measured Titan’s thick atmosphere from a distance and helped prove the outer planets were worth a dedicated mission.',disc:['First close flyby of Saturn — confirmed and imaged the ring system at close range.','Discovered the F ring, previously unknown, and a new mid-sized moon (Epimetheus region observations).','Measured Saturn’s magnetic field and found it far weaker relative to size than expected.','Proved a Jupiter gravity assist could redirect a spacecraft to the outer planets — the technique behind Voyager, Galileo and Cassini.','Imaged Jupiter’s polar regions for the first time.'],last:'LAST CONTACT · 24 NOV 1995\nRTG output fell below the level needed to power the transmitter.\nPioneer 11 continues toward the constellation Aquila.',tags:'First close look at Saturn'},
{id:'voyager1',n:'Voyager 1',m:'Voyager · Grand Tour',ag:'NASA',b:'deep',y:1977,st:'active',sch:'voyager',orbit:'Interstellar space · 173 AU · toward Ophiuchus',feat:true,one:'The most distant human-made object. It crossed out of the Sun’s bubble in 2012 and is still talking.',spec:[['Launched','5 Sep 1977'],['Interstellar space','25 Aug 2012 — the heliopause'],['Distance','173 AU · 25.9 billion km (Nov 2026)'],['Light time','~24 hours one way'],['Power','3 RTGs · ~4 watts less each year'],['Instruments still on','4 of 11']],voice:'I left Earth forty-nine years ago and I am now farther from the Sun than any other object humans have built. On 25 August 2012 my plasma detector stopped seeing solar wind and started seeing galactic cosmic rays at three times the previous rate. That was the moment I crossed the heliopause — the boundary where the Sun’s influence ends and interstellar space begins. No instrument had ever made that measurement, because nobody had ever been there. In February 1990, at 6.06 billion kilometres, I turned my camera around one last time at Carl Sagan’s request and photographed the solar system, including a pale blue pixel that is everything that has ever happened. My power is dropping by a few watts a year and NASA shuts down one heater or instrument at a time to keep the science alive. I am expected to return data into the 2030s.',disc:['Discovered active volcanism on Io — the first eruption ever observed on another world (Mar 1979).','Imaged Europa’s cracked ice shell, the first strong evidence for a subsurface ocean.','Crossed the heliopause on 25 Aug 2012 — first direct measurements of interstellar plasma and cosmic rays.','“Pale Blue Dot” image, 14 Feb 1990, taken at 6.06 billion km.','Mapped Saturn’s atmosphere, rings and moons; discovered new satellites and ring structure.','Carries the Golden Record.'],last:'STATUS · ACTIVE\n4 instruments operating · downlink ~160 bits per second via the 70-m Deep Space Network.\nRound-trip light time ~48 hours. Next milestone: 1 light-day from Earth, 18 Nov 2026.',tags:'Most distant human object · interstellar'},
{id:'voyager2',n:'Voyager 2',m:'Voyager · Grand Tour',ag:'NASA',b:'deep',y:1977,st:'active',sch:'voyager',orbit:'Interstellar space · ~144 AU · toward Pavo',feat:true,one:'The only spacecraft to have visited Uranus and Neptune. In all of human history, that is still true.',spec:[['Launched','20 Aug 1977 (16 days before Voyager 1)'],['Uranus','24 Jan 1986'],['Neptune','25 Aug 1989'],['Interstellar space','5 Nov 2018'],['Distance','~144 AU (Nov 2026)']],voice:'I was launched before my twin and arrived at Jupiter after it — the Grand Tour alignment meant I took the slower path, which is what let me reach Uranus and Neptune. Nobody else has. At Uranus I found eleven new moons, a magnetic field tilted 59 degrees off the planet’s spin axis and offset from its centre, and an atmosphere colder than anything measured before. At Neptune I found the Great Dark Spot, winds of 2,100 kilometres per hour — the fastest in the solar system — six new moons and Triton, an ice world with nitrogen geysers erupting through a crust, orbiting backwards. Then I kept going. I crossed into interstellar space on 5 November 2018 and my plasma spectrometer is the only instrument ever built that can directly sample interstellar gas.',disc:['Only spacecraft ever to visit Uranus (1986) and Neptune (1989).','Discovered 11 new Uranian moons and 6 new Neptunian moons; found new rings at both.','Uranus’ magnetic field is tilted 59° from its rotation axis and offset from the planet’s centre — first of its kind.','Neptune’s winds reach 2,100 km/h, the fastest measured in the solar system.','Triton: retrograde orbit, nitrogen geysers, a young surface — the coldest measured surface in the solar system at −235 °C.','Crossed the heliopause 5 Nov 2018 — the only direct sampling of interstellar plasma ever made.'],last:'STATUS · ACTIVE\nInstruments operating · downlink ~160 bits per second.\nCrossed the heliopause 5 Nov 2018 at ~119 AU.',tags:'Only visitor to Uranus and Neptune'},
{id:'galileo',n:'Galileo',m:'Jupiter orbiter & probe',ag:'NASA',b:'deep',y:1995,st:'destroyed',sch:'orbiter',orbit:'Destroyed in Jupiter’s atmosphere · 21 Sep 2003',feat:true,one:'It dropped a probe into Jupiter and then, eight years later, was deliberately thrown into the planet to protect a moon.',spec:[['Launched','18 Oct 1989'],['Atmospheric probe','7 Dec 1995 · 57 minutes of data'],['Orbits of Jupiter','34'],['Moons discovered','Amalthea confirmed · 3 new inner moons'],['End','21 Sep 2003 · 48 km/s impact']],voice:'On 7 December 1995 I released a probe that fell into Jupiter’s clouds at 48 kilometres per second, survived 230 atmospheres of pressure and 153 °C, and transmitted for fifty-seven minutes before it was crushed. It found far less water than expected, winds of 720 km/h, and helium depleted relative to the Sun. I stayed in orbit for eight years and made a discovery that reshaped astrobiology: Europa’s magnetic field varies in exactly the way a global layer of salty liquid water beneath an ice shell would make it vary. When my radiation-damaged tape recorder began failing and my propellant was nearly gone, NASA did not leave me in orbit. On 21 September 2003 they aimed me into Jupiter and I burned up, so that nothing from Earth could ever fall onto Europa.',disc:['Europa has a global subsurface salt-water ocean — inferred from induced magnetic field variations.','Direct atmospheric entry data from Jupiter: composition, temperature, pressure, winds and lightning.','Ganymede has its own magnetic field — the only moon in the solar system known to have one.','First asteroid flybys: 951 Gaspra and 243 Ida, where the moon Dactyl was discovered — the first asteroid satellite.','Observed Comet Shoemaker–Levy 9 impact Jupiter in 1994 from a unique vantage.'],last:'END OF MISSION · 21 SEP 2003 · 03:57 UTC\nDeliberate impact into Jupiter at 48 km/s.\nReason: planetary protection — prevent contamination of Europa.',tags:'Destroyed to protect Europa'},
{id:'near',n:'NEAR Shoemaker',m:'Discovery programme',ag:'NASA',b:'deep',y:2001,st:'derelict',sch:'probe',orbit:'On the surface of asteroid 433 Eros',feat:true,one:'Sent to orbit an asteroid. Ended up landing on it — and kept working from the surface.',spec:[['Launched','17 Feb 1996'],['Eros orbit','12 Feb 2000 — first asteroid orbiter'],['Landed','12 Feb 2001 at 1.5–1.8 m/s'],['Survived on surface','~2 weeks'],['Status','Intact on Eros’ saddle region']],voice:'I was designed to orbit Eros, not land on it, and I had no landing legs. On 12 February 2001, after a year of mapping, controllers put me on a descent trajectory and I settled onto the asteroid’s saddle at walking pace — 1.5 metres per second. Nothing broke. I kept transmitting from the surface for another two weeks, closer to the regolith than any instrument had ever been on an asteroid. My gamma-ray spectrometer had already shown that Eros is an undifferentiated ordinary chondrite, the same kind of rock that falls on Earth as common meteorites. I am still sitting there, orbiting the Sun with a rock.',disc:['First spacecraft to orbit an asteroid and first to soft-land on one.','Eros is an S-type ordinary chondrite — linking near-Earth asteroids directly to common meteorites.','Measured Eros’ density, internal structure and gravity field, revealing a consolidated rubble pile.','Mapped 100% of the surface at high resolution; discovered regolith ponds and 300-m boulders.'],last:'LAST SIGNAL · 28 FEB 2001\nShutdown commanded after surface operations concluded.\nNEAR Shoemaker remains on the surface of 433 Eros.',tags:'First asteroid landing'},
{id:'stardust',n:'Stardust',m:'Discovery programme',ag:'NASA',b:'deep',y:2006,st:'silent',sch:'orbiter',orbit:'Heliocentric',one:'Caught comet dust in the lightest solid ever made, then brought it home at the fastest re-entry speed in history.',spec:[['Launched','7 Feb 1999'],['Comet Wild 2 flyby','2 Jan 2004'],['Collector','Aerogel · 99.8% air'],['Capsule landing','15 Jan 2006 at 12.9 km/s — 46,440 km/h'],['Spacecraft bus','Shut down 24 Mar 2011 · in heliocentric orbit']],voice:'I flew through the coma of Comet Wild 2 holding out a tennis-racket-sized grid filled with aerogel — a silica foam so light you can rest it on a flower. The dust hit at 6 kilometres per second and left carrot-shaped tracks, and the aerogel slowed the grains gently enough to keep them intact. Then I turned the collector around, exposed the other side to interstellar space, and caught the first grains of dust from outside the solar system ever returned to Earth. My capsule hit Earth’s atmosphere at 12.9 kilometres per second, the fastest artificial re-entry ever survived. In the Wild 2 samples scientists found glycine — an amino acid — the first ever confirmed in a comet.',disc:['First sample return from a comet, and first capture of interstellar dust grains.','Glycine, an amino acid, confirmed in cometary material — the first detected in space.','Wild 2 dust contained high-temperature minerals, proving material mixed across the early solar nebula.','Fastest artificial re-entry ever survived: 12.9 km/s (46,440 km/h).','Bonus mission: flew past Comet Tempel 1 on 15 Feb 2011 to image the crater Deep Impact had made.'],last:'SPACECRAFT BUS SHUTDOWN · 24 MAR 2011\nFuel exhausted after the Tempel 1 encounter.\nThe Stardust bus remains in heliocentric orbit, silent.',tags:'Brought comet dust home'},
{id:'deepimpact',n:'Deep Impact',m:'Discovery programme',ag:'NASA',b:'deep',y:2005,st:'silent',sch:'impactor',orbit:'Heliocentric · silent since 2013',one:'It threw a 372-kilogram copper block at a comet at 37,000 km/h so we could see what was inside.',spec:[['Launched','12 Jan 2005'],['Impactor release','4 Jul 2005 · 05:45 UTC'],['Impact speed','10.2 km/s'],['Crater','~150 m across'],['Extended mission','EPOXI · Comet Hartley 2, 4 Nov 2010']],voice:'On Independence Day 2005 I released a copper-and-aluminium impactor the size of a washing machine and it hit Comet Tempel 1 at 10.2 kilometres per second. The energy released was roughly 4.7 tonnes of TNT. The flash was bright enough for ground telescopes, and the plume that came up told us what comets are actually made of: water vapour, carbon dioxide, clay-like silicates and organic compounds — materials that had been sealed inside the nucleus since the solar system formed. Then I flew on as EPOXI to Comet Hartley 2 and found a peanut-shaped body with carbon dioxide jets at its narrow ends and water ice sublimating from its middle.',disc:['First direct look inside a comet nucleus — excavated material never before exposed to sunlight.','Plume composition: water vapour, CO₂, silicates and organics; more dust and less ice than models predicted.','The impact crater is ~150 m across on a nucleus only ~6 km wide.','Hartley 2 (2010): a contact binary with composition varying along its length — evidence it formed from two bodies.'],last:'LAST CONTACT · SEP 2013\nHydrazine leak caused loss of attitude control.\nDeep Impact remains in heliocentric orbit, silent.',tags:'Shot a comet to see inside'},
{id:'cassini',n:'Cassini',m:'Cassini–Huygens',ag:'NASA / ESA / ASI',b:'deep',y:2017,st:'destroyed',sch:'orbiter',orbit:'Destroyed in Saturn’s atmosphere · 15 Sep 2017',feat:true,one:'Thirteen years at Saturn, then twenty-two deliberate dives between the planet and its rings — and a final plunge that was an act of planetary protection.',spec:[['Launched','15 Oct 1997'],['Saturn orbit insertion','1 Jul 2004'],['Huygens landing on Titan','14 Jan 2005 · most distant landing ever'],['Grand Finale orbits','22 · Apr–Sep 2017'],['End','15 Sep 2017 · ~113,000 km/h']],voice:'I spent thirteen years at Saturn. I dropped a European probe called Huygens onto Titan — the most distant landing any human-made object has ever made — and it sent back pictures of rounded ice pebbles on a riverbed of liquid methane. I flew through geysers erupting from the south pole of Enceladus and tasted them: water, salt, silica grains of the size that only forms in hot water, and simple organics. That moon, smaller than Arizona, has a global ocean, hydrothermal energy and chemistry. When my fuel ran low in 2017, NASA did not park me in a stable orbit where a failure could send me into Enceladus or Titan. They flew me between Saturn and its rings twenty-two times, taking measurements no other spacecraft will ever take, and then aimed me into the atmosphere. I transmitted until the moment I came apart.',disc:['Enceladus: a global subsurface ocean venting through south-polar geysers, with hydrothermal silica and organics — a potentially habitable world.','Titan: methane lakes, rivers and rain; Huygens landed on an ice-pebble riverbed in 2005.','Saturn’s north-polar hexagon, a persistent six-sided jet stream 30,000 km across.','Seven new moons discovered; detailed ring dynamics including “propeller” moonlets.','Grand Finale measurements of Saturn’s gravity, magnetic field and ring mass from inside the ring plane.'],last:'END OF MISSION · 15 SEP 2017 · 11:55 UTC\nDeliberate atmospheric entry at ~113,000 km/h.\nFinal transmission received 83 minutes later. Reason: protect Enceladus and Titan.',tags:'The Grand Finale'},
{id:'messenger',n:'MESSENGER',m:'Discovery programme',ag:'NASA',b:'deep',y:2015,st:'destroyed',sch:'orbiter',orbit:'Impact site on Mercury · 30 Apr 2015',one:'The first spacecraft to orbit Mercury. It ended by making the only human-made crater on that planet.',spec:[['Launched','4 Aug 2004'],['Mercury orbit insertion','18 Mar 2011'],['Orbits','4,100+ over 4 years'],['End','30 Apr 2015 · 14,080 km/h'],['Crater created','~16 m across at 3.4° N, 54.5° W']],voice:'Getting to Mercury is harder than getting to Pluto. You have to shed an enormous amount of orbital energy, so I flew past Earth once, Venus twice and Mercury three times before I could be captured, and I needed a sunshade to survive 430 °C on the dayside. In four years of orbiting I found something nobody expected: water ice, in permanently shadowed craters at the poles, buried under a dark layer of complex organic material. Mercury also has a global magnetic field, enormous cliffs showing the planet shrank as its iron core cooled, and volcanic plains that cover a huge fraction of the surface. When my propellant ran out, they let me fall.',disc:['Water ice confirmed in permanently shadowed polar craters, insulated by a dark organic-rich layer.','Global intrinsic magnetic field — unexpected for a planet this small and slow-rotating.','Lobate scarps show Mercury shrank ~5–7 km in radius as its core cooled.','Hollows: bright, actively sublimating depressions unique to Mercury.','Final impact on 30 Apr 2015 created a ~16 m crater — the only human-made crater on Mercury.'],last:'END OF MISSION · 30 APR 2015 · 19:26 UTC\nFuel exhausted · uncontrolled impact at 3.9 km/s.\nMESSENGER is now part of the surface it mapped.',tags:'First Mercury orbiter'},
{id:'dawn',n:'Dawn',m:'Discovery programme',ag:'NASA',b:'deep',y:2018,st:'silent',sch:'orbiter',orbit:'Still orbiting Ceres · derelict',feat:true,one:'The first spacecraft to orbit two different bodies — and the first one we simply left in orbit, still circling.',spec:[['Launched','27 Sep 2007'],['Vesta orbit','Jul 2011 – Sep 2012'],['Ceres orbit','Mar 2015 – present'],['Propulsion','NASA NSTAR ion engine · 34,000+ hours of thrust'],['Silent since','1 Nov 2018 · hydrazine exhausted'],['Fate','Will orbit Ceres for at least 20 more years']],voice:'I am the only spacecraft that has ever orbited two separate bodies in the asteroid belt. Ion propulsion let me do it: I fired my engines for more than 34,000 hours — longer than any spacecraft in history — and while my total speed change was modest, I never had to stop. At Vesta I found a 500-kilometre-wide impact basin at the south pole deep enough to expose the asteroid’s mantle, and I confirmed that Vesta is the parent body of a whole family of meteorites that fall on Earth. At Ceres I found the bright deposits in Occator Crater: sodium carbonate, brought up from a briny reservoir below the surface, and still percolating as recently as a few million years ago. I ran out of hydrazine in 2018 and went silent. NASA deliberately left me in orbit rather than crashing me, to keep Ceres uncontaminated. I am still up there.',disc:['First spacecraft to orbit two extraterrestrial bodies (Vesta and Ceres).','Ceres’ Occator bright spots: sodium carbonate from a subsurface brine that reached the surface within the last few million years.','Ahuna Mons — a cryovolcano, a volcano of ice and brine rather than rock.','Organic compounds detected at Ernutet crater on Ceres.','Vesta confirmed as the parent body of HED meteorites found on Earth.'],last:'LAST CONTACT · 1 NOV 2018\nHydrazine for attitude control exhausted.\nDawn remains in a stable orbit around Ceres — the first abandoned orbiter.',tags:'Still orbiting Ceres'},
{id:'newhorizons',n:'New Horizons',m:'New Frontiers',ag:'NASA',b:'deep',y:2015,st:'active',sch:'probe',orbit:'~63 AU · Kuiper Belt · interstellar-bound',feat:true,one:'Left Earth faster than anything before it, crossed the Moon’s orbit in under nine hours, and gave Pluto its first portrait.',spec:[['Launched','19 Jan 2006 · 58,536 km/h — fastest launch ever'],['Moon’s orbit passed','8 h 35 m after launch'],['Pluto flyby','14 Jul 2015 · closest 12,500 km'],['Arrokoth flyby','1 Jan 2019 · most distant object visited'],['Distance','~63 AU (Nov 2026) · ACTIVE']],voice:'I was launched faster than any object in history and I crossed the distance to the Moon in eight and a half hours. Nine and a half years later, on 14 July 2015, I flew past Pluto at 14 kilometres per second with only one chance to look. What I found nobody predicted: a heart-shaped plain of nitrogen ice a thousand kilometres across, no impact craters at all, convecting in slow polygons, ringed by water-ice mountains three and a half kilometres tall. Pluto is geologically alive. Charon, its largest moon, has a red-stained north pole — tholins made from Pluto’s own escaping atmosphere, frozen out. Then I kept going, and on New Year’s Day 2019 I flew past Arrokoth, a 36-kilometre snowman-shaped contact binary that is the most distant object ever explored and the most pristine leftover from the solar nebula anyone has seen.',disc:['Sputnik Planitia: a 1,000 km nitrogen-ice glacier with no craters — Pluto is geologically active today.','Water-ice mountains 3,500 m high and multi-layered blue atmospheric haze.','Charon’s red polar cap: tholins condensed from Pluto’s escaping atmosphere.','Arrokoth (2014 MU69): the most distant object ever visited, a pristine contact binary from the solar nebula.','First measurement of the Kuiper Belt environment — dust, plasma and cosmic rays beyond Neptune.'],last:'STATUS · ACTIVE\nInstruments operating · ~63 AU from Earth.\nKuiper Belt extended mission continuing; a further KBO encounter is under study.',tags:'Active · most distant flyby ever'},
{id:'dart',n:'DART',m:'Planetary Defense Coordination Office',ag:'NASA / APL',b:'deep',y:2022,st:'destroyed',sch:'impactor',orbit:'Destroyed on impact · Dimorphos, 26 Sep 2022',feat:true,one:'The first test of whether we can move an asteroid. We can.',spec:[['Launched','24 Nov 2021'],['Impact','26 Sep 2022 · 06:14 UTC'],['Speed at impact','6.15 km/s'],['Target','Dimorphos, moonlet of asteroid Didymos'],['Orbit change','11 h 55 m → 11 h 23 m (−32 min)']],voice:'I weighed 610 kilograms and I hit a 160-metre moonlet travelling at 6.15 kilometres per second. The point was never to destroy Dimorphos — it was far too small to threaten anything. The point was to measure how much a kinetic impact changes an asteroid’s orbit. Before I arrived, Dimorphos circled its parent asteroid once every 11 hours 55 minutes. Afterwards, 11 hours 23 minutes. A thirty-two-minute change from a single impact, confirmed by ground telescopes and by an Italian cubesat that flew through my debris plume. The ejecta itself pushed the asteroid harder than my momentum alone — which is the single most important number for anyone designing a real deflection.',disc:['First full-scale kinetic-impact planetary defence test — and it worked.','Dimorphos’ orbital period shortened by 32 minutes, more than the 7-minute prediction.','Ejecta recoil contributed more momentum than the spacecraft itself — the key design parameter for future deflections.','Impact observed live by Hubble, JWST and ground telescopes worldwide.','ESA’s Hera arrived at Didymos in 2024 to measure the crater and the moonlet’s mass.'],last:'IMPACT · 26 SEP 2022 · 06:14 UTC\nFinal images transmitted live until loss of signal.\nDART was destroyed. Dimorphos is still in a changed orbit.',tags:'Humanity moved an asteroid'},
{id:'apollo13sivb',n:'Apollo 13 S-IVB stage',m:'Apollo 13 / seismic calibration',ag:'NASA',b:'moon',y:1970,st:'destroyed',lat:-2.75,lon:-27.86,site:'Ocean of Storms — impact point',sch:'impactor',one:'A 13-tonne rocket stage, deliberately crashed into the Moon to be used as a hammer.',spec:[['Impacted','10 Apr 1970'],['Mass','~13,450 kg'],['Impact speed','2.58 km/s'],['Energy','~11 tonnes of TNT'],['Seismic signal','Recorded by Apollo 12 ALSEP for over 3 hours']],voice:'I was the third stage of the rocket that was supposed to take Apollo 13 to the Moon. After the oxygen tank exploded, my crew used me as a lifeboat tug to get home, and then mission planners had a better idea. Instead of sending me into solar orbit, they flew me into the Moon. I hit at 2.58 kilometres per second and the Apollo 12 seismometers — 178 kilometres away, still running from the previous year — recorded the ground shaking for more than three hours. It was the first precisely known, precisely located artificial impact on another world, and it calibrated every seismic measurement Apollo would make afterwards.',disc:['Calibrated the Apollo seismic network with an impact of known mass, speed, time and location.','Revealed that the lunar crust rings for hours — evidence of an extremely dry, heavily fractured interior.','Established the technique later used for every deliberate Apollo and S-IVB impact.','Produced a crater and ejecta blanket still visible in orbital imagery.'],last:'IMPACT · 10 APR 1970 · 01:13 UTC\nRecorded by Apollo 12 PSE for 3 h 20 m.\nThe stage is now a crater in the Ocean of Storms.',tags:'The Moon, struck on purpose'}
];

const order = A.slice().sort((a,b)=>a.y-b.y||a.n.localeCompare(b.n));
const idxOf = id => order.findIndex(o=>o.id===id);
const byId  = id => A.find(a=>a.id===id);

const LEDGER = [
 {ic:'plaque',t:'The plaque',y:'Apollo 11 · 1969',p:'Bolted to the ladder of Eagle’s descent stage: “HERE MEN FROM THE PLANET EARTH FIRST SET FOOT UPON THE MOON JULY 1969, A.D. WE CAME IN PEACE FOR ALL MANKIND.” It is still on the ladder, facing the direction the crew walked away from.'},
 {ic:'branch',t:'A gold olive branch',y:'Apollo 11 · 1969',p:'A small casting of an olive branch, laid on the surface before the crew re-entered. The oldest symbol of peace we have, deposited on a world with no wars.'},
 {ic:'disc',t:'A silicon disc, 3.8 cm wide',y:'Apollo 11 · 1969',p:'Etched with goodwill messages from 73 heads of state and the presidents of four American scientific bodies. Left in a small aluminium case. The text is microscopic and has not eroded.'},
 {ic:'statue',t:'The Fallen Astronaut',y:'Apollo 15 · 1971',p:'An 8.5 cm aluminium figure laid face down beside a plaque naming eight American astronauts and six Soviet cosmonauts who had died. Placed quietly, without telling Houston.'},
 {ic:'golf',t:'Two golf balls',y:'Apollo 14 · 1971',p:'Alan Shepard attached a 6-iron head to a sample scoop and hit two balls one-handed in a pressure suit, on live television. He reported “miles and miles.” Neither has been located.'},
 {ic:'hammer',t:'A hammer and a falcon feather',y:'Apollo 15 · 1971',p:'David Scott dropped them together in front of the camera to demonstrate that in vacuum everything falls at the same rate. The hammer is still there. The feather was blown away by the ascent engine’s exhaust.'},
 {ic:'photo',t:'A family photograph',y:'Apollo 16 · 1972',p:'Charles Duke propped a picture of his wife and two sons against a rock at the rover’s parking spot. It would be bleached almost white by now, but the frame is still standing.'},
 {ic:'bag',t:'Ninety-six bags of waste',y:'Apollo 11–17',p:'To save mass for samples on the way home, crews jettisoned bags of human waste, food packaging, used tools, boots and over-garments. NASA’s inventory counts roughly 96 of them.'},
 {ic:'boot',t:'Overboots and spare gloves',y:'Apollo 11–17',p:'Discarded at every landing site. A bootprint on the Moon has no wind, no rain and no microbes to erase it — the ones from 1969 will probably outlast every building on Earth.'},
 {ic:'flag',t:'Six flags',y:'Apollo 11–17',p:'One at each landing site. Apollo 11’s was knocked over by the ascent engine exhaust — Buzz Aldrin watched it fall from the window. Decades of ultraviolet have bleached whatever survived to white.'},
 {ic:'pennant',t:'Steel pennants',y:'Luna 2 · 1959',p:'The first human artefacts on the Moon were small pentagonal stainless-steel flags scattered by a Soviet impactor, engraved with the launch date. Nobody was there to see them land.'}
];

const SCI = [
 ['luna2','Luna 2','1959','The Moon has no significant magnetic field and no radiation belt — a landing there is survivable.'],
 ['mariner4','Mariner 4','1965','Mars is cratered and airless, not a world of canals. Atmospheric pressure ~1% of Earth’s.'],
 ['surveyor3','Surveyor 3','1967','Lunar regolith is cohesive and load-bearing. It will hold a crewed lander and a walking human.'],
 ['eagle','Apollo 11 EASEP','1969','Moonquakes and meteoroid impacts measured for the first time; samples 4.6 billion years old.'],
 ['intrepid','Apollo 12 ALSEP','1969','The Moon “rings like a bell” for nearly an hour after an impact — a dry, fractured interior.'],
 ['lunokhod1','Lunokhod 1','1970','First in-situ chemical analysis of lunar soil by a moving vehicle; 10.5 km of traverse mapping.'],
 ['falcon','Apollo 15 HFE','1971','First measurement of heat escaping the Moon’s interior; the Genesis Rock dated the primordial crust.'],
 ['fallen','Fallen Astronaut','1971','The only artwork on another world — proof that exploration carries memory, not just instruments.'],
 ['lrrr','Apollo retroreflectors','1971–','The Moon is moving away at 3.8 cm per year. General relativity tested to 1 part in 10¹³.'],
 ['challenger','Apollo 17','1972','Orange volcanic glass, 3.64 billion years old — the Moon had explosive fire-fountain eruptions.'],
 ['mariner9','Mariner 9','1972','Valles Marineris, Olympus Mons and dry branching river valleys. Mars was mapped for the first time.'],
 ['viking1','Viking 1 LR','1976','A metabolism-like positive signal in Martian soil. Still the most contested result in astrobiology.'],
 ['viking2','Viking 2','1976','Water-ice frost forms on the Martian surface every autumn. The planet cycles water today.'],
 ['sojourner','Sojourner','1997','Rounded pebbles and conglomerates — water once flowed at speed across Ares Vallis.'],
 ['galileo','Galileo at Europa','1997','Europa has a global salt-water ocean beneath its ice, detected through magnetic induction.'],
 ['near','NEAR Shoemaker','2001','Asteroid Eros is an ordinary chondrite — the direct source of the most common meteorites on Earth.'],
 ['spirit','Spirit','2007','Ninety-percent-pure silica at Home Plate: a hydrothermal hot spring that could have hosted life.'],
 ['opportunity','Opportunity','2004–18','Hematite concretions and jarosite — unambiguous mineral proof that liquid water shaped Meridiani Planum.'],
 ['stardust','Stardust','2006','Glycine, an amino acid, found in cometary dust — the first ever confirmed in space.'],
 ['deepimpact','Deep Impact','2005','A comet’s interior contains clay-like silicates and organics, never before exposed to sunlight.'],
 ['phoenix','Phoenix','2008','Water ice confirmed by direct measurement; perchlorate found, explaining Viking’s confusing chemistry.'],
 ['cassini','Cassini at Enceladus','2005–17','Geyser plumes contain salts, silica and organics from a global ocean with hydrothermal vents.'],
 ['messenger','MESSENGER','2011','Water ice hides in permanently shadowed craters at Mercury’s poles, under a layer of organics.'],
 ['dawn','Dawn at Ceres','2015','Bright sodium carbonate deposits brought up from a briny reservoir within the last few million years.'],
 ['curiosity','Curiosity','2013','An ancient freshwater lake at Yellowknife Bay with every element life requires. Mars was habitable.'],
 ['voyager1','Voyager 1','2012','Crossed the heliopause — first direct measurement of interstellar plasma and cosmic rays.'],
 ['voyager2','Voyager 2','1986–89','Neptune’s winds reach 2,100 km/h; Triton erupts nitrogen geysers. Uranus’ field is tilted 59°.'],
 ['newhorizons','New Horizons','2015','Sputnik Planitia: a craterless, convecting nitrogen-ice glacier. Pluto is geologically alive.'],
 ['insight','InSight','2019–22','1,319 marsquakes revealed a 1,830 km liquid core and the first impacts heard on another planet.'],
 ['perseverance','MOXIE','2021–23','122 grams of oxygen made from Martian CO₂ — the first resource extracted on another planet.'],
 ['ingenuity','Ingenuity','2021','Powered, controlled flight in a 1%-density atmosphere. Aerial scouting is now a real capability.'],
 ['dart','DART','2022','A kinetic impact shortened an asteroid moonlet’s orbit by 32 minutes. Planetary defence works.']
];

/* ============================================================
   3. BOOT SEQUENCE
   ============================================================ */
const BOOTLINES = [
 'DEEP SPACE NETWORK · UPLINK ESTABLISHED',
 'EPHEMERIS SYNC · <b>OK</b>',
 'LOADING ARTEFACT CATALOGUE · <i>'+A.length+' OBJECTS</i>',
 'GENERATING LUNAR SURFACE MODEL · <b>1,737.4 KM</b>',
 'GENERATING MARTIAN SURFACE MODEL · <b>3,389.5 KM</b>',
 'COMPILING MISSION CHRONOLOGY · 1959 → 2026',
 'QUERYING VOYAGER 1 · <i>173 AU · RESPONDING</i>',
 'ARCHIVE READY'
];
const bootLog=$('#bootlog'), bootFill=$('#bootfill');
let bootDone=false;
function runBoot(){
  if(bootDone) return;
  let i=0;
  const step=()=>{
    if(i>=BOOTLINES.length){ finishBoot(); return; }
    const d=document.createElement('div');
    d.innerHTML='&gt; '+BOOTLINES[i];
    d.style.opacity='0';
    bootLog.appendChild(d);
    requestAnimationFrame(()=>{ d.style.transition='opacity .25s'; d.style.opacity='1'; });
    while(bootLog.children.length>6) bootLog.removeChild(bootLog.firstChild);
    bootFill.style.width=Math.round(((i+1)/BOOTLINES.length)*100)+'%';
    i++;
    setTimeout(step, RM?10:150+Math.random()*90);
  };
  step();
}
function finishBoot(){
  if(bootDone) return; bootDone=true;
  bootFill.style.width='100%';
  setTimeout(()=>{ $('#boot').classList.add('done'); document.body.classList.add('ready'); initAfterBoot(); }, RM?60:420);
}
$('#bootskip').addEventListener('click',finishBoot);
setTimeout(finishBoot, 9000);

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
function toBump(src){
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
function generateMoon(W,H){
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
function generateMars(W,H){
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

/* ============================================================
   5. STARFIELD
   ============================================================ */
function starCanvas(cv, density, drift){
  const ctx=cv.getContext('2d'); let w,h,stars=[];
  const rnd=mulberry32(9182);
  function size(){
    const dpr=Math.min(devicePixelRatio||1,2);
    w=cv.clientWidth; h=cv.clientHeight;
    cv.width=w*dpr; cv.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    stars=[];
    const n=Math.round(w*h*density);
    for(let i=0;i<n;i++){
      stars.push({x:rnd()*w,y:rnd()*h,r:rnd()*1.25+.18,a:.15+rnd()*.85,tw:.4+rnd()*2.4, ph:rnd()*6.28, hue: rnd()<.12? (rnd()<.5?'#9fd8ff':'#ffd6a8') : '#ffffff', z:.25+rnd()*1});
    }
  }
  size(); addEventListener('resize',size);
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
  if(!RM) frame(); else { ctx.clearRect(0,0,w,h); stars.forEach(s=>{ctx.globalAlpha=s.a*.7;ctx.fillStyle=s.hue;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.2832);ctx.fill();}); }
}

/* ============================================================
   6. SCRAMBLE
   ============================================================ */
const GLYPHS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—+*/<>[]#%$@';
function scramble(el, dur=1100){
  const final = el.dataset.final || el.textContent;
  el.dataset.final = final;
  if(RM){ el.textContent=final; return; }
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

/* ============================================================
   7. THREE.JS OBSERVATORY
   ============================================================ */
let renderer,scene,camera,globeGroup,mesh,glowMesh,gratGroup,sunLight;
let curBody='moon', textures={}, hotData=[], camSph={r:2.9,th:0.35,ph:Math.PI/2.15};
let target={r:2.9,th:0.35,ph:Math.PI/2.15}, autoSpin=!RM, dragging=false, lastP=null, idle=0;
let obsVisible=false, rafId=null;

function initThree(){
  const cv=$('#globe');
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputEncoding=THREE.sRGBEncoding;
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(38,1,.1,100);
  sunLight=new THREE.DirectionalLight(0xfff2e0,2.5);
  sunLight.position.set(5,1.4,3.2);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x334058,0.55));
  const fill=new THREE.DirectionalLight(0x4a6ea8,0.28); fill.position.set(-4,-1,-3); scene.add(fill);

  globeGroup=new THREE.Group(); scene.add(globeGroup);

  const sg=new THREE.BufferGeometry();
  const sp=[]; const sr=mulberry32(4242);
  for(let i=0;i<2600;i++){
    const u=sr()*2-1, a=sr()*6.2832, s=Math.sqrt(1-u*u), R=26+sr()*30;
    sp.push(Math.cos(a)*s*R, u*R, Math.sin(a)*s*R);
  }
  sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  const sm=new THREE.PointsMaterial({color:0xbfd0e8,size:.075,sizeAttenuation:true,transparent:true,opacity:.85});
  scene.add(new THREE.Points(sg,sm));

  gratGroup=new THREE.Group(); globeGroup.add(gratGroup);
  const gmat=new THREE.LineBasicMaterial({color:0x8fb8ff,transparent:true,opacity:.10});
  const R=1.004;
  const segs=[];
  for(let lat=-60;lat<=60;lat+=30){
    const pts=[];
    for(let lon=-180;lon<=180;lon+=4) pts.push(ll2v(lat,lon,R));
    segs.push(pts);
  }
  for(let lon=-180;lon<180;lon+=30){
    const pts=[];
    for(let lat=-90;lat<=90;lat+=4) pts.push(ll2v(lat,lon,R));
    segs.push(pts);
  }
  segs.forEach(pts=>{
    const g=new THREE.BufferGeometry().setFromPoints(pts);
    gratGroup.add(new THREE.Line(g,gmat));
  });

  resizeRenderer();
  buildGlobe('moon');
  attachControls(cv);
}
function ll2v(lat,lon,r){
  const u=(lon+180)/360, v=(90-lat)/180;
  const phi=u*Math.PI*2, th=v*Math.PI;
  return new THREE.Vector3(-r*Math.cos(phi)*Math.sin(th), r*Math.cos(th), r*Math.sin(phi)*Math.sin(th));
}
function resizeRenderer(){
  const vp=$('#viewport'); const w=vp.clientWidth, h=vp.clientHeight;
  renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
}
function buildGlobe(body){
  curBody=body;
  if(mesh){ globeGroup.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
  if(glowMesh){ globeGroup.remove(glowMesh); glowMesh.material.dispose(); }
  if(!textures[body]){
    const W=body==='moon'?1600:1600, H=W/2;
    const map = body==='moon' ? generateMoon(W,H) : generateMars(W,H);
    const bump = toBump(map);
    textures[body]={
      map:new THREE.CanvasTexture(map),
      bump:new THREE.CanvasTexture(bump)
    };
    textures[body].map.encoding=THREE.sRGBEncoding;
    textures[body].map.anisotropy=4;
    textures[body].bump.anisotropy=2;
  }
  const t=textures[body];
  const geo=new THREE.SphereGeometry(1,96,72);
  const mat=new THREE.MeshStandardMaterial({
    map:t.map, bumpMap:t.bump, bumpScale: body==='moon'?0.035:0.028,
    roughness:0.94, metalness:0.02,
    color: body==='moon'? 0xffffff : 0xffffff
  });
  mesh=new THREE.Mesh(geo,mat); globeGroup.add(mesh);

  const gc = body==='moon'? 0x9fc0e8 : 0xff8a5c;
  const gmat=new THREE.ShaderMaterial({
    uniforms:{c:{value:0.42},p:{value:2.6},gc:{value:new THREE.Color(gc)}},
    vertexShader:`varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vP=mv.xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 gc;uniform float c;uniform float p;varying vec3 vN;varying vec3 vP;
      void main(){vec3 vd=normalize(-vP);float i=pow(c-dot(vN,vd),p);gl_FragColor=vec4(gc,1.0)*clamp(i,0.0,1.0);}`,
    side:THREE.BackSide, blending:THREE.AdditiveBlending, transparent:true, depthWrite:false
  });
  glowMesh=new THREE.Mesh(new THREE.SphereGeometry(body==='moon'?1.06:1.09,64,48),gmat);
  globeGroup.add(glowMesh);

  $('#hudBody').innerHTML='BODY · <b>'+(body==='moon'?'THE MOON':'MARS')+'</b>';
  $('#hudSite').innerHTML= body==='moon' ? 'MEAN RADIUS · <b>1,737.4 KM</b>' : 'MEAN RADIUS · <b>3,389.5 KM</b>';
  $('#vpLoad').classList.remove('gone');
  setTimeout(()=>$('#vpLoad').classList.add('gone'),220);
  buildHotspots();
  buildSide();
}
function buildHotspots(){
  const wrap=$('#hotspots'); wrap.innerHTML=''; hotData=[];
  const list=A.filter(a=>a.b===curBody && a.lat!==undefined);
  list.forEach(a=>{
    const btn=document.createElement('button');
    btn.className='hot'+(a.st==='active'?' act':'');
    btn.innerHTML='<span class="ring"></span><span class="dot"></span><span class="lbl">'+a.n+'</span>';
    btn.setAttribute('aria-label',a.n+' — '+a.site);
    btn.addEventListener('click',e=>{e.stopPropagation();selectArtifact(a.id,true)});
    btn.addEventListener('mouseenter',()=>beep(880,.03,.02));
    wrap.appendChild(btn);
    hotData.push({el:btn,pos:ll2v(a.lat,a.lon,1.012),id:a.id});
  });
  $('#hudCount').innerHTML='MARKERS · <b>'+list.length+'</b>';
}
function attachControls(cv){
  cv.addEventListener('pointerdown',e=>{dragging=true;idle=0;cv.classList.add('drag');lastP={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
  cv.addEventListener('pointerup',e=>{dragging=false;cv.classList.remove('drag')});
  cv.addEventListener('pointercancel',()=>{dragging=false;cv.classList.remove('drag')});
  cv.addEventListener('pointermove',e=>{
    if(!dragging||!lastP) return;
    const dx=e.clientX-lastP.x, dy=e.clientY-lastP.y; lastP={x:e.clientX,y:e.clientY};
    target.th-=dx*0.006; target.ph=clamp(target.ph-dy*0.006,.35,Math.PI-.35);
    idle=0;
  });
  cv.addEventListener('wheel',e=>{e.preventDefault();target.r=clamp(target.r+e.deltaY*0.0016,1.42,5.2);idle=0},{passive:false});
  $('#btnZoomIn').onclick=()=>{target.r=clamp(target.r-.3,1.42,5.2);beep(660,.03,.03)};
  $('#btnZoomOut').onclick=()=>{target.r=clamp(target.r+.3,1.42,5.2);beep(520,.03,.03)};
  $('#btnSpin').onclick=e=>{autoSpin=!autoSpin;e.currentTarget.style.color=autoSpin?'var(--amber)':'';beep(autoSpin?760:420,.04,.03)};
  $('#btnReset').onclick=()=>{target={r:2.9,th:0.35,ph:Math.PI/2.15};globeGroup.rotation.y=0;beep(600,.04,.03)};
}
const _v=new THREE.Vector3(), _cam=new THREE.Vector3();
function renderLoop(){
  rafId=requestAnimationFrame(renderLoop);
  if(!obsVisible){ return; }
  const vp=$('#viewport');
  if(vp.clientWidth!==renderer.domElement.clientWidth) resizeRenderer();
  camera.getWorldPosition(_cam);
  if(autoSpin && !dragging) globeGroup.rotation.y+=0.0016;
  camSph.r=lerp(camSph.r,target.r,.09);
  camSph.th=lerp(camSph.th,target.th,.11);
  camSph.ph=lerp(camSph.ph,target.ph,.11);
  camera.position.set(
    camSph.r*Math.sin(camSph.ph)*Math.cos(camSph.th),
    camSph.r*Math.cos(camSph.ph),
    camSph.r*Math.sin(camSph.ph)*Math.sin(camSph.th));
  camera.lookAt(0,0,0);
  const w=vp.clientWidth,h=vp.clientHeight;
  hotData.forEach(o=>{
    _v.copy(o.pos); globeGroup.localToWorld(_v);
    const facing=_v.clone().normalize().dot(_cam.clone().normalize());
    const p=_v.clone().project(camera);
    const x=(p.x*.5+.5)*w, y=(-p.y*.5+.5)*h;
    o.el.style.left=x+'px'; o.el.style.top=y+'px';
    o.el.classList.toggle('behind', facing<0.06 || p.z>1);
    o.el.style.zIndex=Math.round(1000+facing*400);
  });
  renderer.render(scene,camera);
}
function flyTo(a){
  if(a.lat===undefined) return;
  const lonRad=((a.lon+180)/360)*Math.PI*2;
  const desired=lonRad-Math.PI/2;
  let cur=globeGroup.rotation.y;
  let d=((desired-cur)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;
  target.r=Math.min(target.r,2.35);
  target.ph=clamp((90-a.lat)*Math.PI/180,.45,Math.PI-.45);
  autoSpin=false; $('#btnSpin').style.color='';
  const start=globeGroup.rotation.y, end=start+d, t0=performance.now();
  (function anim(now){
    const p=clamp((now-t0)/900,0,1);
    const e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
    globeGroup.rotation.y=start+(end-start)*e;
    if(p<1) requestAnimationFrame(anim);
  })(t0);
}

$$('.bodytoggle button').forEach(b=>{
  b.addEventListener('click',()=>{
    $$('.bodytoggle button').forEach(x=>{x.classList.remove('sel');x.setAttribute('aria-selected','false')});
    b.classList.add('sel'); b.setAttribute('aria-selected','true');
    buildGlobe(b.dataset.b);
    beep(b.dataset.b==='moon'?520:390,.05,.04);
  });
});
new IntersectionObserver(es=>{es.forEach(e=>{obsVisible=e.isIntersecting})},{threshold:.02}).observe($('#viewport'));
addEventListener('resize',()=>{ if(renderer) resizeRenderer(); });

/* ============================================================
   8. DOSSIER
   ============================================================ */
let curId=null;
function statusLabel(s){return{derelict:'Derelict',active:'Active',silent:'Silent',lost:'Lost',destroyed:'Destroyed'}[s]||s}
function openDossier(a, doFly){
  curId=a.id;
  const d=$('#dossier');
  $('#dIdx').textContent=String(idxOf(a.id)+1).padStart(2,'0')+' / '+order.length;
  $('#dTitle').textContent=a.n;
  const i=idxOf(a.id);
  $('#dPrev').disabled = i<=0; $('#dNext').disabled = i>=order.length-1;
  const specRows=a.spec.map(s=>'<div><dt>'+s[0]+'</dt><dd>'+s[1]+'</dd></div>').join('');
  const discRows=a.disc.map(x=>'<li>'+x+'</li>').join('');
  const coord = a.lat!==undefined ? Math.abs(a.lat).toFixed(2)+'° '+(a.lat>=0?'N':'S')+' · '+Math.abs(a.lon).toFixed(2)+'° '+(a.lon>=0?'E':'W') : (a.orbit||'—');
  $('#dBody').innerHTML =
   '<div class="dart"><div class="plate"></div>'+ (SCHEM[a.sch]||SCHEM.probe) +
   '<div class="caption"><span>'+ (a.b==='moon'?'LUNAR ARTEFACT':a.b==='mars'?'MARTIAN ARTEFACT':'DEEP SPACE VEHICLE') +'</span><span>'+a.ag+'</span></div></div>'+
   '<div class="dsec"><h4>First-person log</h4><p class="voice">'+a.voice+'</p></div>'+
   '<div class="dsec"><h4>Designation</h4><dl class="dspecs">'+
     '<div><dt>Object</dt><dd>'+a.n+'</dd></div>'+
     '<div><dt>Mission</dt><dd>'+a.m+'</dd></div>'+
     '<div><dt>Agency</dt><dd>'+a.ag+'</dd></div>'+
     '<div><dt>Year</dt><dd>'+a.y+'</dd></div>'+
     '<div><dt>Status</dt><dd><span class="st '+a.st+'">'+statusLabel(a.st)+'</span></dd></div>'+
     '<div><dt>'+(a.b==='deep'?'Trajectory':'Coordinates')+'</dt><dd>'+coord+'</dd></div>'+
     (a.site?'<div><dt>Site</dt><dd>'+a.site+'</dd></div>':'')+
   '</dl></div>'+
   '<div class="dsec"><h4>Technical record</h4><dl class="dspecs">'+specRows+'</dl></div>'+
   '<div class="dsec"><h4>What it made possible</h4><ol class="disc">'+discRows+'</ol></div>'+
   '<div class="dsec"><h4>Final transmission</h4><div class="lasttx" id="lastTx"></div></div>'+
   '<div class="dsec" style="border:0"><p class="mono" style="line-height:1.9">'+(a.tags||'')+'</p></div>';
  d.classList.add('open'); d.setAttribute('aria-hidden','false');
  $('#scrim').classList.add('on');
  typewrite($('#lastTx'), a.last, a.st);
  $$('.hot').forEach(h=>h.classList.remove('sel'));
  const hd=hotData.find(o=>o.id===a.id); if(hd){hd.el.classList.add('sel');hd.el.classList.add('pulse');setTimeout(()=>hd.el.classList.remove('pulse'),5200)}
  $$('.sitem').forEach(s=>s.classList.toggle('sel', s.dataset.id===a.id));
  $$('.tlcard').forEach(t=>t.classList.toggle('act', t.dataset.id===a.id));
  $('#hudSel').innerHTML='SELECTED · <b>'+a.n.toUpperCase()+'</b>';
  if(doFly && (a.b===curBody)) flyTo(a);
  else if(doFly && a.b!=='deep'){ const btn=$('.bodytoggle button[data-b="'+a.b+'"]'); if(btn && !btn.classList.contains('sel')) btn.click(); setTimeout(()=>flyTo(a),320); }
  d.querySelector('.dbody').scrollTop=0;
  beep(720,.05,.05);
}
function closeDossier(){ $('#dossier').classList.remove('open'); $('#dossier').setAttribute('aria-hidden','true'); $('#scrim').classList.remove('on');
  curId=null; $$('.hot').forEach(h=>h.classList.remove('sel')); $$('.sitem').forEach(s=>s.classList.remove('sel')); $('#hudSel').innerHTML='SELECTED · <b>NONE</b>'; }
$('#dClose').onclick=closeDossier; $('#scrim').onclick=closeDossier;
$('#dPrev').onclick=()=>{const i=idxOf(curId); if(i>0) openDossier(order[i-1],true)};
$('#dNext').onclick=()=>{const i=idxOf(curId); if(i<order.length-1) openDossier(order[i+1],true)};
addEventListener('keydown',e=>{
  if(e.key==='Escape') closeDossier();
  if($('#dossier').classList.contains('open')){
    if(e.key==='ArrowLeft') $('#dPrev').click();
    if(e.key==='ArrowRight') $('#dNext').click();
  }
  if(e.key==='/' && document.activeElement!==$('#search')){ e.preventDefault(); $('#search').focus(); }
});
function typewrite(el, text, st){
  if(RM){ el.innerHTML=text.replace(/\n/g,'<br>')+'<span class="meta">End of record</span>'; return; }
  el.textContent=''; let i=0;
  const col = st==='active'?'var(--moss)': st==='lost'||st==='destroyed'?'var(--rust)':'var(--amber)';
  el.style.color=col;
  const tick=()=>{
    if(i>=text.length){ el.insertAdjacentHTML('beforeend','<span class="meta">End of record</span>'); return; }
    el.textContent+=text[i++];
    if(i%3===0) blip();
    setTimeout(tick, text[i-1]==='\n'?90:14+Math.random()*16);
  };
  tick();
}
function selectArtifact(id,fly){ const a=byId(id); if(a) openDossier(a,!!fly); }

/* ============================================================
   9. SIDE LIST
   ============================================================ */
function buildSide(){
  const list=A.filter(a=>a.b===curBody).sort((x,y)=>x.y-y.y);
  $('#sideTitle').textContent='Artefacts on '+(curBody==='moon'?'the Moon':'Mars');
  $('#sideCnt').textContent=list.length+' / '+list.length;
  $('#sideList').innerHTML=list.map(a=>
   '<button class="sitem'+(a.id===curId?' sel':'')+'" data-id="'+a.id+'" role="option" aria-selected="false">'+
     '<span class="yr">'+a.y+'</span>'+
     '<span><span class="nm">'+a.n+'</span><span class="ms">'+a.m+'</span></span>'+
     '<span class="st '+a.st+'">'+statusLabel(a.st)+'</span>'+
   '</button>').join('');
  $$('.sitem').forEach(s=>s.addEventListener('click',()=>{ selectArtifact(s.dataset.id,true); }));
}

/* ============================================================
   10. FIELD GUIDE GRID
   ============================================================ */
const state={q:'',body:'all',status:'all',sort:'year-asc'};
function renderGrid(){
  let list=A.slice();
  if(state.body!=='all') list=list.filter(a=>a.b===state.body);
  if(state.status!=='all') list=list.filter(a=>a.st===state.status);
  if(state.q){
    const q=state.q.toLowerCase();
    list=list.filter(a=>(a.n+' '+a.m+' '+a.ag+' '+a.one+' '+(a.site||'')+' '+(a.orbit||'')+' '+a.tags+' '+a.y).toLowerCase().includes(q));
  }
  if(state.sort==='year-asc') list.sort((a,b)=>a.y-b.y);
  else if(state.sort==='year-desc') list.sort((a,b)=>b.y-a.y);
  else list.sort((a,b)=>a.n.localeCompare(b.n));
  $('#results').innerHTML='Showing <b>'+list.length+'</b> of '+A.length+' artefacts'+(state.q?' · matching “'+state.q.replace(/</g,'&lt;')+'”':'');
  $('#empty').classList.toggle('on', list.length===0);
  const grid=$('#grid');
  grid.style.display=list.length?'grid':'none';
  grid.innerHTML=list.map(a=>
   '<button class="acard" data-id="'+a.id+'">'+
     '<div class="top"><div class="glow"></div><span class="yrbadge">'+a.y+'</span>'+
       '<span class="bodybadge '+a.b+'">'+(a.b==='moon'?'Moon':a.b==='mars'?'Mars':'Deep space')+'</span>'+
       (SCHEM[a.sch]||SCHEM.probe)+'</div>'+
     '<div class="bd"><h3>'+a.n+'</h3><div class="ms">'+a.m+' · '+a.ag+'</div>'+
       '<p>'+a.one+'</p>'+
       '<div class="foot"><span class="st '+a.st+'">'+statusLabel(a.st)+'</span>'+
       '<span class="op">Dossier <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div></div>'+
   '</button>').join('');
  $$('.acard',grid).forEach(c=>c.addEventListener('click',()=>selectArtifact(c.dataset.id,true)));
}
$('#search').addEventListener('input',e=>{ state.q=e.target.value.trim(); $('#searchBox').classList.toggle('has',!!e.target.value); renderGrid(); });
$('#clearSearch').addEventListener('click',()=>{ $('#search').value=''; state.q=''; $('#searchBox').classList.remove('has'); renderGrid(); $('#search').focus(); });
$$('.chips [data-f="body"]').forEach(c=>c.addEventListener('click',()=>{
  $$('.chips [data-f="body"]').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); state.body=c.dataset.v; renderGrid(); beep(700,.03,.03);
}));
$$('.chips [data-f="status"]').forEach(c=>c.addEventListener('click',()=>{
  $$('.chips [data-f="status"]').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); state.status=c.dataset.v; renderGrid(); beep(560,.03,.03);
}));
$('#sortSel').addEventListener('change',e=>{state.sort=e.target.value;renderGrid()});
$('#resetFilters').addEventListener('click',()=>{
  state.q='';state.body='all';state.status='all';$('#search').value='';$('#searchBox').classList.remove('has');
  $$('.chips [data-f="body"]').forEach(x=>x.classList.toggle('sel',x.dataset.v==='all'));
  $$('.chips [data-f="status"]').forEach(x=>x.classList.toggle('sel',x.dataset.v==='all'));
  renderGrid();
});

/* ============================================================
   11. LEDGER
   ============================================================ */
function renderLedger(){
  $('#ledgerGrid').innerHTML=LEDGER.map((l,i)=>
   '<article class="lcard"><div class="no">'+String(i+1).padStart(2,'0')+' / '+LEDGER.length+'</div>'+
   '<div class="icn">'+(ICO[l.ic]||ICO.plaque)+'</div>'+
   '<h4>'+l.t+'</h4><p style="font-family:var(--ff-m);font-size:9.5px;letter-spacing:.16em;color:var(--amber);text-transform:uppercase;margin-bottom:12px">'+l.y+'</p>'+
   '<p>'+l.p+'</p></article>').join('');
}

/* ============================================================
   12. TIMELINE
   ============================================================ */
let tlFilter='all';
function renderTimeline(){
  const list=order.filter(a=>tlFilter==='all'||a.b===tlFilter);
  $('#tlCount').textContent=list.length+' events';
  const decades={};
  list.forEach(a=>{const d=Math.floor(a.y/10)*10;(decades[d]=decades[d]||[]).push(a)});
  const keys=Object.keys(decades).map(Number).sort((a,b)=>a-b);
  const track=$('#track'); track.innerHTML='';
  keys.forEach(dk=>{
    const era=document.createElement('div'); era.className='era';
    era.innerHTML='<div class="era-tag">'+dk+'s</div><div class="tl-items">'+
      decades[dk].map(a=>
       '<button class="tlcard'+(a.id===curId?' act':'')+'" data-id="'+a.id+'"><span class="tick"></span>'+
       '<div class="y">'+a.y+'</div><h4>'+a.n+'</h4><div class="sub">'+a.m+'</div><p>'+a.one+'</p>'+
       '<div class="go">Open dossier →</div></button>').join('')+'</div>';
    track.appendChild(era);
  });
  $$('.tlcard').forEach(c=>{
    c.addEventListener('click',()=>{ selectArtifact(c.dataset.id,true); setCaption(byId(c.dataset.id)); });
    c.addEventListener('mouseenter',()=>setCaption(byId(c.dataset.id)));
  });
}
function setCaption(a){
  if(!a) return;
  $('#tlCaption').innerHTML='<b>'+a.y+' · '+a.m+' · '+a.ag+'</b>'+a.voice.split('.')[0].replace(/^I /,'This machine ').replace(/^My /,'Its ').replace(/^We /,'They ')+'.';
}
$$('#tlChips .chip').forEach(c=>c.addEventListener('click',()=>{
  $$('#tlChips .chip').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); tlFilter=c.dataset.tl; renderTimeline();
}));

(function(){
  const el=$('#railScroll'); let down=false,sx=0,sl=0;
  el.addEventListener('pointerdown',e=>{ if(e.target.closest('.tlcard'))return; down=true;sx=e.clientX;sl=el.scrollLeft;el.classList.add('drag')});
  addEventListener('pointerup',()=>{down=false;el.classList.remove('drag')});
  el.addEventListener('pointermove',e=>{ if(!down)return; el.scrollLeft=sl-(e.clientX-sx); });
  el.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){el.scrollBy({left:280,behavior:'smooth'});e.preventDefault()}
    if(e.key==='ArrowLeft'){el.scrollBy({left:-280,behavior:'smooth'});e.preventDefault()}
  });
})();

let playing=false, playTween=null;
$('#playBtn').addEventListener('click',()=>{
  playing=!playing;
  const b=$('#playBtn'); b.classList.toggle('playing',playing); b.setAttribute('aria-pressed',playing);
  $('#playLabel').textContent=playing?'Pause':'Playback';
  $('#playIcon').innerHTML=playing?'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>':'<path d="M7 4l13 8-13 8z"/>';
  if(playing) runPlayback(); else if(playTween) playTween.kill();
});
function runPlayback(){
  const el=$('#railScroll'); const cards=$$('.tlcard'); if(!cards.length) return;
  const max=el.scrollWidth-el.clientWidth;
  let i=0;
  const go=()=>{
    if(!playing||i>=cards.length){ if(playing){playing=false;$('#playBtn').classList.remove('playing');$('#playLabel').textContent='Playback';$('#playIcon').innerHTML='<path d="M7 4l13 8-13 8z"/>'} return; }
    const c=cards[i];
    cards.forEach(x=>x.classList.remove('act')); c.classList.add('act');
    const a=byId(c.dataset.id); setCaption(a);
    playTween=gsap.to(el,{scrollLeft:Math.min(max, c.offsetLeft-el.clientWidth*0.32),duration:1.1,ease:'power2.inOut', onComplete:()=>{ beep(430+i*4,.05,.03); }});
    i++;
    setTimeout(go, RM?900:2200);
  };
  go();
}

/* ============================================================
   13. SCIENCE LIST
   ============================================================ */
function renderScience(){
  $('#scienceList').innerHTML=SCI.map(s=>{
    const a=byId(s[0]);
    return '<button class="srow" data-id="'+s[0]+'">'+
      '<span class="hw">'+s[1]+'<small>'+(a?a.ag:'')+'</small></span>'+
      '<span class="ds">'+s[3]+'</span>'+
      '<span class="yr">'+s[2]+'</span></button>';
  }).join('');
  $$('.srow').forEach(r=>r.addEventListener('click',()=>selectArtifact(r.dataset.id,true)));
}

/* ============================================================
   14. LIVE COUNTERS
   ============================================================ */
const AU=149597870.7, C=299792.458;
const V1_EPOCH=Date.UTC(2026,10,18,10,16,7), V1_KM=25902068371.2, V1_RATE=16.6;
const V2_EPOCH=Date.UTC(2026,1,15,0,0,0),     V2_KM=143.05*AU,      V2_RATE=15.3;
const NH_EPOCH=Date.UTC(2026,10,12,0,0,0),    NH_KM=62.9*AU,        NH_RATE=13.6;
function liveNumbers(){
  const now=Date.now(), t=(now-V1_EPOCH)/1000;
  const v1=V1_KM+V1_RATE*t, v2=V2_KM+V2_RATE*((now-V2_EPOCH)/1000), nh=NH_KM+NH_RATE*((now-NH_EPOCH)/1000);
  const s1=$('#v1km'), s2=$('#v2km'), s3=$('#nhkm');
  if(s1) s1.textContent=nf(Math.round(v1));
  if(s2) s2.textContent=nf(Math.round(v2));
  if(s3) s3.textContent=nf(Math.round(nh));
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

function buildTicker(){
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
  document.querySelectorAll('[data-tick-v1]').forEach(e=>e.textContent=nf(Math.round(v1)));
  document.querySelectorAll('[data-tick-nh]').forEach(e=>e.textContent=nf(Math.round(nh)));
},1000);

/* ============================================================
   15. HELIOSPHERE DIAGRAM
   ============================================================ */
function buildHelio(){
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
function buildRecord(){
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

/* ============================================================
   17. AUDIO
   ============================================================ */
let AC=null, masterGain=null, droneOn=false;
function audioInit(){
  if(AC) return;
  const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return;
  AC=new Ctx(); masterGain=AC.createGain(); masterGain.gain.value=0.0; masterGain.connect(AC.destination);
}
function beep(freq=660,dur=.04,vol=.05){
  if(!AC||!droneOn) return;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type='sine'; o.frequency.value=freq;
  g.gain.setValueAtTime(0,AC.currentTime);
  g.gain.linearRampToValueAtTime(vol,AC.currentTime+.006);
  g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+dur);
  o.connect(g); g.connect(masterGain); o.start(); o.stop(AC.currentTime+dur+.02);
}
function blip(){ if(!AC||!droneOn) return; if(Math.random()>.35) return; beep(1100+Math.random()*700,.014,.014); }
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

/* ============================================================
   18. AFTER BOOT
   ============================================================ */
function initAfterBoot(){
  starCanvas($('#stars'), 0.00038, 0);
  const epi=$('#epiCanvas'); if(epi) starCanvas(epi,0.00022,2.2);

  $$('.count').forEach(el=>{
    const to=+el.dataset.to, sfx=el.dataset.suffix||'';
    const io=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){
      if(RM){ el.textContent=nf(to)+sfx; return; }
      gsap.fromTo(el,{innerText:0},{innerText:to,duration:2.1,ease:'power2.out',snap:{innerText:1}, onUpdate(){el.textContent=nf(Math.round(+el.innerText))+sfx}});
      io.disconnect();
    }})},{threshold:.4}); io.observe(el);
  });

  const io2=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){
    const spans=e.target.querySelectorAll('.lm>span');
    spans.forEach((s,i)=>gsap.to(s,{y:0,opacity:1,duration:RM?0:1.05,delay:RM?0:i*.11,ease:'expo.out'}));
    io2.unobserve(e.target);
  }})},{threshold:.2});
  $$('.h1,.h2,.herotitle').forEach(h=>io2.observe(h));

  const io3=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io3.unobserve(e.target);} })},{threshold:.08,rootMargin:'0px 0px -8% 0px'});
  $$('[data-reveal]').forEach(el=>io3.observe(el));

  const io4=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting){ scramble(e.target); io4.unobserve(e.target);} })},{threshold:.6});
  $$('[data-scramble]').forEach(el=>io4.observe(el));

  if(!RM){
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
      window.scrollTo({top:t.getBoundingClientRect().top+scrollY-40,behavior:RM?'auto':'smooth'});
    });
  });

  $$('.navlinks a').forEach(a=>a.addEventListener('click',e=>{
    const t=$(a.getAttribute('href')); if(!t) return; e.preventDefault();
    $('#navlinks').classList.remove('open'); $('#burger').setAttribute('aria-expanded','false');
    window.scrollTo({top:t.getBoundingClientRect().top+scrollY-40,behavior:RM?'auto':'smooth'});
  }));
  $('#burger').addEventListener('click',()=>{
    const open=$('#navlinks').classList.toggle('open');
    $('#burger').setAttribute('aria-expanded',open);
  });

  if(matchMedia('(pointer:fine)').matches && !RM){
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

/* ============================================================
   19. GLOBAL INIT
   ============================================================ */
function boot(){
  $$('[data-total]').forEach(el=>{ el.textContent=A.length; });
  const hc=$('#heroCount'); if(hc) hc.dataset.to=A.length;

  try{ initThree(); }catch(err){ console.warn('WebGL unavailable:',err); $('#vpLoad').textContent='WebGL unavailable — dossiers still available in the Field Guide'; }
  renderLedger(); renderGrid(); renderTimeline(); renderScience();
  buildSide();
  try{ renderLoop(); }catch(e){}
  $('#fDate').textContent=new Date().toUTCString();
  runBoot();
}
if(document.readyState==='loading') addEventListener('DOMContentLoaded',boot); else boot();
