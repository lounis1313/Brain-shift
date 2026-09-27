from pathlib import Path


def replace(path, old, new, count=-1):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f"Missing marker in {path}: {old[:80]}")
    p.write_text(s.replace(old, new, count))


replace('app.js', 'const APP_VERSION="1.2.0";', 'const APP_VERSION="1.2.1";')
replace('app.js', 'badges:[],sound:false,haptics:true', 'badges:[],sound:true,haptics:true')

replace('index.html', '<small>Désactivés par défaut</small>', '<small>Activés · sons doux et discrets</small>')
replace('index.html', 'NOVELYX Studio · Version 1.2', 'NOVELYX Studio · Version 1.2.1')

replace('pro.js', "const PRO_VERSION = '1.2.0';", "const PRO_VERSION = '1.2.1';")
replace(
    'pro.js',
    "  data.pro.version = PRO_VERSION;\n\n  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));",
    "  data.pro.version = PRO_VERSION;\n  if (!data.pro.soundDesignVersion){ data.sound=true; data.pro.soundDesignVersion='1'; }\n\n  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));"
)

audio_block = r'''

  // --- Brain Shift sound identity -------------------------------------------------
  // Generated with Web Audio: lightweight, offline and license-free.
  const audioState={ctx:null,lastTapAt:0};
  function ensureAudio(){
    if(!data.sound)return null;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    try{
      if(!audioState.ctx)audioState.ctx=new Ctx();
      if(audioState.ctx.state==='suspended')audioState.ctx.resume().catch(()=>{});
      return audioState.ctx;
    }catch{return null}
  }
  function tone(freq,duration=.07,{delay=0,type='sine',gain=.022,to=null}={}){
    const ctx=ensureAudio();if(!ctx)return;
    const start=ctx.currentTime+delay,end=start+duration;
    const osc=ctx.createOscillator(),amp=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(40,freq),start);
    if(to)osc.frequency.exponentialRampToValueAtTime(Math.max(40,to),end);
    amp.gain.setValueAtTime(.0001,start);amp.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),start+.012);amp.gain.exponentialRampToValueAtTime(.0001,end);
    osc.connect(amp);amp.connect(ctx.destination);osc.start(start);osc.stop(end+.025);
  }
  function soundFx(name){
    if(!data.sound)return;
    const n=Date.now();
    if(name==='tap'&&n-audioState.lastTapAt<45)return;
    if(name==='tap')audioState.lastTapAt=n;
    const seq=(notes)=>notes.forEach(([f,d,delay,type='sine',gain=.02,to=null])=>tone(f,d,{delay,type,gain,to}));
    if(name==='tap') return seq([[360,.045,0,'sine',.008,430]]);
    if(name==='start') return seq([[392,.07,0,'sine',.014,466],[523,.09,.065,'sine',.017,587]]);
    if(name==='correct') return seq([[620,.065,0,'sine',.018,700],[860,.095,.055,'sine',.022,940]]);
    if(name==='combo') return seq([[660,.055,0,'sine',.018],[880,.065,.045,'sine',.021],[1100,.11,.095,'sine',.023,1240]]);
    if(name==='wrong') return seq([[205,.095,0,'triangle',.016,155]]);
    if(name==='finish') return seq([[440,.07,0,'sine',.014],[554,.075,.06,'sine',.016],[659,.12,.12,'sine',.018]]);
    if(name==='reward') return seq([[523,.07,0,'sine',.017],[659,.08,.055,'sine',.019],[784,.13,.115,'sine',.022]]);
    if(name==='badge') return seq([[784,.055,0,'sine',.016],[988,.065,.045,'sine',.019],[1175,.14,.105,'sine',.022]]);
    if(name==='record') return seq([[523,.06,0,'sine',.016],[659,.065,.05,'sine',.018],[784,.075,.1,'sine',.02],[1047,.15,.16,'sine',.024]]);
    if(name==='level') return seq([[440,.055,0,'sine',.015],[554,.06,.045,'sine',.017],[659,.07,.09,'sine',.019],[880,.16,.15,'sine',.024]]);
    if(name==='coach') return seq([[392,.055,0,'sine',.014],[523,.06,.045,'sine',.016],[659,.07,.09,'sine',.018],[784,.14,.145,'sine',.021]]);
  }

  document.addEventListener('pointerdown',()=>ensureAudio(),{passive:true});

  feedback=function(ok){soundFx(ok?(current.combo>=5?'combo':'correct'):'wrong');haptic(ok?12:35)};

  const coreToggleSetting=toggleSetting;
  toggleSetting=function(key){
    coreToggleSetting(key);
    if(key==='sound'&&data.sound){ensureAudio();soundFx('reward')}
  };

  const coreStartGame=startGame;
  startGame=function(...args){soundFx('start');return coreStartGame(...args)};

  document.addEventListener('click',e=>{
    const el=e.target.closest?.('button,.game-card,.nav-item,.icon-button,.mini-button,.switch,select');
    if(!el||el.disabled||el.matches('.answer,.odd-cell,.tile'))return;
    soundFx('tap');
  });
'''
replace(
    'pro.js',
    "  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));\n",
    "  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));\n" + audio_block,
    1,
)

