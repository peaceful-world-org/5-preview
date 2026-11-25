// Small, provider-independent QA controls; no third-party calendar or analytics.
import { monthDays, localDay } from './tracking-policy.mjs';
import {t,progressLocale,localizeProgress,productProgress} from './progress-copy.mjs';
export function mountTrackingPanel({policy,canChange,getCalendar,reload=()=>location.reload()}){
  const root=document.createElement('details');
  root.id='pwV2TrackingPanel';
  root.style.cssText='margin:12px 0;padding:12px;border:1px solid currentColor;border-radius:12px;text-align:left;font-size:14px';
  root.innerHTML='<summary data-progress-copy="Progress preferences">Progress preferences (this device)</summary>'+
    '<p><label><input id="pwV2Record" type="checkbox"> <span data-progress-copy="Record my practice time and sessions">Record my practice time and sessions</span></label></p>'+
    '<p><label><input id="pwV2Dates" type="checkbox"> <span data-progress-copy="Record dates for my practice calendar">Record dates for my practice calendar</span></label></p>'+
    '<p id="pwV2TrackingNotice" role="status"></p>'+
    '<p data-progress-copy="Turn off recording to pause new records. Your saved history stays. Dates are optional.">Turn off recording to pause new records. Your saved history stays. Dates are optional.</p>'+
    '<div id="pwV2Calendar" hidden><strong data-progress-copy="Practice calendar" class="pw-my-progress-calendar-title">Practice calendar</strong><div style="display:flex;align-items:center;justify-content:space-between"><button id="pwV2PreviousMonth" type="button" aria-label="Previous month" data-progress-aria="Previous month">‹</button><strong id="pwV2MonthLabel"></strong><button id="pwV2NextMonth" type="button" aria-label="Next month" data-progress-aria="Next month">›</button></div>'+
    '<div id="pwV2MonthGrid" role="group" aria-label="Practice days" data-progress-aria="Practice days" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center"></div>'+
    '<div class="pw-calendar-legend"><span><i class="pw-calendar-today-key" aria-hidden="true"></i><span data-progress-copy="Today">Today</span></span><span><i class="pw-calendar-practice-key" aria-hidden="true"></i><span data-progress-copy="Practice completed">Practice completed</span></span></div><p data-progress-copy="Only practices with saved dates appear here.">Only practices with saved dates appear here.</p></div>';
  document.getElementById('pwV2AccountPanel').after(root);
  const el=id=>document.getElementById(id);
  const today=new Date();let year=today.getFullYear(),month=today.getMonth()+1;
  let changing=false;
  function render(){
    const prefs=policy.state();
    localizeProgress(root);localizeProgress(el('pwV2Calendar'));
    const locale=productProgress()?progressLocale():'en';
    el('pwV2Record').checked=prefs.record;
    el('pwV2Dates').checked=prefs.dates;
    el('pwV2Record').disabled=changing;
    el('pwV2Dates').disabled=!prefs.record||changing;
    el('pwV2Calendar').hidden=!prefs.record||!prefs.dates;
    if(!prefs.record)el('pwV2TrackingNotice').textContent=t('Recording paused. You can still practise.');
    if(!prefs.record||!prefs.dates)return;
    const grid=el('pwV2MonthGrid');grid.replaceChildren();
    const date=new Date(0);date.setUTCFullYear(year,month-1,1);
    const currentDay=localDay(new Date());
    el('pwV2MonthLabel').textContent=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'}).format(date);
    for(const label of (productProgress()?Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2024,0,1+i)))):['Mo','Tu','We','Th','Fr','Sa','Su'])){
      const span=document.createElement('span');span.textContent=label;grid.append(span);
    }
    for(const cell of monthDays(getCalendar(),year,month)){
      const span=document.createElement('span');
      if(cell){
        span.textContent=cell.number;
        span.dataset.day=cell.day;span.dataset.count=String(cell.count);
        const isToday=cell.day===currentDay;
        if(isToday){span.dataset.today='true';span.setAttribute('aria-current','date');}
        span.setAttribute('aria-label',(isToday?t('Today')+' · ':'')+cell.day+': '+cell.count+' '+t('Completed practices'));
        if(cell.count)span.classList.add('pw-calendar-practised');
      }else{span.setAttribute('aria-hidden','true');}
      grid.append(span);
    }
    el('pwV2PreviousMonth').disabled=year===1&&month===1;
    el('pwV2NextMonth').disabled=year===9999&&month===12;
  }
  function change(){
    if(changing||!canChange()){
      render();el('pwV2TrackingNotice').textContent=t('Finish your current practice and wait for synchronization before changing this preference.');return;
    }
    try{
      policy.set({record:el('pwV2Record').checked,dates:el('pwV2Dates').checked});
      changing=true;render();reload();
    }catch(_){changing=false;render();el('pwV2TrackingNotice').textContent=t('Preference not saved. Please retry.');}
  }
  el('pwV2Record').onchange=change;el('pwV2Dates').onchange=change;
  el('pwV2PreviousMonth').onclick=()=>{if(month>1)month--;else if(year>1){year--;month=12;}render();};
  el('pwV2NextMonth').onclick=()=>{if(month<12)month++;else if(year<9999){year++;month=1;}render();};
  if(productProgress()){
    document.addEventListener('pw:locale-changed',render);
    document.addEventListener('pw:locale-ready',render);
  }
  render();
  return Object.freeze({render,blocksStart:()=>changing});
}
