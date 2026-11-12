# Dossier source map

Every one of the 42 dossiers has an explicit `NASA_SOURCES` entry in [`src/data/artifacts.js`](../src/data/artifacts.js). There is **no section-level fallback link** in the runtime data.

- Lunar material uses the NASA History Program catalogue where that is the mission-specific NASA record available to this project.
- NASA missions use a dedicated NASA Science mission page.
- Context records from other agencies use a NASA observation or NASA catalogue page specific to that record; they are not treated as verified merely because a NASA page mentions them.

The full one-row-per-artefact mapping, raw claims, and visibility state is generated into [CLAIMS-AUDIT.md](./CLAIMS-AUDIT.md) with `npm run audit:claims`.

| check | result |
| --- | ---: |
| catalogue records | 42 |
| explicit NASA source URLs | 42 |
| section-level source fallbacks | 0 |
| complete visible-claim audits | 9 |
