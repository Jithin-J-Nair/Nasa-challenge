import { gsap } from 'gsap';
import { $, $$ } from '../lib/dom';
import { formatNumber, reducedMotion } from '../lib/utils';
import { scramble, starCanvas } from './visual-effects';
import { initLiquidGlassNavbar } from './ui/liquid-glass-navbar';
import { initSpatialUi } from './spatial-ui';
import { buildHelio, buildRecord, buildTicker, startLiveNumbers } from './telemetry';

/** Set up the semantic DOM overlay after the non-blocking boot completes. */
export function initInterface(): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const disposeStarCanvas = starCanvas($<HTMLCanvasElement>('#stars'), .00038, 0);
  const episodeCanvas = document.querySelector<HTMLCanvasElement>('#epiCanvas');
  const disposeEpisodeCanvas = episodeCanvas ? starCanvas(episodeCanvas, .00022, 2.2) : () => undefined;
  const animations: gsap.core.Tween[] = [];
  const scrambleDisposers: Array<() => void> = [];
  const countObservers: IntersectionObserver[] = [];
  let heroScrollFrame: number | null = null;

  $$<HTMLElement>('.count').forEach((element) => {
    const total = Number(element.dataset.to || 0);
    const suffix = element.dataset.suffix || '';
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (reducedMotion) {
          element.textContent = formatNumber(total) + suffix;
        } else {
          const animation = gsap.fromTo(element, { innerText: 0 }, {
            innerText: total,
            duration: 2.1,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate: () => { element.textContent = formatNumber(Math.round(Number(element.innerText))) + suffix; },
          });
          animations.push(animation);
        }
        observer.disconnect();
      });
    }, { threshold: .4 });
    countObservers.push(observer);
    observer.observe(element);
  });

  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const spans = Array.from(entry.target.querySelectorAll<HTMLElement>('.lm>span'));
      if (spans.length === 0) return;
      if (reducedMotion) spans.forEach((span) => { span.style.transform = 'none'; span.style.opacity = '1'; });
      else spans.forEach((span, index) => animations.push(gsap.to(span, { y: 0, opacity: 1, duration: 1.05, delay: index * .11, ease: 'expo.out' })));
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
      if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) return;
      scrambleDisposers.push(scramble(entry.target));
      scrambleObserver.unobserve(entry.target);
    });
  }, { threshold: .6 });
  $$<HTMLElement>('[data-scramble]').forEach((element) => scrambleObserver.observe(element));

  if (!reducedMotion) {
    const stars = document.querySelector<HTMLElement>('#stars');
    const hero = document.querySelector<HTMLElement>('#hero');
    if (stars && hero) {
      const onScroll = (): void => {
        if (heroScrollFrame !== null) return;
        heroScrollFrame = requestAnimationFrame(() => {
          heroScrollFrame = null;
          const position = Math.min(window.scrollY, hero.offsetHeight);
          stars.style.transform = `translate3d(0, ${(position * .16).toFixed(2)}px, 0)`;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true, signal });
    }
  }

  $$<HTMLElement>('[data-scroll]').forEach((button) => {
    const onScrollToSection = (): void => {
      const selector = button.dataset.scroll;
      if (!selector) return;
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) return;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 40, behavior: reducedMotion ? 'auto' : 'smooth' });
    };
    button.addEventListener('click', onScrollToSection, { signal });
  });

  const disposeNavbar = initLiquidGlassNavbar();
  const disposeSpatialUi = initSpatialUi();
  buildTicker();
  buildHelio();
  buildRecord();
  const disposeLiveNumbers = startLiveNumbers();

  return (): void => {
    controller.abort();
    countObservers.forEach((observer) => observer.disconnect());
    headingObserver.disconnect();
    revealObserver.disconnect();
    scrambleObserver.disconnect();
    animations.forEach((animation) => animation.kill());
    scrambleDisposers.splice(0).forEach((dispose) => dispose());
    if (heroScrollFrame !== null) cancelAnimationFrame(heroScrollFrame);
    disposeLiveNumbers();
    disposeSpatialUi();
    disposeNavbar();
    disposeEpisodeCanvas();
    disposeStarCanvas();
  };
}
