import { $ } from '../lib/dom.js';

/**
 * Static snapshot from NASA's Voyager status page. Values are deliberately not
 * extrapolated: the page is a mission-status reference, not an ephemeris API.
 * Source: https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/
 */
export const voyagerStatus = Object.freeze({
  asOf: '2026-11-12',
  sourceUrl: 'https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/',
  voyager1: {
    distanceKm: 25_888_453_464,
    distanceAu: 173.05362265,
    oneWayLightTime: '23 h 59 min',
  },
  voyager2: {
    distanceKm: 21_666_760_534,
    distanceAu: 144.83334845,
    oneWayLightTime: '20 h 04 min',
  },
  oneLightDay: {
    dateLabel: 'Wednesday, Nov. 18, 2026, 2:16:07 a.m. PST',
    timestamp: Date.parse('2026-11-18T02:16:07-08:00'),
    distanceKm: 25_902_000_000,
  },
});

const shortDate = new Intl.DateTimeFormat('en-US', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
});

function approximateDistance(kilometers) {
  return `≈${(kilometers / 1_000_000_000).toFixed(2)} billion`;
}

/** Render dated NASA status data and a minute-resolution milestone timer. */
export function liveNumbers() {
  const asOf = shortDate.format(new Date(`${voyagerStatus.asOf}T00:00:00Z`));
  const { voyager1, voyager2, oneLightDay } = voyagerStatus;
  const setText = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value;
  };

  setText('#v1km', approximateDistance(voyager1.distanceKm));
  setText('#v2km', approximateDistance(voyager2.distanceKm));
  setText('#v1au', `≈${voyager1.distanceAu.toFixed(1)}`);
  setText('#v2au', `≈${voyager2.distanceAu.toFixed(1)}`);
  setText('#rtt', '≈47 h 58 min');
  setText('#heroV1', `≈${voyager1.distanceAu.toFixed(1)}`);
  setText('#voyagerAsOf', `NASA/JPL status · as of ${asOf}`);

  const remaining = oneLightDay.timestamp - Date.now();
  if (remaining > 0) {
    const days = Math.floor(remaining / 86_400_000);
    const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    setText('#cdD', String(days).padStart(2, '0'));
    setText('#cdH', String(hours).padStart(2, '0'));
    setText('#cdM', String(minutes).padStart(2, '0'));
  } else {
    setText('#cdD', '00');
    setText('#cdH', '00');
    setText('#cdM', '00');
    const label = $('.countdown .lbl');
    if (label) label.innerHTML = '<i></i>Milestone reached · Voyager 1 is more than one light-day from Earth';
  }

  const clock = $('#clock');
  if (clock) clock.textContent = new Date().toISOString().slice(11, 19);
}

/** Build the scrolling bar from dated, rounded status values only. */
export function buildTicker() {
  const items = [
    '<b>DSN</b> · TRACKING VOYAGER 1 · <i>SIGNAL NOMINAL</i>',
    `<b>VOYAGER 1</b> · <span>${approximateDistance(voyagerStatus.voyager1.distanceKm).toUpperCase()} KM</span> · <u>≈${voyagerStatus.voyager1.distanceAu.toFixed(1)} AU</u>`,
    `<b>VOYAGER 2</b> · <span>${approximateDistance(voyagerStatus.voyager2.distanceKm).toUpperCase()} KM</span> · <u>≈${voyagerStatus.voyager2.distanceAu.toFixed(1)} AU</u>`,
    '<b>NASA STATUS</b> · VALUES ARE SNAPSHOTS, NOT EXTRAPOLATED LIVE TRAJECTORIES',
    '<b>MILESTONE</b> · VOYAGER 1 REACHES ONE LIGHT-DAY · <u>18 NOV 2026 · 2:16 AM PST</u>',
    '<b>APOLLO RETROREFLECTORS</b> · <i>RETURNING PHOTONS</i>',
  ];
  $('#telwrap').innerHTML = items.concat(items).map((item) => `<span>${item}</span>`).join('');
}

