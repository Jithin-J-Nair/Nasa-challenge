# Silent Fleet

A NASA-first interactive learning archive of hardware left on the Moon, Mars, and in deep space. NASA records are the default catalogue scope; contextual records from other agencies are available through the explicit **Other agencies** filter. It is a Vite-powered, dependency-managed static web application.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Project structure

```text
src/
├── components/       # Focused UI and experience modules
│   ├── archive.js            # Field Guide, ledger, science index
│   ├── observatory.js        # Three.js globe, markers, dossier panel
│   ├── timeline.js           # Interactive mission chronology
│   ├── planet-textures.js    # Procedural bump maps for local NASA color textures
│   ├── telemetry.js          # Dated NASA Voyager status snapshot and SVG diagrams
│   ├── visual-effects.js     # Starfields and text effects
│   ├── audio.js              # Optional ambient telemetry audio
│   └── boot.js               # Opening acquisition sequence
├── data/             # Catalogue records and reusable SVG artwork
├── lib/              # DOM helpers, shared state, events, utility functions
├── styles/           # Fonts, shared tokens, sections, footer, responsive rules
├── styles.css        # Stylesheet entry point
└── main.js           # Application composition root
```

The application intentionally uses framework-free ES modules: interactions are separated by responsibility without adding a heavyweight client framework.

## Assets and verification

- Runtime dependencies, including Three.js, GSAP, ScrollTrigger, and fonts, are installed locally through npm; there are no CDN runtime imports.
- Planet maps, the Voyager image, and the share card are hosted in `public/assets/`. Their source credits and usage notes are in `public/assets/CREDITS.md`.
- Each dossier exposes a NASA source link. Context records that are not verified against NASA documentation withhold narrative and technical detail.
- `npm run test:visual` runs the responsive browser smoke test at 1280×720, 1440×900, and 390×844, validates NASA-first filtering, dossier evidence treatment, locally hosted texture credits, zero console errors, and the 42-entry no-JavaScript fallback.
