import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';

import { A } from './data/artifacts';
import { initArchive } from './components/archive';
import { initAudioControls } from './components/audio';
import { startBoot } from './components/boot';
import { initInterface } from './components/interface';
import { initMoonCatalogue } from './components/moon-catalogue';
import { initTimeline } from './components/timeline';
import { initScrollEngine } from './experience/scroll-engine';
import { $, $$ } from './lib/dom';
import { reducedMotion } from './lib/utils';

gsap.registerPlugin(ScrollTrigger);

/** Application composition root. Semantic archive content starts before optional WebGL layers. */
function bootArchive(): void {
  $$<HTMLElement>('[data-total]').forEach((element) => { element.textContent = String(A.length); });
  const heroCount = $<HTMLElement>('#heroCount');
  heroCount.dataset.to = String(A.length);

  initAudioControls();
  initTimeline();
  initArchive();
  initMoonCatalogue();
  initScrollEngine();
  if (!reducedMotion) {
    const loadAmbientCanvas = (): void => {
      void import('./experience/mount').then(({ mountWebglExperience }) => mountWebglExperience());
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadAmbientCanvas, { timeout: 900 });
    else setTimeout(loadAmbientCanvas, 240);
  } else {
    document.documentElement.dataset.webgl = 'reduced-motion';
  }

  const observatory = document.querySelector<HTMLElement>('#observatory');
  let observatoryLoaded = false;
  const loadObservatory = async (): Promise<void> => {
    if (observatoryLoaded) return;
    observatoryLoaded = true;
    try {
      const { initObservatory, startObservatoryRenderLoop } = await import('./components/observatory');
      initObservatory();
      startObservatoryRenderLoop();
    } catch (error: unknown) {
      console.warn('WebGL unavailable:', error);
      const loadingMessage = document.querySelector<HTMLElement>('#vpLoad');
      if (loadingMessage) loadingMessage.textContent = 'WebGL unavailable — dossiers still available in the Field Guide';
    }
  };
  if ('IntersectionObserver' in window && observatory) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void loadObservatory();
    }, { rootMargin: '360px 0px' });
    observer.observe(observatory);
  } else {
    void loadObservatory();
  }

  $<HTMLElement>('#fDate').textContent = new Date().toUTCString();
  startBoot(initInterface);
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', bootArchive, { once: true });
else bootArchive();
