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
    eyebrow: 'Chapter one · the Moon',
    question: 'What does a landing leave behind?',
    invitation: 'Begin with a machine that stayed when its crew went home.',
    legacy: 'left behind',
  },
  {
    id: 'lrrr',
    order: 2,
    body: 'moon',
    eyebrow: 'Chapter two · the Moon',
    question: 'What can a quiet experiment keep doing?',
    invitation: 'Meet a small instrument that makes distance feel like a conversation.',
    legacy: 'living legacy',
  },
  {
    id: 'sojourner',
    order: 3,
    body: 'mars',
    eyebrow: 'Chapter three · Mars',
    question: 'What can a small rover notice?',
    invitation: 'Follow a curious machine into a place people have never walked.',
    legacy: 'silent machine',
  },
  {
    id: 'insight',
    order: 4,
    body: 'mars',
    eyebrow: 'Chapter four · Mars',
    question: 'What happens when a machine listens?',
    invitation: 'Slow down for a mission built around patient attention.',
    legacy: 'silent machine',
  },
  {
    id: 'ingenuity',
    order: 5,
    body: 'mars',
    eyebrow: 'Chapter five · Mars',
    question: 'Can an idea change the view?',
    invitation: 'See how a light machine made a familiar horizon feel new.',
    legacy: 'silent machine',
  },
  {
    id: 'voyager1',
    order: 6,
    body: 'deep',
    eyebrow: 'Chapter six · beyond',
    question: 'What does a message become far from home?',
    invitation: 'End with a traveller that turns distance into a human question.',
    legacy: 'far traveller',
  },
] as const;
