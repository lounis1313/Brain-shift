from pathlib import Path
from urllib.request import urlretrieve
import re

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'assets' / 'audio'
AUDIO.mkdir(parents=True, exist_ok=True)

ASSETS = {
    'tap.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/c9d541f6-47a9-4521-8ee4-20dfc11ead61/Brain_Shift___Tap_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMTU4NTNlYjcxMjViMTE4ZCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDYyODI3OX0.QxCUavJ3w6tlig-201GBvCCz72ow5BnBBmTFA3myYHQ',
    'correct.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/1d98458d-9891-4c62-b969-5f12f33e93c7/Brain_Shift___Correct_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZWMzMjE5NGUzNjJkODdiZiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDY5NjY1NH0.9RX9iYH2SJmPhfygdSn6qiN1saZRwvIpgpKZMOuSc2s',
    'wrong.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/eaf2f3e6-98bd-4ed9-9b4a-6925ef660a02/Brain_Shift___Wrong_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNWU3Yjk4NGRlYWEyMzM4MyIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDcwMzgyMX0.Ibt3RivXpAWPkoP7HikAorfR6GPvpH4vBKuJCdOgybY',
    'combo.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/534f76ac-bf47-463c-bf49-ce64f7ac3ec8/Brain_Shift___Combo_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiOTAyM2Y2MTY5OTM0ODViNSIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDY2NjI2Mn0.7f56fcGh6WWNYPSf_LJLv0nr79_EMHOPJcayEYBTVCg',
    'reward.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/748e57b0-c0af-4089-b757-979d42431ea4/Brain_Shift___Reward_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiM2JiMzQ2N2VmNTM2OWFiZCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDY5NTkzNH0.3yuS77x6pBzHtJEP3ITna1txR6On7b3xe1cZoPbRgVY',
    'badge.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/5880c097-11bb-47e4-a625-9015496aacad/Brain_Shift___Badge_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZmI5NjkzNzg2MGJiNzFjZCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDY5MDE2OH0.ADikCYoeBwbn168Nv_3rL4_bchfIX_MwOTFF764MlZE',
    'record.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/88f42b9c-717a-4c84-8eae-e2f6b98372d1/Brain_Shift___Record_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNWVlNDdjMWEyNDA4MTQwOSIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDY2NTg4Mn0.aVr0gl4bJvLH--c2xlC21mIYbrjcQbuF9m5B3r1SxDg',
    'level.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/b552c1c5-e939-4479-922f-3919bcd927e7/Brain_Shift___Level_Up_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMjMyNjdjMjMwNGYzZGNhNCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDY4NDcwN30.B7rvmaTuWyZApVaBUmrxniJR8FBD9ssAA5_F2lYD0zc',
    'start.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/bd8c94b4-9729-401a-9f0b-c907569392f2/Brain_Shift___Start_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiOTJmM2M2YWZhNGNhZDJlZCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDY2NTY0N30.ROmeHVZgGiJ7cILvblDj8wQATzqk_Znous9uoRC6PNM',
    'finish.mp3': 'https://dnznrvs05pmza.cloudfront.net/audio_sfx/45296723-dc42-4dd7-8401-42d987f447f0/Brain_Shift___Finish_Premium.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiOTQxMjNjOGM2OGQ5YWEwZiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MDY5MDMxNn0.NzAIOIUA-MbPMvdwkV419ahvXXG2OPO3AaItT4i4rjY',
}

for name, url in ASSETS.items():
    target = AUDIO / name
    urlretrieve(url, target)
    if target.stat().st_size < 1000:
        raise SystemExit(f'Audio download too small: {name}')


def replace_text(path, old, new):
    p = ROOT / path
    s = p.read_text()
    if old not in s:
        raise SystemExit(f'Missing marker in {path}: {old}')
    p.write_text(s.replace(old, new, 1))

# Version bump.
replace_text('app.js', 'const APP_VERSION="1.2.2";', 'const APP_VERSION="1.3.0";')
replace_text('pro.js', "const PRO_VERSION = '1.2.2';", "const PRO_VERSION = '1.3.0';")
replace_text('package.json', '"version": "1.2.2"', '"version": "1.3.0"')
replace_text('index.html', 'NOVELYX Studio · Version 1.2.2', 'NOVELYX Studio · Version 1.3.0')
replace_text('sw.js', 'brain-shift-v1.2.2', 'brain-shift-v1.3.0')

# Preserve the user's sound preference while recording the new audio generation.
pro_path = ROOT / 'pro.js'
pro = pro_path.read_text()
pro = pro.replace("if (data.pro.soundDesignVersion!=='2'){ data.sound=true; data.pro.soundDesignVersion='2'; }", "data.pro.soundDesignVersion='3';", 1)

marker = "  document.addEventListener('pointerdown',()=>ensureAudio(),{passive:true});"
if marker not in pro:
    raise SystemExit('Premium audio insertion marker missing')

