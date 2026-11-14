import type { CelestialBody } from '../types/archive';

/**
 * The editorial path is deliberately smaller than the full archive. Each chapter
 * points to an existing NASA-audited dossier; no factual copy lives here.
 */
export interface StoryChapter {
  id: string;
  order: number;
  body: CelestialBody;
  eyebrow: string;
  question: string;
  invitation: string;
  legacy: 'left behind' | 'silent machine' | 'living legacy' | 'far traveller';
}

export const STORY_PATH: readonly StoryChapter[] = [
  {
    id: 'eagle',
    order: 1,
    body: 'moon',
    eyebrow: 'The Moon',
    question: 'What does a landing leave behind?',
    invitation: 'Begin with the lower part of a lander—and the idea that leaving can leave something real behind.',
    legacy: 'left behind',
  },
  {
    id: 'lrrr',
    order: 2,
    body: 'moon',
    eyebrow: 'The Moon',
    question: 'How can light return an answer?',
    invitation: 'Follow a reflective surface: a small object that turns a beam of light into a measurement.',
    legacy: 'living legacy',
  },
  {
    id: 'sojourner',
    order: 3,
    body: 'mars',
    eyebrow: 'Mars',
    question: 'How far can a small rover reach?',
    invitation: 'Take a close look at a rover built to ask questions one careful drive at a time.',
    legacy: 'silent machine',
  },
  {
    id: 'insight',
    order: 4,
    body: 'mars',
    eyebrow: 'Mars',
    question: 'How does a planet make a sound?',
    invitation: 'Slow down for a mission that used patient listening to study a world’s deep interior.',
    legacy: 'silent machine',
  },
  {
    id: 'ingenuity',
    order: 5,
    body: 'mars',
    eyebrow: 'Mars',
    question: 'What changes when a machine lifts off?',
    invitation: 'See how an aircraft made a Martian horizon feel new.',
    legacy: 'silent machine',
  },
  {
    id: 'voyager1',
    order: 6,
    body: 'deep',
    eyebrow: 'Beyond the heliopause',
    question: 'What does home look like from far away?',
    invitation: 'End with a spacecraft whose cited record stretches from familiar planets into interstellar space.',
    legacy: 'far traveller',
  },
] as const;
