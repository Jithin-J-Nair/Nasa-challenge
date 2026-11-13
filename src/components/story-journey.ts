import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { byId } from '../data/artifacts';
import { STORY_PATH, type StoryChapter } from '../data/story-path';
import { selectArtifact } from '../lib/events';
import { reducedMotion } from '../lib/utils';

gsap.registerPlugin(ScrollTrigger);

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}

function mediaLabel(chapter: StoryChapter): string {
  const artifact = byId(chapter.id);
  if (!artifact) return 'NASA source image';
  if (artifact.imageSpecific) return 'NASA artefact-specific image';
  if (artifact.imageMission) return 'NASA mission image · context, not object photo';
  return 'NASA image placeholder · record remains source-audited';
}

function renderRoute(chapters: readonly StoryChapter[]): string {
  return chapters
    .map(
      (chapter) => `
        <li>
          <a href="#story-${chapter.id}" data-story-route="${chapter.id}">
            <span>${String(chapter.order).padStart(2, '0')}</span>
            <b>${escapeHtml(chapter.question)}</b>
          </a>
        </li>`,
    )
    .join('');
}

function setActiveRoute(root: HTMLElement, id: string): void {
  root.querySelectorAll<HTMLAnchorElement>('[data-story-route]').forEach((link) => {
    const active = link.dataset.storyRoute === id;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
}

function renderChapter(chapter: StoryChapter): string {
  const artifact = byId(chapter.id);
  if (!artifact || !artifact.verifiedByNASA) return '';
  const imageSource = artifact.imageSource
    ? `<a class="story-source-link" href="${artifact.imageSource}" target="_blank" rel="noreferrer">Image source <span aria-hidden="true">↗</span></a>`
    : '';

  return `
    <article class="story-chapter story-chapter--${chapter.body}" id="story-${artifact.id}" data-story-chapter data-id="${artifact.id}" tabindex="-1">
      <span class="story-watermark" aria-hidden="true">${String(chapter.order).padStart(2, '0')}</span>
      <div class="story-index" aria-hidden="true"><span>${String(chapter.order).padStart(2, '0')}</span><i></i></div>
      <div class="story-copy">
        <p class="story-eyebrow">${escapeHtml(chapter.eyebrow)}</p>
        <p class="story-legacy">${escapeHtml(chapter.legacy)}</p>
        <h3>${escapeHtml(chapter.question)}</h3>
        <p class="story-invitation">${escapeHtml(chapter.invitation)}</p>
        <div class="story-story">
          <span>Story moment · interpretation</span>
          <p>${escapeHtml(artifact.story)}</p>
        </div>
        <div class="story-evidence">
          <span>NASA-checked record</span>
          <p>${escapeHtml(artifact.one)}</p>
          <a href="${artifact.source}" target="_blank" rel="noreferrer">Open NASA evidence <span aria-hidden="true">↗</span></a>
        </div>
        <button class="story-open" data-story-open="${artifact.id}">
          <span>Open ${escapeHtml(artifact.n)}’s dossier</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      <figure class="story-media">
        <div class="story-media-frame" data-webgl-plane="story-media">
          <img src="${artifact.image}" alt="${escapeHtml(artifact.imageAlt)}" width="${artifact.imageWidth}" height="${artifact.imageHeight}" loading="lazy" decoding="async" />
          <span class="story-orbit story-orbit--one" aria-hidden="true"></span>
          <span class="story-orbit story-orbit--two" aria-hidden="true"></span>
          <span class="story-crosshair" aria-hidden="true"></span>
        </div>
        <figcaption>
          <span>${mediaLabel(chapter)}</span>
          <b>${escapeHtml(artifact.imageCredit)}</b>
          ${imageSource}
        </figcaption>
      </figure>
    </article>`;
}

/**
 * Renders a short, source-audited editorial route. The full archive remains
 * available elsewhere; this layer gives first-time visitors a clear beginning.
 */
export function initStoryJourney(): () => void {
  const root = document.querySelector<HTMLElement>('#storyRail');
  const route = document.querySelector<HTMLOListElement>('#storyRoute');
  const current = document.querySelector<HTMLElement>('#storyCurrent');
  const total = document.querySelector<HTMLElement>('#storyTotal');
  if (!root || !route || !current || !total) return () => undefined;

  const chapters = STORY_PATH.filter((chapter) => byId(chapter.id)?.verifiedByNASA);
  root.innerHTML = chapters.map(renderChapter).join('');
  route.innerHTML = renderRoute(chapters);
  total.textContent = String(chapters.length).padStart(2, '0');
  current.textContent = '01';
  if (chapters[0]) setActiveRoute(route, chapters[0].id);

  const controller = new AbortController();
  const { signal } = controller;
  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-story-open]');
    if (!button) return;
    selectArtifact(button.dataset.storyOpen, false);
  };
  root.addEventListener('click', onClick, { signal });

  if (reducedMotion || chapters.length === 0) {
    root.querySelector<HTMLElement>('[data-story-chapter]')?.classList.add('is-active');
    return (): void => controller.abort();
  }

  const context = gsap.context(() => {
    const cards = gsap.utils.toArray<HTMLElement>('[data-story-chapter]', root);
    cards.forEach((card, index) => {
      const copy = card.querySelector<HTMLElement>('.story-copy');
      const media = card.querySelector<HTMLElement>('.story-media');
      const indexMark = card.querySelector<HTMLElement>('.story-index');
      const watermark = card.querySelector<HTMLElement>('.story-watermark');
      const image = card.querySelector<HTMLImageElement>('.story-media img');
      if (!copy || !media || !indexMark) return;

      gsap.set([copy, media, indexMark], { willChange: 'transform,opacity' });
      gsap.fromTo(
        copy,
        { autoAlpha: 0, y: 34 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 74%', once: true },
        },
      );
      gsap.fromTo(
        media,
        { autoAlpha: 0, y: 52, rotate: index % 2 === 0 ? 1.2 : -1.2 },
        {
          autoAlpha: 1,
          y: 0,
          rotate: 0,
          duration: 1.1,
          ease: 'power4.out',
          scrollTrigger: { trigger: card, start: 'top 74%', once: true },
        },
      );
      gsap.fromTo(
        indexMark,
        { scaleY: 0, transformOrigin: 'top center' },
        {
          scaleY: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 74%', once: true },
        },
      );

      if (watermark)
        gsap.fromTo(
          watermark,
          { xPercent: index % 2 === 0 ? 8 : -8, autoAlpha: .15 },
          {
            xPercent: index % 2 === 0 ? -8 : 8,
            autoAlpha: .75,
            ease: 'none',
            scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: .7 },
          },
        );
      if (image)
        gsap.fromTo(
          image,
          { scale: 1.08, yPercent: -3 },
          {
            scale: 1.01,
            yPercent: 3,
            ease: 'none',
            scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: .8 },
          },
        );

      ScrollTrigger.create({
        trigger: card,
        start: 'top 56%',
        end: 'bottom 56%',
        onToggle: ({ isActive }): void => {
          if (!isActive) return;
          cards.forEach((candidate) => candidate.classList.remove('is-active'));
          card.classList.add('is-active');
          current.textContent = String(index + 1).padStart(2, '0');
          setActiveRoute(route, chapters[index]?.id || '');
        },
      });
    });
  }, root);

  return (): void => {
    controller.abort();
    context.revert();
  };
}
