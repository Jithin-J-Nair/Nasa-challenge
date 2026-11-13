import { gsap } from 'gsap';
import { byId, isNASARecord, order } from '../data/artifacts';
import { $, $$ } from '../lib/dom';
import { onArtifactSelection, selectArtifact } from '../lib/events';
import { archiveState } from '../lib/state';
import { reducedMotion } from '../lib/utils';
import type { Artifact, CelestialBody } from '../types/archive';
import { beep } from './audio';

type TimelineFilter = 'all' | CelestialBody;

function readTimelineFilter(value: string | undefined): TimelineFilter {
  return value === 'moon' || value === 'mars' || value === 'deep' ? value : 'all';
}

/** Initialise the horizontally scrollable mission timeline and its playback controls. */
export function initTimeline(): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let timelineFilter: TimelineFilter = 'all';
  let playing = false;
  let playTween: gsap.core.Tween | null = null;
  let playbackTimer: number | null = null;
  const rail = $<HTMLElement>('#railScroll');

  const stopPlayback = (): void => {
    playing = false;
    playTween?.kill();
    playTween = null;
    if (playbackTimer !== null) window.clearTimeout(playbackTimer);
    playbackTimer = null;
    const button = $<HTMLButtonElement>('#playBtn');
    button.classList.remove('playing');
    button.setAttribute('aria-pressed', 'false');
    $('#playLabel').textContent = 'Playback';
    $<SVGSVGElement>('#playIcon').innerHTML = '<path d="M7 4l13 8-13 8z"/>';
  };

  const setCaption = (artifact: Artifact | undefined): void => {
    if (!artifact) return;
    const summary = artifact.verifiedByNASA
      ? artifact.voice.split('.')[0]?.replace(/^I /, 'This machine ').replace(/^My /, 'Its ').replace(/^We /, 'They ') || artifact.one
      : 'We’re still checking this spacecraft’s story with NASA. Open its dossier for the source link.';
    const label = artifact.verifiedByNASA ? `${artifact.y} · ${artifact.m} · ${artifact.ag}` : 'NASA source review';
    $('#tlCaption').innerHTML = `<b>${label}</b>${summary.endsWith('.') ? summary : `${summary}.`}`;
  };

  const renderTimeline = (): void => {
    const list = order
      .filter((artifact) => isNASARecord(artifact) && (timelineFilter === 'all' || artifact.b === timelineFilter))
      .sort((left, right) => Number(right.verifiedByNASA) - Number(left.verifiedByNASA) || left.y - right.y || left.n.localeCompare(right.n));
    const verified = list.filter((artifact) => artifact.verifiedByNASA);
    const withheld = list.filter((artifact) => !artifact.verifiedByNASA);
    $('#tlCount').textContent = `${verified.length} checked · ${withheld.length} in review`;

    const renderCard = (artifact: Artifact): string => {
      const summary = artifact.verifiedByNASA ? artifact.one : 'We’re still checking this spacecraft’s story with NASA.';
      const year = artifact.verifiedByNASA ? artifact.y : '—';
      const mission = artifact.verifiedByNASA ? artifact.m : 'NASA source link in dossier';
      return `
        <button class="tlcard${artifact.id === archiveState.selectedArtifactId ? ' act' : ''}" data-id="${artifact.id}">
          <span class="tick"></span><div class="y">${year}</div><h3>${artifact.n}</h3>
          <div class="sub">${mission}</div><p>${summary}</p><div class="go">Open dossier →</div>
        </button>`;
    };
    const renderGroup = (title: string, records: Artifact[]): string => {
      if (!records.length) return '';
      const decades: Record<number, Artifact[]> = {};
      records.forEach((artifact) => {
        const decade = Math.floor(artifact.y / 10) * 10;
        (decades[decade] ||= []).push(artifact);
      });
      return `<div class="timeline-verification-group"><div class="timeline-group-label">${title}</div>${Object.keys(decades)
        .map(Number).sort((left, right) => left - right)
        .map((decade) => `<div class="era"><div class="era-tag">${decade}s</div><div class="tl-items">${(decades[decade] || []).map(renderCard).join('')}</div></div>`)
        .join('')}</div>`;
    };

    $('#track').innerHTML = `${renderGroup('NASA source-audited records', verified)}${renderGroup('NASA records awaiting claim review', withheld)}`;
  };

  const runPlayback = (): void => {
    const cards = $$<HTMLButtonElement>('.tlcard');
    if (!cards.length) {
      stopPlayback();
      return;
    }
    const maximumScroll = rail.scrollWidth - rail.clientWidth;
    let index = 0;
    const next = (): void => {
      if (!playing || index >= cards.length) {
        if (playing) stopPlayback();
        return;
      }
      const card = cards[index];
      if (!card) {
        stopPlayback();
        return;
      }
      cards.forEach((item) => item.classList.remove('act'));
      card.classList.add('act');
      setCaption(byId(card.dataset.id));
      const scrollLeft = Math.min(maximumScroll, card.offsetLeft - rail.clientWidth * .32);
      playTween?.kill();
      playTween = gsap.to(rail, {
        scrollLeft,
        duration: reducedMotion ? 0 : 1.1,
        ease: 'power2.inOut',
        onComplete: () => beep(430 + index * 4, .05, .03),
      });
      index += 1;
      playbackTimer = window.setTimeout(next, reducedMotion ? 900 : 2200);
    };
    next();
  };

  const onTrackClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const card = target.closest<HTMLButtonElement>('.tlcard');
    if (!card?.dataset.id) return;
    selectArtifact(card.dataset.id, true);
    setCaption(byId(card.dataset.id));
  };
  const onTrackMouseOver = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const card = target.closest<HTMLButtonElement>('.tlcard');
    if (card?.dataset.id) setCaption(byId(card.dataset.id));
  };
  $('#track').addEventListener('click', onTrackClick, { signal });
  $('#track').addEventListener('mouseover', onTrackMouseOver, { signal });

  $$<HTMLButtonElement>('#tlChips .chip').forEach((chip) => chip.addEventListener('click', () => {
    stopPlayback();
    $$<HTMLButtonElement>('#tlChips .chip').forEach((item) => item.classList.remove('sel'));
    chip.classList.add('sel');
    timelineFilter = readTimelineFilter(chip.dataset.tl);
    renderTimeline();
  }, { signal }));

  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  rail.addEventListener('pointerdown', (event: PointerEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest('.tlcard')) return;
    dragging = true;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add('drag');
    rail.setPointerCapture(event.pointerId);
  }, { signal });
  const releaseDrag = (): void => {
    dragging = false;
    rail.classList.remove('drag');
  };
  rail.addEventListener('pointerup', releaseDrag, { signal });
  rail.addEventListener('pointercancel', releaseDrag, { signal });
  rail.addEventListener('pointermove', (event: PointerEvent) => {
    if (!dragging) return;
    rail.scrollLeft = startScroll - (event.clientX - startX);
  }, { signal });
  rail.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      rail.scrollBy({ left: 280, behavior: 'smooth' });
      event.preventDefault();
    }
    if (event.key === 'ArrowLeft') {
      rail.scrollBy({ left: -280, behavior: 'smooth' });
      event.preventDefault();
    }
  }, { signal });

  $<HTMLButtonElement>('#playBtn').addEventListener('click', () => {
    if (playing) {
      stopPlayback();
      return;
    }
    playing = true;
    const button = $<HTMLButtonElement>('#playBtn');
    button.classList.add('playing');
    button.setAttribute('aria-pressed', 'true');
    $('#playLabel').textContent = 'Pause';
    $<SVGSVGElement>('#playIcon').innerHTML = '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
    runPlayback();
  }, { signal });

  const disposeSelection = onArtifactSelection(({ id }) => {
    $$<HTMLButtonElement>('.tlcard').forEach((card) => card.classList.toggle('act', card.dataset.id === id));
  });
  renderTimeline();

  return (): void => {
    stopPlayback();
    disposeSelection();
    controller.abort();
  };
}
