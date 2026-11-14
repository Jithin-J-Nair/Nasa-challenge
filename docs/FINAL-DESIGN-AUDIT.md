# Silent Fleet — final design audit

**Branch:** `arena/769ca5cf-nasa-challenge`

**Scope:** surgical editorial reconstruction of the existing Vite/TypeScript archive; no architecture replacement.

## Result

The active experience now reads as one archival exhibition rather than a generic mission-control interface:

1. **Arrival** remains a dark-planet sunrise, rendered by the existing progressive R3F `HorizonBloom` path.
2. **Guided stories** become a warm-paper reading sequence with six clear questions, a visibly labelled interpretation, a separate NASA-checked record, direct evidence link, and clean source media.
3. **Moon catalogue** is a source register, not a fabricated inventory: it shows raw location text and exposes withheld invalid coordinate data plainly.
4. **Observatory** remains a distinct, dark interactive instrument with its existing lazy WebGL, fallback, and recovery boundaries.
5. **Field Guide and dossiers** use Moon/Mars/deep-space material families, visible source confidence, year/status signals, and a provenance-first reading order.

No alternate full stylesheet was switched on. `src/styles.css` imports the working `experience.css` and a purpose-built final layer, `src/styles/editorial-upgrade.css`; it does **not** import `src/styles/complete-rebuild.css`.

## Phase 0 runtime and cascade decision

| inspected area | finding | resulting decision |
| --- | --- | --- |
| Application composition | `src/main.ts` remains the sole owner for Lenis, dossiers, archive, timeline, Moon catalogue, stories, editorial index, StaggeredMenu, controls, lazy Observatory, and optional ambient R3F. | Kept composition and disposal ownership intact. |
| Active CSS | Before this pass, `src/styles.css` imported only `fonts.css` and `experience.css`. | Added a narrow final-cascade editorial layer; did not fork or replace the visual architecture. |
| `complete-rebuild.css` | It targets a former `header.nav`/liquid-nav arrangement, reintroduces hero/image-target selectors, and competes with current StaggeredMenu, Metal controls, Horizon Bloom fallback, and responsive rules. | Used no direct import. Compatible principles (paper reading surfaces, source-led hierarchy, collection materials) were translated selectively into `editorial-upgrade.css`. |
| R3F/WebGL | `SceneManager.tsx` mounts `HorizonBloom`; Observatory has its own lazy native Three renderer and WebGL recovery path. | Kept R3F, shaders, compact/coarse renderer skip, fallback, disposal, and native mobile scroll. |
| Data integrity | The archive remains source-gated: verified records render NASA-checked detail and other records keep claims withheld. | Added presentation clarity without restoring withheld claims. |

## Implemented changes

### Editorial system and media

- **`src/styles/editorial-upgrade.css`** — active, scoped design layer. It removes active decorative hero geometry and source-image overlays, sets paper/ink reading surfaces for stories and the lunar catalogue, keeps Observatory as a purposeful dark tool, and creates collection-specific Moon/Mars/deep-space archive folios and dossier folders.
- **Theme tokens** — the supplied OKLCH light and `.dark` semantic token sets now live at the top of `src/styles/editorial-upgrade.css`. `html.dark` is the active immersive shell; the guided stories, lunar register, Field Guide, and dossier each use `.theme-light` for the same supplied light token set. Existing archive variables now resolve from those semantic tokens rather than a parallel palette.
- **Cinematic phase one** — `HorizonBloom.tsx` now adds subtle procedural nebula, cratered limb, regolith sparkle, and a rare spectral scan while retaining the evidence image’s visual priority. `SceneCanvas.tsx` adds an error boundary, 1.8 DPR cap, and hero-range frame-loop gate; a live route indicator and restrained elevation are scoped to dark interactive surfaces.
- **`src/styles.css`** — imports the editorial layer after the working experience stylesheet.
- **`src/components/archive.ts`** — adds body-specific card classes and visible collection/year/source confidence; cards no longer render schematic SVGs on top of source images.
- **`src/components/dossier.ts`** — adds a source-first dossier identity strip, per-collection folder state, and makes `#staggeredMenu` inert while the modal is open. That corrects the compact-width condition where the fixed menu could cover the dossier close button.
- **`index.html`** — clarifies the search example with an ellipsis.

### Six guided narratives

- **`src/data/story-path.ts`** — Eagle, LLRR, Sojourner, InSight, Ingenuity, and Voyager 1 now have distinct prompts/invitations with age-legible vocabulary.
- **`src/data/dossier-stories.ts`** — the same six now receive distinct interpretation paragraphs. Every paragraph explicitly directs the reader to the adjacent NASA-checked record for dates, outcomes, and technical detail; no new factual claim is introduced in the interpretation layer.
- **`src/components/story-journey.ts`** remains the visible distinction: “Story moment · interpretation” is separate from “NASA-checked record” and a direct NASA evidence link.

