// Local-only Web/PWA integration candidate. Never loaded by production.
import { openLocalLedger } from './local-ledger.mjs';
import { captureLegacy } from './legacy-import.mjs';
import { mountAccountPanel } from './account-panel.mjs';
import {createTrackingPolicy,beginGuided,beginFree,recordFree as writeFree} from './tracking-policy.mjs';
import {mountTrackingPanel} from './tracking-panel.mjs';
import {createLegacyGate} from './legacy-gate.mjs';
import {mountMyProgress} from './my-progress.mjs';
import {progressView} from './my-progress-view.mjs';
import {t,productProgress} from './progress-copy.mjs';

export async function startPreview() {
  const status = document.getElementById('pwV2PreviewStatus');
  const offerButton = document.getElementById('pwV2AdoptLegacy');
  const retryButton = document.getElementById('pwV2Retry');
  let policy=null, gate=null;
  const show = (state, message) => { status.dataset.state = state; status.textContent = policy&&!policy.state().record&&state!=='error'?t('Recording paused · previous history: ')+message:message; };
  let retry = null;
  function report(error, retryFn = null) {
    retry = retryFn;
    retryButton.hidden = !retry;
    show('error',productProgress()?t('Local save not confirmed. Please retry.'):'Local save not confirmed. '+(error?.message||'Please retry.'));
  }
  retryButton.addEventListener('click', () => { if (retry) void retry(); });
  // One writer per isolated preview origin. Fail closed if unavailable;
  // production will need broader browser/native lifecycle validation.
  if (!navigator.locks) { const e = Error('Web Locks unavailable'); report(e); throw e; }
  await new Promise((resolve, reject) => {
    navigator.locks.request('pw-progress-integrated-20261125-v1', { ifAvailable: true }, async lock => {
      if (!lock) { reject(Error('Another preview tab is active. Close it and reload.')); return; }
      resolve();
      await new Promise(() => {}); // released by the browser when document dies
    }).catch(reject);
  }).catch(e => { report(e); throw e; });
  const ledger = await openLocalLedger({ name: 'pw-progress-integrated-20261125-v1' });
  ledger.activate();
  policy=createTrackingPolicy({storage:window.PW_REVIEW_STORAGE});
  const warning=document.getElementById('pwV2LegacyRecovery');
  gate=createLegacyGate({storage:window.PW_REVIEW_STORAGE,ledger,capture:captureLegacy,onBlocked:()=>{
    offerButton.hidden=true;
    warning.hidden=false;
    warning.textContent=t('Earlier progress needs recovery. New practices are not recorded until resolved. Original data is preserved.');
  }});
  const effective=gate.policy(policy);
  let snapshot, guided = null, freeId = null, tail = Promise.resolve(), panel=null, timerStarting=false, legacyBusy=false, freeHandle=null, preferences=null, myProgress=null;
  const canSwitch=()=>!guided&&!timerStarting&&!legacyBusy&&(!freeHandle||freeHandle.recorded)&&!preferences?.blocksStart()&&(document.getElementById('home').classList.contains('active')||document.getElementById('done').classList.contains('active'));
  const settle=async()=>{await tail;if(!canSwitch())throw Error('Timer still active');};
  const allowed=()=>{if(timerStarting||legacyBusy||panel?.blocksStart()||preferences?.blocksStart())throw Error('Progress operation in progress');};
  const zero={guided_practices:0,guided_seconds:0,metta_practices:0,metta_seconds:0,free_practices:0,free_seconds:0,practices:0,seconds:0,calendar:new Map()};
  function committed() { retry = null; retryButton.hidden = true; if(panel)void panel.update(snapshot);else show('local','Preview · saved on this device only'); }
  async function refresh() {
    snapshot = await ledger.read();
    if(panel)await panel.update(snapshot);
    preferences?.render();
    document.dispatchEvent(new CustomEvent('pw:progress-restored'));
    window.PW_TRAINING_MODES?.refresh?.();
    return snapshot;
  }
  // Do not remove or update the v1 counters. Old incomplete Free timers must
  // be resolved before cutover; an invalid snapshot cannot silently reset.
  try {
    panel=await mountAccountPanel({ledger,refresh,canSwitch,settle,show,canDelete:()=>canSwitch()&&!freeHandle});
    const offer=await gate.prepare();
    if (offer) {
      if (!panel?.state().deletionPending && offer && (offer.state === 'offered' || (offer.state === 'local' && panel?.state().signedIn))) {
        const offerCopy=panel?.state().signedIn?'Move earlier progress to this account':'Keep previous progress on this device';
        offerButton.dataset.progressCopy=offerCopy;offerButton.textContent=t(offerCopy);
        offerButton.hidden = false;
        offerButton.addEventListener('click', async () => {
          if(!canSwitch()||panel?.blocksStart())return;
          legacyBusy=true;offerButton.disabled = true;
          try { await gate.adopt(offer.id); await refresh(); committed(); offerButton.hidden = true; if(panel?.state().signedIn)await panel.synchronize(); }
          catch (e) { report(e); }
          finally { legacyBusy=false;offerButton.disabled = false; }
        });
      }
    }
    await refresh();
    if(panel?.state().signedIn)await panel.synchronize();
    // Guided timer cannot be resumed in this candidate: discard only zero-time drafts.
    for (const row of snapshot.rows.filter(r => r.mode !== 'free' && !r.completed && r.seconds === 0)) await ledger.discardDraft(row.id);
    await refresh();
    const open = snapshot.rows.filter(r => r.mode === 'free' && !r.completed);
    if (policy.state().record && !gate.reason() && open.length > 1) throw Error('Multiple unfinished Free sessions need reconciliation');
    freeId = policy.state().record&&!gate.reason()?(open[0]?.id ?? null):null;
    freeHandle=freeId?Object.freeze({recorded:true,id:freeId}):null;
    preferences=mountTrackingPanel({policy,canChange:()=>canSwitch()&&!gate.reason()&&!freeHandle&&!panel?.blocksStart(),getCalendar:()=>productProgress()?progressView(snapshot,panel?.state(),policy.state()).calendar:panel?.state().transitioning?new Map():snapshot.totals.calendar});
    if(productProgress()){
      myProgress=mountMyProgress({getSnapshot:()=>snapshot,getAccount:()=>panel?.state(),getPreferences:policy.state});
      retryButton.textContent=t('Retry saving');
      const localizeWarnings=()=>{
        retryButton.textContent=t('Retry saving');
        if(!warning.hidden)warning.textContent=t('Earlier progress needs recovery. New practices are not recorded until resolved. Original data is preserved.');
      };
      document.addEventListener('pw:locale-changed',localizeWarnings);
      document.addEventListener('pw:locale-ready',localizeWarnings);
    }
    document.addEventListener('pw:v2-account-state',()=>preferences.render());
    window.addEventListener('storage',()=>gate.check());
    committed();
  } catch (e) { report(e); throw e; }
  const api = {
    get totals() { return panel?.state().transitioning||panel?.state().deletionPending||!policy.state().record?zero:snapshot.totals; },
    get recordingEnabled(){return policy.state().record&&!gate.reason();},
    recoveryState:()=>gate.reason(),
    trackingState:()=>policy.state(),
    get freeSeconds() { return panel?.state().transitioning?0:(snapshot.rows.find(r => r.id === freeId)?.seconds ?? 0); },
    inspect: () => ledger.read(),
    accountState:()=>panel?.state()??null,
    report,
    async startGuided(mode, demo) {
      allowed();timerStarting=true;
      try { if(guided)throw Error('Previous guided session has not been resolved'); if(!demo)guided=await beginGuided(ledger,effective,mode); }
      finally {timerStarting=false;}
    },
    async finishGuided() {
      if (!guided) return; // demo
      await guided.record(300, true);
      await refresh(); guided = null; committed();
    },
    async abandonGuided() {
      if (!guided) return;
      await guided.discard(); await refresh(); guided = null; committed();
    },
    async startFree() {
      allowed();timerStarting=true;
      try { if(freeHandle===null){freeHandle=await beginFree(ledger,effective);freeId=freeHandle.id;if(freeHandle.recorded)await refresh();} }
      finally{timerStarting=false;}
    },
    recordFree(seconds, completed) {
      const handle=freeHandle;
      if(!handle)return Promise.reject(Error('Free session missing'));
      const task = tail.catch(() => {}).then(async () => {
        await writeFree(ledger,handle,seconds,completed);
        if(handle.recorded)await refresh();
        if(completed&&freeHandle===handle){freeHandle=null;freeId=null;}
        committed();
      });
      tail = task;
      return task;
    }
  };
  return Object.freeze(api);
}
