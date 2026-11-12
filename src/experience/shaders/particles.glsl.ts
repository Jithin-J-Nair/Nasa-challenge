const simplexCurlNoise = `
vec4 particlePermute(vec4 value) {
  return mod(((value * 34.0) + 1.0) * value, 289.0);
}

vec4 particleTaylorInvSqrt(vec4 value) {
  return 1.79284291400159 - 0.85373472095314 * value;
}

float particleSimplex3d(vec3 value) {
  const vec2 constants = vec2(1.0 / 6.0, 1.0 / 3.0);
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
  vec4 permutation = particlePermute(particlePermute(particlePermute(skewed.z + vec4(0.0, firstOffset.z, secondOffset.z, 1.0)) + skewed.y + vec4(0.0, firstOffset.y, secondOffset.y, 1.0)) + skewed.x + vec4(0.0, firstOffset.x, secondOffset.x, 1.0));
  vec4 gradientIndex = permutation - 49.0 * floor(permutation / 49.0);
  vec4 x = floor(gradientIndex / 7.0);
  vec4 y = floor(gradientIndex - 7.0 * x);
  vec4 xGradient = (x * 2.0 + 0.5) / 7.0 - 1.0;
  vec4 yGradient = (y * 2.0 + 0.5) / 7.0 - 1.0;
  vec4 height = 1.0 - abs(xGradient) - abs(yGradient);
  vec4 offset = -step(height, vec4(0.0));
  xGradient -= offset * (step(0.0, xGradient) - 0.5);
  yGradient -= offset * (step(0.0, yGradient) - 0.5);
  vec4 normalization = particleTaylorInvSqrt(vec4(dot(vec3(xGradient.x, yGradient.x, height.x), vec3(xGradient.x, yGradient.x, height.x)), dot(vec3(xGradient.y, yGradient.y, height.y), vec3(xGradient.y, yGradient.y, height.y)), dot(vec3(xGradient.z, yGradient.z, height.z), vec3(xGradient.z, yGradient.z, height.z)), dot(vec3(xGradient.w, yGradient.w, height.w), vec3(xGradient.w, yGradient.w, height.w))));
  xGradient *= normalization;
  yGradient *= normalization;
  height *= normalization;
  vec4 attenuation = max(0.6 - vec4(dot(origin, origin), dot(firstCorner, firstCorner), dot(secondCorner, secondCorner), dot(fourthCorner, fourthCorner)), 0.0);
  attenuation *= attenuation;
  return 42.0 * dot(attenuation * attenuation, vec4(dot(vec3(xGradient.x, yGradient.x, height.x), origin), dot(vec3(xGradient.y, yGradient.y, height.y), firstCorner), dot(vec3(xGradient.z, yGradient.z, height.z), secondCorner), dot(vec3(xGradient.w, yGradient.w, height.w), fourthCorner)));
}

vec3 curlNoise(vec3 point) {
  float epsilon = 0.12;
  float x1 = particleSimplex3d(point + vec3(epsilon, 0.0, 0.0));
  float x2 = particleSimplex3d(point - vec3(epsilon, 0.0, 0.0));
  float y1 = particleSimplex3d(point + vec3(0.0, epsilon, 0.0));
  float y2 = particleSimplex3d(point - vec3(0.0, epsilon, 0.0));
  float z1 = particleSimplex3d(point + vec3(0.0, 0.0, epsilon));
  float z2 = particleSimplex3d(point - vec3(0.0, 0.0, epsilon));
  vec3 gradient = vec3(x1 - x2, y1 - y2, z1 - z2) / (2.0 * epsilon);
  return normalize(vec3(gradient.y - gradient.z, gradient.z - gradient.x, gradient.x - gradient.y) + vec3(0.0001));
}
`;

export const particleVertexShader = `
precision highp float;
attribute float aSeed;
attribute float aSize;
uniform float uTime;
uniform float uScroll;
uniform float uScrollVelocity;
uniform vec2 uMouse;
uniform vec2 uVelocity;
uniform float uPixelRatio;
varying float vAlpha;
varying float vDepth;
${simplexCurlNoise}

void main() {
  vec3 simulationPosition = position;
  float phase = aSeed * 6.28318530718;
  float scrollEnergy = clamp(abs(uScrollVelocity) * 0.006, 0.0, 1.0);
  vec3 driftPoint = simulationPosition * 0.31 + vec3(uTime * (0.045 + scrollEnergy * 0.018), -uTime * 0.031, uScroll * 2.2 + phase);
  vec3 flow = curlNoise(driftPoint);
  simulationPosition += flow * (0.72 + fract(aSeed * 19.7) * 0.48 + scrollEnergy * 0.24);
  simulationPosition += vec3(sin(uTime * 0.42 + phase), cos(uTime * 0.31 + phase * 1.3), sin(uTime * 0.27 + phase * 0.7)) * 0.18;

  vec3 mouseField = vec3(uMouse.x * 3.6, uMouse.y * 2.2, 0.0);
  vec3 mouseDelta = simulationPosition - mouseField;
  float mouseDistance = max(length(mouseDelta), 0.08);
  vec3 mouseDirection = mouseDelta / mouseDistance;
  float velocityEnergy = clamp(length(uVelocity) * 0.1, 0.0, 1.0);
  float repulsion = exp(-mouseDistance * 1.15) * (0.45 + velocityEnergy * 1.5);
  float attraction = (1.0 - exp(-mouseDistance * 0.95)) * exp(-mouseDistance * 0.24) * (0.045 + scrollEnergy * 0.1);
  simulationPosition += mouseDirection * repulsion;
  simulationPosition -= mouseDirection * attraction;
  simulationPosition += vec3(uVelocity * 0.7, 0.0) * exp(-mouseDistance * 0.72);

  vec4 modelViewPosition = modelViewMatrix * vec4(simulationPosition, 1.0);
  float depth = clamp((-modelViewPosition.z) / 12.0, 0.0, 1.0);
  gl_PointSize = aSize * uPixelRatio * (9.0 / max(1.0, -modelViewPosition.z));
  gl_Position = projectionMatrix * modelViewPosition;
  vDepth = depth;
  vAlpha = (0.38 + fract(aSeed * 91.1) * 0.62) * (1.0 - depth * 0.58);
}
`;

export const particleFragmentShader = `
precision highp float;
uniform vec3 uNearColor;
uniform vec3 uFarColor;
varying float vAlpha;
varying float vDepth;

void main() {
  vec2 coordinate = gl_PointCoord - 0.5;
  float distanceToCenter = length(coordinate);
  float softCircle = 1.0 - smoothstep(0.04, 0.5, distanceToCenter);
  float core = 1.0 - smoothstep(0.0, 0.18, distanceToCenter);
  vec3 color = mix(uNearColor, uFarColor, vDepth);
  color += core * 0.62;
  gl_FragColor = vec4(color, softCircle * vAlpha);
}
`;
