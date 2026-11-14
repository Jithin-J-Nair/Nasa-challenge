import { Canvas, useThree } from "@react-three/fiber";
import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { SceneManager } from "./SceneManager";

export interface WebglExperienceProps {
  onContextLost: () => void;
  onContextRestored: () => void;
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  onFallback: () => void;
}

interface CanvasErrorBoundaryState {
  failed: boolean;
}

/** A failed optional canvas must leave the semantic archive readable. */
class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onFallback();
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

/** Explicitly release renderer-owned render lists and GPU state when React unmounts the canvas. */
function RendererDisposal(): null {
  const gl = useThree((state) => state.gl);
  useEffect(
    () => () => {
      gl.renderLists.dispose();
      gl.dispose();
    },
    [gl],
  );
  return null;
}

/** Stop the continuous shader loop while backgrounded or visually suppressed. */
function PageVisibilityGate(): null {
  const setFrameloop = useThree((state) => state.setFrameloop);
  useEffect(() => {
    const compactViewport = window.matchMedia("(max-width: 760px), (pointer: coarse)");
    let heroInRange = true;
    const sync = (): void => setFrameloop(
      document.hidden || compactViewport.matches || !heroInRange ? "never" : "always",
    );
    const hero = document.querySelector<HTMLElement>('#hero');
    const observer = hero && 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
        heroInRange = entries.some((entry) => entry.isIntersecting);
        sync();
      }, { rootMargin: '280px 0px' })
      : null;
    if (hero && observer) observer.observe(hero);
    sync();
    document.addEventListener("visibilitychange", sync);
    compactViewport.addEventListener("change", sync);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      compactViewport.removeEventListener("change", sync);
      setFrameloop("always");
    };
  }, [setFrameloop]);
  return null;
}

function ContextRecovery({
  onContextLost,
  onContextRestored,
}: WebglExperienceProps): null {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event): void => {
      event.preventDefault();
      onContextLost();
    };
    const restored = (): void => onContextRestored();
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, onContextLost, onContextRestored]);
  return null;
}

export function WebglExperience({
  onContextLost,
  onContextRestored,
}: WebglExperienceProps): JSX.Element {
  return (
    <CanvasErrorBoundary onFallback={() => { document.documentElement.dataset.webgl = 'unavailable'; }}>
      <Canvas
        dpr={[1, 1.8]}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 48, near: 0.1, far: 100 }}
      >
        <PageVisibilityGate />
        <ContextRecovery
          onContextLost={onContextLost}
          onContextRestored={onContextRestored}
        />
        <RendererDisposal />
        <SceneManager />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