premium = r'''

  // --- V1.3 premium sampled audio -------------------------------------------------
  // Real short MP3 samples live in assets/audio and are cached by the service worker.
  // The synthesized V1.2.2 engine remains as an automatic fallback.
  const synthSoundFx = soundFx;
  const PREMIUM_SFX={
    tap:'./assets/audio/tap.mp3',
    start:'./assets/audio/start.mp3',
    correct:'./assets/audio/correct.mp3',
    wrong:'./assets/audio/wrong.mp3',
    combo:'./assets/audio/combo.mp3',
    finish:'./assets/audio/finish.mp3',
    reward:'./assets/audio/reward.mp3',
    badge:'./assets/audio/badge.mp3',
    record:'./assets/audio/record.mp3',
    level:'./assets/audio/level.mp3'
  };
  const PREMIUM_VOLUME={tap:.42,start:.56,correct:.62,wrong:.52,combo:.64,finish:.58,reward:.61,badge:.63,record:.66,level:.66};
  const premiumPools=new Map();
  const premiumCursor=new Map();

  function premiumKey(name){return name==='coach'?'reward':name}
  function premiumPool(name){
    const key=premiumKey(name),src=PREMIUM_SFX[key];
    if(!src)return null;
    if(!premiumPools.has(key)){
      const pool=Array.from({length:key==='tap'?4:2},()=>{
        const a=new Audio(src);a.preload='auto';a.volume=PREMIUM_VOLUME[key]??.6;return a;
      });
      premiumPools.set(key,pool);premiumCursor.set(key,0);
    }
    return premiumPools.get(key);
  }
  function preloadPremiumSfx(){
    Object.keys(PREMIUM_SFX).forEach(key=>premiumPool(key));
  }
  function playPremiumSfx(name){
    if(!data.sound)return true;
    const key=premiumKey(name),pool=premiumPool(key);if(!pool)return false;
    const idx=premiumCursor.get(key)||0,a=pool[idx%pool.length];premiumCursor.set(key,(idx+1)%pool.length);
    try{
      a.pause();a.currentTime=0;
      const promise=a.play();
      if(promise?.catch)promise.catch(()=>synthSoundFx(name));
      return true;
    }catch{return false}
  }
  soundFx=function(name){if(!playPremiumSfx(name))synthSoundFx(name)};
  window.addEventListener('load',()=>setTimeout(preloadPremiumSfx,250),{once:true});
'''
pro = pro.replace(marker, marker + premium, 1)
pro_path.write_text(pro)

# Cache every real audio asset for offline PWA use.
sw_path = ROOT / 'sw.js'
sw = sw_path.read_text()
audio_entries = ''.join([f',"./assets/audio/{name}"' for name in ASSETS])
old_assets = '"./assets/maskable-512.png"]'
if old_assets not in sw:
    raise SystemExit('Service worker asset marker missing')
sw = sw.replace(old_assets, f'"./assets/maskable-512.png"{audio_entries}]', 1)
sw_path.write_text(sw)

# Strengthen CI for the sampled audio release.
test_path = ROOT / 'tests' / 'quality-check.mjs'
tests = test_path.read_text().replace('/APP_VERSION="1\\.2\\.2"/', '/APP_VERSION="1\\.3\\.0"/', 1)
tests = tests.replace("assert.match(pro, /function (bubble|pluck|sparkle)/, 'Playful sound primitives missing');", "assert.match(pro, /function (bubble|pluck|sparkle)/, 'Playful sound primitives missing');\nassert.match(pro, /PREMIUM_SFX/, 'Premium sampled audio bank missing');\nassert.match(sw, /assets\\/audio\\/correct\\.mp3/, 'Premium audio must be cached offline');\n['tap','start','correct','wrong','combo','finish','reward','badge','record','level'].forEach(name=>assert.ok(fs.existsSync(new URL(`../assets/audio/${name}.mp3`, import.meta.url)), `Missing premium sample: ${name}`));")
test_path.write_text(tests)

# Changelog.
changelog = ROOT / 'CHANGELOG.md'
text = changelog.read_text()
section = """## 1.3.0 — Premium sampled audio\n\n- Replaced the primary gameplay feedback with ten real short MP3 micro-samples.\n- Added distinct premium cues for tap, start, correct, wrong, combo, finish, reward, badge, record and level-up.\n- Added a small audio pool to keep repeated taps responsive without clipping important reward sounds.\n- Preserved the procedural Web Audio engine as a fallback when a sample cannot play.\n- Added every sample to the PWA offline cache and CI checks.\n\n"""
if '## 1.3.0 — Premium sampled audio' not in text:
    text = text.replace('# Changelog\n\n', '# Changelog\n\n' + section, 1)
    changelog.write_text(text)

print('Brain Shift 1.3.0 premium audio patch prepared successfully')
