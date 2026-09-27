(() => {
  'use strict';

  const PRO_VERSION = '1.3.0';
  const modeOrder = ['memory','math','odd','sequence','stroop'];
  const modeLabels = {memory:'Mémoire', math:'Calcul', odd:'Observation', sequence:'Logique', stroop:'Attention'};
  const modeIcons = {memory:'🧠', math:'∑', odd:'◉', sequence:'◇', stroop:'◎'};
  const coachState = {active:false,index:0,plan:[],results:[]};

  if (!Array.isArray(data.history)) data.history = [];
  if (!data.pro) data.pro = {version:PRO_VERSION, firstSeenAt:new Date().toISOString()};
  data.pro.version = PRO_VERSION;
  data.pro.soundDesignVersion='3';

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));


  // --- Brain Shift playful sound identity -----------------------------------------
  // Web Audio only: lightweight, offline, license-free and intentionally game-like.
  const audioState={ctx:null,lastTapAt:0,master:null};
  function ensureAudio(){
    if(!data.sound)return null;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    try{
      if(!audioState.ctx){
        audioState.ctx=new Ctx();
        audioState.master=audioState.ctx.createGain();
        audioState.master.gain.value=.78;
        audioState.master.connect(audioState.ctx.destination);
      }
      if(audioState.ctx.state==='suspended')audioState.ctx.resume().catch(()=>{});
      return audioState.ctx;
    }catch{return null}
  }
  function panNode(ctx,pan=0){
    if(ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=pan;return p}
    return ctx.createGain();
  }
  function tone(freq,duration=.08,{delay=0,type='sine',gain=.024,to=null,pan=0,attack=.008,filter=0,detune=0}={}){
    const ctx=ensureAudio();if(!ctx)return;
    const start=ctx.currentTime+delay,end=start+duration;
    const osc=ctx.createOscillator(),amp=ctx.createGain(),p=panNode(ctx,pan);
    osc.type=type;osc.detune.value=detune;osc.frequency.setValueAtTime(Math.max(45,freq),start);
    if(to)osc.frequency.exponentialRampToValueAtTime(Math.max(45,to),end);
    let source=osc;
    if(filter){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=filter;osc.connect(f);source=f}
    source.connect(amp);amp.connect(p);p.connect(audioState.master||ctx.destination);
    amp.gain.setValueAtTime(.0001,start);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),start+attack);
    amp.gain.exponentialRampToValueAtTime(.0001,end);
    osc.start(start);osc.stop(end+.03);
  }
  function noise(duration=.045,{delay=0,gain=.008,pan=0,highpass=1800}={}){
    const ctx=ensureAudio();if(!ctx)return;
    const len=Math.max(1,Math.floor(ctx.sampleRate*duration)),buf=ctx.createBuffer(1,len,ctx.sampleRate),ch=buf.getChannelData(0);
    for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*(1-i/len);
    const src=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),amp=ctx.createGain(),p=panNode(ctx,pan),start=ctx.currentTime+delay;
    src.buffer=buf;hp.type='highpass';hp.frequency.value=highpass;amp.gain.setValueAtTime(gain,start);amp.gain.exponentialRampToValueAtTime(.0001,start+duration);
    src.connect(hp);hp.connect(amp);amp.connect(p);p.connect(audioState.master||ctx.destination);src.start(start);
  }
  function pluck(freq,{delay=0,gain=.02,pan=0,bright=false}={}){
    tone(freq,.095,{delay,type:'triangle',gain,pan,filter:bright?5200:3600,to:freq*.985,attack:.004});
    tone(freq*2,.06,{delay:.006+delay,type:'sine',gain:gain*.34,pan:-pan,attack:.003});
  }
  function bubble(freq,{delay=0,gain=.016,pan=0}={}){
    tone(freq,.07,{delay,type:'sine',gain,pan,to:freq*1.55,attack:.003});
    noise(.018,{delay,gain:gain*.22,pan,highpass:2600});
  }
  function sparkle({delay=0,gain=.012}={}){
    [0,.035,.075,.115].forEach((d,i)=>pluck([1175,1397,1568,1760][i],{delay:delay+d,gain:gain*(1-i*.1),pan:i%2? .35:-.35,bright:true}));
  }
  function soundFx(name){
    if(!data.sound)return;
    const n=Date.now();
    if(name==='tap'&&n-audioState.lastTapAt<55)return;
    if(name==='tap')audioState.lastTapAt=n;

    if(name==='tap'){
      bubble(310,{gain:.008});
      return;
    }
    if(name==='start'){
      bubble(330,{gain:.012,pan:-.12});
      bubble(494,{delay:.075,gain:.015,pan:.12});
      pluck(659,{delay:.145,gain:.011,bright:true});
      return;
    }
    if(name==='correct'){
      pluck(659,{gain:.018,pan:-.08,bright:true});
      pluck(988,{delay:.052,gain:.021,pan:.1,bright:true});
      bubble(784,{delay:.015,gain:.007});
      return;
    }
    if(name==='combo'){
      [659,784,988,1319].forEach((f,i)=>pluck(f,{delay:i*.045,gain:.016+i*.002,pan:(i-1.5)*.12,bright:true}));
      sparkle({delay:.16,gain:.007});
      return;
    }
    if(name==='wrong'){
      bubble(260,{gain:.013,pan:-.05});
      tone(220,.16,{delay:.025,type:'triangle',gain:.014,to:118,pan:.06,filter:1500,attack:.005});
      noise(.04,{delay:.02,gain:.0035,highpass:900});
      return;
    }
    if(name==='finish'){
      pluck(523,{gain:.013,pan:-.18});pluck(659,{delay:.055,gain:.014});pluck(784,{delay:.11,gain:.016,pan:.18});
      tone(1047,.17,{delay:.16,type:'sine',gain:.011,attack:.01});
      return;
    }
    if(name==='reward'){
      bubble(523,{gain:.012,pan:-.18});bubble(659,{delay:.045,gain:.013});bubble(784,{delay:.09,gain:.014,pan:.18});
      sparkle({delay:.13,gain:.009});
      return;
    }
    if(name==='badge'){
      pluck(784,{gain:.016,pan:-.18,bright:true});pluck(988,{delay:.05,gain:.018,pan:.1,bright:true});
      tone(1568,.22,{delay:.1,type:'sine',gain:.015,attack:.01});sparkle({delay:.11,gain:.01});
      return;
    }
    if(name==='record'){
      [523,659,784,1047,1319].forEach((f,i)=>pluck(f,{delay:i*.042,gain:.014+i*.0018,pan:(i-2)*.12,bright:true}));
      sparkle({delay:.21,gain:.011});
      tone(1568,.2,{delay:.22,type:'sine',gain:.012,attack:.008});
      return;
    }
    if(name==='level'){
      [392,494,587,659,784,988].forEach((f,i)=>pluck(f,{delay:i*.038,gain:.012+i*.0018,pan:(i%2?1:-1)*.18,bright:true}));
      sparkle({delay:.23,gain:.011});
      return;
    }
    if(name==='coach'){
      [392,494,587].forEach((f,i)=>pluck(f,{delay:i*.055,gain:.013,pan:(i-1)*.16}));
      [523,659,784].forEach((f,i)=>pluck(f,{delay:.19+i*.035,gain:.015,pan:(1-i)*.12,bright:true}));
      sparkle({delay:.29,gain:.008});
      return;
    }
  }

  document.addEventListener('pointerdown',()=>ensureAudio(),{passive:true});

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

  function skillSnapshot(mode){
    const st=data.modeStats?.[mode]||{};
    const exposure=(st.plays||0)+(st.quickLegs||0);
    const accuracy=st.total ? (st.correct/st.total)*100 : 50;
    const speed=st.bestSpeed||45;
    const difficulty=((effectiveDifficulty(mode)-1)/4)*100;
    const confidence=clamp(exposure/8,0,1);
    const raw=accuracy*.62+speed*.23+difficulty*.15;
    const score=Math.round(50*(1-confidence)+raw*confidence);
    return {mode,score:clamp(score,0,100),accuracy:Math.round(accuracy),speed:Math.round(speed),exposure,difficulty:effectiveDifficulty(mode)};
  }

  function allSkills(){return modeOrder.map(skillSnapshot)}
  function coachPlan(){
    const skills=allSkills();
    const practiced=skills.filter(s=>s.exposure>0).sort((a,b)=>a.score-b.score);
    if(practiced.length>=3) return practiced.slice(0,3).map(s=>s.mode);
    const day=Math.floor(Date.now()/86400000)%modeOrder.length;
    return [0,1,2].map(i=>modeOrder[(day+i)%modeOrder.length]);
  }

  function masteryLabel(score){
    if(score>=88)return 'Excellent';
    if(score>=75)return 'Solide';
    if(score>=62)return 'En progression';
    if(score>=48)return 'À renforcer';
    return 'À découvrir';
  }

  function injectCoachCard(){
    if(document.getElementById('proCoach'))return;
    const home=document.getElementById('homeView');
    const firstSection=home?.querySelector('.section-block');
    if(!home||!firstSection)return;
    const card=document.createElement('section');
    card.id='proCoach';
    card.className='pro-coach glass';
    firstSection.before(card);
    refreshCoachCard();
  }

  function refreshCoachCard(){
    const card=document.getElementById('proCoach'); if(!card)return;
    const plan=coachPlan();
    const skills=Object.fromEntries(allSkills().map(x=>[x.mode,x]));
    card.innerHTML=`
      <div class="pro-coach-head">
        <div><span class="eyebrow">COACH NOVELYX</span><h2>Ton entraînement conseillé</h2><p>Un programme court construit à partir de tes performances récentes.</p></div>
        <span class="coach-badge">PERSONNALISÉ</span>
      </div>
      <div class="coach-plan">${plan.map((m,i)=>`<div class="coach-step"><b>${i+1}</b><span><strong>${modeLabels[m]}</strong><small>${masteryLabel(skills[m].score)} · ${skills[m].score}/100</small></span></div>`).join('')}</div>
      <div class="coach-actions"><button class="button primary" id="coachStartBtn">Lancer le programme</button><span>3 jeux · 3 manches chacun</span></div>`;
    document.getElementById('coachStartBtn').onclick=()=>startCoach(plan);
  }

  function startCoach(plan=coachPlan()){
    coachState.active=true;coachState.index=0;coachState.plan=[...plan];coachState.results=[];
    showToast('Coach NOVELYX : programme lancé');
    startGame(coachState.plan[0]);
  }

  const coreNextRound=nextRound;
  nextRound=function(){
    if(!coachState.active)return coreNextRound();
    current.locked=false;
    const limit=3;
    if(current.round>=limit){finishGame();return}
    current.round++;
    $('roundLabel').textContent=`COACH ${coachState.index+1}/3 · MANCHE ${current.round}/${limit}`;
    if(current.mode==='memory')memoryRound();
    if(current.mode==='math')mathRound();
    if(current.mode==='odd')oddRound();
    if(current.mode==='sequence')sequenceRound();
    if(current.mode==='stroop')stroopRound();
    updateGameChrome();
  };

  function pushHistory(entry){
    data.history.push({...entry,at:new Date().toISOString()});
    if(data.history.length>120)data.history=data.history.slice(-120);
    saveData();
  }

  const coreFinishGame=finishGame;
  finishGame=function(){
    if(current.quick)return coreFinishGame();
    const snapshot={mode:current.mode,score:current.score,acc:current.total?Math.round(current.correct/current.total*100):0,speed:speedScore(),difficulty:effectiveDifficulty(current.mode)};
    const wasCoach=coachState.active,beforeLevel=level(),beforeBadges=data.badges.length,beforeBest=data.best[current.mode]||0,beforeDailyReward=!!data.dailyReward;
    coreFinishGame();
    if(level()>beforeLevel)soundFx('level');
    else if(data.badges.length>beforeBadges)soundFx('badge');
    else if((data.best[current.mode]||0)>beforeBest)soundFx('record');
    else if(!beforeDailyReward&&data.dailyReward)soundFx('reward');
    else setTimeout(()=>soundFx('finish'),120);
    pushHistory({type:wasCoach?'coach-leg':'game',...snapshot});
    refreshProUI();
    if(!wasCoach)return;

    coachState.results.push(snapshot);
    const last=coachState.index>=coachState.plan.length-1;
    if(last){renderCoachSummary();return}
    const nextMode=coachState.plan[coachState.index+1];
    const main=$('resultMainBtn'),home=$('resultHomeBtn');
    if(main){main.textContent=`Suivant · ${modeLabels[nextMode]}`;main.onclick=()=>{coachState.index++;startGame(nextMode)}}
    if(home){home.textContent='Arrêter';home.onclick=()=>{coachState.active=false;showView('homeView');refreshProUI()}}
  };

  function renderCoachSummary(){
    coachState.active=false;setTimeout(()=>soundFx('coach'),120);
    const avgAcc=Math.round(coachState.results.reduce((s,x)=>s+x.acc,0)/coachState.results.length);
    const avgSpeed=Math.round(coachState.results.reduce((s,x)=>s+x.speed,0)/coachState.results.length);
    const avgScore=Math.round(coachState.results.reduce((s,x)=>s+x.score,0)/coachState.results.length);
    $('roundLabel').textContent='COACH NOVELYX';
    $('gameTitle').textContent='Programme terminé';
    $('gameDifficulty').textContent='Analyse personnalisée';
    $('playStage').innerHTML=`<div class="result-card pro-summary"><div class="result-icon">✦</div><span class="eyebrow">PROGRAMME TERMINÉ</span><h2>Bonne séance.</h2><p>Tu as travaillé trois capacités différentes avec une difficulté adaptée à ton profil.</p><div class="result-metrics"><div><strong>${avgScore}</strong><span>score moyen</span></div><div><strong>${avgAcc}%</strong><span>précision</span></div><div><strong>${avgSpeed}%</strong><span>rapidité</span></div></div><div class="coach-summary-list">${coachState.results.map(x=>`<span>${modeLabels[x.mode]} <b>${x.acc}%</b></span>`).join('')}</div><div class="hero-actions" style="justify-content:center"><button class="button primary" id="coachAgain">Nouveau programme</button><button class="button secondary" id="coachHome">Accueil</button></div></div>`;
    $('coachAgain').onclick=()=>startCoach();$('coachHome').onclick=()=>showView('homeView');
  }

  const coreCompleteQuickChallenge=completeQuickChallenge;
  completeQuickChallenge=function(){
    const avgAcc=current.quickScores.length?current.quickScores.reduce((a,b)=>a+b.acc,0)/current.quickScores.length:0;
    const avgSpeed=current.quickScores.length?current.quickScores.reduce((a,b)=>a+b.speed,0)/current.quickScores.length:0;
    const brain=Math.min(100,Math.round(avgAcc*.75+avgSpeed*.25));
    const beforeLevel=level(),beforeBadges=data.badges.length;
    coreCompleteQuickChallenge();
    if(level()>beforeLevel)soundFx('level');else if(data.badges.length>beforeBadges)soundFx('badge');else soundFx('reward');
    pushHistory({type:'quick',mode:'quick',score:brain,acc:Math.round(avgAcc),speed:Math.round(avgSpeed),difficulty:0});
    refreshProUI();
  };

  function injectSkillProfile(){
    const stats=document.getElementById('statsView');if(!stats||document.getElementById('proSkillProfile'))return;
    const records=stats.querySelector('.modes-stats');
    const card=document.createElement('article');card.id='proSkillProfile';card.className='glass pro-skills';
    records?.before(card);
    refreshSkillProfile();
  }

  function refreshSkillProfile(){
    const box=document.getElementById('proSkillProfile');if(!box)return;
    const skills=allSkills();
    const avg=Math.round(skills.reduce((s,x)=>s+x.score,0)/skills.length);
    box.innerHTML=`<div class="card-head"><div><span class="eyebrow">PROFIL COGNITIF</span><h3>Équilibre des compétences</h3></div><strong class="skill-global">${avg}/100</strong></div><p class="pro-note">Indice ludique basé sur précision, rapidité et niveau atteint. Ce n’est pas une mesure clinique.</p><div class="skill-list">${skills.map(s=>`<div class="skill-row"><div class="skill-label"><span>${modeIcons[s.mode]} ${modeLabels[s.mode]}</span><b>${s.score}</b></div><div class="skill-track"><i style="width:${s.score}%"></i></div><small>${s.exposure?`${s.accuracy}% précision · ${DIFF_NAMES[s.difficulty]}`:'Pas encore assez de données'}</small></div>`).join('')}</div>`;
  }

  function injectWeekly(){
    const stats=document.getElementById('statsView');if(!stats||document.getElementById('proWeekly'))return;
    const card=document.createElement('article');card.id='proWeekly';card.className='glass pro-weekly';
    stats.append(card);refreshWeekly();
  }

  function refreshWeekly(){
    const box=document.getElementById('proWeekly');if(!box)return;
    const now=Date.now(),week=data.history.filter(x=>now-new Date(x.at).getTime()<7*86400000);
    const sessions=week.length;
    const avgAcc=sessions?Math.round(week.reduce((s,x)=>s+(x.acc||0),0)/sessions):0;
    const avgSpeed=sessions?Math.round(week.reduce((s,x)=>s+(x.speed||0),0)/sessions):0;
    const days=[6,5,4,3,2,1,0].map(back=>{
      const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-back);
      const key=dayKey(d);const count=week.filter(x=>dayKey(new Date(x.at))===key).length;
      return {key,count,label:new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(d).replace('.','')};
    });
    const max=Math.max(1,...days.map(d=>d.count));
    box.innerHTML=`<div class="card-head"><div><span class="eyebrow">7 DERNIERS JOURS</span><h3>Régularité</h3></div><span class="weekly-kpi">${sessions} session${sessions===1?'':'s'}</span></div><div class="week-bars">${days.map(d=>`<div class="day-bar"><i style="height:${Math.max(8,d.count/max*100)}%" data-empty="${d.count===0}"></i><span>${d.label}</span></div>`).join('')}</div><div class="week-metrics"><span><b>${sessions?avgAcc+'%':'—'}</b> précision</span><span><b>${sessions?avgSpeed+'%':'—'}</b> rapidité</span><span><b>${data.streak||0}</b> jour${data.streak===1?'':'s'} de série</span></div>`;
  }

  function injectGameChrome(){
    const shell=document.querySelector('.game-shell');if(!shell||document.getElementById('proRoundProgress'))return;
    const timer=document.querySelector('.timer-track');
    const wrap=document.createElement('div');wrap.id='proRoundProgress';wrap.className='pro-round-progress';
    timer?.before(wrap);updateGameChrome();
  }

  function updateGameChrome(){
    const wrap=document.getElementById('proRoundProgress');if(!wrap||!current.mode)return;
    const limit=coachState.active?3:(current.quick?1:MODES[current.mode].rounds);
    const round=Math.min(current.round,limit);
    wrap.innerHTML=`<span>${modeLabels[current.mode]||modeNames[current.mode]}</span><div class="round-dots">${Array.from({length:limit},(_,i)=>`<i class="${i<round?'done':''} ${i===round-1?'current':''}"></i>`).join('')}</div><b class="combo-chip ${current.combo>=3?'hot':''}">x${current.combo}</b>`;
  }

  const coreSetScore=setScore;
  setScore=function(v){coreSetScore(v);updateGameChrome();scorePulse(v)};
  const coreRecord=record;
  record=function(ok){coreRecord(ok);updateGameChrome();if(!ok)document.body.classList.add('pro-miss');setTimeout(()=>document.body.classList.remove('pro-miss'),180)};

  function scorePulse(value){
    if(!data.anim)return;
    const pill=document.querySelector('.score-pill');if(!pill)return;
    const pop=document.createElement('span');pop.className='score-pop';pop.textContent=`+${Math.max(0,Math.round(value))}`;pill.append(pop);setTimeout(()=>pop.remove(),700);
  }

  function injectNetworkPill(){
    if(document.getElementById('networkPill'))return;
    const actions=document.querySelector('.top-actions');if(!actions)return;
    const pill=document.createElement('span');pill.id='networkPill';pill.className='network-pill';actions.prepend(pill);
    const update=()=>{pill.textContent=navigator.onLine?'En ligne':'Hors ligne';pill.classList.toggle('offline',!navigator.onLine)};
    addEventListener('online',update);addEventListener('offline',update);update();
  }

  function setupPwaUpdates(){
    if(!('serviceWorker' in navigator))return;
    navigator.serviceWorker.getRegistration().then(reg=>{
      if(!reg)return;
      const notify=()=>{
        if(reg.waiting){
          const toast=$('toast');toast.innerHTML='Mise à jour disponible · <button id="proUpdateNow">Actualiser</button>';toast.classList.add('show');
          document.getElementById('proUpdateNow')?.addEventListener('click',()=>reg.waiting.postMessage({type:'SKIP_WAITING'}));
        }
      };
      notify();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',notify)});
    }).catch(()=>{});
    let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
  }

  function refreshProUI(){refreshCoachCard();refreshSkillProfile();refreshWeekly();updateGameChrome()}

  const coreUpdateHome=updateHome;
  updateHome=function(){coreUpdateHome();refreshProUI()};

  injectCoachCard();injectSkillProfile();injectWeekly();injectGameChrome();injectNetworkPill();setupPwaUpdates();
  refreshProUI();saveData();
})();
