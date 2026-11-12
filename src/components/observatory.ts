import * as THREE from 'three';
import { A, byId, idxOf, isNASARecord, order, statusLabel } from '../data/artifacts';
import { SCHEM } from '../data/artwork';
import { $, $$ } from '../lib/dom';
import { onArtifactSelection, selectArtifact } from '../lib/events';
import { archiveState } from '../lib/state';
import { clamp, lerp, mulberry32, reducedMotion } from '../lib/utils';
import type { Artifact } from '../types/archive';
import { generateMars, generateMoon, toBump } from './planet-textures';
import { beep, blip } from './audio';

type SurfaceBody = 'moon' | 'mars';

interface CameraSpherical {
  radius: number;
  azimuth: number;
  polar: number;
}

interface PlanetTextures {
  map: THREE.Texture;
  bump: THREE.CanvasTexture;
}

interface Hotspot {
  element: HTMLButtonElement;
  position: THREE.Vector3;
  id: string;
}

interface PointerPosition {
  x: number;
  y: number;
}

const assetPath = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const initialCamera: CameraSpherical = { radius: 2.9, azimuth: .35, polar: Math.PI / 2.15 };

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let globeGroup: THREE.Group | null = null;
let surfaceMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> | null = null;
let glowMesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null = null;
let graticuleGroup: THREE.Group | null = null;
const textures: Partial<Record<SurfaceBody, PlanetTextures>> = {};
let hotspots: Hotspot[] = [];
let cameraState: CameraSpherical = { ...initialCamera };
let targetCamera: CameraSpherical = { ...initialCamera };
let autoSpin = !reducedMotion;
let dragging = false;
let lastPointer: PointerPosition | null = null;
let observatoryVisible = false;
let frameId: number | null = null;
let pageVisible = !document.hidden;
let initialized = false;
let cleanupSelection: (() => void) | null = null;
let viewportObserver: IntersectionObserver | null = null;

const projectedPosition = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const normalizedPosition = new THREE.Vector3();
const normalizedCamera = new THREE.Vector3();

function hasCoordinates(artifact: Artifact): artifact is Artifact & { lat: number; lon: number } {
  return artifact.lat !== undefined && artifact.lon !== undefined;
}

function latLongToVector(latitude: number, longitude: number, radius: number): THREE.Vector3 {
  const u = (longitude + 180) / 360;
  const v = (90 - latitude) / 180;
  const phi = u * Math.PI * 2;
  const theta = v * Math.PI;
  return new THREE.Vector3(-radius * Math.cos(phi) * Math.sin(theta), radius * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta));
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function resizeRenderer(): void {
  const viewport = $<HTMLElement>('#viewport');
  if (!renderer || !camera) return;
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function createStarField(): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const random = mulberry32(4242);
  for (let index = 0; index < 2600; index += 1) {
    const vertical = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const radial = Math.sqrt(1 - vertical * vertical);
    const distance = 26 + random() * 30;
    positions.push(Math.cos(angle) * radial * distance, vertical * distance, Math.sin(angle) * radial * distance);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xbfd0e8, size: .075, sizeAttenuation: true, transparent: true, opacity: .85 }));
}

function createGraticule(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: .10 });
  const radius = 1.004;
  const segments: THREE.Vector3[][] = [];
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const points: THREE.Vector3[] = [];
    for (let longitude = -180; longitude <= 180; longitude += 4) points.push(latLongToVector(latitude, longitude, radius));
    segments.push(points);
  }
  for (let longitude = -180; longitude < 180; longitude += 30) {
    const points: THREE.Vector3[] = [];
    for (let latitude = -90; latitude <= 90; latitude += 4) points.push(latLongToVector(latitude, longitude, radius));
    segments.push(points);
  }
  segments.forEach((points) => group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material)));
  return group;
}

function loadTextures(body: SurfaceBody): PlanetTextures {
  const cached = textures[body];
  if (cached) return cached;
  const width = 1600;
  const proceduralMap = body === 'moon' ? generateMoon(width, width / 2) : generateMars(width, width / 2);
  const bump = new THREE.CanvasTexture(toBump(proceduralMap));
  const mapSource = body === 'moon' ? assetPath('/assets/textures/moon-lroc-color.jpg') : assetPath('/assets/textures/mars-usgs-mola-map.jpg');
  const map = new THREE.TextureLoader().load(mapSource);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  bump.anisotropy = 2;
  const loaded = { map, bump };
  textures[body] = loaded;
  return loaded;
}

