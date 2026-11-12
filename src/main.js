import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';

import { A } from './data/artifacts.js';
import { initArchive } from './components/archive.js';
import { startBoot } from './components/boot.js';
import { initInterface } from './components/interface.js';
import { initTimeline } from './components/timeline.js';
import { $, $$ } from './lib/dom.js';

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/** Application composition root. Individual experiences live in focused modules. */
function bootArchive() {
  $$('[data-total]').forEach((element) => {
    element.textContent = A.length;
  });
  const heroCount = $('#heroCount');
  if (heroCount) heroCount.dataset.to = A.length;

  // Initialise the non-WebGL experiences first, so the archive remains useful
  // even on browsers without a hardware-accelerated canvas.
  initTimeline();
  initArchive();

  // Three.js and the observatory are intentionally split out of the first
  // interaction chunk. The archive remains searchable while the optional 3D
  // experience loads only as it approaches the viewport.
  const observatory = $('#observatory');
  let observatoryLoaded = false;
  const loadObservatory = async () => {
    if (observatoryLoaded) return;
    observatoryLoaded = true;
    try {
      const { initObservatory, startObservatoryRenderLoop } = await import('./components/observatory.js');
      initObservatory();
      startObservatoryRenderLoop();
    } catch (error) {
      console.warn('WebGL unavailable:', error);
      $('#vpLoad').textContent = 'WebGL unavailable — dossiers still available in the Field Guide';
    }
  };
  if ('IntersectionObserver' in window && observatory) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        loadObservatory();
      }
    }, { rootMargin: '360px 0px' });
    observer.observe(observatory);
  } else {
    loadObservatory();
  }

  $('#fDate').textContent = new Date().toUTCString();
  startBoot(initInterface);
}

if (document.readyState === 'loading') {
  addEventListener('DOMContentLoaded', bootArchive);
} else {
  bootArchive();
}
