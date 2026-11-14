import { mkdir, writeFile } from 'node:fs/promises';
import { A, verifiedArtifactCount } from '../src/data/artifacts';

const escape = (value: string | number) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
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

lines.push('', `## Opened-source evidence used for all ${verifiedArtifactCount} complete records`, '', '| artefact | opened NASA source | visible source-bounded scope |', '| --- | --- | --- |');
for (const artifact of records.filter((entry) => entry.verifiedByNASA)) {
  const sentenceCount = artifact.one.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  lines.push(`| ${escape(artifact.n)} | [NASA mission-specific source](${artifact.source}) | ${sentenceCount} supported sentence${sentenceCount === 1 ? '' : 's'}; ${artifact.spec.length} supported specification rows. |`);
}
lines.push('', '## Image audit', '', '| measure | count | method |', '| --- | ---: | --- |');
const specific = records.filter((artifact) => artifact.imageSpecific);
const missionImages = records.filter((artifact) => artifact.imageMission);
const placeholders = records.filter((artifact) => artifact.imagePlaceholder);
lines.push(`| Artefact-specific NASA images | ${specific.length} | Local image exists, the NASA Image and Video Library/mission source is recorded in the dossier and ` + '`public/assets/CREDITS.md`' + '. |');
lines.push(`| NASA mission images, labelled as non-artefact photographs | ${missionImages.length} | The image is mission-relevant but is explicitly not presented as a photograph of the hardware record. |`);
lines.push(`| Clearly labelled placeholders | ${placeholders.length} | No different spacecraft or shared body texture is shown where an artefact-specific image has not been audited. |`);
lines.push('', '### Artefact-specific image register', '', '| dossier | local file | NASA credit/source | intrinsic dimensions |', '| --- | --- | --- | --- |');
for (const artifact of specific) {
  const localPath = artifact.image.replace(/^.*\/assets\//, 'public/assets/');
  lines.push(`| ${escape(artifact.n)} | \`${escape(localPath)}\` | [${escape(artifact.imageCredit)}](${artifact.imageSource}) | ${artifact.imageWidth} × ${artifact.imageHeight} |`);
}

await mkdir('docs', { recursive: true });
await writeFile('docs/CLAIMS-AUDIT.md', `${lines.join('\n')}\n`);
console.log(`Wrote claims audit: ${verifiedArtifactCount}/${A.length} verified; ${specific.length} artefact-specific images.`);
