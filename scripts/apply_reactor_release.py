from pathlib import Path


def replace(path, old, new, count=-1):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'Missing marker in {path}: {old[:100]}')
    p.write_text(s.replace(old,new,count))

replace('app.js','const APP_VERSION="1.3.0";','const APP_VERSION="1.4.0";',1)
replace('pro.js',"const PRO_VERSION = '1.3.0';","const PRO_VERSION = '1.4.0';",1)
replace('package.json','"version": "1.3.0"','"version": "1.4.0"',1)
replace('sw.js','brain-shift-v1.3.0','brain-shift-v1.4.0',1)

p=Path('sw.js'); s=p.read_text()
if 'reactor.css' not in s:
    s=s.replace('"./pro.css","./app.js"','"./pro.css","./reactor.css","./app.js"',1)
if 'reactor.js' not in s:
    s=s.replace('"./pro.js","./manifest.webmanifest"','"./pro.js","./reactor.js","./manifest.webmanifest"',1)
p.write_text(s)

p=Path('index.html'); s=p.read_text()
if 'reactor.css' not in s:
    s=s.replace('  <link rel="stylesheet" href="pro.css" />','  <link rel="stylesheet" href="pro.css" />\n  <link rel="stylesheet" href="reactor.css" />',1)
if 'reactor.js' not in s:
    s=s.replace('  <script src="pro.js"></script>','  <script src="pro.js"></script>\n  <script src="reactor.js"></script>',1)
s=s.replace('5 disciplines pour varier les efforts.','6 disciplines pour varier les efforts.')
p.write_text(s)

p=Path('tests/quality-check.mjs'); s=p.read_text()
s=s.replace("const pro = read('pro.js');","const pro = read('pro.js');\nconst reactor = read('reactor.js');")
s=s.replace("execFileSync(process.execPath, ['--check', new URL('../pro.js', import.meta.url).pathname], {stdio:'inherit'});","execFileSync(process.execPath, ['--check', new URL('../pro.js', import.meta.url).pathname], {stdio:'inherit'});\nexecFileSync(process.execPath, ['--check', new URL('../reactor.js', import.meta.url).pathname], {stdio:'inherit'});")
s=s.replace("assert.match(index, /pro\\.js/, 'Professional JS layer is not loaded');","assert.match(index, /pro\\.js/, 'Professional JS layer is not loaded');\nassert.match(index, /reactor\\.css/, 'Shift Reactor CSS is not loaded');\nassert.match(index, /reactor\\.js/, 'Shift Reactor JS is not loaded');")
s=s.replace('/APP_VERSION="1\\.3\\.0"/','/APP_VERSION="1\\.4\\.0"/')
s=s.replace("assert.match(sw, /pro\\.js/, 'Service worker must cache pro.js');","assert.match(sw, /pro\\.js/, 'Service worker must cache pro.js');\nassert.match(sw, /reactor\\.css/, 'Service worker must cache reactor.css');\nassert.match(sw, /reactor\\.js/, 'Service worker must cache reactor.js');")
s=s.replace("assert.doesNotMatch(app+pro, /\\beval\\s*\\(/, 'eval() is not allowed');","assert.match(reactor, /Shift Reactor/, 'Shift Reactor mode missing');\nassert.match(reactor, /MODES\\.reactor/, 'Shift Reactor must register as a game mode');\nassert.match(reactor, /function reactorStage/, 'Shift Reactor stage engine missing');\nassert.match(reactor, /showShiftTransition/, 'Shift Reactor rule-shift mechanic missing');\nassert.doesNotMatch(app+pro+reactor, /\\beval\\s*\\(/, 'eval() is not allowed');")
p.write_text(s)

p=Path('README.md'); s=p.read_text()
s=s.replace('# Brain Shift 1.2 — NOVELYX Studio','# Brain Shift 1.4 — NOVELYX Studio')
s=s.replace('## Expérience 1.2','## Expérience 1.4')
s=s.replace('- 5 mini-jeux adaptatifs : Mémoire Flash, Calcul Express, Intrus Visuel, Suite Logique et Stroop Couleurs.','- 6 mini-jeux adaptatifs : Mémoire Flash, Calcul Express, Intrus Visuel, Suite Logique, Stroop Couleurs et **Shift Reactor**.')
if 'jeu signature' not in s:
    s=s.replace('- 5 niveaux de difficulté + mode Auto personnalisé par discipline.','- **Shift Reactor**, jeu signature : règles visuelles combinées, inhibition, adaptation rapide et changements de règle en pleine manche.\n- 5 niveaux de difficulté + mode Auto personnalisé par discipline.')
p.write_text(s)

p=Path('ARCHITECTURE.md'); s=p.read_text()
s=s.replace('- `app.js` — game engine, persistence, scoring, difficulty, PWA install hooks and the five cognitive mini-games.','- `app.js` — core game engine, persistence, scoring, difficulty and PWA install hooks.\n- `reactor.js` — Shift Reactor signature-game engine, adaptive rule generation and mid-round rule switching.\n- `reactor.css` — premium Reactor arena, motion, responsive shapes and reduced-motion support.')
s=s.replace('- `pro.css` — version 1.2 product-polish layer.','- `pro.css` — product-polish layer.')
p.write_text(s)

p=Path('CHANGELOG.md'); s=p.read_text(); marker='# Changelog\n\n'
section='''## 1.4.0 — Shift Reactor\n\n- Added **Shift Reactor**, Brain Shift’s first signature game.\n- Added an animated premium reactor arena with colored shapes, energy feedback and responsive touch targets.\n- Added adaptive rule families across five difficulty levels: color, shape, parity, conjunction, exclusion, OR and XOR logic.\n- Added mid-round **SHIFT** transitions at higher difficulties so the active rule can change without leaving the session.\n- Integrated Reactor scoring, records, Auto difficulty, statistics, tutorial, random-game selection and a dedicated achievement.\n- Added offline caching and automated quality checks for the new game layer.\n\n'''
if '## 1.4.0 — Shift Reactor' not in s:
    p.write_text(s.replace(marker,marker+section,1))
