import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const index = read('index.html');
const app = read('app.js');
const pro = read('pro.js');
const sw = read('sw.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

execFileSync(process.execPath, ['--check', new URL('../app.js', import.meta.url).pathname], {stdio:'inherit'});
execFileSync(process.execPath, ['--check', new URL('../pro.js', import.meta.url).pathname], {stdio:'inherit'});

assert.match(index, /lang="fr"/i, 'HTML language must be French');
assert.match(index, /viewport-fit=cover/, 'Safe-area viewport support missing');
assert.match(index, /pro\.css/, 'Professional CSS layer is not loaded');
assert.match(index, /pro\.js/, 'Professional JS layer is not loaded');
assert.match(app, /APP_VERSION="1\.2\.1"/, 'App version mismatch');
assert.equal(manifest.start_url, './', 'PWA start_url must stay relative for GitHub Pages');
assert.equal(manifest.scope, './', 'PWA scope must stay relative for GitHub Pages');
assert.ok(manifest.icons?.some(x=>x.sizes==='192x192'), '192px icon missing');
assert.ok(manifest.icons?.some(x=>x.sizes==='512x512'), '512px icon missing');
assert.match(sw, /pro\.css/, 'Service worker must cache pro.css');
assert.match(sw, /pro\.js/, 'Service worker must cache pro.js');
assert.match(sw, /SKIP_WAITING/, 'Service worker update hook missing');
assert.match(pro, /function soundFx/, 'Interactive sound engine missing');
assert.match(pro, /AudioContext|webkitAudioContext/, 'Web Audio support missing');
assert.doesNotMatch(app+pro, /\beval\s*\(/, 'eval() is not allowed');

console.log('✓ Brain Shift quality checks passed');
