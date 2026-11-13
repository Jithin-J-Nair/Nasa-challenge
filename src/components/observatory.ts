import * as THREE from "three";
import { A, isNASARecord, statusLabel } from "../data/artifacts";
import { $, $$ } from "../lib/dom";
import { archiveState } from "../lib/state";
import { clamp, lerp, mulberry32, reducedMotion } from "../lib/utils";
import type { Artifact } from "../types/archive";
import { generateMars, generateMoon, toBump } from "./planet-textures";
import { beep } from "./audio";
import { initDossierController, setDossierFlyHandler } from "./dossier";

type SurfaceBody = "moon" | "mars";

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

const assetPath = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const initialCamera: CameraSpherical = {
  radius: 2.9,
  azimuth: 0.35,
  polar: Math.PI / 2.15,
};

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let globeGroup: THREE.Group | null = null;
let surfaceMesh: THREE.Mesh<
  THREE.SphereGeometry,
  THREE.MeshStandardMaterial
> | null = null;
let glowMesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null =
  null;
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
let viewportObserver: IntersectionObserver | null = null;
let lifecycleController: AbortController | null = null;
let flyFrameId: number | null = null;
let bodyFlyTimer: number | null = null;
let activePointerId: number | null = null;
let resourceGeneration = 0;

const projectedPosition = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const normalizedPosition = new THREE.Vector3();
const normalizedCamera = new THREE.Vector3();

function hasCoordinates(
  artifact: Artifact,
): artifact is Artifact & { lat: number; lon: number } {
  return artifact.lat !== undefined && artifact.lon !== undefined;
}

function latLongToVector(
  latitude: number,
  longitude: number,
  radius: number,
): THREE.Vector3 {
  const u = (longitude + 180) / 360;
  const v = (90 - latitude) / 180;
  const phi = u * Math.PI * 2;
  const theta = v * Math.PI;
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Line ||
      child instanceof THREE.Points
    ) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function resizeRenderer(): void {
  const viewport = $<HTMLElement>("#viewport");
  if (!renderer || !camera) return;
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function createStarField(): THREE.Points<
  THREE.BufferGeometry,
  THREE.PointsMaterial
> {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const random = mulberry32(4242);
  for (let index = 0; index < 2600; index += 1) {
    const vertical = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const radial = Math.sqrt(1 - vertical * vertical);
    const distance = 26 + random() * 30;
    positions.push(
      Math.cos(angle) * radial * distance,
      vertical * distance,
      Math.sin(angle) * radial * distance,
    );
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xbfd0e8,
      size: 0.075,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    }),
  );
}

function createGraticule(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x8fb8ff,
    transparent: true,
    opacity: 0.1,
  });
  const radius = 1.004;
  const segments: THREE.Vector3[][] = [];
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const points: THREE.Vector3[] = [];
    for (let longitude = -180; longitude <= 180; longitude += 4)
      points.push(latLongToVector(latitude, longitude, radius));
    segments.push(points);
  }
  for (let longitude = -180; longitude < 180; longitude += 30) {
    const points: THREE.Vector3[] = [];
    for (let latitude = -90; latitude <= 90; latitude += 4)
      points.push(latLongToVector(latitude, longitude, radius));
    segments.push(points);
  }
  segments.forEach((points) =>
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        material,
      ),
    ),
  );
  return group;
}

