import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export interface HorizonBloomProps {
  colors: readonly [string, string];
  horizon: number;
  curvature: number;
  tilt: number;
  sunPosition: number;
  sunrise: number;
  spread: number;
  atmosphere: number;
  thickness: number;
  rim: number;
  flare: number;
  airglow: number;
  clouds: number;
  stars: number;
  aurora: number;
  autoAurora: boolean;
  backgroundColor: string;
  speed: number;
  drift: number;
  parallax: number;
  bloom: number;
  grain: number;
  interactive: boolean;
  intro: boolean;
  paused: boolean;
}

/** The requested Horizon Bloom preset, kept explicit for design review. */
export const SILENT_FLEET_HORIZON_BLOOM: HorizonBloomProps = {
  colors: ['#ff9600', '#5227FF'],
  horizon: .72,
  curvature: 1,
  tilt: 0,
  sunPosition: .15,
  sunrise: 1,
  spread: .4,
  atmosphere: 1,
  thickness: 1.05,
  rim: 1,
  flare: 3,
  airglow: .74,
  clouds: .5,
  stars: .93,
  aurora: .44,
  autoAurora: true,
  backgroundColor: '#0A0A0A',
  speed: .5,
  drift: .18,
  parallax: .28,
  bloom: .98,
  grain: .25,
  interactive: true,
  intro: true,
  paused: false,
};

interface HorizonBloomUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>;
  uIntro: THREE.IUniform<number>;
  uPointer: THREE.IUniform<THREE.Vector2>;
  uPrimary: THREE.IUniform<THREE.Color>;
  uSecondary: THREE.IUniform<THREE.Color>;
  uBackground: THREE.IUniform<THREE.Color>;
  uHorizon: THREE.IUniform<number>;
  uCurvature: THREE.IUniform<number>;
  uTilt: THREE.IUniform<number>;
  uSunPosition: THREE.IUniform<number>;
  uSunrise: THREE.IUniform<number>;
  uSpread: THREE.IUniform<number>;
  uAtmosphere: THREE.IUniform<number>;
  uThickness: THREE.IUniform<number>;
  uRim: THREE.IUniform<number>;
  uFlare: THREE.IUniform<number>;
  uAirglow: THREE.IUniform<number>;
  uClouds: THREE.IUniform<number>;
  uStars: THREE.IUniform<number>;
  uAurora: THREE.IUniform<number>;
  uAutoAurora: THREE.IUniform<number>;
  uSpeed: THREE.IUniform<number>;
  uDrift: THREE.IUniform<number>;
  uParallax: THREE.IUniform<number>;
  uBloom: THREE.IUniform<number>;
  uGrain: THREE.IUniform<number>;
}

