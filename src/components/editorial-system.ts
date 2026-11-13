import { reducedMotion } from '../lib/utils';

interface EditionSection {
  id: string;
  number: string;
  label: string;
}

const EDITION_SECTIONS: readonly EditionSection[] = [
  { id: 'stories', number: '01', label: 'Questions' },
  { id: 'briefing', number: '02', label: 'Method' },
  { id: 'moon-inventory', number: '03', label: 'Catalogue' },
  { id: 'observatory', number: '04', label: 'Places' },
  { id: 'ledger', number: '05', label: 'Small things' },
  { id: 'timeline', number: '06', label: 'Chronology' },
  { id: 'interstellar', number: '07', label: 'Distance' },
  { id: 'fieldguide', number: '08', label: 'Object index' },
  { id: 'science', number: '09', label: 'Evidence' },
  { id: 'epilogue', number: '10', label: 'Transmission' },
];

/**
 * Adds a persistent edition index to the semantic sections. It encodes actual
 * reading order rather than acting as decorative numbering, and is removed on
 * app disposal so host remounts stay clean.
 */
export function initEditorialSystem(): () => void {
  const sections = EDITION_SECTIONS.flatMap((edition) => {
    const element = document.getElementById(edition.id);
    if (!element) return [];
    const marker = document.createElement('div');
    marker.className = 'edition-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.innerHTML = `<span>${edition.number}</span><i></i><b>${edition.label}</b>`;
    element.prepend(marker);
    return [{ element, marker }];
  });

  if (sections.length === 0 || reducedMotion || !('IntersectionObserver' in window))
    return (): void => sections.forEach(({ marker }) => marker.remove());

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!(entry.target instanceof HTMLElement)) return;
      entry.target.classList.toggle('is-edition-active', entry.isIntersecting);
    });
  }, { rootMargin: '-38% 0px -52% 0px', threshold: 0 });
  sections.forEach(({ element }) => observer.observe(element));

  return (): void => {
    observer.disconnect();
    sections.forEach(({ marker }) => marker.remove());
  };
}
