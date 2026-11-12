import { A } from '../data/artifacts.js';
import { $ } from '../lib/dom.js';
import { reducedMotion } from '../lib/utils.js';

const bootLines = [
  'DEEP SPACE NETWORK · UPLINK ESTABLISHED',
  'EPHEMERIS SYNC · <b>OK</b>',
  `LOADING ARTEFACT CATALOGUE · <i>${A.length} OBJECTS</i>`,
  'GENERATING LUNAR SURFACE MODEL · <b>1,737.4 KM</b>',
  'GENERATING MARTIAN SURFACE MODEL · <b>3,389.5 KM</b>',
  'COMPILING MISSION CHRONOLOGY · 1959 → 2026',
  'QUERYING VOYAGER 1 · <i>173 AU · RESPONDING</i>',
  'ARCHIVE READY',
];

/** Runs the archive-acquisition screen and starts the supplied experience callback. */
export function startBoot(onReady) {
  const bootLog = $('#bootlog');
  const bootFill = $('#bootfill');
  let complete = false;

  function finish() {
    if (complete) return;
    complete = true;
    bootFill.style.width = '100%';
    setTimeout(() => {
      $('#boot').classList.add('done');
      document.body.classList.add('ready');
      onReady();
    }, reducedMotion ? 60 : 420);
  }

  function run() {
    let lineIndex = 0;
    const step = () => {
      if (lineIndex >= bootLines.length) {
        finish();
        return;
      }
      const line = document.createElement('div');
      line.innerHTML = `&gt; ${bootLines[lineIndex]}`;
      line.style.opacity = '0';
      bootLog.appendChild(line);
      requestAnimationFrame(() => {
        line.style.transition = 'opacity .25s';
        line.style.opacity = '1';
      });
      while (bootLog.children.length > 6) bootLog.removeChild(bootLog.firstChild);
      bootFill.style.width = `${Math.round(((lineIndex + 1) / bootLines.length) * 100)}%`;
      lineIndex += 1;
      setTimeout(step, reducedMotion ? 10 : 150 + Math.random() * 90);
    };
    step();
  }

  $('#bootskip').addEventListener('click', finish, { once: true });
  setTimeout(finish, 9000);
  run();
}
