const CONTROL_SELECTOR = 'button,a.btn,#storyRoute a';
const METAL_CLASS = 'metal-control';
const CARD_CLASS = 'metal-control--card';
const ROUTE_CLASS = 'metal-control--route';

function shouldSkip(element: HTMLElement): boolean {
  // Hotspots are spatial markers, not conventional controls with a visible
  // surface to replace. Every other interactive control receives metal chrome.
  return element.matches('.hot,[data-metal-ignore]')
    || element.closest('[aria-hidden="true"]') !== null;
}

/**
 * Applies the native MetalButton surface class to every compact action. This is
 * intentionally DOM-native: the metal ring belongs to the control itself,
 * never to a fixed canvas drawn over its old component styling.
 */
export function initMetalControls(): () => void {
  const roots = new Set<HTMLElement>();
  let frame: number | null = null;

  const sync = (): void => {
    document.querySelectorAll<HTMLElement>(CONTROL_SELECTOR).forEach((element) => {
      if (shouldSkip(element)) return;
      roots.add(element);
      element.classList.add(METAL_CLASS);
      element.classList.toggle(CARD_CLASS, element.matches('.acard,.tlcard,.sitem,.srow'));
      element.classList.toggle(ROUTE_CLASS, element.matches('#storyRoute a'));
    });
    roots.forEach((element) => {
      if (element.isConnected) return;
      roots.delete(element);
      element.classList.remove(METAL_CLASS, CARD_CLASS, ROUTE_CLASS);
    });
  };

  const scheduleSync = (): void => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      sync();
    });
  };

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'disabled', 'aria-current', 'aria-pressed', 'aria-hidden'],
  });

  sync();
  document.documentElement.dataset.metalFx = 'native-surface';

  return (): void => {
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
    roots.forEach((element) => element.classList.remove(METAL_CLASS, CARD_CLASS, ROUTE_CLASS));
    delete document.documentElement.dataset.metalFx;
  };
}
