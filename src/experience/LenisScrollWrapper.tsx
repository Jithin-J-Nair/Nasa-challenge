import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from '../lib/utils';

export interface ScrollSignal {
  scroll: number;
  progress: number;
  velocity: number;
}

export const SCROLL_SIGNAL_EVENT = 'silent-fleet:scroll';

interface ActiveScrollController {
  release: () => void;
}

let activeController: ActiveScrollController | null = null;

function publishScrollSignal(signal: ScrollSignal): void {
  document.documentElement.style.setProperty('--scroll-progress', signal.progress.toFixed(5));
  document.documentElement.style.setProperty('--scroll-velocity', signal.velocity.toFixed(4));
  window.dispatchEvent(new CustomEvent<ScrollSignal>(SCROLL_SIGNAL_EVENT, { detail: signal }));
  ScrollTrigger.update();
}

function scrollProgress(scroll: number): number {
  const range = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  return Math.min(1, Math.max(0, scroll / range));
}

function createNativeScrollController(): () => void {
  let previousScroll = window.scrollY;
  let previousTime = performance.now();
  const publishNativeScroll = (): void => {
    const now = performance.now();
    const scroll = window.scrollY;
    const elapsed = Math.max(now - previousTime, 1);
    publishScrollSignal({
      scroll,
      progress: scrollProgress(scroll),
      velocity: (scroll - previousScroll) / elapsed,
    });
    previousScroll = scroll;
    previousTime = now;
  };
  window.addEventListener('scroll', publishNativeScroll, { passive: true });
  publishNativeScroll();
  return (): void => window.removeEventListener('scroll', publishNativeScroll);
}

/**
 * Runs Lenis from GSAP's single ticker. This removes a competing RAF loop and
 * gives shaders, ScrollTrigger, and the document one shared timebase.
 */
export function initLenisScroll(): () => void {
  if (activeController) return activeController.release;
  const useNativeScroll = reducedMotion || matchMedia('(pointer: coarse)').matches;
  document.documentElement.dataset.scrollEngine = useNativeScroll ? 'native' : 'lenis';

  if (useNativeScroll) {
    const stopNativeScroll = createNativeScrollController();
    const release = (): void => {
      stopNativeScroll();
      if (activeController?.release === release) activeController = null;
      document.documentElement.dataset.scrollEngine = 'stopped';
    };
    activeController = { release };
    return release;
  }

  const lenis = new Lenis({
    lerp: .085,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: .85,
  });
  const onScroll = (instance: Lenis): void => {
    publishScrollSignal({
      scroll: instance.scroll,
      progress: instance.progress,
      velocity: instance.velocity,
    });
  };
  const onGsapTick = (timeSeconds: number): void => lenis.raf(timeSeconds * 1000);
  lenis.on('scroll', onScroll);
  gsap.ticker.add(onGsapTick);
  onScroll(lenis);

  const release = (): void => {
    lenis.off('scroll', onScroll);
    gsap.ticker.remove(onGsapTick);
    lenis.destroy();
    if (activeController?.release === release) activeController = null;
    document.documentElement.dataset.scrollEngine = 'stopped';
  };
  activeController = { release };
  return release;
}
