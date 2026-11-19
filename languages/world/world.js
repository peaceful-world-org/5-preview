/* 5 · World Practice concept: preview-only progressive enhancement. */
'use strict';
(() => {
  if (!location.pathname.startsWith('/languages/world/')) return;
  // Test-only theme query wins even when a returning visitor saved a theme.
  // Preserve localStorage: a QA link must not change any real preference.
  const previewTheme = new URLSearchParams(location.search).get('previewTheme');
  if ((previewTheme === 'dark' || previewTheme === 'light') && window.PW_THEME?.set) {
    let saved=null, readable=false;
    try { saved=localStorage.getItem('pw-theme'); readable=true; } catch (_) {}
    window.PW_THEME.set(previewTheme);
    if (readable) {
      try {
        if (saved === null) localStorage.removeItem('pw-theme');
        else localStorage.setItem('pw-theme',saved);
      } catch (_) {}
    }
  }
  const el = id => document.getElementById(id);
  const vision = window.PW_WORLD_VISION_COPY || {};
  const texts = {
    ru:{scale:'7 языков в предпросмотре · ещё больше — в планах',eye:'КАРТА ПРАКТИК',title:'Маленькая практика. Большой горизонт.',desc:'Свободный таймер — простой вход. За ним — навыки внимания, доброжелательности и мирного действия.',expand:'Исследовать карту практик и языков',collapse:'Свернуть карту',atlas:'Направления практик',ideas:'30 идей',ideasNote:'Это идеи для изучения и экспертной проверки, а не доступные тренировки или обещанные релизы.',untranslated:'',languages:'Языки приложения «5»',live:'7 языков · 8 вариантов',langNote:'Это план локализации самого приложения «5». В предпросмотре доступны 7 языков (8 вариантов). Ниже — возможные будущие переводы, которые ещё нужно подготовить и проверить. Сроки выпуска не утверждены.',showCandidates:'Посмотреть 46 возможных языковых вариантов',done:'Практика мира будет расти',doneNote:'Новые направления пока только на стадии идей.',doneOpen:'Посмотреть карту развития →',menu:'Языки «5» · возможные локализации',waves:['Следующие кандидаты (латиница)','Другие письменности','RTL: требуется отдельная проверка','Дальнейшая карта'],groups:['Внимание и ясность','Забота и отношения','Конфликт и речь','Границы и защита','Ответственность и восстановление','Живой мир']},
    en:{scale:'7 preview languages · more under consideration',eye:'THE PRACTICE ATLAS',title:'A small practice. A wider horizon.',desc:'An open timer is one simple entry. Beyond it: attention, goodwill and practical nonviolence.',expand:'Explore practice and language roadmaps',collapse:'Close the roadmap',atlas:'Practice paths',ideas:'30 concepts',ideasNote:'Ideas for study and expert review — not available practices or promised releases.',untranslated:'',languages:'Languages for «5»',live:'7 languages · 8 variants',langNote:'This is the localization plan for the «5» app itself. This preview has 7 languages (8 variants). The others are possible future translations that still need writing and review; no release dates are confirmed.',showCandidates:'Explore 46 possible language variants',done:'This practice library may grow',doneNote:'The next themes are concepts, not available exercises.',doneOpen:'Explore the roadmap →',menu:'«5» languages · possible translations',waves:['Next Latin-script candidates','Other writing systems','RTL: separate review needed','Longer-term candidates'],groups:['Attention and clarity','Care and relationships','Conflict and speech','Boundaries and safety','Responsibility and repair','Life and interdependence']},
    uk:{scale:'7 мов у попередньому перегляді · більше мов на розгляді',eye:'КАРТА ПРАКТИК',title:'Мала практика. Ширший горизонт.',desc:'Вільний таймер — простий початок. Далі — увага, доброзичливість і ненасильницькі навички.',expand:'Переглянути карту практик і мов',collapse:'Згорнути карту',atlas:'Напрями практик',ideas:'30 ідей',ideasNote:'Ідеї для вивчення й експертної перевірки, а не готові вправи чи обіцяні випуски.',untranslated:'Назви майбутніх вправ поки наведено англійською.',languages:'Мови застосунку «5»',live:'7 мов · 8 варіантів',langNote:'Це план локалізації самого застосунку «5». У попередньому перегляді доступні 7 мов (8 варіантів). Нижче — можливі майбутні переклади, які ще слід підготувати й перевірити. Дати випуску не затверджено.',showCandidates:'Переглянути 46 можливих мовних варіантів',done:'Бібліотека практик може зростати',doneNote:'Наступні напрями поки на рівні ідей.',doneOpen:'Переглянути карту →',menu:'Мови «5» · можливі локалізації',waves:['Наступні кандидати','Інші писемності','RTL: потрібна окрема перевірка','Подальші кандидати'],groups:['Увага та ясність','Турбота й стосунки','Конфлікт і мовлення','Межі та безпека','Відповідальність і відновлення','Живий світ']},
    es:{scale:'7 idiomas en la vista previa · más en estudio',eye:'MAPA DE PRÁCTICAS',title:'Una práctica pequeña. Un horizonte más amplio.',desc:'Un temporizador libre es una forma de empezar. Después, atención, benevolencia y habilidades para la no violencia.',expand:'Explorar el mapa de prácticas e idiomas',collapse:'Cerrar el mapa',atlas:'Áreas de práctica',ideas:'30 ideas',ideasNote:'Son propuestas para estudiar y revisar, no ejercicios disponibles ni lanzamientos prometidos.',untranslated:'Los nombres de las futuras prácticas se muestran en inglés por ahora.',languages:'Idiomas de «5»',live:'7 idiomas · 8 variantes',langNote:'Este es el plan de localización de la propia aplicación «5». La vista previa incluye 7 idiomas (8 variantes). Los demás son posibles traducciones futuras pendientes de preparación y revisión, sin fechas de lanzamiento confirmadas.',showCandidates:'Ver 46 posibles variantes lingüísticas',done:'La biblioteca puede crecer',doneNote:'Los próximos temas siguen siendo ideas.',doneOpen:'Explorar el mapa →',menu:'Idiomas de «5» · posibles traducciones',waves:['Próximos candidatos','Otros sistemas de escritura','RTL: requiere revisión específica','Candidatos posteriores'],groups:['Atención y claridad','Cuidado y relaciones','Conflicto y comunicación','Límites y seguridad','Responsabilidad y reparación','Vida e interdependencia']},
    'pt-br':{scale:'7 idiomas na prévia · mais em estudo',eye:'MAPA DE PRÁTICAS',title:'Uma prática pequena. Um horizonte maior.',desc:'Um timer livre é um começo simples. Depois, atenção, benevolência e habilidades de não violência.',expand:'Explorar práticas e idiomas',collapse:'Fechar o mapa',atlas:'Áreas de prática',ideas:'30 ideias',ideasNote:'São ideias para estudo e avaliação, não exercícios disponíveis nem lançamentos prometidos.',untranslated:'Os nomes das futuras práticas aparecem em inglês por enquanto.',languages:'Idiomas do «5»',live:'7 idiomas · 8 variantes',langNote:'Este é o plano de localização do próprio aplicativo «5». A prévia oferece 7 idiomas (8 variantes). Os demais são possíveis traduções futuras, ainda sem preparação, revisão ou datas de lançamento confirmadas.',showCandidates:'Ver 46 possíveis variantes de idioma',done:'A biblioteca pode crescer',doneNote:'Os próximos temas ainda são ideias.',doneOpen:'Explorar o mapa →',menu:'Idiomas do «5» · possíveis traduções',waves:['Próximos candidatos','Outros sistemas de escrita','RTL: revisão específica necessária','Candidatos futuros'],groups:['Atenção e clareza','Cuidado e relações','Conflito e fala','Limites e segurança','Responsabilidade e reparação','Vida e interdependência']},
    'pt-pt':{scale:'7 línguas na pré-visualização · mais em estudo',eye:'MAPA DE PRÁTICAS',title:'Uma prática pequena. Um horizonte maior.',desc:'Um temporizador livre é um começo simples. Depois, atenção, benevolência e competências de não violência.',expand:'Explorar práticas e línguas',collapse:'Fechar o mapa',atlas:'Áreas de prática',ideas:'30 ideias',ideasNote:'São ideias para estudo e avaliação, não exercícios disponíveis nem lançamentos prometidos.',untranslated:'Os nomes das futuras práticas surgem em inglês por enquanto.',languages:'Línguas da aplicação «5»',live:'7 línguas · 8 variantes',langNote:'Este é o plano de localização da própria aplicação «5». A pré-visualização inclui 7 línguas (8 variantes). As restantes são possíveis traduções futuras, ainda por preparar e rever, sem datas de lançamento confirmadas.',showCandidates:'Ver 46 possíveis variantes linguísticas',done:'A biblioteca pode crescer',doneNote:'Os próximos temas ainda são ideias.',doneOpen:'Explorar o mapa →',menu:'Línguas de «5» · possíveis traduções',waves:['Próximos candidatos','Outros sistemas de escrita','RTL: requer avaliação própria','Candidatos futuros'],groups:['Atenção e clareza','Cuidado e relações','Conflito e comunicação','Limites e segurança','Responsabilidade e reparação','Vida e interdependência']},
    fr:{scale:'7 langues en aperçu · d’autres à l’étude',eye:'CARTE DES PRATIQUES',title:'Une petite pratique. Un horizon plus large.',desc:'Un minuteur libre pour commencer. Ensuite, attention, bienveillance et compétences de non-violence.',expand:'Explorer les pratiques et les langues',collapse:'Refermer la carte',atlas:'Domaines de pratique',ideas:'30 idées',ideasNote:'Des idées à étudier et à faire évaluer, pas des exercices disponibles ni des sorties promises.',untranslated:'Les noms des futures pratiques sont actuellement en anglais.',languages:'Langues de «5»',live:'7 langues · 8 variantes',langNote:'Il s’agit du projet de traduction de l’application «5» elle-même. Cet aperçu propose 7 langues (8 variantes). Les autres sont des traductions envisagées, à préparer et à vérifier, sans date de lancement confirmée.',showCandidates:'Voir 46 variantes linguistiques envisagées',done:'Cette bibliothèque peut grandir',doneNote:'Les prochains thèmes sont encore des idées.',doneOpen:'Explorer la carte →',menu:'Langues de «5» · traductions envisagées',waves:['Prochaines langues envisagées','Autres systèmes d’écriture','RTL : évaluation distincte requise','Candidats à plus long terme'],groups:['Attention et clarté','Soin et relations','Conflit et parole','Limites et sécurité','Responsabilité et réparation','Vie et interdépendance']},
    id:{scale:'7 bahasa di pratinjau · bahasa lain sedang dipertimbangkan',eye:'PETA LATIHAN',title:'Latihan kecil. Cakrawala lebih luas.',desc:'Pengatur waktu bebas adalah awal yang sederhana. Berikutnya: perhatian, niat baik, dan keterampilan tanpa kekerasan.',expand:'Jelajahi peta latihan dan bahasa',collapse:'Tutup peta',atlas:'Bidang latihan',ideas:'30 gagasan',ideasNote:'Ini masih gagasan untuk dipelajari dan ditinjau, bukan latihan yang sudah tersedia atau janji rilis.',untranslated:'Nama-nama latihan yang direncanakan sementara ditampilkan dalam bahasa Inggris.',languages:'Bahasa untuk aplikasi «5»',live:'7 bahasa · 8 varian',langNote:'Ini adalah rencana lokalisasi aplikasi «5». Pratinjau ini mencakup 7 bahasa (8 varian). Bahasa lainnya masih menjadi kemungkinan untuk diterjemahkan dan ditinjau; belum ada tanggal rilis yang ditetapkan.',showCandidates:'Lihat 46 kemungkinan varian bahasa',done:'Perpustakaan latihan ini dapat berkembang',doneNote:'Tema berikutnya masih berupa gagasan.',doneOpen:'Jelajahi peta →',menu:'Bahasa «5» · kemungkinan terjemahan',waves:['Kandidat berikutnya','Sistem tulisan lainnya','RTL: perlu tinjauan khusus','Kandidat jangka panjang'],groups:['Perhatian dan kejernihan','Kepedulian dan relasi','Konflik dan komunikasi','Batasan dan keamanan','Tanggung jawab dan pemulihan','Kehidupan dan keterhubungan']}
  };
  const previewNotes = {"ru":"Предпросмотр · Отправка отзывов, облачная синхронизация и установка отключены.","en":"Preview · Feedback submissions, cloud sync and installation are disabled.","uk":"Попередній перегляд · Надсилання відгуків, хмарну синхронізацію та встановлення вимкнено.","es":"Vista previa · El envío de opiniones, la sincronización y la instalación están desactivados.","pt-br":"Prévia · O envio de feedback, a sincronização e a instalação estão desativados.","pt-pt":"Pré-visualização · O envio de comentários, a sincronização e a instalação estão desativados.","fr":"Aperçu · L’envoi d’avis, la synchronisation et l’installation sont désactivés.","id":"Pratinjau · Pengiriman masukan, sinkronisasi cloud, dan pemasangan dinonaktifkan."};
  let atlas = null, opened = false;
  function currentCode() {
    const raw = String(window.PW_I18N?.locale || document.documentElement.lang || 'en').toLowerCase();
    if (texts[raw]) return raw;
    if (raw === 'pt') return 'pt-br';
    return texts[raw.split('-')[0]] ? raw.split('-')[0] : 'en';
  }
  function t() { return texts[currentCode()] || texts.en; }
  function put(id,value) { const node=el(id); if(node)node.textContent=value; }
  function make(tag, cls, value) {
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(value!==undefined)e.textContent=value;
    return e;
  }
  const cards=el('pwModeCards');
  const order=new URLSearchParams(location.search).get('order')==='foundation' ? 'foundation' : 'free';
  if(cards && order==='foundation')for(const key of ['foundation','metta','free']){
    const node=cards.querySelector('.practice-choice--'+key);
    if(node) cards.appendChild(node);
  }
  document.documentElement.dataset.worldOrder=order;
  function syncHome() {
    document.documentElement.dataset.worldHome=el('home')?.classList.contains('active')?'1':'0';
  }
  if(el('home'))new MutationObserver(syncHome).observe(el('home'),{attributes:true,attributeFilter:['class']});
  syncHome();
  function atlasCategories() {
    const node=el('pwWorldCurriculumList');
    if(!node||!atlas)return;
    const c=t(),ru=currentCode()==='ru';
    node.replaceChildren();
    for(const [n,g] of atlas.groups.entries()){
      const section=make('section','pw-world-atlas-group');
      section.appendChild(make('h4','',c.groups[n] || g.en));
      const ul=make('ul','');
      for(const idea of g.ideas)ul.appendChild(make('li','',ru?idea.ru:idea.en));
      section.appendChild(ul);
      node.appendChild(section);
    }
  }
  function displayName(code) {
    try {
      const locale=currentCode()==='ru'?'ru':'en';
      const dn=new Intl.DisplayNames([locale],{type:'language'});
      return dn.of(code) || code;
    }catch(_){return code;}
  }
  function atlasLanguages() {
    if(!atlas)return;
    const live=el('pwWorldLiveLocales'),rest=el('pwWorldCandidateList'),c=t(),v=vision[currentCode()]||vision.en||{};
    if(live){
      live.replaceChildren();
      for(const entry of atlas.available) live.appendChild(make('span','pw-world-language-live',entry.label));
    }
    if(rest){
      rest.replaceChildren();
      for(const [n,wave] of atlas.waves.entries()){
        const section=make('section','pw-world-wave');
        section.appendChild(make('h4','',(v.waveTitles?.[n]||c.waves[n])+' · '+wave.codes.length));
        const line=make('div','pw-world-wave-code-list');
        for(const code of wave.codes)line.appendChild(make('span','pw-world-wave-code',displayName(code)));
        section.appendChild(line);
        rest.appendChild(section);
      }
    }
  }
  function update() {
    const c=t(),v=vision[currentCode()]||vision.en||{};
    put('pwWorldPreviewNote', previewNotes[currentCode()] || previewNotes.en);
    put('pwWorldScaleLine',v.scale||c.scale);
    put('pwWorldEyebrow',c.eye);
    put('pwWorldTitle',c.title);
    put('pwWorldDescription',v.home||c.desc);
    put('pwWorldOpenText',opened?c.collapse:(v.expand||c.expand));
    put('pwWorldCurriculumTitle',c.atlas);
    put('pwWorldCurriculumCount',c.ideas);
    put('pwWorldCurriculumNote',v.ideasNote||c.ideasNote);
    put('pwWorldUntranslatedNote',c.untranslated);
    put('pwWorldLanguagesTitle',c.languages);
    put('pwWorldLanguagesCount',c.live);
    put('pwWorldLanguagesNote',v.langNote||c.langNote);
    put('pwWorldCandidateSummary',v.langSummary||c.showCandidates);
    put('pwWorldTraditionTitle',v.traditionTitle||'Practices and spiritual traditions');
    put('pwWorldTraditionStatus',v.traditionStatus||'Long-term plan');
    put('pwWorldTraditionLead',v.traditionLead||'Not available yet.');
    put('pwWorldTraditionDetail',v.traditionDetail||'Expert review will be required.');
    put('pwWorldExpertKicker',v.expertKicker||'AN INVITATION TO COLLABORATE');
    put('pwWorldExpertHeading',v.expertHeading||'Help make the practices better');
    put('pwWorldExpertText',v.expertText||'We welcome ideas and corrections.');
    const emailHref='mailto:hello@peaceful-world.org?subject='+encodeURIComponent(v.expertSubject||'5 · Practice suggestions');
    for(const id of ['pwWorldExpertLink','pwWorldExpertInAtlas']){
      const link=el(id);
      if(link){link.href=emailHref;link.textContent=v.expertAction||'Suggest an improvement';}
    }
    const guideId=String(window.PW_I18N?.registry?.locales?.ru?.ai?.agentId||'').trim();
    const guideUrl=guideId?'https://elevenlabs.io/app/talk-to?agent_id='+encodeURIComponent(guideId):'';
    for(const id of ['pwWorldAiHome','pwWorldAiDone']){
      const link=el(id);
      if(link){
        link.hidden=!guideUrl;
        if(guideUrl)link.href=guideUrl;
        link.textContent=v.aiLabel||'Ask AI';
        link.setAttribute('aria-label',v.aiAria||'Open the AI Guide in Russian or English in a new tab');
      }
    }
    const support=el('pwWorldSupportHome');
    if(support){
      support.textContent=v.supportLabel||'Support';
      support.href=window.PW_I18N?.config?.links?.support||'https://peaceful-world.org/help';
    }
    put('pwWorldShareBtn',v.shareLabel||'Share');
    el('pwWorldTools')?.setAttribute('aria-label',v.toolsAria||'Questions, support and sharing');
    el('pwWorldDoneActions')?.setAttribute('aria-label',v.doneActionsAria||'Other actions');

    put('pwWorldDoneEyebrow',v.doneEyebrow||'THE HORIZON OF 5');
    put('pwWorldDoneHeading',v.doneTitle||c.done);
    put('pwWorldDoneNote',v.doneNote||c.doneNote);
    put('pwWorldDoneOpen',v.doneOpen||c.doneOpen);
    const doneTracks=el('pwWorldDoneTracks');
    if(doneTracks){
      doneTracks.replaceChildren();
      for(const label of (v.doneTracks||[])){
        const item=make('span','pw-world-done-track',label);
        item.setAttribute('role','listitem');
        doneTracks.appendChild(item);
      }
      doneTracks.setAttribute('aria-label','Future development, not available features');
    }
    const chips=el('pwWorldThemeChips');
    if(chips){
      chips.replaceChildren();
      for(const label of (v.tracks||[c.groups[0],c.groups[2],c.groups[5]])){
        const item=make('span','pw-world-chip',label);
        item.setAttribute('role','listitem');
        chips.appendChild(item);
      }
      chips.setAttribute('aria-label','Future development, not available features');
    }
    const note=el('pwWorldUntranslatedNote');
    if(note)note.hidden=!c.untranslated;
    atlasCategories();atlasLanguages();
    const panel=document.querySelector('.pw-language-panel');
    const link=panel?.querySelector('.pw-world-menu-entry');
    if(link)link.textContent=v.menu||c.menu;
  }
  function setOpen(next,focusTitle=false){
    opened=Boolean(next);
    const d=el('pwWorldDetails'),b=el('pwWorldOpen');
    if(d)d.hidden=!opened;
    if(b)b.setAttribute('aria-expanded',String(opened));
    put('pwWorldOpenText',opened?t().collapse:((vision[currentCode()]||vision.en||{}).expand||t().expand));
    if(opened && focusTitle){
      el('pwWorldPreview')?.scrollIntoView({block:'start',behavior:'auto'});
      const title=el('pwWorldCurriculumTitle');
      if(title){title.setAttribute('tabindex','-1');title.focus({preventScroll:true});}
    }
  }
  el('pwWorldOpen')?.addEventListener('click',()=>setOpen(!opened,false));
  el('pwWorldDoneOpen')?.addEventListener('click',()=>{
    el('pwModeBack')?.click();
    setTimeout(()=>setOpen(true,true),90);
  });
  const panel=document.querySelector('.pw-language-panel');
  if(panel){
    let queued=false;
    const adjustMenu=()=>{
      if(queued)return;queued=true;
      queueMicrotask(()=>{
        queued=false;
        if(panel.querySelector('.pw-world-menu-entry'))return;
        const planned=panel.querySelectorAll('.pw-language-option--planned');
        const heading=panel.querySelector('.pw-language-planned-title');
        if(!planned.length&&!heading)return;
        planned.forEach(e=>e.remove());
        heading?.remove();
        const button=make('button','pw-world-menu-entry',t().menu);
        button.type='button';
        button.addEventListener('click',()=>{
          const globe=document.querySelector('.pw-language-button');
          if(globe?.getAttribute('aria-expanded')==='true')globe.click();
          setOpen(true,true);
        });
        panel.appendChild(button);
      });
    };
    new MutationObserver(adjustMenu).observe(panel,{childList:true});
  }

  // These are real voluntary actions. Shared QA staging never embeds a live
  // AI agent: the guide opens only when the visitor follows the external link.
  async function shareLiveApp(){
    const c=vision[currentCode()]||vision.en||{};
    const payload={url:'https://5.peaceful-world.org/',title:'5 · Peace Practice',text:c.shareText||'Five minutes to practise peaceful thinking.'};
    if(typeof navigator.share==='function'){
      try{await navigator.share(payload);return;}
      catch(error){if(error?.name==='AbortError')return;}
    }
    try{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(payload.url);}
      else{
        const input=document.createElement('textarea');
        input.value=payload.url;
        input.setAttribute('readonly','');
        input.style.cssText='position:fixed;left:-10000px;top:0;opacity:0';
        document.body.appendChild(input);input.select();
        const success=document.execCommand('copy');input.remove();
        if(!success)throw Error('Copy unavailable');
      }
      put('pwWorldToolsStatus',c.shareSuccess||'Link copied');
    }catch(_){put('pwWorldToolsStatus',c.shareError||'Could not copy the link');}
  }
  el('pwWorldShareBtn')?.addEventListener('click',()=>{void shareLiveApp()});
  // Same real controls on every screen, relocated rather than duplicated.
  // Desktop/tablet: discreet actions beside "Choose a practice".
  // Phone: reachable actions after the practice cards, never before Start.
  const toolsDesktopSlot=el('pwWorldDesktopToolsSlot');
  const toolsMobileSlot=el('pwWorldMobileToolsSlot');
  const toolsContainer=el('pwWorldToolsContainer');
  const toolsBreakpoint=matchMedia('(min-width:700px)');
  function placeTools(){
    const destination=toolsBreakpoint.matches?toolsDesktopSlot:toolsMobileSlot;
    if(destination && toolsContainer && toolsContainer.parentNode!==destination){
      destination.appendChild(toolsContainer);
    }
  }
  if(toolsBreakpoint.addEventListener)toolsBreakpoint.addEventListener('change',placeTools);
  else toolsBreakpoint.addListener?.(placeTools);
  placeTools();

  document.addEventListener('pw:locale-changed',update);
  document.addEventListener('pw:locale-ready',update);
  if(window.PW_I18N?.ready)window.PW_I18N.ready.then(update,update);
  update();
  fetch('/languages/world/roadmap.json',{cache:'no-store'})
    .then(resp=>{if(!resp.ok)throw Error('Roadmap unavailable');return resp.json();})
    .then(d=>{
      if(d?.counts?.currentLocales!==8||d?.counts?.newCandidates!==46||
         d?.counts?.practiceIdeas!==30||d?.groups?.length!==6||
         d?.waves?.length!==4)throw Error('Roadmap contract invalid');
      atlas=d;update();
    })
    .catch(err=>{
      console.warn('World preview roadmap unavailable:',err);
      put('pwWorldCurriculumNote',t().ideasNote+' (Preview data unavailable.)');
      put('pwWorldLanguagesNote',t().langNote+' (Preview data unavailable.)');
    });
})();
