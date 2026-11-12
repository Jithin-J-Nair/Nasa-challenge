import { reducedMotion } from '../../lib/utils.js';

/**
 * Framework-native adaptation of the supplied Liquid Navbar.
 *
 * Silent Fleet is a framework-free Vite application, so this keeps the same
 * waterline interactions without adding an unused React/shadcn runtime. Items
 * remain real hash links for progressive enhancement and keyboard navigation.
 */
export function initLiquidGlassNavbar(root = document.querySelector('#liquidNav')) {
  if (!root) return () => {};

  const items = [...root.querySelectorAll('.liquid-nav-item')];
  const drop = root.querySelector('.liquid-nav-drop');
  const canvas = root.querySelector('.liquid-nav-water');
  const context = canvas?.getContext('2d');
  const mediaQuery = matchMedia('(max-width: 960px)');
  const ripples = [];
  let activeIndex = Math.max(0, items.findIndex((item) => item.getAttribute('aria-current') === 'page'));
  let drawing = false;
  let visible = true;

  const setCompactState = () => root.dataset.compact = String(mediaQuery.matches);
  setCompactState();
  mediaQuery.addEventListener('change', setCompactState);

  const measure = (index = activeIndex, immediate = false) => {
    const item = items[index];
    if (!item || !drop) return;
    const navBox = root.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    if (!navBox.width || !itemBox.width) return;
    root.classList.toggle('liquid-nav-no-transition', immediate);
    root.style.setProperty('--liquid-drop-x', `${Math.round(itemBox.left - navBox.left)}px`);
    root.style.setProperty('--liquid-drop-width', `${Math.round(itemBox.width)}px`);
    requestAnimationFrame(() => root.classList.remove('liquid-nav-no-transition'));
    resizeCanvas();
  };

  const resizeCanvas = () => {
    if (!canvas || !context) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.ceil(root.offsetWidth + 28);
    const height = Math.ceil(root.offsetHeight + 28);
    if (canvas.width === Math.ceil(width * dpr) && canvas.height === Math.ceil(height * dpr)) return;
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (now) => {
    if (!context || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    context.clearRect(0, 0, width, height);
    const live = ripples.filter((ripple) => now - ripple.start < 780);
    ripples.splice(0, ripples.length, ...live);

    live.forEach((ripple) => {
      const progress = (now - ripple.start) / 780;
      const radius = 10 + progress * 46;
      const alpha = (1 - progress) * 0.42;
      context.beginPath();
      context.ellipse(ripple.x + 14, ripple.y + 14, radius, Math.max(2, radius * 0.24), 0, 0, Math.PI * 2);
      context.strokeStyle = `rgba(166, 231, 255, ${alpha})`;
      context.lineWidth = 1.1;
      context.stroke();
    });

    if (live.length && visible && !reducedMotion) requestAnimationFrame(draw);
    else drawing = false;
  };

  const ripple = (event, strength = 1) => {
    if (reducedMotion || !context) return;
    const box = root.getBoundingClientRect();
    ripples.push({
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      start: performance.now(),
      strength,
    });
    if (!drawing && visible) {
      drawing = true;
      requestAnimationFrame(draw);
    }
  };

  const playIconFx = (item) => {
    const icon = item.querySelector('.liquid-nav-icon');
    if (!icon || reducedMotion) return;
    const fx = item.dataset.fx || 'pop';
    icon.classList.remove('is-playing');
    icon.dataset.playing = fx;
    // A reflow is intentional here: it restarts the selected icon scene.
    void icon.offsetWidth;
    icon.classList.add('is-playing');
    icon.addEventListener('animationend', () => {
      icon.classList.remove('is-playing');
      delete icon.dataset.playing;
    }, { once: true });
  };

  const activate = (index, { focus = false, event } = {}) => {
    if (index < 0 || index >= items.length) return;
    const wasActive = activeIndex;
    activeIndex = index;
    items.forEach((item, itemIndex) => {
      if (itemIndex === index) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    const longJump = Math.abs(index - wasActive) > 1;
    root.classList.toggle('liquid-nav-long-jump', longJump);
    if (longJump) setTimeout(() => root.classList.remove('liquid-nav-long-jump'), 620);
    measure(index);
    if (event || focus) playIconFx(items[index]);
    if (event) ripple(event, longJump ? 1.25 : 0.8);
    if (focus) items[index].focus();
  };

  const onClick = (event) => {
    const item = event.target.closest('.liquid-nav-item');
    if (!item) return;
    const index = items.indexOf(item);
    if (index < 0) return;
    const target = document.querySelector(item.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    activate(index, { event });
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 40,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    history.replaceState(null, '', item.getAttribute('href'));
  };

  const onKeyDown = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (activeIndex + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    activate(next, { focus: true });
  };

  const onPointerMove = (event) => {
    if (event.pointerType !== 'mouse') return;
    const box = root.getBoundingClientRect();
    root.style.setProperty('--liquid-mouse-x', `${event.clientX - box.left}px`);
    root.style.setProperty('--liquid-mouse-y', `${event.clientY - box.top}px`);
    root.classList.add('liquid-nav-pointer');
  };

  const onPointerLeave = () => root.classList.remove('liquid-nav-pointer');
  const onPointerDown = (event) => ripple(event);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerleave', onPointerLeave);

  const sections = items
    .map((item, index) => ({ element: document.querySelector(item.getAttribute('href')), index }))
    .filter(({ element }) => element);
  const sectionObserver = new IntersectionObserver((entries) => {
    const active = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (active) activate(sections.find(({ element }) => element === active.target)?.index ?? activeIndex);
  }, { rootMargin: '-24% 0px -62% 0px', threshold: [0.05, 0.2, 0.45] });
  sections.forEach(({ element }) => sectionObserver.observe(element));

  const resizeObserver = new ResizeObserver(() => measure());
  resizeObserver.observe(root);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && ripples.length && !drawing && !reducedMotion) {
      drawing = true;
      requestAnimationFrame(draw);
    }
  });
  visibilityObserver.observe(root);

  requestAnimationFrame(() => measure(activeIndex, true));

  return () => {
    mediaQuery.removeEventListener('change', setCompactState);
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerleave', onPointerLeave);
    sectionObserver.disconnect();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
  };
}
