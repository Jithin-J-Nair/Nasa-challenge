import { A, LEDGER, SCI, byId, isNASARecord, statusLabel } from '../data/artifacts';
import { STORY_PATH } from '../data/story-path';
import { ICO } from '../data/artwork';
import { $, $$ } from '../lib/dom';
import { selectArtifact } from '../lib/events';
import type { Artifact, ArtifactStatus, CelestialBody } from '../types/archive';
import { beep } from './audio';

type ArchiveAgency = 'nasa' | 'other';
type ArchiveSort = 'verified-first' | 'year-asc' | 'year-desc' | 'name';

interface ArchiveFilters {
  query: string;
  body: CelestialBody | 'all';
  agency: ArchiveAgency;
  status: ArtifactStatus | 'all';
  sort: ArchiveSort;
}

// The larger folios lead back to the site's six guided questions, so visual
// prominence is editorially meaningful rather than an arbitrary card pattern.
const GUIDED_FOLIO_IDS = new Set(STORY_PATH.map(({ id }) => id));

function readBodyFilter(value: string | undefined): ArchiveFilters['body'] {
  return value === 'moon' || value === 'mars' || value === 'deep' ? value : 'all';
}

function readAgencyFilter(value: string | undefined): ArchiveAgency {
  return value === 'other' ? 'other' : 'nasa';
}

function readStatusFilter(value: string | undefined): ArchiveFilters['status'] {
  return value === 'active' || value === 'silent' || value === 'lost' || value === 'destroyed' || value === 'derelict'
    ? value
    : 'all';
}

function readSort(value: string): ArchiveSort {
  return value === 'year-asc' || value === 'year-desc' || value === 'name' ? value : 'verified-first';
}

function closestArtifactButton(target: EventTarget | null, selector: string): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null;
  const button = target.closest<HTMLButtonElement>(selector);
  return button?.dataset.id ? button : null;
}

