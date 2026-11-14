import type { CelestialBody } from '../types/archive';

/** Shared UI state for the otherwise independent UI modules. */
export interface ArchiveState {
  currentBody: Extract<CelestialBody, 'moon' | 'mars'>;
  selectedArtifactId: string | null;
}

export const archiveState: ArchiveState = {
  currentBody: 'moon',
  selectedArtifactId: null,
};
