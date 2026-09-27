# Brain Shift 1.2 — NOVELYX Studio

[![Brain Shift Quality](https://github.com/lounis1313/Brain-shift/actions/workflows/quality.yml/badge.svg)](https://github.com/lounis1313/Brain-shift/actions/workflows/quality.yml)

Brain Shift est une PWA mobile-first d’entraînement cérébral ludique : mémoire, calcul mental, observation, logique et contrôle attentionnel.

## Jouer

**https://lounis1313.github.io/Brain-shift/**

Le jeu peut être installé directement depuis un navigateur compatible et fonctionne hors ligne après mise en cache.

## Expérience 1.2

- 5 mini-jeux adaptatifs : Mémoire Flash, Calcul Express, Intrus Visuel, Suite Logique et Stroop Couleurs.
- 5 niveaux de difficulté + mode Auto personnalisé par discipline.
- **Coach NOVELYX** : programme guidé qui cible les compétences à renforcer.
- Profil de compétences, suivi sur 7 jours, records et historique récent.
- XP, niveaux, badges, série quotidienne, objectif journalier et Score cerveau.
- Feedback de manche, combo, rapidité et progression plus lisibles.
- Sauvegarde locale + export/import de progression.
- PWA installable, mode hors ligne et gestion des mises à jour.

## Qualité technique

Le projet reste sans framework ni dépendance runtime afin de conserver un chargement rapide et une surface technique réduite. `npm test` vérifie la syntaxe JavaScript, le manifest, les références PWA et les fichiers critiques. Les mêmes contrôles tournent dans GitHub Actions à chaque push et pull request.

Voir [ARCHITECTURE.md](ARCHITECTURE.md) et [CHANGELOG.md](CHANGELOG.md).

## Confidentialité

Aucun compte n’est requis et la progression n’est pas envoyée vers un serveur. Les données de jeu restent stockées localement dans le navigateur de l’appareil, sauf export manuel par l’utilisateur.

> Le « Score cerveau » et le profil de compétences sont des indicateurs ludiques internes à Brain Shift. Ils ne constituent pas des mesures médicales, diagnostiques ou psychométriques de l’intelligence.
