import { byId, idxOf, order, statusLabel } from "../data/artifacts";
import { SCHEM } from "../data/artwork";
import { $, $$ } from "../lib/dom";
import { onArtifactSelection, selectArtifact } from "../lib/events";
import { archiveState } from "../lib/state";
import { reducedMotion } from "../lib/utils";
import type { Artifact } from "../types/archive";
import { beep, blip } from "./audio";

export type DossierFlyHandler = (
  artifact: Artifact,
  shouldFly: boolean,
) => void;

const assetPath = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
let controller: AbortController | null = null;
let disposeSelection: (() => void) | null = null;
let flyHandler: DossierFlyHandler | null = null;
let typewriteTimer: number | null = null;
let pulseTimer: number | null = null;

function clearDossierTimers(): void {
  if (typewriteTimer !== null) window.clearTimeout(typewriteTimer);
  if (pulseTimer !== null) window.clearTimeout(pulseTimer);
  typewriteTimer = null;
  pulseTimer = null;
}

function typewrite(
  element: HTMLElement,
  text: string,
  status: Artifact["st"],
): void {
  if (typewriteTimer !== null) window.clearTimeout(typewriteTimer);
  typewriteTimer = null;
  if (reducedMotion) {
    element.innerHTML = `${text.replace(/\n/g, "<br>")}<span class="meta">End of record</span>`;
    return;
  }
  element.textContent = "";
  let index = 0;
  const color =
    status === "active"
      ? "var(--moss)"
      : status === "lost" || status === "destroyed"
        ? "var(--rust)"
        : "var(--amber)";
  element.style.color = color;
  const tick = (): void => {
    typewriteTimer = null;
    if (!controller || !element.isConnected) return;
    if (index >= text.length) {
      element.insertAdjacentHTML(
        "beforeend",
        '<span class="meta">End of record</span>',
      );
      return;
    }
    const character = text[index] || "";
    element.textContent += character;
    index += 1;
    if (index % 3 === 0) blip();
    typewriteTimer = window.setTimeout(
      tick,
      character === "\n" ? 90 : 14 + Math.random() * 16,
    );
  };
  tick();
}

