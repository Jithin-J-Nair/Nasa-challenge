import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles.css";

import { A } from "./data/artifacts";
import { initArchive } from "./components/archive";
import { initAudioControls } from "./components/audio";
import { initDossierController } from "./components/dossier";
import { startBoot } from "./components/boot";
import { initInterface } from "./components/interface";
import { initMoonCatalogue } from "./components/moon-catalogue";
import { initTimeline } from "./components/timeline";
import { $, $$ } from "./lib/dom";
import { reducedMotion } from "./lib/utils";

gsap.registerPlugin(ScrollTrigger);

type Disposer = () => void;

interface IdleWindow {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
}

let disposeActiveArchive: Disposer | null = null;

/** Release every application owner so a host can safely replace or remount the archive. */
export function disposeArchiveApplication(): void {
  disposeActiveArchive?.();
  disposeActiveArchive = null;
}

/** Application composition root. Semantic archive content starts before optional WebGL layers. */
export function bootArchive(): void {
  disposeArchiveApplication();
  let disposed = false;
  const idleWindow: IdleWindow = window;
  let ambientTimeout: number | null = null;
  let ambientIdle: number | null = null;
  let observatoryObserver: IntersectionObserver | null = null;
  let disposeAmbient: Disposer = () => undefined;
  let disposeObservatory: Disposer = () => undefined;
  let disposeDossier: Disposer = () => undefined;
  let disposeInterface: Disposer = () => undefined;
  let disposeAudio: Disposer = () => undefined;
  let disposeTimeline: Disposer = () => undefined;
  let disposeArchive: Disposer = () => undefined;
  let disposeMoonCatalogue: Disposer = () => undefined;

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    if (ambientTimeout !== null) window.clearTimeout(ambientTimeout);
    if (ambientIdle !== null) idleWindow.cancelIdleCallback?.(ambientIdle);
    observatoryObserver?.disconnect();
    observatoryObserver = null;
    disposeAmbient();
    disposeObservatory();
    disposeDossier();
    disposeInterface();
    disposeMoonCatalogue();
    disposeArchive();
    disposeTimeline();
    disposeAudio();
  };
  disposeActiveArchive = dispose;

  $$<HTMLElement>("[data-total]").forEach((element) => {
    element.textContent = String(A.length);
  });
  const heroCount = $<HTMLElement>("#heroCount");
  heroCount.dataset.to = String(A.length);

  disposeAudio = initAudioControls();
  disposeDossier = initDossierController();
  disposeTimeline = initTimeline();
  disposeArchive = initArchive();
  disposeMoonCatalogue = initMoonCatalogue();
  if (!reducedMotion) {
    const loadAmbientCanvas = (): void => {
      void import("./experience/mount")
        .then(({ disposeWebglExperience, mountWebglExperience }) => {
          if (disposed) {
            disposeWebglExperience();
            return;
          }
          mountWebglExperience();
          disposeAmbient = disposeWebglExperience;
        })
        .catch((error: unknown) => {
          if (!disposed) console.warn("Ambient WebGL unavailable:", error);
        });
    };
    if (typeof idleWindow.requestIdleCallback === "function")
      ambientIdle = idleWindow.requestIdleCallback(loadAmbientCanvas, {
        timeout: 900,
      });
    else ambientTimeout = window.setTimeout(loadAmbientCanvas, 240);
  } else {
    document.documentElement.dataset.webgl = "reduced-motion";
  }

  const observatory = document.querySelector<HTMLElement>("#observatory");
  let observatoryLoaded = false;
  const loadObservatory = async (): Promise<void> => {
    if (disposed || observatoryLoaded) return;
    observatoryLoaded = true;
    try {
      const module = await import("./components/observatory");
      if (disposed) return;
      disposeObservatory = module.initObservatory();
      module.startObservatoryRenderLoop();
    } catch (error: unknown) {
      if (disposed) return;
      console.warn("WebGL unavailable:", error);
      const loadingMessage = document.querySelector<HTMLElement>("#vpLoad");
      if (loadingMessage)
        loadingMessage.textContent =
          "WebGL unavailable — 3D model disabled; Field Guide dossiers remain available";
    }
  };
  const webglProbe = document.createElement("canvas");
  const nativeWebglAvailable = Boolean(
    webglProbe.getContext("webgl2") || webglProbe.getContext("webgl"),
  );
  if (!nativeWebglAvailable) {
    document.documentElement.dataset.webgl = "unavailable";
    void loadObservatory();
  } else if ("IntersectionObserver" in window && observatory) {
    observatoryObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observatoryObserver?.disconnect();
        observatoryObserver = null;
        void loadObservatory();
      },
      { rootMargin: "360px 0px" },
    );
    observatoryObserver.observe(observatory);
  } else {
    void loadObservatory();
  }

  $<HTMLElement>("#fDate").textContent = new Date().toUTCString();
  startBoot(() => {
    disposeInterface = initInterface();
  });
}

if (document.readyState === "loading")
  window.addEventListener("DOMContentLoaded", bootArchive, { once: true });
else bootArchive();
