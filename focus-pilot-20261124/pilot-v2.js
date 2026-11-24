
/* Catalog and fast review controls, confined to this preview. */
'use strict';
(() => {
  const el=id=>document.getElementById(id);
  const packs=window.PW_FOCUS_PILOT;
  const map=new Map(packs.map(p=>[p.id,p]));
  map.set('metta',{id:'metta',name:'Доброжелательность',description:'От себя ко всем живым.'});
  const groups=[{"id":"care","label":"Отношение","heading":"Отношение к другим","ids":["metta","F01","F02","F03","F08"]},{"id":"thinking","label":"Мышление","heading":"Ясность мышления","ids":["F07","F09"]},{"id":"action","label":"Действие","heading":"Осознанное действие","ids":["F04","F05","F06"]}];
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  const categories=el('pilotCategories'),panels=el('pilotGroups');
  const select=id=>{
    [...categories.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===id)));
    [...panels.children].forEach(p=>p.dataset.active=String(p.dataset.group===id));
  };
  for(const group of groups){
    const tab=make('button','pilot-category',group.label+' · '+group.ids.length);
    tab.type='button';tab.dataset.group=group.id;tab.setAttribute('aria-controls','pilot-group-'+group.id);
    tab.addEventListener('click',()=>select(group.id));categories.append(tab);
    const panel=make('section','pilot-group');panel.id='pilot-group-'+group.id;panel.dataset.group=group.id;
    const heading=make('h3','pilot-group-title',group.heading);heading.id='pilot-heading-'+group.id;
    panel.setAttribute('aria-labelledby',heading.id);panel.append(heading);
    const list=make('div','pilot-list');
    for(const id of group.ids){
      const p=map.get(id);
      const b=make('button','pilot-skill');b.type='button';b.dataset.practiceId=id;b.setAttribute('aria-label','Начать: '+p.name);
      const label=make('span','pilot-skill-label'),title=make('strong','pilot-skill-name',p.name),desc=make('span','pilot-skill-desc',p.description);
      label.append(title,desc);const arrow=make('span','pilot-arrow','→');arrow.setAttribute('aria-hidden','true');b.append(label,arrow);
      b.addEventListener('click',()=>window.PW_TRAINING_MODES.start(id));
      list.append(b);
    }
    panel.append(list);panels.append(panel);
  }
  select('care');
  const fast=IS_DEMO;
  el(fast?'pilotFast':'pilotFull').setAttribute('aria-current','page');
  el('pilotModeNote').textContent=fast?'2 секунды подготовки · 5 секунд на шаг · ручное переключение':'5 секунд подготовки · 60 секунд на шаг';
  const nav=el('pilotStepNav'),prev=el('pilotPrev'),next=el('pilotNext');
  nav.hidden=!fast;
  function syncNav(){
    if(!fast)return;
    prev.disabled=stepIndex<=0;
    next.textContent=stepIndex===STEPS.length-1?'Завершить →':'Дальше →';
    el('pilotStepPosition').textContent=(stepIndex+1)+' / '+STEPS.length;
  }
  function jump(delta){
    if(!fast||!practice.classList.contains('active'))return;
    const target=stepIndex+delta;
    if(target<0)return;
    if(target>=STEPS.length){finish();return;}
    clearPending();transitionLock=false;
    practiceContent.classList.remove('changing','entering');
    timerShell.classList.remove('phase-change');
    stepIndex=target;paused=true;releaseWakeLock();
    begin('practice',PRACTICE,false);
    lastLoopAt=performance.now();
    lastObservedRemainingMs=remainingMs;
    announce(stepAnnouncement());focusQuietly(stepTitle);
    syncNav();
  }
  prev.addEventListener('click',()=>jump(-1));next.addEventListener('click',()=>jump(1));
  new MutationObserver(syncNav).observe(stepCount,{childList:true,characterData:true,subtree:true});
  new MutationObserver(syncNav).observe(practice,{attributes:true,attributeFilter:['class']});
  document.addEventListener('pw:practice-started',syncNav);
  syncNav();
})();
