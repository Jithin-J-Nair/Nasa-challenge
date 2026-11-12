import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';

import { A } from './data/artifacts.js';
import { initArchive } from './components/archive.js';
import { startBoot } from './components/boot.js';
import { initInterface } from './components/interface.js';
import { initObservatory, startObservatoryRenderLoop } from './components/observatory.js';
import { initTimeline } from './components/timeline.js';
import { $, $$ } from './lib/dom.js';

gsap.registerPlugin(ScrollTrigger);

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

  try {
    initObservatory();
    startObservatoryRenderLoop();
  } catch (error) {
    console.warn('WebGL unavailable:', error);
    $('#vpLoad').textContent = 'WebGL unavailable — dossiers still available in the Field Guide';
  }

  $('#fDate').textContent = new Date().toUTCString();
  startBoot(initInterface);
}

if (document.readyState === 'loading') {
  addEventListener('DOMContentLoaded', bootArchive);
} else {
  bootArchive();
}
