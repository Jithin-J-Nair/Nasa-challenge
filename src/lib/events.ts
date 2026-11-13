const SELECT_ARTIFACT = 'silent-fleet:select-artifact';

export interface ArtifactSelectionDetail {
  id: string;
  flyToLocation: boolean;
}

function isArtifactSelectionDetail(value: unknown): value is ArtifactSelectionDetail {
  if (typeof value !== 'object' || value === null) return false;
  const candidate: { id?: unknown; flyToLocation?: unknown } = value;
  return typeof candidate.id === 'string' && typeof candidate.flyToLocation === 'boolean';
}

/** Request that the dossier component opens an artefact. */
export function selectArtifact(id: string | undefined, flyToLocation = true): void {
  if (!id) return;
  document.dispatchEvent(new CustomEvent<ArtifactSelectionDetail>(SELECT_ARTIFACT, {
    detail: { id, flyToLocation },
  }));
}

/** Subscribe to artefact-selection requests without coupling components together. */
export function onArtifactSelection(callback: (detail: ArtifactSelectionDetail) => void): () => void {
  const listener = (event: Event): void => {
    if (event instanceof CustomEvent && isArtifactSelectionDetail(event.detail)) callback(event.detail);
  };
  document.addEventListener(SELECT_ARTIFACT, listener);
  return () => document.removeEventListener(SELECT_ARTIFACT, listener);
}