function loadTextures(body: SurfaceBody): PlanetTextures {
  const cached = textures[body];
  if (cached) return cached;
  const width = 1600;
  const proceduralMap =
    body === "moon"
      ? generateMoon(width, width / 2)
      : generateMars(width, width / 2);
  const bump = new THREE.CanvasTexture(toBump(proceduralMap));
  const mapSource =
    body === "moon"
      ? assetPath("/assets/textures/moon-lroc-color.jpg")
      : assetPath("/assets/textures/mars-usgs-mola-map.jpg");
  const generation = resourceGeneration;
  const map = new THREE.TextureLoader().load(mapSource, (loadedTexture) => {
    if (!initialized || generation !== resourceGeneration)
      loadedTexture.dispose();
  });
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
  const material = new THREE.MeshStandardMaterial({
    map: texture.map,
    bumpMap: texture.bump,
    bumpScale: body === "moon" ? 0.035 : 0.028,
    roughness: 0.94,
    metalness: 0.02,
    color: 0xffffff,
  });
  surfaceMesh = new THREE.Mesh(geometry, material);
  globeGroup.add(surfaceMesh);

  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      c: { value: 0.42 },
      p: { value: 2.6 },
      gc: { value: new THREE.Color(body === "moon" ? 0x9fc0e8 : 0xff8a5c) },
    },
    vertexShader:
      "varying vec3 vNormal; varying vec3 vPosition; void main(){ vNormal=normalize(normalMatrix*normal); vec4 modelView=modelViewMatrix*vec4(position,1.0); vPosition=modelView.xyz; gl_Position=projectionMatrix*modelView; }",
    fragmentShader:
      "uniform vec3 gc; uniform float c; uniform float p; varying vec3 vNormal; varying vec3 vPosition; void main(){ vec3 viewDirection=normalize(-vPosition); float intensity=pow(c-dot(vNormal,viewDirection),p); gl_FragColor=vec4(gc,1.0)*clamp(intensity,0.0,1.0); }",
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  glowMesh = new THREE.Mesh(
    new THREE.SphereGeometry(body === "moon" ? 1.06 : 1.09, 64, 48),
    glowMaterial,
  );
  globeGroup.add(glowMesh);

  $("#hudBody").innerHTML =
    `BODY · <b>${body === "moon" ? "THE MOON" : "MARS"}</b>`;
  $("#hudSite").innerHTML =
    body === "moon"
      ? "MEAN RADIUS · <b>1,737.4 KM</b>"
      : "MEAN RADIUS · <b>3,389.5 KM</b>";
  $("#hudTexture").innerHTML =
    body === "moon"
      ? "COLOR MAP · <b>NASA LRO / SVS</b>"
      : "COLOR MAP · <b>NASA/USGS MOLA</b>";
  $("#vpLoad").classList.add("gone");
  buildHotspots();
  buildSide();
}

function buildHotspots(): void {
  const wrapper = $<HTMLElement>("#hotspots");
  wrapper.innerHTML = "";
  hotspots = [];
  const list = A.filter((artifact) => artifact.b === archiveState.currentBody)
    .filter(hasCoordinates)
    .filter(isNASARecord);
  list.forEach((artifact) => {
    const button = document.createElement("button");
    button.className = `hot${artifact.st === "active" ? " act" : ""}`;
    button.innerHTML = `<span class="ring"></span><span class="dot"></span><span class="lbl">${artifact.n}</span>`;
    button.setAttribute("aria-label", `${artifact.n} — ${artifact.site}`);
    button.dataset.id = artifact.id;
    wrapper.appendChild(button);
    hotspots.push({
      element: button,
      position: latLongToVector(artifact.lat, artifact.lon, 1.012),
      id: artifact.id,
    });
  });
  $("#hudCount").innerHTML = `MARKERS · <b>${list.length}</b>`;
}

function setBodyToggle(body: SurfaceBody): void {
  $$<HTMLButtonElement>(".bodytoggle button").forEach((button) => {
    const selected = button.dataset.b === body;
    button.classList.toggle("sel", selected);
    button.setAttribute("aria-selected", String(selected));
  });
}

