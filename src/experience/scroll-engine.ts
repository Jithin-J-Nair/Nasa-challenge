import Lenis from 'lenis';
import { reducedMotion } from '../lib/utils';

export interface ScrollSignal {
  scroll: number;
  progress: number;
  velocity: number;
}

export const SCROLL_SIGNAL_EVENT = 'silent-fleet:scroll';

let disposeScrollEngine: (() => void) | null = null;

/**
 * Lenis is an enhancement for precision pointers. Touch and reduced-motion
 * users retain native scroll, so platform momentum and browser accessibility
 * controls remain intact.
 */
export function initScrollEngine(): () => void {
  if (disposeScrollEngine) return disposeScrollEngine;
  const useNativeScroll = reducedMotion || matchMedia('(pointer: coarse)').matches;
  document.documentElement.dataset.scrollEngine = useNativeScroll ? 'native' : 'lenis';
  if (useNativeScroll) {
    disposeScrollEngine = () => { document.documentElement.dataset.scrollEngine = 'stopped'; };
    return disposeScrollEngine;
  }
  const lenis = new Lenis({ lerp: .085, smoothWheel: true, syncTouch: false, wheelMultiplier: .85 });
  const onScroll = (instance: Lenis): void => {
    const signal: ScrollSignal = { scroll: instance.scroll, progress: instance.progress, velocity: instance.velocity };
    document.documentElement.style.setProperty('--scroll-progress', signal.progress.toFixed(5));
    document.documentElement.style.setProperty('--scroll-velocity', signal.velocity.toFixed(4));
    window.dispatchEvent(new CustomEvent<ScrollSignal>(SCROLL_SIGNAL_EVENT, { detail: signal }));
  };
  lenis.on('scroll', onScroll);
  let frameId: number | null = null;
  const frame = (time: number): void => {
    lenis.raf(time);
    frameId = requestAnimationFrame(frame);
  };
  frameId = requestAnimationFrame(frame);
  disposeScrollEngine = (): void => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    lenis.off('scroll', onScroll);
    lenis.destroy();
    document.documentElement.dataset.scrollEngine = 'stopped';
    disposeScrollEngine = null;
  };
  return disposeScrollEngine;
}
