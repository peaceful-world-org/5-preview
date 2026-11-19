import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dir=path.resolve(process.argv[2]||'');
const prefix='/web-vnext-rc-20261119/';
if(!process.argv[2]||!fs.existsSync(path.join(dir,'index.html')))throw Error('Missing prepared RC output');
const sha = f=>crypto.createHash('sha1').update('blob '+fs.statSync(path.join(dir,f)).size+'\0').update(fs.readFileSync(path.join(dir,f))).digest('hex');
const original={
 'index.html':'bfd39943d7222c65fe9ef727011d820fda5402bf',
 'practice-modes.js':'b6c12c2b40e6f14dd66ff8c8cfbe267c41c41ba0',
 'ai-guide.js':'d1b15484f7e1d108ff1b11e536bf6d0b79a464d4',
 'app.js':'dd4c1558eb578fc6e8a72a5a0374507be9ebaebc',
 'free-practice.js':'d7f4485662801b280ae3128d24e5e6b720493ff6',
 'step-number.js':'b19acb5612cae459d3ab766f3641a3e14ecaf725',
 'progress-sync.js':'2c031d1f3edb71727f7f891d536907683798ec34',
 'sw.js':'7db53a02c1428d0beb6bbda58924ba61ae0eaf99',
 'locales/index.json':'d272577c5f9b56f87046a5803df7b3e9e7258bdd',
 'locales/ru.json':'f4e874965afca63059234a0d20323443053de8b8',
 'locales/en.json':'bb4ff10aacae603a36a754c7512a16e3cb01fc16',
 'web-vnext/copy.js':'baa8db1f74973532a534900f68417c89b1d21a63',
 'web-vnext/world.css':'eae3732bd9084032b395a9f674b42c54f61bdc9f',
 'web-vnext/world.js':'d72912d73eb008b4e44b42cc43ae2042107b948b'
};
for(const [file,hash] of Object.entries(original))if(sha(file)!==hash)throw Error('Final built Web RC differs from approved SHA 048dbcc4 artifact: '+file);
const change=(file,fn)=>{const p=path.join(dir,file),before=fs.readFileSync(p,'utf8'),after=fn(before);if(after===before)throw Error('No staging changes: '+file);fs.writeFileSync(p,after)};
const once=(s,a,b,label)=>{if(s.split(a).length!==2)throw Error('Changed staging anchor '+label);return s.replace(a,b)};
change('i18n.js',s=>s.replace("'/locales/index.json'","'"+prefix+"locales/index.json'").replace('`/locales/${encodeURIComponent(code)}.json`','`'+prefix+'locales/${encodeURIComponent(code)}.json`'));
change('step-number.js',s=>{s=once(s,"getRegistration('/')","getRegistration('"+prefix+"')",'SW registration');s=once(s,"register('/sw.js'","register('"+prefix+"sw.js'",'SW path');s=once(s,"scope: '/'","scope: '"+prefix+"'",'SW scope');s=once(s,'if (!registration) {',"if (!registration || new URL(registration.scope).pathname !== '"+prefix+"') {",'ensure nested SW even if root preview SW exists');s=once(s,"'/ai-guide.js?v=1'","'"+prefix+"ai-guide.js?v=1'",'AI Guide');s=once(s,"'/ios-install-guide.js?v=1'","'"+prefix+"ios-install-guide.js?v=1'",'iOS guide');return s});
change('ios-install-guide.js',s=>s.replace("'/ios-guide'","'"+prefix+"ios-guide'").replace('`/assets/ios-guide/${encodeURIComponent(assetLocale)}`','`'+prefix+'assets/ios-guide/${encodeURIComponent(assetLocale)}`'));
change('sw.js',s=>{s=once(s,"const CORE = 'pw-core-' + VERSION;","const CORE = 'pw-rc-20261119-' + VERSION;",'cache name');s=s.replaceAll("'/","'"+prefix).replaceAll('`/','`'+prefix).replaceAll('"/','"'+prefix);s=once(s,'keys.filter(key => key !== CORE)',"keys.filter(key => key.startsWith('pw-rc-20261119-') && key !== CORE)",'cache cleanup');return s});
change('locales/index.json',s=>{const d=JSON.parse(s);for(const v of Object.values(d.locales)){if(v.privacy.startsWith('/'))v.privacy=prefix+v.privacy.slice(1);}return JSON.stringify(d,null,2)+'\n'});
change('index.html',s=>{s=once(s,'<head>','<head>\n<meta name="robots" content="noindex,nofollow,noarchive" />\n<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; connect-src \'self\'; font-src \'self\' data:; media-src \'self\' data: blob:; worker-src \'self\'; frame-src \'none\'; object-src \'none\'; form-action \'none\'; base-uri \'self\'" />','noindex/CSP');
const injection='\n<script>(()=>{const messages={ru:"Предпросмотр: отправка отзывов отключена.",en:"Preview: feedback submission is disabled.",uk:"Попередній перегляд: надсилання відгуків вимкнено.",es:"Vista previa: el envío de comentarios está desactivado.","pt-br":"Prévia: o envio de comentários está desativado.","pt-pt":"Pré-visualização: o envio de comentários está desativado.",fr:"Aperçu : l’envoi des avis est désactivé.",id:"Pratinjau: pengiriman masukan dinonaktifkan."};document.addEventListener("submit",e=>{if(e.target?.id!=="feedbackForm")return;e.preventDefault();e.stopImmediatePropagation();const node=document.getElementById("feedbackStatus");if(node){node.textContent=messages[window.PW_I18N?.locale]||messages.en;node.setAttribute("role","status")}},true)})();</script>\n';return once(s,'</head>',injection+'</head>','feedback isolation')});
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.webmanifest'),'utf8'));if(manifest.scope!=='./'||manifest.start_url!=='./'||manifest.id!=='./')throw Error('Manifest must be path-relative');
for(const f of ['i18n.js','step-number.js','ios-install-guide.js','sw.js']){const s=fs.readFileSync(path.join(dir,f),'utf8');if(!s.includes(prefix))throw Error('Missing staging subpath in '+f)}
fs.writeFileSync(path.join(dir,'preview-rc-meta.json'),JSON.stringify({source_sha:'048dbcc43811da2b2a0ccb0fa0abdc3ee9a1b252',artifact_run:44566617680,staged_from_verified_rc:true,scope:prefix,external_requests:'blocked by preview CSP',production_unchanged:true},null,2)+'\n');
console.log('Staged byte-verified Web RC with isolated service worker and no external connections');
