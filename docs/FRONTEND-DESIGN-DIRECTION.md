# Silent Fleet — Frontend Design direction

## Purpose

Silent Fleet is a school-age-friendly, independent educational archive. Its job is to turn an intimidating catalogue of off-world hardware into a confident first journey: choose one machine, understand what is story and what is fact, then follow the evidence.

## Art direction: the trace, not the dashboard

The visual reference is a recovered field notebook placed over a dark observation table. It avoids treating every section as a HUD panel. Warm mineral ink identifies the human question; cold signal blue identifies record-bound evidence; the image is a specimen, not decoration.

### Palette

| token | value | role |
| --- | --- | --- |
| void | `#050711` | night-paper base |
| slate | `#0B1020` | reading plane |
| paper | `#F0ECE3` | main text |
| mineral | `#FFB15D` | story route and human attention |
| signal | `#72E6FF` | evidence and source surfaces |
| lichen | `#8EE6A4` | available/source-safe state |

### Type roles

- **Space Grotesk:** large questions, clear navigation, control language.
- **Instrument Serif:** reflective narration and invitations only.
- **IBM Plex Mono:** compact provenance metadata only; never the primary reading voice.

## Layout principle

A reader should see one decisive thing at a time. The opening is an asymmetric evidence plate; the guided route behaves like a physical bookmark; each chapter pairs a question with one specimen image; lower archive tools become denser only after the reader has learned the evidence language.

## Motion principle

Use one orchestrated arrival sequence, then reserve movement for cause-and-effect:

- pointer motion slightly shifts the evidence plate;
- choosing/scrolling a chapter updates a visible route marker;
- opening a dossier moves focus into a clearly contained record;
- WebGL echoes media and scroll velocity behind the DOM rather than competing with its content.

Motion is disabled or reduced without removing any information.

## Success criteria

- A first-time visitor can identify the start action, the evidence source, and the difference between a story moment and a factual record in the first screenful.
- The design is recognisable from its specimen/evidence composition rather than generic dark SaaS or HUD chrome.
- Keyboard, touch, reduced-motion, no-JS, and WebGL-disabled paths retain the same reading order.
