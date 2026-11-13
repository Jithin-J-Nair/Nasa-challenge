import { AdaptiveDpr, Preload } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { SCROLL_SIGNAL_EVENT, type ScrollSignal } from './LenisScrollWrapper';
import { atmosphereFragmentShader, atmosphereVertexShader } from './shaders/atmosphere.glsl';
import { domEchoFragmentShader, domEchoVertexShader } from './shaders/dom-echo.glsl';
import { mediaPlaneFragmentShader, mediaPlaneVertexShader } from './shaders/media-plane.glsl';
import { particleFragmentShader, particleVertexShader } from './shaders/particles.glsl';

const PARTICLE_COUNT = 2600;
const DOM_MEDIA_SELECTORS = "[data-webgl-plane='hero-title'], [data-webgl-plane='archive-card-media'], [data-webgl-plane='dossier-media']";
const DOM_MEDIA_DISTANCE = 5.75;

interface SceneRuntime {
  mouse: THREE.Vector2;
  targetMouse: THREE.Vector2;
  previousTargetMouse: THREE.Vector2;
  velocity: THREE.Vector2;
  targetVelocity: THREE.Vector2;
  pointerClient: THREE.Vector2;
  scrollProgress: number;
  scrollVelocity: number;
}

interface RuntimeProps {
  runtime: MutableRefObject<SceneRuntime>;
}

interface DomEchoPlaneProps extends RuntimeProps {
  selector: string;
  color: string;
}

interface AtmosphericUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>;
  uScroll: THREE.IUniform<number>;
  uScrollVelocity: THREE.IUniform<number>;
  uMouse: THREE.IUniform<THREE.Vector2>;
  uVelocity: THREE.IUniform<THREE.Vector2>;
  uCoreColor: THREE.IUniform<THREE.Color>;
  uEdgeColor: THREE.IUniform<THREE.Color>;
  uOpacity: THREE.IUniform<number>;
}

interface ParticleUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>;
  uScroll: THREE.IUniform<number>;
  uScrollVelocity: THREE.IUniform<number>;
  uMouse: THREE.IUniform<THREE.Vector2>;
  uVelocity: THREE.IUniform<THREE.Vector2>;
  uPixelRatio: THREE.IUniform<number>;
  uNearColor: THREE.IUniform<THREE.Color>;
  uFarColor: THREE.IUniform<THREE.Color>;
}

interface DomEchoUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>;
  uScroll: THREE.IUniform<number>;
  uScrollVelocity: THREE.IUniform<number>;
  uVelocity: THREE.IUniform<THREE.Vector2>;
  uColor: THREE.IUniform<THREE.Color>;
  uOpacity: THREE.IUniform<number>;
}

interface MediaPlaneUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>;
  uScrollVelocity: THREE.IUniform<number>;
  uHover: THREE.IUniform<number>;
  uPointer: THREE.IUniform<THREE.Vector2>;
  uTint: THREE.IUniform<THREE.Color>;
  uOpacity: THREE.IUniform<number>;
}

interface MediaPlaneEntry {
  element: HTMLElement;
  geometry: THREE.PlaneGeometry;
  material: MediaPlaneMaterial;
  mesh: THREE.Mesh<THREE.PlaneGeometry, MediaPlaneMaterial>;
  hover: number;
}

interface MediaProjectionScratch {
  anchor: THREE.Vector3;
  direction: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
}

class AtmosphericMaterial extends THREE.ShaderMaterial {
  declare uniforms: AtmosphericUniforms;
}

class ParticleMaterial extends THREE.ShaderMaterial {
  declare uniforms: ParticleUniforms;
}

class DomEchoMaterial extends THREE.ShaderMaterial {
  declare uniforms: DomEchoUniforms;
}

class MediaPlaneMaterial extends THREE.ShaderMaterial {
  declare uniforms: MediaPlaneUniforms;
}

function isScrollSignal(value: unknown): value is ScrollSignal {
  return typeof value === 'object' && value !== null
    && 'scroll' in value && typeof value.scroll === 'number'
    && 'progress' in value && typeof value.progress === 'number'
    && 'velocity' in value && typeof value.velocity === 'number';
}

