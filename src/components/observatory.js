import * as THREE from 'three';
import { A, byId, idxOf, isNASARecord, order, statusLabel } from '../data/artifacts.js';
import { SCHEM } from '../data/artwork.js';
import { $, $$ } from '../lib/dom.js';
import { selectArtifact, onArtifactSelection } from '../lib/events.js';
import { archiveState } from '../lib/state.js';
import { clamp, lerp, mulberry32, reducedMotion } from '../lib/utils.js';
import { generateMars, generateMoon, toBump } from './planet-textures.js';
import { beep, blip } from './audio.js';

const assetPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

/* ============================================================
   7. THREE.JS OBSERVATORY
   ============================================================ */
let renderer,scene,camera,globeGroup,mesh,glowMesh,gratGroup,sunLight;
let textures = {}, hotData = [], camSph = { r: 2.9, th: 0.35, ph: Math.PI / 2.15 };
let target={r:2.9,th:0.35,ph:Math.PI/2.15}, autoSpin=!reducedMotion, dragging=false, lastP=null, idle=0;
let obsVisible=false, rafId=null;
let pageVisible = !document.hidden;

export function initObservatory(){
  if (typeof THREE === 'undefined') throw new Error('Three.js did not load.');
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
  archiveState.currentBody=body;
  if(mesh){ globeGroup.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
  if(glowMesh){ globeGroup.remove(glowMesh); glowMesh.material.dispose(); }
  if(!textures[body]){
    // Color comes from local, credited archival maps. Procedural canvas data is
    // retained only as a lightweight bump approximation for the interaction.
    const W=1600, H=W/2;
    const proceduralHeightMap = body==='moon' ? generateMoon(W,H) : generateMars(W,H);
    const bump = toBump(proceduralHeightMap);
    const source = body === 'moon'
      ? assetPath('/assets/textures/moon-lroc-color.jpg')
      : assetPath('/assets/textures/mars-usgs-mola-map.jpg');
    const map = new THREE.TextureLoader().load(source);
    textures[body]={
      map,
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
  $('#hudTexture').innerHTML = body === 'moon'
    ? 'COLOR MAP · <b>NASA LRO / SVS</b>'
    : 'COLOR MAP · <b>NASA/USGS MOLA</b>';
  // The procedural bump canvas is generated synchronously. Toggling the
  // overlay after that work only leaves a stale loading scrim over an already
  // rendered globe on slower mobile devices, so remove it immediately once
  // the map/material has been installed.
  $('#vpLoad').classList.add('gone');
  buildHotspots();
  buildSide();
}
function buildHotspots(){
  const wrap=$('#hotspots'); wrap.innerHTML=''; hotData=[];
  // The immersive surface view follows the NASA-first default. Other-agency
  // contextual records remain discoverable through the explicit Field Guide toggle.
  const list=A.filter(a=>a.b===archiveState.currentBody && a.lat!==undefined && isNASARecord(a));
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
export function startObservatoryRenderLoop(){
  if (!pageVisible) {
    rafId = null;
    return;
  }
  rafId=requestAnimationFrame(startObservatoryRenderLoop);
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
document.addEventListener('visibilitychange', () => {
  pageVisible = !document.hidden;
  if (!pageVisible && rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (pageVisible && renderer && !rafId) startObservatoryRenderLoop();
});

/* ============================================================
   8. DOSSIER
   ============================================================ */
function openDossier(a, doFly){
  archiveState.selectedArtifactId=a.id;
  const d=$('#dossier');
  $('#dIdx').textContent=String(idxOf(a.id)+1).padStart(2,'0')+' / '+order.length;
  $('#dTitle').textContent=a.n;
  const i=idxOf(a.id);
  $('#dPrev').disabled = i<=0; $('#dNext').disabled = i>=order.length-1;
  const specRows = a.spec.map((item) => `<div><dt>${item[0]}</dt><dd>${item[1]}</dd></div>`).join('');
  const discoveryRows = a.disc.map((item) => `<li>${item}</li>`).join('');
  const coordinates = a.lat !== undefined
    ? `${Math.abs(a.lat).toFixed(2)}° ${a.lat >= 0 ? 'N' : 'S'} · ${Math.abs(a.lon).toFixed(2)}° ${a.lon >= 0 ? 'E' : 'W'}`
    : (a.orbit || '—');
  const imageFlag = a.imageSpecific
    ? '<span class="image-flag verified">NASA ARTEFACT-SPECIFIC IMAGE</span>'
    : a.imageMission
      ? '<span class="image-flag">NASA MISSION IMAGE · NOT A PHOTOGRAPH OF THIS ARTEFACT</span>'
      : '<span class="image-flag">PLACEHOLDER · NO ARTEFACT-SPECIFIC NASA IMAGE AUDITED</span>';
  const evidence = a.verifiedByNASA
    ? `<div class="dsec"><h4>First-person log</h4><p class="voice">${a.voice}</p></div>
       <div class="dsec"><h4>Technical record</h4><dl class="dspecs">${specRows}</dl></div>
       <div class="dsec"><h4>What it made possible</h4><ol class="disc">${discoveryRows}</ol></div>
       <div class="dsec"><h4>Final transmission</h4><div class="lasttx" id="lastTx"></div></div>
       <div class="dsec" style="border:0"><p class="mono" style="line-height:1.9">${a.tags || ''}</p></div>`
    : `<div class="dsec unverified-record"><h4>Verification status</h4><p><b>Claim review incomplete.</b> An agency label or a related NASA page is not treated as verification. This entry's mission narrative, technical figures, locations, status, and discovery claims are withheld until each visible claim is checked against an opened NASA source.</p></div>`;

  $('#dBody').innerHTML = `
    <figure class="dossier-media">
      <img src="${a.image}" alt="${a.imageAlt}" width="960" height="540" loading="lazy" decoding="async" />
      <figcaption>${imageFlag}<span>${a.imageCredit}</span>${a.imageSource ? `<a href="${a.imageSource}" target="_blank" rel="noreferrer">Image source ↗</a>` : ''}</figcaption>
    </figure>
    <div class="dsec dossier-source"><h4>Sources</h4><a href="${a.source}" target="_blank" rel="noreferrer">Open ${a.sourceLabel} <span aria-hidden="true">↗</span></a><p>${a.verifiedByNASA ? 'Every visible factual claim below was checked against this opened NASA source.' : 'Visible narrative, dates, status, locations, and technical figures are withheld until an opened NASA source supports the full record.'}</p></div>
    <div class="dart"><div class="plate"></div>${SCHEM[a.sch] || SCHEM.probe}
      <div class="caption"><span>${a.b === 'moon' ? 'LUNAR ARTEFACT' : a.b === 'mars' ? 'MARTIAN ARTEFACT' : 'DEEP SPACE VEHICLE'}</span><span>${a.ag}</span></div>
    </div>
    <div class="dsec"><h4>Designation</h4><dl class="dspecs">${a.verifiedByNASA ? `
      <div><dt>Object</dt><dd>${a.n}</dd></div><div><dt>Mission</dt><dd>${a.m}</dd></div>
      <div><dt>Agency</dt><dd>${a.ag}</dd></div><div><dt>Year</dt><dd>${a.y}</dd></div>
      <div><dt>Status</dt><dd><span class="st ${a.st}">${statusLabel(a.st)}</span></dd></div>
      <div><dt>${a.b === 'deep' ? 'Trajectory' : 'Coordinates'}</dt><dd>${coordinates}</dd></div>
      ${a.site ? `<div><dt>Site</dt><dd>${a.site}</dd></div>` : ''}` : `
      <div><dt>Object</dt><dd>${a.n}</dd></div><div><dt>Audit</dt><dd>Claim review in progress</dd></div>`}
    </dl></div>
    ${evidence}`;
  const dossierImage = $('#dBody .dossier-media img');
  dossierImage?.addEventListener('error', () => {
    dossierImage.src = assetPath('/assets/images/dossier-context-placeholder.svg');
    dossierImage.alt = 'NASA image placeholder — artefact-specific image pending source verification';
    const imageFlag = $('#dBody .image-flag');
    if (imageFlag) imageFlag.textContent = 'NASA IMAGE PLACEHOLDER · SOURCE IMAGE FAILED TO LOAD';
  }, { once: true });
  d.classList.add('open'); d.setAttribute('aria-hidden','false');
  $('#scrim').classList.add('on');
  if (a.verifiedByNASA) typewrite($('#lastTx'), a.last, a.st);
  $$('.hot').forEach(h=>h.classList.remove('sel'));
  const hd=hotData.find(o=>o.id===a.id); if(hd){hd.el.classList.add('sel');hd.el.classList.add('pulse');setTimeout(()=>hd.el.classList.remove('pulse'),5200)}
  $$('.sitem').forEach(s=>s.classList.toggle('sel', s.dataset.id===a.id));
  $$('.tlcard').forEach(t=>t.classList.toggle('act', t.dataset.id===a.id));
  $('#hudSel').innerHTML='SELECTED · <b>'+a.n.toUpperCase()+'</b>';
  if(doFly && (a.b===archiveState.currentBody)) flyTo(a);
  else if(doFly && a.b!=='deep'){ const btn=$('.bodytoggle button[data-b="'+a.b+'"]'); if(btn && !btn.classList.contains('sel')) btn.click(); setTimeout(()=>flyTo(a),320); }
  d.querySelector('.dbody').scrollTop=0;
  beep(720,.05,.05);
}
function closeDossier(){ $('#dossier').classList.remove('open'); $('#dossier').setAttribute('aria-hidden','true'); $('#scrim').classList.remove('on');
  archiveState.selectedArtifactId=null; $$('.hot').forEach(h=>h.classList.remove('sel')); $$('.sitem').forEach(s=>s.classList.remove('sel')); $('#hudSel').innerHTML='SELECTED · <b>NONE</b>'; }
$('#dClose').onclick=closeDossier; $('#scrim').onclick=closeDossier;
$('#dPrev').onclick=()=>{const i=idxOf(archiveState.selectedArtifactId); if(i>0) openDossier(order[i-1],true)};
$('#dNext').onclick=()=>{const i=idxOf(archiveState.selectedArtifactId); if(i<order.length-1) openDossier(order[i+1],true)};
addEventListener('keydown',e=>{
  if(e.key==='Escape') closeDossier();
  if($('#dossier').classList.contains('open')){
    if(e.key==='ArrowLeft') $('#dPrev').click();
    if(e.key==='ArrowRight') $('#dNext').click();
  }
  if(e.key==='/' && document.activeElement!==$('#search')){ e.preventDefault(); $('#search').focus(); }
});
function typewrite(el, text, st){
  if(reducedMotion){ el.innerHTML=text.replace(/\n/g,'<br>')+'<span class="meta">End of record</span>'; return; }
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

/* ============================================================
   9. SIDE LIST
   ============================================================ */
function buildSide(){
  const list=A.filter(a=>a.b===archiveState.currentBody && isNASARecord(a)).sort((x,y)=>x.y-y.y);
  $('#sideTitle').textContent='Artefacts on '+(archiveState.currentBody==='moon'?'the Moon':'Mars');
  $('#sideCnt').textContent=list.length+' / '+list.length;
  $('#sideList').innerHTML=list.map(a=> {
    const year = a.verifiedByNASA ? a.y : '—';
    const mission = a.verifiedByNASA ? a.m : 'NASA source review pending';
    const status = a.verifiedByNASA ? `<span class="st ${a.st}">${statusLabel(a.st)}</span>` : '<span class="unverified-chip">Audit pending</span>';
    return `<button class="sitem${a.id===archiveState.selectedArtifactId?' sel':''}" data-id="${a.id}" role="option" aria-selected="false">
      <span class="yr">${year}</span><span><span class="nm">${a.n}</span><span class="ms">${mission}</span></span>${status}
    </button>`;
  }).join('');
  $$('.sitem').forEach(s=>s.addEventListener('click',()=>{ selectArtifact(s.dataset.id,true); }));
}



/** The dossier is the selection endpoint for every independent archive component. */
onArtifactSelection(({ id, flyToLocation }) => {
  const artifact = byId(id);
  if (artifact) openDossier(artifact, Boolean(flyToLocation));
});