### Moon catalogue correction

- **`scripts/parse-moon-catalogue.ts`** now parses a separate coordinate candidate only when the supplied values are within latitude `−90°…90°` and longitude `−180°…180°`.
- **`src/types/moon-catalogue.ts`** records `valid`, `invalid`, or `unavailable` coordinate status independently from raw `location` text.
- **`src/data/moon-catalogue.generated.ts`** preserves Ranger 9’s source string exactly: `112.828° N, -2.387° E`. Its source latitude is out of bounds, therefore no plotting coordinates are generated.
- **`src/components/moon-catalogue.ts`** shows that source row as “Plotting withheld” with the reason instead of silently repairing or guessing it.
- **`docs/MOON-CATALOGUE-METHOD.md`** records the bounded-coordinate method and Ranger 9 decision.
- **`scripts/moon-catalogue-test.ts`** verifies that the raw Ranger 9 string survives, that it is invalid, that it has no generated replacement pair, and that every generated plotting pair is bounded.

## Media integrity note

There are no active application DOM overlays matching `.evidence-grid`, `.evidence-target`, `.story-orbit`, or `.story-crosshair`; browser checks report zero. The Eagle raster itself is an unaltered NASA archival photograph and includes its original photographic fiducial/camera marks. Those marks are part of the cited source image, not application decoration.

## Browser evidence

All files below are generated review evidence and are intentionally ignored from Git:

| view | evidence |
| --- | --- |
| 1440×900 hero after ambient R3F mount | `artifacts/review/editorial-hero-horizon-desktop.png` |
| 1440×900 guided story paper spread | `artifacts/review/editorial-stories-desktop.png` |
| 1440×900 differentiated Field Guide | `artifacts/review/editorial-fieldguide-refined.png` |
| 1440×900 active OKLCH dark/light token treatment | `artifacts/review/oklch-theme-hero.png`, `artifacts/review/oklch-theme-fieldguide.png` |
| 1440×900 cinematic Horizon Bloom phase one | `artifacts/review/phase-one-cinematic-hero.png` |
| 1440×900 Eagle provenance dossier | `artifacts/review/editorial-dossier-desktop.png` |
| desktop/mobile Eagle and Ingenuity dossier captures | `artifacts/dossier-comparison/{eagle,ingenuity}-{1440x900,390x844}-editorial-upgrade.png` |
| regression views, including hero, story, Observatory/Mars, timeline, Voyager, and dossier | `artifacts/visual-regression/` |

`npm run test:visual` covered 1280×720, 1440×900, and 390×844; navigation disclosure/Escape, six story records, dossier focus trap/restoration, Ranger 9 source guard, Observatory and ambient context recovery, touch/native-scroll behavior, blocked-WebGL fallback, and the 42-item no-JS fallback all passed without console errors.

## Verification record

| command | outcome |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm run test` | Passed. The previously missing command is now a meaningful typecheck + Moon catalogue integrity aggregate. |
| `npm run test:catalogue` | Passed: 59 bounded coordinate pairs; 1 invalid source pair withheld without correction. |
| `npm run test:visual` | Passed at 1280×720, 1440×900, and 390×844 with zero console errors. |
| `npm run test:lifecycle` | Passed: three dispose/remount cycles retained one archive tree and at most one ambient canvas. |
| `PREVIEW_URL=http://127.0.0.1:5174 SCREENSHOT_LABEL=editorial-upgrade npm run test:dossier` | Passed: captured Eagle and Ingenuity dossiers at desktop and mobile sizes. |
| `npm run build` | Passed. The existing non-failing Vite chunk-size warning remains for the Three bundle. |
| `npm run test:lighthouse` | Passed on production preview: average **100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO**. Average FCP/LCP: 905 ms; TBT: 0 ms; CLS: 0.005. Detailed output: `docs/LIGHTHOUSE-MOBILE.md`. |
| `git diff --check` | Passed. |

## Limits and follow-up boundaries

- The exact React Bits Pro registry installation remains unavailable because this environment does not provide `REACTBITS_LICENSE_KEY`. The project-native Horizon Bloom remains in place; it is not represented as licensed React Bits source.
- The catalogue guard intentionally does not “correct” Ranger 9 to a guessed latitude. A replacement needs a separately reviewed, cited source update.
- NASA source availability and image metadata are external dependencies. Existing source links, image-specific/context/placeholder labels, and claim-withholding behavior remain the provenance boundary.
- The Three bundle still produces Vite’s non-failing >500 kB warning. It is deliberately retained because the working app already dynamically imports the optional ambient/Observatory paths and passed the targeted mobile Lighthouse run.
