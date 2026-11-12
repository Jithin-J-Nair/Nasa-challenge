import { gsap } from 'gsap';
import { $, $$ } from '../lib/dom';
import { formatNumber, lerp, reducedMotion } from '../lib/utils';
import { scramble, starCanvas } from './visual-effects';
import { initLiquidGlassNavbar } from './ui/liquid-glass-navbar';
import { initSpatialUi } from './spatial-ui';
import { buildHelio, buildRecord, buildTicker, liveNumbers } from './telemetry';

/** Set up the semantic DOM overlay after the non-blocking boot completes. */
export function initInterface(): void {
  starCanvas($<HTMLCanvasElement>('#stars'), 0.00038, 0);
  const episodeCanvas = document.querySelector<HTMLCanvasElement>('#epiCanvas');
  if (episodeCanvas) starCanvas(episodeCanvas, 0.00022, 2.2);

  $$<HTMLElement>('.count').forEach((element) => {
    const total = Number(element.dataset.to || 0);
    const suffix = element.dataset.suffix || '';
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (reducedMotion) {
          element.textContent = formatNumber(total) + suffix;
        } else {
          gsap.fromTo(element, { innerText: 0 }, {
            innerText: total,
            duration: 2.1,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate: () => { element.textContent = formatNumber(Math.round(Number(element.innerText))) + suffix; },
          });
        }
        observer.disconnect();
      });
    }, { threshold: .4 });
    observer.observe(element);
  });

  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const spans = Array.from(entry.target.querySelectorAll<HTMLElement>('.lm>span'));
      if (spans.length === 0) return;
      if (reducedMotion) spans.forEach((span) => { span.style.transform = 'none'; span.style.opacity = '1'; });
      else spans.forEach((span, index) => gsap.to(span, { y: 0, opacity: 1, duration: 1.05, delay: index * .11, ease: 'expo.out' }));
      headingObserver.unobserve(entry.target);
    });
  }, { threshold: .2 });
  $$<HTMLElement>('.h1,.h2,.herotitle').forEach((heading) => headingObserver.observe(heading));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
  $$<HTMLElement>('[data-reveal]').forEach((element) => revealObserver.observe(element));

  const scrambleObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target instanceof HTMLElement) scramble(entry.target);
      scrambleObserver.unobserve(entry.target);
    });
  }, { threshold: .6 });
  $$<HTMLElement>('[data-scramble]').forEach((element) => scrambleObserver.observe(element));

  if (!reducedMotion) {
    const stars = document.querySelector<HTMLElement>('#stars');
    const hero = document.querySelector<HTMLElement>('#hero');
    if (stars && hero) {
      let frameId = 0;
      const onScroll = (): void => {
        if (frameId) return;
        frameId = requestAnimationFrame(() => {
          frameId = 0;
          const position = Math.min(window.scrollY, hero.offsetHeight);
          stars.style.transform = `translate3d(0, ${(position * .16).toFixed(2)}px, 0)`;
        });
      };
      addEventListener('scroll', onScroll, { passive: true });
    }
  }

  $$<HTMLElement>('[data-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
      const selector = button.dataset.scroll;
      if (!selector) return;
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) return;
      window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 40, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  initLiquidGlassNavbar();
  initSpatialUi();

  buildTicker();
  buildHelio();
  buildRecord();
  liveNumbers();
}
