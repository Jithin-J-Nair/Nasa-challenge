# Skill execution audit

_Status: continuing evidence log. This document records work that actually exists in the repository; it is not a completion certificate._

> **Correction to the prior report:** the `7396fa0` pass added real runtime, motion, test, and accessibility work, but it did **not** constitute a comprehensive visible redesign. It should not have been presented as one. The full visual reconstruction is recorded separately below and must be judged from its browser captures, not from build or lifecycle checks.

## Discovery and installation record

The workspace was searched with:

```bash
find .agents .claude .cursor skills agent data/skills -type f -name SKILL.md
```

That search found 119 paths: 61 primary documents under `.agents/skills/` plus 58 linked `agent/skills/` copies. There were no primary documents under `.cursor/skills/` or `skills/`. `skills-lock.json` is the reproducible installation manifest for this project.

| source | result |
| --- | --- |
| `anthropics/skills` | Installed; 20 skills available, including `frontend-design`. |
| `emalorenzo/three-agent-skills` | Installed `r3f-best-practices`. |
| `greensock/gsap-skills` | Installed `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, and `gsap-performance`. |
| `emilkowalski/skills` | Installed 19 skills, including choreography, gesture, animation, and design-engineering guidance. |
| `alton47/threejs-skills` | Investigated but **not installed or used**. The Skills CLI rejected every discovered source document because its YAML front matter did not parse (nested mappings in compact descriptions). |

## Actual skill execution matrix

| skill | exact material read | implementation actually made | exact target | verification evidence |
| --- | --- | --- | --- | --- |
| `frontend-design` | `.agents/skills/frontend-design/SKILL.md` | Preserved the subject-specific evidence-atlas direction: editorial hero, NASA-source-bearing imagery, and deliberately quiet surrounding UI rather than adding a generic effects layer. | Existing design direction, `src/components/interface.ts`, rendered hero/story route. | Desktop and mobile captures below; no source/provenance copy was weakened. |
| `gsap-core`, `gsap-timeline` | `.agents/skills/gsap-core/SKILL.md`, `.agents/skills/gsap-timeline/SKILL.md` | Added one labelled `signal` arrival timeline with shared `power3.out` defaults. It stages orientation, proposition, action, evidence, and supporting facts with transform/`autoAlpha` only. | `src/components/interface.ts` | 1440×900 and 390×844 browser captures; `prefers-reduced-motion` branch leaves it out. |
| `gsap-scrolltrigger`, `gsap-performance` | `.agents/skills/gsap-scrolltrigger/SKILL.md`, `.agents/skills/gsap-performance/SKILL.md` | Kept the existing chapter ScrollTrigger ownership; the new hero work is a single cleanup-owned timeline instead of new per-element scroll triggers. | `src/components/interface.ts`, existing `src/components/story-journey.ts` | `npm run test:lifecycle` retained one archive tree and at most one ambient canvas through three remounts. |
| `r3f-best-practices` | `.agents/skills/r3f-best-practices/SKILL.md`; `rules/frame-delta-time.md`, `rules/perf-never-set-state-in-useframe.md`, `rules/perf-visibility-toggle.md`, `rules/perf-r3f-perf.md` | Converted pointer, camera, and DOM-media hover smoothing to delta-time response; cached static DOM echo targets outside the frame loop; pause the R3F loop when hidden/visually suppressed; do not create the ambient renderer on compact/coarse initial viewports. No React state is set from `useFrame`. | `src/experience/SceneManager.tsx`, `src/experience/SceneCanvas.tsx`, `src/main.ts` | Typecheck, lifecycle stress, visual WebGL context recovery, no-WebGL fallback, and touch test all passed. |
| `animation-performance` | `.agents/skills/animation-performance/SKILL.md` | The arrival sequence uses opacity/transforms only. The R3F work avoids per-frame React state and frame-rate-dependent interpolation. | `src/components/interface.ts`, `src/experience/SceneManager.tsx` | Code review plus browser run at desktop and mobile sizes. |
| `animate`, `choreograph` | `.agents/skills/animate/SKILL.md`, `.agents/skills/animate/RECIPES.md`, `.agents/skills/choreograph/SKILL.md`, `.agents/skills/choreograph/RECIPES.md` | Applied the motion decision gates: the one-off archive arrival exists for orientation; frequent archive controls and keyboard navigation did not receive new decorative motion. | `src/components/interface.ts` | Arrival shown in generated hero captures; reduced-motion branch is retained. |
| `gestures` | `.agents/skills/gestures/SKILL.md` | Maintained fine-pointer-only ambient art direction; compact/coarse devices now avoid mounting the hidden renderer entirely and retain native scroll. | `src/main.ts`, `src/experience/SceneCanvas.tsx`, `scripts/visual-test.ts` | Real touch browser context asserts native scroll, hidden shell, no reticle, and **zero** ambient canvases. |
| `emil-design-eng` | `.agents/skills/emil-design-eng/SKILL.md` | Favoured one choreographed arrival over new repetitive card effects; tightened the existing dossier focus handoff so its state change is reliable for keyboard users. | `src/components/dossier.ts` | Visual test verifies modal focus and focus restoration. |
| `webapp-testing` | `.agents/skills/webapp-testing/SKILL.md` | Strengthened the existing browser test: touch fallback now asserts no ambient canvas allocation, and the native Observatory allowance is realistic for texture/model generation. | `scripts/visual-test.ts` | `PREVIEW_URL=http://127.0.0.1:5173 npm run test:visual` passed with zero console errors. |

