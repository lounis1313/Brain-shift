(() => {
  'use strict';

  const ECHO_VERSION='1.5.0';
  const ECHO_ROUNDS=6;
  const PALETTE=[
    {name:'Aqua',hex:'#54e6ff',pitch:523.25},
    {name:'Violet',hex:'#a783ff',pitch:659.25},
    {name:'Rose',hex:'#ff74b8',pitch:783.99},
    {name:'Or',hex:'#ffd166',pitch:880.00},
    {name:'Menthe',hex:'#62e6ad',pitch:987.77},
    {name:'Azur',hex:'#5f91ff',pitch:587.33},
    {name:'Corail',hex:'#ff846b',pitch:698.46},
    {name:'Glace',hex:'#b9f3ff',pitch:1046.50},
    {name:'Lilas',hex:'#d19cff',pitch:1174.66}
  ];

  MODES.echo={title:'Echo Orbit',rounds:ECHO_ROUNDS};
  modeNames.echo='Echo Orbit';
  MODE_HELP.echo='Observe la séquence de satellites qui s’illuminent, puis reproduis-la dans le même ordre. Aux niveaux élevés, les orbites bougent, s’inversent et se reconfigurent après la mémorisation.';
  BADGES.echo={icon:'◌',title:'Mémoire orbitale',desc:'Atteindre 85 % à Echo Orbit en difficulté Difficile ou supérieure.'};
  defaultData.best.echo=0;
  data.best.echo ??= 0;
  data.modeStats.echo ??= {plays:0,quickLegs:0,correct:0,total:0,totalScore:0,quickScore:0,bestCombo:0,bestSpeed:0};
  data.recent.echo ??= [];
  saveData();

  const state={nodes:[],sequence:[],input:[],phase:'idle',rotationShift:0,direction:1,ringCount:1,presentTimers:[]};

  const previousModeIcon=modeIcon;
  modeIcon=function(mode){
    if(mode!=='echo')return previousModeIcon(mode);
    return '<svg class="ui-icon echo-tutorial-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.4"/><ellipse cx="12" cy="12" rx="9" ry="5.6"/><circle cx="5.2" cy="9.4" r="1.4"/><circle cx="18.3" cy="14.6" r="1.4"/></svg>';
  };

  function injectEchoCard(){
    const grid=document.querySelector('.game-grid');
    if(!grid||grid.querySelector('[data-mode="echo"]'))return;
    const card=document.createElement('button');
    card.className='game-card echo-orbit';
    card.dataset.mode='echo';
    card.innerHTML=`
      <span class="echo-ribbon">NOUVEAU</span>
      <span class="game-icon echo-card-icon"><span class="echo-mini-orbit"><i></i><b></b><em></em></span></span>
      <span class="game-copy"><strong>Echo Orbit</strong><small>Mémorise ce qui bouge</small></span>
      <span class="game-meta"><span class="mode-diff" id="diff-echo">Auto</span><span class="record-mini"><b id="best-echo">0</b><small>record</small></span></span>`;
    card.addEventListener('click',()=>requestStartGame('echo'));
    grid.append(card);
  }

  function clearEchoTimers(){
    state.presentTimers.forEach(clearTimeout);state.presentTimers=[];
  }
  function later(fn,ms){const id=setTimeout(fn,ms);state.presentTimers.push(id);return id}

  function echoTone(index,accent=false){
    if(!data.sound)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      const ctx=new Ctx(),o=ctx.createOscillator(),g=ctx.createGain(),p=PALETTE[index%PALETTE.length];
      o.type=accent?'triangle':'sine';o.frequency.setValueAtTime(p.pitch,ctx.currentTime);
      if(accent)o.frequency.exponentialRampToValueAtTime(p.pitch*1.18,ctx.currentTime+.11);
      g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(accent?.032:.022,ctx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+(accent?.18:.13));
      o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+(accent?.19:.14));
      setTimeout(()=>ctx.close().catch(()=>{}),300);
    }catch{}
  }

  function config(d,round){
    const nodeCount=[0,5,6,7,8,9][d];
    const baseLen=[0,3,4,5,6,7][d];
    const sequenceLength=Math.min(nodeCount-1,baseLen+Math.floor((round-1)/3));
    return {
      nodeCount,
      sequenceLength,
      rings:d>=4?2:1,
      pulse:[0,560,500,450,405,360][d],
      recall:[0,10500,9800,9000,8200,7600][d],
      rotate:d>=2,
      reconfigure:d>=4,
      reverse:d>=5|| (d===4&&round>=4)
    };
  }

  function buildNodes(cfg){
    const nodes=[];
    for(let i=0;i<cfg.nodeCount;i++){
      const ring=cfg.rings===2&&i%3===0?2:1;
      const ringMembers=Array.from({length:cfg.nodeCount},(_,x)=>x).filter(x=>(cfg.rings===2&&x%3===0?2:1)===ring);
      const idx=ringMembers.indexOf(i),count=ringMembers.length;
      nodes.push({id:i,ring,angle:(idx/count)*360+(ring===2?28:0),palette:i%PALETTE.length});
    }
    return nodes;
  }

  function buildSequence(cfg){
    return chooseFresh('echo',()=>{
      const seq=[];
      while(seq.length<cfg.sequenceLength){
        const next=rnd(0,cfg.nodeCount-1);
        if(seq[seq.length-1]!==next)seq.push(next);
      }
      return seq;
    },seq=>`${cfg.nodeCount}:${seq.join('-')}`);
  }

  function nodeMarkup(n){
    const p=PALETTE[n.palette],radius=n.ring===2?'31%':'43%';
    return `<button class="echo-satellite ring-${n.ring}" data-node="${n.id}" aria-label="Satellite ${p.name}" style="--angle:${n.angle}deg;--radius:${radius};--echo:${p.hex};--delay:${n.id*-.19}s"><span><i></i></span></button>`;
  }

  function renderArena(cfg){
    const d=effectiveDifficulty('echo');
    const steps=state.sequence.map((_,i)=>`<i class="echo-step" data-step="${i}"></i>`).join('');
    $('playStage').innerHTML=`
      <div class="echo-wrap">
        <div class="echo-head glass">
          <div><span class="echo-kicker">MÉMOIRE ORBITALE</span><strong id="echoInstruction">Observe la séquence</strong><small id="echoSub">${state.sequence.length} impulsions à retenir</small></div>
          <span class="echo-level">${DIFF_NAMES[d]}</span>
        </div>
        <div class="echo-sequence-meter"><span>ÉCHO</span><div class="echo-steps">${steps}</div><b id="echoProgress">0/${state.sequence.length}</b></div>
        <div class="echo-space ${cfg.rings===2?'dual-ring':''} ${cfg.rotate?'is-rotating':''}" id="echoSpace" style="--echo-direction:${state.direction}">
          <div class="echo-stars" aria-hidden="true"></div>
          <div class="echo-ring echo-ring-outer"></div>
          ${cfg.rings===2?'<div class="echo-ring echo-ring-inner"></div>':''}
          <div class="echo-core" aria-hidden="true"><span></span><i></i><b></b></div>
          <div class="echo-satellites" id="echoSatellites">${state.nodes.map(nodeMarkup).join('')}</div>
          <div class="echo-halo" aria-hidden="true"></div>
        </div>
        <div class="echo-foot"><span>${cfg.reconfigure?'Les satellites peuvent changer de position après le signal':'Mémorise l’ordre, pas seulement la position'}</span><span>${cfg.reverse?'↺ inversion possible':'◌ reste concentré'}</span></div>
      </div>`;
    document.querySelectorAll('.echo-satellite').forEach(btn=>btn.disabled=true);
  }

  function setStep(index,stateName){
    const el=document.querySelector(`.echo-step[data-step="${index}"]`);if(!el)return;el.classList.remove('seen','done','bad');if(stateName)el.classList.add(stateName);
  }

  function pulseNode(id,stepIndex){
    document.querySelectorAll('.echo-satellite').forEach(x=>x.classList.remove('pulse'));
    const btn=document.querySelector(`.echo-satellite[data-node="${id}"]`);if(!btn)return;
    btn.classList.add('pulse');setStep(stepIndex,'seen');echoTone(id);haptic(5);
  }

  function reconfigureOrbit(cfg){
    const space=$('echoSpace');if(!space)return;
    space.classList.add('echo-shift');
    state.rotationShift+=cfg.reverse?145:78;
    if(cfg.reverse)state.direction*=-1;
    state.nodes.forEach((n,i)=>{n.angle=(n.angle+state.rotationShift+(i%2?18:-12))%360});
    const holder=$('echoSatellites');if(holder)holder.innerHTML=state.nodes.map(nodeMarkup).join('');
    space.style.setProperty('--echo-direction',state.direction);
    echoTone(7,true);
    later(()=>space.classList.remove('echo-shift'),420);
  }

  function beginRecall(cfg){
    if(current.locked)return;
    state.phase='recall';state.input=[];
    if(cfg.reconfigure)reconfigureOrbit(cfg);
    $('echoInstruction').textContent=cfg.reconfigure?'ORBIT SHIFT — reproduis':'À toi — reproduis la séquence';
    $('echoSub').textContent='Même ordre, mêmes satellites';
    document.querySelectorAll('.echo-step').forEach(x=>x.classList.remove('seen'));
    const wire=()=>document.querySelectorAll('.echo-satellite').forEach(btn=>{
      btn.disabled=false;btn.onclick=()=>handleInput(Number(btn.dataset.node),btn,cfg);
    });
    later(wire,cfg.reconfigure?360:40);
    runTimer(cfg.recall,()=>failRound(null));
  }

  function presentSequence(cfg){
    state.phase='present';
    const intro=520;
    state.sequence.forEach((id,i)=>later(()=>pulseNode(id,i),intro+i*cfg.pulse));
    later(()=>{
      document.querySelectorAll('.echo-satellite').forEach(x=>x.classList.remove('pulse'));
      beginRecall(cfg);
    },intro+state.sequence.length*cfg.pulse+180);
  }

  function failRound(btn){
    if(current.locked)return;current.locked=true;state.phase='done';stopTimer();clearEchoTimers();record(false);addSpeedSample(0);current.combo=0;
    if(btn)btn.classList.add('echo-wrong');
    const step=state.input.length;setStep(Math.min(step,state.sequence.length-1),'bad');
    $('echoInstruction') && ($('echoInstruction').textContent='Écho perdu');
    document.querySelectorAll('.echo-satellite').forEach(x=>x.disabled=true);
    feedback(false);safeTimeout(nextRound,880);
  }

  function completeRound(){
    if(current.locked)return;current.locked=true;state.phase='done';const sp=speedFraction();stopTimer();clearEchoTimers();record(true);addSpeedSample(sp);current.combo++;current.maxCombo=Math.max(current.maxCombo,current.combo);
    const d=effectiveDifficulty('echo');setScore((140+state.sequence.length*42+current.combo*13)*difficultyBonus('echo')*(1+.45*sp));
    $('echoInstruction').textContent='Séquence synchronisée';$('echoSub').textContent='Mémoire orbitale verrouillée';
    document.querySelector('.echo-core')?.classList.add('echo-core-success');
    echoTone(state.sequence[state.sequence.length-1],true);feedback(true);safeTimeout(nextRound,720);
  }

  function handleInput(id,btn,cfg){
    if(current.locked||state.phase!=='recall'||btn.disabled)return;
    const pos=state.input.length,expected=state.sequence[pos];
    if(id!==expected){failRound(btn);return}
    state.input.push(id);btn.classList.add('echo-correct');setStep(pos,'done');$('echoProgress').textContent=`${state.input.length}/${state.sequence.length}`;echoTone(id);haptic(7);
    later(()=>btn.classList.remove('echo-correct'),180);
    if(state.input.length===state.sequence.length)completeRound();
  }

  function echoRound(){
    clearEchoTimers();current.locked=false;const d=effectiveDifficulty('echo'),cfg=config(d,current.round);
    state.direction=(current.round%2?1:-1);state.nodes=buildNodes(cfg);state.sequence=buildSequence(cfg);state.input=[];state.phase='intro';state.ringCount=cfg.rings;state.rotationShift=0;
    renderArena(cfg);$('timerMeter').style.width='100%';presentSequence(cfg);
  }

  const prevStartGame=startGame;
  startGame=function(mode,...args){if(mode==='echo'){clearEchoTimers();state.phase='idle'}return prevStartGame(mode,...args)};

  const prevNextRound=nextRound;
  nextRound=function(){
    if(current.mode!=='echo'||current.quick)return prevNextRound();
    current.locked=false;if(current.round>=ECHO_ROUNDS){finishGame();return}
    current.round++;$('roundLabel').textContent=`ORBITE ${current.round}/${ECHO_ROUNDS}`;echoRound();
  };

  const prevUnlockBadges=unlockBadges;
  unlockBadges=function(acc){
    prevUnlockBadges(acc);
    if(current.mode==='echo'&&acc>=85&&effectiveDifficulty('echo')>=3&&!data.badges.includes('echo')){
      data.badges.push('echo');showToast('◌ Badge Mémoire orbitale débloqué !');
    }
  };

  document.addEventListener('visibilitychange',()=>{if(document.hidden&&current.mode==='echo')clearEchoTimers()});
  injectEchoCard();updateHome();document.querySelectorAll('.app-version').forEach(x=>x.textContent=ECHO_VERSION.replace(/\.0$/,''));
})();