// Build only into a new, empty, isolated output directory. Never use the Pages output.
import { readdirSync, mkdirSync, copyFileSync, cpSync, readFileSync, writeFileSync, existsSync, rmSync, realpathSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { copyPreparedWeb } from '../../scripts/progress-v2-prepared-input.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const qa = fileURLToPath(new URL('./', import.meta.url));
if (!process.argv[2]) throw Error('Pass a new isolated output directory');
const mode=process.argv[3];
if(mode!==undefined&&mode!=='--legacy-local'&&mode!=='--prepared-web')throw Error('Unsupported runtime assembly mode');
if((mode==='--prepared-web'&&process.argv.length!==5)||(mode!=='--prepared-web'&&process.argv.length>4))throw Error('Invalid assembly arguments');
const prepared=mode==='--prepared-web'?process.argv[4]:null;
const out = resolve(process.argv[2]);
if (out === resolve(root) || out.startsWith(resolve(root)+'/') || basename(out)==='_site') throw Error('Preview must be outside repository and production output');
if (existsSync(out) && readdirSync(out).length) throw Error('Preview output must be empty');
mkdirSync(out,{recursive:true});
const canonical=realpathSync(out), repository=realpathSync(root);
if(canonical===repository||canonical.startsWith(repository+'/')||basename(canonical)==='_site')throw Error('Candidate must be outside repository and production output');
if(prepared){
  console.log('Copied '+copyPreparedWeb(prepared,out)+' complete Web vNext release assets');
}else{
for (const name of readdirSync(root)) {
  if (/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(html|js|css|svg|png|webmanifest)$/.test(name)) copyFileSync(join(root,name),join(out,name));
}
cpSync(join(root,'locales'),join(out,'locales'),{recursive:true});
execFileSync(process.execPath,[join(root,'scripts/prepare-web-vnext.mjs'),out],{stdio:'inherit'});
}
// Test-only copy of the old v1 timers, with no cloud writer or worker.
// Use the exact same source/localStorage keys as the released web assembly.
if(process.argv[3]==='--legacy-local'){
  const edit=(file,old,next)=>{
    const path=join(out,file),s=readFileSync(path,'utf8');
    if(s.split(old).length!==2)throw Error('Legacy rehearsal anchor changed: '+file);
    writeFileSync(path,s.replace(old,()=>next));
  };
  edit('index.html','<head>',`<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self'; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'">`);
  edit('index.html','  <script src="analytics.js"></script>\n  <script src="feedback.js"></script>','  <!-- External services disabled for legacy upgrade rehearsal. -->');
  edit('index.html',"['free-practice.js?v=3', 'progress-sync.js?v=2']","['free-practice.js?v=3']");
  edit('step-number.js',"  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;","  return; // disposable legacy rehearsal");
  for(const file of ['progress-sync.js','analytics.js','aggregate-analytics.js','feedback.js','ai-guide.js','sw.js'])rmSync(join(out,file),{force:true});
  console.log('Local v1 rehearsal assembled with unchanged credit writers.');
  process.exit(0);
}
function patchPreview(path, text) {
  const replace = (from,to) => {
    if (text.split(from).length!==2) throw Error(path+": preview anchor changed: "+from.slice(0,100));
    text=text.replace(from,()=>to);
  };
  const between=(start,end,to)=>{const a=text.indexOf(start),b=text.indexOf(end,a+start.length);if(a<0||b<0||text.indexOf(start,a+start.length)>=0)throw Error(path+": preview range changed: "+start);text=text.slice(0,a)+to+text.slice(b);};
  if(path==="index.html"){
    replace("<head>",`<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self'; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'">`);
    replace('  <script src="i18n.js"></script>',`  <aside id="pwV2PreviewPanel" style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:var(--bg,#fff);color:var(--ink,#222);border-top:1px solid var(--line,#ccc);font:12px system-ui;padding:5px 12px;text-align:center;pointer-events:none">
    <span id="pwV2PreviewStatus" role="status" data-state="loading">Local QA preview · loading</span>
    <button id="pwV2AdoptLegacy" hidden type="button" style="pointer-events:auto">Keep previous progress on this device</button>
    <button id="pwV2Retry" hidden type="button" style="pointer-events:auto">Retry saving</button>
  </aside>
  <script>
    window.PW_PROGRESS_PREVIEW_READY = import('./progress-v2/preview-runtime.mjs').then(async m => {
      const preview = await m.startPreview();
      window.PW_PROGRESS_PREVIEW = preview;
      document.dispatchEvent(new CustomEvent('pw:progress-restored'));
      window.PW_TRAINING_MODES?.refresh?.();
      return preview;
    });
    window.PW_PROGRESS_PREVIEW_READY.catch(error => {
      const status = document.getElementById('pwV2PreviewStatus');
      status.dataset.state = 'error';
      status.textContent = 'Local QA preview unavailable: ' + error.message;
    });
  </script>
  <script src="i18n.js"></script>`);
    replace('  <script src="analytics.js"></script>\n  <script src="feedback.js"></script>','  <!-- External analytics and feedback disabled in isolated preview. -->');
    replace("['free-practice.js?v=3', 'progress-sync.js?v=2']","['free-practice.js?v=3']");
  }else if(path==="copy-rotation.js"){
    between("  function readCompletedCount() {","  function isNonEmptyString(value) {",`  function readCompletedCount() {
    return window.PW_PROGRESS_PREVIEW?.totals.guided_practices ?? 0;
  }

`);
    replace("    const practiceNumber = readCompletedCount() + 1;\n    writeCompletedCount(practiceNumber);","    const practiceNumber = readCompletedCount(); // already committed by the v2 timer");
  }else if(path==="practice-modes.js"){
    between("  const safeInt = key => {","  const locale = () => {",`  const safeInt = key => {
    const totals = window.PW_PROGRESS_PREVIEW?.totals;
    const fields = {[LEGACY_BASE]:'guided_practices',[METTA_COUNT]:'metta_practices',[FREE_SECONDS]:'free_seconds',[FREE_SESSIONS]:'free_practices'};
    return totals?.[fields[key]] ?? 0;
  };
`);
    replace("    const n=mettaDemo?null:(safeInt(METTA_COUNT)+1);\n    if(n!==null)putInt(METTA_COUNT,n);","    const n=mettaDemo?null:safeInt(METTA_COUNT); // already committed");
  }else if(path==="app.js"){
    replace("async function startPractice() {\n  if (startingPractice) return;","let v2GuidedSaving = false;\nasync function startPractice() {\n  if (startingPractice || v2GuidedSaving) return;");
    replace("    ensureAudio();\n    document.dispatchEvent(new CustomEvent('pw:practice-started', {",`    const v2 = await window.PW_PROGRESS_PREVIEW_READY;
    await v2.startGuided(window.PW_TRAINING_MODES?.mode === 'metta' ? 'metta' : 'foundation', IS_DEMO);
    ensureAudio();
    document.dispatchEvent(new CustomEvent('pw:practice-started', {`);
    replace("    focusQuietly(stepTitle);\n  } finally {\n    startingPractice = false;",`    focusQuietly(stepTitle);
  } catch (error) {
    window.PW_PROGRESS_PREVIEW?.report(error);
    window.PW_I18N?.unlockLocale?.();
  } finally {
    startingPractice = false;`);
    replace("function finish() {\n  stopSession();\n  try { window.PW_COPY_ROTATION?.completeSession?.(); } catch (_) {}",`async function finish() {
  if (v2GuidedSaving) return;
  v2GuidedSaving = true;
  stopSession();
  closeBtn.disabled = true;
  pauseBtn.disabled = true;
  try {
    await (await window.PW_PROGRESS_PREVIEW_READY).finishGuided();
    window.PW_COPY_ROTATION?.completeSession?.();
  } catch (error) {
    window.PW_PROGRESS_PREVIEW?.report(error, finish);
    return;
  } finally {
    v2GuidedSaving = false;
    closeBtn.disabled = false;
    pauseBtn.disabled = false;
  }`);
    replace("function exit() {\n  stopSession();\n  show(home);",`async function exit() {
  if (v2GuidedSaving) return;
  v2GuidedSaving = true;
  stopSession();
  try { await (await window.PW_PROGRESS_PREVIEW_READY).abandonGuided(); }
  catch (error) { window.PW_PROGRESS_PREVIEW?.report(error, exit); return; }
  finally { v2GuidedSaving = false; }
  show(home);`);
  }else if(path==="free-practice.js"){
    between("  function completedPractices() {","  function formatTotal(seconds) {",`  function freeSessions() { return window.PW_PROGRESS_PREVIEW?.totals.free_practices ?? 0; }
  function totalTrainingCount() { return window.PW_PROGRESS_PREVIEW?.totals.practices ?? 0; }
  function totalSeconds() { return window.PW_PROGRESS_PREVIEW?.totals.seconds ?? 0; }

`);
    between("  function loadSession() {","  async function acquireWakeLock() {",`  const v2Demo = new URLSearchParams(location.search).has('demo') || location.pathname.endsWith('demo.html');
  let queuedSeconds = 0, startingFree = false, finishingFree = false;
  async function loadSession() {
    if (v2Demo) return;
    const v2 = await window.PW_PROGRESS_PREVIEW_READY;
    elapsedMs = v2.freeSeconds * 1000;
    creditedSeconds = queuedSeconds = v2.freeSeconds;
    lastSoundSecond = creditedSeconds;
  }

  function currentMs() {
    return elapsedMs + (running ? Math.max(0, performance.now() - runStartedAt) : 0);
  }

  // Recovery reads committed whole seconds from IndexedDB, never the v1 checkpoint.
  function saveSession() {}
  function creditElapsedSeconds(ms) {
    const whole = Math.floor(Math.max(0, ms) / 1000);
    const v2 = window.PW_PROGRESS_PREVIEW;
    if (v2Demo || !v2 || whole <= queuedSeconds) return;
    queuedSeconds = whole;
    void v2.recordFree(whole, false).then(() => {
      creditedSeconds = Math.max(creditedSeconds, whole);
      renderOdometer();
    }).catch(error => {
      if (queuedSeconds === whole) queuedSeconds = creditedSeconds;
      v2.report(error);
    });
  }

`);
    between("  function startTimer({ resumed = false } = {}) {","  function pauseTimer() {",`  async function startTimer({ resumed = false } = {}) {
    if (running || startingFree || finishingFree) return;
    startingFree = true;
    try {
      await freeReady;
      const v2 = await window.PW_PROGRESS_PREVIEW_READY;
      if (!v2Demo) await v2.startFree();
      if (document.hidden || !screen.classList.contains('active')) return;
      const firstStart = !resumed && elapsedMs <= 0;
      running = true;
      runStartedAt = performance.now();
      lastSoundSecond = Math.floor(elapsedMs / 1000);
      primaryBtn.textContent = s().pause;
      if (firstStart) {
        playBoundarySignal();
        document.dispatchEvent(new CustomEvent('pw:practice-started', { detail:{ mode:'free' } }));
      }
      void acquireWakeLock();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    } catch (error) { window.PW_PROGRESS_PREVIEW?.report(error); }
    finally { startingFree = false; }
  }

`);
    between("  function finishTimer() {","  entry.addEventListener('click', showFreeTimer);",`  async function finishTimer() {
    if (startingFree || finishingFree) return;
    finishingFree = true;
    finishBtn.disabled = primaryBtn.disabled = backBtn.disabled = true;
    try {
      await freeReady;
      if (running) pauseTimer();
      const whole = Math.floor(elapsedMs / 1000);
      if (whole < 1) return;
      const v2 = await window.PW_PROGRESS_PREVIEW_READY;
      if (!v2Demo) await v2.recordFree(whole, true);
      window.PW_LAST_COMPLETION = { mode:'free', durationSeconds:v2Demo?null:whole, freePracticeNumber:v2Demo?null:freeSessions(), demo:v2Demo };
      document.dispatchEvent(new CustomEvent('pw:completion-changed'));
      playBoundarySignal();
      elapsedMs = creditedSeconds = queuedSeconds = lastSoundSecond = 0;
      renderOdometer();
      showCompletion();
    } catch (error) { window.PW_PROGRESS_PREVIEW?.report(error, finishTimer); }
    finally { finishingFree = false; finishBtn.disabled = primaryBtn.disabled = backBtn.disabled = false; }
  }

`);
    replace("  loadSession();\n  renderCopy();\n  renderTimer(elapsedMs);",`  const freeReady = loadSession();
  freeReady.then(() => { renderCopy(); renderTimer(elapsedMs); }, error => window.PW_PROGRESS_PREVIEW?.report(error));
  renderCopy();
  renderTimer(elapsedMs);`);
  }else if(path==="step-number.js"){
    replace("  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;","  return; // isolated preview must not register the production service worker");
  }else throw Error("Unexpected preview file "+path);
  return text;
}
for(const file of ["index.html","copy-rotation.js","practice-modes.js","app.js","free-practice.js","step-number.js"]) {
  const path=join(out,file);
  writeFileSync(path,patchPreview(file,readFileSync(path,'utf8')));
}
for(const file of ['progress-sync.js','analytics.js','aggregate-analytics.js','feedback.js','ai-guide.js','sw.js']) rmSync(join(out,file),{force:true});
mkdirSync(join(out,'progress-v2'));
for(const file of ['ledger-contract.mjs','legacy-import.mjs','local-ledger.mjs','preview-runtime.mjs','account-removal.mjs']) copyFileSync(join(qa,file),join(out,'progress-v2',file));
console.log('Local-only runtime preview built; no production service worker or cloud scripts.');