function buildGlobe(body: SurfaceBody): void {
  if (!globeGroup) return;
  archiveState.currentBody = body;
  if (surfaceMesh) {
    globeGroup.remove(surfaceMesh);
    surfaceMesh.geometry.dispose();
    surfaceMesh.material.dispose();
  }
  if (glowMesh) {
    globeGroup.remove(glowMesh);
    glowMesh.geometry.dispose();
    glowMesh.material.dispose();
  }
  const texture = loadTextures(body);
  const geometry = new THREE.SphereGeometry(1, 96, 72);
  const material = new THREE.MeshStandardMaterial({ map: texture.map, bumpMap: texture.bump, bumpScale: body === 'moon' ? .035 : .028, roughness: .94, metalness: .02, color: 0xffffff });
  surfaceMesh = new THREE.Mesh(geometry, material);
  globeGroup.add(surfaceMesh);

  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: { c: { value: .42 }, p: { value: 2.6 }, gc: { value: new THREE.Color(body === 'moon' ? 0x9fc0e8 : 0xff8a5c) } },
    vertexShader: 'varying vec3 vNormal; varying vec3 vPosition; void main(){ vNormal=normalize(normalMatrix*normal); vec4 modelView=modelViewMatrix*vec4(position,1.0); vPosition=modelView.xyz; gl_Position=projectionMatrix*modelView; }',
    fragmentShader: 'uniform vec3 gc; uniform float c; uniform float p; varying vec3 vNormal; varying vec3 vPosition; void main(){ vec3 viewDirection=normalize(-vPosition); float intensity=pow(c-dot(vNormal,viewDirection),p); gl_FragColor=vec4(gc,1.0)*clamp(intensity,0.0,1.0); }',
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  glowMesh = new THREE.Mesh(new THREE.SphereGeometry(body === 'moon' ? 1.06 : 1.09, 64, 48), glowMaterial);
  globeGroup.add(glowMesh);

  $('#hudBody').innerHTML = `BODY · <b>${body === 'moon' ? 'THE MOON' : 'MARS'}</b>`;
  $('#hudSite').innerHTML = body === 'moon' ? 'MEAN RADIUS · <b>1,737.4 KM</b>' : 'MEAN RADIUS · <b>3,389.5 KM</b>';
  $('#hudTexture').innerHTML = body === 'moon' ? 'COLOR MAP · <b>NASA LRO / SVS</b>' : 'COLOR MAP · <b>NASA/USGS MOLA</b>';
  $('#vpLoad').classList.add('gone');
  buildHotspots();
  buildSide();
}

function buildHotspots(): void {
  const wrapper = $<HTMLElement>('#hotspots');
  wrapper.innerHTML = '';
  hotspots = [];
  const list = A.filter((artifact) => artifact.b === archiveState.currentBody).filter(hasCoordinates).filter(isNASARecord);
  list.forEach((artifact) => {
    const button = document.createElement('button');
    button.className = `hot${artifact.st === 'active' ? ' act' : ''}`;
    button.innerHTML = `<span class="ring"></span><span class="dot"></span><span class="lbl">${artifact.n}</span>`;
    button.setAttribute('aria-label', `${artifact.n} — ${artifact.site}`);
    button.addEventListener('click', (event: MouseEvent) => { event.stopPropagation(); selectArtifact(artifact.id, true); });
    button.addEventListener('mouseenter', () => beep(880, .03, .02));
    wrapper.appendChild(button);
    hotspots.push({ element: button, position: latLongToVector(artifact.lat, artifact.lon, 1.012), id: artifact.id });
  });
  $('#hudCount').innerHTML = `MARKERS · <b>${list.length}</b>`;
}

