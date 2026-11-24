// Compile the validated client into an isolated, guest-only review.
import {readFileSync,writeFileSync,cpSync,mkdirSync,readdirSync,rmSync,existsSync} from 'node:fs';
import {resolve,join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const stage=dirname(fileURLToPath(import.meta.url));
const out=resolve(process.argv[2]||'');
const prefix='/progress-v2-review-20261124/';
if(!process.argv[2]||out===stage||out.startsWith(stage+'/')||basename(out)==='_site')throw Error('Isolated output required');
if(existsSync(out)&&readdirSync(out).length)throw Error('Empty output required');
mkdirSync(out,{recursive:true});cpSync(join(stage,'input'),out,{recursive:true});
execFileSync(process.execPath,[join(stage,'scripts/prepare-web-vnext.mjs'),out],{stdio:'inherit'});
const get=p=>readFileSync(join(out,p),'utf8'),put=(p,s)=>writeFileSync(join(out,p),s);
const original=readFileSync(join(stage,'modules/build-runtime-preview.mjs'),'utf8');
const a=original.indexOf('function patchPreview(path, text) {'),b=original.indexOf('\nfor(const file of ',a);
if(a<0||b<0)throw Error('Verified timer patch not found');
const patchPreview=new Function(original.slice(a,b)+'\nreturn patchPreview;')();
for(const p of ['index.html','copy-rotation.js','practice-modes.js','app.js','free-practice.js','step-number.js'])put(p,patchPreview(p,get(p)));
function patch(p,from,to){const s=get(p);if(s.split(from).length!==2)throw Error('Review anchor changed: '+p+' '+from.slice(0,90));put(p,s.replace(from,()=>to));}
patch('practice-modes.js',"    set('pwModeDoneSummaryMode',c.totalTime+separator+formatTime(d.seconds));","    set('pwModeDoneSummaryMode',c.totalTime+separator+formatTime(d.seconds));\n    $('pwModeDoneSummaryMode').hidden=window.PW_PROGRESS_PREVIEW?.recordingEnabled===false;");
patch('practice-modes.js','const n=mettaDemo?null:safeInt(METTA_COUNT); // already committed','const n=mettaDemo||window.PW_PROGRESS_PREVIEW?.recordingEnabled===false?null:safeInt(METTA_COUNT); // already committed');
patch('copy-rotation.js','const practiceNumber = readCompletedCount(); // already committed by the v2 timer','const practiceNumber = window.PW_PROGRESS_PREVIEW?.recordingEnabled===false?null:readCompletedCount(); // already committed by the v2 timer');
patch('index.html','    <button id="pwV2Retry"','    <span id="pwV2LegacyRecovery" role="status" hidden></span>\n    <button id="pwV2Retry"');
patch('index.html','<html lang="ru" data-pw-web-vnext>','<html lang="ru" data-pw-web-vnext data-pw-progress-product>');
patch('index.html','<head>','<head>\n  <meta name="robots" content="noindex,nofollow,noarchive">');
patch('index.html',"form-action 'none'\">","form-action 'none'\">\n  <script src=\"review-storage.js\"></script>");
patch('index.html','</head>','  <link rel="stylesheet" href="progress-v2/my-progress.css">\n  <link rel="stylesheet" href="review.css">\n</head>');
patch('index.html','<body>','<body>\n  <div id="pwReviewBanner" role="note">Тестовая версия · отдельная локальная история</div>');
put('index.html',get('index.html').replace(/^\s*<link rel="manifest"[^>]*>\s*$/m,''));
for(const p of ['progress-sync.js','analytics.js','aggregate-analytics.js','feedback.js','ai-guide.js','sw.js','manifest.webmanifest','demo.html'])rmSync(join(out,p),{force:true});
patch('i18n.js',"'/locales/index.json'","'"+prefix+"locales/index.json'");
const tick=String.fromCharCode(96),expr='$'+'{encodeURIComponent(code)}',assetExpr='$'+'{encodeURIComponent(assetLocale)}';
patch('i18n.js',tick+'/locales/'+expr+'.json'+tick,tick+prefix+'locales/'+expr+'.json'+tick);
patch('step-number.js',"'/ios-install-guide.js?v=1'","'"+prefix+"ios-install-guide.js?v=1'");
patch('step-number.js',"  const script = document.createElement('script');\n  script.src = '/ai-guide.js?v=1';","  return; // AI Guide disabled for this guest review.\n  const script = document.createElement('script');\n  script.src = './disabled-ai-guide.js';");
patch('ios-install-guide.js',"'/ios-guide'","'"+prefix+"ios-guide'");
patch('ios-install-guide.js',tick+'/assets/ios-guide/'+assetExpr+tick,tick+prefix+'assets/ios-guide/'+assetExpr+tick);
const registry=JSON.parse(get('locales/index.json'));
for(const v of Object.values(registry.locales))if(typeof v.privacy==='string'&&v.privacy.startsWith('/'))v.privacy=prefix+v.privacy.slice(1);
put('locales/index.json',JSON.stringify(registry,null,2)+'\n');
const mods='ledger-contract.mjs legacy-import.mjs local-ledger.mjs account-removal.mjs account-runtime.mjs tracking-policy.mjs tracking-panel.mjs legacy-gate.mjs progress-export.mjs progress-copy.mjs my-progress-view.mjs my-progress.mjs my-progress.css'.split(' ');
mkdirSync(join(out,'progress-v2'));
for(const mod of mods){
  let s=readFileSync(join(stage,'modules',mod),'utf8');
  const name=mod==='account-runtime.mjs'?'preview-runtime.mjs':mod;
  if(name==='preview-runtime.mjs'){
    if(!s.includes('pw-progress-v2-runtime-preview'))throw Error('Runtime database anchor changed');
    s=s.replaceAll('pw-progress-v2-runtime-preview','pw-progress-review-261073b');
  }
  put('progress-v2/'+name,s);
}
cpSync(join(stage,'guest-account-panel.mjs'),join(out,'progress-v2/account-panel.mjs'));
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);}
for(const path of walk(out)){
  if(!/\.(?:m?js)$/.test(path)&&path!==join(out,'index.html'))continue;
  const s=readFileSync(path,'utf8').replace(/(?:window\.|globalThis\.)?\blocalStorage\b/g,'window.PW_REVIEW_STORAGE').replace(/(?:window\.|globalThis\.)?\bsessionStorage\b/g,'window.PW_REVIEW_SESSION');
  if(/\b(?:localStorage|sessionStorage)\b/.test(s))throw Error('Unscoped storage '+path);
  writeFileSync(path,s);
}
cpSync(join(stage,'review-storage.js'),join(out,'review-storage.js'));
cpSync(join(stage,'review.css'),join(out,'review.css'));
const html=get('index.html');
if(!html.includes('data-pw-progress-product')||!html.includes('review-storage.js')||!html.includes('PW_PROGRESS_PREVIEW_READY')||html.includes('src="analytics.js"')||html.includes('src="feedback.js"')||html.includes('progress-sync.js?v=2')||!html.includes("worker-src 'none'"))throw Error('Review isolation failed');
for(const path of walk(out)){
  if(/\.(?:m?js|html|json)$/.test(path)){
    const s=readFileSync(path,'utf8');if(/\bsb_secret_[A-Za-z0-9_-]+|\bsb_publishable_[A-Za-z0-9_-]{15,}/.test(s))throw Error('Unexpected key in review asset '+path);
  }
  if(/\.(?:m?js)$/.test(path))execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
}
put('review-meta.json',JSON.stringify({kind:'guest-only public review',source_sha:'261073ba8bb05080f09f1f1d6dcce6a6a82ecce2',verified_reference_run:45474664891,cloud_enabled:false,production_changed:false,namespace:'pw-review-261073b:',database:'pw-progress-review-261073b',offline_install:false},null,2)+'\n');
console.log('Guest review built: actual v2 ledger and My Progress, namespaced storage, no cloud, no install worker.');
