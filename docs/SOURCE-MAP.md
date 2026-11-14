# Evidence and source map

Silent Fleet treats a NASA name, a NASA image, and a NASA-source-checked claim as three different things. This document uses the same vocabulary as the runtime archive and `docs/CLAIMS-AUDIT.md`.

## Current evidence states

| state | meaning | count |
| --- | --- | ---: |
| **Source linked** | The runtime record has one explicit, record-level NASA source URL. There are no section-level fallback links. | 42 |
| **Story safe** | The record has a separately labeled, deliberately non-factual story moment. It contains no dates, quantities, locations, rankings, or science claims. | 24 |
| **Fact checked — limited record** | Every factual sentence and specification currently visible in that dossier is bounded to the opened NASA source named on the record. | 24 |
| **Full evidence dossier** | The expanded audit has 2–3 supported factual sentences, 3–5 supported specifications, a story moment, and a record-level NASA link. | 22 |
| **Withheld** | The NASA link remains available, but narrative, dates, coordinates, status, and specifications are intentionally hidden pending a full claim review. | 18 |
| **Minimal fact record** | The record is fact checked for its deliberately narrow visible statement, but does not yet meet the expanded 2–3 sentence / 3–5 specification dossier standard. | 2 |

The two minimal fact records are not presented as master stories. They remain available in the archive with their source link and limited evidence treatment.

## How the map is implemented

- Runtime records and source URLs live in [`src/data/artifacts.ts`](../src/data/artifacts.ts).
- The 22 expanded NASA-source-bounded dossiers are in [`src/data/featured-audit.ts`](../src/data/featured-audit.ts).
- The explicitly labeled non-factual story layer is in [`src/data/dossier-stories.ts`](../src/data/dossier-stories.ts).
- The six-entry starter route is in [`src/data/story-path.ts`](../src/data/story-path.ts). It only points to expanded, image-bearing NASA-checked dossiers.
- The one-row-per-artefact raw-claim register and withheld treatment are in [`docs/CLAIMS-AUDIT.md`](./CLAIMS-AUDIT.md).

## Scope notes

- Lunar material uses NASA’s History Program catalogue when that is the record available to this project.
- NASA missions use a dedicated NASA Science, NASA History, NASA/JPL, or NASA Earthdata record as mapped in the runtime data.
- Context records from other agencies can be discoverable through the explicit **Other agencies** archive filter. A NASA page that mentions such a record does not automatically make the record fact checked.
- A mission-context image is never presented as a photograph of the hardware unless the image label explicitly says it is artefact-specific.
- The Moon catalogue is a partial programmatic parse. Its line count, filtered row count, and bracket-quantity sum are displayed separately in the application and are not converted into a mass or total-object claim.

## Regeneration and review

`npm run audit:claims` regenerates the row-level claims audit. Before changing a fact-visible record, open the linked NASA page, map each visible fact to it, and retain only copy the source supports. Do not restore legacy raw prose merely because a NASA link exists.
