const SELECT_ARTIFACT = 'silent-fleet:select-artifact';

/** Request that the dossier component opens an artefact. */
export function selectArtifact(id, flyToLocation = true) {
  document.dispatchEvent(new CustomEvent(SELECT_ARTIFACT, {
    detail: { id, flyToLocation },
  }));
}

/** Subscribe to artefact-selection requests without coupling components together. */
export function onArtifactSelection(callback) {
  const listener = (event) => callback(event.detail);
  document.addEventListener(SELECT_ARTIFACT, listener);
  return () => document.removeEventListener(SELECT_ARTIFACT, listener);
}
