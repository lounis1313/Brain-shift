const MODES = {
  memory:{title:"Mémoire Flash", rounds:5},
  math:{title:"Calcul Express", rounds:10},
  odd:{title:"Intrus Visuel", rounds:7},
  sequence:{title:"Suite Logique", rounds:8},
  stroop:{title:"Stroop Couleurs", rounds:12}
};
const modeNames={memory:"Mémoire Flash",math:"Calcul Express",odd:"Intrus Visuel",sequence:"Suite Logique",stroop:"Stroop Couleurs"};
const APP_VERSION="2.1.0";
const MODE_HELP={
 memory:"Mémorise les cases illuminées puis retouche exactement les mêmes. La grille, le nombre de cases et le temps d’exposition évoluent avec ton niveau.",
 math:"Résous l’opération avant la fin du chrono. Plus tu réponds vite et juste, plus ton combo et ton score montent.",
 odd:"Un seul élément est différent. Repère-le au plus vite sans te précipiter : une erreur termine la manche.",
 sequence:"Trouve le terme manquant ou suivant. Les règles mélangent nombres, lettres, symboles et transformations visuelles selon ton niveau.",
 stroop:"Suis uniquement la consigne : parfois la couleur de l’encre, parfois le mot écrit. Ignore l’information parasite."
};
const BADGES={
 first:{icon:"⚡",title:"Premier pas",desc:"Terminer ta première partie."},
 combo:{icon:"✦",title:"Série x5",desc:"Atteindre un combo de 5 bonnes réponses."},
 eye:{icon:"◉",title:"Œil de lynx",desc:"Atteindre 85 % à Intrus Visuel."},
 calc:{icon:"＋",title:"Calculateur",desc:"Atteindre 90 % à Calcul Express."},
 memory:{icon:"🧠",title:"Mémoire d'acier",desc:"Atteindre 90 % à Mémoire Flash."},
 perfect:{icon:"💎",title:"Sans faute",desc:"Terminer une partie à 100 %."},
 expert:{icon:"🔥",title:"Mode Expert",desc:"Réussir au moins 80 % en difficulté Expert ou Maître."},
 brain90:{icon:"🚀",title:"Cerveau 90+",desc:"Dépasser 90 au Score cerveau."},
 streak3:{icon:"📅",title:"Régulier",desc:"Jouer 3 jours consécutifs."},
 marathon:{icon:"🏁",title:"Mental d'acier",desc:"Terminer 25 entraînements."}
};
const emptyModeStats=()=>Object.fromEntries(Object.keys(MODES).map(k=>[k,{plays:0,quickLegs:0,correct:0,total:0,totalScore:0,quickScore:0,bestCombo:0,bestSpeed:0}]));
const emptyRecent=()=>Object.fromEntries(Object.keys(MODES).map(k=>[k,[]]));
const defaultData={schema:5,xp:0,streak:0,lastPlayedDay:null,dailyDate:null,daily:0,dailyReward:false,games:0,correct:0,total:0,bestBrain:0,bestBrainToday:0,bestBrainDate:null,
 best:{memory:0,math:0,odd:0,sequence:0,stroop:0},modeStats:emptyModeStats(),recent:emptyRecent(),tutorials:{},badges:[],sound:true,haptics:true,anim:true,difficulty:"auto",onboardingSeen:false};
let data=loadData(), installPrompt=null;
let current={mode:null,round:0,score:0,correct:0,total:0,combo:0,maxCombo:0,quick:false,quickIndex:0,quickScores:[],timer:null,timerEndsAt:0,timerCallback:null,timerRemaining:0,roundLimitMs:0,roundStartedAt:0,speedSum:0,speedSamples:0,startTs:0,locked:false,paused:false,pendingTimeouts:[],sessionId:0};
const $=id=>document.getElementById(id);