## Implementation record

The pass intentionally improved working boundaries instead of replacing the application architecture:

- `src/components/interface.ts` — added the lifecycle-owned GSAP hero arrival and kills its timeline on disposal.
- `src/experience/SceneManager.tsx` — made shader-scene smoothing frame-rate independent and removed a repeated selector lookup from the frame path.
- `src/experience/SceneCanvas.tsx` — pauses continuous rendering while a tab is hidden or the canvas is suppressed by the compact/coarse breakpoint.
- `src/main.ts`, `src/experience/mount.tsx`, `src/experience/LenisScrollWrapper.tsx` — owns Lenis at the application level, rather than tying scroll control to the optional ambient R3F mount. This preserves native scrolling when mobile deliberately skips the ambient renderer.
- `src/components/dossier.ts` — focuses the close control immediately (and once on the next paint for browser resilience) while preserving opener restoration.
- `scripts/visual-test.ts` — records the compact-renderer contract so the mobile performance safeguard is regression-tested.
- `skills-lock.json` — records the valid installed skill package sources and hashes.

## Full visual reconstruction — current patch

This is the first pass in this branch that changes the visible product system across the route, rather than only its runtime behavior.

| skill guidance used | visible implementation | files |
| --- | --- | --- |
| `frontend-design` | Replaced the previous evidence-atlas treatment with a **lunar survey atelier**: night-blue transmission surfaces, pale catalogue paper, registration red, chartreuse source state, image plates, and an explicit typography hierarchy. Each major destination now has its own material surface rather than inheriting one dashboard panel style. Added `signal-atlas.jpg`, an abstract non-evidentiary cartography texture, for the mission-cover environment. | `docs/FRONTEND-DESIGN-DIRECTION.md`, `src/styles/complete-rebuild.css`, `src/assets/signal-atlas.jpg` |
| `animate`, `choreograph`, `gsap-timeline` | Kept one orienting hero arrival and existing story progression; the new design intentionally does not add repetitive card entrance effects or decorative control animation. | existing `src/components/interface.ts`, `src/components/story-journey.ts`, visual CSS |
| `gestures`, `animation-performance` | Kept direct mobile controls and fine-pointer-only ambient behavior. New hover states use only transform/color/filter response on direct actions; reduced motion removes nonessential movement. | `src/styles/complete-rebuild.css`, existing motion boundaries |
| `r3f-best-practices` | The reconstructed observatory is framed as a distinct transmission tool while retaining its progressive WebGL/fallback boundary and the compact-device renderer skip. | `src/styles/complete-rebuild.css`, existing R3F implementation |
| `webapp-testing` | Captured the rebuilt desktop/mobile opening, story spread, contact-sheet archive, and Observatory before running the full regression suite. | `artifacts/review/rebuild-*.png`, `artifacts/visual-regression/` |

### Concrete visible changes

