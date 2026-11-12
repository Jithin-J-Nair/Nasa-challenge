import { clamp, mulberry32, reducedMotion } from '../lib/utils';

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
  ph: number;
  hue: string;
  z: number;
}

/** Render a lightweight star field and return a disposer for detached canvases. */
export function starCanvas(canvas: HTMLCanvasElement, density: number, drift: number): () => void {
  const context = canvas.getContext('2d');
  if (!context) return () => undefined;
  let width = 1;
  let height = 1;
  let stars: Star[] = [];
  let frameId: number | null = null;
  let initialSizeFrame: number | null = null;
  let staticFrame: number | null = null;
  let disposed = false;
  const random = mulberry32(9182);
  let pointerX = 0;
  let pointerY = 0;

  const size = (): void => {
    if (disposed) return;
    const deviceScale = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth || innerWidth;
    height = canvas.clientHeight || innerHeight;
    canvas.width = width * deviceScale;
    canvas.height = height * deviceScale;
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
    stars = [];
    const count = Math.round(width * height * density);
    for (let index = 0; index < count; index += 1) {
      stars.push({
        x: random() * width,
        y: random() * height,
        r: random() * 1.25 + .18,
        a: .15 + random() * .85,
        tw: .4 + random() * 2.4,
        ph: random() * 6.28,
        hue: random() < .12 ? (random() < .5 ? '#9fd8ff' : '#ffd6a8') : '#ffffff',
        z: .25 + random(),
      });
    }
  };
  const onPointerMove = (event: PointerEvent): void => {
    pointerX = event.clientX / innerWidth - .5;
    pointerY = event.clientY / innerHeight - .5;
  };
  initialSizeFrame = requestAnimationFrame(size);
  addEventListener('resize', size);
  addEventListener('pointermove', onPointerMove, { passive: true });
  let time = 0;
  const frame = (): void => {
    if (disposed) return;
    time += .016;
    context.clearRect(0, 0, width, height);
    stars.forEach((star) => {
      const twinkle = .55 + .45 * Math.sin(time * star.tw + star.ph);
      const positionX = star.x - pointerX * 18 * star.z;
      const positionY = star.y - pointerY * 14 * star.z - (drift ? time * drift * star.z : 0);
      const wrappedY = ((positionY % height) + height) % height;
      context.globalAlpha = star.a * twinkle;
      context.fillStyle = star.hue;
      context.beginPath();
      context.arc(positionX, wrappedY, star.r, 0, Math.PI * 2);
      context.fill();
      if (star.r > 1.05) {
        context.globalAlpha = star.a * twinkle * .22;
        context.beginPath();
        context.arc(positionX, wrappedY, star.r * 3.4, 0, Math.PI * 2);
        context.fill();
      }
    });
    context.globalAlpha = 1;
    frameId = requestAnimationFrame(frame);
  };
  if (!reducedMotion) frame();
  else {
    staticFrame = requestAnimationFrame(() => {
      if (disposed) return;
      context.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        context.globalAlpha = star.a * .7;
        context.fillStyle = star.hue;
        context.beginPath();
        context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
    });
  }

  return (): void => {
    disposed = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    if (initialSizeFrame !== null) cancelAnimationFrame(initialSizeFrame);
    if (staticFrame !== null) cancelAnimationFrame(staticFrame);
    removeEventListener('resize', size);
    removeEventListener('pointermove', onPointerMove);
    stars = [];
  };
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—+*/<>[]#%$@';

/** Animate a terminal-style text reveal and return a cancellation handle. */
export function scramble(element: HTMLElement, duration = 1100): () => void {
  const final = element.dataset.final || element.textContent || '';
  element.dataset.final = final;
  if (reducedMotion) {
    element.textContent = final;
    return () => undefined;
  }
  const start = performance.now();
  const length = final.length;
  let frameId: number | null = null;
  let cancelled = false;
  const tick = (now: number): void => {
    if (cancelled) return;
    const progress = clamp((now - start) / duration, 0, 1);
    const reveal = Math.floor(progress * length * 1.25);
    let output = '';
    for (let index = 0; index < length; index += 1) {
      const character = final[index] || '';
      if (character === ' ') output += ' ';
      else if (index < reveal) output += character;
      else output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)] || '';
    }
    element.textContent = output;
    if (progress < 1) frameId = requestAnimationFrame(tick);
    else element.textContent = final;
  };
  frameId = requestAnimationFrame(tick);
  return (): void => {
    cancelled = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    element.textContent = final;
  };
}
