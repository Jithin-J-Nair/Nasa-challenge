export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (start, end, amount) => start + (end - start) * amount;
export const formatNumber = (value) => value.toLocaleString('en-US');

/** A tiny deterministic random-number generator used for procedural visuals. */
export function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