- `src/styles/complete-rebuild.css` is a new end-of-cascade visual system covering navigation, hero, guided stories, evidence briefing, source catalogue, Observatory, ledger, timeline, deep-space reading, contact-sheet Field Guide, science rules, epilogue, footer, dossier, desktop, and mobile.
- `src/styles.css` imports that new visual system last so it replaces the former section treatment without breaking component selectors or source-safe DOM structure.
- `src/components/archive.ts` changes Field Guide cards from schematic-only tiles to record-associated NASA imagery with the existing schematic retained as an overlay. The image has empty alt text because the button title/metadata provides the accessible name; provenance remains in the dossier.
- `src/assets/signal-atlas.jpg` is an original abstract cartography texture used only as a decorative mission-cover background; it is not presented as a NASA photograph or evidence.
- `src/components/editorial-system.ts` creates, observes, and disposes a ten-section edition index. The visible markers encode the actual reading sequence and are not decorative fake numbers.
- `index.html`, `src/main.ts`, and `src/styles/complete-rebuild.css` add and style the custom signal-atlas key, orbital object index, and edition system across desktop and mobile. The shell copy, hero proposition/CTAs, navigation vocabulary, and every primary section title were also reauthored as a single field-edition reading path rather than retaining the former dashboard labels.
- `src/components/interface.ts` explicitly defines the final hero-evidence state in the GSAP timeline. This fixes a production-only startup ordering conflict between the shared reveal observer and the hero arrival, which previously could leave the evidence plate hidden after the page settled.
- `docs/FRONTEND-DESIGN-DIRECTION.md` now documents the reconstructed visual system and its acceptance gate.

## Browser evidence and checks

Generated evidence is intentionally ignored from Git and remains in `artifacts/visual-regression/`:

- `artifacts/review/rebuild-desktop.png` and `artifacts/review/rebuild-mobile.png` — reconstructed mission-cover opening at the target desktop/mobile sizes.
- `artifacts/review/rebuild-production-final-1440.png` — rebuilt production preview after the hero-evidence startup fix.
- `artifacts/review/rebuild-first-story-fixed.png` — reconstructed two-column editorial story spread.
- `artifacts/review/rebuild-fieldguide-desktop.png` — reconstructed image-led contact-sheet archive.
- `desktop-1440x900.png` — regression-captured hero after the arrival settled.
- `desktop-1440x900-stories.png` and `mobile-390x844-stories.png` — source-bearing guided chapter composition at both target sizes.
- `desktop-1440x900-observatory.png`, `desktop-1440x900-observatory-mars.png`, `mobile-390x844-observatory.png`, and `mobile-390x844-observatory-mars.png` — native Observatory checks.
- `desktop-1440x900-dossier-eagle.png` and `mobile-390x844-dossier-eagle.png` — source dossier and focus-path exercise.
- `mobile-390x844.png` — compact hero composition; its touch context also verified native scrolling and no ambient R3F canvas allocation.

The completed commands and results for this pass:

| command | result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `git diff --check` | Passed. |
| `PREVIEW_URL=http://127.0.0.1:5173 npm run test:visual` | Passed at 1280×720, 1440×900, and 390×844 with zero console errors; exercised source-aware stories, dossier focus trap/restoration, Observatory context recovery, WebGL fallback, touch/native-scroll fallback, and no-JS output for all 42 artefacts. |
| `npm run test:lifecycle` | Passed: three dispose/remount cycles retained one archive tree and at most one ambient canvas. |
| `npm run build` | Passed. The existing non-failing Three.js chunk-size warning remains: `three.module` 673.83 kB minified / 171.17 kB gzip. |

## Discovered skills that were deliberately not applied

Installation/discovery is not implementation. The following installed skills are accounted for but did not produce code in this pass:

| status | skills | reason |
| --- | --- | --- |
| Read before this pass, not applied here | `user-research`, `web-design-guidelines`, `vercel-react-best-practices`, `tailwind-design-system`, `vercel-composition-patterns` | Earlier repository work already used their relevant guidance; this pass targeted visual choreography and optional WebGL runtime behaviour, not a framework rewrite. |
| Installed, read, not applied | `gsap-plugins`, `gsap-react` | No measured need for a new GSAP plugin or React-specific GSAP hook; adding either would increase surface area without improving this static/imperative architecture. |
| Installed, not applied | `animate-expo`, `animation-vocabulary`, `apple-design`, `ask-sonner`, `break-ui`, `find-animation-opportunities`, `improve-animations`, `learn-taste`, `mobile-native`, `pick-ui-library`, `prototype`, `remove-animations`, `review-animations`, `write-swift` | Mobile-native, UI-library, review-only, or exploratory tools not needed for this targeted browser implementation. |
| Installed, not applied | `academy-guide`, `algorithmic-art`, `banner-design`, `brand`, `brand-guidelines`, `canvas-design`, `design`, `design-system`, `discernment-nudge`, `theme-factory`, `ui-styling`, `ui-ux-pro-max`, `web-artifacts-builder`, `writing-guidelines` | Broad design/brand guidance was not invoked because the committed archive-specific direction already constrained the visual system; adding a parallel system would reduce coherence. |
| Installed, not applied | `claude-api`, `mcp-builder`, `slack-gif-creator`, `vercel-cli-with-tokens`, `deploy-to-vercel` | The request did not require API, MCP, Slack GIF, credential, or deployment workflows. |
| Installed, not applied | `doc-coauthoring`, `docx`, `pdf`, `pptx`, `slides`, `xlsx`, `internal-comms` | No office-document deliverable was requested. |
| Installed, not applied | `skill-creator`, `template-skill`, `vercel-optimize`, `vercel-react-native-skills`, `vercel-react-view-transitions` | No new skill authoring, React Native surface, Vercel-only optimization, or view-transition architecture was justified. |

