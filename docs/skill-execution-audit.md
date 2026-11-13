# Skill execution audit

_Status: specialist implementation and verification pass complete. This is an evidence log for this repository, not a claim that every installed skill was applied._

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

## Browser evidence and checks

Generated evidence is intentionally ignored from Git and remains in `artifacts/visual-regression/`:

- `desktop-1440x900.png` — hero after the arrival settled.
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
