import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { SceneManager } from "./SceneManager";

export interface WebglExperienceProps {
  onContextLost: () => void;
  onContextRestored: () => void;
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
    const sync = (): void => setFrameloop(
      document.hidden || compactViewport.matches ? "never" : "always",
    );
    sync();
    document.addEventListener("visibilitychange", sync);
    compactViewport.addEventListener("change", sync);
    return () => {
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
    <Canvas
      dpr={[1, 2]}
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
  );
}