function setBodyToggle(body: SurfaceBody): void {
  $$<HTMLButtonElement>('.bodytoggle button').forEach((button) => {
    const selected = button.dataset.b === body;
    button.classList.toggle('sel', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}

function attachControls(canvas: HTMLCanvasElement): void {
  canvas.addEventListener('pointerdown', (event: PointerEvent) => {
    dragging = true;
    canvas.classList.add('drag');
    lastPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  const releasePointer = (): void => { dragging = false; lastPointer = null; canvas.classList.remove('drag'); };
  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('pointermove', (event: PointerEvent) => {
    if (!dragging || !lastPointer) return;
    const deltaX = event.clientX - lastPointer.x;
    const deltaY = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    targetCamera.azimuth -= deltaX * .006;
    targetCamera.polar = clamp(targetCamera.polar - deltaY * .006, .35, Math.PI - .35);
  });
  canvas.addEventListener('wheel', (event: WheelEvent) => {
    event.preventDefault();
    targetCamera.radius = clamp(targetCamera.radius + event.deltaY * .0016, 1.42, 5.2);
  }, { passive: false });
  $<HTMLButtonElement>('#btnZoomIn').onclick = () => { targetCamera.radius = clamp(targetCamera.radius - .3, 1.42, 5.2); beep(660, .03, .03); };
  $<HTMLButtonElement>('#btnZoomOut').onclick = () => { targetCamera.radius = clamp(targetCamera.radius + .3, 1.42, 5.2); beep(520, .03, .03); };
  $<HTMLButtonElement>('#btnSpin').onclick = (event: MouseEvent) => {
    autoSpin = !autoSpin;
    const button = event.currentTarget;
    if (button instanceof HTMLButtonElement) button.style.color = autoSpin ? 'var(--amber)' : '';
    beep(autoSpin ? 760 : 420, .04, .03);
  };
  $<HTMLButtonElement>('#btnReset').onclick = () => {
    targetCamera = { ...initialCamera };
    if (globeGroup) globeGroup.rotation.y = 0;
    beep(600, .04, .03);
  };
}

function flyTo(artifact: Artifact): void {
  if (!hasCoordinates(artifact) || !globeGroup) return;
  const longitude = ((artifact.lon + 180) / 360) * Math.PI * 2;
  const desiredAzimuth = longitude - Math.PI / 2;
  const currentRotation = globeGroup.rotation.y;
  const difference = ((desiredAzimuth - currentRotation) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  targetCamera.radius = Math.min(targetCamera.radius, 2.35);
  targetCamera.polar = clamp((90 - artifact.lat) * Math.PI / 180, .45, Math.PI - .45);
  autoSpin = false;
  $<HTMLButtonElement>('#btnSpin').style.color = '';
  const endRotation = currentRotation + difference;
  const startedAt = performance.now();
  const animate = (now: number): void => {
    if (!globeGroup) return;
    const progress = clamp((now - startedAt) / 900, 0, 1);
    const eased = progress < .5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    globeGroup.rotation.y = currentRotation + (endRotation - currentRotation) * eased;
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

export function startObservatoryRenderLoop(): void {
  const activeRenderer = renderer;
  const activeCamera = camera;
  const activeScene = scene;
  const activeGlobe = globeGroup;
  if (!pageVisible || !activeRenderer || !activeCamera || !activeScene || !activeGlobe) { frameId = null; return; }
  frameId = requestAnimationFrame(startObservatoryRenderLoop);
  if (!observatoryVisible) return;
  const viewport = $<HTMLElement>('#viewport');
  if (viewport.clientWidth !== activeRenderer.domElement.clientWidth || viewport.clientHeight !== activeRenderer.domElement.clientHeight) resizeRenderer();
  if (autoSpin && !dragging) activeGlobe.rotation.y += .0016;
  cameraState.radius = lerp(cameraState.radius, targetCamera.radius, .09);
  cameraState.azimuth = lerp(cameraState.azimuth, targetCamera.azimuth, .11);
  cameraState.polar = lerp(cameraState.polar, targetCamera.polar, .11);
  activeCamera.position.set(
    cameraState.radius * Math.sin(cameraState.polar) * Math.cos(cameraState.azimuth),
    cameraState.radius * Math.cos(cameraState.polar),
    cameraState.radius * Math.sin(cameraState.polar) * Math.sin(cameraState.azimuth),
  );
  activeCamera.lookAt(0, 0, 0);
  activeCamera.getWorldPosition(cameraPosition);
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  hotspots.forEach((hotspot) => {
    projectedPosition.copy(hotspot.position);
    activeGlobe.localToWorld(projectedPosition);
    normalizedPosition.copy(projectedPosition).normalize();
    normalizedCamera.copy(cameraPosition).normalize();
    const facing = normalizedPosition.dot(normalizedCamera);
    projectedPosition.project(activeCamera);
    hotspot.element.style.left = `${(projectedPosition.x * .5 + .5) * width}px`;
    hotspot.element.style.top = `${(-projectedPosition.y * .5 + .5) * height}px`;
    hotspot.element.classList.toggle('behind', facing < .06 || projectedPosition.z > 1);
    hotspot.element.style.zIndex = String(Math.round(1000 + facing * 400));
  });
  activeRenderer.render(activeScene, activeCamera);
}

function openDossier(artifact: Artifact, shouldFly: boolean): void {
  archiveState.selectedArtifactId = artifact.id;
  const dossier = $('#dossier');
  const index = idxOf(artifact.id);
  $('#dIdx').textContent = `${String(index + 1).padStart(2, '0')} / ${order.length}`;
  $('#dTitle').textContent = artifact.n;
  $<HTMLButtonElement>('#dPrev').disabled = index <= 0;
  $<HTMLButtonElement>('#dNext').disabled = index >= order.length - 1;
  const specificationRows = artifact.spec.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  const discoveryRows = artifact.disc.map((item) => `<li>${item}</li>`).join('');
  const coordinates = hasCoordinates(artifact)
    ? `${Math.abs(artifact.lat).toFixed(2)}° ${artifact.lat >= 0 ? 'N' : 'S'} · ${Math.abs(artifact.lon).toFixed(2)}° ${artifact.lon >= 0 ? 'E' : 'W'}`
    : (artifact.orbit || '—');
  const imageFlag = artifact.imageSpecific
    ? '<span class="image-flag verified">NASA ARTEFACT-SPECIFIC IMAGE</span>'
    : artifact.imageMission
      ? '<span class="image-flag">NASA MISSION IMAGE · NOT A PHOTOGRAPH OF THIS ARTEFACT</span>'
      : '<span class="image-flag">PLACEHOLDER · NO ARTEFACT-SPECIFIC NASA IMAGE AUDITED</span>';
  const evidence = artifact.verifiedByNASA
    ? `<section class="dsec dossier-story"><h3>The story</h3><p>${artifact.story}</p></section>
       <section class="dsec nasa-facts"><h3>NASA-checked facts</h3>
         <p class="voice facts-summary">${artifact.voice}</p>
         <p class="fact-label">Technical record</p><dl class="dspecs">${specificationRows}</dl>
         <p class="fact-label">What this record documents</p><ol class="disc">${discoveryRows}</ol>
         <p class="fact-label">Record close</p><div class="lasttx" id="lastTx"></div>
         <p class="mono dossier-tags">${artifact.tags}</p>
       </section>`
    : `<section class="dsec unverified-record"><h3>Verification status</h3><p>We’re still checking this spacecraft’s story with NASA — explore the source link above while we do.</p></section>`;
  $('#dBody').innerHTML = `
    <figure class="dossier-media">
      <img src="${artifact.image}" alt="${artifact.imageAlt}" width="${artifact.imageWidth}" height="${artifact.imageHeight}" loading="lazy" decoding="async" />
      <figcaption>${imageFlag}<span>${artifact.imageCredit}</span>${artifact.imageSource ? `<a href="${artifact.imageSource}" target="_blank" rel="noreferrer">Image source ↗</a>` : ''}</figcaption>
    </figure>
    <div class="dsec dossier-source"><h3>Sources</h3><a href="${artifact.source}" target="_blank" rel="noreferrer">Open ${artifact.sourceLabel} <span aria-hidden="true">↗</span></a><p>${artifact.verifiedByNASA ? 'Every visible factual claim below was checked against this opened NASA source.' : 'NASA’s page is ready to explore; this dossier will grow after its full fact-check.'}</p></div>
    <div class="dart"><div class="plate"></div>${SCHEM[artifact.sch] || SCHEM.probe}
      <div class="caption"><span>${artifact.b === 'moon' ? 'LUNAR ARTEFACT' : artifact.b === 'mars' ? 'MARTIAN ARTEFACT' : 'DEEP SPACE VEHICLE'}</span><span>${artifact.ag}</span></div>
    </div>
    <div class="dsec"><h3>Designation</h3><dl class="dspecs">${artifact.verifiedByNASA ? `
      <div><dt>Object</dt><dd>${artifact.n}</dd></div><div><dt>Mission</dt><dd>${artifact.m}</dd></div>
      <div><dt>Agency</dt><dd>${artifact.ag}</dd></div><div><dt>Year</dt><dd>${artifact.y}</dd></div>
      <div><dt>Status</dt><dd><span class="st ${artifact.st}">${statusLabel(artifact.st)}</span></dd></div>
      <div><dt>${artifact.b === 'deep' ? 'Trajectory' : 'Coordinates'}</dt><dd>${coordinates}</dd></div>
      ${artifact.site ? `<div><dt>Site</dt><dd>${artifact.site}</dd></div>` : ''}` : `
      <div><dt>Object</dt><dd>${artifact.n}</dd></div><div><dt>Audit</dt><dd>Claim review in progress</dd></div>`}
    </dl></div>
    ${evidence}`;
  const dossierImage = document.querySelector<HTMLImageElement>('#dBody .dossier-media img');
  dossierImage?.addEventListener('error', () => {
    dossierImage.src = assetPath('/assets/images/dossier-context-placeholder.svg');
    dossierImage.alt = 'NASA image placeholder — artefact-specific image pending source verification';
    const flag = document.querySelector<HTMLElement>('#dBody .image-flag');
    if (flag) flag.textContent = 'NASA IMAGE PLACEHOLDER · SOURCE IMAGE FAILED TO LOAD';
  }, { once: true });
  dossier.classList.add('open');
  dossier.setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('on');
  if (artifact.verifiedByNASA) typewrite($<HTMLElement>('#lastTx'), artifact.last, artifact.st);
  $$<HTMLButtonElement>('.hot').forEach((hotspot) => hotspot.classList.remove('sel'));
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === artifact.id);
  if (selectedHotspot) {
    selectedHotspot.element.classList.add('sel', 'pulse');
    setTimeout(() => selectedHotspot.element.classList.remove('pulse'), 5200);
  }
  $$<HTMLButtonElement>('.sitem').forEach((item) => item.classList.toggle('sel', item.dataset.id === artifact.id));
  $$<HTMLButtonElement>('.tlcard').forEach((card) => card.classList.toggle('act', card.dataset.id === artifact.id));
  $('#hudSel').innerHTML = `SELECTED · <b>${artifact.n.toUpperCase()}</b>`;
  if (shouldFly && artifact.b === archiveState.currentBody) flyTo(artifact);
  else if (shouldFly && artifact.b !== 'deep') {
    const bodyButton = document.querySelector<HTMLButtonElement>(`.bodytoggle button[data-b="${artifact.b}"]`);
    if (bodyButton && !bodyButton.classList.contains('sel')) bodyButton.click();
    setTimeout(() => flyTo(artifact), 320);
  }
  document.querySelector<HTMLElement>('#dossier .dbody')?.scrollTo({ top: 0 });
  beep(720, .05, .05);
}

function closeDossier(): void {
  $('#dossier').classList.remove('open');
  $('#dossier').setAttribute('aria-hidden', 'true');
  $('#scrim').classList.remove('on');
  archiveState.selectedArtifactId = null;
  $$<HTMLButtonElement>('.hot').forEach((hotspot) => hotspot.classList.remove('sel'));
  $$<HTMLButtonElement>('.sitem').forEach((item) => item.classList.remove('sel'));
  $('#hudSel').innerHTML = 'SELECTED · <b>NONE</b>';
}

function typewrite(element: HTMLElement, text: string, status: Artifact['st']): void {
  if (reducedMotion) {
    element.innerHTML = `${text.replace(/\n/g, '<br>')}<span class="meta">End of record</span>`;
    return;
  }
  element.textContent = '';
  let index = 0;
  const color = status === 'active' ? 'var(--moss)' : status === 'lost' || status === 'destroyed' ? 'var(--rust)' : 'var(--amber)';
  element.style.color = color;
  const tick = (): void => {
    if (index >= text.length) {
      element.insertAdjacentHTML('beforeend', '<span class="meta">End of record</span>');
      return;
    }
    const character = text[index] || '';
    element.textContent += character;
    index += 1;
    if (index % 3 === 0) blip();
    setTimeout(tick, character === '\n' ? 90 : 14 + Math.random() * 16);
  };
  tick();
}

function buildSide(): void {
  const list = A.filter((artifact) => artifact.b === archiveState.currentBody && isNASARecord(artifact)).sort((left, right) => left.y - right.y);
  $('#sideTitle').textContent = `Artefacts on ${archiveState.currentBody === 'moon' ? 'the Moon' : 'Mars'}`;
  $('#sideCnt').textContent = `${list.length} / ${list.length}`;
  $('#sideList').innerHTML = list.map((artifact) => {
    const year = artifact.verifiedByNASA ? artifact.y : '—';
    const mission = artifact.verifiedByNASA ? artifact.m : 'NASA source review pending';
    const status = artifact.verifiedByNASA ? `<span class="st ${artifact.st}">${statusLabel(artifact.st)}</span>` : '<span class="unverified-chip">Audit pending</span>';
    return `<button class="sitem${artifact.id === archiveState.selectedArtifactId ? ' sel' : ''}" data-id="${artifact.id}" role="option" aria-selected="false">
      <span class="yr">${year}</span><span><span class="nm">${artifact.n}</span><span class="ms">${mission}</span></span>${status}
    </button>`;
  }).join('');
  $$<HTMLButtonElement>('.sitem').forEach((item) => item.addEventListener('click', () => selectArtifact(item.dataset.id, true)));
}

function bindDossierControls(): void {
  $<HTMLButtonElement>('#dClose').onclick = closeDossier;
  $('#scrim').onclick = closeDossier;
  $<HTMLButtonElement>('#dPrev').onclick = () => {
    const index = idxOf(archiveState.selectedArtifactId);
    const previous = index > 0 ? order[index - 1] : undefined;
    if (previous) openDossier(previous, true);
  };
  $<HTMLButtonElement>('#dNext').onclick = () => {
    const index = idxOf(archiveState.selectedArtifactId);
    const next = index < order.length - 1 ? order[index + 1] : undefined;
    if (next) openDossier(next, true);
  };
  addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeDossier();
    if ($('#dossier').classList.contains('open')) {
      if (event.key === 'ArrowLeft') $<HTMLButtonElement>('#dPrev').click();
      if (event.key === 'ArrowRight') $<HTMLButtonElement>('#dNext').click();
    }
    if (event.key === '/' && document.activeElement !== document.querySelector('#search')) {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('#search')?.focus();
    }
  });
}

function bindBodyControls(): void {
  $$<HTMLButtonElement>('.bodytoggle button').forEach((button) => button.addEventListener('click', () => {
    const body = button.dataset.b === 'mars' ? 'mars' : 'moon';
    setBodyToggle(body);
    buildGlobe(body);
    beep(body === 'moon' ? 520 : 390, .05, .04);
  }));
}

function handleVisibility(): void {
  pageVisible = !document.hidden;
  if (!pageVisible && frameId !== null) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
  if (pageVisible && renderer && frameId === null) startObservatoryRenderLoop();
}

/** Build the optional native Observatory. The semantic archive remains complete without it. */
export function initObservatory(): void {
  if (initialized) return;
  initialized = true;
  const canvas = $<HTMLCanvasElement>('#globe');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  const sun = new THREE.DirectionalLight(0xfff2e0, 2.5);
  sun.position.set(5, 1.4, 3.2);
  scene.add(sun, new THREE.AmbientLight(0x334058, .55));
  const fill = new THREE.DirectionalLight(0x4a6ea8, .28);
  fill.position.set(-4, -1, -3);
  scene.add(fill);
  globeGroup = new THREE.Group();
  scene.add(globeGroup, createStarField());
  graticuleGroup = createGraticule();
  globeGroup.add(graticuleGroup);
  resizeRenderer();
  buildGlobe('moon');
  attachControls(canvas);
  bindBodyControls();
  bindDossierControls();
  viewportObserver = new IntersectionObserver((entries) => { observatoryVisible = entries.some((entry) => entry.isIntersecting); }, { threshold: .02 });
  viewportObserver.observe($<HTMLElement>('#viewport'));
  addEventListener('resize', resizeRenderer);
  document.addEventListener('visibilitychange', handleVisibility);
  canvas.addEventListener('webglcontextlost', (event: Event) => {
    event.preventDefault();
    $('#vpLoad').textContent = 'WebGL context paused — archive controls remain available';
    $('#vpLoad').classList.remove('gone');
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    $('#vpLoad').textContent = 'Restoring surface model…';
    buildGlobe(archiveState.currentBody);
    if (frameId === null) startObservatoryRenderLoop();
  });
  cleanupSelection = onArtifactSelection(({ id, flyToLocation }) => {
    const artifact = byId(id);
    if (artifact) openDossier(artifact, flyToLocation);
  });
}

/** Dispose native Three resources when a host removes the Observatory. */
export function disposeObservatory(): void {
  if (!initialized) return;
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  viewportObserver?.disconnect();
  viewportObserver = null;
  cleanupSelection?.();
  cleanupSelection = null;
  removeEventListener('resize', resizeRenderer);
  document.removeEventListener('visibilitychange', handleVisibility);
  if (scene) disposeObject(scene);
  Object.values(textures).forEach((texture) => { texture?.map.dispose(); texture?.bump.dispose(); });
  renderer?.dispose();
  renderer = null;
  scene = null;
  camera = null;
  globeGroup = null;
  surfaceMesh = null;
  glowMesh = null;
  graticuleGroup = null;
  hotspots = [];
  initialized = false;
}