function useSceneRuntime(): MutableRefObject<SceneRuntime> {
  const runtime = useRef<SceneRuntime>({
    mouse: new THREE.Vector2(),
    targetMouse: new THREE.Vector2(),
    previousTargetMouse: new THREE.Vector2(),
    velocity: new THREE.Vector2(),
    targetVelocity: new THREE.Vector2(),
    pointerClient: new THREE.Vector2(),
    scrollProgress: 0,
    scrollVelocity: 0,
  });

  useEffect(() => {
    const onScroll = (event: Event): void => {
      if (!(event instanceof CustomEvent) || !isScrollSignal(event.detail)) return;
      runtime.current.scrollProgress = event.detail.progress;
      runtime.current.scrollVelocity = event.detail.velocity;
    };
    const updatePointer = (clientX: number, clientY: number): void => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      runtime.current.targetMouse.set(clientX / width * 2 - 1, -(clientY / height) * 2 + 1);
      runtime.current.pointerClient.set(clientX, clientY);
    };
    const onPointerMove = (event: PointerEvent): void => updatePointer(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent): void => {
      const touch = event.touches.item(0);
      if (touch) updatePointer(touch.clientX, touch.clientY);
    };
    window.addEventListener(SCROLL_SIGNAL_EVENT, onScroll);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchstart', onTouchMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener(SCROLL_SIGNAL_EVENT, onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchstart', onTouchMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useFrame((_, delta) => {
    const value = runtime.current;
    const frameTime = Math.max(delta, .001);
    const deltaX = (value.targetMouse.x - value.previousTargetMouse.x) / frameTime;
    const deltaY = (value.targetMouse.y - value.previousTargetMouse.y) / frameTime;
    const magnitude = Math.hypot(deltaX, deltaY);
    if (magnitude > .0001) {
      value.targetVelocity.set(deltaX / magnitude, deltaY / magnitude).multiplyScalar(Math.min(magnitude * .075, 1.25));
    } else {
      value.targetVelocity.set(0, 0);
    }
    // Preserve the original 60fps response without making the field race on a
    // 120Hz display or become sluggish on a low-power device.
    value.velocity.lerp(value.targetVelocity, 1 - Math.exp(-delta * 9.75));
    value.mouse.lerp(value.targetMouse, 1 - Math.exp(-delta * 11.9));
    value.previousTargetMouse.copy(value.targetMouse);
  });
  return runtime;
}

function createAtmosphericMaterial(): AtmosphericMaterial {
  const uniforms: AtmosphericUniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uScrollVelocity: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uVelocity: { value: new THREE.Vector2() },
    uCoreColor: { value: new THREE.Color('#05142a') },
    uEdgeColor: { value: new THREE.Color('#4878ff') },
    uOpacity: { value: .82 },
  };
  return new AtmosphericMaterial({
    uniforms,
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
}

function createParticleMaterial(): ParticleMaterial {
  const uniforms: ParticleUniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uScrollVelocity: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uVelocity: { value: new THREE.Vector2() },
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    uNearColor: { value: new THREE.Color('#ffd29b') },
    uFarColor: { value: new THREE.Color('#5fe1ff') },
  };
  return new ParticleMaterial({
    uniforms,
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function createDomEchoMaterial(color: string): DomEchoMaterial {
  const uniforms: DomEchoUniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uScrollVelocity: { value: 0 },
    uVelocity: { value: new THREE.Vector2() },
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: .24 },
  };
  return new DomEchoMaterial({
    uniforms,
    vertexShader: domEchoVertexShader,
    fragmentShader: domEchoFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function mediaPlaneTint(element: HTMLElement): THREE.Color {
  if (element.dataset.webglPlane === 'hero-title') return new THREE.Color('#ffb15d');
  if (element.dataset.webglPlane === 'dossier-media') return new THREE.Color('#b58dff');
  return new THREE.Color('#72e6ff');
}

function createMediaPlaneEntry(element: HTMLElement): MediaPlaneEntry {
  const geometry = new THREE.PlaneGeometry(1, 1, 24, 14);
  const uniforms: MediaPlaneUniforms = {
    uTime: { value: 0 },
    uScrollVelocity: { value: 0 },
    uHover: { value: 0 },
    uPointer: { value: new THREE.Vector2(.5, .5) },
    uTint: { value: mediaPlaneTint(element) },
    uOpacity: { value: element.dataset.webglPlane === 'hero-title' ? .24 : .18 },
  };
  const material = new MediaPlaneMaterial({
    uniforms,
    vertexShader: mediaPlaneVertexShader,
    fragmentShader: mediaPlaneFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  return { element, geometry, material, mesh, hover: 0 };
}

function disposeMediaPlane(entry: MediaPlaneEntry, group: THREE.Group | null): void {
  group?.remove(entry.mesh);
  entry.geometry.dispose();
  entry.material.dispose();
}

function createParticleGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const seeds = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);
  let state = 912367;
  const random = (): number => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4_294_967_296;
  };
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const radius = Math.pow(random(), .54) * 5.4 + .22;
    const angle = random() * Math.PI * 2;
    const vertical = (random() - .5) * (1.1 + radius * .34);
    const offset = index * 3;
    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = vertical;
    positions[offset + 2] = Math.sin(angle) * radius * .48 - 1.4;
    seeds[index] = random();
    sizes[index] = 1.8 + random() * 4.6;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function CameraRig({ runtime }: RuntimeProps): null {
  const camera = useThree((state) => state.camera);
  const lookAt = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const signal = runtime.current;
    const parallaxX = signal.mouse.x * .42 + (signal.scrollProgress - .5) * .24;
    const parallaxY = signal.mouse.y * .26 - signal.scrollVelocity * .0008;
    const parallaxZ = 5 + Math.min(Math.abs(signal.scrollVelocity) * .0018, .24);
    const cameraFollow = 1 - Math.exp(-delta * 2.76);
    const targetFollow = 1 - Math.exp(-delta * 3.71);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, parallaxX, cameraFollow);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, parallaxY, cameraFollow);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, parallaxZ, cameraFollow);
    lookAt.current.x = THREE.MathUtils.lerp(lookAt.current.x, signal.mouse.x * .16, targetFollow);
    lookAt.current.y = THREE.MathUtils.lerp(lookAt.current.y, signal.mouse.y * .1, targetFollow);
    lookAt.current.z = THREE.MathUtils.lerp(lookAt.current.z, -1.15, targetFollow);
    camera.lookAt(lookAt.current);
  });
  return null;
}

