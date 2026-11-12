export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
export const lerp = (start: number, end: number, amount: number): number => start + (end - start) * amount;
export const formatNumber = (value: number): string => value.toLocaleString('en-US');

/** A tiny deterministic random-number generator used for procedural visuals. */
export function mulberry32(initialSeed: number): () => number {
  let seed = initialSeed;
  return function random(): number {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
