// One product entry on Home. Reuse the existing tested controls and listeners.
import {progressView,minutesText} from './my-progress-view.mjs';
import {t,progressLocale,localizeProgress} from './progress-copy.mjs';

function rememberOpen(details,key){
  const storageKey='pw-my-progress-ui-'+key;
  try{details.open=window.PW_REVIEW_SESSION.getItem(storageKey)==='1';}catch(_){}
  details.addEventListener('toggle',()=>{
    try{window.PW_REVIEW_SESSION.setItem(storageKey,details.open?'1':'0');}catch(_){}
  });
}
export function mountMyProgress({getSnapshot,getAccount,getPreferences}){
  const root=document.createElement('details');
  root.id='pwMyProgress';
  root.className='pw-my-progress';
  root.innerHTML=
    '<summary><span data-progress-copy="My progress">My progress</span><span id="pwMyProgressBrief" class="pw-my-progress-brief"></span></summary>'+
    '<div class="pw-my-progress-body">'+
      '<p id="pwMyProgressEmpty" role="status" hidden></p>'+
      '<div id="pwMyProgressHistory" hidden>'+
        '<div class="pw-my-progress-totals">'+
          '<div><strong id="pwMyProgressTime"></strong><span data-progress-copy="Time in practice">Time in practice</span></div>'+
          '<div><strong id="pwMyProgressCount"></strong><span data-progress-copy="Completed practices">Completed practices</span></div>'+
        '</div>'+
        '<table class="pw-my-progress-modes"><thead><tr><th scope="col" data-progress-copy="Practice">Practice</th><th scope="col" data-progress-copy="Time">Time</th><th scope="col" data-progress-copy="Sessions">Sessions</th></tr></thead><tbody id="pwMyProgressModes"></tbody></table>'+
      '</div>'+
      '<div id="pwMyProgressControls"></div>'+
    '</div>';
  const el=id=>root.querySelector('#'+id);
  const cards=document.getElementById('pwModeCards');
  const controls=el('pwMyProgressControls');
  const account=document.getElementById('pwV2AccountPanel'),settings=document.getElementById('pwV2TrackingPanel');
  const adopt=document.getElementById('pwV2AdoptLegacy');
  if(!cards||!account||!settings||!adopt)throw Error('Missing progress interface');
  cards.after(root);
  for(const panel of [account,settings])panel.removeAttribute('style');
  controls.append(adopt,settings,account);
  const calendar=document.getElementById('pwV2Calendar');
  el('pwMyProgressHistory').before(calendar);
  rememberOpen(root,'main');rememberOpen(settings,'settings');rememberOpen(account,'account');
  if(window.PW_PILOT_CALLBACK){root.open=true;account.open=true;}
  if(!adopt.hidden)root.open=true; // Explicit choice is visible; never auto-adopt.
  const titleIds={foundation:'pwCardBaseTitle',metta:'pwCardMettaTitle',free:'pwCardFreeTitle'};
  function render(){
    localizeProgress(root);
    const state=getAccount(),prefs=getPreferences();
    const view=progressView(getSnapshot(),state,prefs);
    const locale=progressLocale(),nf=new Intl.NumberFormat(locale);
    const history=el('pwMyProgressHistory'),empty=el('pwMyProgressEmpty');
    history.hidden=!view.visible;
    root.dataset.historyVisible=String(view.visible);
    empty.hidden=view.visible;
    const brief=el('pwMyProgressBrief');
    if(!view.visible){
      // Clear all old owner values, not merely hide the previous account.
      el('pwMyProgressTime').textContent='';el('pwMyProgressCount').textContent='';
      el('pwMyProgressModes').replaceChildren();brief.textContent=t(view.reason==='paused'?'Recording paused':'Verify account');
      empty.textContent=t(view.reason==='paused'?'Recording paused. You can still practise.':'History is protected until the account is verified.');
      return;
    }
    const cloud=document.getElementById('pwV2AccountState')?.dataset.state;
    brief.textContent=t(({synced:'Cloud synchronized',syncing:'Synchronizing…',pending:'Saved locally · cloud not confirmed',unavailable:'Verify account'})[cloud]||'On this device');
    el('pwMyProgressTime').textContent=minutesText(view.seconds,locale);
    el('pwMyProgressCount').textContent=nf.format(view.practices);
    const list=el('pwMyProgressModes');list.replaceChildren();
    for(const row of view.modes){
      const line=document.createElement('tr');
      const label=document.createElement('th'),time=document.createElement('td'),count=document.createElement('td');
      label.scope='row';
      label.textContent=document.getElementById(titleIds[row.mode])?.textContent||window.PW_FOCUS_PILOT?.find(p=>p.id===row.mode)?.name||row.mode;
      time.textContent=minutesText(row.seconds,locale);
      count.textContent=nf.format(row.practices);
      line.append(label,time,count);list.append(line);
    }
  }
  document.addEventListener('pw:progress-restored',render);
  document.addEventListener('pw:v2-account-state',render);
  document.addEventListener('pw:locale-changed',render);
  document.addEventListener('pw:locale-ready',render);
  render();
  return Object.freeze({render});
}
