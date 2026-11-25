// Shared account controls: unchanged isolated Auth logic, product copy on the prepared Web build.
import { createPreviewAccount } from './preview-account.mjs';
import { createGoogleFlow } from './google-flow.mjs';
import { formatProgressExport } from './progress-export.mjs';
import {t,localizeProgress,guestClaimText,productProgress} from './progress-copy.mjs';

export async function mountAccountPanel({ledger,refresh,canSwitch,settle,show,canDelete=canSwitch}) {
  const cfg=globalThis.PW_V2_AUTH_CONFIG;
  if(!cfg)return null;
  if(location.origin!=="https://preview-5.peaceful-world.org"||location.pathname!=="/progress-v2-owner-pilot-20261125/"||navigator.serviceWorker?.controller||cfg.endpoint!=="https://infxxghlchechanqkjwx.supabase.co"||cfg.googleEnabled!==false||!globalThis.supabase?.createClient)throw Error('Isolated owner account pilot only');
  const sdk=globalThis.supabase.createClient(cfg.endpoint,cfg.publishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce',storage:window.PW_REVIEW_STORAGE,storageKey:'pw-focus-owner-pilot-20261125-v1-auth'}
  });
  const google=createGoogleFlow({auth:sdk.auth,endpoint:cfg.endpoint,appUrl:new URL(location.pathname,location.origin).href,
    storage:window.PW_REVIEW_SESSION,quarantineStorage:window.PW_REVIEW_STORAGE,enabled:cfg.googleEnabled===true,
    navigate:url=>location.assign(url),cleanUrl:url=>{const next=new URL(url);next.searchParams.set('mode','practice');history.replaceState(null,'',next.href);}});
  const panel=document.createElement('details');
  panel.id='pwV2AccountPanel';
  panel.style.cssText='margin:12px 0;padding:12px;border:1px solid currentColor;border-radius:12px;text-align:left;display:grid;gap:8px;font-size:14px';
  panel.innerHTML='<summary data-progress-copy="Account and backup">Progress account (optional · QA)</summary>'+
    '<p id="pwV2AccountState" role="status" aria-live="polite"></p>'+
    '<div id="pwV2LoginFields"><p data-progress-copy="Use an email link to sign in. You can keep practising without an account.">Use an email link to sign in. You can keep practising without an account.</p>'+
    '<label for="pwV2Email" data-progress-copy="Email">Email</label><input id="pwV2Email" type="email" autocomplete="email" maxlength="254" style="display:block;width:100%">'+
    '<button id="pwV2Send" type="button" data-progress-copy="Send sign-in link">Send sign-in link</button><button id="pwV2Google" type="button" hidden>Continue with Google (QA)</button></div>'+
    '<div id="pwV2AccountActions" hidden><button id="pwV2Sync" type="button" data-progress-copy="Sync now">Sync now</button>'+
    '<button id="pwV2GuestClaim" type="button" hidden></button><button id="pwV2SignOut" type="button" data-progress-copy="Sign out on this device">Sign out on this device</button></div>'+
    '<div id="pwV2Removal" hidden><p data-progress-copy="Delete your account, cloud history and its saved v2 copy on this device. Other guest data, old app storage and other devices are not erased. Export first if you want a copy.">Delete your account, cloud history and its saved v2 copy on this device. Other guest data, old app storage and other devices are not erased. Export first if you want a copy.</p><button id="pwV2Delete" type="button" data-progress-copy="Delete account and saved history">Delete account and saved history</button><p id="pwV2DeleteHelp" hidden><a href="delete-data.html" data-progress-copy="Account deletion help">Account deletion help</a></p></div>'+
    '<button id="pwV2Export" type="button" data-progress-copy="Export saved progress (JSON)">Export saved progress (JSON)</button>'+
    '<button id="pwV2Reload" type="button" hidden data-progress-copy="Retry account verification">Retry account verification</button>'+
    '<p id="pwV2AccountNotice" role="status" aria-live="polite"></p>';
  document.getElementById('pwModeProgress').after(panel);
  const el=id=>document.getElementById(id);
  let noticeSource='';
  const notice=msg=>{noticeSource=msg;el('pwV2AccountNotice').textContent=t(msg);};
  let busy=false,snapshot=null,claim=null,revision=0,scheduled=null,ready=false,googleNavigating=false;
  const stateText=el('pwV2AccountState');
  const account=createPreviewAccount({ledger,auth:sdk.auth,...cfg,onChange:()=>render(),onError:notice,onSignedOut:()=>google.clearAfterSignOut(),onDeleted:()=>{try{window.PW_REVIEW_SESSION.setItem('pw-v2-deletion-completed','1');}catch(_){}}});
  function render(){
    const s=account.state();
    localizeProgress(panel);el('pwV2AccountNotice').textContent=t(noticeSource);
    const disabled=busy||s.transitioning||s.syncing||googleNavigating;
    el('pwV2Google').hidden=cfg.googleEnabled!==true;
    el('pwV2LoginFields').hidden=!!(s.signedIn||s.pendingEmail||s.unavailable);
    el('pwV2AccountActions').hidden=!(s.signedIn||s.unavailable);
    el('pwV2Sync').hidden=!s.signedIn;
    el('pwV2Reload').hidden=!s.unavailable||s.deletionPending;
    el('pwV2SignOut').hidden=s.deletionPending;
    el('pwV2Removal').hidden=true;
    el('pwV2Delete').disabled=disabled;
    const deleteCopy=s.deletionPending?'Resume account deletion':'Delete account and saved history';
    el('pwV2Delete').dataset.progressCopy=deleteCopy;el('pwV2Delete').textContent=t(deleteCopy);
    el('pwV2DeleteHelp').hidden=!s.deletionPending;
    el('pwV2Export').disabled=disabled||s.unavailable;
    el('pwV2Export').hidden=s.unavailable;
    el('pwV2GuestClaim').hidden=!s.signedIn||!claim?.ids.length;
    if(claim?.ids.length)el('pwV2GuestClaim').textContent=guestClaimText(claim.practices,claim.seconds);
    for(const id of ['pwV2Send','pwV2Sync','pwV2GuestClaim','pwV2SignOut','pwV2Google'])el(id).disabled=disabled;
    const pending=!!(snapshot?.pending||snapshot?.legacyPending);
    let key='local',message=t('No account · saved on this device only');
    if(s.deletionPending){key='unavailable';message=t(s.deletionPhase==='requested'?'Account deletion not confirmed. Previous history is protected; retry or request help.':'Cloud account deleted. Device cleanup or sign-out still needs confirmation.');}
    else if(s.unavailable){key='unavailable';message=t('Account verification unavailable. Prior account data remains separate.');}
    else if(s.signedIn){
      key=s.syncing?'syncing':s.syncError?'pending':pending?'pending':snapshot?.reconciliation.state==='complete'?'synced':'pending';
      const label={syncing:'Synchronizing…',pending:'Saved locally · cloud not confirmed',synced:'Cloud synchronized'}[key];
      message=t(label)+' · '+s.email;
    }
    stateText.dataset.state=key;stateText.textContent=message;
    if(s.transitioning)show('pending',t('Account transition · progress hidden until verified'));
    else if(snapshot||s.unavailable)show(key,message);
    if(s.transitioning)window.PW_TRAINING_MODES?.refresh?.();
    if(s.transitioning||productProgress())document.dispatchEvent(new CustomEvent('pw:v2-account-state'));
  }
  async function update(next){
    snapshot=next;
    const seq=++revision;
    claim=null;render();
    if(account.state().signedIn&&panel.open&&canSwitch()){
      try{
        const offer=await ledger.guestOffer();
        if(seq===revision&&account.state().signedIn){claim=offer;render();}
      }catch(_){}
    }
  }
  async function action(fn,fallback,{transition=false}={}){
    if(busy||googleNavigating||account.state().syncing||account.state().transitioning)return;
    busy=true;render();notice('');
    try{
      if(!canSwitch())throw Error('Return to the practice selection screen first');
      if(transition)await settle();
      await fn();
    }catch(_){notice(fallback);}
    finally{busy=false;render();}
  }
  async function synchronize(){
    if(!ready||!account.state().signedIn||account.state().transitioning)return;
    try{await account.syncNow();await refresh();notice('');}
    catch(_){
      try{await refresh();}catch(_){}
      notice('Cloud synchronization not confirmed. Saved records will remain on this device; retry when connected.');
    }finally{render();}
  }
  function schedule(){
    if(!ready||!account.state().signedIn||scheduled!==null)return;
    scheduled=setTimeout(()=>{
      scheduled=null;
      if(canSwitch()&&!busy&&!account.state().transitioning&&!account.state().syncing)void synchronize();
    },300);
  }
  el('pwV2Google').onclick=()=>action(async()=>{await google.begin();googleNavigating=true;render();},'Google sign-in unavailable. You can still use email.',{transition:true});
  el('pwV2Send').onclick=()=>action(async()=>{
    await account.send(el('pwV2Email').value.trim());
    location.replace(new URL('check-email.html',location.href));
  },'Could not send a sign-in link. Check your address and wait before trying again.');
  el('pwV2SignOut').onclick=()=>action(()=>account.signOut(),'Sign-out not confirmed. Reload before retrying.',{transition:true});
  el('pwV2Reload').onclick=()=>{if(canSwitch())location.reload();};
  el('pwV2Sync').onclick=()=>action(synchronize,'Cloud synchronization not confirmed.');
  el('pwV2Delete').onclick=()=>{
    if(!productProgress())return; // Product candidate only; old QA controls unchanged.
    if(!canDelete()){notice('Finish your current practice before deleting the account.');return;}
    const before=account.state();
    if(!before.deletionPending&&!window.confirm(t('Permanently delete this account, its cloud history and its v2 copy on this device? This cannot be undone. Export first if needed.')))return;
    void action(async()=>{
      if(!canDelete())throw Error('Timer still active');
      const after=account.state();
      if(before.owner!==after.owner||before.deletionPending!==after.deletionPending)throw Error('Account changed');
      try{await account.deleteAccount();}
      catch(error){if(account.state().deletionPending)await refresh();throw error;}
    },'Account deletion not fully confirmed. Retry or request help. No other history was removed.',{transition:true});
  };
  el('pwV2Export').onclick=()=>action(async()=>{
    const before=account.state();
    if(before.unavailable||before.transitioning)throw Error('Verify the active progress partition first');
    const data=formatProgressExport(await ledger.read(),before.owner);
    const after=account.state();
    if(after.owner!==before.owner||after.unavailable||after.transitioning)throw Error('Account changed');
    const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download='peaceful-world-progress.json';
    document.body.append(link);
    try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    notice('Local copy prepared for download. Sync first for a recent cloud copy. Unadopted earlier progress is not included.');
  },'Progress export failed. No records changed.',{transition:true});
  el('pwV2GuestClaim').onclick=()=>action(async()=>{
    const selected=claim?.ids?.slice()||[];
    if(!selected.length)return;
    await ledger.claimGuest(selected);
    await refresh();
    await synchronize();
  },'Transfer not confirmed; the original records remain protected.',{transition:true});
  const callback=window.PW_PILOT_CALLBACK;
  const code=callback?.takeCode();
  const result=code ? await sdk.auth.exchangeCodeForSession(code).catch(()=>null) : null;
  const callbackResult=callback?.failed || (code && !result?.data?.session) ? 'failed' : 'none';
  await account.start({blockSession:callbackResult==='blocked'});
  if(callbackResult==='cancelled')notice('Google sign-in cancelled. You can still practise without an account.');
  if(callbackResult==='failed')notice('Sign-in link is invalid, expired, or opened in a different browser. Request a new link.');
  if(callbackResult==='blocked')notice('Account verification incomplete. Sign out before retrying.');
  try{if(window.PW_REVIEW_SESSION.getItem('pw-v2-deletion-completed')==='1'){window.PW_REVIEW_SESSION.removeItem('pw-v2-deletion-completed');notice('Account and its v2 history deleted. Other device data was preserved.');panel.open=true;}}catch(_){}
  ready=true;
  // The initial real restore is performed by the runtime after reading the
  // legacy offer and before rehydrating the active timer.
  window.addEventListener('online',schedule);
  document.addEventListener('pw:completion-changed',schedule);
  const home=document.getElementById('home');
  new MutationObserver(()=>{if(home.classList.contains('active'))schedule();}).observe(home,{attributes:true,attributeFilter:['class']});
  panel.addEventListener('toggle',()=>{if(panel.open&&snapshot)void update(snapshot);});
  if(productProgress()){
    document.addEventListener('pw:locale-changed',render);
    document.addEventListener('pw:locale-ready',render);
  }
  render();
  return Object.freeze({state:account.state,update,synchronize,schedule,blocksStart:()=>busy||googleNavigating||account.state().transitioning||account.state().syncing,close:account.close});
}
