import { mkdir, writeFile } from 'node:fs/promises';
import { A, verifiedArtifactCount } from '../src/data/artifacts.js';

const escape = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const records = A.slice().sort((left, right) => left.n.localeCompare(right.n));
const lines = [
  '# Claims audit',
  '',
  `**Final state:** ${verifiedArtifactCount} of ${A.length} records are fully verified for the deliberately limited copy now visible in the site. The remaining ${A.length - verifiedArtifactCount} records display a claim-audit notice instead of narrative, dates, status, coordinates, or technical figures.`,
  '',
  'A NASA affiliation is not treated as verification. A record is marked complete only when every visible claim is bounded to a NASA page opened during the correction pass. This register preserves the prior summary and specification rows so that withheld copy is reviewable without being shown to site visitors as fact.',
  '',
  '| artefact | raw summary claim | raw specification claims | mission-specific NASA source | visible state |',
  '| --- | --- | --- | --- | --- |',
];

for (const artifact of records) {
  const raw = artifact.claimsAudit;
  const specs = raw.specificationRows.length ? raw.specificationRows.join('; ') : '—';
  const source = `[NASA source](${artifact.source})`;
  const state = artifact.verifiedByNASA
    ? 'raw copy withheld; reduced visible claim is source-bounded below'
    : 'withheld — source not opened/confirmed for every raw claim';
  lines.push(`| ${escape(artifact.n)} | ${escape(raw.summary)} | ${escape(specs)} | ${source} | ${state} |`);
}

lines.push('', '## Opened-source evidence used for the nine complete records', '', '| artefact(s) | opened NASA source | retained claim scope |', '| --- | --- | --- |');
lines.push(`| Surveyor 3; Eagle; Intrepid; Antares; Apollo 13 S-IVB | [Catalogue of Manmade Material on the Moon](${A.find((artifact) => artifact.id === 'eagle').source}) | Only the catalogue location/object statements shown in their dossiers. |`);
lines.push(`| Mars 3 lander | [NASA Mars Orbiter Images May Show 1971 Soviet Lander](${A.find((artifact) => artifact.id === 'mars3').source}) | Soft landing and 14.5-second transmission only. |`);
lines.push(`| Odysseus | [NASA’s LRO Images Intuitive Machines’ Odysseus Lander](${A.find((artifact) => artifact.id === 'odysseus').source}) | NASA LRO-reported 80.13° S, 1.44° E location only. |`);
lines.push(`| Voyager 1; Voyager 2 | [Where Are Voyager 1 and 2 Now?](${A.find((artifact) => artifact.id === 'voyager1').source}) | Dated 12 Nov 2026 status-table distances only. |`);
lines.push('', '## Image audit', '', '| measure | count | method |', '| --- | ---: | --- |');
const specific = records.filter((artifact) => artifact.imageSpecific);
const missionImages = records.filter((artifact) => artifact.imageMission);
const placeholders = records.filter((artifact) => artifact.imagePlaceholder);
lines.push(`| Artefact-specific NASA images | ${specific.length} | Local image exists, the NASA Image and Video Library/mission source is recorded in the dossier and ` + '`public/assets/CREDITS.md`' + '. |');
lines.push(`| NASA mission images, labelled as non-artefact photographs | ${missionImages.length} | The image is mission-relevant but is explicitly not presented as a photograph of the hardware record. |`);
lines.push(`| Clearly labelled placeholders | ${placeholders.length} | No different spacecraft or shared body texture is shown where an artefact-specific image has not been audited. |`);

await mkdir('docs', { recursive: true });
await writeFile('docs/CLAIMS-AUDIT.md', `${lines.join('\n')}\n`);
console.log(`Wrote claims audit: ${verifiedArtifactCount}/${A.length} verified; ${specific.length} artefact-specific images.`);
