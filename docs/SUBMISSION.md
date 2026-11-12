# Silent Fleet submission

## Project summary

Silent Fleet is a NASA-first interactive learning archive of hardware left on the Moon, Mars, and in deep space. It combines a locally rendered Moon/Mars observatory, a searchable Field Guide, timeline, NASA-source links, and a disclosure-first dossier system.

The correction pass deliberately separates **NASA affiliation** from **NASA verification**. A record shows narrative and technical claims only when every visible claim has been bounded to a NASA source opened during the audit. Other records remain discoverable but clearly show a claim-review notice and a mission-specific NASA reading link.

## NASA data used

| NASA data/resource | use in the project |
| --- | --- |
| [Catalogue of Manmade Material on the Moon](https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf) | Programmatic Moon-inventory parse; separate line, direct-row, and bracket-quantity counts; audited lunar record locations. |
| [NASA Voyager status](https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/) | Dated Voyager 1 and 2 distance snapshot and one-light-day milestone. |
| [NASA LRO Odysseus record](https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/) | Audited Odysseus position. |
| [NASA/JPL Mars 3 record](https://www.jpl.nasa.gov/news/nasa-mars-orbiter-images-may-show-1971-soviet-lander/) | Audited Mars 3 soft-landing and 14.5-second transmission statement. |
| [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720) | Locally hosted Moon color map. |
| [NASA/USGS Mars map](https://mars.nasa.gov/resources/6435/global-geologic-map-of-mars/) | Locally hosted Mars color map. |
| [NASA Image and Video Library](https://images.nasa.gov/) | Artefact-specific local dossier images and preserved NASA credit lines. |

The complete record-by-record claims and image audit is in [CLAIMS-AUDIT.md](./CLAIMS-AUDIT.md). Image credits are in [`public/assets/CREDITS.md`](../public/assets/CREDITS.md).

## Run and verify

```bash
npm install
npm run dev
npm run build
npm run catalogue:parse
npm run audit:claims
npm run test:visual
npm run test:lighthouse
```

`npm run test:visual` verifies the required desktop and mobile viewports, NASA-first filtering, dossier-source treatment, texture credit, no-JavaScript fallback, and browser-console errors.

## 60–90 second demo shot list

1. **0–8s — Hero:** establish the archive and the NASA-first scope.
2. **8–18s — Moon inventory:** search the parsed NASA catalogue and explain why the direct-row count—not a mass estimate—is displayed.
3. **18–33s — Observatory, Moon:** orbit the LRO/SVS texture and select an audited Apollo record.
4. **33–43s — Dossier evidence:** show the image credit, image source, NASA mission source, and claim-audit status.
5. **43–53s — Observatory, Mars:** switch to the NASA/USGS Mars map and open the Mars 3 dossier.
6. **53–66s — Field Guide:** show NASA as the default, then deliberately opt in to **Other agencies** and show the audit-pending treatment.
7. **66–78s — Voyager:** show the dated NASA/JPL snapshot and minute-only one-light-day milestone timer.
8. **78–90s — Accessibility and provenance:** show the static no-JavaScript summary and the credits/source documentation.

## Non-endorsement disclaimer

Silent Fleet is an independent educational project. It is not produced by, affiliated with, sponsored by, or endorsed by NASA, JPL, Caltech, the U.S. Government, or any mission partner. NASA names, images, and source material are credited for educational reference.
