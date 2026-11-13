import { createRoot, type Root } from 'react-dom/client';
import { StrictMode, useCallback, useState } from 'react';
import { WebglExperience } from './SceneCanvas';

let reactRoot: Root | null = null;

function supportsWebgl(): boolean {
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
}

function ExperienceHost(): JSX.Element {
  const [canvasKey, setCanvasKey] = useState(0);
  const onContextLost = useCallback((): void => { document.documentElement.dataset.webgl = 'recovering'; }, []);
  const onContextRestored = useCallback((): void => {
    document.documentElement.dataset.webgl = 'ready';
    setCanvasKey((key) => key + 1);
  }, []);
  return <WebglExperience key={canvasKey} onContextLost={onContextLost} onContextRestored={onContextRestored} />;
}

/** Mount the progressive, pointer-events-free WebGL layer behind the HTML archive. */
export function mountWebglExperience(): void {
  if (reactRoot) return;
  const host = document.querySelector<HTMLElement>('#webgl-shell');
  if (!host) return;
  if (!supportsWebgl()) {
    document.documentElement.dataset.webgl = 'unavailable';
    return;
  }
  document.documentElement.dataset.webgl = 'ready';
  reactRoot = createRoot(host);
  reactRoot.render(<StrictMode><ExperienceHost /></StrictMode>);
}

export function disposeWebglExperience(): void {
  reactRoot?.unmount();
  reactRoot = null;
}
