/* Pilot-only adapter: no foundation/Metta counters or remote services. */
'use strict';
(() => {
 const data=window.PW_FOCUS_PILOT;
 if(!Array.isArray(data)||data.length!==9||data.some(p=>p.steps.length!==5)) throw new Error('Incomplete pilot copy');
 const list=document.getElementById('pwModeCards');
 let current=null,lastButton=null;
 const make=(tag,cls,t)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(t)e.textContent=t;return e};
 document.documentElement.classList.add('pw-modes-ready');
 for(const p of data){
  const card=make('article','practice-choice practice-choice--metta');card.setAttribute('role','listitem');
  const heading=make('div','practice-choice-heading'),title=make('h3','practice-choice-title',p.name);
  title.id='title-'+p.id;card.setAttribute('aria-labelledby',title.id);heading.append(title);
  const detail=make('div','practice-choice-detail-row');detail.append(make('p','practice-choice-description',p.description));
  const btn=make('button','practice-card-cta practice-card-cta--metta');btn.type='button';btn.dataset.practiceId=p.id;
  btn.append(make('span','','Начать · 5 минут'),make('span','','→'));btn.lastChild.setAttribute('aria-hidden','true');btn.setAttribute('aria-label','Начать: '+p.name);
  btn.addEventListener('click',()=>{current=p;lastButton=btn;document.getElementById('pilotPracticeLabel').textContent=p.name;document.getElementById('donePractice').textContent=p.name;document.getElementById('startBtn').click();});
  card.append(heading,detail,btn);list.append(card);
 }
 window.PW_COPY_ROTATION={startSession(){return current?.steps.map(s=>({title:s.title,guide:s.guide}))||[];},completeSession(){return null;},get copyVersion(){return current?.id+'-'+current?.version;},get currentLocale(){return 'ru';}};
 window.PW_TRAINING_MODES={example(n){return current?.steps[n-1]?.hint||'';}};
 window.PW_PILOT_VIEW={get current(){return current;},focusLast(){lastButton?.focus({preventScroll:true});}};
 window.PW_I18N={locale:'ru',ready:Promise.resolve(),text(key,fallback,vars){return String(key==='done.title'?'Тренировка завершена':fallback??'').replace(/\{(\w+)\}/g,(_,k)=>String(vars?.[k]??''));}};
 const theme=document.getElementById('themeToggle');
 function refresh(){theme.textContent=document.documentElement.dataset.pwTheme==='dark'?'Светлая тема':'Тёмная тема';}
 theme.addEventListener('click',()=>{const next=document.documentElement.dataset.pwTheme==='dark'?'light':'dark';document.documentElement.dataset.pwTheme=next;document.documentElement.style.colorScheme=next;try{localStorage.setItem('pw-focus-pilot-theme',next);}catch(_){}refresh();});
 refresh();
 document.getElementById('demoLabel').hidden=!new URLSearchParams(location.search).has('demo');
})();
