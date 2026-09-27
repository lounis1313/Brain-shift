import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const replace=(s,a,b,label)=>{if(!s.includes(a))throw new Error(`Missing anchor: ${label}`);return s.replace(a,b)};

let app=read('app.js');
app=replace(app,'const APP_VERSION="1.5.0";','const APP_VERSION="1.5.1";','app version');
app=replace(app,'navigator.serviceWorker.register("sw.js").catch(()=>{})','navigator.serviceWorker.register("sw.js").then(reg=>reg.update().catch(()=>{})).catch(()=>{})','proactive SW refresh');
write('app.js',app);

let pro=read('pro.js');
pro=replace(pro,"const PRO_VERSION = '1.5.0';","const PRO_VERSION = '1.5.1';",'pro version');
write('pro.js',pro);

let index=read('index.html');
index=replace(index,'href="echo-orbit.css"','href="echo-orbit.css?v=1.5.1"','echo css cache bust');
index=replace(index,'src="echo-orbit.js"','src="echo-orbit.js?v=1.5.1"','echo js cache bust');
write('index.html',index);

let sw=read('sw.js');
sw=replace(sw,'const CACHE="brain-shift-v1.5.0";','const CACHE="brain-shift-v1.5.1";','cache version');
sw=replace(sw,'"./echo-orbit.css","./echo-orbit.js",','"./echo-orbit.css","./echo-orbit.js","./echo-orbit.css?v=1.5.1","./echo-orbit.js?v=1.5.1",','versioned echo assets');
write('sw.js',sw);

const pkg=JSON.parse(read('package.json'));pkg.version='1.5.1';write('package.json',JSON.stringify(pkg,null,2)+'\n');

let tests=read('tests/quality-check.mjs');
tests=replace(tests,'APP_VERSION="1\\.5\\.0"','APP_VERSION="1\\.5\\.1"','test version');
write('tests/quality-check.mjs',tests);

let changelog=read('CHANGELOG.md');
changelog=replace(changelog,'# Changelog\n','# Changelog\n\n## 1.5.1 — PWA refresh reliability\n\n- Added proactive service-worker update checks on each launch.\n- Added cache-busted Echo Orbit asset URLs so older installed PWAs cannot keep hiding the new game behind stale static caches.\n- Bumped the offline cache generation to 1.5.1.\n');
write('CHANGELOG.md',changelog);

console.log('Brain Shift 1.5.1 cache refresh hotfix applied');
