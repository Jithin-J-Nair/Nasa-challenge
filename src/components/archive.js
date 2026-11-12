import { A, LEDGER, SCI, byId, isNASARecord, statusLabel } from '../data/artifacts.js';
import { ICO, SCHEM } from '../data/artwork.js';
import { $, $$ } from '../lib/dom.js';
import { selectArtifact } from '../lib/events.js';
import { beep } from './audio.js';

/** Initialise the searchable Field Guide, small-things ledger, and science index. */
export function initArchive() {
  // NASA records are the default view. Contextual material from other agencies is
  // intentionally kept behind an explicit toggle.
  // A source-bounded record is useful immediately; records still being checked
  // remain available, but deliberately follow it in the default reading order.
  const filterState = { query: '', body: 'all', agency: 'nasa', status: 'all', sort: 'verified-first' };

  function renderGrid() {
    let list = A.slice();
    if (filterState.agency === 'nasa') list = list.filter(isNASARecord);
    if (filterState.agency === 'other') list = list.filter((artifact) => !isNASARecord(artifact));
    if (filterState.body !== 'all') list = list.filter((artifact) => artifact.b === filterState.body);
    if (filterState.status !== 'all') list = list.filter((artifact) => artifact.st === filterState.status);
    if (filterState.query) {
      const query = filterState.query.toLowerCase();
      list = list.filter((artifact) => (
        `${artifact.n} ${artifact.m} ${artifact.ag} ${artifact.one} ${artifact.site || ''} ${artifact.orbit || ''} ${artifact.tags} ${artifact.y}`
      ).toLowerCase().includes(query));
    }
    if (filterState.sort === 'verified-first') {
      list.sort((a, b) => Number(b.verifiedByNASA) - Number(a.verifiedByNASA) || a.y - b.y || a.n.localeCompare(b.n));
    } else if (filterState.sort === 'year-asc') list.sort((a, b) => a.y - b.y || a.n.localeCompare(b.n));
    else if (filterState.sort === 'year-desc') list.sort((a, b) => b.y - a.y || a.n.localeCompare(b.n));
    else list.sort((a, b) => a.n.localeCompare(b.n));

    const agencyLabel = filterState.agency === 'nasa' ? 'NASA records' : 'other-agency context records';
    $('#results').innerHTML = `Showing <b>${list.length}</b> of ${A.length} artefacts · ${agencyLabel}${
      filterState.query ? ` · matching “${filterState.query.replace(/</g, '&lt;')}”` : ''
    }`;
    $('#empty').classList.toggle('on', list.length === 0);
    const grid = $('#grid');
    grid.style.display = list.length ? 'grid' : 'none';
    grid.innerHTML = list.map((artifact) => {
      const summary = artifact.verifiedByNASA
        ? artifact.one
        : 'We’re still checking this spacecraft’s story with NASA.';
      const verificationFlag = artifact.verifiedByNASA ? '' : '<span class="unverified-chip">Audit pending</span>';
      const metadata = artifact.verifiedByNASA ? `${artifact.m} · ${artifact.ag}` : 'NASA source review pending';
      const year = artifact.verifiedByNASA ? artifact.y : '—';
      const state = artifact.verifiedByNASA ? `<span class="st ${artifact.st}">${statusLabel(artifact.st)}</span>` : verificationFlag;
      return `
        <button class="acard" data-id="${artifact.id}">
          <div class="top"><div class="glow"></div><span class="yrbadge">${year}</span>
            <span class="bodybadge ${artifact.b}">${artifact.b === 'moon' ? 'Moon' : artifact.b === 'mars' ? 'Mars' : 'Deep space'}</span>
            ${SCHEM[artifact.sch] || SCHEM.probe}
          </div>
          <div class="bd"><h3>${artifact.n}</h3><div class="ms">${metadata}</div>
            <p>${summary}</p>
            <div class="foot">${state}${artifact.verifiedByNASA ? verificationFlag : ''}
            <span class="op">Dossier <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
          </div>
        </button>`;
    }).join('');
    $$('.acard', grid).forEach((card) => card.addEventListener('click', () => selectArtifact(card.dataset.id, true)));
  }

  function renderLedger() {
    $('#ledgerGrid').innerHTML = LEDGER.map((item, index) => `
      <article class="lcard"><div class="no">${String(index + 1).padStart(2, '0')} / ${LEDGER.length}</div>
        <div class="icn">${ICO[item.ic] || ICO.plaque}</div>
        <h3>${item.t}</h3><p class="unverified-copy">Historic detail withheld pending a line-by-line NASA-source audit.</p>
      </article>`).join('');
  }

  function renderScience() {
    const checked = SCI.map((entry) => byId(entry[0])).filter((artifact) => artifact?.verifiedByNASA);
    $('#scienceList').innerHTML = checked.map((artifact) => `
      <button class="srow" data-id="${artifact.id}">
        <span class="hw">${artifact.n}<small>NASA claim audit complete</small></span>
        <span class="ds">${artifact.one}</span><span class="yr">checked</span>
      </button>`).join('');
    $$('.srow').forEach((row) => row.addEventListener('click', () => selectArtifact(row.dataset.id, true)));
  }

  $('#search').addEventListener('input', (event) => {
    filterState.query = event.target.value.trim();
    $('#searchBox').classList.toggle('has', Boolean(event.target.value));
    renderGrid();
  });
  $('#clearSearch').addEventListener('click', () => {
    $('#search').value = '';
    filterState.query = '';
    $('#searchBox').classList.remove('has');
    renderGrid();
    $('#search').focus();
  });
  $$('.chips [data-f="body"]').forEach((chip) => chip.addEventListener('click', () => {
    $$('.chips [data-f="body"]').forEach((item) => item.classList.remove('sel'));
    chip.classList.add('sel');
    filterState.body = chip.dataset.v;
    renderGrid();
    beep(700, .03, .03);
  }));
  $$('.chips [data-f="agency"]').forEach((chip) => chip.addEventListener('click', () => {
    $$('.chips [data-f="agency"]').forEach((item) => item.classList.remove('sel'));
    chip.classList.add('sel');
    filterState.agency = chip.dataset.v;
    renderGrid();
    beep(620, .03, .03);
  }));
  $$('.chips [data-f="status"]').forEach((chip) => chip.addEventListener('click', () => {
    $$('.chips [data-f="status"]').forEach((item) => item.classList.remove('sel'));
    chip.classList.add('sel');
    filterState.status = chip.dataset.v;
    renderGrid();
    beep(560, .03, .03);
  }));
  $('#sortSel').addEventListener('change', (event) => {
    filterState.sort = event.target.value;
    renderGrid();
  });
  $('#resetFilters').addEventListener('click', () => {
    filterState.query = '';
    filterState.body = 'all';
    filterState.agency = 'nasa';
    filterState.status = 'all';
    filterState.sort = 'verified-first';
    $('#sortSel').value = 'verified-first';
    $('#search').value = '';
    $('#searchBox').classList.remove('has');
    $$('.chips [data-f="body"]').forEach((item) => item.classList.toggle('sel', item.dataset.v === 'all'));
    $$('.chips [data-f="agency"]').forEach((item) => item.classList.toggle('sel', item.dataset.v === 'nasa'));
    $$('.chips [data-f="status"]').forEach((item) => item.classList.toggle('sel', item.dataset.v === 'all'));
    renderGrid();
  });

  renderLedger();
  renderGrid();
  renderScience();
}
