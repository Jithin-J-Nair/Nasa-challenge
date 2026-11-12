# Silent Fleet

An interactive archive of off-world hardware left on the Moon, Mars, and in deep space. Built as a Vite-powered, dependency-managed static web application.

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
│   ├── planet-textures.js    # Procedural Moon and Mars canvas textures
│   ├── telemetry.js          # Live telemetry and SVG diagrams
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
