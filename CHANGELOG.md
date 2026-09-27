# Changelog

## 1.3.0 — Premium sampled audio

- Replaced the primary gameplay feedback with ten real short MP3 micro-samples.
- Added distinct premium cues for tap, start, correct, wrong, combo, finish, reward, badge, record and level-up.
- Added a small audio pool to keep repeated taps responsive without clipping important reward sounds.
- Preserved the procedural Web Audio engine as a fallback when a sample cannot play.
- Added every sample to the PWA offline cache and CI checks.

## 1.2.2 — Playful sound design

- Reworked the full audio identity so events are clearly distinguishable by ear.
- Added bubble pops, plucked tones, sparkle bursts, light noise transients and stereo movement.
- Correct, error, combo, reward, badge, record, level-up and Coach cues now use different rhythmic and tonal signatures.
- Kept the engine Web Audio-only: lightweight, offline and license-free.

## 1.2.1 — Interactive sound polish

- Added a custom Brain Shift sound identity generated with Web Audio.
- Added soft UI selection sounds, start cues, correct/error feedback and combo feedback.
- Added distinct reward cues for badges, records, level-ups, quick challenges and Coach NOVELYX completion.
- Sound is enabled for the new audio-design migration and remains fully optional from Settings.
- No external audio assets: offline, lightweight and license-free.

## 1.2.0 — Professional polish

- Added **Coach NOVELYX**, a personalized 3-game guided workout.
- Added a per-skill profile for Memory, Calculation, Observation, Logic and Attention.
- Added seven-day activity tracking and recent-session history.
- Added round-progress indicators, combo feedback, score popups and improved error feedback.
- Added online/offline status and a PWA update flow.
- Added responsive and accessibility polish through a dedicated professional UI layer.
- Added automated repository quality checks and GitHub Actions CI.
- Added architecture documentation.
- Release integration validated before deployment with the project quality suite.

## 1.1.0

- Five adaptive mini-games.
- Per-discipline Auto difficulty.
- XP, levels, badges, streaks, daily goal and Brain Score.
- Anti-repetition logic.
- Local backup/restore.
- Installable offline PWA.
- Accessibility, pause/resume and haptic settings.
