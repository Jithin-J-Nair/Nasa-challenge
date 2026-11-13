# Silent Fleet submission

## Project summary

Silent Fleet is an independent educational experience about hardware left on the Moon, Mars, and beyond. It begins with a six-chapter guided route so school-age and casual audiences can meet one machine at a time, then opens into a searchable Field Guide, source-aware dossier system, Moon catalogue, mission timeline, and interactive Moon/Mars Observatory.

The project deliberately separates **story moment**, **NASA-checked record**, **image treatment**, and **source link**. A story moment is clearly labeled interpretation and contains no factual dates, quantities, locations, rankings, or science outcomes. Factual copy only renders after it is bounded to an opened record-level NASA source.

## Evidence state

| state | count | visitor treatment |
| --- | ---: | --- |
| Record-level NASA link | 42 | Openable from every dossier. |
| Fact-checked limited record | 24 | Visible facts are source bounded. |
| Expanded evidence dossier | 22 | 2–3 supported factual sentences, 3–5 supported specs, labeled story moment, and NASA link. |
| Withheld pending review | 18 | Short kid-friendly review note and NASA link; no inferred dates, locations, status, or technical figures. |

The detailed definitions and source implementation are in [`SOURCE-MAP.md`](./SOURCE-MAP.md); record-by-record claim treatment is in [`CLAIMS-AUDIT.md`](./CLAIMS-AUDIT.md).

## NASA data used

| NASA data/resource | use in the project |
| --- | --- |
| [Catalogue of Manmade Material on the Moon](https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf) | Programmatic partial Moon-inventory parse; separate line, direct-row, and bracket-quantity counts; audited lunar locations. |
| [NASA Voyager status](https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/) | Dated Voyager 1 and 2 distance snapshot and one-light-day milestone. |
| [NASA LRO Odysseus record](https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/) | Audited Odysseus position. |
| [NASA/JPL Mars 3 record](https://www.jpl.nasa.gov/news/nasa-mars-orbiter-images-may-show-1971-soviet-lander/) | Audited Mars 3 landing/transmission statement. |
| [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720) | Locally hosted Moon colour map used in the Observatory. |
| [NASA/USGS Mars map](https://mars.nasa.gov/resources/6435/global-geologic-map-of-mars/) | Locally hosted Mars colour map used in the Observatory. |
| [NASA Image and Video Library](https://images.nasa.gov/) | Locally hosted dossier media with preserved credits, image-source links, alt text, and intrinsic dimensions. |

## Run and verify

```bash
npm ci
npm run dev
# in a separate shell, while the dev server runs:
npm run test:visual
npm run test:lifecycle
npm run build
```

For a production-performance pass, run a production preview and then `npm run test:lighthouse`. The script produces three mobile Lighthouse traces, reports the LCP element, and lists every failing accessibility or SEO audit.

## 60–90 second demo shot list

1. **0–8s — Story-first hero:** introduce the independent educational project and select **Start with a story**.
2. **8–22s — Guided route:** scroll into the first chapter; show its clearly separated story moment, NASA-checked record, image treatment, and NASA evidence link.
3. **22–34s — Dossier:** open Eagle or another expanded dossier; show its opening story/fact hierarchy, credited image, technical record, and source link.
4. **34–46s — Moon inventory:** search the NASA PDF parse and explain why direct rows, line count, and bracket quantities remain separate.
5. **46–58s — Observatory:** orbit the locally textured Moon or Mars globe, clarify that it is interactive rather than real-time, and open an audited marker.
6. **58–70s — Field Guide:** show NASA records as the default, then explicitly switch to other-agency context records and show the withheld-review treatment.
7. **70–80s — Beyond:** show Voyager’s dated NASA/JPL snapshot as a snapshot, not a live extrapolation.
8. **80–90s — Trust and access:** show the source map, no-JavaScript fallback, keyboard-focusable dossier, and non-endorsement statement.

## Non-endorsement disclaimer

Silent Fleet is an independent educational project. It is not produced by, affiliated with, sponsored by, or endorsed by NASA, JPL, Caltech, the U.S. Government, or any mission partner. NASA names, images, and source material are credited for educational reference.
