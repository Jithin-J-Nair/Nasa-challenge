import { $ } from '../lib/dom';
import { reducedMotion } from '../lib/utils';

const BOOT_KEY = 'silent-fleet-acquisition-v3';

/**
 * Starts the archive without allowing a decorative acquisition screen to delay
 * the hero. The old overlay is retained in markup for progressive enhancement,
 * but is hidden before it can paint: first visits, repeat visits, and reduced
 * motion all get the content immediately. A local marker records repeat visits
 * without being required for the experience to work.
 */
export function startBoot(onReady: () => void): void {
  const boot = $('#boot');
  const skipForMotion = reducedMotion;
  let seen = false;
  try {
    seen = localStorage.getItem(BOOT_KEY) === 'seen';
    if (!skipForMotion && !seen) localStorage.setItem(BOOT_KEY, 'seen');
  } catch {
    // Private browsing can deny storage; it must not reintroduce a blocker.
  }

  if (boot) {
    boot.hidden = true;
    boot.classList.add('done');
  }
  document.body.classList.add('ready');
  onReady();

  // Retain these booleans in a dataset for repeat-visit and motion checks in
  // visual diagnostics, with no user-facing delay or overlay paint.
  document.documentElement.dataset.boot = (skipForMotion || seen) ? 'skipped' : 'instant';
}
