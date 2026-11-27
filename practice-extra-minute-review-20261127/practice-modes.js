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
  for (const [code, draft] of Object.entries(window.PW_DRAFT_LOCALES || {})) {
    if (copy && draft?.metta) copy[code] = draft.metta;
  }
  const rotation = window.PW_COPY_ROTATION;
  const focus = new Map(window.PW_FOCUS_PILOT.map(p=>[p.id,p]));
  const focusEn = new Map(window.PW_FOCUS_PILOT_EN.map(p=>[p.id,p]));
  if (focus.size!==9 || focusEn.size!==focus.size || [...focus.keys()].some(id=>!focusEn.has(id))) throw Error('Focus locale catalog mismatch');
  const focusKey = id => 'focus-count-'+id;
  let focusMeta=null, focusDemo=true, focusFinished=false, focusSessionLocale=null;
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
  for (const [code, draft] of Object.entries(window.PW_DRAFT_LOCALES || {})) {
    if (draft?.modeUi) text[code] = draft.modeUi;
  }
  const safeInt = key => {
    const totals=window.PW_PROGRESS_PREVIEW?.totals;
    const fields={[LEGACY_BASE]:'guided_practices',[METTA_COUNT]:'metta_practices',[FREE_SECONDS]:'free_seconds',[FREE_SESSIONS]:'free_practices'};
    const mode=key.startsWith('focus-count-')?key.slice('focus-count-'.length):null;
    return totals?.[mode&&focus.has(mode)?mode+'_practices':fields[key]]??0;
  };
  const locale = () => {
    const raw = String(document.documentElement.lang || window.PW_I18N?.locale || 'ru');
    const code = window.PW_I18N?.normalizeLocale?.(raw) || raw.toLowerCase().split('-')[0];
    return text[code] && copy[code] ? code : 'en';
  };
  const dict = () => text[locale()];
  // Storage mode ID is 'foundation', while the approved copy key is 'base'.
  // Never render "undefined" in the details title, screen-reader label or history.
  const modeCopyKey = mode => mode === 'foundation' ? 'base' : mode;
  const focusPack = (id,code=locale()) => (code==='en'?focusEn:focus).get(id);
  const modeTitle = (c, mode) => focusPack(mode)?.name || c[modeCopyKey(mode)];
  const mettaCopyVersion = () => window.PW_DRAFT_LOCALES?.[locale()]
    ? (window.PW_I18N?.config?.copyVersion || copy.version) : copy.version;
  let selected = 'foundation';
  let info = 'foundation';
  let infoOpener = null;
  let mettaActive = false;
  let mettaDemo = false;
  let mettaFinished = false;
  let mettaMeta = null;
  let completionMode = null;

  function formatTime(s, exact = false) {
    const amount = Math.max(0, Math.floor(s));
    const h = Math.floor(amount / 3600);
    const m = Math.floor((amount % 3600) / 60);
    const units = {ru:[' ч ',' мин',' сек'],uk:[' год ',' хв',' с'],es:[' h ',' min',' s'],'pt-br':[' h ',' min',' s'],'pt-pt':[' h ',' min',' s'],fr:[' h ',' min',' s'],id:[' jam ',' mnt',' dtk']};
    const unit = units[locale()] || [' h ',' min',' sec'];
    const seconds=amount%60;
    if(h>0||m>0){const minutes=(h>0?h+unit[0]+String(m).padStart(2,'0'):m)+unit[1];return exact&&seconds>0?minutes+' '+seconds+unit[2]:minutes;}
    return seconds+unit[2];
  }
  function practiceWord(n) {
    const c = dict();
    if (locale() !== 'ru' && locale() !== 'uk') return n === 1 ? c.countOne : c.countMany;
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return c.countOne;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return c.countFew;
    return c.countMany;
  }
  function stats() {
    const base = safeInt(LEGACY_BASE), metta = safeInt(METTA_COUNT);
    const freeTime = safeInt(FREE_SECONDS), freeCount = safeInt(FREE_SESSIONS);
    const focusStats=Object.fromEntries([...focus.keys()].map(id=>{const count=safeInt(focusKey(id));return [id,{count,seconds:count*300}]}));
    const focusCount=Object.values(focusStats).reduce((n,p)=>n+p.count,0);
    return {
      foundation:{ seconds:base*300,count:base },
      metta:{ seconds:metta*300,count:metta },
      free:{ seconds:freeTime,count:freeCount },
      ...focusStats,
      seconds:(base+metta+focusCount)*300+freeTime,
      count:base+metta+focusCount+freeCount,
      guided:base+metta+focusCount
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

  const introKey=id=>'practice-intro-skip-v1:'+id;
  const introCatalog=window.PW_PRACTICE_INTROS;
  const skipped=id=>{try{return window.PW_REVIEW_STORAGE.getItem(introKey(id))==='1'}catch(_){return false}};
  function refreshIntroChoices(){
    const reset=$('pwIntroPreferenceTools');
    if(reset)reset.hidden=!Object.keys(introCatalog).some(skipped);
    for(const button of home.querySelectorAll('button[data-practice-id]')){
      const direct=skipped(button.dataset.practiceId);
      if(direct){button.removeAttribute('aria-haspopup');button.removeAttribute('aria-controls');}
      else{button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','pwModeInfoDialog');}
    }
  }
  function resetIntros(){
    for(const id of Object.keys(introCatalog)){try{window.PW_REVIEW_STORAGE.removeItem(introKey(id));}catch(_){}}
    refreshIntroChoices();
    $('pwModeChoose')?.focus({preventScroll:true});
  }
  function canStart(id){return !!introCatalog[id]&&!start.disabled&&home.classList.contains('active')&&!window.PW_I18N?.isLocked}
  function fillIntro(){
    const entry=introCatalog[info],host=$('pwModeIntroDetails');
    if(!entry||!host)return;
    const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt)n.textContent=txt;return n};
    const section=(title,content)=>{const sec=make('section','pw-intro-section');sec.append(make('h3','',title),make('p','',content));return sec};
    const sequence=make('section','pw-intro-section');sequence.append(make('h3','','Последовательность'));
    const list=make('ol','pw-intro-steps');
    const liveSteps=info==='metta'?copy.ru.steps:focus.get(info)?.steps;
    for(const [i,step] of entry.steps.entries()){const li=make('li');li.append(make('strong','',liveSteps?.[i]?.title||step.title),make('span','',step.description));list.append(li)}
    sequence.append(list);
    host.replaceChildren(section('Педагогическая основа',entry.basis),sequence,
      section('Как выполнять',info==='free'?'Когда будешь готов, запусти таймер. Выбирай свою длительность.':'На каждом шаге — 5 секунд подготовки и минута для предложенной умственной работы. Не нужно искать правильный ответ. Если отвлечёшься, спокойно вернись к заданию. Если хочешь уделить текущему шагу больше времени, нажми «+1 мин». Можно добавлять минуты повторно.'),
      section('Важно',entry.guard+' Ты можешь остановиться в любой момент.'));
  }
  function updateInfo(){
    const c=dict(),data=stats()[info],entry=introCatalog[info];
    if(!entry||!data)return;
    set('pwModeInfoTitle',modeTitle(c,info));set('pwModeInfoBody',entry.goal);
    set('pwModeInfoStartText',info==='free'?'Перейти к таймеру':'Начать · 5 минут');
    const usage=$('pwModeInfoUsage');
    if(usage){usage.hidden=data.seconds<=0&&data.count<=0;if(!usage.hidden)usage.textContent=c.history+': '+formatTime(data.seconds)+' · '+data.count+' '+practiceWord(data.count)}
  }
  function openInfo(which,opener){
    if(!introCatalog[which]||dialog.open||!home.classList.contains('active'))return;
    info=which;infoOpener=opener||document.activeElement;
    updateInfo();fillIntro();$('pwModeIntroSkip').checked=skipped(which);
    if(typeof dialog.showModal==='function')dialog.showModal();
    dialog.scrollTop=0;$('pwModeInfoClose')?.focus({preventScroll:true});
  }
  function requestStart(id,opener){
    if(!canStart(id)||dialog.open)return;
    if(skipped(id))startMode(id);else openInfo(id,opener);
  }
  function confirmStart(){
    if(!dialog.open||!canStart(info))return;
    try{
      if($('pwModeIntroSkip').checked)window.PW_REVIEW_STORAGE.setItem(introKey(info),'1');
      else window.PW_REVIEW_STORAGE.removeItem(introKey(info));
    }catch(_){}
    refreshIntroChoices();
    startMode(info);
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
    if(!['foundation','metta','free'].includes(id)&&!focus.has(id))return;
    if(start.disabled)return;
    window.PW_LAST_COMPLETION=null;
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
    set('pwModeChoose',window.PW_WEB_COPY[locale()]?.choose || c.choose);
    set('pwCardBaseTitle',c.base);
    set('pwCardMettaTitle',c.metta);
    set('pwCardFreeTitle',c.free);
    set('pwCardBaseDesc',c.baseDesc);
    set('pwCardMettaDesc',c.mettaDesc);
    set('pwCardFreeDesc',c.freeDesc);
    set('pwCardNew',c.new);
    set('pwCardBaseAction','5 минут');
    set('pwCardMettaAction','5 минут');
    set('pwCardFreeAction','Без лимита');
    refreshIntroChoices();
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
    set('pwModeDoneBackText',window.PW_WEB_COPY[locale()]?.back || c.doneStart);
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
    const mode=isFree?'free':focus.has(last?.mode)?last.mode:focus.has(selected)?selected:isMetta?'metta':'foundation';
    completionMode=mode;
    const doneLabel=$('doneKicker');
    if(doneLabel)doneLabel.textContent=c.kicker;
    const subtitle=done.querySelector('.done-subtitle');
    if(subtitle){
      if(isMetta)subtitle.textContent=c.friendlyMetta;
      else if(isFree)subtitle.textContent=c.freeDoneSubtitle || (locale()==='ru'?'Это время ты посвятил тренировке.':'You made time for your practice.');
      else subtitle.textContent=window.PW_I18N?.pack?.['done.subtitle']|| (locale()==='ru'?'Закрой приложение и вернись к своему дню.':'Close the app and return to your day.');
    }
    const webText=window.PW_WEB_COPY[locale()]||window.PW_WEB_COPY.ru;
    const demo=last?.demo||IS_DEMO;
    if(doneLabel&&demo)doneLabel.textContent=locale()==='ru'?'Тестовая тренировка завершена':'Quick review complete';
    const duration=demo?(isFree?null:last?.durationSeconds):last?.durationSeconds;
    set('pwModeDoneSummaryHeading',c.outcome);
    set('pwModeDoneSummaryTitle',modeTitle(c,mode));
    set('pwModeDoneSummaryTime',Number.isFinite(duration)?webText.sessionTime+': '+formatTime(duration,true):'');
    set('pwModeDoneSummaryMode',demo?(locale()==='ru'?'Просмотр не учитывается в статистике':'Quick review is not recorded'):window.PW_PROGRESS_PREVIEW?.recordingEnabled===false?(locale()==='ru'?'Запись прогресса отключена':'Progress recording is paused'):c.totalTime+': '+formatTime(d.seconds));
    $('pwModeDoneSummary')?.setAttribute('aria-label',webText.outcomeAria);
    updateHome();
  }

  const originalStart=rotation.startSession.bind(rotation);
  const originalComplete=rotation.completeSession.bind(rotation);
  const oldDescriptors={};
  for(const prop of ['lastCompletedPracticeNumber','lastCompletedCopyVersion','lastCompletedSetId','lastCompletedLocale','lastCompletedWasDemo','copyVersion','currentSetId','currentLocale']){
    oldDescriptors[prop]=Object.getOwnPropertyDescriptor(rotation,prop);
  }
  rotation.startSession=function(opts={}){
    if(focus.has(selected)){
      focusDemo=Boolean(opts.demo);focusFinished=false;focusMeta=null;focusSessionLocale=locale();
      return focusPack(selected,focusSessionLocale).steps.map(s=>({title:s.title,guide:s.guide}));
    }
    if(selected!=='metta')return originalStart(opts);
    mettaDemo=Boolean(opts.demo);mettaActive=true;mettaFinished=false;mettaMeta=null;
    return getMettaSteps();
  };
  rotation.completeSession=function(){
    if(focus.has(selected)){
      if(focusFinished)return focusMeta;
      focusFinished=true;
      const n=focusDemo||window.PW_PROGRESS_PREVIEW?.recordingEnabled===false?null:safeInt(focusKey(selected));
      focusMeta={practiceNumber:n===null?null:stats().guided,modeNumber:n,copyVersion:focusPack(selected,focusSessionLocale).version,setId:selected,locale:focusSessionLocale,demo:focusDemo};
      window.PW_LAST_COMPLETION={mode:selected,practiceNumber:focusMeta.practiceNumber,durationSeconds:focusDemo?null:300,demo:focusDemo};
      document.dispatchEvent(new CustomEvent('pw:completion-changed'));
      return focusMeta;
    }
    if(selected!=='metta'){
      const result=originalComplete();
      if(result&&!result.demo){
        window.PW_LAST_COMPLETION={mode:'foundation',practiceNumber:result.practiceNumber,durationSeconds:300};
        document.dispatchEvent(new CustomEvent('pw:completion-changed'));
      }
      return result;
    }
    if(mettaFinished)return mettaMeta;
    if(!mettaActive)return null;
    mettaFinished=true;
    const n=mettaDemo||window.PW_PROGRESS_PREVIEW?.recordingEnabled===false?null:safeInt(METTA_COUNT);
    const practiceNumber=n===null?null:safeInt(LEGACY_BASE)+n;
    mettaMeta={
      practiceNumber,modeNumber:n,
      copyVersion:mettaCopyVersion(),setId:'metta-focus-01',
      locale:locale(),demo:mettaDemo
    };
    window.PW_LAST_COMPLETION={mode:'metta',practiceNumber,durationSeconds:mettaDemo?null:300,demo:mettaDemo};
    document.dispatchEvent(new CustomEvent('pw:completion-changed'));
    return mettaMeta;
  };
  const propOverrides={
    lastCompletedPracticeNumber:meta=>meta?.practiceNumber??null,
    lastCompletedCopyVersion:meta=>meta?.copyVersion||mettaCopyVersion(),
    lastCompletedSetId:meta=>meta?.setId||'metta-focus-01',
    lastCompletedLocale:meta=>meta?.locale||locale(),
    lastCompletedWasDemo:meta=>Boolean(meta?.demo),
    copyVersion:()=>mettaCopyVersion(),
    currentSetId:()=> 'metta-focus-01',
    currentLocale:()=>locale()
  };
  for(const [prop, fn] of Object.entries(propOverrides)){
    const orig=oldDescriptors[prop];
    if(!orig?.configurable)continue;
    Object.defineProperty(rotation,prop,{configurable:true,enumerable:true,get(){
      if(focus.has(selected)){
        const current=focusPack(selected,focusSessionLocale||locale());
        const fields={lastCompletedPracticeNumber:focusMeta?.practiceNumber??null,lastCompletedCopyVersion:focusMeta?.copyVersion??null,lastCompletedSetId:focusMeta?.setId??null,lastCompletedLocale:focusMeta?.locale??null,lastCompletedWasDemo:focusMeta?.demo??false,copyVersion:current.version,currentSetId:selected,currentLocale:focusSessionLocale||locale()};
        return fields[prop];
      }
      return selected==='metta'?fn(mettaMeta):(typeof orig.get==='function'?orig.get.call(rotation):orig.value);
    }});
  }

  $('pwIntroReset')?.addEventListener('click',resetIntros);
  $('pwModeBaseStart')?.addEventListener('click',e=>requestStart('foundation',e.currentTarget));
  $('pwModeMettaStart')?.addEventListener('click',e=>requestStart('metta',e.currentTarget));
  $('pwModeFreeStart')?.addEventListener('click',e=>requestStart('free',e.currentTarget));
  $('pwModeInfoClose')?.addEventListener('click',closeInfo);
  $('pwModeInfoStart')?.addEventListener('click',confirmStart);
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeInfo();});
  dialog.addEventListener('close',()=>{if(home.classList.contains('active'))infoOpener?.focus({preventScroll:true});});
  $('pwModeBack')?.addEventListener('click',()=>{
    done.classList.remove('active');
    home.classList.add('active');
    home.scrollTop=0;
    selected='foundation';window.PW_LAST_COMPLETION=null;
    updateHome();
    $('pwModeChoose')?.focus({preventScroll:true});
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
      if(focus.has(selected))return focusPack(selected,focusSessionLocale||locale()).steps[step-1]?.hint||'';
      if(selected!=='metta')return '';
      return copy[locale()]?.steps?.[step-1]?.example||'';
    },
    totals:stats,
    refresh:renderCopy,
    start:requestStart,
    refreshIntroChoices
  };
  document.documentElement.classList.add('pw-modes-ready');
  renderCopy();
})();