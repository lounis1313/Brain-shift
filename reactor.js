(() => {
  'use strict';

  const REACTOR_VERSION = '1.4.0';
  const REACTOR_ROUNDS = 6;
  const COLORS = [
    {key:'cyan',name:'CYAN',hex:'#52dcff'},
    {key:'rose',name:'ROSE',hex:'#ff6aa9'},
    {key:'lime',name:'VERT',hex:'#63e6a5'},
    {key:'gold',name:'OR',hex:'#ffd166'},
    {key:'violet',name:'VIOLET',hex:'#a783ff'}
  ];
  const SHAPES = [
    {key:'circle',name:'CERCLE'},
    {key:'square',name:'CARRÉ'},
    {key:'triangle',name:'TRIANGLE'},
    {key:'diamond',name:'LOSANGE'}
  ];

  MODES.reactor={title:'Shift Reactor',rounds:REACTOR_ROUNDS};
  modeNames.reactor='Shift Reactor';
  MODE_HELP.reactor='Alimente le réacteur en touchant uniquement les éléments qui respectent la règle active. Plus le niveau monte, plus les règles se combinent et peuvent changer en pleine manche.';
  BADGES.reactor={icon:'⚛',title:'Réacteur stable',desc:'Atteindre 85 % à Shift Reactor en difficulté Difficile ou supérieure.'};
  defaultData.best.reactor=0;
  data.best.reactor ??= 0;
  data.modeStats.reactor ??= {plays:0,quickLegs:0,correct:0,total:0,totalScore:0,quickScore:0,bestCombo:0,bestSpeed:0};
  data.recent.reactor ??= [];
  saveData();

  const reactorState={stage:0,stages:1,hits:0,targetTotal:0,rule:null,tokens:[],stageStartedAt:0};

  const oldModeIcon=modeIcon;
  modeIcon=function(mode){
    if(mode!=='reactor') return oldModeIcon(mode);
    return '<svg class="ui-icon reactor-tutorial-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8"/><circle cx="12" cy="12" r="7"/></svg>';
  };

  function injectReactorCard(){
    const grid=document.querySelector('.game-grid');
    if(!grid||grid.querySelector('[data-mode="reactor"]'))return;
    const card=document.createElement('button');
    card.className='game-card reactor';
    card.dataset.mode='reactor';
    card.innerHTML=`
      <span class="reactor-ribbon">SIGNATURE</span>
      <span class="game-icon reactor-card-icon"><span class="reactor-mini-core"><i></i></span></span>
      <span class="game-copy"><strong>Shift Reactor</strong><small>Adapte-toi à la règle</small></span>
      <span class="game-meta"><span class="mode-diff" id="diff-reactor">Auto</span><span class="record-mini"><b id="best-reactor">0</b><small>record</small></span></span>`;
    card.addEventListener('click',()=>requestStartGame('reactor'));
    grid.append(card);
  }

  function makeToken(){
    return {color:COLORS[rnd(0,COLORS.length-1)],shape:SHAPES[rnd(0,SHAPES.length-1)],num:rnd(1,9)};
  }
  function tokenSig(t){return `${t.color.key}:${t.shape.key}:${t.num}`}

  function makeRule(d){
    const c=COLORS[rnd(0,COLORS.length-1)],s=SHAPES[rnd(0,SHAPES.length-1)],parity=Math.random()<.5?'pair':'impair';
    const isParity=t=>parity==='pair'?t.num%2===0:t.num%2===1;
    let pool=[];
    if(d===1){
      pool=[
        {sig:`color:${c.key}`,label:`${c.name}`,hint:'touche cette couleur',test:t=>t.color.key===c.key},
        {sig:`shape:${s.key}`,label:`${s.name}`,hint:'touche cette forme',test:t=>t.shape.key===s.key}
      ];
    }else if(d===2){
      pool=[
        {sig:`both:${c.key}:${s.key}`,label:`${c.name} + ${s.name}`,hint:'les deux critères doivent être vrais',test:t=>t.color.key===c.key&&t.shape.key===s.key},
        {sig:`either:${c.key}:${s.key}`,label:`${c.name} OU ${s.name}`,hint:'un seul critère suffit',test:t=>t.color.key===c.key||t.shape.key===s.key}
      ];
    }else if(d===3){
      pool=[
        {sig:`parity:${parity}`,label:parity==='pair'?'NOMBRES PAIRS':'NOMBRES IMPAIRS',hint:'observe aussi le chiffre',test:isParity},
        {sig:`color-not:${c.key}:${s.key}`,label:`${c.name} SANS ${s.name}`,hint:`${c.name}, mais jamais ${s.name}`,test:t=>t.color.key===c.key&&t.shape.key!==s.key},
        {sig:`shape-parity:${s.key}:${parity}`,label:`${s.name} + ${parity.toUpperCase()}`,hint:'forme et chiffre doivent correspondre',test:t=>t.shape.key===s.key&&isParity(t)}
      ];
    }else if(d===4){
      pool=[
        {sig:`color-parity:${c.key}:${parity}`,label:`${c.name} + ${parity.toUpperCase()}`,hint:'couleur et chiffre doivent correspondre',test:t=>t.color.key===c.key&&isParity(t)},
        {sig:`shape-notcolor:${s.key}:${c.key}`,label:`${s.name} SAUF ${c.name}`,hint:`${s.name}, mais pas en ${c.name}`,test:t=>t.shape.key===s.key&&t.color.key!==c.key},
        {sig:`either-parity:${c.key}:${s.key}:${parity}`,label:`(${c.name} OU ${s.name}) + ${parity.toUpperCase()}`,hint:'combine choix visuel et chiffre',test:t=>(t.color.key===c.key||t.shape.key===s.key)&&isParity(t)}
      ];
    }else{
      pool=[
        {sig:`xor:${c.key}:${s.key}`,label:`${c.name} XOR ${s.name}`,hint:'exactement un des deux critères, jamais les deux',test:t=>(t.color.key===c.key)!==(t.shape.key===s.key)},
        {sig:`triple:${c.key}:${s.key}:${parity}`,label:`${c.name} + ${s.name} + ${parity.toUpperCase()}`,hint:'trois critères simultanés',test:t=>t.color.key===c.key&&t.shape.key===s.key&&isParity(t)},
        {sig:`notcolor-parity:${c.key}:${parity}`,label:`PAS ${c.name} + ${parity.toUpperCase()}`,hint:'inhibition + parité',test:t=>t.color.key!==c.key&&isParity(t)}
      ];
    }
    return pool[rnd(0,pool.length-1)];
  }

  function freshRule(d){
    return chooseFresh('reactor',()=>makeRule(d),r=>r.sig);
  }

  function buildField(rule,d){
    const wanted=d>=5?2+rnd(0,1):3;
    const used=new Set(),targets=[],distractors=[];
    let guard=0;
    while(targets.length<wanted&&guard++<1000){const t=makeToken(),sig=tokenSig(t);if(!used.has(sig)&&rule.test(t)){used.add(sig);targets.push({...t,target:true})}}
    guard=0;
    const total=d<=2?9:d<=4?10:12;
    while(distractors.length<total-targets.length&&guard++<1800){const t=makeToken(),sig=tokenSig(t);if(!used.has(sig)&&!rule.test(t)){used.add(sig);distractors.push({...t,target:false})}}
    if(targets.length<wanted){
      const fallback={sig:'fallback',label:'CYAN',hint:'touche cette couleur',test:t=>t.color.key==='cyan'};
      return buildField(fallback,1);
    }
    return shuffle([...targets,...distractors]);
  }

  function shapeMarkup(t,d,index){
    const number=d>=3?`<b>${t.num}</b>`:'';
    return `<button class="reactor-orb" data-index="${index}" data-target="${t.target}" aria-label="${t.color.name.toLowerCase()} ${t.shape.name.toLowerCase()}${d>=3?' '+t.num:''}" style="--orb:${t.color.hex};--delay:${(index%6)*-.17}s;--drift:${(index%2?1:-1)*(2+(index%3))}px"><span class="reactor-symbol shape-${t.shape.key}">${number}</span></button>`;
  }

  function stageCountFor(d){
    if(d<=2)return 1;
    if(d===3)return current.round%2===0?2:1;
    return 2;
  }

  function reactorPing(step=1){
    if(!data.sound)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      const ctx=new Ctx(),o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine';o.frequency.setValueAtTime(390+step*90,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(540+step*120,ctx.currentTime+.07);
      g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.025,ctx.currentTime+.008);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.085);
      o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.09);setTimeout(()=>ctx.close().catch(()=>{}),180);
    }catch{}
  }

  function updateEnergy(){
    const pct=reactorState.targetTotal?reactorState.hits/reactorState.targetTotal*100:0;
    const meter=document.getElementById('reactorEnergyFill'),count=document.getElementById('reactorEnergyCount'),core=document.querySelector('.reactor-core');
    if(meter)meter.style.width=`${pct}%`;if(count)count.textContent=`${reactorState.hits}/${reactorState.targetTotal}`;
    if(core)core.style.setProperty('--energy',`${pct}%`);
  }

  function showShiftTransition(){
    stopTimer();
    const stage=document.getElementById('playStage');if(!stage)return;
    stage.innerHTML=`<div class="reactor-shift-screen"><div class="shift-rings"><i></i><i></i><i></i></div><span>SHIFT</span><strong>Nouvelle règle</strong><small>Reconfigure ton attention</small></div>`;
    reactorPing(4);
    safeTimeout(()=>reactorStage(),520);
  }

  function failStage(button=null){
    if(current.locked)return;current.locked=true;stopTimer();record(false);addSpeedSample(0);current.combo=0;
    if(button)button.classList.add('overload');
    document.querySelectorAll('.reactor-orb').forEach(b=>{b.disabled=true;if(b.dataset.target==='true')b.classList.add('target-reveal')});
    document.querySelector('.reactor-core')?.classList.add('core-overload');
    feedback(false);safeTimeout(nextRound,820);
  }

  function completeStage(){
    if(current.locked)return;current.locked=true;const sp=speedFraction();stopTimer();record(true);addSpeedSample(sp);current.combo++;current.maxCombo=Math.max(current.maxCombo,current.combo);
    setScore((115+reactorState.targetTotal*34+current.combo*12)*difficultyBonus('reactor')*(1+.42*sp));
    document.querySelector('.reactor-core')?.classList.add('core-charged');feedback(true);
    if(reactorState.stage<reactorState.stages-1){reactorState.stage++;safeTimeout(showShiftTransition,460)}else safeTimeout(nextRound,620);
  }

  function reactorStage(){
    const d=effectiveDifficulty('reactor');current.locked=false;reactorState.hits=0;reactorState.rule=freshRule(d);reactorState.tokens=buildField(reactorState.rule,d);reactorState.targetTotal=reactorState.tokens.filter(t=>t.target).length;reactorState.stageStartedAt=performance.now();
    const stageNo=reactorState.stage+1,showNums=d>=3;
    $('playStage').innerHTML=`
      <div class="reactor-wrap">
        <div class="reactor-rule glass">
          <div class="reactor-rule-copy"><span class="reactor-kicker">RÈGLE ACTIVE · ${stageNo}/${reactorState.stages}</span><strong>${reactorState.rule.label}</strong><small>${reactorState.rule.hint}</small></div>
          <span class="reactor-level">${DIFF_NAMES[d]}</span>
        </div>
        <div class="reactor-energy-row"><span>ÉNERGIE</span><div class="reactor-energy-track"><i id="reactorEnergyFill"></i></div><b id="reactorEnergyCount">0/${reactorState.targetTotal}</b></div>
        <div class="reactor-chamber">
          <div class="reactor-core" aria-hidden="true"><span class="core-a"></span><span class="core-b"></span><i></i></div>
          <div class="reactor-field ${showNums?'with-numbers':''}">${reactorState.tokens.map((t,i)=>shapeMarkup(t,d,i)).join('')}</div>
        </div>
        <div class="reactor-foot"><span>⚡ Touche uniquement les bonnes cibles</span><span>${reactorState.stages>1?'La règle peut SHIFT en pleine manche':'Reste précis'}</span></div>
      </div>`;
    document.querySelectorAll('.reactor-orb').forEach(btn=>btn.onclick=()=>{
      if(current.locked||btn.disabled)return;
      if(btn.dataset.target!=='true'){failStage(btn);return}
      btn.disabled=true;btn.classList.add('hit');reactorState.hits++;setScore(14*d);reactorPing(reactorState.hits);haptic(8);updateEnergy();
      if(reactorState.hits>=reactorState.targetTotal)completeStage();
    });
    runTimer([0,9800,9000,7900,6900,6000][d],()=>failStage());
  }

  const previousStartGame=startGame;
  startGame=function(mode,...args){
    if(mode==='reactor'){reactorState.stage=0;reactorState.stages=1;reactorState.hits=0}
    return previousStartGame(mode,...args);
  };

  const previousNextRound=nextRound;
  nextRound=function(){
    if(current.mode!=='reactor'||current.quick)return previousNextRound();
    current.locked=false;
    if(current.round>=REACTOR_ROUNDS){finishGame();return}
    current.round++;reactorState.stage=0;reactorState.stages=stageCountFor(effectiveDifficulty('reactor'));
    $('roundLabel').textContent=`RÉACTEUR ${current.round}/${REACTOR_ROUNDS}`;
    reactorStage();
  };

  const previousUnlockBadges=unlockBadges;
  unlockBadges=function(acc){
    previousUnlockBadges(acc);
    if(current.mode==='reactor'&&acc>=85&&effectiveDifficulty('reactor')>=3&&!data.badges.includes('reactor')){
      data.badges.push('reactor');showToast('⚛ Badge Réacteur stable débloqué !');
    }
  };

  injectReactorCard();
  updateHome();
  document.querySelectorAll('.app-version').forEach(x=>x.textContent=REACTOR_VERSION.replace(/\.0$/,''));
})();