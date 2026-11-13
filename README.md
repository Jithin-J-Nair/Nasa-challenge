# Silent Fleet

**Silent Fleet** is an independent, NASA-resource-based educational experience about hardware left on the Moon, Mars, and beyond. It opens with six source-aware guided stories, then offers an interactive Observatory, a searchable Field Guide, a Moon catalogue parse, a mission timeline, and a visible evidence trail.

> Independent educational project. Silent Fleet is not produced by, affiliated with, sponsored by, or endorsed by NASA, JPL, Caltech, the U.S. Government, or mission partners.

## Run locally

```bash
npm ci
npm run dev
```

Build and preview the production site:

```bash
npm run build
npm run preview
```

## Experience model

1. **Start with a story** — six curated, image-bearing, NASA-checked dossiers introduce a single machine and a large question.
2. **Explore locations** — a locally rendered Moon/Mars globe exposes only source-audited marker locations. It is not a real-time mission feed.
3. **Browse the archive** — all 42 records remain searchable. NASA records are the default; other-agency context records require an explicit filter choice.
4. **Inspect the evidence** — every dossier exposes its record-level NASA reading link, image treatment, and fact-check state.

The story copy is intentionally labeled as interpretation and does not introduce dates, quantities, locations, rankings, or scientific outcomes. NASA-checked facts and specifications are displayed separately.

## Architecture

```text
src/
├── components/
│   ├── archive.ts             # Field Guide, ledger, and science index
│   ├── dossier.ts             # Modal evidence dossier, focus management, sources
│   ├── observatory.ts         # Native Three.js Moon/Mars globe and markers
│   ├── story-journey.ts       # Guided story route and GSAP choreography
│   ├── timeline.ts            # Interactive mission chronology
│   ├── telemetry.ts           # Dated Voyager snapshot and SVG diagrams
│   ├── ui/liquid-glass-navbar.ts
│   └── visual-effects.ts
├── data/
│   ├── artifacts.ts           # Archive records, source mapping, image metadata
│   ├── featured-audit.ts      # Expanded source-bounded dossier copy
│   ├── dossier-stories.ts     # Separately labeled non-factual story moments
│   └── story-path.ts          # Six-chapter starter route
├── experience/                # Persistent React Three Fiber ambient layer
├── lib/                       # DOM helpers, events, state, and utilities
├── styles/                    # Design system, story journey, responsive CSS
├── styles.css                 # Stylesheet entry point
└── main.ts                    # Strict-TypeScript composition root
```

The application uses **TypeScript**, **React 18 / React Three Fiber** for the optional ambient renderer, native **Three.js** for the Observatory, **GSAP / ScrollTrigger**, and **Lenis**. There are no runtime CDN imports or backend/API dependencies.

## Commands

| command | purpose |
| --- | --- |
| `npm run typecheck` | Strict TypeScript validation. |
| `npm run build` | Typecheck and production Vite build. |
| `npm run test:visual` | Desktop/mobile browser smoke checks, story route, context recovery, accessibility modal behavior, no-JS fallback, and WebGL fallback. Start `npm run dev` first. |
| `npm run test:lifecycle` | Repeated dispose/remount stress test. Start `npm run dev` first. |
| `npm run test:lighthouse` | Three mobile Lighthouse runs and a documented LCP observation. Run against a production preview. |
| `npm run audit:claims` | Regenerate the row-level claim audit. |
| `npm run catalogue:parse` | Rebuild the partial Moon catalogue cache from a local NASA PDF using Poppler. |

## Evidence model

Read [`docs/SOURCE-MAP.md`](docs/SOURCE-MAP.md) for the shared source definitions and current counts. In brief:

- **42** records have a record-level NASA source URL.
- **24** records are fact checked for their visible limited copy.
- **22** of those meet the expanded dossier standard: 2–3 supported factual sentences, 3–5 supported specs, a labeled story moment, and source treatment.
- **18** remain available with their NASA reading link but intentionally withhold unsupported historical detail.

## NASA data and local media

| source | project use |
| --- | --- |
| [Catalogue of Manmade Material on the Moon](https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf) | Programmatic Moon-catalogue parse; separate line, direct-row, and bracket-quantity counts; audited lunar locations. |
| [NASA Voyager status](https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/) | Dated Voyager distance snapshot and one-light-day milestone. |
| [NASA LRO Odysseus record](https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/) | Audited Odysseus location. |
| [NASA/JPL Mars 3 record](https://www.jpl.nasa.gov/news/nasa-mars-orbiter-images-may-show-1971-soviet-lander/) | Audited Mars 3 landing/transmission statement. |
| [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720) | Local Moon colour map used by the Observatory. |
| [NASA/USGS Mars map](https://mars.nasa.gov/resources/6435/global-geologic-map-of-mars/) | Local Mars map used by the Observatory. |
| [NASA Image and Video Library](https://images.nasa.gov/) | Locally hosted dossier media with retained credits and source links. |

Image credits and dimensions are listed in [`public/assets/CREDITS.md`](public/assets/CREDITS.md). A related mission image is always labeled as context; it is never represented as a photograph of the record unless it is artefact-specific.

## Refresh the Moon catalogue

The checked-in cache is explicitly a partial parse. To regenerate it from a local copy of NASA’s named PDF, install Poppler’s `pdftotext`, then run:

```bash
MOON_CATALOGUE_PDF=path/to/final-catalogue-of-manmade-material-on-the-moon.pdf npm run catalogue:parse
```

The parser reports table lines, direct object/location rows, and bracket quantities separately. It does not estimate a total mass or invent coordinates.