class HorizonBloomMaterial extends THREE.ShaderMaterial {
  declare uniforms: HorizonBloomUniforms;
}

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// This is a small project-native renderer, not a copy of the licensed React Bits
// source. It accepts the same requested art-direction controls while preserving
// Silent Fleet's progressive WebGL lifecycle and fallback behavior.
const fragmentShader = /* glsl */`
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntro;
  uniform vec2 uPointer;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uBackground;
  uniform float uHorizon;
  uniform float uCurvature;
  uniform float uTilt;
  uniform float uSunPosition;
  uniform float uSunrise;
  uniform float uSpread;
  uniform float uAtmosphere;
  uniform float uThickness;
  uniform float uRim;
  uniform float uFlare;
  uniform float uAirglow;
  uniform float uClouds;
  uniform float uStars;
  uniform float uAurora;
  uniform float uAutoAurora;
  uniform float uSpeed;
  uniform float uDrift;
  uniform float uParallax;
  uniform float uBloom;
  uniform float uGrain;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * valueNoise(p);
      p = p * 2.03 + vec2(19.1, 7.7);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 pointer = (uPointer - .5) * uParallax * .075;
    uv += pointer;
    float t = uTime * max(.02, uSpeed);

    // The API's horizon setting reads from the top of the frame. Convert it to
    // the UV coordinate used by the shader, then bow it into a planet edge.
    float x = uv.x - .5;
    float horizon = 1.0 - uHorizon;
    float curve = horizon - x * x * (.2 * uCurvature);
    curve += sin(x * 2.4 + uTilt) * .008 * uCurvature;

    float skyHeight = clamp((uv.y - curve + .03) * 1.32, 0.0, 1.0);
    vec3 sky = mix(uBackground, mix(uSecondary * .08, uSecondary * .38, skyHeight), smoothstep(.0, .95, skyHeight));
    sky += uSecondary * .035 * smoothstep(.0, .56, uv.y);

    float sunX = mix(.08, .92, uSunPosition);
    float sunDistance = abs(uv.x - sunX);
    float horizonDistance = abs(uv.y - curve);
    float sun = exp(-sunDistance * sunDistance / max(.001, uSpread * uSpread * .045));
    float sunrise = exp(-horizonDistance * horizonDistance / max(.00015, .0027 * uThickness)) * sun * uSunrise;
    float upperBloom = exp(-sunDistance * sunDistance / max(.001, uSpread * uSpread * .16)) * exp(-max(0.0, uv.y - curve) * 7.0) * .64;
    sky += uPrimary * (sunrise * (1.1 + uBloom) + upperBloom * uAtmosphere);

    float cloudFlow = t * (.035 + uDrift * .08);
    float cloud = fbm(vec2(uv.x * 3.1 - cloudFlow, uv.y * 10.0 + cloudFlow * .4));
    float cloudBand = smoothstep(.05, .72, uv.y - curve) * (1.0 - smoothstep(.2, .82, uv.y));
    sky = mix(sky, sky * .6 + uPrimary * .12, cloud * cloudBand * uClouds * .34);

    vec2 starGrid = vec2(260.0, 150.0);
    vec2 starCell = uv * starGrid;
    float starSeed = hash21(floor(starCell));
    float starField = step(.9968 - uStars * .0024, starSeed);
    float starShape = smoothstep(.14, 0.0, length(fract(starCell) - .5));
    float stars = starField * starShape * smoothstep(curve + .05, curve + .27, uv.y) * (1.0 - smoothstep(.6, 1.0, uv.y));
    sky += vec3(stars) * (.55 + hash21(floor(starCell)) * .65);

    float auroraWave = sin(uv.x * 11.0 + t * .7) * .035 + sin(uv.x * 4.3 - t * .33) * .045;
    float auroraBand = exp(-pow((uv.y - (.69 + auroraWave)) * 6.0, 2.0));
    float auroraNoise = fbm(vec2(uv.x * 4.0 + t * .08, uv.y * 2.4));
    sky += mix(uSecondary, vec3(.2, .75, .65), .28) * auroraBand * auroraNoise * uAurora * uAutoAurora * .38;

    float planet = 1.0 - smoothstep(-.004, .016, uv.y - curve);
    vec3 planetColor = mix(vec3(.004, .005, .008), uBackground * .16, uv.y * .16);
    float terrain = fbm(vec2(uv.x * 9.0, (uv.y - curve) * 36.0)) * .028;
    planetColor += terrain * vec3(.13, .09, .12) * planet;
    float rim = exp(-abs(uv.y - curve) / max(.002, .013 * uThickness)) * uRim;
    planetColor += (uPrimary * sunrise * 1.85 + mix(uSecondary, uPrimary, .2) * uAirglow * .45) * rim;

    vec2 flareUv = vec2((uv.x - sunX) * 1.1, (uv.y - curve) * 2.4);
    float flare = .004 / max(.004, dot(flareUv, flareUv)) * uFlare * .017;
    vec3 color = mix(sky, planetColor, planet);
    color += uPrimary * flare * smoothstep(curve - .04, curve + .06, uv.y);

    float grain = (hash21(gl_FragCoord.xy + fract(t) * 37.0) - .5) * uGrain * .085;
    color += grain;
    color *= mix(.0, 1.0, uIntro);
    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

function createMaterial(props: HorizonBloomProps): HorizonBloomMaterial {
  const uniforms: HorizonBloomUniforms = {
    uTime: { value: 0 },
    uIntro: { value: props.intro ? 0 : 1 },
    uPointer: { value: new THREE.Vector2(.5, .5) },
    uPrimary: { value: new THREE.Color(props.colors[0]) },
    uSecondary: { value: new THREE.Color(props.colors[1]) },
    uBackground: { value: new THREE.Color(props.backgroundColor) },
    uHorizon: { value: props.horizon },
    uCurvature: { value: props.curvature },
    uTilt: { value: props.tilt },
    uSunPosition: { value: props.sunPosition },
    uSunrise: { value: props.sunrise },
    uSpread: { value: props.spread },
    uAtmosphere: { value: props.atmosphere },
    uThickness: { value: props.thickness },
    uRim: { value: props.rim },
    uFlare: { value: props.flare },
    uAirglow: { value: props.airglow },
    uClouds: { value: props.clouds },
    uStars: { value: props.stars },
    uAurora: { value: props.aurora },
    uAutoAurora: { value: props.autoAurora ? 1 : 0 },
    uSpeed: { value: props.speed },
    uDrift: { value: props.drift },
    uParallax: { value: props.parallax },
    uBloom: { value: props.bloom },
    uGrain: { value: props.grain },
  };
  return new HorizonBloomMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    transparent: false,
    toneMapped: false,
  });
}

/**
 * A full-frame, GPU-native sunrise over a curved dark planet. It lives in the
 * existing progressive R3F canvas so it inherits the app's WebGL recovery,
 * compact-screen fallback, and visibility gating.
 */
export function HorizonBloom(props: HorizonBloomProps): JSX.Element {
  const material = useMemo(() => createMaterial(props), [props]);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry, HorizonBloomMaterial>>(null);
  const pointer = useRef(new THREE.Vector2(.5, .5));

  useEffect(() => {
    if (!props.interactive) return undefined;
    const move = (event: PointerEvent): void => {
      pointer.current.set(event.clientX / Math.max(window.innerWidth, 1), 1 - event.clientY / Math.max(window.innerHeight, 1));
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [props.interactive]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((state, delta) => {
    material.uniforms.uPointer.value.lerp(pointer.current, 1 - Math.exp(-delta * 3.8));
    if (!props.paused) material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uIntro.value = THREE.MathUtils.damp(
      material.uniforms.uIntro.value,
      props.intro ? 1 : 1,
      props.intro ? 1.35 : 40,
      delta,
    );
    const target = mesh.current;
    if (target) {
      const frame = state.viewport.getCurrentViewport(state.camera, target.position);
      target.scale.set(frame.width * 1.04, frame.height * 1.04, 1);
    }
  });

  return <mesh ref={mesh} geometry={geometry} material={material} position={[0, 0, -5.5]} renderOrder={-10} frustumCulled={false} dispose={null} />;
}