export function buildHelio() {
  const svg = $('#helioSvg');
  const centerX = 210;
  const centerY = 200;
  const maxRadius = 190;
  const logarithmicRadius = (au) => Math.max(0, (Math.log10(Math.max(au, .35)) / Math.log10(180)) * maxRadius);
  let output = '';
  output += '<defs><radialGradient id="sunG"><stop offset="0" stop-color="#fff3d0"/><stop offset=".4" stop-color="#ff9d3d"/><stop offset="1" stop-color="#ff9d3d" stop-opacity="0"/></radialGradient><radialGradient id="hG"><stop offset="0" stop-color="#1b2a44" stop-opacity=".75"/><stop offset=".72" stop-color="#12203a" stop-opacity=".28"/><stop offset="1" stop-color="#0a1224" stop-opacity="0"/></radialGradient></defs>';
  output += `<circle cx="${centerX}" cy="${centerY}" r="${maxRadius}" fill="url(#hG)"/>`;
  output += `<circle cx="${centerX}" cy="${centerY}" r="${logarithmicRadius(123)}" fill="none" stroke="#5fe1ff" stroke-opacity=".3" stroke-width="1" stroke-dasharray="4 4"/>`;
  output += `<text x="${centerX + logarithmicRadius(123) - 4}" y="${centerY - 8}" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="7" fill="#5fe1ff" fill-opacity=".75">HELIOPAUSE ~123 AU</text>`;
  const planets = [['Mercury', .39], ['Venus', .72], ['Earth', 1], ['Mars', 1.52], ['Jupiter', 5.2], ['Saturn', 9.5], ['Uranus', 19.2], ['Neptune', 30.1]];
  planets.forEach(([name, au]) => {
    const radius = logarithmicRadius(au);
    output += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="rgba(236,231,222,.11)" stroke-width=".8"/>`;
    output += `<circle cx="${centerX + radius * Math.cos(-.5)}" cy="${centerY + radius * Math.sin(-.5)}" r="${au > 4 ? 2.4 : 1.5}" fill="rgba(236,231,222,.5)"/>`;
    output += `<text x="${centerX + radius + 3}" y="${centerY - 2}" font-family="IBM Plex Mono,monospace" font-size="6" fill="#4d5566">${name.toUpperCase()}</text>`;
  });
  output += `<circle cx="${centerX}" cy="${centerY}" r="14" fill="url(#sunG)"/><circle cx="${centerX}" cy="${centerY}" r="4.5" fill="#fff3d0"/>`;
  [
    { name: 'VOYAGER 1', au: voyagerStatus.voyager1.distanceAu, angle: -40, color: '#ff9d3d' },
    { name: 'VOYAGER 2', au: voyagerStatus.voyager2.distanceAu, angle: -145, color: '#5fe1ff' },
    { name: 'PIONEER 10', au: 140, angle: 75, color: '#e2553b' },
    { name: 'PIONEER 11', au: 112, angle: -20, color: '#a48bff' },
  ].forEach((probe) => {
    const radians = probe.angle * Math.PI / 180;
    const radius = logarithmicRadius(probe.au);
    const x = centerX + Math.cos(radians) * radius;
    const y = centerY + Math.sin(radians) * radius;
    output += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="${probe.color}" stroke-opacity=".22" stroke-width="1" stroke-dasharray="2 4"/>`;
    output += `<circle cx="${x}" cy="${y}" r="3.6" fill="${probe.color}"/><circle cx="${x}" cy="${y}" r="8" fill="none" stroke="${probe.color}" stroke-opacity=".35"><animate attributeName="r" values="4;12;4" dur="3.4s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".5;0;.5" dur="3.4s" repeatCount="indefinite"/></circle>`;
    const labelX = x + (Math.cos(radians) > 0 ? 12 : -12);
    const anchor = Math.cos(radians) > 0 ? 'start' : 'end';
    const distance = probe.name.startsWith('VOYAGER') ? `≈${probe.au.toFixed(1)} AU` : `${probe.au} AU`;
    output += `<text x="${labelX}" y="${y + 3}" text-anchor="${anchor}" font-family="IBM Plex Mono,monospace" font-size="7.4" fill="${probe.color}">${probe.name}</text>`;
    output += `<text x="${labelX}" y="${y + 12}" text-anchor="${anchor}" font-family="IBM Plex Mono,monospace" font-size="6.4" fill="#5f6779">${distance}</text>`;
  });
  output += '<text x="10" y="372" font-family="IBM Plex Mono,monospace" font-size="6.6" fill="#3f4757">LOGARITHMIC SCALE · VOYAGER VALUES AS OF 12 NOV 2026 · NASA/JPL</text>';
  svg.innerHTML = output;
}

export function buildRecord() {
  const svg = $('#recordSvg');
  let output = '<defs><radialGradient id="rgold"><stop offset="0" stop-color="#4a3a22"/><stop offset=".55" stop-color="#b98a3e"/><stop offset=".92" stop-color="#f0c476"/><stop offset="1" stop-color="#8a6528"/></radialGradient></defs>';
  output += '<circle cx="160" cy="160" r="150" fill="#0a0d16" stroke="rgba(236,231,222,.14)"/><g class="spin"><circle cx="160" cy="160" r="132" fill="url(#rgold)" opacity=".92"/>';
  for (let index = 0; index < 70; index += 1) { const radius = 26 + index * 1.5; output += `<circle cx="160" cy="160" r="${radius}" fill="none" stroke="rgba(30,20,8,.28)" stroke-width=".7"/>`; }
  output += '<circle cx="160" cy="160" r="24" fill="#1a1509" stroke="rgba(240,196,118,.5)"/><circle cx="160" cy="160" r="6" fill="#0a0d16"/><g stroke="#0f0b04" stroke-width="1" opacity=".72" fill="#0f0b04">';
  for (let index = 0; index < 14; index += 1) {
    const angle = (-90 + index * (360 / 14)) * Math.PI / 180;
    const length = 40 + ((index * 37) % 46);
    output += `<line x1="160" y1="160" x2="${(160 + Math.cos(angle) * length).toFixed(1)}" y2="${(160 + Math.sin(angle) * length).toFixed(1)}"/><circle cx="${(160 + Math.cos(angle) * (length + 4)).toFixed(1)}" cy="${(160 + Math.sin(angle) * (length + 4)).toFixed(1)}" r="2.6" stroke="none"/>`;
  }
  output += '</g><circle cx="160" cy="248" r="11" fill="none" stroke="#0f0b04" stroke-width="1.4" opacity=".7"/><line x1="152" y1="256" x2="168" y2="240" stroke="#0f0b04" stroke-width="1.4" opacity=".7"/></g><text x="160" y="304" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8.5" letter-spacing="3" fill="#8a90a2">GOLDEN RECORD · 1977 · BOTH VOYAGERS</text>';
  svg.innerHTML = output;
}

// The clock can update every second; mission distances remain the dated snapshot above.
setInterval(liveNumbers, 1_000);