/** Initialise the searchable Field Guide, small-things ledger, and science index. */
export function initArchive(): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const filterState: ArchiveFilters = { query: '', body: 'all', agency: 'nasa', status: 'all', sort: 'verified-first' };
  const grid = $<HTMLElement>('#grid');
  const scienceList = $<HTMLElement>('#scienceList');
  const search = $<HTMLInputElement>('#search');
  const sortSelect = $<HTMLSelectElement>('#sortSel');

  const renderGrid = (): void => {
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
      list.sort((left, right) => Number(right.verifiedByNASA) - Number(left.verifiedByNASA) || left.y - right.y || left.n.localeCompare(right.n));
    } else if (filterState.sort === 'year-asc') list.sort((left, right) => left.y - right.y || left.n.localeCompare(right.n));
    else if (filterState.sort === 'year-desc') list.sort((left, right) => right.y - left.y || left.n.localeCompare(right.n));
    else list.sort((left, right) => left.n.localeCompare(right.n));

    const agencyLabel = filterState.agency === 'nasa' ? 'NASA records' : 'other-agency context records';
    $('#results').innerHTML = `Showing <b>${list.length}</b> of ${A.length} artefacts. ${agencyLabel}${
      filterState.query ? ` matching “${filterState.query.replace(/</g, '&lt;')}”.` : '.'
    }`;
    $('#empty').classList.toggle('on', list.length === 0);
    grid.style.display = list.length ? 'grid' : 'none';
    grid.innerHTML = list.map((artifact) => {
      const summary = artifact.verifiedByNASA ? artifact.one : 'We’re still checking this spacecraft’s story with NASA.';
      const verificationFlag = artifact.verifiedByNASA ? '<span class="source-state">NASA source checked</span>' : '<span class="unverified-chip">Audit pending</span>';
      const metadata = artifact.verifiedByNASA ? `${artifact.m}, ${artifact.ag}` : 'NASA source review pending';
      const year = artifact.verifiedByNASA ? artifact.y : '—';
      const state = artifact.verifiedByNASA ? `<span class="st ${artifact.st}">${statusLabel(artifact.st)}</span>` : '<span class="status-pending">Details withheld</span>';
      const collection = artifact.b === 'moon' ? 'Lunar register' : artifact.b === 'mars' ? 'Mars field notes' : 'Deep-space dispatch';
      const folioLine = artifact.verifiedByNASA ? `${collection}, ${year}` : `${collection}, detail review`;
      const prominence = GUIDED_FOLIO_IDS.has(artifact.id) ? ' acard--featured' : '';
      return `
        <button class="acard acard--${artifact.b}${prominence}" data-id="${artifact.id}">
          <div class="top" data-webgl-plane="archive-card-media">
            <img src="${artifact.image}" alt="" width="${artifact.imageWidth}" height="${artifact.imageHeight}" loading="lazy" decoding="async" aria-hidden="true" />
            <div class="glow"></div><span class="yrbadge">${year}</span>
            <span class="bodybadge ${artifact.b}">${collection}</span>
          </div>
          <div class="bd"><div class="card-kicker"><span>${folioLine}</span>${verificationFlag}</div><h3>${artifact.n}</h3><div class="ms">${metadata}</div>
            <p>${summary}</p>
            <div class="foot">${state}
            <span class="op">View record <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
          </div>
        </button>`;
    }).join('');
  };

  const renderLedger = (): void => {
    $('#ledgerGrid').innerHTML = LEDGER.map((item, index) => `
      <article class="lcard"><div class="no">${String(index + 1).padStart(2, '0')} / ${LEDGER.length}</div>
        <div class="icn">${ICO[item.ic] || ICO.plaque}</div>
        <h3>${item.t}</h3><p class="unverified-copy">Historic detail withheld pending a line-by-line NASA-source audit.</p>
      </article>`).join('');
  };

  const renderScience = (): void => {
    const checked: Artifact[] = SCI
      .map(([id]) => byId(id))
      .filter((artifact): artifact is Artifact => artifact?.verifiedByNASA === true);
    scienceList.innerHTML = checked.map((artifact) => `
      <button class="srow" data-id="${artifact.id}">
        <span class="hw">${artifact.n}<small>NASA claim audit complete</small></span>
        <span class="ds">${artifact.one}</span><span class="yr">checked</span>
      </button>`).join('');
  };

  const onGridClick = (event: MouseEvent): void => {
    const card = closestArtifactButton(event.target, '.acard');
    if (card) selectArtifact(card.dataset.id, true);
  };
  const onScienceClick = (event: MouseEvent): void => {
    const row = closestArtifactButton(event.target, '.srow');
    if (row) selectArtifact(row.dataset.id, true);
  };
  const onSearchInput = (): void => {
    filterState.query = search.value.trim();
    $('#searchBox').classList.toggle('has', Boolean(search.value));
    renderGrid();
  };
  const onClearSearch = (): void => {
    search.value = '';
    filterState.query = '';
    $('#searchBox').classList.remove('has');
    renderGrid();
    search.focus();
  };
  const onBodyFilter = (event: MouseEvent): void => {
    const chip = event.currentTarget;
    if (!(chip instanceof HTMLButtonElement)) return;
    $$<HTMLButtonElement>('.chips [data-f="body"]').forEach((item) => item.classList.remove('sel'));
    chip.classList.add('sel');
    filterState.body = readBodyFilter(chip.dataset.v);
    renderGrid();
    beep(700, .03, .03);
  };
  const onAgencyFilter = (event: MouseEvent): void => {
    const chip = event.currentTarget;
    if (!(chip instanceof HTMLButtonElement)) return;
    $$<HTMLButtonElement>('.chips [data-f="agency"]').forEach((item) => item.classList.remove('sel'));
    chip.classList.add('sel');
    filterState.agency = readAgencyFilter(chip.dataset.v);
    renderGrid();
    beep(620, .03, .03);
  };
  const onStatusFilter = (event: MouseEvent): void => {
    const chip = event.currentTarget;
    if (!(chip instanceof HTMLButtonElement)) return;
    $$<HTMLButtonElement>('.chips [data-f="status"]').forEach((item) => item.classList.remove('sel'));
    chip.classList.add('sel');
    filterState.status = readStatusFilter(chip.dataset.v);
    renderGrid();
    beep(560, .03, .03);
  };
  const onSortChange = (): void => {
    filterState.sort = readSort(sortSelect.value);
    renderGrid();
  };
  const onResetFilters = (): void => {
    filterState.query = '';
    filterState.body = 'all';
    filterState.agency = 'nasa';
    filterState.status = 'all';
    filterState.sort = 'verified-first';
    sortSelect.value = 'verified-first';
    search.value = '';
    $('#searchBox').classList.remove('has');
    $$<HTMLButtonElement>('.chips [data-f="body"]').forEach((item) => item.classList.toggle('sel', item.dataset.v === 'all'));
    $$<HTMLButtonElement>('.chips [data-f="agency"]').forEach((item) => item.classList.toggle('sel', item.dataset.v === 'nasa'));
    $$<HTMLButtonElement>('.chips [data-f="status"]').forEach((item) => item.classList.toggle('sel', item.dataset.v === 'all'));
    renderGrid();
  };

  grid.addEventListener('click', onGridClick, { signal });
  scienceList.addEventListener('click', onScienceClick, { signal });
  search.addEventListener('input', onSearchInput, { signal });
  $('#clearSearch').addEventListener('click', onClearSearch, { signal });
  $$<HTMLButtonElement>('.chips [data-f="body"]').forEach((chip) => chip.addEventListener('click', onBodyFilter, { signal }));
  $$<HTMLButtonElement>('.chips [data-f="agency"]').forEach((chip) => chip.addEventListener('click', onAgencyFilter, { signal }));
  $$<HTMLButtonElement>('.chips [data-f="status"]').forEach((chip) => chip.addEventListener('click', onStatusFilter, { signal }));
  sortSelect.addEventListener('change', onSortChange, { signal });
  $('#resetFilters').addEventListener('click', onResetFilters, { signal });

  renderLedger();
  renderGrid();
  renderScience();
  return (): void => controller.abort();
}
