import {
  MOON_CATALOGUE_ROWS,
  MOON_CATALOGUE_STATS,
} from '../src/data/moon-catalogue.generated';

const failures: string[] = [];
const ranger9 = MOON_CATALOGUE_ROWS.find((row) => row.object === 'Ranger 9');

if (!ranger9) failures.push('Ranger 9 is missing from the parsed NASA catalogue.');
else {
  if (ranger9.location !== '112.828° N, -2.387° E')
    failures.push('Ranger 9 source location text was changed instead of being preserved.');
  if (ranger9.coordinateStatus !== 'invalid')
    failures.push('Ranger 9 must be marked invalid because its supplied latitude is outside physical bounds.');
  if (ranger9.coordinates)
    failures.push('Ranger 9 must not expose a replacement coordinate for plotting.');
  if (!ranger9.coordinateIssue?.includes('outside −90° to 90°'))
    failures.push('Ranger 9 must explain why its plotting coordinate is withheld.');
}

for (const row of MOON_CATALOGUE_ROWS) {
  if (!row.coordinates) continue;
  const { latitude, longitude } = row.coordinates;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
    failures.push(`${row.object}: generated plotting coordinates exceed latitude/longitude bounds.`);
}

const observedInvalid = MOON_CATALOGUE_ROWS.filter(
  (row) => row.coordinateStatus === 'invalid',
).length;
if (observedInvalid !== MOON_CATALOGUE_STATS.invalidCoordinateCount)
  failures.push('Generated invalid-coordinate count does not match catalogue stats.');
if (MOON_CATALOGUE_STATS.invalidCoordinateCount < 1)
  failures.push('The coordinate guard regression is not represented in catalogue stats.');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Moon catalogue integrity passed: ${MOON_CATALOGUE_STATS.validCoordinateCount} bounded coordinate pairs; ${MOON_CATALOGUE_STATS.invalidCoordinateCount} invalid source pair withheld without correction.`,
);
