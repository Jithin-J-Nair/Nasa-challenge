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
let lastFocusedElement: HTMLElement | null = null;

function focusableDossierElements(): HTMLElement[] {
  const dossier = $("#dossier");
  return Array.from(
    dossier.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getClientRects().length > 0);
}

function moveFocusIntoDossier(): void {
  const focusClose = (): void => {
    if (!$("#dossier").classList.contains("open")) return;
    $<HTMLButtonElement>("#dClose").focus({ preventScroll: true });
  };
  // The control exists before the panel's transform transition begins. Focus it
  // immediately for keyboard users, then repeat on the next paint for browsers
  // that defer focus while recalculating a fixed-position layer.
  focusClose();
  window.requestAnimationFrame(focusClose);
}

function clearDossierTimers(): void {
  if (typewriteTimer !== null) window.clearTimeout(typewriteTimer);
  if (pulseTimer !== null) window.clearTimeout(pulseTimer);
  typewriteTimer = null;
  pulseTimer = null;
}

function collectionLabel(artifact: Artifact): string {
  if (artifact.b === 'moon') return 'Lunar register';
  if (artifact.b === 'mars') return 'Mars field notes';
  return 'Deep-space dispatch';
}

function typewrite(
  element: HTMLElement,
  text: string,
  status: Artifact["st"],
): void {
  if (typewriteTimer !== null) window.clearTimeout(typewriteTimer);
  typewriteTimer = null;
  if (reducedMotion) {
    const lines = text.split("\n");
    element.replaceChildren();
    lines.forEach((line, index) => {
      element.append(document.createTextNode(line));
      if (index < lines.length - 1) element.append(document.createElement("br"));
    });
    const endOfRecord = document.createElement("span");
    endOfRecord.className = "meta";
    endOfRecord.textContent = "End of record";
    element.append(endOfRecord);
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
  const wasOpen = dossier.classList.contains("open");
  const activeElement = document.activeElement;
  if (
    !wasOpen &&
    activeElement instanceof HTMLElement &&
    !dossier.contains(activeElement)
  )
    lastFocusedElement = activeElement;
  const index = idxOf(artifact.id);
  $("#dIdx").textContent =
    `${String(index + 1).padStart(2, "0")} / ${order.length}`;
  $("#dTitle").textContent = artifact.n;
  $<HTMLButtonElement>("#dPrev").disabled = index <= 0;
  $<HTMLButtonElement>("#dNext").disabled = index >= order.length - 1;
  const specificationRows = artifact.spec
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
  const coordinates = hasCoordinates(artifact)
    ? `${Math.abs(artifact.lat).toFixed(2)}° ${artifact.lat >= 0 ? "N" : "S"} · ${Math.abs(artifact.lon).toFixed(2)}° ${artifact.lon >= 0 ? "E" : "W"}`
    : artifact.orbit || "—";
  const imageFlag = artifact.imageSpecific
    ? '<span class="image-flag verified">NASA ARTEFACT-SPECIFIC IMAGE</span>'
    : artifact.imageMission
      ? '<span class="image-flag">NASA MISSION IMAGE · NOT A PHOTOGRAPH OF THIS ARTEFACT</span>'
      : '<span class="image-flag">PLACEHOLDER · NO ARTEFACT-SPECIFIC NASA IMAGE AUDITED</span>';
  const opening = artifact.verifiedByNASA
    ? `<section class="dsec dossier-story dossier-opening"><h3>Story moment · interpretation</h3><p>${artifact.story}</p></section>
       <section class="dsec dossier-record"><h3>NASA-checked record</h3><p>${artifact.one}</p></section>`
    : '';
  const science = artifact.verifiedByNASA
    ? `<section class="dsec nasa-facts dossier-science"><h3>NASA-checked science</h3>
         <p class="fact-label">Technical record</p><dl class="dspecs">${specificationRows}</dl>
       </section>`
    : `<section class="dsec unverified-record"><h3>Verification status</h3><p>We’re still checking this spacecraft’s story with NASA — explore the source link below while we do.</p></section>`;
  const sourceReview = artifact.verifiedByNASA
    ? `<section class="dsec dossier-review"><h3>Source-review note</h3><div class="lasttx" id="lastTx"></div></section>`
    : "";
  const provenance = artifact.verifiedByNASA
    ? 'NASA-checked record · source link below'
    : 'Context record · details withheld pending NASA review';
  dossier.dataset.body = artifact.b;
  $("#dBody").innerHTML = `
    <section class="dossier-identity" aria-label="Record identity"><span>${collectionLabel(artifact)}</span><b>${provenance}</b><small>${artifact.verifiedByNASA ? artifact.y : 'Year withheld'} · ${artifact.verifiedByNASA ? statusLabel(artifact.st) : 'Audit pending'}</small></section>
    ${opening}
    ${science}
    <div class="dsec dossier-source"><h3>Source trail</h3><a href="${artifact.source}" target="_blank" rel="noreferrer">Open ${artifact.sourceLabel} <span aria-hidden="true">↗</span></a><p>${artifact.verifiedByNASA ? "The story, record, and technical details above were checked against this opened NASA source." : "NASA’s page is ready to explore; this dossier will grow after its full fact-check."}</p></div>
    <figure class="dossier-media" data-webgl-plane="dossier-media">
      <img src="${artifact.image}" alt="${artifact.imageAlt}" width="${artifact.imageWidth}" height="${artifact.imageHeight}" loading="lazy" decoding="async" />
      <figcaption>${imageFlag}<span>${artifact.imageCredit}</span>${artifact.imageSource ? `<a href="${artifact.imageSource}" target="_blank" rel="noreferrer">Image source ↗</a>` : ""}</figcaption>
    </figure>
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
    ${sourceReview}`;
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
  // A modal dossier must own the interaction layer. This also prevents the
  // fixed menu toggle from sitting above the close button at compact widths.
  document.querySelector<HTMLElement>("#staggeredMenu")?.setAttribute("inert", "");
  $("#scrim").classList.add("on");
  if (!wasOpen) moveFocusIntoDossier();
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
  const dossier = $("#dossier");
  const focusTarget = lastFocusedElement;
  dossier.classList.remove("open");
  dossier.setAttribute("aria-hidden", "true");
  dossier.setAttribute("inert", "");
  document.querySelector<HTMLElement>("#staggeredMenu")?.removeAttribute("inert");
  $("#scrim").classList.remove("on");
  archiveState.selectedArtifactId = null;
  $$<HTMLButtonElement>(".hot").forEach((hotspot) =>
    hotspot.classList.remove("sel"),
  );
  $$<HTMLButtonElement>(".sitem").forEach((item) =>
    item.classList.remove("sel"),
  );
  $("#hudSel").innerHTML = "SELECTED · <b>NONE</b>";
  lastFocusedElement = null;
  if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
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
      const dossier = $("#dossier");
      const dialogOpen = dossier.classList.contains("open");
      if (dialogOpen && event.key === "Escape") {
        event.preventDefault();
        closeDossier();
        return;
      }
      if (dialogOpen && event.key === "Tab") {
        const focusable = focusableDossierElements();
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (dialogOpen && event.key === "ArrowLeft") {
        event.preventDefault();
        $<HTMLButtonElement>("#dPrev").click();
        return;
      }
      if (dialogOpen && event.key === "ArrowRight") {
        event.preventDefault();
        $<HTMLButtonElement>("#dNext").click();
        return;
      }
      if (
        !dialogOpen &&
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
  lastFocusedElement = null;
  closeDossier();
}