The malformed `alton47/threejs-skills` source is excluded from all rows above because it did not yield valid installed documents. No skill is claimed as applied merely because it appears in `skills-lock.json`.

## Surgical reconstruction follow-up — current branch state

> **Supersession note:** the historic section above describes an experiment that said `complete-rebuild.css` was active. That is **not** the active runtime state. `src/styles.css` imports `fonts.css`, `experience.css`, and the narrow `editorial-upgrade.css` layer; it does not import `complete-rebuild.css`. The new layer exists precisely to avoid two full competing systems.

| skill | exact material read | applied decision and code | verification |
| --- | --- | --- | --- |
| `frontend-design` | `.agents/skills/frontend-design/SKILL.md` | Applied a single archival-editorial direction: the existing Horizon Bloom remains the dark-planet hero atmosphere; guided stories become warm paper spreads; the Moon register becomes a sober source ledger; Moon/Mars/deep-space archive folios and dossier folders receive distinct material families. No dashboard grid, reticle, or image geometry was added. | `src/styles/editorial-upgrade.css`, `src/components/archive.ts`, `src/components/dossier.ts`; review captures listed in `FINAL-DESIGN-AUDIT.md`. |
| `emil-design-eng` | `.agents/skills/emil-design-eng/SKILL.md` | Kept interaction hierarchy readable: collection/year/source state precede an archive card’s title; dossier identity precedes interpretation, record, source trail, media, and designation. The modal now makes the fixed menu inert so it cannot cover the close control at compact widths. | `src/components/archive.ts`, `src/components/dossier.ts`, `scripts/visual-test.ts`, `npm run test:dossier`. |
| `web-design-guidelines` | `.agents/skills/web-design-guidelines/SKILL.md` and `https://api.github.com/repos/vercel-labs/web-interface-guidelines/contents/command.md` | Used semantic buttons/links already in the DOM, retained visible focus and intrinsic image dimensions, changed the search placeholder to an ellipsis, preserved `aria-live` result updates, and fixed a real modal interaction-layer conflict. | Desktop/mobile Playwright checks passed; Lighthouse accessibility evidence is recorded in `docs/LIGHTHOUSE-MOBILE.md`. |
| `choreograph`, `animation-performance`, `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger` | `.agents/skills/choreograph/SKILL.md`, `.agents/skills/animation-performance/SKILL.md`, `.agents/skills/gsap-core/SKILL.md`, `.agents/skills/gsap-timeline/SKILL.md`, `.agents/skills/gsap-scrolltrigger/SKILL.md` | Did not add ornamental motion. The existing, cleanup-owned hero/story sequences remain the only orienting motion; the editorial layer uses no new animation beyond direct control feedback and honors the pre-existing reduced-motion branch. | `npm run test:lifecycle` passed three dispose/remount cycles; `npm run test:visual` passed with reduced/mobile fallback checks. |
| `r3f-best-practices` | `.agents/skills/r3f-best-practices/SKILL.md` | Preserved the progressive R3F/Horizon Bloom and separate lazy Observatory boundaries rather than replacing them with a CSS backdrop. Retained compact/coarse no-canvas behavior, context recovery, disposal, and native mobile scrolling. | Visual suite exercised ambient context loss/recovery, Observatory recovery, blocked-WebGL semantic fallback, and touch/native-scroll behavior. |
| `webapp-testing` | `.agents/skills/webapp-testing/SKILL.md` | Added a source-integrity regression for the Ranger 9 invalid coordinate and an interaction-ownership assertion for the dossier; created a meaningful `npm run test` aggregator instead of leaving the requested command undefined. | `scripts/moon-catalogue-test.ts`, `scripts/visual-test.ts`, `package.json`; all passed. |

### Exact current changes

