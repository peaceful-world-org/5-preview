
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
  const scroll=document.documentElement.dataset.pwFocusLayout!=='tabs';
  const icons={
    care:['M20.8 8.6c0-3-2.1-5.1-4.8-5.1-1.8 0-3.3 1-4 2.4-.7-1.4-2.2-2.4-4-2.4-2.7 0-4.8 2.1-4.8 5.1 0 4.1 4.4 7.7 8.8 11.1 4.4-3.4 8.8-7 8.8-11.1Z'],
    thinking:['M12 4c-1.6-2-5.2-1-5.5 1.7C3.4 6.2 3 10 4.8 12c-2.1 2.7-.1 6.1 2.4 6.3.7 2.8 3.9 3.3 4.8 1V4Z','M12 4c1.6-2 5.2-1 5.5 1.7 3.1.5 3.5 4.3 1.7 6.3 2.1 2.7.1 6.1-2.4 6.3-.7 2.8-3.9 3.3-4.8 1','M7 8c2 0 3 1.4 3 3M17 8c-2 0-3 1.4-3 3M7 15c1.2-1 2.5-1 3.5-.3M17 15c-1.2-1-2.5-1-3.5-.3'],
    action:['M8 13c-1.8 0-3-1.8-3-4.2C5 6.2 6.2 4 8.2 4c2 0 2.8 1.7 2.8 3.4 0 2.7-1.1 5.6-3 5.6Z','M6.8 16c-1.2.3-1.7 1.4-1.5 2.5.2 1.1 1.2 1.8 2.4 1.6 1.2-.3 1.7-1.4 1.5-2.5-.2-1.1-1.2-1.8-2.4-1.6Z','M16 11c1.8 0 3-1.8 3-4.2C19 4.2 17.8 2 15.8 2 13.8 2 13 3.7 13 5.4c0 2.7 1.1 5.6 3 5.6Z','M17.2 14c1.2.3 1.7 1.4 1.5 2.5-.2 1.1-1.2 1.8-2.4 1.6-1.2-.3-1.7-1.4-1.5-2.5.2-1.1 1.2-1.8 2.4-1.6Z']
  };
  function groupIcon(id){
    const box=make('span','pilot-group-icon');
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    for(const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.65','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'}))svg.setAttribute(key,value);
    for(const d of icons[id]){const p=document.createElementNS(ns,'path');p.setAttribute('d',d);svg.append(p);}
    box.append(svg);box.setAttribute('aria-hidden','true');return box;
  }
  if(scroll)categories.hidden=true;
  else {
    el('pilotFast').href='./?demo=1&layout=tabs';
    el('pilotFull').href='./?mode=practice&layout=tabs';
  }
  const select=id=>{
    [...categories.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===id)));
    [...panels.children].forEach(p=>p.dataset.active=String(p.dataset.group===id));
  };
  for(const group of groups){
    const tab=make('button','pilot-category',group.label+' · '+group.ids.length);
    tab.type='button';tab.dataset.group=group.id;tab.setAttribute('aria-controls','pilot-group-'+group.id);
    tab.addEventListener('click',()=>select(group.id));categories.append(tab);
    const panel=make('section','pilot-group');panel.id='pilot-group-'+group.id;panel.dataset.group=group.id;
    const heading=make('h3','pilot-group-title',scroll?'':group.heading);heading.id='pilot-heading-'+group.id;
    if(scroll){
      heading.append(groupIcon(group.id),make('span','pilot-group-label',group.heading));
    }
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
  el('pilotModeNote').textContent=fast?'2 секунды подготовки · 5 секунд на шаг · ручное переключение · прогресс не сохраняется':'5 секунд подготовки · 60 секунд на шаг';
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