function attachControls(canvas: HTMLCanvasElement, signal: AbortSignal): void {
  const onPointerDown = (event: PointerEvent): void => {
    dragging = true;
    activePointerId = event.pointerId;
    canvas.classList.add("drag");
    lastPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  };
  const releasePointer = (): void => {
    dragging = false;
    lastPointer = null;
    if (activePointerId !== null && canvas.hasPointerCapture(activePointerId))
      canvas.releasePointerCapture(activePointerId);
    activePointerId = null;
    canvas.classList.remove("drag");
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging || !lastPointer) return;
    const deltaX = event.clientX - lastPointer.x;
    const deltaY = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    targetCamera.azimuth -= deltaX * 0.006;
    targetCamera.polar = clamp(
      targetCamera.polar - deltaY * 0.006,
      0.35,
      Math.PI - 0.35,
    );
  };
  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    targetCamera.radius = clamp(
      targetCamera.radius + event.deltaY * 0.0016,
      1.42,
      5.2,
    );
  };
  canvas.addEventListener("pointerdown", onPointerDown, { signal });
  canvas.addEventListener("pointerup", releasePointer, { signal });
  canvas.addEventListener("pointercancel", releasePointer, { signal });
  canvas.addEventListener("pointermove", onPointerMove, { signal });
  canvas.addEventListener("wheel", onWheel, { passive: false, signal });
  signal.addEventListener("abort", releasePointer, { once: true });

  $<HTMLButtonElement>("#btnZoomIn").addEventListener(
    "click",
    () => {
      targetCamera.radius = clamp(targetCamera.radius - 0.3, 1.42, 5.2);
      beep(660, 0.03, 0.03);
    },
    { signal },
  );
  $<HTMLButtonElement>("#btnZoomOut").addEventListener(
    "click",
    () => {
      targetCamera.radius = clamp(targetCamera.radius + 0.3, 1.42, 5.2);
      beep(520, 0.03, 0.03);
    },
    { signal },
  );
  $<HTMLButtonElement>("#btnSpin").addEventListener(
    "click",
    (event: MouseEvent) => {
      autoSpin = !autoSpin;
      const button = event.currentTarget;
      if (button instanceof HTMLButtonElement)
        button.style.color = autoSpin ? "var(--amber)" : "";
      beep(autoSpin ? 760 : 420, 0.04, 0.03);
    },
    { signal },
  );
  $<HTMLButtonElement>("#btnReset").addEventListener(
    "click",
    () => {
      targetCamera = { ...initialCamera };
      if (globeGroup) globeGroup.rotation.y = 0;
      beep(600, 0.04, 0.03);
    },
    { signal },
  );
}

function flyTo(artifact: Artifact): void {
  if (!hasCoordinates(artifact) || !globeGroup) return;
  if (flyFrameId !== null) cancelAnimationFrame(flyFrameId);
  const longitude = ((artifact.lon + 180) / 360) * Math.PI * 2;
  const desiredAzimuth = longitude - Math.PI / 2;
  const currentRotation = globeGroup.rotation.y;
  const difference =
    ((((desiredAzimuth - currentRotation) % (Math.PI * 2)) + Math.PI * 3) %
      (Math.PI * 2)) -
    Math.PI;
  targetCamera.radius = Math.min(targetCamera.radius, 2.35);
  targetCamera.polar = clamp(
    ((90 - artifact.lat) * Math.PI) / 180,
    0.45,
    Math.PI - 0.45,
  );
  autoSpin = false;
  $<HTMLButtonElement>("#btnSpin").style.color = "";
  const endRotation = currentRotation + difference;
  const startedAt = performance.now();
  const animate = (now: number): void => {
    flyFrameId = null;
    if (!initialized || !globeGroup) return;
    const progress = clamp((now - startedAt) / 900, 0, 1);
    const eased =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    globeGroup.rotation.y =
      currentRotation + (endRotation - currentRotation) * eased;
    if (progress < 1) flyFrameId = requestAnimationFrame(animate);
  };
  flyFrameId = requestAnimationFrame(animate);
}

