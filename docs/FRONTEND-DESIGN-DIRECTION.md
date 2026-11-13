# Silent Fleet — visual reconstruction direction

## Design premise

Silent Fleet is not a mission-control dashboard or a generic dark space site. It is a **lunar survey atelier**: a reading experience where captured NASA material, large questions, and auditable records sit on deliberately different physical surfaces.

The design should make a visitor feel like they have opened a rare planetary field folio. The archive moves between night-blue transmission stock and pale catalogue paper. Images are treated as document plates, not decorative thumbnails. Red is a registration mark; electric chartreuse marks live source state; blue identifies an evidence-bound claim.

## Visual system

| element | decision | purpose |
| --- | --- | --- |
| Night blue `#07111F` | transmission, navigation, Observatory, archive tools | gives live interaction a clear environment without turning every section into a HUD |
| Catalogue paper `#F1EEE6` | stories and long-form reading | gives text real editorial contrast and separates interpretation from controls |
| Registration red `#FF5A36` | active path, action, photographic plate edge | provides a specific archival-print cue, not a decorative accent |
| Chartreuse `#D9FF65` | source-safe/live state | reserves the brightest signal for evidence and active controls |
| Survey blue `#3978FF` | NASA-checked record labels and evidence links | separates provenance information from reflective copy |
| Space Grotesk / Instrument Serif / IBM Plex Mono | question / invitation / compact provenance | each type role has one job; mono is never used for primary reading |

## Composition rules

1. **The hero is a mission cover.** It uses one oversized question, one evidence photograph, an oversized archive watermark, and a visible physical plate edge. It is not a stats-first dashboard.
2. **Stories are full editorial spreads.** One question and one source-marked image occupy a plate. The warm narrative and NASA-checked record are visibly separate, but neither is hidden behind interaction.
3. **Tools have their own material.** The Observatory is midnight-blue. The catalogue is a photographic contact sheet. The small-things ledger is a coloured accession tray. The timeline is a dark rail. Evidence rules sit on chartreuse review stock.
4. **Every image retains provenance.** Artefact image status and NASA source links remain readable. Archive cards now use record imagery with a schematic overlay, so the visual change does not invent historical media.
5. **There is one choreographed arrival, not motion everywhere.** Scroll motion carries a reader between story plates; hover response is limited to direct actions; input and keyboard paths stay immediate.

## Experience requirements

- Preserve all existing NASA/source distinctions, no-JS content, Field Guide controls, dossiers, globe controls, source links, and keyboard focus behavior.
- Use real NASA-derived image assets already associated with their records. Do not introduce AI imagery that could be mistaken for a mission record.
- Desktop must feel composed at 1440×900, and mobile must be a deliberate single-column edition at 390×844 rather than a compressed desktop.
- Reduced-motion and coarse-pointer modes keep every piece of information and skip decorative movement/hidden ambient rendering.

## Visual acceptance gate

Do not call a pass complete because code compiles. The rebuild is acceptable only when browser captures show:

1. a recognisably different opening composition;
2. paper-story / transmission-tool contrast across the full route;
3. evidence and source labels remain legible beside real imagery;
4. image-led archive cards, not the previous schematic-only grid;
5. usable responsive navigation, dossier, Observatory, filters, and source links.
