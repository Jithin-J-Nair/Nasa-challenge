import { AdaptiveDpr, Preload } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { SCROLL_SIGNAL_EVENT, type ScrollSignal } from './LenisScrollWrapper';
import { atmosphereFragmentShader, atmosphereVertexShader } from './shaders/atmosphere.glsl';
import { domEchoFragmentShader, domEchoVertexShader } from './shaders/dom-echo.glsl';
import { particleFragmentShader, particleVertexShader } from './shaders/particles.glsl';

const PARTICLE_COUNT = 2600;

interface SceneRuntime {
  mouse: THREE.Vector2;
  previousMouse: THREE.Vector2;
  velocity: THREE.Vector2;
  targetVelocity: THREE.Vector2;
  scrollProgress: number;
  scrollVelocity: number;
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

class AtmosphericMaterial extends THREE.ShaderMaterial {
  declare uniforms: AtmosphericUniforms;
}

class ParticleMaterial extends THREE.ShaderMaterial {
  declare uniforms: ParticleUniforms;
}

class DomEchoMaterial extends THREE.ShaderMaterial {
  declare uniforms: DomEchoUniforms;
}

function isScrollSignal(value: unknown): value is ScrollSignal {
  return typeof value === 'object' && value !== null
    && 'scroll' in value && typeof value.scroll === 'number'
    && 'progress' in value && typeof value.progress === 'number'
    && 'velocity' in value && typeof value.velocity === 'number';
}

function useSceneRuntime(): MutableRefObject<SceneRuntime> {
  const pointer = useThree((state) => state.pointer);
  const runtime = useRef<SceneRuntime>({
    mouse: new THREE.Vector2(),
    previousMouse: new THREE.Vector2(),
    velocity: new THREE.Vector2(),
    targetVelocity: new THREE.Vector2(),
    scrollProgress: 0,
    scrollVelocity: 0,
  });
  useEffect(() => {
    const onScroll = (event: Event): void => {
      if (!(event instanceof CustomEvent) || !isScrollSignal(event.detail)) return;
      runtime.current.scrollProgress = event.detail.progress;
      runtime.current.scrollVelocity = event.detail.velocity;
    };
    window.addEventListener(SCROLL_SIGNAL_EVENT, onScroll);
    return () => window.removeEventListener(SCROLL_SIGNAL_EVENT, onScroll);
  }, []);
  useFrame((_, delta) => {
    const value = runtime.current;
    const frameTime = Math.max(delta, .001);
    const deltaX = (pointer.x - value.previousMouse.x) / frameTime;
    const deltaY = (pointer.y - value.previousMouse.y) / frameTime;
    const magnitude = Math.hypot(deltaX, deltaY);
    if (magnitude > .0001) {
      value.targetVelocity.set(deltaX / magnitude, deltaY / magnitude).multiplyScalar(Math.min(magnitude * .075, 1.25));
    } else {
      value.targetVelocity.set(0, 0);
    }
    value.velocity.lerp(value.targetVelocity, .14);
    value.mouse.lerp(pointer, .18);
    value.previousMouse.copy(pointer);
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

function CameraRig({ runtime }: { runtime: MutableRefObject<SceneRuntime> }): null {
  const camera = useThree((state) => state.camera);
  const lookAt = useRef(new THREE.Vector3());
  useFrame(() => {
    const signal = runtime.current;
    const parallaxX = signal.mouse.x * .42 + (signal.scrollProgress - .5) * .24;
    const parallaxY = signal.mouse.y * .26 - signal.scrollVelocity * .0008;
    const parallaxZ = 5 + Math.min(Math.abs(signal.scrollVelocity) * .0018, .24);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, parallaxX, .045);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, parallaxY, .045);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, parallaxZ, .045);
    lookAt.current.x = THREE.MathUtils.lerp(lookAt.current.x, signal.mouse.x * .16, .06);
    lookAt.current.y = THREE.MathUtils.lerp(lookAt.current.y, signal.mouse.y * .1, .06);
    lookAt.current.z = THREE.MathUtils.lerp(lookAt.current.z, -1.15, .06);
    camera.lookAt(lookAt.current);
  });
  return null;
}

function AtmosphericField({ runtime }: { runtime: MutableRefObject<SceneRuntime> }): JSX.Element {
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

function GpuParticleField({ runtime }: { runtime: MutableRefObject<SceneRuntime> }): JSX.Element {
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

function DomEchoPlane({ selector, color, runtime }: { selector: string; color: string; runtime: MutableRefObject<SceneRuntime> }): JSX.Element {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 40, 26), []);
  const material = useMemo(() => createDomEchoMaterial(color), [color]);
  const size = useThree((state) => state.size);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  useFrame((state) => {
    const target = mesh.current;
    const element = document.querySelector<HTMLElement>(selector);
    if (!target || !element) return;
    const rect = element.getBoundingClientRect();
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

/** Active-Theory-style atmospheric scene: fluid background, GPU particles, DOM echoes, and camera rig. */
export function SceneManager(): JSX.Element {
  const runtime = useSceneRuntime();
  return <>
    <CameraRig runtime={runtime} />
    <AtmosphericField runtime={runtime} />
    <GpuParticleField runtime={runtime} />
    <DomEchoPlane selector="[data-webgl-plane='hero-title']" color="#ff9d3d" runtime={runtime} />
    <DomEchoPlane selector="#observatory .h2" color="#5fe1ff" runtime={runtime} />
    <AdaptiveDpr pixelated />
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={.34} luminanceThreshold={.42} mipmapBlur />
      <Noise opacity={.022} />
      <Vignette eskil={false} offset={.14} darkness={.68} />
    </EffectComposer>
    <Preload all />
  </>;
}