- `src/styles/editorial-upgrade.css` — active final-cascade adaptation; no dormant complete-rebuild import. It now contains the supplied OKLCH light/dark token system, maps archive semantics to those tokens, and scopes the light token set to reading surfaces while `html.dark` powers immersive sections.
- `src/data/dossier-stories.ts`, `src/data/story-path.ts` — six named guided narratives made distinct, school-age-legible, and explicitly separated from NASA-checked copy.
- `src/components/archive.ts`, `src/components/dossier.ts` — differentiated collections, visible year/status/source confidence, and provenance-first dossier folders; removed archive schematic image overlays.
- `scripts/parse-moon-catalogue.ts`, `src/types/moon-catalogue.ts`, `src/data/moon-catalogue.generated.ts`, `src/components/moon-catalogue.ts` — raw source text retained, bounded coordinate parsing added, Ranger 9 plotting withheld, and its status exposed in the register.
- `scripts/moon-catalogue-test.ts`, `scripts/visual-test.ts`, `scripts/capture-dossier-comparison.ts`, `package.json` — test coverage and test-command repair.

The React Bits Pro installer remains blocked by the missing `REACTBITS_LICENSE_KEY`; no claim is made that the project-native `HorizonBloom.tsx` is licensed React Bits source.

## Attached `frontend-design` revalidation — 2026-11-14

### Plan

- **Subject and job:** Silent Fleet is a source-aware educational exhibition for readers who want to distinguish NASA-supported records from interpretation. Its job is to make long-distance hardware feel discoverable without making a mission-control dashboard.
- **Palette:** archive black `#252525`, negative black `#161616`, lunar paper `#FFFFFF`, field grey `#8E8E8E`, hairline silver `#EBEBEB`, and source red `#D83B30`. These are expressed through the active supplied OKLCH semantic tokens rather than a new parallel palette.
- **Type:** Space Grotesk carries titles and controls; Instrument Serif is retained for reading passages and the closing quotation; IBM Plex Mono is limited to data, source state, and instrument-like record detail.
- **Layout:** Horizon Bloom and the source image remain the single cinematic arrival. The rest resolves into quiet reading spreads, then a responsive specimen shelf whose large plates follow the six existing guided-record IDs—not arbitrary card decoration. Text stays left-aligned and narrative measures remain constrained.

### Generic-default review and revision

The pre-pass interface still had serial labels above nearly every heading, all-caps utility treatment on ordinary copy, a singled-out italic phrase in each display line, and a uniform archive-card grid. Those choices risked making a NASA archive feel like a template. The revision removes non-sequential serial copy from section headings and menu rows, makes ordinary labels sentence case, leaves serial information only where it represents the guided reading order, removes the visual emphasis from isolated headline phrases, and bases varied Field Guide plates on the six real records in the guided path.

### Implemented outcome

- `index.html` uses direct section labels and straightforward, active headings; the menu is an invitation to explore rather than a numbered template list.
- `src/data/story-path.ts` identifies each story by its actual location instead of formulaic “Chapter N” labels.
- `src/components/archive.ts` uses sentence-level result and provenance copy and emits `acard--featured` only for the six existing `STORY_PATH` records.
- `src/styles/editorial-upgrade.css` scopes the typographic, plain-language, source-first archive shelf, responsive layout, focus-safe action, and reduced-motion-compatible refinements to the active final cascade. No new decorative motion or image overlay is introduced.

## In-place cinematic enhancement — phase one

The Awwwards-style direction is being translated into the existing Vite/TypeScript architecture rather than replacing it with a fictitious single `App.jsx`. This preserves the semantic archive, audited NASA imagery, source boundary, accessibility coverage, and disposal/context-recovery lifecycle.

- `src/experience/HorizonBloom.tsx` — keeps the required `atmosphere: .68` sunrise preset and adds restrained procedural domain-warped nebula, analytical crater field that perturbs the planetary limb, regolith sparkle, and a rare nine-second spectral scan. These remain behind the evidence image; no geometry is restored over NASA story media.
- `src/experience/SceneCanvas.tsx` — wraps the optional R3F canvas in an error boundary that falls back to the existing CSS hero, caps DPR at 1.8, and pauses the ambient frameloop when the hero leaves its buffered viewport, as well as on compact, coarse-pointer, or hidden views.
- `src/components/interface.ts`, `index.html`, `src/styles/editorial-upgrade.css` — add an accessible decorative mission-progress hairline and restrained layered elevation to the dark interactive tools. Paper reading surfaces deliberately retain their calm archival treatment.

The next phases are archival filtering/dossier transmission choreography, Observatory interaction refinement, and the deep-space instrument treatment. They will remain progressive, reduced-motion safe, source-aware, and independently disposable.
