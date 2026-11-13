import { gsap } from 'gsap';
import { reducedMotion } from '../lib/utils';

type Dispose = () => void;

/**
 * Native TypeScript adaptation of React Bits' StaggeredMenu. It retains the
 * layered GSAP entrance and accessible disclosure behavior without introducing
 * React into the archive's non-React application shell.
 */
export function initStaggeredMenu(): Dispose {
  const root = document.querySelector<HTMLElement>('#staggeredMenu');
  const toggle = document.querySelector<HTMLButtonElement>('#smToggle');
  const panel = document.querySelector<HTMLElement>('#staggeredMenuPanel');
  const backdrop = document.querySelector<HTMLButtonElement>('#smBackdrop');
  if (!root || !toggle || !panel || !backdrop) return () => undefined;

  const layers = Array.from(root.querySelectorAll<HTMLElement>('.sm-prelayer'));
  const itemLabels = Array.from(root.querySelectorAll<HTMLElement>('.sm-panel-itemLabel'));
  const itemRows = Array.from(root.querySelectorAll<HTMLElement>('.sm-panel-item'));
  const footer = Array.from(root.querySelectorAll<HTMLElement>('.sm-panel-footer > *'));
  const text = toggle.querySelector<HTMLElement>('.sm-toggle-textInner');
  const icon = toggle.querySelector<HTMLElement>('.sm-icon');
  const controller = new AbortController();
  const { signal } = controller;
  let open = false;
  let timeline: gsap.core.Timeline | null = null;
  let closeTween: gsap.core.Timeline | null = null;
  let focusTimer: number | null = null;

  gsap.set([...layers, panel], { xPercent: 104, autoAlpha: 1 });
  gsap.set(itemLabels, { yPercent: 130, rotate: 8 });
  gsap.set(itemRows, { '--sm-number-opacity': 0 });
  gsap.set(footer, { autoAlpha: 0, y: 18 });
  gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });

  const updateState = (nextOpen: boolean): void => {
    open = nextOpen;
    root.toggleAttribute('data-open', nextOpen);
    document.body.classList.toggle('staggered-menu-open', nextOpen);
    toggle.setAttribute('aria-expanded', String(nextOpen));
    toggle.setAttribute('aria-label', nextOpen ? 'Close archive navigation' : 'Open archive navigation');
    panel.setAttribute('aria-hidden', String(!nextOpen));
    panel.inert = !nextOpen;
  };

  const focusFirstMenuItem = (): void => {
    if (!open) return;
    root.querySelector<HTMLAnchorElement>('.sm-panel-item')?.focus();
  };

  const openMenu = (): void => {
    if (open) return;
    closeTween?.kill();
    timeline?.kill();
    if (focusTimer !== null) window.clearTimeout(focusTimer);
    updateState(true);
    gsap.set([...layers, panel], { xPercent: 104, autoAlpha: 1 });
    gsap.set(itemLabels, { yPercent: 130, rotate: 8 });
    gsap.set(itemRows, { '--sm-number-opacity': 0 });
    gsap.set(footer, { autoAlpha: 0, y: 18 });

    if (reducedMotion) {
      gsap.set([...layers, panel], { xPercent: 0 });
      gsap.set(itemLabels, { yPercent: 0, rotate: 0 });
      gsap.set(itemRows, { '--sm-number-opacity': 1 });
      gsap.set(footer, { autoAlpha: 1, y: 0 });
      gsap.set(icon, { rotate: 225 });
      gsap.set(text, { yPercent: -50 });
      focusFirstMenuItem();
      return;
    }

    timeline = gsap.timeline();
    layers.forEach((layer, index) => {
      timeline?.to(layer, { xPercent: 0, duration: .32, ease: 'power4.out' }, index * .045);
    });
    const panelAt = Math.max(0, (layers.length - 1) * .045 + .05);
    timeline
      .to(panel, { xPercent: 0, duration: .42, ease: 'power4.out' }, panelAt)
      .to(icon, { rotate: 225, duration: .45, ease: 'power4.out' }, 0)
      .to(text, { yPercent: -50, duration: .3, ease: 'power3.out' }, .08)
      .to(itemLabels, { yPercent: 0, rotate: 0, duration: .55, stagger: .055, ease: 'power4.out' }, panelAt + .08)
      .to(itemRows, { '--sm-number-opacity': 1, duration: .3, stagger: .045, ease: 'power2.out' }, panelAt + .14)
      .to(footer, { autoAlpha: 1, y: 0, duration: .34, stagger: .04, ease: 'power3.out' }, panelAt + .22);
    focusTimer = window.setTimeout(focusFirstMenuItem, 950);
  };

  const closeMenu = (restoreFocus = false): void => {
    if (!open) return;
    // Close semantic state immediately. The panel can continue its exit motion,
    // but it must never remain modal or capture the next interaction while the
    // animation completes.
    updateState(false);
    // The just-closed panel is inert straight away, so return focus at the
    // same semantic moment rather than leaving it inside the exiting layer.
    if (restoreFocus) toggle.focus();
    if (focusTimer !== null) {
      window.clearTimeout(focusTimer);
      focusTimer = null;
    }
    timeline?.kill();
    const finish = (): void => {
      gsap.set(itemLabels, { yPercent: 130, rotate: 8 });
      gsap.set(itemRows, { '--sm-number-opacity': 0 });
      gsap.set(footer, { autoAlpha: 0, y: 18 });
    };
    if (reducedMotion) {
      gsap.set([...layers, panel], { xPercent: 104 });
      gsap.set(icon, { rotate: 0 });
      gsap.set(text, { yPercent: 0 });
      finish();
      return;
    }
    closeTween?.kill();
    closeTween = gsap.timeline({ onComplete: finish })
      .to(icon, { rotate: 0, duration: .28, ease: 'power3.inOut' }, 0)
      .to(text, { yPercent: 0, duration: .25, ease: 'power3.inOut' }, 0)
      .to([panel, ...layers], { xPercent: 104, duration: .34, ease: 'power3.in', stagger: .025 }, 0);
  };

  const scrollToHash = (hash: string): void => {
    const target = document.querySelector<HTMLElement>(hash);
    if (!target) return;
    window.scrollTo({
      top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - 30),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    history.replaceState(null, '', hash);
  };

  // Use pointerdown rather than click: the menu panel animates across the
  // header and a deferred click can be delivered after that transition in some
  // browsers. Keyboard activation remains explicit and equivalent.
  const toggleMenu = (): void => (open ? closeMenu(true) : openMenu());
  toggle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    toggleMenu();
  }, { signal });
  toggle.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleMenu();
  }, { signal });
  backdrop.addEventListener('pointerdown', () => closeMenu(true), { signal });
  root.querySelectorAll<HTMLAnchorElement>('[data-menu-scroll]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash?.startsWith('#')) return;
      event.preventDefault();
      closeMenu();
      scrollToHash(hash);
    }, { signal });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    closeMenu(true);
  }, { signal });

  updateState(false);
  return (): void => {
    controller.abort();
    timeline?.kill();
    closeTween?.kill();
    if (focusTimer !== null) window.clearTimeout(focusTimer);
    document.body.classList.remove('staggered-menu-open');
    panel.inert = false;
  };
}
