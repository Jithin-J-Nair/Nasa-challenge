# Silent Fleet rebuild direction

## Why this pass exists

This pass applies the installed Frontend Design, Tailwind Design System, User Research, Vercel React, Vercel Web Design Guidelines, and UI/UX Pro Max skills to an existing evidence-led educational archive. It does not invent user research findings or alter claim-review boundaries.

## Audience hypotheses to validate

These are design hypotheses, not collected research results.

1. **First-time learner:** needs one clear place to begin and wants to understand what is story versus fact without reading project documentation first.
2. **Curious return visitor:** needs a short path back to a particular machine/question instead of repeating the full scroll.
3. **Evidence-minded reader or educator:** needs a fast explanation of what the archive’s status words mean and where factual claims came from.
4. **Keyboard, touch, and reduced-motion visitor:** needs the same chapter choices, source links, and dossier path without a pointer-only or motion-dependent interaction.

## Design decision

The design keeps the field-journal / recovered-evidence voice already authored for Silent Fleet, but spends its visual emphasis on a single primary action: choosing a question and entering an audited chapter. The chapter route is deliberately quiet, textual, and persistent in normal document flow rather than another decorative HUD.

### Token and hierarchy decisions

- **Base:** `--bg` and dark document planes preserve the archive’s night-reading environment.
- **Evidence:** `--cyan` marks source-bounded information; it never marks interpretive story text.
- **Journey:** `--amber` identifies chronological orientation and selected chapter progress.
- **Story:** Instrument Serif carries the reflective, kid-friendly story moment; Space Grotesk remains the practical navigation and factual-reader face; IBM Plex Mono is reserved for compact source/state metadata.
- **Interaction:** each route item is a native anchor to a named chapter. Focus, hover, and the active ScrollTrigger state use the same visual vocabulary.

## Implemented rebuild changes

- Added a six-question route immediately before the guided chapters, with native links to each generated chapter anchor.
- Kept the active route item synchronized with the current scroll chapter and announced existing chapter progress without creating a separate visual mode.
- Added an explicit archive reading key for left behind, silent, living legacy, far traveller, destroyed, and unknown. Definitions state the archive’s evidence policy rather than asserting an unsourced mission fact.
- Preserved the evidence-first dossier order: story moment, NASA-checked record, NASA-checked science, source, then media.

## Review checklist

- Chapter anchors work without JavaScript because they are normal document links once the page is rendered.
- Scroll animation is enhancement only; reduced motion keeps content and route semantics available.
- The route collapses from three columns to two and then one column for small screens.
- The taxonomy uses a definition list and remains separate from individual mission status claims.
- No new NASA factual claim, NASA image, or location was introduced by this presentation pass.

## Follow-up research plan

Before changing copy or information architecture again, run five moderated usability sessions with a mixed group of school-age learners, educators, and evidence-focused adults. Ask participants to: choose a first chapter, distinguish story from fact, find an evidence link, explain a withheld record, and return to a chosen story. Synthesize findings by journey stage and impact/effort; do not infer findings from analytics or design preference alone.
