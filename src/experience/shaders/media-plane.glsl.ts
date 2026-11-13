export const mediaPlaneVertexShader = `
precision highp float;
uniform float uTime;
uniform float uScrollVelocity;
uniform float uHover;
uniform vec2 uPointer;
varying vec2 vUv;
varying float vBend;
varying float vHover;

void main() {
  vUv = uv;
  vHover = uHover;
  float scrollEnergy = clamp(abs(uScrollVelocity) * 0.006, 0.0, 1.0);
  vec2 pointerDelta = uv - uPointer;
  float pointerDistance = length(pointerDelta);
  float pointerInfluence = exp(-pointerDistance * 6.4) * uHover;
  float wave = sin(uv.y * 14.0 + uv.x * 5.0 - uTime * (1.8 + scrollEnergy * 2.4));
  vec3 transformed = position;
  transformed.z += wave * (0.018 + scrollEnergy * 0.075) + pointerInfluence * 0.07;
  transformed.x += (uv.y - 0.5) * wave * scrollEnergy * 0.025;
  transformed.y += (uv.x - 0.5) * pointerInfluence * 0.024;
  vBend = wave * (0.5 + scrollEnergy * 0.5) + pointerInfluence;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

export const mediaPlaneFragmentShader = `
precision highp float;
uniform float uTime;
uniform float uHover;
uniform vec3 uTint;
uniform float uOpacity;
varying vec2 vUv;
varying float vBend;
varying float vHover;

float frameMask(vec2 coordinate) {
  vec2 mirrored = abs(coordinate - 0.5) * 2.0;
  float edge = max(mirrored.x, mirrored.y);
  return smoothstep(0.84, 0.98, edge);
}

void main() {
  vec2 chromaticOffset = vec2(0.007 + sin(uTime * 1.7 + vUv.y * 12.0) * 0.002, 0.0) * uHover;
  float redFrame = frameMask(vUv + chromaticOffset);
  float greenFrame = frameMask(vUv);
  float blueFrame = frameMask(vUv - chromaticOffset);
  vec3 chromaticFrame = vec3(redFrame, greenFrame, blueFrame) * uTint;
  float scan = smoothstep(0.93, 1.0, sin((vUv.y + uTime * 0.032) * 150.0) * 0.5 + 0.5);
  float centerGlow = smoothstep(0.78, 0.08, length(vUv - 0.5)) * (0.025 + vHover * 0.055);
  float alpha = (greenFrame * 0.18 + scan * 0.028 + centerGlow) * uOpacity * (0.55 + vHover * 0.8);
  vec3 color = chromaticFrame + uTint * (scan * 0.18 + max(vBend, 0.0) * 0.11);
  gl_FragColor = vec4(color, alpha);
}
`;
