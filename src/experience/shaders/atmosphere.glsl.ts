const simplex3d = `
vec4 permute(vec4 value) {
  return mod(((value * 34.0) + 1.0) * value, 289.0);
}

vec4 taylorInvSqrt(vec4 value) {
  return 1.79284291400159 - 0.85373472095314 * value;
}

vec3 fade(vec3 value) {
  return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
}

float simplex3d(vec3 value) {
  const vec2 constants = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 fourth = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 skewed = floor(value + dot(value, constants.yyy));
  vec3 origin = value - skewed + dot(skewed, constants.xxx);
  vec3 ordering = step(origin.yzx, origin.xyz);
  vec3 inverseOrdering = 1.0 - ordering;
  vec3 firstOffset = min(ordering.xyz, inverseOrdering.zxy);
  vec3 secondOffset = max(ordering.xyz, inverseOrdering.zxy);
  vec3 firstCorner = origin - firstOffset + constants.xxx;
  vec3 secondCorner = origin - secondOffset + constants.yyy;
  vec3 fourthCorner = origin - 0.5;
  skewed = mod(skewed, 289.0);
  vec4 permutation = permute(permute(permute(skewed.z + vec4(0.0, firstOffset.z, secondOffset.z, 1.0)) + skewed.y + vec4(0.0, firstOffset.y, secondOffset.y, 1.0)) + skewed.x + vec4(0.0, firstOffset.x, secondOffset.x, 1.0));
  vec4 gradientIndex = permutation - 49.0 * floor(permutation / 49.0);
  vec4 x = floor(gradientIndex / 7.0);
  vec4 y = floor(gradientIndex - 7.0 * x);
  vec4 xGradient = (x * 2.0 + 0.5) / 7.0 - 1.0;
  vec4 yGradient = (y * 2.0 + 0.5) / 7.0 - 1.0;
  vec4 height = 1.0 - abs(xGradient) - abs(yGradient);
  vec4 offset = -step(height, vec4(0.0));
  xGradient -= offset * (step(0.0, xGradient) - 0.5);
  yGradient -= offset * (step(0.0, yGradient) - 0.5);
  vec4 normalizer = taylorInvSqrt(vec4(dot(vec3(xGradient.x, yGradient.x, height.x), vec3(xGradient.x, yGradient.x, height.x)), dot(vec3(xGradient.y, yGradient.y, height.y), vec3(xGradient.y, yGradient.y, height.y)), dot(vec3(xGradient.z, yGradient.z, height.z), vec3(xGradient.z, yGradient.z, height.z)), dot(vec3(xGradient.w, yGradient.w, height.w), vec3(xGradient.w, yGradient.w, height.w))));
  xGradient *= normalizer;
  yGradient *= normalizer;
  height *= normalizer;
  vec4 attenuation = max(0.6 - vec4(dot(origin, origin), dot(firstCorner, firstCorner), dot(secondCorner, secondCorner), dot(fourthCorner, fourthCorner)), 0.0);
  attenuation *= attenuation;
  vec4 gradientsX = vec4(xGradient.x, xGradient.y, xGradient.z, xGradient.w);
  vec4 gradientsY = vec4(yGradient.x, yGradient.y, yGradient.z, yGradient.w);
  vec4 gradientsZ = vec4(height.x, height.y, height.z, height.w);
  return 42.0 * dot(attenuation * attenuation, vec4(dot(vec3(gradientsX.x, gradientsY.x, gradientsZ.x), origin), dot(vec3(gradientsX.y, gradientsY.y, gradientsZ.y), firstCorner), dot(vec3(gradientsX.z, gradientsY.z, gradientsZ.z), secondCorner), dot(vec3(gradientsX.w, gradientsY.w, gradientsZ.w), fourthCorner)));
}

float fbm3d(vec3 point) {
  float total = 0.0;
  float amplitude = 0.5;
  mat3 rotation = mat3(
    0.00,  0.80,  0.60,
   -0.80,  0.36, -0.48,
   -0.60, -0.48,  0.64
  );
  for (int octave = 0; octave < 5; octave += 1) {
    total += amplitude * simplex3d(point);
    point = rotation * point * 2.02 + vec3(17.1, 9.2, 4.7);
    amplitude *= 0.5;
  }
  return total;
}
`;

export const atmosphereVertexShader = `
precision highp float;
uniform float uTime;
uniform float uScroll;
uniform float uScrollVelocity;
uniform vec2 uMouse;
uniform vec2 uVelocity;
varying vec2 vUv;
varying float vDisplacement;
${simplex3d}

void main() {
  vUv = uv;
  vec3 position3d = position;
  float scrollEnergy = clamp(abs(uScrollVelocity) * 0.006, 0.0, 1.0);
  vec3 flowPoint = vec3(position.xy * 0.72 + uVelocity * 0.035, uTime * (0.055 + scrollEnergy * 0.025) + uScroll * 1.8);
  float organicWarp = fbm3d(flowPoint);
  vec2 mousePoint = uMouse * 0.68;
  float mouseDistance = length(position.xy - mousePoint);
  float ripple = sin(mouseDistance * 18.0 - uTime * 3.5) * exp(-mouseDistance * 2.9);
  float velocityEnergy = clamp(length(uVelocity) * 0.14, 0.0, 1.0);
  position3d.z += organicWarp * 0.42 + ripple * (0.18 + velocityEnergy * 0.32);
  position3d.xy += normalize(vec2(organicWarp + 0.0001, -organicWarp + 0.0001)) * ripple * velocityEnergy * 0.08;
  vDisplacement = organicWarp + ripple * 0.45;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position3d, 1.0);
}
`;

export const atmosphereFragmentShader = `
precision highp float;
uniform float uTime;
uniform float uScroll;
uniform float uScrollVelocity;
uniform vec2 uMouse;
uniform vec2 uVelocity;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;
uniform float uOpacity;
varying vec2 vUv;
varying float vDisplacement;
${simplex3d}

void main() {
  vec2 centeredUv = vUv - 0.5;
  vec2 mouseUv = uMouse * 0.5;
  float mouseDistance = length(centeredUv - mouseUv);
  vec3 fieldPoint = vec3(centeredUv * 4.3, uTime * 0.04 + uScroll * 2.4);
  float fluid = fbm3d(fieldPoint);
  float secondaryFluid = fbm3d(fieldPoint * 1.7 + vec3(11.7, -4.3, 2.0));
  float velocityEnergy = clamp(length(uVelocity) * 0.11, 0.0, 1.0);
  float scrollEnergy = clamp(abs(uScrollVelocity) * 0.006, 0.0, 1.0);
  float wake = sin((mouseDistance * 25.0) - uTime * (4.0 + scrollEnergy * 1.8)) * exp(-mouseDistance * (4.4 - velocityEnergy));
  float strata = smoothstep(-0.35, 0.72, fluid + secondaryFluid * 0.38 + wake * (0.35 + velocityEnergy + scrollEnergy * 0.18));
  float edge = smoothstep(0.72, 0.04, length(centeredUv));
  float shimmer = smoothstep(0.15, 0.86, fluid + vDisplacement * 0.38);
  vec3 color = mix(uCoreColor, uEdgeColor, strata);
  color += uEdgeColor * wake * 0.34;
  float alpha = (0.10 + strata * 0.40 + shimmer * 0.16) * edge * uOpacity;
  gl_FragColor = vec4(color, alpha);
}
`;
