import { reducedMotion } from "../../lib/utils";

interface Ripple {
  x: number;
  y: number;
  start: number;
  strength: number;
}

interface DropLayout {
  x: number;
  width: number;
}

interface NavigationSection {
  element: HTMLElement;
  index: number;
}

interface ActivateOptions {
  focus?: boolean;
  event?: MouseEvent | PointerEvent;
}

const TRANSITION_DURATION = 720;
const CANVAS_BLEED = 14;

/**
 * Waterline navigation for the static archive shell.
 *
 * The semantic links stay in the document while a CSS liquid drop and a tiny
 * canvas ripple layer provide the visual motion. The controller owns every
 * observer, listener, timer, and animation frame so the archive can remount.
 */
export function initLiquidGlassNavbar(
  root = document.querySelector<HTMLElement>("#liquidNav"),
): () => void {
  if (!root) return () => undefined;

  const items = Array.from(
    root.querySelectorAll<HTMLAnchorElement>(".liquid-nav-item"),
  );
  const drop = root.querySelector<HTMLElement>(".liquid-nav-drop");
  const canvas = root.querySelector<HTMLCanvasElement>(".liquid-nav-water");
  const context = canvas?.getContext("2d") || null;
  const mediaQuery = matchMedia("(max-width: 960px)");
  const listenerController = new AbortController();
  const { signal } = listenerController;
  const ripples: Ripple[] = [];

  let activeIndex = Math.max(
    0,
    items.findIndex((item) => item.getAttribute("aria-current") === "page"),
  );
  let dropLayout: DropLayout | null = null;
  let drawing = false;
  let visible = true;
  let animationFrame: number | null = null;
  let resetTransitionFrame: number | null = null;
  let initialMeasureFrame: number | null = null;
  let longJumpTimer: number | null = null;
  let settleTimer: number | null = null;
  let sectionTrackingTimer: number | null = null;
  let sectionTrackingLocked = false;
  let measuredRootWidth = 0;
  let measuredRootHeight = 0;

  const resizeCanvas = (): void => {
    if (!canvas || !context) return;
    const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.ceil(root.offsetWidth + CANVAS_BLEED * 2);
    const height = Math.ceil(root.offsetHeight + CANVAS_BLEED * 2);
    if (
      canvas.width === Math.ceil(width * deviceScale) &&
      canvas.height === Math.ceil(height * deviceScale)
    )
      return;
    canvas.width = Math.ceil(width * deviceScale);
    canvas.height = Math.ceil(height * deviceScale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  };

  const setCompactState = (): void => {
    root.dataset.compact = String(mediaQuery.matches);
  };
  setCompactState();
  mediaQuery.addEventListener("change", setCompactState);

  const clearMotionState = (): void => {
    root.classList.remove("liquid-nav-moving");
    delete root.dataset.liquidTravel;
  };

  const setDropTarget = (layout: DropLayout): void => {
    root.style.setProperty("--liquid-drop-x", `${layout.x}px`);
    root.style.setProperty("--liquid-drop-width", `${layout.width}px`);
  };

  /** Establish the active link's target rectangle without layout jitter. */
  const measure = (
    index = activeIndex,
    immediate = false,
    animate = false,
  ): void => {
    const item = items[index];
    if (!item || !drop) return;
    const navigationBox = root.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    if (!navigationBox.width || !itemBox.width) return;

    measuredRootWidth = Math.round(navigationBox.width);
    measuredRootHeight = Math.round(navigationBox.height);
    resizeCanvas();
    const nextLayout: DropLayout = {
      x: Math.round(itemBox.left - navigationBox.left),
      width: Math.round(itemBox.width),
    };
    const previousLayout = dropLayout;
    dropLayout = nextLayout;
    const distance = previousLayout
      ? Math.abs(nextLayout.x - previousLayout.x)
      : 0;
    const shouldAnimate =
      animate &&
      !immediate &&
      !reducedMotion &&
      distance > 1 &&
      previousLayout !== null;

    if (settleTimer !== null) window.clearTimeout(settleTimer);

    if (!shouldAnimate) {
      clearMotionState();
      root.classList.toggle("liquid-nav-no-transition", immediate);
      setDropTarget(nextLayout);
      if (resetTransitionFrame !== null)
        cancelAnimationFrame(resetTransitionFrame);
      resetTransitionFrame = requestAnimationFrame(() => {
        resetTransitionFrame = null;
        root.classList.remove("liquid-nav-no-transition");
      });
      return;
    }

    root.dataset.liquidTravel =
      nextLayout.x > previousLayout.x ? "right" : "left";
    root.classList.add("liquid-nav-moving");
    // One shared layout transition is deliberately used for both neighbouring
    // and long jumps. It avoids the former two-stage scale/translate sequence
    // that made the short Home → Briefing hop appear to snap.
    setDropTarget(nextLayout);
    settleTimer = window.setTimeout(() => {
      settleTimer = null;
      clearMotionState();
    }, TRANSITION_DURATION);
  };

  const draw = (now: number): void => {
    if (!context || !canvas) return;
    const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.width / deviceScale;
    const height = canvas.height / deviceScale;
    context.clearRect(0, 0, width, height);
    const live = ripples.filter(
      (ripple) => now - ripple.start < TRANSITION_DURATION,
    );
    ripples.splice(0, ripples.length, ...live);
    live.forEach((ripple) => {
      const progress = (now - ripple.start) / TRANSITION_DURATION;
      const radius = 10 + progress * 46 * ripple.strength;
      const alpha = (1 - progress) * 0.42;
      context.beginPath();
      context.ellipse(
        ripple.x + CANVAS_BLEED,
        ripple.y + CANVAS_BLEED,
        radius,
        Math.max(2, radius * 0.24),
        0,
        0,
        Math.PI * 2,
      );
      context.strokeStyle = `rgba(166, 231, 255, ${alpha})`;
      context.lineWidth = 1.1;
      context.stroke();
    });
    if (live.length && visible && !reducedMotion)
      animationFrame = requestAnimationFrame(draw);
    else {
      animationFrame = null;
      drawing = false;
    }
  };

  const ripple = (event: MouseEvent | PointerEvent, strength = 1): void => {
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
      animationFrame = requestAnimationFrame(draw);
    }
  };

  const playIconFx = (item: HTMLAnchorElement): void => {
    const icon = item.querySelector<HTMLElement>(".liquid-nav-icon");
    if (!icon || reducedMotion) return;
    const fx = item.dataset.fx || "pop";
    icon.classList.remove("is-playing");
    icon.dataset.playing = fx;
    void icon.offsetWidth;
    icon.classList.add("is-playing");
    icon.addEventListener(
      "animationend",
      () => {
        icon.classList.remove("is-playing");
        delete icon.dataset.playing;
      },
      { once: true, signal },
    );
  };

  const activate = (index: number, options: ActivateOptions = {}): void => {
    if (index < 0 || index >= items.length) return;
    const item = items[index];
    if (!item) return;
    const wasActive = activeIndex;
    const changed = index !== wasActive;

    // The section observer reports the clicked section as soon as smooth scroll
    // begins. Do not let that duplicate notification cancel the waterline while
    // it is still travelling toward the newly selected item.
    if (!changed && dropLayout !== null && !options.event && !options.focus)
      return;

    activeIndex = index;
    items.forEach((candidate, candidateIndex) => {
      if (candidateIndex === index)
        candidate.setAttribute("aria-current", "page");
      else candidate.removeAttribute("aria-current");
    });

    const longJump = changed && Math.abs(index - wasActive) > 1;
    if (changed) root.classList.toggle("liquid-nav-long-jump", longJump);
    if (longJump) {
      if (longJumpTimer !== null) window.clearTimeout(longJumpTimer);
      longJumpTimer = window.setTimeout(() => {
        longJumpTimer = null;
        root.classList.remove("liquid-nav-long-jump");
      }, TRANSITION_DURATION);
    }

    if (changed) measure(index, false, true);
    else if (dropLayout === null) measure(index, true);
    if (options.event || options.focus) playIconFx(item);
    if (options.event) ripple(options.event, longJump ? 1.25 : 0.8);
    if (options.focus) item.focus();
  };

  const suspendSectionTracking = (): void => {
    sectionTrackingLocked = true;
    if (sectionTrackingTimer !== null)
      window.clearTimeout(sectionTrackingTimer);
    sectionTrackingTimer = window.setTimeout(
      () => {
        sectionTrackingTimer = null;
        sectionTrackingLocked = false;
      },
      reducedMotion ? 0 : TRANSITION_DURATION + 180,
    );
  };

  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLAnchorElement>(".liquid-nav-item");
    if (!item) return;
    const index = items.indexOf(item);
    const href = item.getAttribute("href");
    if (index < 0 || !href) return;
    const section = document.querySelector<HTMLElement>(href);
    if (!section) return;
    event.preventDefault();
    suspendSectionTracking();
    activate(index, { event });
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - 40,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    history.replaceState(null, "", href);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next =
      (activeIndex + (event.key === "ArrowRight" ? 1 : -1) + items.length) %
      items.length;
    activate(next, { focus: true });
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse") return;
    const box = root.getBoundingClientRect();
    root.style.setProperty("--liquid-mouse-x", `${event.clientX - box.left}px`);
    root.style.setProperty("--liquid-mouse-y", `${event.clientY - box.top}px`);
    root.classList.add("liquid-nav-pointer");
  };
  const onPointerLeave = (): void =>
    root.classList.remove("liquid-nav-pointer");
  const onPointerDown = (event: PointerEvent): void => ripple(event);
  root.addEventListener("click", onClick, { signal });
  root.addEventListener("keydown", onKeyDown, { signal });
  root.addEventListener("pointerdown", onPointerDown, { signal });
  root.addEventListener("pointermove", onPointerMove, { signal });
  root.addEventListener("pointerleave", onPointerLeave, { signal });

  const sections: NavigationSection[] = items.flatMap((item, index) => {
    const href = item.getAttribute("href");
    const element = href ? document.querySelector<HTMLElement>(href) : null;
    return element ? [{ element, index }] : [];
  });
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      if (sectionTrackingLocked) return;
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (left, right) => right.intersectionRatio - left.intersectionRatio,
        )[0];
      if (!active) return;
      const section = sections.find(({ element }) => element === active.target);
      if (section) activate(section.index);
    },
    { rootMargin: "-24% 0px -62% 0px", threshold: [0.05, 0.2, 0.45] },
  );
  sections.forEach(({ element }) => sectionObserver.observe(element));

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const width = Math.round(entry.contentRect.width);
    const height = Math.round(entry.contentRect.height);
    if (width === measuredRootWidth && height === measuredRootHeight) return;
    // A selection owns its own geometry until it settles; a concurrent layout
    // notification must not snap the active drop out of that transition.
    if (root.classList.contains("liquid-nav-moving")) return;
    // Layout changes must not replay a selection transition.
    measure(activeIndex, true);
  });
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
    mediaQuery.removeEventListener("change", setCompactState);
    sectionObserver.disconnect();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    if (resetTransitionFrame !== null)
      cancelAnimationFrame(resetTransitionFrame);
    if (initialMeasureFrame !== null) cancelAnimationFrame(initialMeasureFrame);
    if (longJumpTimer !== null) window.clearTimeout(longJumpTimer);
    if (settleTimer !== null) window.clearTimeout(settleTimer);
    if (sectionTrackingTimer !== null)
      window.clearTimeout(sectionTrackingTimer);
    ripples.splice(0);
  };
}