replace(
    'pro.js',
    "    const snapshot={mode:current.mode,score:current.score,acc:current.total?Math.round(current.correct/current.total*100):0,speed:speedScore(),difficulty:effectiveDifficulty(current.mode)};\n    const wasCoach=coachState.active;\n    coreFinishGame();",
    "    const snapshot={mode:current.mode,score:current.score,acc:current.total?Math.round(current.correct/current.total*100):0,speed:speedScore(),difficulty:effectiveDifficulty(current.mode)};\n    const wasCoach=coachState.active,beforeLevel=level(),beforeBadges=data.badges.length,beforeBest=data.best[current.mode]||0,beforeDailyReward=!!data.dailyReward;\n    coreFinishGame();\n    if(level()>beforeLevel)soundFx('level');\n    else if(data.badges.length>beforeBadges)soundFx('badge');\n    else if((data.best[current.mode]||0)>beforeBest)soundFx('record');\n    else if(!beforeDailyReward&&data.dailyReward)soundFx('reward');\n    else setTimeout(()=>soundFx('finish'),120);"
)

replace(
    'pro.js',
    "    coreCompleteQuickChallenge();\n    pushHistory({type:'quick',mode:'quick',score:brain,acc:Math.round(avgAcc),speed:Math.round(avgSpeed),difficulty:0});",
    "    const beforeLevel=level(),beforeBadges=data.badges.length;\n    coreCompleteQuickChallenge();\n    if(level()>beforeLevel)soundFx('level');else if(data.badges.length>beforeBadges)soundFx('badge');else soundFx('reward');\n    pushHistory({type:'quick',mode:'quick',score:brain,acc:Math.round(avgAcc),speed:Math.round(avgSpeed),difficulty:0});"
)

replace(
    'pro.js',
    "  function renderCoachSummary(){\n    coachState.active=false;",
    "  function renderCoachSummary(){\n    coachState.active=false;setTimeout(()=>soundFx('coach'),120);"
)

replace('sw.js', 'brain-shift-v1.2.0', 'brain-shift-v1.2.1')
replace('package.json', '"version": "1.2.0"', '"version": "1.2.1"')
replace('tests/quality-check.mjs', '/APP_VERSION="1\\.2\\.0"/', '/APP_VERSION="1\\.2\\.1"/')
replace(
    'tests/quality-check.mjs',
    "assert.match(sw, /SKIP_WAITING/, 'Service worker update hook missing');",
    "assert.match(sw, /SKIP_WAITING/, 'Service worker update hook missing');\nassert.match(pro, /function soundFx/, 'Interactive sound engine missing');\nassert.match(pro, /AudioContext|webkitAudioContext/, 'Web Audio support missing');"
)

p = Path('CHANGELOG.md')
s = p.read_text()
marker = '# Changelog\n\n'
section = '''## 1.2.1 — Interactive sound polish

- Added a custom Brain Shift sound identity generated with Web Audio.
- Added soft UI selection sounds, start cues, correct/error feedback and combo feedback.
- Added distinct reward cues for badges, records, level-ups, quick challenges and Coach NOVELYX completion.
- Sound is enabled for the new audio-design migration and remains fully optional from Settings.
- No external audio assets: offline, lightweight and license-free.

'''
if '## 1.2.1 — Interactive sound polish' not in s:
    p.write_text(s.replace(marker, marker + section, 1))
