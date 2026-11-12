import { reducedMotion } from '../../lib/utils';

interface Ripple {
  x: number;
  y: number;
  start: number;
  strength: number;
}

interface NavigationSection {
  element: HTMLElement;
  index: number;
}

interface ActivateOptions {
  focus?: boolean;
  event?: MouseEvent | PointerEvent;
}

/** Accessible hash navigation with typed liquid-canvas interaction and disposal. */
export function initLiquidGlassNavbar(root = document.querySelector<HTMLElement>('#liquidNav')): () => void {
  if (!root) return () => undefined;
  const items = Array.from(root.querySelectorAll<HTMLAnchorElement>('.liquid-nav-item'));
  const drop = root.querySelector<HTMLElement>('.liquid-nav-drop');
  const canvas = root.querySelector<HTMLCanvasElement>('.liquid-nav-water');
  const context = canvas?.getContext('2d') || null;
  const mediaQuery = matchMedia('(max-width: 960px)');
  const listenerController = new AbortController();
  const { signal } = listenerController;
  const ripples: Ripple[] = [];
  let activeIndex = Math.max(0, items.findIndex((item) => item.getAttribute('aria-current') === 'page'));
  let drawing = false;
  let visible = true;
  let animationFrame: number | null = null;
  let measureFrame: number | null = null;
  let initialMeasureFrame: number | null = null;
  let longJumpTimer: number | null = null;

  const resizeCanvas = (): void => {
    if (!canvas || !context) return;
    const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.ceil(root.offsetWidth + 28);
    const height = Math.ceil(root.offsetHeight + 28);
    if (canvas.width === Math.ceil(width * deviceScale) && canvas.height === Math.ceil(height * deviceScale)) return;
    canvas.width = Math.ceil(width * deviceScale);
    canvas.height = Math.ceil(height * deviceScale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  };

  const setCompactState = (): void => { root.dataset.compact = String(mediaQuery.matches); };
  setCompactState();
  mediaQuery.addEventListener('change', setCompactState);

  const measure = (index = activeIndex, immediate = false): void => {
    const item = items[index];
    if (!item || !drop) return;
    const navigationBox = root.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    if (!navigationBox.width || !itemBox.width) return;
    root.classList.toggle('liquid-nav-no-transition', immediate);
    root.style.setProperty('--liquid-drop-x', `${Math.round(itemBox.left - navigationBox.left)}px`);
    root.style.setProperty('--liquid-drop-width', `${Math.round(itemBox.width)}px`);
    if (measureFrame !== null) cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(() => {
      measureFrame = null;
      root.classList.remove('liquid-nav-no-transition');
    });
    resizeCanvas();
  };

  const draw = (now: number): void => {
    if (!context || !canvas) return;
    const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.width / deviceScale;
    const height = canvas.height / deviceScale;
    context.clearRect(0, 0, width, height);
    const live = ripples.filter((ripple) => now - ripple.start < 780);
    ripples.splice(0, ripples.length, ...live);
    live.forEach((ripple) => {
      const progress = (now - ripple.start) / 780;
      const radius = 10 + progress * 46 * ripple.strength;
      const alpha = (1 - progress) * .42;
      context.beginPath();
      context.ellipse(ripple.x + 14, ripple.y + 14, radius, Math.max(2, radius * .24), 0, 0, Math.PI * 2);
      context.strokeStyle = `rgba(166, 231, 255, ${alpha})`;
      context.lineWidth = 1.1;
      context.stroke();
    });
    if (live.length && visible && !reducedMotion) animationFrame = requestAnimationFrame(draw);
    else {
      animationFrame = null;
      drawing = false;
    }
  };

  const ripple = (event: MouseEvent | PointerEvent, strength = 1): void => {
    if (reducedMotion || !context) return;
    const box = root.getBoundingClientRect();
    ripples.push({ x: event.clientX - box.left, y: event.clientY - box.top, start: performance.now(), strength });
    if (!drawing && visible) {
      drawing = true;
      animationFrame = requestAnimationFrame(draw);
    }
  };

  const playIconFx = (item: HTMLAnchorElement): void => {
    const icon = item.querySelector<HTMLElement>('.liquid-nav-icon');
    if (!icon || reducedMotion) return;
    const fx = item.dataset.fx || 'pop';
    icon.classList.remove('is-playing');
    icon.dataset.playing = fx;
    void icon.offsetWidth;
    icon.classList.add('is-playing');
    icon.addEventListener('animationend', () => {
      icon.classList.remove('is-playing');
      delete icon.dataset.playing;
    }, { once: true, signal });
  };

  const activate = (index: number, options: ActivateOptions = {}): void => {
    if (index < 0 || index >= items.length) return;
    const item = items[index];
    if (!item) return;
    const wasActive = activeIndex;
    activeIndex = index;
    items.forEach((candidate, candidateIndex) => {
      if (candidateIndex === index) candidate.setAttribute('aria-current', 'page');
      else candidate.removeAttribute('aria-current');
    });
    const longJump = Math.abs(index - wasActive) > 1;
    root.classList.toggle('liquid-nav-long-jump', longJump);
    if (longJump) {
      if (longJumpTimer !== null) window.clearTimeout(longJumpTimer);
      longJumpTimer = window.setTimeout(() => {
        longJumpTimer = null;
        root.classList.remove('liquid-nav-long-jump');
      }, 620);
    }
    measure(index);
    if (options.event || options.focus) playIconFx(item);
    if (options.event) ripple(options.event, longJump ? 1.25 : .8);
    if (options.focus) item.focus();
  };

  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLAnchorElement>('.liquid-nav-item');
    if (!item) return;
    const index = items.indexOf(item);
    const href = item.getAttribute('href');
    if (index < 0 || !href) return;
    const section = document.querySelector<HTMLElement>(href);
    if (!section) return;
    event.preventDefault();
    activate(index, { event });
    window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - 40, behavior: reducedMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', href);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (activeIndex + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    activate(next, { focus: true });
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;
    const box = root.getBoundingClientRect();
    root.style.setProperty('--liquid-mouse-x', `${event.clientX - box.left}px`);
    root.style.setProperty('--liquid-mouse-y', `${event.clientY - box.top}px`);
    root.classList.add('liquid-nav-pointer');
  };
  const onPointerLeave = (): void => root.classList.remove('liquid-nav-pointer');
  const onPointerDown = (event: PointerEvent): void => ripple(event);
  root.addEventListener('click', onClick, { signal });
  root.addEventListener('keydown', onKeyDown, { signal });
  root.addEventListener('pointerdown', onPointerDown, { signal });
  root.addEventListener('pointermove', onPointerMove, { signal });
  root.addEventListener('pointerleave', onPointerLeave, { signal });

  const sections: NavigationSection[] = items.flatMap((item, index) => {
    const href = item.getAttribute('href');
    const element = href ? document.querySelector<HTMLElement>(href) : null;
    return element ? [{ element, index }] : [];
  });
  const sectionObserver = new IntersectionObserver((entries) => {
    const active = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
    if (!active) return;
    const section = sections.find(({ element }) => element === active.target);
    if (section) activate(section.index);
  }, { rootMargin: '-24% 0px -62% 0px', threshold: [.05, .2, .45] });
  sections.forEach(({ element }) => sectionObserver.observe(element));

  const resizeObserver = new ResizeObserver(() => measure());
  resizeObserver.observe(root);
  const visibilityObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    visible = entry.isIntersecting;
    if (visible && ripples.length && !drawing && !reducedMotion) {
      drawing = true;
      animationFrame = requestAnimationFrame(draw);
    }
  });
  visibilityObserver.observe(root);
  initialMeasureFrame = requestAnimationFrame(() => {
    initialMeasureFrame = null;
    measure(activeIndex, true);
  });

  return (): void => {
    listenerController.abort();
    mediaQuery.removeEventListener('change', setCompactState);
    sectionObserver.disconnect();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    if (measureFrame !== null) cancelAnimationFrame(measureFrame);
    if (initialMeasureFrame !== null) cancelAnimationFrame(initialMeasureFrame);
    if (longJumpTimer !== null) window.clearTimeout(longJumpTimer);
  };
}