function AtmosphericField({ runtime }: RuntimeProps): JSX.Element {
  const material = useMemo(createAtmosphericMaterial, []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 220, 140), []);
  const viewport = useThree((state) => state.viewport);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  useFrame((state) => {
    const signal = runtime.current;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uScroll.value = signal.scrollProgress;
    material.uniforms.uScrollVelocity.value = signal.scrollVelocity;
    material.uniforms.uMouse.value.copy(signal.mouse);
    material.uniforms.uVelocity.value.copy(signal.velocity);
  });
  return <mesh geometry={geometry} material={material} position={[0, 0, -4.2]} scale={[viewport.width * 1.5, viewport.height * 1.5, 1]} frustumCulled={false} dispose={null} />;
}

function GpuParticleField({ runtime }: RuntimeProps): JSX.Element {
  const geometry = useMemo(createParticleGeometry, []);
  const material = useMemo(createParticleMaterial, []);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  useFrame((state) => {
    const signal = runtime.current;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uScroll.value = signal.scrollProgress;
    material.uniforms.uScrollVelocity.value = signal.scrollVelocity;
    material.uniforms.uMouse.value.copy(signal.mouse);
    material.uniforms.uVelocity.value.copy(signal.velocity);
    material.uniforms.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 2);
  });
  return <points geometry={geometry} material={material} frustumCulled={false} dispose={null} />;
}

function DomEchoPlane({ selector, color, runtime }: DomEchoPlaneProps): JSX.Element {
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry, DomEchoMaterial>>(null);
  const element = useRef<HTMLElement | null>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 40, 26), []);
  const material = useMemo(() => createDomEchoMaterial(color), [color]);
  const size = useThree((state) => state.size);
  useEffect(() => {
    element.current = document.querySelector<HTMLElement>(selector);
    return () => { element.current = null; };
  }, [selector]);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  useFrame((state) => {
    const target = mesh.current;
    if (!target || !element.current) return;
    const rect = element.current.getBoundingClientRect();
    target.position.z = -1.8;
    const echoViewport = state.viewport.getCurrentViewport(state.camera, target.position);
    const width = Math.max(.01, rect.width / size.width * echoViewport.width);
    const height = Math.max(.01, rect.height / size.height * echoViewport.height);
    target.scale.set(width * 1.05, height * 1.18, 1);
    target.position.set((rect.left + rect.width * .5) / size.width * echoViewport.width - echoViewport.width * .5, -(rect.top + rect.height * .5) / size.height * echoViewport.height + echoViewport.height * .5, -1.8);
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uScroll.value = runtime.current.scrollProgress;
    material.uniforms.uScrollVelocity.value = runtime.current.scrollVelocity;
    material.uniforms.uVelocity.value.copy(runtime.current.velocity);
  });
  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} dispose={null} />;
}