function navigateDossierFly(artifact: Artifact, shouldFly: boolean): void {
  if (!shouldFly) return;
  if (artifact.b === archiveState.currentBody) {
    flyTo(artifact);
    return;
  }
  if (artifact.b === "deep") return;
  const bodyButton = document.querySelector<HTMLButtonElement>(
    `.bodytoggle button[data-b="${artifact.b}"]`,
  );
  if (bodyButton && !bodyButton.classList.contains("sel")) bodyButton.click();
  if (bodyFlyTimer !== null) window.clearTimeout(bodyFlyTimer);
  bodyFlyTimer = window.setTimeout(() => {
    bodyFlyTimer = null;
    flyTo(artifact);
  }, 320);
}

function renderObservatoryFrame(): void {
  frameId = null;
  const activeRenderer = renderer;
  const activeCamera = camera;
  const activeScene = scene;
  const activeGlobe = globeGroup;
  if (
    !pageVisible ||
    !observatoryVisible ||
    !activeRenderer ||
    !activeCamera ||
    !activeScene ||
    !activeGlobe
  )
    return;
  frameId = requestAnimationFrame(renderObservatoryFrame);
  const viewport = $<HTMLElement>("#viewport");
  if (
    viewport.clientWidth !== activeRenderer.domElement.clientWidth ||
    viewport.clientHeight !== activeRenderer.domElement.clientHeight
  )
    resizeRenderer();
  if (autoSpin && !dragging) activeGlobe.rotation.y += 0.0016;
  cameraState.radius = lerp(cameraState.radius, targetCamera.radius, 0.09);
  cameraState.azimuth = lerp(cameraState.azimuth, targetCamera.azimuth, 0.11);
  cameraState.polar = lerp(cameraState.polar, targetCamera.polar, 0.11);
  activeCamera.position.set(
    cameraState.radius *
      Math.sin(cameraState.polar) *
      Math.cos(cameraState.azimuth),
    cameraState.radius * Math.cos(cameraState.polar),
    cameraState.radius *
      Math.sin(cameraState.polar) *
      Math.sin(cameraState.azimuth),
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
    hotspot.element.style.left = `${(projectedPosition.x * 0.5 + 0.5) * width}px`;
    hotspot.element.style.top = `${(-projectedPosition.y * 0.5 + 0.5) * height}px`;
    hotspot.element.classList.toggle(
      "behind",
      facing < 0.06 || projectedPosition.z > 1,
    );
    hotspot.element.style.zIndex = String(Math.round(1000 + facing * 400));
  });
  activeRenderer.render(activeScene, activeCamera);
}

export function startObservatoryRenderLoop(): void {
  if (
    frameId !== null ||
    !pageVisible ||
    !renderer ||
    !camera ||
    !scene ||
    !globeGroup
  )
    return;
  frameId = requestAnimationFrame(renderObservatoryFrame);
}

function buildSide(): void {
  const list = A.filter(
    (artifact) =>
      artifact.b === archiveState.currentBody && isNASARecord(artifact),
  ).sort((left, right) => left.y - right.y);
  $("#sideTitle").textContent =
    `Artefacts on ${archiveState.currentBody === "moon" ? "the Moon" : "Mars"}`;
  $("#sideCnt").textContent = `${list.length} / ${list.length}`;
  $("#sideList").innerHTML = list
    .map((artifact) => {
      const year = artifact.verifiedByNASA ? artifact.y : "—";
      const mission = artifact.verifiedByNASA
        ? artifact.m
        : "NASA source review pending";
      const status = artifact.verifiedByNASA
        ? `<span class="st ${artifact.st}">${statusLabel(artifact.st)}</span>`
        : '<span class="unverified-chip">Audit pending</span>';
      return `<button class="sitem${artifact.id === archiveState.selectedArtifactId ? " sel" : ""}" data-id="${artifact.id}" role="option" aria-selected="false">
      <span class="yr">${year}</span><span><span class="nm">${artifact.n}</span><span class="ms">${mission}</span></span>${status}
    </button>`;
    })
    .join("");
}