function openDossier(artifact: Artifact, shouldFly: boolean): void {
  archiveState.selectedArtifactId = artifact.id;
  const dossier = $("#dossier");
  const index = idxOf(artifact.id);
  $("#dIdx").textContent =
    `${String(index + 1).padStart(2, "0")} / ${order.length}`;
  $("#dTitle").textContent = artifact.n;
  $<HTMLButtonElement>("#dPrev").disabled = index <= 0;
  $<HTMLButtonElement>("#dNext").disabled = index >= order.length - 1;
  const specificationRows = artifact.spec
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
  const discoveryRows = artifact.disc
    .map((item) => `<li>${item}</li>`)
    .join("");
  const coordinates = hasCoordinates(artifact)
    ? `${Math.abs(artifact.lat).toFixed(2)}° ${artifact.lat >= 0 ? "N" : "S"} · ${Math.abs(artifact.lon).toFixed(2)}° ${artifact.lon >= 0 ? "E" : "W"}`
    : artifact.orbit || "—";
  const imageFlag = artifact.imageSpecific
    ? '<span class="image-flag verified">NASA ARTEFACT-SPECIFIC IMAGE</span>'
    : artifact.imageMission
      ? '<span class="image-flag">NASA MISSION IMAGE · NOT A PHOTOGRAPH OF THIS ARTEFACT</span>'
      : '<span class="image-flag">PLACEHOLDER · NO ARTEFACT-SPECIFIC NASA IMAGE AUDITED</span>';
  const evidence = artifact.verifiedByNASA
    ? `<section class="dsec dossier-story"><h3>The story</h3><p>${artifact.story}</p></section>
       <section class="dsec nasa-facts"><h3>NASA-checked facts</h3>
         <p class="voice facts-summary">${artifact.voice}</p>
         <p class="fact-label">Technical record</p><dl class="dspecs">${specificationRows}</dl>
         <p class="fact-label">What this record documents</p><ol class="disc">${discoveryRows}</ol>
         <p class="fact-label">Record close</p><div class="lasttx" id="lastTx"></div>
         <p class="mono dossier-tags">${artifact.tags}</p>
       </section>`
    : `<section class="dsec unverified-record"><h3>Verification status</h3><p>We’re still checking this spacecraft’s story with NASA — explore the source link above while we do.</p></section>`;
  $("#dBody").innerHTML = `
    <figure class="dossier-media" data-webgl-plane="dossier-media">
      <img src="${artifact.image}" alt="${artifact.imageAlt}" width="${artifact.imageWidth}" height="${artifact.imageHeight}" loading="lazy" decoding="async" />
      <figcaption>${imageFlag}<span>${artifact.imageCredit}</span>${artifact.imageSource ? `<a href="${artifact.imageSource}" target="_blank" rel="noreferrer">Image source ↗</a>` : ""}</figcaption>
    </figure>
    <div class="dsec dossier-source"><h3>Sources</h3><a href="${artifact.source}" target="_blank" rel="noreferrer">Open ${artifact.sourceLabel} <span aria-hidden="true">↗</span></a><p>${artifact.verifiedByNASA ? "Every visible factual claim below was checked against this opened NASA source." : "NASA’s page is ready to explore; this dossier will grow after its full fact-check."}</p></div>
    <div class="dart"><div class="plate"></div>${SCHEM[artifact.sch] || SCHEM.probe}
      <div class="caption"><span>${artifact.b === "moon" ? "LUNAR ARTEFACT" : artifact.b === "mars" ? "MARTIAN ARTEFACT" : "DEEP SPACE VEHICLE"}</span><span>${artifact.ag}</span></div>
    </div>
    <div class="dsec"><h3>Designation</h3><dl class="dspecs">${
      artifact.verifiedByNASA
        ? `
      <div><dt>Object</dt><dd>${artifact.n}</dd></div><div><dt>Mission</dt><dd>${artifact.m}</dd></div>
      <div><dt>Agency</dt><dd>${artifact.ag}</dd></div><div><dt>Year</dt><dd>${artifact.y}</dd></div>
      <div><dt>Status</dt><dd><span class="st ${artifact.st}">${statusLabel(artifact.st)}</span></dd></div>
      <div><dt>${artifact.b === "deep" ? "Trajectory" : "Coordinates"}</dt><dd>${coordinates}</dd></div>
      ${artifact.site ? `<div><dt>Site</dt><dd>${artifact.site}</dd></div>` : ""}`
        : `
      <div><dt>Object</dt><dd>${artifact.n}</dd></div><div><dt>Audit</dt><dd>Claim review in progress</dd></div>`
    }
    </dl></div>
    ${evidence}`;
  const dossierImage = document.querySelector<HTMLImageElement>(
    "#dBody .dossier-media img",
  );
  dossierImage?.addEventListener(
    "error",
    () => {
      dossierImage.src = assetPath(
        "/assets/images/dossier-context-placeholder.svg",
      );
      dossierImage.alt =
        "NASA image placeholder — artefact-specific image pending source verification";
      const flag = document.querySelector<HTMLElement>("#dBody .image-flag");
      if (flag)
        flag.textContent =
          "NASA IMAGE PLACEHOLDER · SOURCE IMAGE FAILED TO LOAD";
    },
    { once: true, signal: controller?.signal },
  );
  dossier.removeAttribute("inert");
  dossier.classList.add("open");
  dossier.setAttribute("aria-hidden", "false");
  $("#scrim").classList.add("on");
  if (artifact.verifiedByNASA)
    typewrite($<HTMLElement>("#lastTx"), artifact.last, artifact.st);
  $$<HTMLButtonElement>(".hot").forEach((hotspot) =>
    hotspot.classList.remove("sel"),
  );
  const selectedHotspot = document.querySelector<HTMLButtonElement>(
    `.hot[data-id="${artifact.id}"]`,
  );
  if (selectedHotspot) {
    selectedHotspot.classList.add("sel", "pulse");
    if (pulseTimer !== null) window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => {
      pulseTimer = null;
      selectedHotspot.classList.remove("pulse");
    }, 5200);
  }
  $$<HTMLButtonElement>(".sitem").forEach((item) =>
    item.classList.toggle("sel", item.dataset.id === artifact.id),
  );
  $$<HTMLButtonElement>(".tlcard").forEach((card) =>
    card.classList.toggle("act", card.dataset.id === artifact.id),
  );
  $("#hudSel").innerHTML = `SELECTED · <b>${artifact.n.toUpperCase()}</b>`;
  flyHandler?.(artifact, shouldFly);
  document.querySelector<HTMLElement>("#dossier .dbody")?.scrollTo({ top: 0 });
  beep(720, 0.05, 0.05);
}

