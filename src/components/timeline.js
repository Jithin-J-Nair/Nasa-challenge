import { gsap } from 'gsap';
import { byId, isNASARecord, order } from '../data/artifacts.js';
import { $, $$ } from '../lib/dom.js';
import { onArtifactSelection, selectArtifact } from '../lib/events.js';
import { archiveState } from '../lib/state.js';
import { reducedMotion } from '../lib/utils.js';
import { beep } from './audio.js';

/** Initialise the horizontally scrollable mission timeline and its playback controls. */
export function initTimeline() {
  let timelineFilter = 'all';
  let playing = false;
  let playTween = null;

  function setCaption(artifact) {
    if (!artifact) return;
    const summary = artifact.verifiedByNASA
      ? artifact.voice.split('.')[0]
        .replace(/^I /, 'This machine ')
        .replace(/^My /, 'Its ')
        .replace(/^We /, 'They ')
      : 'Unverified contextual record. Narrative withheld pending NASA-source verification.';
    const label = artifact.verifiedByNASA ? `${artifact.y} · ${artifact.m} · ${artifact.ag}` : 'NASA claim review pending';
    $('#tlCaption').innerHTML = `<b>${label}</b>${summary.endsWith('.') ? summary : `${summary}.`}`;
  }

  function renderTimeline() {
    // Keep contextual non-NASA records behind the explicit Field Guide agency toggle.
    const list = order.filter((artifact) => isNASARecord(artifact) && (timelineFilter === 'all' || artifact.b === timelineFilter));
    $('#tlCount').textContent = `${list.length} events`;
    const decades = {};
    list.forEach((artifact) => {
      const decade = Math.floor(artifact.y / 10) * 10;
      (decades[decade] ||= []).push(artifact);
    });

    const track = $('#track');
    track.innerHTML = Object.keys(decades)
      .map(Number)
      .sort((a, b) => a - b)
      .map((decade) => `
        <div class="era"><div class="era-tag">${decade}s</div><div class="tl-items">
          ${decades[decade].map((artifact) => {
            const summary = artifact.verifiedByNASA
              ? artifact.one
              : 'Claims withheld pending an artefact-by-artefact NASA source audit.';
            const year = artifact.verifiedByNASA ? artifact.y : '—';
            const mission = artifact.verifiedByNASA ? artifact.m : 'NASA source review pending';
            return `
              <button class="tlcard${artifact.id === archiveState.selectedArtifactId ? ' act' : ''}" data-id="${artifact.id}">
                <span class="tick"></span><div class="y">${year}</div><h4>${artifact.n}</h4>
                <div class="sub">${mission}</div><p>${summary}</p><div class="go">Open dossier →</div>
              </button>`;
          }).join('')}
        </div></div>`).join('');

    $$('.tlcard').forEach((card) => {
      card.addEventListener('click', () => {
        selectArtifact(card.dataset.id, true);
        setCaption(byId(card.dataset.id));
      });
      card.addEventListener('mouseenter', () => setCaption(byId(card.dataset.id)));
    });
  }

  function runPlayback() {
    const rail = $('#railScroll');
    const cards = $$('.tlcard');
    if (!cards.length) return;
    const maximumScroll = rail.scrollWidth - rail.clientWidth;
    let index = 0;
    const next = () => {
      if (!playing || index >= cards.length) {
        if (playing) {
          playing = false;
          $('#playBtn').classList.remove('playing');
          $('#playLabel').textContent = 'Playback';
          $('#playIcon').innerHTML = '<path d="M7 4l13 8-13 8z"/>';
        }
        return;
      }
      const card = cards[index];
      cards.forEach((item) => item.classList.remove('act'));
      card.classList.add('act');
      setCaption(byId(card.dataset.id));
      const scrollLeft = Math.min(maximumScroll, card.offsetLeft - rail.clientWidth * .32);
      if (typeof gsap !== 'undefined') {
        playTween = gsap.to(rail, {
          scrollLeft,
          duration: 1.1,
          ease: 'power2.inOut',
          onComplete: () => beep(430 + index * 4, .05, .03),
        });
      } else {
        rail.scrollTo({ left: scrollLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
        beep(430 + index * 4, .05, .03);
      }
      index += 1;
      setTimeout(next, reducedMotion ? 900 : 2200);
    };
    next();
  }

  $$('#tlChips .chip').forEach((chip) => chip.addEventListener('click', () => {
    $$('#tlChips .chip').forEach((item) => item.classList.remove('sel'));
    chip.classList.add('sel');
    timelineFilter = chip.dataset.tl;
    renderTimeline();
  }));

  const rail = $('#railScroll');
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  rail.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.tlcard')) return;
    dragging = true;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add('drag');
  });
  addEventListener('pointerup', () => {
    dragging = false;
    rail.classList.remove('drag');
  });
  rail.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    rail.scrollLeft = startScroll - (event.clientX - startX);
  });
  rail.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      rail.scrollBy({ left: 280, behavior: 'smooth' });
      event.preventDefault();
    }
    if (event.key === 'ArrowLeft') {
      rail.scrollBy({ left: -280, behavior: 'smooth' });
      event.preventDefault();
    }
  });

  $('#playBtn').addEventListener('click', () => {
    playing = !playing;
    const button = $('#playBtn');
    button.classList.toggle('playing', playing);
    button.setAttribute('aria-pressed', playing);
    $('#playLabel').textContent = playing ? 'Pause' : 'Playback';
    $('#playIcon').innerHTML = playing
      ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'
      : '<path d="M7 4l13 8-13 8z"/>';
    if (playing) runPlayback();
    else if (playTween) playTween.kill();
  });

  onArtifactSelection(({ id }) => {
    $$('.tlcard').forEach((card) => card.classList.toggle('act', card.dataset.id === id));
  });

  renderTimeline();
}
