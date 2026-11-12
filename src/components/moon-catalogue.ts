import { MOON_CATALOGUE_ROWS, MOON_CATALOGUE_SOURCE, MOON_CATALOGUE_STATS } from '../data/moon-catalogue.generated';
import { $ } from '../lib/dom';

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character] || character));
}

/** Render the parsed NASA Moon catalogue once; filtering never changes its method count. */
export function initMoonCatalogue(): void {
  const root = $<HTMLElement>('#moonCatalogue');
  const directRows = MOON_CATALOGUE_ROWS.filter((row) => !row.seeBelow && !row.subItem);
  const renderRows = (query = ''): void => {
    const normalized = query.toLocaleLowerCase();
    const matches = directRows.filter((row) => `${row.object} ${row.location} ${row.section}`.toLocaleLowerCase().includes(normalized));
    $('#moonCatalogueResult').textContent = `${matches.length} of ${directRows.length} direct rows parsed so far`;
    $('#moonCatalogueRows').innerHTML = matches.map((row) => `<li><b>${escapeHtml(row.object)}</b><span>${escapeHtml(row.location || 'Location not supplied in catalogue')}</span><small>${escapeHtml(row.section)}</small></li>`).join('')
      || '<li class="moon-catalogue-empty">No parsed catalogue rows match that search.</li>';
  };

  root.innerHTML = `
    <div class="catalogue-method" data-reveal>
      <div><b>${MOON_CATALOGUE_STATS.lineCount}</b><span>material table lines parsed</span></div>
      <div><b>${MOON_CATALOGUE_STATS.directObjectCount}</b><span>direct rows parsed from the NASA catalogue so far</span></div>
      <div><b>${MOON_CATALOGUE_STATS.bracketQuantitySum}</b><span>explicit bracket quantities summed — not a total object count</span></div>
    </div>
    <div class="moon-catalogue-search" data-reveal>
      <label for="moonCatalogueSearch">Search the parsed catalogue</label>
      <input id="moonCatalogueSearch" type="search" placeholder="Object, programme, location…" autocomplete="off" />
      <span id="moonCatalogueResult"></span>
    </div>
    <details class="catalogue-list" open data-reveal>
      <summary>Browse ${MOON_CATALOGUE_STATS.directObjectCount} direct rows parsed from the NASA catalogue so far</summary>
      <ol id="moonCatalogueRows"></ol>
      <p class="mono">Partial-parse status · ${MOON_CATALOGUE_STATS.directObjectCount} direct object/location rows parsed from the NASA catalogue so far. References such as “see below” and indented sub-items are not counted; the list preserves supplied locations and never adds coordinates. <a href="${MOON_CATALOGUE_SOURCE}" target="_blank" rel="noreferrer">Open NASA PDF ↗</a></p>
    </details>`;
  const search = $<HTMLInputElement>('#moonCatalogueSearch');
  search.addEventListener('input', () => renderRows(search.value.trim()));
  renderRows();

  const observatoryStat = document.querySelector<HTMLElement>('#moonCatalogueStat');
  if (observatoryStat) observatoryStat.textContent = `${MOON_CATALOGUE_STATS.directObjectCount} NASA catalogue rows so far`;
  const heroStat = document.querySelector<HTMLElement>('#moonInventoryCount');
  if (heroStat) heroStat.textContent = String(MOON_CATALOGUE_STATS.directObjectCount);
  const heroNote = document.querySelector<HTMLElement>('#moonInventoryNote');
  if (heroNote) heroNote.textContent = 'rows parsed from NASA catalogue so far';
}
