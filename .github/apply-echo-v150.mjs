import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const replace=(s,a,b,label)=>{if(!s.includes(a))throw new Error(`Missing integration anchor: ${label}`);return s.replace(a,b)};

// Fix orbital radius to be relative to the arena scale, not satellite size.
let echo=read('echo-orbit.js');
echo=replace(echo,"const p=PALETTE[n.palette],radius=n.ring===2?'31%':'43%';","const p=PALETTE[n.palette],radius=n.ring===2?'clamp(72px,23vw,145px)':'clamp(108px,34vw,205px)';",'echo radius');
echo=replace(echo,"  document.addEventListener('visibilitychange',()=>{if(document.hidden&&current.mode==='echo')clearEchoTimers()});\n  injectEchoCard();","  const previousShowView=showView;\n  showView=function(id){if(id!=='gameView'&&current.mode==='echo')clearEchoTimers();return previousShowView(id)};\n  injectEchoCard();",'echo lifecycle cleanup');
write('echo-orbit.js',echo);

let index=read('index.html');
index=replace(index,'  <link rel="stylesheet" href="reactor.css" />','  <link rel="stylesheet" href="reactor.css" />\n  <link rel="stylesheet" href="echo-orbit.css" />','echo css');
index=replace(index,'  <script src="reactor.js"></script>','  <script src="reactor.js"></script>\n  <script src="echo-orbit.js"></script>','echo js');
write('index.html',index);

let app=read('app.js');
app=replace(app,'const APP_VERSION="1.4.0";','const APP_VERSION="1.5.0";','app version');
write('app.js',app);

let pro=read('pro.js');
pro=replace(pro,"const PRO_VERSION = '1.4.0';","const PRO_VERSION = '1.5.0';",'pro version');
write('pro.js',pro);

let sw=read('sw.js');
sw=replace(sw,'const CACHE="brain-shift-v1.4.0";','const CACHE="brain-shift-v1.5.0";','cache version');
sw=replace(sw,'"./reactor.css","./reactor.js",','"./reactor.css","./reactor.js","./echo-orbit.css","./echo-orbit.js",','offline echo assets');
write('sw.js',sw);

const pkg=JSON.parse(read('package.json'));pkg.version='1.5.0';write('package.json',JSON.stringify(pkg,null,2)+'\n');

let tests=read('tests/quality-check.mjs');
tests=replace(tests,"const reactor = read('reactor.js');","const reactor = read('reactor.js');\nconst echo = read('echo-orbit.js');",'test echo read');
tests=replace(tests,"execFileSync(process.execPath, ['--check', new URL('../reactor.js', import.meta.url).pathname], {stdio:'inherit'});","execFileSync(process.execPath, ['--check', new URL('../reactor.js', import.meta.url).pathname], {stdio:'inherit'});\nexecFileSync(process.execPath, ['--check', new URL('../echo-orbit.js', import.meta.url).pathname], {stdio:'inherit'});",'echo syntax test');
tests=replace(tests,"assert.match(index, /reactor\\.js/, 'Shift Reactor JS is not loaded');","assert.match(index, /reactor\\.js/, 'Shift Reactor JS is not loaded');\nassert.match(index, /echo-orbit\\.css/, 'Echo Orbit CSS is not loaded');\nassert.match(index, /echo-orbit\\.js/, 'Echo Orbit JS is not loaded');",'echo index assertions');
tests=replace(tests,"assert.match(app, /APP_VERSION=\"1\\.4\\.0\"/, 'App version mismatch');","assert.match(app, /APP_VERSION=\"1\\.5\\.0\"/, 'App version mismatch');",'test version');
tests=replace(tests,"assert.match(sw, /reactor\\.js/, 'Service worker must cache reactor.js');","assert.match(sw, /reactor\\.js/, 'Service worker must cache reactor.js');\nassert.match(sw, /echo-orbit\\.css/, 'Service worker must cache echo-orbit.css');\nassert.match(sw, /echo-orbit\\.js/, 'Service worker must cache echo-orbit.js');",'echo cache assertions');
tests=replace(tests,"assert.match(reactor, /showShiftTransition/, 'Shift Reactor rule-shift mechanic missing');","assert.match(reactor, /showShiftTransition/, 'Shift Reactor rule-shift mechanic missing');\nassert.match(echo, /Echo Orbit/, 'Echo Orbit mode missing');\nassert.match(echo, /MODES\\.echo/, 'Echo Orbit must register as a game mode');\nassert.match(echo, /function echoRound/, 'Echo Orbit round engine missing');\nassert.match(echo, /reconfigureOrbit/, 'Echo Orbit reconfiguration mechanic missing');",'echo gameplay assertions');
tests=replace(tests,"assert.doesNotMatch(app+pro+reactor, /\\beval\\s*\\(/, 'eval() is not allowed');","assert.doesNotMatch(app+pro+reactor+echo, /\\beval\\s*\\(/, 'eval() is not allowed');",'eval scope');
write('tests/quality-check.mjs',tests);

let changelog=read('CHANGELOG.md');
changelog=replace(changelog,'# Changelog\n','# Changelog\n\n## 1.5.0 — Echo Orbit\n\n- Added **Echo Orbit**, a premium spatial working-memory game built around moving satellites and audiovisual sequences.\n- Added adaptive sequence length, orbit speed and one/two-ring layouts.\n- Expert and Master difficulties can reconfigure and reverse the orbit after memorization, forcing identity tracking instead of static-position recall.\n- Added a dedicated Echo Orbit record, per-mode stats, tutorial and the **Mémoire orbitale** badge.\n- Added responsive motion design, reduced-motion support, musical satellite cues and full offline PWA caching.\n','changelog header');
write('CHANGELOG.md',changelog);

let readme=read('README.md');
readme=readme.replace(/# Brain Shift 1\.4[^\n]*/,'# Brain Shift 1.5 — NOVELYX Studio');
readme=readme.replace(/## Expérience 1\.4/,'## Expérience 1.5');
readme=readme.replace(/6 mini-jeux adaptatifs[^\n]*/,'7 mini-jeux adaptatifs, dont les expériences signature **Shift Reactor** et **Echo Orbit**.');
if(!readme.includes('Echo Orbit')){
  readme=readme.replace('## Qualité technique','- **Echo Orbit** : mémoire spatiale dynamique, séquences audiovisuelles et reconfiguration des orbites en difficulté avancée.\n\n## Qualité technique');
}
write('README.md',readme);

let architecture=read('ARCHITECTURE.md');
architecture=architecture.replace('and the six cognitive mini-games.','and the seven cognitive mini-games.');
if(!architecture.includes('echo-orbit.js')){
  architecture=architecture.replace('- `reactor.js` — Shift Reactor signature game engine.','- `reactor.js` — Shift Reactor signature game engine.\n- `echo-orbit.css` / `echo-orbit.js` — Echo Orbit spatial-memory experience and motion system.');
}
write('ARCHITECTURE.md',architecture);

console.log('Echo Orbit 1.5.0 integration applied');