function cloneDefaults(){return {...defaultData,best:{...defaultData.best},modeStats:emptyModeStats(),recent:emptyRecent(),tutorials:{},badges:[]}}
function loadData(){
  try{
    const stored=JSON.parse(localStorage.getItem("brainShiftV5")||localStorage.getItem("brainShiftV4")||localStorage.getItem("brainShiftV2")||"{}");
    const d=cloneDefaults();Object.assign(d,stored);
    d.best={...defaultData.best,...(stored.best||{})};
    d.modeStats=emptyModeStats();Object.keys(d.modeStats).forEach(k=>Object.assign(d.modeStats[k],stored.modeStats?.[k]||{}));
    d.recent=emptyRecent();Object.keys(d.recent).forEach(k=>d.recent[k]=Array.isArray(stored.recent?.[k])?stored.recent[k].slice(-8):[]);
    d.tutorials={...(stored.tutorials||{})};d.badges=[...(stored.badges||[])];
    if(!('haptics' in stored))d.haptics=true;
    if(!stored.lastPlayedDay&&stored.games>0&&stored.lastDay)d.lastPlayedDay=stored.lastDay;
    if(!stored.dailyDate&&stored.lastDay)d.dailyDate=stored.lastDay;
    if(!stored.bestBrain&&stored.bestBrainToday)d.bestBrain=stored.bestBrainToday;
    d.schema=5;return d;
  }catch{return cloneDefaults()}
}
function saveData(){try{localStorage.setItem("brainShiftV5",JSON.stringify(data))}catch{}}
function dayKey(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`}
function dayDiff(a,b){if(!a||!b)return null;const [ay,am,ad]=a.split('-').map(Number),[by,bm,bd]=b.split('-').map(Number);return Math.round((new Date(by,bm-1,bd)-new Date(ay,am-1,ad))/86400000)}
function normalizeDay(){
  const t=dayKey();
  if(data.dailyDate!==t){data.daily=0;data.dailyReward=false;data.dailyDate=t}
  if(data.bestBrainDate!==t)data.bestBrainToday=0;
  const gap=dayDiff(data.lastPlayedDay,t);if(data.lastPlayedDay&&gap>1)data.streak=0;
  saveData();
}
function registerPlayedDay(){
  const t=dayKey();if(data.lastPlayedDay===t)return;
  const diff=dayDiff(data.lastPlayedDay,t);data.streak=diff===1?Math.max(1,(data.streak||0)+1):1;data.lastPlayedDay=t;
}
function level(){return Math.floor(data.xp/500)+1}
function rank(){const l=level(); return l<3?"Curieux":l<6?"Éveillé":l<10?"Stratège":l<15?"Analyste":"Maître mental"}
const DIFF_NAMES={1:"Facile",2:"Normal",3:"Difficile",4:"Expert",5:"Maître"};
function effectiveDifficulty(mode=current.mode){
  if(data.difficulty!=="auto")return Math.max(1,Math.min(5,Number(data.difficulty)||1));
  const l=level();let d=l<3?1:l<6?2:l<10?3:l<15?4:5;
  const s=mode&&data.modeStats[mode];
  if(s){const exposure=(s.plays||0)+(s.quickLegs||0);if(exposure<3)d=Math.min(d,3);if(exposure>=3&&s.total){const a=s.correct/s.total;if(a>=.92)d+=1;else if(a<.62)d-=1;if(exposure>=12&&a>=.86)d+=1;if(exposure>=12&&a<.52)d-=1}}
  return Math.max(1,Math.min(5,d));
}
function difficultyLabel(mode=null){if(data.difficulty==="auto"&&!mode)return "Auto · personnalisé";const d=effectiveDifficulty(mode||current.mode);return `${data.difficulty==="auto"?"Auto · ":""}${DIFF_NAMES[d]}`}
function difficultyBonus(mode=current.mode){return 1+(effectiveDifficulty(mode)-1)*.16}
function rememberRecent(mode,sig){if(!sig)return;const arr=data.recent[mode]||(data.recent[mode]=[]);const i=arr.indexOf(sig);if(i>=0)arr.splice(i,1);arr.push(sig);if(arr.length>8)arr.splice(0,arr.length-8)}
function wasRecent(mode,sig){return (data.recent[mode]||[]).includes(sig)}
function chooseFresh(mode,factory,signature){let item;for(let i=0;i<24;i++){item=factory();const sig=signature(item);if(!wasRecent(mode,sig)){rememberRecent(mode,sig);return item}}rememberRecent(mode,signature(item));return item}
function showToast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1600);
}
function updateHome(){
  normalizeDay();
  $("levelValue").textContent=level();$("rankName").textContent=rank();const xpIn=data.xp%500;$("xpLabel").textContent=`${xpIn} / 500 XP`;$("xpMeter").style.width=`${xpIn/5}%`;
  $("streakLabel").textContent=`🔥 ${data.streak||0} jour${data.streak===1?"":"s"}`;$("brainScoreValue").textContent=data.bestBrainToday||"—";$("accuracyValue").textContent=data.total?`${Math.round(data.correct/data.total*100)}%`:"—";$("gamesValue").textContent=data.games;
  $("dailyCount").textContent=`${Math.min(data.daily,3)} / 3`;$("dailyMeter").style.width=`${Math.min(100,data.daily/3*100)}%`;$("goalMessage").textContent=data.daily>=3?"Objectif accompli ✨":`Encore ${3-data.daily} défi${3-data.daily>1?"s":""}.`;
  Object.keys(data.best).forEach(k=>{const el=$(`best-${k}`);if(el)el.textContent=data.best[k]||0;const de=$(`diff-${k}`);if(de)de.textContent=data.difficulty==="auto"?DIFF_NAMES[effectiveDifficulty(k)]:DIFF_NAMES[effectiveDifficulty(k)]});
  document.querySelectorAll(".badge[data-badge]").forEach(b=>b.classList.toggle("locked",!data.badges.includes(b.dataset.badge)));$("badgeCount").textContent=`${data.badges.length} / ${Object.keys(BADGES).length}`;
  [["soundSwitch","sound"],["animSwitch","anim"],["hapticSwitch","haptics"]].forEach(([id,key])=>{const el=$(id);if(!el)return;el.classList.toggle("on",!!data[key]);el.setAttribute("aria-checked",String(!!data[key]))});
  $("difficultyHome").textContent=difficultyLabel();if($("difficultySelect"))$("difficultySelect").value=String(data.difficulty);document.documentElement.classList.toggle("reduce-anim",!data.anim);
  $("profileRank").textContent=`${rank()} · Niveau ${level()}`;$("profileXp").textContent=data.xp;$("profileStreak").textContent=data.streak||0;$("profileGames").textContent=data.games;$("profileBrain").textContent=data.bestBrain||"—";$("profileDifficulty").textContent=difficultyLabel();$("profileBadges").textContent=`${data.badges.length} / ${Object.keys(BADGES).length}`;
  updateStats();updateBadgeGallery();
}
function updateStats(){
  $("statsBrain").textContent=data.bestBrainToday||"—";$("statsAccuracy").textContent=data.total?`${Math.round(data.correct/data.total*100)}%`:"—";$("statsGames").textContent=data.games;$("statsXp").textContent=data.xp;
  $("recordsList").innerHTML=Object.entries(modeNames).map(([k,v])=>{const st=data.modeStats[k],acc=st.total?Math.round(st.correct/st.total*100):0,avg=st.plays?Math.round(st.totalScore/st.plays):0;const exposure=(st.plays||0)+(st.quickLegs||0);return `<div class="record-row"><div class="record-copy"><span>${v}</span><small>${st.plays} partie${st.plays===1?"":"s"}${st.quickLegs?` · ${st.quickLegs} défi${st.quickLegs===1?"":"s"} rapide${st.quickLegs===1?"":"s"}`:""} · ${st.total?acc+" % précision":"—"}</small></div><div class="record-right"><strong>${data.best[k]||0}</strong><small>${st.plays?`record · moy. ${avg}`:`niveau auto ${DIFF_NAMES[effectiveDifficulty(k)]}`}</small></div></div>`}).join("");
}
function updateBadgeGallery(){
  $("badgeGallery").innerHTML=Object.entries(BADGES).map(([k,b])=>`<article class="badge-tile glass ${data.badges.includes(k)?"":"locked"}">
  <span class="badge ${data.badges.includes(k)?"":"locked"}">${b.icon}</span><h3>${b.title}</h3><p>${b.desc}</p></article>`).join("");
}
function showView(id){
  if(id!=="gameView"&&$("gameView").classList.contains("active")){clearGameTimers();current.paused=false;hidePause()}
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(id).classList.add("active");
  document.querySelectorAll(".nav-item[data-view]").forEach(n=>n.classList.toggle("active",n.dataset.view===id));
  window.scrollTo({top:0,behavior:data.anim?"smooth":"auto"});
}
let activeDialog=null,lastFocus=null;
function focusables(el){return [...el.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.hidden&&x.offsetParent!==null)}
function activateDialog(container,focusTarget=null){lastFocus=document.activeElement;activeDialog=container;container.classList.add("show");container.setAttribute("aria-hidden","false");const root=container.querySelector('[role="dialog"]')||container;requestAnimationFrame(()=>{(focusTarget||focusables(root)[0]||root).focus?.()})}
function deactivateDialog(container){container.classList.remove("show");container.setAttribute("aria-hidden","true");if(activeDialog===container)activeDialog=null;lastFocus?.focus?.();lastFocus=null}
document.addEventListener("keydown",e=>{if(!activeDialog)return;const root=activeDialog.querySelector('[role="dialog"]')||activeDialog;if(e.key==="Tab"){const list=focusables(root);if(!list.length){e.preventDefault();return}const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}if(e.key==="Escape"){if(activeDialog===$("modal"))closeSettings();else if(activeDialog===$("pauseOverlay"))resumeGame();else if(activeDialog===$("modeTutorial"))closeModeTutorial()}});
function openSettings(){activateDialog($("modal"),$("closeModal"))}
function closeSettings(){deactivateDialog($("modal"))}
function toggleSetting(key){
  data[key]=!data[key]; saveData(); updateHome();
}
function resetData(){
  if(confirm("Effacer toute la progression Brain Shift sur cet appareil ?")){
    data=cloneDefaults(); normalizeDay(); saveData(); updateHome(); closeSettings(); showToast("Progression réinitialisée");
  }
}
function exportProgress(){const payload={app:"Brain Shift",version:APP_VERSION,exportedAt:new Date().toISOString(),data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`brain-shift-sauvegarde-${dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast("Sauvegarde exportée.")}
async function importProgress(file){try{const parsed=JSON.parse(await file.text());const incoming=parsed?.data||parsed;if(!incoming||typeof incoming!=="object"||typeof incoming.xp!=="number")throw new Error("invalid");const merged=cloneDefaults();Object.assign(merged,incoming);merged.best={...defaultData.best,...(incoming.best||{})};merged.modeStats=emptyModeStats();Object.keys(merged.modeStats).forEach(k=>Object.assign(merged.modeStats[k],incoming.modeStats?.[k]||{}));merged.recent=emptyRecent();Object.keys(merged.recent).forEach(k=>merged.recent[k]=Array.isArray(incoming.recent?.[k])?incoming.recent[k].slice(-8):[]);merged.tutorials={...(incoming.tutorials||{})};merged.badges=[...(incoming.badges||[])];merged.schema=5;data=merged;normalizeDay();saveData();updateHome();closeSettings();showToast("Progression restaurée.")}catch{showToast("Sauvegarde invalide.")}}
function beep(freq=620,dur=.055){
  if(!data.sound) return;
  try{const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=freq;g.gain.value=.035;o.start();setTimeout(()=>{o.stop();a.close()},dur*1000)}catch{}
}
function haptic(ms=18){if(data.haptics&&navigator.vibrate) navigator.vibrate(ms)}
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function shuffle(a){const out=[...a];for(let i=out.length-1;i>0;i--){const j=rnd(0,i);[out[i],out[j]]=[out[j],out[i]]}return out}
function setScore(v){current.score+=Math.max(0,Math.round(v)); $("scoreValue").textContent=current.score}
function record(ok){current.total++;if(ok)current.correct++}
function clearPending(){(current.pendingTimeouts||[]).forEach(clearTimeout);current.pendingTimeouts=[]}
function safeTimeout(fn,ms){const sid=current.sessionId;const id=setTimeout(()=>{current.pendingTimeouts=current.pendingTimeouts.filter(x=>x!==id);if(sid===current.sessionId&&!current.paused)fn()},ms);current.pendingTimeouts.push(id);return id}
function stopTimer(){if(current.timer){clearInterval(current.timer);current.timer=null}}
function clearGameTimers(){stopTimer();clearPending();current.timerCallback=null;current.timerRemaining=0}
function runTimer(ms,onTimeout){
  stopTimer();current.timerRemaining=ms;current.roundLimitMs=ms;current.roundStartedAt=performance.now();current.timerEndsAt=current.roundStartedAt+ms;current.timerCallback=onTimeout;$("timerMeter").style.width="100%";
  current.timer=setInterval(()=>{const left=Math.max(0,current.timerEndsAt-performance.now());current.timerRemaining=left;$("timerMeter").style.width=`${left/ms*100}%`;if(left<=0){stopTimer();const cb=current.timerCallback;current.timerCallback=null;cb?.()}},80);
}
function speedFraction(){if(!current.roundLimitMs)return 0;return Math.max(0,Math.min(1,current.timerRemaining/current.roundLimitMs))}
function addSpeedSample(v){current.speedSum+=Math.max(0,Math.min(1,v));current.speedSamples++}
function speedScore(){return current.speedSamples?Math.round(current.speedSum/current.speedSamples*100):0}
function pauseGame(){
  if(current.paused||!$("gameView").classList.contains("active"))return;
  if(!current.timer){showToast("Pause disponible dès que le chrono démarre.");return}
  current.paused=true;current.timerRemaining=Math.max(1,current.timerEndsAt-performance.now());stopTimer();activateDialog($("pauseOverlay"),$("resumeBtn"));
}
function resumeGame(){if(!current.paused)return;const remaining=Math.max(250,current.timerRemaining),originalLimit=current.roundLimitMs||remaining,cb=current.timerCallback;current.paused=false;hidePause();runTimer(remaining,cb);current.roundLimitMs=originalLimit}
function hidePause(){if($("pauseOverlay").classList.contains("show"))deactivateDialog($("pauseOverlay"));else{$("pauseOverlay").setAttribute("aria-hidden","true")}}
function feedback(ok){beep(ok?760:210);haptic(ok?12:35)}
let pendingTutorialMode=null;
function modeIcon(mode){const ids={memory:"i-memory",math:"i-math",odd:"i-eye",sequence:"i-sequence",stroop:"i-color"};return `<svg class="ui-icon"><use href="#${ids[mode]}"/></svg>`}
function requestStartGame(mode){if(data.tutorials?.[mode]){startGame(mode);return}pendingTutorialMode=mode;$("tutorialIcon").innerHTML=modeIcon(mode);$("tutorialTitle").textContent=modeNames[mode];$("tutorialText").textContent=MODE_HELP[mode];$("tutorialRounds").textContent=`${MODES[mode].rounds} manches`;$("tutorialDifficulty").textContent=difficultyLabel(mode);activateDialog($("modeTutorial"),$("tutorialStart"))}
function closeModeTutorial(){pendingTutorialMode=null;deactivateDialog($("modeTutorial"))}
function confirmModeTutorial(){const mode=pendingTutorialMode;if(!mode)return;data.tutorials[mode]=true;saveData();pendingTutorialMode=null;deactivateDialog($("modeTutorial"));startGame(mode)}
function startRandom(){const ks=Object.keys(MODES);requestStartGame(ks[rnd(0,ks.length-1)])}
function startQuick(){current.quick=true;current.quickIndex=0;current.quickScores=[];startGame("memory",true)}
function startGame(mode,keepQuick=false){
  clearGameTimers();const sid=(current.sessionId||0)+1;if(!keepQuick)current.quick=false;
  current={...current,sessionId:sid,mode,round:0,score:0,correct:0,total:0,combo:0,maxCombo:0,speedSum:0,speedSamples:0,roundLimitMs:0,roundStartedAt:0,locked:false,paused:false,pendingTimeouts:[]};
  hidePause();$("gameTitle").textContent=MODES[mode].title;$("scoreValue").textContent=0;$("gameDifficulty").textContent=`${DIFF_NAMES[effectiveDifficulty(mode)]} · ${effectiveDifficulty(mode)}/5`;showView("gameView");nextRound();
}
function nextRound(){
  current.locked=false;const limit=current.quick?1:MODES[current.mode].rounds;
  if(current.round>=limit){finishGame();return}
  current.round++; $("roundLabel").textContent=current.quick?`DÉFI ${current.quickIndex+1}/5`:`MANCHE ${current.round}/${MODES[current.mode].rounds}`;
  if(current.mode==="memory") memoryRound();
  if(current.mode==="math") mathRound();
  if(current.mode==="odd") oddRound();
  if(current.mode==="sequence") sequenceRound();
  if(current.mode==="stroop") stroopRound();
}

function memoryRound(){
  const d=effectiveDifficulty(current.mode),configs={1:{size:3,base:2,exposure:1650,limit:9000},2:{size:4,base:3,exposure:1400,limit:8000},3:{size:4,base:4,exposure:1150,limit:7000},4:{size:5,base:5,exposure:950,limit:6200},5:{size:5,base:6,exposure:760,limit:5400}};
  const cfg=configs[d],size=cfg.size,count=Math.min(cfg.base+Math.floor((current.round-1)/2),size*size-2),cells=size*size;
  const chosen=chooseFresh("memory",()=>{const out=[];while(out.length<count){const n=rnd(0,cells-1);if(!out.includes(n))out.push(n)}return out},a=>`${size}:${[...a].sort((x,y)=>x-y).join("-")}`);
  $("playStage").innerHTML=`<div class="prompt">Mémorise ${count} case${count>1?"s":""} · ${DIFF_NAMES[d]}</div><div class="memory-grid" style="grid-template-columns:repeat(${size},1fr)">${Array.from({length:cells},(_,i)=>`<button class="tile ${chosen.includes(i)?"flash":""}" data-i="${i}" aria-label="Case ${i+1}" disabled></button>`).join("")}</div>`;$("timerMeter").style.width="100%";
  safeTimeout(()=>{const tiles=[...document.querySelectorAll(".tile")];tiles.forEach(t=>{t.classList.remove("flash");t.disabled=false});let selected=[];tiles.forEach(t=>t.onclick=()=>{if(current.locked||selected.includes(+t.dataset.i))return;selected.push(+t.dataset.i);t.classList.add("flash");if(selected.length===count){current.locked=true;const sp=speedFraction(),ok=selected.every(x=>chosen.includes(x));stopTimer();record(ok);addSpeedSample(ok?sp:0);if(ok){current.combo++;current.maxCombo=Math.max(current.maxCombo,current.combo);setScore((125+current.round*22)*difficultyBonus(current.mode)*(1+.35*sp))}else current.combo=0;tiles.forEach(x=>{const i=+x.dataset.i;if(chosen.includes(i))x.classList.add("correct");else if(selected.includes(i))x.classList.add("wrong")});feedback(ok);safeTimeout(nextRound,720)}});runTimer(cfg.limit,()=>{if(current.locked)return;current.locked=true;record(false);addSpeedSample(0);current.combo=0;feedback(false);tiles.forEach(x=>{if(chosen.includes(+x.dataset.i))x.classList.add("correct")});safeTimeout(nextRound,700)})},Math.max(520,cfg.exposure-current.round*55));
}

function uniqueOptions(ans,spread=10,allowNegative=false){
  const opts=[ans],tries=100;
  let i=0;
  while(opts.length<4 && i++<tries){
    let d=ans+rnd(-spread,spread);
    if(!allowNegative && d<0)continue;
    if(d!==ans&&!opts.includes(d))opts.push(d);
  }
  while(opts.length<4){const d=ans+opts.length+1;if(!opts.includes(d))opts.push(d)}
  return shuffle(opts);
}

function makeMathCandidate(){
  const d=effectiveDifficulty(current.mode);
  let q="",ans=0,spread=10;
  if(d===1){
    if(Math.random()<.55){const a=rnd(4,35),b=rnd(2,25);q=`${a} + ${b}`;ans=a+b}
    else{const a=rnd(15,55),b=rnd(2,a-2);q=`${a} − ${b}`;ans=a-b}
    spread=8;
  }else if(d===2){
    const t=rnd(0,3);
    if(t===0){const a=rnd(15,80),b=rnd(5,45);q=`${a} + ${b}`;ans=a+b}
    else if(t===1){const a=rnd(35,110),b=rnd(5,a-5);q=`${a} − ${b}`;ans=a-b}
    else if(t===2){const a=rnd(2,12),b=rnd(2,10);q=`${a} × ${b}`;ans=a*b}
    else{const b=rnd(2,10),ans0=rnd(2,12);q=`${b*ans0} ÷ ${b}`;ans=ans0}
    spread=12;
  }else if(d===3){
    const t=rnd(0,4);
    if(t===0){const a=rnd(8,35),b=rnd(2,12),c=rnd(2,9);q=`${a} + ${b} × ${c}`;ans=a+b*c}
    else if(t===1){const a=rnd(3,12),b=rnd(3,12),c=rnd(2,20);q=`${a} × ${b} − ${c}`;ans=a*b-c}
    else if(t===2){const a=rnd(10,40),b=rnd(2,15),c=rnd(2,4);q=`(${a} + ${b}) × ${c}`;ans=(a+b)*c}
    else if(t===3){const n=rnd(4,15);q=`${n}²`;ans=n*n}
    else{const pct=[10,20,25,50][rnd(0,3)],base=[40,60,80,100,120,160,200][rnd(0,6)];q=`${pct}% de ${base}`;ans=base*pct/100}
    spread=18;
  }else if(d===4){
    const t=rnd(0,5);
    if(t===0){const a=rnd(20,80),b=rnd(3,12),c=rnd(2,9);q=`${a} − ${b} × ${c}`;ans=a-b*c}
    else if(t===1){const a=rnd(10,35),b=rnd(5,20),c=rnd(2,5);q=`(${a} + ${b}) × ${c}`;ans=(a+b)*c}
    else if(t===2){const b=rnd(3,12),x=rnd(5,20),c=rnd(2,15);q=`${b*x} ÷ ${b} + ${c}`;ans=x+c}
    else if(t===3){const n=rnd(11,25);q=`${n}²`;ans=n*n}
    else if(t===4){const pct=[15,20,25,30,40,50][rnd(0,5)],base=[80,100,120,160,200,240][rnd(0,5)];q=`${pct}% de ${base}`;ans=base*pct/100}
    else{const a=rnd(2,9),b=rnd(2,9),c=rnd(2,9);q=`${a} × ${b} + ${c}²`;ans=a*b+c*c}
    spread=25;
  }else{
    const t=rnd(0,5);
    if(t===0){const a=rnd(20,60),b=rnd(8,22),c=rnd(2,5),e=rnd(2,9);q=`(${a} + ${b}) × ${c} − ${e}`;ans=(a+b)*c-e}
    else if(t===1){const b=rnd(4,12),x=rnd(10,30),c=rnd(3,9);q=`${b*x} ÷ ${b} × ${c}`;ans=x*c}
    else if(t===2){const n=rnd(15,30),m=rnd(2,9);q=`${n}² − ${m}²`;ans=n*n-m*m}
    else if(t===3){const pct=[12.5,25,37.5,50,75][rnd(0,4)],base=[80,120,160,200,240][rnd(0,4)];q=`${pct}% de ${base}`;ans=base*pct/100}
    else if(t===4){const a=rnd(3,9),b=rnd(2,7),c=rnd(2,8);q=`${a}³ − ${b} × ${c}`;ans=a*a*a-b*c}
    else{const a=rnd(12,30),b=rnd(4,12),c=rnd(2,6);q=`(${a} − ${b}) × (${c}+1)`;ans=(a-b)*(c+1)}
    spread=35;
  }
  return {q,ans,opts:uniqueOptions(ans,spread,true)};
}
function makeMath(){return chooseFresh("math",makeMathCandidate,x=>x.q)}

function mathRound(){
  const x=makeMath(),d=effectiveDifficulty(current.mode);
  $("playStage").innerHTML=`<div class="prompt">${DIFF_NAMES[d]} · combo x${current.combo}</div><div class="big-question">${x.q}</div>
  <div class="answer-grid">${x.opts.map(v=>`<button class="answer" data-v="${v}">${v}</button>`).join("")}</div>`;
  document.querySelectorAll(".answer").forEach(b=>b.onclick=()=>judge(Number(b.dataset.v)===x.ans,b,sp=>setScore((95+current.combo*15)*difficultyBonus(current.mode)*(1+.35*sp))));
  runTimer([0,11000,9500,8000,6800,5600][d],timeoutRound);
}

function judge(ok,b,onGood){if(current.locked)return;current.locked=true;const sp=speedFraction();stopTimer();record(ok);addSpeedSample(ok?sp:0);b.classList.add(ok?"good":"bad");if(ok){current.combo++;current.maxCombo=Math.max(current.maxCombo,current.combo);onGood?.(sp)}else current.combo=0;feedback(ok);document.querySelectorAll(".answer,.odd-cell,.tile").forEach(x=>x.disabled=true);safeTimeout(nextRound,520)}
function timeoutRound(){if(current.locked)return;current.locked=true;record(false);addSpeedSample(0);current.combo=0;feedback(false);safeTimeout(nextRound,520)}

function oddRound(){
  const d=effectiveDifficulty(current.mode);
  const glyphPools={
    1:[["●","○"],["▲","△"],["■","□"],["◆","◇"],["★","☆"],["8","6"]],
    2:[["→","↗"],["←","↖"],["8","B"],["6","9"],["✦","✧"],["C","G"],["O","0"],["1","I"]],
    3:[["◀","◁"],["⊕","⊗"],["↘","↙"],["M","N"],["E","F"],["3","8"],["S","5"],["q","p"]],
    4:[["⊙","⊚"],["↔","↕"],["◒","◓"],["⊂","⊃"],["≠","≈"],["b","d"],["P","R"],["7","1"]],
    5:[["⋖","⋗"],["⟲","⟳"],["⊏","⊐"],["∩","∪"],["⊞","⊟"],["rn","m"],["vv","w"],["cl","d"]]
  };
  const side=[0,4,5,5,6,7][d],n=side*side;
  const choice=chooseFresh("odd",()=>{
    const useTransform=d>=2&&Math.random()<(d>=4?.62:.34);
    if(useTransform){
      const shape=["◆","▲","■","✦","⬟"][rnd(0,4)],rot=[0,45,90,135,180,225,270,315][rnd(0,7)];
      const delta=d<=2?45:[30,45,60,90][rnd(0,3)];
      return {kind:"transform",shape,rot,oddRot:(rot+delta)%360,odd:rnd(0,n-1)};
    }
    const pair=glyphPools[d][rnd(0,glyphPools[d].length-1)];
    return {kind:"glyph",pair,odd:rnd(0,n-1)};
  },x=>x.kind==="transform"?`${d}:t:${x.shape}:${x.rot}:${x.oddRot}:${x.odd}`:`${d}:g:${x.pair.join("|")}:${x.odd}`);
  const odd=choice.odd,font=d===5?"18px":"24px";
  const cells=Array.from({length:n},(_,i)=>{
    const content=choice.kind==="transform"
      ?`<span class="odd-transform" style="transform:rotate(${i===odd?choice.oddRot:choice.rot}deg)">${choice.shape}</span>`
      :(i===odd?choice.pair[1]:choice.pair[0]);
    return `<button class="odd-cell" aria-label="Élément ${i+1}" style="font-size:${font}" data-ok="${i===odd}">${content}</button>`;
  }).join("");
  $("playStage").innerHTML=`<div class="prompt">${DIFF_NAMES[d]} · trouve l’intrus</div><div class="odd-grid" style="grid-template-columns:repeat(${side},1fr)">${cells}</div>`;
  runTimer([0,11500,10000,8500,7200,6000][d],timeoutRound);
  document.querySelectorAll(".odd-cell").forEach(b=>b.onclick=()=>{if(current.locked)return;const ok=b.dataset.ok==="true",sp=speedFraction();current.locked=true;stopTimer();record(ok);addSpeedSample(ok?sp:0);if(!ok){b.classList.add("bad");feedback(false);document.querySelectorAll(".odd-cell").forEach(x=>{x.disabled=true;if(x.dataset.ok==="true")x.classList.add("correct")});safeTimeout(nextRound,600);return}current.combo++;current.maxCombo=Math.max(current.maxCombo,current.combo);setScore(150*difficultyBonus(current.mode)*(1+.55*sp));b.classList.add("good");feedback(true);safeTimeout(nextRound,450)});
}

function buildSequenceCandidate(){
  const d=effectiveDifficulty(current.mode),len=6;
  let arr=[],kind="number";
  if(d>=2&&Math.random()<(d>=4?.48:.28)){
    kind="symbol";
    const sets=[
      ["▲","▶","▼","◀","▲","▶"],
      ["●","○","●","○","●","○"],
      ["◆","◇","◇","◆","◇","◇"],
      ["✦","✦","✧","✦","✦","✧"]
    ];
    arr=[...sets[rnd(0,sets.length-1)]];
  }else if(d>=3&&Math.random()<(d>=5?.42:.25)){
    kind="letter";
    const start=rnd(0,10),step=d>=4?rnd(2,4):rnd(1,3);
    arr=Array.from({length:len},(_,i)=>String.fromCharCode(65+(start+i*step)%26));
  }else if(d===1){
    const type=rnd(0,1),start=rnd(1,12),step=rnd(2,8);
    arr=Array.from({length:len},(_,i)=>type===0?start+i*step:start+(len-1-i)*step);
  }else if(d===2){
    const type=rnd(0,3);
    if(type===0){const s=rnd(1,10),k=rnd(2,9);arr=Array.from({length:len},(_,i)=>s+i*k)}
    else if(type===1){const m=rnd(1,4),k=rnd(2,3);arr=[m];for(let i=1;i<len;i++)arr.push(arr[i-1]*k)}
    else if(type===2){let a=rnd(1,5),inc=2;arr=[a];for(let i=1;i<len;i++){a+=inc;arr.push(a);inc++}}
    else{const a=rnd(2,8),b=rnd(2,7);arr=[a,a+b,a+b+a,a+b+a+b];while(arr.length<len)arr.push(arr[arr.length-1]+arr[arr.length-2])}
  }else if(d===3){
    const type=rnd(0,4);
    if(type===0){let a=rnd(1,6);arr=[a];for(let i=1;i<len;i++){a+=i+1;arr.push(a)}}
    else if(type===1){let a=rnd(1,4);arr=[a];for(let i=1;i<len;i++){a=a*2+1;arr.push(a)}}
    else if(type===2){const a=rnd(1,8),x=rnd(2,5),y=rnd(4,8);arr=[a];for(let i=1;i<len;i++)arr.push(arr[i-1]+(i%2?x:y))}
    else if(type===3){arr=Array.from({length:len},(_,i)=>(i+1)*(i+1))}
    else{const a=rnd(1,5),b=rnd(1,5);arr=[a,b];while(arr.length<len)arr.push(arr[arr.length-1]+arr[arr.length-2])}
  }else if(d===4){
    const type=rnd(0,4);
    if(type===0){let a=rnd(2,6);arr=[a];for(let i=1;i<len;i++)arr.push(i%2?arr[i-1]*2:arr[i-1]+3)}
    else if(type===1){const base=rnd(1,4);arr=Array.from({length:len},(_,i)=>base+(i+1)*(i+1))}
    else if(type===2){let a=rnd(2,7);arr=[a];for(let i=1;i<len;i++){a+=2*i+1;arr.push(a)}}
    else if(type===3){let a=rnd(2,5);arr=[a];for(let i=1;i<len;i++){a=a*2+i;arr.push(a)}}
    else{const a=rnd(2,5),b=rnd(3,7);arr=[a,b];while(arr.length<len)arr.push(arr[arr.length-1]+arr[arr.length-2]+1)}
  }else{
    const type=rnd(0,4);
    if(type===0){let a=rnd(2,5);arr=[a];for(let i=1;i<len;i++){a=i%2?a*2:a-3;arr.push(a)}}
    else if(type===1){const s=rnd(1,5);arr=Array.from({length:len},(_,i)=>s+(i+1)*(i+1)+(i+1))}
    else if(type===2){let a=rnd(2,6);arr=[a];for(let i=1;i<len;i++){a=a*2+(i%2?1:-1);arr.push(a)}}
    else if(type===3){const a=rnd(1,4),b=rnd(2,5);arr=[a,b];while(arr.length<len)arr.push(2*arr[arr.length-1]-arr[arr.length-2]+2)}
    else{arr=Array.from({length:len},(_,i)=>(i+1)*(i+1)*(i+1))}
  }
  const missing=d<=2?len-1:rnd(2,len-1),ans=arr[missing];
  return {arr,missing,ans,kind};
}
function buildSequence(){return chooseFresh("sequence",buildSequenceCandidate,x=>`${x.arr.join(",")}|${x.missing}`)}

function sequenceRound(){
  const d=effectiveDifficulty(current.mode),s=buildSequence(),shown=[...s.arr];shown[s.missing]="?";
  let opts;
  if(s.kind==="number"){
    const spread=Math.max(6,Math.round(Math.abs(s.ans)*.18)+4);opts=uniqueOptions(s.ans,spread,true);
  }else{
    const pool=s.kind==="letter"?"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""):["▲","▶","▼","◀","●","○","◆","◇","✦","✧"];
    opts=shuffle([...new Set([s.ans,...shuffle(pool.filter(x=>x!==s.ans)).slice(0,3)])]).slice(0,4);
  }
  $("playStage").innerHTML=`<div class="prompt">${DIFF_NAMES[d]} · trouve le terme manquant</div>
  <div class="sequence-row ${s.kind!=="number"?"sequence-visual":""}">${shown.map(v=>`<div class="seq">${v}</div>`).join("")}</div>
  <div class="answer-grid">${opts.map(v=>`<button class="answer" data-v="${v}">${v}</button>`).join("")}</div>`;
  document.querySelectorAll(".answer").forEach(b=>b.onclick=()=>judge(String(b.dataset.v)===String(s.ans),b,sp=>setScore((118+current.combo*10)*difficultyBonus(current.mode)*(1+.35*sp))));
  runTimer([0,13500,12000,10000,8500,7000][d],timeoutRound);
}

function stroopRound(){
  const d=effectiveDifficulty(current.mode),all=[{name:"ROUGE",c:"#ff6479"},{name:"BLEU",c:"#4b8dff"},{name:"VERT",c:"#42e695"},{name:"JAUNE",c:"#ffd65a"},{name:"ORANGE",c:"#ff9a4b"},{name:"VIOLET",c:"#a86cff"}],count=d<=2?4:d<=4?5:6,colors=all.slice(0,count);
  const state=chooseFresh("stroop",()=>{let word=colors[rnd(0,colors.length-1)],ink=colors[rnd(0,colors.length-1)];if(d>=3&&Math.random()<.72){while(ink.name===word.name)ink=colors[rnd(0,colors.length-1)]}return {word,ink,askInk:Math.random()<.5}},x=>`${d}:${x.word.name}:${x.ink.name}:${x.askInk}`),{word,ink,askInk}=state,ans=askInk?ink.name:word.name,instruction=askInk?"touche la COULEUR DE L’ENCRE":"touche le MOT ÉCRIT";
  $("playStage").innerHTML=`<div class="prompt">${DIFF_NAMES[d]} · ${instruction}</div><div class="stroop-word" style="color:${ink.c}">${word.name}</div><div class="answer-grid">${shuffle(colors).map(x=>`<button class="answer" data-v="${x.name}">${x.name}</button>`).join("")}</div>`;
  document.querySelectorAll(".answer").forEach(b=>b.onclick=()=>judge(b.dataset.v===ans,b,sp=>setScore((88+current.combo*12)*difficultyBonus(current.mode)*(1+.42*sp))));runTimer([0,8500,7200,6000,5000,4200][d],timeoutRound);
}
function unlockBadges(acc){
  const before=data.badges.length,add=k=>{if(!data.badges.includes(k))data.badges.push(k)};
  add("first");if(current.maxCombo>=5)add("combo");if(current.mode==="odd"&&acc>=85)add("eye");if(current.mode==="math"&&acc>=90)add("calc");if(current.mode==="memory"&&acc>=90)add("memory");
  if(acc===100&&current.total>=5)add("perfect");if(effectiveDifficulty(current.mode)>=4&&acc>=80)add("expert");if(data.streak>=3)add("streak3");if(data.games>=25)add("marathon");
  if(data.badges.length>before)showToast("🏅 Nouveau badge débloqué !");
}
function finishGame(){
  clearGameTimers();const acc=current.total?Math.round(current.correct/current.total*100):0;if(current.quick){finishQuickLeg(acc);return}
  const sessionSpeed=speedScore();let xp=Math.max(20,Math.round((current.score/18+acc*.42+sessionSpeed*.12)*difficultyBonus(current.mode)));registerPlayedDay();data.xp+=xp;data.games++;data.daily++;data.correct+=current.correct;data.total+=current.total;
  const ms=data.modeStats[current.mode];ms.plays++;ms.correct+=current.correct;ms.total+=current.total;ms.totalScore+=current.score;ms.bestCombo=Math.max(ms.bestCombo,current.maxCombo);ms.bestSpeed=Math.max(ms.bestSpeed,sessionSpeed);
  const isRecord=current.score>data.best[current.mode];if(isRecord){data.best[current.mode]=current.score;showToast("🏆 Nouveau record !")}
  if(data.daily>=3&&!data.dailyReward){data.dailyReward=true;data.xp+=100;xp+=100;showToast("🎯 Objectif quotidien : +100 XP")}
  unlockBadges(acc);saveData();updateHome();
  $("playStage").innerHTML=`<div class="result-card"><div class="result-icon">${acc>=90?"🏆":acc>=70?"⚡":"🧠"}</div><span class="eyebrow">SESSION TERMINÉE</span><h2>${acc>=90?"Excellente session !":acc>=70?"Très solide !":"Continue, tu progresses."}</h2><p>${current.correct} bonne${current.correct>1?"s":""} réponse${current.correct>1?"s":""} sur ${current.total}.${isRecord?" Nouveau record !":""}</p><div class="result-metrics"><div><strong>${current.score}</strong><span>score</span></div><div><strong>${acc}%</strong><span>précision</span></div><div><strong>${sessionSpeed}%</strong><span>rapidité</span></div></div><p class="xp-earned">+${xp} XP</p><div class="hero-actions" style="justify-content:center"><button class="button primary" id="resultMainBtn">Rejouer</button><button class="button secondary" id="resultHomeBtn">Accueil</button></div></div>`;
  $("resultHomeBtn").onclick=()=>showView("homeView");$("resultMainBtn").onclick=()=>startGame(current.mode);
}
function finishQuickLeg(acc){
  const speed=speedScore();current.quickScores.push({mode:current.mode,score:current.score,acc,correct:current.correct,total:current.total,maxCombo:current.maxCombo,speed,diff:effectiveDifficulty(current.mode)});const last=current.quickIndex>=4;
  $("playStage").innerHTML=`<div class="result-card"><div class="result-icon">${acc>=90?"⚡":"🧠"}</div><span class="eyebrow">DÉFI ${current.quickIndex+1}/5 TERMINÉ</span><h2>${modeNames[current.mode]}</h2><p>${acc>=90?"Parfait, on continue.":acc>=70?"Bien joué. Garde le rythme.":"Pas grave, le prochain défi peut tout changer."}</p><div class="result-metrics"><div><strong>${current.score}</strong><span>score</span></div><div><strong>${acc}%</strong><span>précision</span></div><div><strong>${speed}%</strong><span>rapidité</span></div></div><div class="hero-actions" style="justify-content:center"><button class="button primary" id="quickNextBtn">${last?"Voir mon Score cerveau":"Défi suivant"}</button><button class="button secondary" id="quickQuitBtn">Quitter</button></div></div>`;
  $("quickNextBtn").onclick=advanceQuick;$("quickQuitBtn").onclick=()=>{current.quick=false;showView("homeView")};
}
function advanceQuick(){
  if(current.quickIndex<4){current.quickIndex++;startGame(["memory","math","odd","sequence","stroop"][current.quickIndex],true);return}
  completeQuickChallenge();
}
function completeQuickChallenge(){
  const avgAcc=current.quickScores.reduce((a,b)=>a+b.acc,0)/current.quickScores.length,avgSpeed=current.quickScores.reduce((a,b)=>a+b.speed,0)/current.quickScores.length,brain=Math.min(100,Math.round(avgAcc*.75+avgSpeed*.25));
  let xp=Math.round(45+brain*.75+current.quickScores.reduce((a,b)=>a+b.diff,0)/current.quickScores.length*8);registerPlayedDay();data.games++;data.daily++;data.xp+=xp;
  for(const leg of current.quickScores){data.correct+=leg.correct;data.total+=leg.total;const ms=data.modeStats[leg.mode];ms.quickLegs++;ms.correct+=leg.correct;ms.total+=leg.total;ms.quickScore+=leg.score;ms.bestCombo=Math.max(ms.bestCombo,leg.maxCombo);ms.bestSpeed=Math.max(ms.bestSpeed,leg.speed);if(leg.maxCombo>=5&&!data.badges.includes("combo"))data.badges.push("combo");if(leg.mode==="odd"&&leg.acc>=85&&!data.badges.includes("eye"))data.badges.push("eye");if(leg.mode==="math"&&leg.acc>=90&&!data.badges.includes("calc"))data.badges.push("calc");if(leg.mode==="memory"&&leg.acc>=90&&!data.badges.includes("memory"))data.badges.push("memory")}
  data.bestBrain=Math.max(data.bestBrain,brain);if(data.bestBrainDate!==dayKey()){data.bestBrainDate=dayKey();data.bestBrainToday=0}data.bestBrainToday=Math.max(data.bestBrainToday,brain);if(brain>=90&&!data.badges.includes("brain90"))data.badges.push("brain90");if(!data.badges.includes("first"))data.badges.push("first");if(data.streak>=3&&!data.badges.includes("streak3"))data.badges.push("streak3");if(data.games>=25&&!data.badges.includes("marathon"))data.badges.push("marathon");if(current.quickScores.some(x=>x.diff>=4)&&avgAcc>=80&&!data.badges.includes("expert"))data.badges.push("expert");
  if(data.daily>=3&&!data.dailyReward){data.dailyReward=true;data.xp+=100;xp+=100;showToast("🎯 Objectif quotidien : +100 XP")}
  saveData();updateHome();current.quick=false;$("roundLabel").textContent="DÉFI RAPIDE";$("gameTitle").textContent="Score cerveau";$("gameDifficulty").textContent=difficultyLabel();
  $("playStage").innerHTML=`<div class="result-card"><div class="result-icon">${brain>=90?"🚀":brain>=75?"🏆":"🧠"}</div><span class="eyebrow">SCORE CERVEAU</span><h2>${brain} / 100</h2><p>${brain>=90?"Excellente maîtrise : vitesse, précision et flexibilité mentale.":brain>=75?"Très bon niveau. La régularité fera encore monter ton score.":"Bonne base. Reviens demain et vise quelques points de plus."}</p><div class="result-metrics"><div><strong>${Math.round(avgAcc)}%</strong><span>précision</span></div><div><strong>${Math.round(avgSpeed)}%</strong><span>rapidité</span></div><div><strong>${data.bestBrainToday}</strong><span>record du jour</span></div></div><p class="xp-earned">+${xp} XP</p><div class="hero-actions" style="justify-content:center"><button class="button primary" id="againQuick">Recommencer</button><button class="button secondary" id="backHome">Accueil</button></div></div>`;$("againQuick").onclick=startQuick;$("backHome").onclick=()=>showView("homeView");
}
async function shareApp(){
  const shareData={title:"Brain Shift",text:"Essaie Brain Shift, le jeu d’entraînement cérébral de NOVELYX Studio.",url:location.protocol.startsWith("http")?location.href:undefined};
  try{if(navigator.share)await navigator.share(shareData);else if(shareData.url&&navigator.clipboard){await navigator.clipboard.writeText(shareData.url);showToast("Lien copié !")}else showToast("Partage disponible une fois l’app mise en ligne.")}catch(e){if(e?.name!=="AbortError")showToast("Partage indisponible.")}
}
function showOnboarding(){if(!data.onboardingSeen)activateDialog($("onboarding"),$("onboardingStart"))}

document.querySelectorAll(".game-card").forEach(b=>b.addEventListener("click",()=>requestStartGame(b.dataset.mode)));
$("quickStartBtn").onclick=startQuick;$("randomBtn").onclick=startRandom;$("leaveGameBtn").onclick=()=>showView("homeView");$("pauseGameBtn").onclick=pauseGame;$("resumeBtn").onclick=resumeGame;$("pauseHomeBtn").onclick=()=>showView("homeView");$("shareBtn").onclick=shareApp;$("profileShareBtn").onclick=shareApp;
$("homeBrand").onclick=()=>showView("homeView");$("settingsBtn").onclick=openSettings;$("profileSettingsBtn").onclick=openSettings;$("closeModal").onclick=closeSettings;
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeSettings()});$("soundSwitch").onclick=()=>toggleSetting("sound");$("animSwitch").onclick=()=>toggleSetting("anim");$("hapticSwitch").onclick=()=>toggleSetting("haptics");$("resetBtn").onclick=resetData;$("exportBtn").onclick=exportProgress;$("importBtn").onclick=()=>$("importFile").click();$("importFile").onchange=e=>{const f=e.target.files?.[0];if(f)importProgress(f);e.target.value=""};
$("difficultySelect").addEventListener("change",e=>{
  data.difficulty=e.target.value==="auto"?"auto":String(e.target.value);
  saveData();updateHome();showToast(`Difficulté : ${difficultyLabel()}`);
});
document.querySelectorAll(".nav-item[data-view]").forEach(n=>n.onclick=()=>showView(n.dataset.view));
$("onboardingStart").onclick=()=>{data.onboardingSeen=true;saveData();deactivateDialog($("onboarding"))};$("tutorialStart").onclick=confirmModeTutorial;$("tutorialCancel").onclick=closeModeTutorial;
document.addEventListener("visibilitychange",()=>{if(document.hidden&&$("gameView").classList.contains("active")&&current.timer&&!current.paused)pauseGame()});
function isStandalone(){return window.matchMedia?.("(display-mode: standalone)").matches||window.navigator.standalone===true}
function refreshInstallButton(){const b=$("installBtn");b.hidden=isStandalone()||!installPrompt}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;refreshInstallButton()});window.addEventListener("appinstalled",()=>{installPrompt=null;refreshInstallButton();showToast("Brain Shift est installé.")});
$("installBtn").onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;refreshInstallButton()};refreshInstallButton();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").then(reg=>reg.update().catch(()=>{})).catch(()=>{}))}
document.querySelectorAll(".app-version").forEach(x=>x.textContent=APP_VERSION.replace(/\.0$/,""));normalizeDay();updateHome();showOnboarding();
