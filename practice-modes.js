/* Peaceful World 5 — mode selector and owner-approved Mettā (web PWA).
 * Keep legacy Base/Free storage keys byte-for-byte; Mettā is independent.
 * This module intentionally reuses the released app.js timers and Free runtime.
 */
'use strict';
(() => {
  if (window.PW_TRAINING_MODES) return;
  const LEGACY_BASE = 'pw-completed-practices';
  const METTA_COUNT = 'pw-metta-completed-practices-v1';
  const FREE_SECONDS = 'pw-free-practice-seconds-v1';
  const FREE_SESSIONS = 'pw-free-practice-sessions-v1';
  const copy = window.PW_FOCUS_METTA_COPY;
  const rotation = window.PW_COPY_ROTATION;
  if (!copy?.ru?.steps || !copy?.en?.steps || !rotation) {
    console.error('[5] Required practice copy is unavailable');
    return;
  }

  const $ = id => document.getElementById(id);
  const home = $('home');
  const done = $('done');
  const start = $('startBtn');
  const dialog = $('pwModeInfoDialog');
  if (!home || !done || !start || !dialog) return;

  const text = {
    ru: {
      base:'База', metta:'Доброжелательность', free:'Свободная тренировка',
      baseDesc:'Пять шагов мирного мышления.', mettaDesc:'От себя ко всем живым.',
      freeDesc:'Открытый таймер в твоём темпе.',
      baseMore:'Пять последовательных шагов: остановись, увидь живое, пожелай добра, уменьши вред и сделай выбор. На каждый шаг — одна минута с короткой подготовкой. Не нужно искать правильный ответ.',
      mettaMore:'Пять направлений доброжелательности: к себе, к тому, кто проявил доброту, к близкому, к малознакомому человеку и ко всем живым. Пожелание счастья и свободы от страданий не требует особых чувств или прощения.',
      freeMore:'Открытый таймер без заданной длительности. Выбери знакомое упражнение; при желании открой подсказку. Время учитывается в общем счётчике тренировок.',
      choose:'ВЫБЕРИ ТРЕНИРОВКУ', start:'Начать · 5 минут', startFree:'Начать',
      details:'Подробнее о тренировке: ', close:'Закрыть', total:'в тренировках',
      countOne:'тренировка', countFew:'тренировки', countMany:'тренировок',
      sample:'', history:'За всё время', new:'НОВАЯ', planned:'В планах',
      plannedHeader:'В ПЛАНАХ', compassion:'Сострадание', anger:'Работа с гневом',
      kicker:'Тренировка завершена', outcome:'РЕЗУЛЬТАТ', session:'Это была тренировка № ',
      totalTime:'Общее время', doneStart:'К выбору тренировок', roadmap:'Новые тренировки',
      roadmapNote:'Следующие направления — в планах.', roadmapLink:'Посмотреть планы развития →',
      statusNew:'Новая', doneFree:'Свободная тренировка',
      infoFallback:'Расскажи об этой тренировке',
      friendlyMetta:copy.ru.completion,
      infoTime:'За всё время'
    },
    en: {
      base:'Foundation', metta:'Loving-kindness', free:'Free practice',
      baseDesc:'Five steps for more peaceful thinking.', mettaDesc:'From yourself to all living beings.',
      freeDesc:'An open timer at your own pace.',
      baseMore:'Five steps: Stop, See a living being, Wish someone well, Reduce harm, and Make a choice. Each step lasts one minute after a short preparation. There is no right answer to find.',
      mettaMore:'Five directions of goodwill: yourself, someone who showed kindness, someone close, someone you barely know, and all living beings. Wishing happiness and freedom from suffering does not require a particular feeling or forgiveness.',
      freeMore:'An open-ended timer for a practice you already know. An optional hint is available. In the released app, your time contributes to the overall practice total.',
      choose:'CHOOSE A PRACTICE', start:'Start · 5 minutes', startFree:'Start',
      details:'More about ', close:'Close', total:'in practice',
      countOne:'practice', countFew:'practices', countMany:'practices',
      sample:'', history:'All-time total', new:'NEW', planned:'Planned',
      plannedHeader:'PLANNED', compassion:'Compassion', anger:'Working with anger',
      kicker:'Practice complete', outcome:'SUMMARY', session:'This was practice number ',
      totalTime:'Total time in practice', doneStart:'Back to practices',
      roadmap:'More practices are planned', roadmapNote:'Two more approaches are planned.',
      roadmapLink:'Learn about future practices →',
      statusNew:'New', doneFree:'Free practice',
      infoFallback:'About this practice',
      friendlyMetta:copy.en.completion,
      infoTime:'All-time total'
    }
  };
  const safeInt = key => {
    try {
      const n = Number.parseInt(localStorage.getItem(key) || '0', 10);
      return Number.isSafeInteger(n) && n >= 0 ? n : 0;
    } catch (_) { return 0; }
  };
  const putInt = (key, n) => {
    try { localStorage.setItem(key, String(Math.max(0, Math.floor(n)))); return true; }
    catch (_) { return false; }
  };
  const locale = () => String(document.documentElement.lang || window.PW_I18N?.locale || 'ru').split('-')[0] === 'ru' ? 'ru' : 'en';
  const dict = () => text[locale()];
  // Storage mode ID is 'foundation', while the approved copy key is 'base'.
  // Never render "undefined" in the details title, screen-reader label or history.
  const modeTitle = (c, mode) => c[mode === 'foundation' ? 'base' : mode];
  let selected = 'foundation';
  let info = 'foundation';
  let infoOpener = null;
  let mettaActive = false;
  let mettaDemo = false;
  let mettaFinished = false;
  let mettaMeta = null;
  let completionMode = null;

  function formatTime(s) {
    const amount = Math.max(0, Math.floor(s));
    const h = Math.floor(amount / 3600);
    const m = Math.floor((amount % 3600) / 60);
    if (h > 0) return h + (locale() === 'ru' ? ' ч ' : ' h ') + String(m).padStart(2,'0') + (locale() === 'ru' ? ' мин' : ' min');
    if (m > 0) return m + (locale() === 'ru' ? ' мин' : ' min');
    return amount + (locale() === 'ru' ? ' сек' : ' sec');
  }
  function practiceWord(n) {
    const c = dict();
    if (locale() !== 'ru') return n === 1 ? c.countOne : c.countMany;
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return c.countOne;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return c.countFew;
    return c.countMany;
  }
  function stats() {
    const base = safeInt(LEGACY_BASE), metta = safeInt(METTA_COUNT);
    const freeTime = safeInt(FREE_SECONDS), freeCount = safeInt(FREE_SESSIONS);
    return {
      foundation:{ seconds:base*300,count:base },
      metta:{ seconds:metta*300,count:metta },
      free:{ seconds:freeTime,count:freeCount },
      seconds:(base+metta)*300+freeTime,
      count:base+metta+freeCount,
      guided:base+metta
    };
  }
  function set(id, value) {
    const el = $(id);
    if (el && el.textContent !== String(value)) el.textContent = String(value);
  }
  function updateHome() {
    const c=dict(), data=stats(), visible=data.seconds>0||data.count>0;
    const totalEl=$('pwModeProgress');
    if(totalEl) totalEl.hidden=!visible;
    set('pwModeTotalTime',formatTime(data.seconds));
    set('pwModeTotalLabel',c.total);
    set('pwModeTotalCount',String(data.count));
    set('pwModeCountLabel',practiceWord(data.count));
    for(const id of ['foundation','metta','free']) {
      const el=$('pwModeUsage'+id.charAt(0).toUpperCase()+id.slice(1));
      if(!el)continue;
      const dataMode=data[id];
      const hasHistory=dataMode.seconds>0||dataMode.count>0;
      el.hidden=!hasHistory;
      if(hasHistory) {
        el.textContent=formatTime(dataMode.seconds);
        el.setAttribute('aria-label',c.history+': '+modeTitle(c,id)+' — '+formatTime(dataMode.seconds));
      }
    }
    if(dialog.open) updateInfo();
  }
  function updateInfo(){
    const c=dict(), data=stats()[info];
    set('pwModeInfoTitle',modeTitle(c,info));
    set('pwModeInfoBody',c[info+'More']);
    set('pwModeInfoStartText',info==='free'?c.startFree:c.start);
    const usage=$('pwModeInfoUsage');
    if(usage){
      usage.hidden=data.seconds<=0&&data.count<=0;
      if(!usage.hidden)usage.textContent=c.history+': '+formatTime(data.seconds)+' · '+data.count+' '+practiceWord(data.count);
    }
  }
  function openInfo(which,opener){
    info=which;infoOpener=opener||null;updateInfo();
    if(typeof dialog.showModal==='function')dialog.showModal();
    $('pwModeInfoClose')?.focus({preventScroll:true});
  }
  function closeInfo(){
    if(dialog.open)dialog.close();
  }
  function freeStart(){
    selected='free';
    // Free runtime is inserted after i18n resolves; do not duplicate its timer.
    const entry=home.querySelector('.pw-free-entry');
    if(entry){entry.click();return}
    const wait=new MutationObserver(()=>{
      const next=home.querySelector('.pw-free-entry');
      if(next){wait.disconnect();next.click();}
    });
    wait.observe(home,{childList:true,subtree:true});
    window.setTimeout(()=>wait.disconnect(),3500);
  }
  function startMode(id) {
    closeInfo();
    if(id==='free'){freeStart();return}
    selected=id;
    start.click(); // released app.js owns 5×5s + 5×60s + sound/pause.
  }
  function getMettaSteps() {
    const pack=copy[locale()];
    return pack.steps.map(s=>({title:s.title,guide:s.guide}));
  }
  function renderCopy(){
    const c=dict();
    set('pwModeChoose',c.choose);
    set('pwCardBaseTitle',c.base);
    set('pwCardMettaTitle',c.metta);
    set('pwCardFreeTitle',c.free);
    set('pwCardBaseDesc',c.baseDesc);
    set('pwCardMettaDesc',c.mettaDesc);
    set('pwCardFreeDesc',c.freeDesc);
    set('pwCardNew',c.new);
    set('pwCardBaseAction',c.start);
    set('pwCardMettaAction',c.start);
    set('pwCardFreeAction',c.startFree);
    set('pwModePlannedHeading',c.plannedHeader);
    set('pwModeUpcomingCompassion',c.compassion);
    set('pwModeUpcomingAnger',c.anger);
    set('pwModeUpcomingCompassionStatus',c.planned);
    set('pwModeUpcomingAngerStatus',c.planned);
    for(const mode of ['foundation','metta','free']){
      const id=mode.charAt(0).toUpperCase()+mode.slice(1);
      $('pwModeInfo'+id)?.setAttribute('aria-label',c.details+modeTitle(c,mode));
    }
    $('pwModeInfoClose')?.setAttribute('aria-label',c.close);
    $('pwModeInfoDialog')?.setAttribute('aria-label',c.infoFallback);
    set('pwModeNewTitle',c.roadmap);
    set('pwModeNewDescription',c.roadmapNote);
    set('pwModeRoadmapMetta',c.metta);
    set('pwModeRoadmapMettaStatus',c.statusNew);
    set('pwModeRoadmapCompassion',c.compassion);
    set('pwModeRoadmapCompassionStatus',c.planned);
    set('pwModeRoadmapAnger',c.anger);
    set('pwModeRoadmapAngerStatus',c.planned);
    set('pwModeRoadmapLink',c.roadmapLink);
    set('pwModeDoneBackText',c.doneStart);
    const article=window.PW_I18N?.config?.links?.article;
    const link=$('pwModeRoadmapLink');
    if(link)link.href=typeof article==='string'&&article.startsWith('https://')?article:(locale()==='ru'?'https://peaceful-world.org/ru/research/peaceful-world-practice':'https://peaceful-world.org/research/peaceful-world-practice');
    updateHome();
    if(done.classList.contains('active'))renderDone();
  }
  function renderDone(){
    const c=dict(), d=stats();
    const last=window.PW_LAST_COMPLETION;
    const isFree=last?.mode==='free'||selected==='free';
    const isMetta=!isFree&&(last?.mode==='metta'||selected==='metta');
    const mode=isFree?'free':isMetta?'metta':'foundation';
    completionMode=mode;
    const doneLabel=$('doneKicker');
    if(doneLabel)doneLabel.textContent=c.kicker;
    const subtitle=done.querySelector('.done-subtitle');
    if(subtitle){
      if(isMetta)subtitle.textContent=c.friendlyMetta;
      else if(isFree)subtitle.textContent=locale()==='ru'?'Это время ты посвятил тренировке.':'You made time for your practice.';
      else subtitle.textContent=window.PW_I18N?.pack?.['done.subtitle']|| (locale()==='ru'?'Закрой приложение и вернись к своему дню.':'Close the app and return to your day.');
    }
    let number=d.guided;
    if(number<1)number=null;
    set('pwModeDoneSummaryHeading',c.outcome);
    set('pwModeDoneSummaryTitle',isFree?c.doneFree:(number?c.session+number:c.kicker));
    set('pwModeDoneSummaryTime',c.totalTime+': '+formatTime(d.seconds));
    set('pwModeDoneSummaryMode',modeTitle(c,mode));
    $('pwModeDoneSummary')?.setAttribute('aria-label',c.outcome);
    updateHome();
  }

  const originalStart=rotation.startSession.bind(rotation);
  const originalComplete=rotation.completeSession.bind(rotation);
  const oldDescriptors={};
  for(const prop of ['lastCompletedPracticeNumber','lastCompletedCopyVersion','lastCompletedSetId','lastCompletedLocale','lastCompletedWasDemo','copyVersion','currentSetId','currentLocale']){
    oldDescriptors[prop]=Object.getOwnPropertyDescriptor(rotation,prop);
  }
  rotation.startSession=function(opts={}){
    if(selected!=='metta')return originalStart(opts);
    mettaDemo=Boolean(opts.demo);mettaActive=true;mettaFinished=false;mettaMeta=null;
    return getMettaSteps();
  };
  rotation.completeSession=function(){
    if(selected!=='metta'){
      const result=originalComplete();
      if(result?.practiceNumber){
        window.PW_LAST_COMPLETION={mode:'foundation',practiceNumber:result.practiceNumber,durationSeconds:300};
        document.dispatchEvent(new CustomEvent('pw:completion-changed'));
      }
      return result;
    }
    if(mettaFinished)return mettaMeta;
    if(!mettaActive)return null;
    mettaFinished=true;
    const n=mettaDemo?null:(safeInt(METTA_COUNT)+1);
    if(n!==null)putInt(METTA_COUNT,n);
    const practiceNumber=n===null?null:safeInt(LEGACY_BASE)+n;
    mettaMeta={
      practiceNumber,modeNumber:n,
      copyVersion:copy.version,setId:'metta-focus-01',
      locale:locale(),demo:mettaDemo
    };
    window.PW_LAST_COMPLETION={mode:'metta',practiceNumber,durationSeconds:mettaDemo?null:300,demo:mettaDemo};
    document.dispatchEvent(new CustomEvent('pw:completion-changed'));
    return mettaMeta;
  };
  const propOverrides={
    lastCompletedPracticeNumber:meta=>meta?.practiceNumber??null,
    lastCompletedCopyVersion:meta=>meta?.copyVersion||copy.version,
    lastCompletedSetId:meta=>meta?.setId||'metta-focus-01',
    lastCompletedLocale:meta=>meta?.locale||locale(),
    lastCompletedWasDemo:meta=>Boolean(meta?.demo),
    copyVersion:()=>copy.version,
    currentSetId:()=> 'metta-focus-01',
    currentLocale:()=>locale()
  };
  for(const [prop, fn] of Object.entries(propOverrides)){
    const orig=oldDescriptors[prop];
    if(!orig?.configurable)continue;
    Object.defineProperty(rotation,prop,{configurable:true,enumerable:true,get(){
      return selected==='metta'?fn(mettaMeta):(typeof orig.get==='function'?orig.get.call(rotation):orig.value);
    }});
  }

  const map={foundation:'pwModeInfoFoundation',metta:'pwModeInfoMetta',free:'pwModeInfoFree'};
  for(const [mode,id] of Object.entries(map))$(id)?.addEventListener('click',()=>openInfo(mode,$(id)));
  $('pwModeBaseStart')?.addEventListener('click',()=>startMode('foundation'));
  $('pwModeMettaStart')?.addEventListener('click',()=>startMode('metta'));
  $('pwModeFreeStart')?.addEventListener('click',()=>startMode('free'));
  $('pwModeInfoClose')?.addEventListener('click',closeInfo);
  $('pwModeInfoStart')?.addEventListener('click',()=>startMode(info));
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeInfo();});
  dialog.addEventListener('close',()=>{if(home.classList.contains('active'))infoOpener?.focus({preventScroll:true});});
  $('pwModeBack')?.addEventListener('click',()=>{
    done.classList.remove('active');
    home.classList.add('active');
    home.scrollTop=0;
    selected='foundation';window.PW_LAST_COMPLETION=null;
    updateHome();
    $('pwModeBaseStart')?.focus({preventScroll:true});
  });
  document.addEventListener('pw:progress-changed',updateHome);
  document.addEventListener('pw:progress-restored',updateHome);
  document.addEventListener('pw:completion-changed',updateHome);
  document.addEventListener('pw:locale-changed',renderCopy);
  document.addEventListener('pw:locale-ready',renderCopy);
  window.PW_I18N?.ready?.then(renderCopy,renderCopy);
  new MutationObserver(()=>{
    if(done.classList.contains('active'))renderDone();
    else if(home.classList.contains('active'))updateHome();
  }).observe(done,{attributes:true,attributeFilter:['class']});
  new MutationObserver(updateHome).observe(home,{attributes:true,attributeFilter:['class']});

  window.PW_TRAINING_MODES={
    get mode(){return selected;},
    isMetta(){return selected==='metta';},
    getMettaSteps,
    example(step){
      if(selected!=='metta')return '';
      return copy[locale()]?.steps?.[step-1]?.example||'';
    },
    totals:stats,
    refresh:renderCopy,
    start:startMode
  };
  document.documentElement.classList.add('pw-modes-ready');
  renderCopy();
})();