function DomMediaPlaneLayer({ runtime }: RuntimeProps): JSX.Element | null {
  const group = useRef<THREE.Group>(null);
  const entries = useRef<Map<HTMLElement, MediaPlaneEntry>>(new Map());
  const discoveryNeeded = useRef(true);
  const enabled = useMemo(() => !matchMedia('(pointer: coarse)').matches, []);
  const scratch = useMemo<MediaProjectionScratch>(() => ({
    anchor: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
  }), []);

  useEffect(() => {
    if (!enabled) return undefined;
    const observer = new MutationObserver(() => { discoveryNeeded.current = true; });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      entries.current.forEach((entry) => disposeMediaPlane(entry, group.current));
      entries.current.clear();
      discoveryNeeded.current = true;
    };
  }, [enabled]);

  useFrame((state, delta) => {
    if (!enabled || !group.current) return;
    if (discoveryNeeded.current) {
      const elements = new Set(Array.from(document.querySelectorAll<HTMLElement>(DOM_MEDIA_SELECTORS)));
      elements.forEach((element) => {
        if (entries.current.has(element)) return;
        const entry = createMediaPlaneEntry(element);
        entries.current.set(element, entry);
        group.current?.add(entry.mesh);
      });
      entries.current.forEach((entry, element) => {
        if (elements.has(element)) return;
        disposeMediaPlane(entry, group.current);
        entries.current.delete(element);
      });
      discoveryNeeded.current = false;
    }

    state.camera.getWorldDirection(scratch.direction);
    scratch.anchor.copy(state.camera.position).addScaledVector(scratch.direction, DOM_MEDIA_DISTANCE);
    scratch.right.setFromMatrixColumn(state.camera.matrixWorld, 0).normalize();
    scratch.up.setFromMatrixColumn(state.camera.matrixWorld, 1).normalize();
    const viewport = state.viewport.getCurrentViewport(state.camera, scratch.anchor);
    const signal = runtime.current;

    entries.current.forEach((entry) => {
      const rect = entry.element.getBoundingClientRect();
      const visible = rect.width > 1 && rect.height > 1 && rect.bottom >= 0 && rect.top <= state.size.height && rect.right >= 0 && rect.left <= state.size.width;
      entry.mesh.visible = visible;
      if (!visible) return;

      const width = rect.width / state.size.width * viewport.width;
      const height = rect.height / state.size.height * viewport.height;
      const centerX = (rect.left + rect.width * .5) / state.size.width * viewport.width - viewport.width * .5;
      const centerY = -((rect.top + rect.height * .5) / state.size.height * viewport.height - viewport.height * .5);
      entry.mesh.position.copy(scratch.anchor)
        .addScaledVector(scratch.right, centerX)
        .addScaledVector(scratch.up, centerY);
      entry.mesh.quaternion.copy(state.camera.quaternion);
      entry.mesh.scale.set(width, height, 1);

      const pointerX = THREE.MathUtils.clamp((signal.pointerClient.x - rect.left) / rect.width, 0, 1);
      const pointerY = THREE.MathUtils.clamp(1 - (signal.pointerClient.y - rect.top) / rect.height, 0, 1);
      const hovered = signal.pointerClient.x >= rect.left && signal.pointerClient.x <= rect.right && signal.pointerClient.y >= rect.top && signal.pointerClient.y <= rect.bottom;
      entry.hover = THREE.MathUtils.lerp(entry.hover, hovered ? 1 : 0, 1 - Math.exp(-delta * 9.75));
      entry.material.uniforms.uTime.value = state.clock.elapsedTime;
      entry.material.uniforms.uScrollVelocity.value = signal.scrollVelocity;
      entry.material.uniforms.uHover.value = entry.hover;
      entry.material.uniforms.uPointer.value.set(pointerX, pointerY);
    });
  });

  return enabled ? <group ref={group} dispose={null} /> : null;
}

/** Persistent shader scene synchronized with the semantic DOM overlay. */
export function SceneManager(): JSX.Element {
  const runtime = useSceneRuntime();
  return <>
    <CameraRig runtime={runtime} />
    <AtmosphericField runtime={runtime} />
    <GpuParticleField runtime={runtime} />
    <DomEchoPlane selector="[data-webgl-plane='hero-title']" color="#ff9d3d" runtime={runtime} />
    <DomEchoPlane selector="#observatory .h2" color="#5fe1ff" runtime={runtime} />
    <DomMediaPlaneLayer runtime={runtime} />
    <AdaptiveDpr pixelated />
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={.34} luminanceThreshold={.42} mipmapBlur />
      <Noise opacity={.022} />
      <Vignette eskil={false} offset={.14} darkness={.68} />
    </EffectComposer>
    <Preload all />
  </>;
}
