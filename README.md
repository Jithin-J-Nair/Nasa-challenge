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
│   └── boot.js               # Instant, non-blocking acquisition preference
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

## NASA data and source table

| source | project use |
| --- | --- |
| [Catalogue of Manmade Material on the Moon](https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf) | Programmatic Moon-catalogue parse, its separately reported line/direct-row/bracket-quantity counts, and audited lunar record locations. |
| [NASA Voyager status](https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/) | Dated Voyager snapshot and one-light-day milestone. |
| [NASA LRO Odysseus record](https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/) | Audited Odysseus location. |
| [NASA/JPL Mars 3 record](https://www.jpl.nasa.gov/news/nasa-mars-orbiter-images-may-show-1971-soviet-lander/) | Audited Mars 3 soft-landing and 14.5-second transmission statement. |
| [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720) and [NASA/USGS Mars map](https://mars.nasa.gov/resources/6435/global-geologic-map-of-mars/) | Local observatory texture maps. |
| [NASA Image and Video Library](https://images.nasa.gov/) | Locally hosted dossier media with retained NASA credit lines. |

## Refreshing the Moon catalogue from a local PDF

The checked-in Moon catalogue cache is explicitly partial. To rebuild it from a local copy of NASA’s named PDF, install the command-line **Poppler** tool `pdftotext`, then run:

```bash
MOON_CATALOGUE_PDF=path/to/final-catalogue-of-manmade-material-on-the-moon.pdf npm run catalogue:parse
```

Required tools: Node.js/npm for the script and `pdftotext` from Poppler for PDF extraction. The command regenerates the searchable module and [`docs/MOON-CATALOGUE-METHOD.md`](docs/MOON-CATALOGUE-METHOD.md).

The record-level source and claim register is in [`docs/CLAIMS-AUDIT.md`](docs/CLAIMS-AUDIT.md). The media credit table is in [`public/assets/CREDITS.md`](public/assets/CREDITS.md). The project uses NASA data for educational reference and is not produced by, affiliated with, sponsored by, or endorsed by NASA, JPL, Caltech, the U.S. Government, or mission partners.
