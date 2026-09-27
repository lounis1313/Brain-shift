# Brain Shift — Architecture

Brain Shift is a zero-backend, mobile-first PWA designed to remain lightweight, installable and usable offline.

## Runtime layers

- `index.html` — semantic application shell and accessible navigation.
- `styles.css` — core design system and responsive layout.
- `app.js` — core game engine, persistence, scoring, difficulty and PWA install hooks.
- `reactor.js` — Shift Reactor signature-game engine, adaptive rule generation and mid-round rule switching.
- `reactor.css` — premium Reactor arena, motion, responsive shapes and reduced-motion support.
- `pro.css` — product-polish layer.
- `pro.js` — Coach NOVELYX, skill profile, seven-day activity view, enhanced game feedback and update UX.
- `manifest.webmanifest` — PWA metadata and launcher icons.
- `sw.js` — offline cache and service-worker lifecycle.

## Data model

Progress is stored locally in `localStorage`. No account or server is required. The current schema keeps XP, streak, daily goal, records, badges, per-mode statistics, anti-repeat history and recent session history.

## Gameplay principles

1. Short sessions and immediate feedback.
2. Adaptive difficulty per discipline.
3. Accuracy and response speed both affect scoring.
4. Recent content signatures reduce immediate repetition.
5. The Coach prioritizes lower-scoring skills to keep training balanced.

## Quality

`npm test` performs syntax and structural checks without external dependencies. GitHub Actions runs the same checks on every push and pull request.

## Product boundary

Brain Shift is an entertainment/training product. Its scores are not medical, diagnostic or psychometric measures of intelligence.
