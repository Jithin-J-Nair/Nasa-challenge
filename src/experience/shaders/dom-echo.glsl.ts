export const domEchoVertexShader = `
precision highp float;
uniform float uTime;
uniform float uScroll;
uniform float uScrollVelocity;
uniform vec2 uVelocity;
varying vec2 vUv;
varying float vPulse;

void main() {
  vUv = uv;
  vec3 transformed = position;
  float scrollEnergy = clamp(abs(uScrollVelocity) * 0.006, 0.0, 1.0);
  float wave = sin((uv.x + uv.y + uScroll) * 9.0 - uTime * (1.9 + scrollEnergy * 1.4));
  transformed.z += wave * (0.025 + length(uVelocity) * 0.012 + scrollEnergy * 0.025);
  vPulse = wave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

export const domEchoFragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying float vPulse;

void main() {
  vec2 mirrored = abs(vUv - 0.5) * 2.0;
  float frame = max(smoothstep(0.84, 0.98, mirrored.x), smoothstep(0.84, 0.98, mirrored.y));
  float scan = smoothstep(0.94, 1.0, sin((vUv.y + uTime * 0.045) * 180.0) * 0.5 + 0.5);
  float alpha = (frame * 0.62 + scan * 0.11) * (0.65 + vPulse * 0.22) * uOpacity;
  gl_FragColor = vec4(uColor, alpha);
}
`;
