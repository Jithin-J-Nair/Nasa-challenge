import { AdaptiveDpr, Float, Preload } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SCROLL_SIGNAL_EVENT, type ScrollSignal } from './scroll-engine';

interface WebglExperienceProps {
  onContextLost: () => void;
  onContextRestored: () => void;
}

interface ContextRecoveryProps extends WebglExperienceProps {}

const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uCursor;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float value = 0.0; float amplitude = 0.5;
    for (int i = 0; i < 5; i++) { value += amplitude * noise(p); p = p * 2.03 + 11.7; amplitude *= 0.5; }
    return value;
  }
  void main() {
    vUv = uv;
    float cursorDistance = distance(uv, uCursor * 0.5 + 0.5);
    float field = fbm(uv * 3.2 + uTime * 0.035 + uScroll * 1.4);
    vec3 transformed = position;
    transformed.z += (field - 0.5) * 0.12 * smoothstep(0.85, 0.0, cursorDistance);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uCursor;
  uniform vec3 uColor;
  uniform float uOpacity;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float value = 0.0; float amplitude = 0.5;
    for (int i = 0; i < 5; i++) { value += amplitude * noise(p); p = p * 2.06 + 9.2; amplitude *= 0.5; }
    return value;
  }
  void main() {
    vec2 center = uCursor * 0.5 + 0.5;
    float cursorDistance = distance(vUv, center);
    float field = fbm(vUv * 4.0 + vec2(uTime * 0.025, -uTime * 0.018) + uScroll * 2.0);
    float lines = smoothstep(0.58, 0.82, field) * 0.45;
    float cursorGlow = smoothstep(0.42, 0.0, cursorDistance) * (0.22 + 0.22 * sin(uTime * 1.7));
    float horizon = smoothstep(0.82, 0.18, vUv.y) * 0.35;
    float alpha = (lines + cursorGlow + horizon) * uOpacity;
    vec3 color = mix(vec3(0.02, 0.04, 0.09), uColor, lines + cursorGlow);
    gl_FragColor = vec4(color, alpha);
  }
`;

interface SceneUniforms {
  uTime: THREE.IUniform<number>;
  uScroll: THREE.IUniform<number>;
  uCursor: THREE.IUniform<THREE.Vector2>;
  uColor: THREE.IUniform<THREE.Color>;
  uOpacity: THREE.IUniform<number>;
}

class SceneMaterial extends THREE.ShaderMaterial {
  declare uniforms: { [uniform: string]: THREE.IUniform } & SceneUniforms;
}

function isScrollSignal(value: unknown): value is ScrollSignal {
  return typeof value === 'object' && value !== null
    && 'scroll' in value && typeof value.scroll === 'number'
    && 'progress' in value && typeof value.progress === 'number'
    && 'velocity' in value && typeof value.velocity === 'number';
}

function createSceneMaterial(color: string, opacity: number): SceneMaterial {
  const uniforms: { [uniform: string]: THREE.IUniform } & SceneUniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uCursor: { value: new THREE.Vector2() },
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: opacity },
  };
  return new SceneMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
}

function ContextRecovery({ onContextLost, onContextRestored }: ContextRecoveryProps): null {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event): void => { event.preventDefault(); onContextLost(); };
    const restored = (): void => onContextRestored();
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    return () => {
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    };
  }, [gl, onContextLost, onContextRestored]);
  return null;
}

function AmbientField(): JSX.Element {
  const material = useMemo(() => createSceneMaterial('#467dff', .48), []);
  const scroll = useRef(0);
  const { viewport, pointer } = useThree();
  useEffect(() => {
    const updateScroll = (event: Event): void => {
      if (event instanceof CustomEvent) {
        if (isScrollSignal(event.detail)) scroll.current = event.detail.progress;
      }
    };
    window.addEventListener(SCROLL_SIGNAL_EVENT, updateScroll);
    return () => window.removeEventListener(SCROLL_SIGNAL_EVENT, updateScroll);
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    const uniforms = material.uniforms;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = scroll.current;
    uniforms.uCursor.value.set(pointer.x, pointer.y);
  });
  return <mesh position={[0, 0, -3.2]} scale={[viewport.width * 1.2, viewport.height * 1.2, 1]} material={material}><planeGeometry args={[1, 1, 96, 96]} /></mesh>;
}

function DomTrackedPlane({ selector, color }: { selector: string; color: string }): JSX.Element | null {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => createSceneMaterial(color, .18), [color]);
  const { size, viewport, pointer } = useThree();
  const scroll = useRef(0);
  useEffect(() => {
    const updateScroll = (event: Event): void => {
      if (event instanceof CustomEvent) {
        if (isScrollSignal(event.detail)) scroll.current = event.detail.progress;
      }
    };
    window.addEventListener(SCROLL_SIGNAL_EVENT, updateScroll);
    return () => window.removeEventListener(SCROLL_SIGNAL_EVENT, updateScroll);
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    const element = document.querySelector<HTMLElement>(selector);
    const target = mesh.current;
    if (!element || !target) return;
    const rect = element.getBoundingClientRect();
    const width = Math.max(1, rect.width / size.width * viewport.width);
    const height = Math.max(1, rect.height / size.height * viewport.height);
    target.scale.set(width * 1.04, height * 1.24, 1);
    target.position.set((rect.left + rect.width / 2) / size.width * viewport.width - viewport.width / 2, -(rect.top + rect.height / 2) / size.height * viewport.height + viewport.height / 2, -1.4);
    const uniforms = material.uniforms;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = scroll.current;
    uniforms.uCursor.value.set(pointer.x, pointer.y);
  });
  return <mesh ref={mesh} material={material}><planeGeometry args={[1, 1, 42, 42]} /></mesh>;
}

function SignalObjects(): JSX.Element {
  return <group position={[0, 0, -1.5]}>
    <Float speed={1.1} rotationIntensity={.18} floatIntensity={.35}><mesh position={[2.2, 1.1, 0]} rotation={[.3, .4, .1]}><icosahedronGeometry args={[.16, 2]} /><meshBasicMaterial color="#ff9d3d" transparent opacity={.68} wireframe /></mesh></Float>
    <Float speed={.8} rotationIntensity={.22} floatIntensity={.42}><mesh position={[-2.5, -.7, 0]} rotation={[.2, -.2, .1]}><octahedronGeometry args={[.1, 1]} /><meshBasicMaterial color="#5fe1ff" transparent opacity={.45} wireframe /></mesh></Float>
  </group>;
}

function Scene({ onContextLost, onContextRestored }: WebglExperienceProps): JSX.Element {
  return <>
    <ContextRecovery onContextLost={onContextLost} onContextRestored={onContextRestored} />
    <color attach="background" args={['#04050a']} />
    <AmbientField />
    <DomTrackedPlane selector="[data-webgl-plane='hero-title']" color="#ff9d3d" />
    <DomTrackedPlane selector="#observatory .h2" color="#5fe1ff" />
    <SignalObjects />
    <AdaptiveDpr pixelated />
    <EffectComposer multisampling={0} enableNormalPass={false}><Bloom intensity={.32} luminanceThreshold={.55} mipmapBlur /><Noise opacity={.025} /><Vignette eskil={false} offset={.16} darkness={.72} /></EffectComposer>
    <Preload all />
  </>;
}

export function WebglExperience({ onContextLost, onContextRestored }: WebglExperienceProps): JSX.Element {
  return <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }} camera={{ position: [0, 0, 5], fov: 48 }}>
    <Scene onContextLost={onContextLost} onContextRestored={onContextRestored} />
  </Canvas>;
}
