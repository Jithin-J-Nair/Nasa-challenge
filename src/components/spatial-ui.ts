import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lerp, reducedMotion } from '../lib/utils';

const INTERACTIVE_SELECTOR = 'a,button,input,select,textarea,summary,.acard,.tlcard,.sitem,.lcard,.srow,.hot';

interface KineticHeading {
  element: HTMLElement;
  characters: HTMLElement[];
}

function splitHeading(element: HTMLElement): KineticHeading | null {
  if (element.dataset.kineticReady === 'true') return null;
  const label = element.textContent?.replace(/\s+/g, ' ').trim();
  if (!label) return null;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    if (currentNode instanceof Text && currentNode.nodeValue?.length) nodes.push(currentNode);
    currentNode = walker.nextNode();
  }
  const characters: HTMLElement[] = [];
  nodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    Array.from(node.nodeValue || '').forEach((character) => {
      const span = document.createElement('span');
      span.className = character === ' ' ? 'spatial-char spatial-char-space' : 'spatial-char';
      span.textContent = character === ' ' ? '\u00a0' : character;
      span.setAttribute('aria-hidden', 'true');
      characters.push(span);
      fragment.appendChild(span);
    });
    node.parentNode?.replaceChild(fragment, node);
  });
  if (!characters.length) return null;
  element.setAttribute('aria-label', label);
  element.dataset.kineticReady = 'true';
  element.classList.add('kinetic-heading');
  return { element, characters };
}

/** Split visible heading text into accessible character spans for ScrollTrigger reveals. */
export function initKineticHeadings(): () => void {
  if (reducedMotion) return () => undefined;
  gsap.registerPlugin(ScrollTrigger);
  const headings = Array.from(document.querySelectorAll<HTMLElement>('.h2, .h3'))
    .map(splitHeading)
    .filter((heading): heading is KineticHeading => heading !== null);
  const tweens = headings.map(({ element, characters }) => gsap.fromTo(characters,
    { yPercent: 115, opacity: 0, rotateX: -58 },
    {
      yPercent: 0,
      opacity: 1,
      rotateX: 0,
      duration: .78,
      ease: 'power4.out',
      stagger: { each: .017, from: 'start' },
      scrollTrigger: {
        trigger: element,
        start: 'top 84%',
        once: true,
      },
    }));
  ScrollTrigger.refresh();
  return (): void => {
    tweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  };
}

/** Follow the pointer and gently pull the reticle toward interactive control centres. */
export function initMagneticReticle(): () => void {
  if (reducedMotion || !matchMedia('(pointer:fine)').matches) return () => undefined;
  const reticle = document.querySelector<HTMLElement>('#reticle');
  if (!reticle) return () => undefined;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let interactive: Element | null = null;
  let animationFrame: number | null = null;

  const resolveInteractive = (target: EventTarget | null): Element | null => (
    target instanceof Element ? target.closest(INTERACTIVE_SELECTOR) : null
  );
  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;
    targetX = event.clientX;
    targetY = event.clientY;
    interactive = resolveInteractive(event.target);
    reticle.classList.add('on');
    reticle.classList.toggle('hot', interactive !== null);
  };
  const onPointerOut = (event: PointerEvent): void => {
    if (event.relatedTarget !== null) return;
    interactive = null;
    reticle.classList.remove('on', 'hot');
  };
  const followPointer = (): void => {
    let magneticX = targetX;
    let magneticY = targetY;
    if (interactive?.isConnected) {
      const rect = interactive.getBoundingClientRect();
      const pullX = Math.max(-20, Math.min(20, (rect.left + rect.width * .5 - targetX) * .18));
      const pullY = Math.max(-20, Math.min(20, (rect.top + rect.height * .5 - targetY) * .18));
      magneticX += pullX;
      magneticY += pullY;
    }
    currentX = lerp(currentX, magneticX, .2);
    currentY = lerp(currentY, magneticY, .2);
    reticle.style.setProperty('--reticle-x', `${currentX.toFixed(2)}px`);
    reticle.style.setProperty('--reticle-y', `${currentY.toFixed(2)}px`);
    animationFrame = requestAnimationFrame(followPointer);
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerout', onPointerOut);
  animationFrame = requestAnimationFrame(followPointer);
  return (): void => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerout', onPointerOut);
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  };
}

/** Initialise the DOM HUD motion layer without altering semantic UI contracts. */
export function initSpatialUi(): () => void {
  const disposeKineticHeadings = initKineticHeadings();
  const disposeMagneticReticle = initMagneticReticle();
  return (): void => {
    disposeKineticHeadings();
    disposeMagneticReticle();
  };
}
