import { gsap } from 'gsap';
import { $, $$ } from '../lib/dom';
import { formatNumber, reducedMotion } from '../lib/utils';
import { scramble, starCanvas } from './visual-effects';
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
  const timelines: gsap.core.Timeline[] = [];
  const scrambleDisposers: Array<() => void> = [];
  const countObservers: IntersectionObserver[] = [];
  let heroScrollFrame: number | null = null;

  // The arrival is intentionally quiet. Telemetry enters only after visitors
  // leave the opening scene, where it becomes a directional reading aid rather
  // than dashboard noise competing with the evidence image.
  const arrivalSection = document.querySelector<HTMLElement>('#hero');
  const updateArrivalStage = (): void => {
    if (!arrivalSection) return;
    document.body.classList.toggle('past-arrival', window.scrollY > arrivalSection.offsetHeight * .72);
  };
  updateArrivalStage();
  window.addEventListener('scroll', updateArrivalStage, { passive: true, signal });

  if (!reducedMotion) {
    const hero = document.querySelector<HTMLElement>('#hero');
    const eyebrow = hero?.querySelector<HTMLElement>('.eyebrow');
    const kicker = hero?.querySelector<HTMLElement>('.hero-kicker');
    const title = hero?.querySelector<HTMLElement>('.hero-title');
    const lede = hero?.querySelector<HTMLElement>('.hero-lede');
    const actions = hero?.querySelector<HTMLElement>('.herocta');
    const evidence = hero?.querySelector<HTMLElement>('.hero-evidence');
    const proof = hero?.querySelector<HTMLElement>('.hero-proof');
    if (eyebrow && kicker && title && lede && actions && evidence && proof) {
      const arrival = gsap.timeline({ defaults: { ease: 'power3.out' } });
      arrival
        .addLabel('signal', 0)
        .from(eyebrow, { autoAlpha: 0, x: -18, duration: .42 }, 'signal')
        .from(kicker, { autoAlpha: 0, y: 14, duration: .46 }, 'signal+=.08')
        .from(title, { autoAlpha: 0, y: 32, duration: .8 }, 'signal+=.14')
        .from(lede, { autoAlpha: 0, y: 20, duration: .55 }, 'signal+=.3')
        .from(actions, { autoAlpha: 0, y: 16, duration: .45 }, 'signal+=.39')
        // The evidence plate also uses the shared reveal observer. Define both
        // states explicitly so its final opacity never depends on observer/timeline
        // startup order in a production bundle.
        .fromTo(evidence, { autoAlpha: 0, y: 34, rotation: 1.2 }, { autoAlpha: 1, y: 0, rotation: 0, duration: .85 }, 'signal+=.16')
        .from(proof.children, { autoAlpha: 0, y: 16, duration: .42, stagger: .07 }, 'signal+=.55');
      timelines.push(arrival);
    }
  }

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
      if (spans.length === 0) {
        headingObserver.unobserve(entry.target);
        return;
      }
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
    const evidencePlate = document.querySelector<HTMLElement>('[data-evidence-tilt]');
    if (evidencePlate && window.matchMedia('(pointer:fine)').matches) {
      let evidenceFrame: number | null = null;
      let evidencePointer: { x: number; y: number } | null = null;
      const updateEvidenceTilt = (): void => {
        evidenceFrame = null;
        if (!evidencePointer) return;
        const bounds = evidencePlate.getBoundingClientRect();
        const horizontal = ((evidencePointer.x - bounds.left) / bounds.width - .5) * 2;
        const vertical = ((evidencePointer.y - bounds.top) / bounds.height - .5) * 2;
        evidencePlate.style.setProperty('--evidence-rotate-x', `${(-vertical * 2.6).toFixed(2)}deg`);
        evidencePlate.style.setProperty('--evidence-rotate-y', `${(horizontal * 3.2).toFixed(2)}deg`);
      };
      const onEvidencePointerMove = (event: PointerEvent): void => {
        evidencePointer = { x: event.clientX, y: event.clientY };
        if (evidenceFrame === null) evidenceFrame = requestAnimationFrame(updateEvidenceTilt);
      };
      const resetEvidenceTilt = (): void => {
        evidencePointer = null;
        evidencePlate.style.setProperty('--evidence-rotate-x', '0deg');
        evidencePlate.style.setProperty('--evidence-rotate-y', '0deg');
      };
      evidencePlate.addEventListener('pointermove', onEvidencePointerMove, { passive: true, signal });
      evidencePlate.addEventListener('pointerleave', resetEvidenceTilt, { signal });
      signal.addEventListener('abort', () => {
        if (evidenceFrame !== null) cancelAnimationFrame(evidenceFrame);
      }, { once: true });
    }

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
      window.scrollTo({
        top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - 62),
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    };
    button.addEventListener('click', onScrollToSection, { signal });
  });

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
    timelines.forEach((timeline) => timeline.kill());
    scrambleDisposers.splice(0).forEach((dispose) => dispose());
    if (heroScrollFrame !== null) cancelAnimationFrame(heroScrollFrame);
    disposeLiveNumbers();
    disposeSpatialUi();
    disposeEpisodeCanvas();
    disposeStarCanvas();
  };
}
