# Brain Shift 1.2 — Product audit & roadmap

## Product position

Brain Shift is intentionally designed around short, repeatable cognitive mini-games rather than long sessions. The 1.2 release focuses on five pillars: immediate play, adaptive challenge, visible progression, personalized guidance and offline-first mobile use.

## Benchmark principles used

The product direction borrows proven interaction principles from leading brain-training products without cloning their visual identity or exercises:

- short daily workouts;
- personalized/adaptive difficulty;
- a coach or recommended training path;
- visible progress over time;
- multiple cognitive categories;
- immediate feedback and lightweight gamification.

## Shipped in 1.2

### Gameplay
- Five independent game families.
- Five difficulty tiers.
- Per-discipline adaptive difficulty.
- Accuracy + response-speed scoring.
- Anti-repeat signatures for generated content.
- Quick Challenge across all five skills.
- Coach NOVELYX: three targeted games × three rounds.

### Retention and motivation
- XP and levels.
- Ten achievements.
- Daily goal and streak.
- Per-game records.
- Brain Score quick challenge.
- Skill profile.
- Seven-day activity view.

### UX / accessibility
- Mobile-first responsive layout.
- Safe-area support.
- Pause/resume and automatic background pause.
- Reduced-motion support.
- Keyboard focus states and modal focus handling.
- Haptics and audio can be disabled.
- Install/offline/update PWA lifecycle.

### Engineering
- Static, dependency-light runtime.
- GitHub Pages deployment.
- Offline service worker.
- Versioned cache.
- Local-only persistence with backup/restore.
- Automated structural/syntax tests.
- GitHub Actions CI.
- Architecture and changelog documentation.

## Known product trade-offs

- Local-only data keeps privacy and complexity low, but does not synchronize devices.
- Current adaptive difficulty is heuristic rather than a psychometrically validated model.
- Brain Score and skill scores are game indicators, not clinical or intelligence measurements.
- Content is procedural, which provides high variation but still benefits from future new game families.
- The current runtime is deliberately framework-free; if the app grows substantially, modularization/build tooling should be revisited.

## Prioritized roadmap

### 1.2.x — hardening
- Cross-device browser/device QA matrix.
- Automated browser smoke tests.
- Refine Coach session accounting and analytics.
- Performance budget and Lighthouse baseline.

### 1.3 — gameplay depth
- New memory variants: ordered recall and n-back-inspired lightweight mode.
- Visual rotation/pattern reasoning game.
- More sequence families and non-numeric logic.
- Optional daily seeded challenge so friends receive the same puzzle set.
- Personal-best ghosts / score targets without aggressive monetization loops.

### 1.4 — social, optional
- Shareable result cards.
- Friend challenge codes.
- Weekly local leaderboard groups.
- Privacy-first opt-in identity.

### 2.0 — account/cloud layer, only if justified
- Optional account.
- Cross-device synchronization.
- NOVELYX library integration.
- Server-side challenge verification and leaderboards.

## Release bar

A public release should meet all of the following:

1. CI green.
2. PWA install and offline launch verified on target Android devices.
3. No blocking issue in all five games and Coach.
4. Persistence verified after closing/reopening the installed PWA.
5. Responsive check on common phone widths.
6. Release notes updated.