function bindBodyControls(signal: AbortSignal): void {
  $$<HTMLButtonElement>(".bodytoggle button").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        const body = button.dataset.b === "mars" ? "mars" : "moon";
        setBodyToggle(body);
        buildGlobe(body);
        beep(body === "moon" ? 520 : 390, 0.05, 0.04);
      },
      { signal },
    ),
  );
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
export function initObservatory(): () => void {
  initDossierController(navigateDossierFly);
  if (initialized) return disposeObservatory;
  resourceGeneration += 1;
  const canvas = $<HTMLCanvasElement>("#globe");
  const controller = new AbortController();
  lifecycleController = controller;
  const { signal } = controller;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const sun = new THREE.DirectionalLight(0xfff2e0, 2.5);
    sun.position.set(5, 1.4, 3.2);
    scene.add(sun, new THREE.AmbientLight(0x334058, 0.55));
    const fill = new THREE.DirectionalLight(0x4a6ea8, 0.28);
    fill.position.set(-4, -1, -3);
    scene.add(fill);
    globeGroup = new THREE.Group();
    scene.add(globeGroup, createStarField());
    graticuleGroup = createGraticule();
    globeGroup.add(graticuleGroup);
    initialized = true;
    resizeRenderer();
    buildGlobe("moon");
    attachControls(canvas, signal);
    bindBodyControls(signal);
    if ("IntersectionObserver" in window) {
      viewportObserver = new IntersectionObserver(
        (entries) => {
          observatoryVisible = entries.some((entry) => entry.isIntersecting);
          if (observatoryVisible) startObservatoryRenderLoop();
        },
        { threshold: 0.02 },
      );
      viewportObserver.observe($<HTMLElement>("#viewport"));
    } else {
      observatoryVisible = true;
    }
    window.addEventListener("resize", resizeRenderer, { signal });
    document.addEventListener("visibilitychange", handleVisibility, { signal });
    canvas.addEventListener(
      "webglcontextlost",
      (event: Event) => {
        event.preventDefault();
        $("#vpLoad").textContent =
          "WebGL context paused — archive controls remain available";
        $("#vpLoad").classList.remove("gone");
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
      },
      { signal },
    );
    canvas.addEventListener(
      "webglcontextrestored",
      () => {
        if (!initialized) return;
        $("#vpLoad").textContent = "Restoring surface model…";
        buildGlobe(archiveState.currentBody);
        startObservatoryRenderLoop();
      },
      { signal },
    );
    return disposeObservatory;
  } catch (error: unknown) {
    // Dispose partially-created GPU resources before allowing the DOM fallback to take over.
    initialized = true;
    disposeObservatory();
    throw error;
  }
}

/** Dispose native Three resources and all Observatory-owned activity on host removal. */
export function disposeObservatory(): void {
  if (!initialized && !lifecycleController) return;
  lifecycleController?.abort();
  lifecycleController = null;
  setDossierFlyHandler(null);
  resourceGeneration += 1;
  if (frameId !== null) cancelAnimationFrame(frameId);
  if (flyFrameId !== null) cancelAnimationFrame(flyFrameId);
  if (bodyFlyTimer !== null) window.clearTimeout(bodyFlyTimer);
  frameId = null;
  flyFrameId = null;
  bodyFlyTimer = null;
  viewportObserver?.disconnect();
  viewportObserver = null;
  if (scene) {
    disposeObject(scene);
    scene.clear();
  }
  (["moon", "mars"] satisfies SurfaceBody[]).forEach((body) => {
    const texture = textures[body];
    texture?.map.dispose();
    texture?.bump.dispose();
    delete textures[body];
  });
  renderer?.renderLists.dispose();
  renderer?.dispose();
  renderer?.forceContextLoss();
  renderer = null;
  scene = null;
  camera = null;
  globeGroup = null;
  surfaceMesh = null;
  glowMesh = null;
  graticuleGroup = null;
  hotspots = [];
  cameraState = { ...initialCamera };
  targetCamera = { ...initialCamera };
  autoSpin = !reducedMotion;
  dragging = false;
  lastPointer = null;
  activePointerId = null;
  observatoryVisible = false;
  pageVisible = !document.hidden;
  initialized = false;
}