function hasCoordinates(
  artifact: Artifact,
): artifact is Artifact & { lat: number; lon: number } {
  return artifact.lat !== undefined && artifact.lon !== undefined;
}

function closeDossier(): void {
  $("#dossier").classList.remove("open");
  $("#dossier").setAttribute("aria-hidden", "true");
  $("#dossier").setAttribute("inert", "");
  $("#scrim").classList.remove("on");
  archiveState.selectedArtifactId = null;
  $$<HTMLButtonElement>(".hot").forEach((hotspot) =>
    hotspot.classList.remove("sel"),
  );
  $$<HTMLButtonElement>(".sitem").forEach((item) =>
    item.classList.remove("sel"),
  );
  $("#hudSel").innerHTML = "SELECTED · <b>NONE</b>";
}

function bindControls(signal: AbortSignal): void {
  $<HTMLButtonElement>("#dClose").addEventListener("click", closeDossier, {
    signal,
  });
  $("#scrim").addEventListener("click", closeDossier, { signal });
  $<HTMLButtonElement>("#dPrev").addEventListener(
    "click",
    () => {
      const index = idxOf(archiveState.selectedArtifactId);
      const previous = index > 0 ? order[index - 1] : undefined;
      if (previous) openDossier(previous, true);
    },
    { signal },
  );
  $<HTMLButtonElement>("#dNext").addEventListener(
    "click",
    () => {
      const index = idxOf(archiveState.selectedArtifactId);
      const next = index < order.length - 1 ? order[index + 1] : undefined;
      if (next) openDossier(next, true);
    },
    { signal },
  );
  window.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDossier();
      if ($("#dossier").classList.contains("open")) {
        if (event.key === "ArrowLeft") $<HTMLButtonElement>("#dPrev").click();
        if (event.key === "ArrowRight") $<HTMLButtonElement>("#dNext").click();
      }
      if (
        event.key === "/" &&
        document.activeElement !== document.querySelector("#search")
      ) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("#search")?.focus();
      }
    },
    { signal },
  );
  $("#hotspots").addEventListener(
    "click",
    (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const hotspot = target.closest<HTMLButtonElement>(".hot");
      if (!hotspot?.dataset.id) return;
      event.stopPropagation();
      selectArtifact(hotspot.dataset.id, true);
    },
    { signal },
  );
  $("#hotspots").addEventListener(
    "mouseover",
    (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".hot"))
        beep(880, 0.03, 0.02);
    },
    { signal },
  );
  $("#sideList").addEventListener(
    "click",
    (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const item = target.closest<HTMLButtonElement>(".sitem");
      if (item?.dataset.id) selectArtifact(item.dataset.id, true);
    },
    { signal },
  );
}

/** Initialise the semantic dossier independently of the optional renderer. */
export function initDossierController(
  onFly: DossierFlyHandler | null = null,
): () => void {
  flyHandler = onFly || flyHandler;
  if (controller) return disposeDossierController;
  controller = new AbortController();
  bindControls(controller.signal);
  disposeSelection = onArtifactSelection(({ id, flyToLocation }) => {
    const artifact = byId(id);
    if (artifact) openDossier(artifact, flyToLocation);
  });
  return disposeDossierController;
}

export function setDossierFlyHandler(handler: DossierFlyHandler | null): void {
  flyHandler = handler;
}

/** Dispose semantic dossier listeners and in-progress feedback animation. */
export function disposeDossierController(): void {
  controller?.abort();
  controller = null;
  disposeSelection?.();
  disposeSelection = null;
  clearDossierTimers();
  flyHandler = null;
  closeDossier();
}
