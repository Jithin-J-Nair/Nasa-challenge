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

/** Horizon Bloom preset tuned against the supplied dark-planet sunrise reference. */
export const SILENT_FLEET_HORIZON_BLOOM: HorizonBloomProps = {
  colors: ['#ff9600', '#5227FF'],
  horizon: .72,
  curvature: 1,
  tilt: 0,
  sunPosition: .48,
  sunrise: 1,
  spread: .4,
  atmosphere: .68,
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
    // A substantially bowed edge turns the lower frame into a planet rather
    // than a flat line. At the supplied curvature of one, the limb falls away
    // toward both edges, matching the reference composition.
    float limb = pow(abs(x) * 2.0, 1.72);
    float curve = horizon - limb * (.20 * uCurvature);
    curve += sin(x * 2.4 + uTilt) * .003 * uCurvature;

    float aboveHorizon = max(0.0, uv.y - curve);
    float horizonDistance = abs(uv.y - curve);
    float atmosphereFalloff = exp(-aboveHorizon * 5.6);
    vec3 sky = mix(uBackground, uSecondary * .105, atmosphereFalloff * uAtmosphere * .72);
    sky += uSecondary * .012 * exp(-aboveHorizon * 1.9);

    float sunX = mix(.08, .92, uSunPosition);
    float sunDistance = abs(uv.x - sunX);
    float sun = exp(-sunDistance * sunDistance / max(.0008, uSpread * uSpread * .028));
    float sunrise = exp(-horizonDistance * horizonDistance / max(.00008, .00075 * uThickness)) * sun * uSunrise;
    float upperBloom = exp(-sunDistance * sunDistance / max(.001, uSpread * uSpread * .10)) * exp(-aboveHorizon * 12.0);
    vec3 warmWhite = mix(uPrimary, vec3(1.0, .79, .67), .8);
    sky += warmWhite * (sunrise * (1.15 + uBloom * .55) + upperBloom * uAtmosphere * .18);

    float cloudFlow = t * (.035 + uDrift * .08);
    float cloud = fbm(vec2(uv.x * 3.1 - cloudFlow, uv.y * 10.0 + cloudFlow * .4));
    float cloudBand = exp(-pow((aboveHorizon - .12) * 5.4, 2.0));
    sky = mix(sky, sky * .72 + warmWhite * .035, cloud * cloudBand * uClouds * .18);

    vec2 starGrid = vec2(260.0, 150.0);
    vec2 starCell = uv * starGrid;
    float starSeed = hash21(floor(starCell));
    float starField = step(.985 - uStars * .008, starSeed);
    float starShape = smoothstep(.14, 0.0, length(fract(starCell) - .5));
    float stars = starField * starShape * smoothstep(curve + .05, curve + .27, uv.y) * (1.0 - smoothstep(.6, 1.0, uv.y));
    sky += vec3(stars) * (.55 + hash21(floor(starCell)) * .65);

    float auroraWave = sin(uv.x * 11.0 + t * .7) * .018 + sin(uv.x * 4.3 - t * .33) * .022;
    float auroraBand = exp(-pow((aboveHorizon - (.19 + auroraWave)) * 8.0, 2.0));
    float auroraNoise = fbm(vec2(uv.x * 4.0 + t * .08, uv.y * 2.4));
    sky += uSecondary * auroraBand * auroraNoise * uAurora * uAutoAurora * .065;

    float planet = 1.0 - smoothstep(-.003, .010, uv.y - curve);
    vec3 planetColor = mix(vec3(.002, .0025, .004), vec3(.022, .014, .008), uv.y * .14);
    float terrain = fbm(vec2(uv.x * 9.0, (uv.y - curve) * 36.0)) * .012;
    planetColor += terrain * vec3(.11, .07, .035) * planet;
    float rim = exp(-horizonDistance / max(.001, .0048 * uThickness)) * uRim;
    vec3 rimColor = mix(uSecondary, warmWhite, .82);
    planetColor += rimColor * (uAirglow * .19 + sun * .92) * rim;

    vec2 flareUv = vec2((uv.x - sunX) * 1.08, (uv.y - curve) * 3.0);
    float flare = .0022 / max(.0015, dot(flareUv, flareUv)) * uFlare * .012;
    float shafts = pow(max(0.0, sin((uv.x - sunX) * 84.0 + fbm(vec2(uv.x * 8.0, t * .05)) * 3.0)), 16.0);
    shafts *= exp(-sunDistance * sunDistance / max(.001, uSpread * uSpread * .045)) * exp(-aboveHorizon * 8.5);
    vec3 color = mix(sky, planetColor, planet);
    color += warmWhite * (flare + shafts * .19) * smoothstep(curve - .035, curve + .085, uv.y);

    float grain = (hash21(gl_FragCoord.xy + fract(t) * 37.0) - .5) * uGrain * .015;
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
