/* 5 · World Practice concept: preview-only progressive enhancement. */
'use strict';
(() => {
  if (!location.pathname.startsWith('/languages/world/')) return;
  const el = id => document.getElementById(id);
  const texts = {
    ru:{scale:'7 языков доступны · 52 языка на карте развития',eye:'КАРТА ПРАКТИК',title:'Маленькая практика. Большой горизонт.',desc:'Свободный таймер — простой вход. За ним — навыки внимания, доброжелательности и мирного действия.',expand:'Исследовать карту практик и языков',collapse:'Свернуть карту',atlas:'Направления практик',ideas:'30 идей',ideasNote:'Это идеи для изучения и экспертной проверки, а не доступные тренировки или обещанные релизы.',untranslated:'',languages:'Международная языковая карта',live:'7 языков сейчас',langNote:'Севильское заявление опубликовано в 54 языковых редакциях на 52 языках. Это отдельные тексты, а не готовые переводы приложения «5».',showCandidates:'Показать 46 языковых версий-кандидатов',source:'О Севильском заявлении ↗',done:'Практика мира будет расти',doneNote:'Новые направления пока только на стадии идей.',doneOpen:'Посмотреть карту развития →',menu:'Карта языков · 46 кандидатов',waves:['Следующие кандидаты (латиница)','Другие письменности','RTL: требуется отдельная проверка','Дальнейшая карта'],groups:['Внимание и ясность','Забота и отношения','Конфликт и речь','Границы и защита','Ответственность и восстановление','Живой мир']},
    en:{scale:'7 languages available · 52 on the roadmap',eye:'THE PRACTICE ATLAS',title:'A small practice. A wider horizon.',desc:'An open timer is one simple entry. Beyond it: attention, goodwill and practical nonviolence.',expand:'Explore practice and language roadmaps',collapse:'Close the roadmap',atlas:'Practice paths',ideas:'30 concepts',ideasNote:'Ideas for study and expert review — not available practices or promised releases.',untranslated:'',languages:'A worldwide language roadmap',live:'7 languages available',langNote:'The Seville Statement has 54 published language editions across 52 languages. These are separate texts, not ready-made translations of the app.',showCandidates:'Explore 46 additional locale candidates',source:'About the Seville Statement ↗',done:'This practice library may grow',doneNote:'The next themes are concepts, not available exercises.',doneOpen:'Explore the roadmap →',menu:'Language roadmap · 46 candidates',waves:['Next Latin-script candidates','Other writing systems','RTL: separate review needed','Longer-term candidates'],groups:['Attention and clarity','Care and relationships','Conflict and speech','Boundaries and safety','Responsibility and repair','Life and interdependence']},
    uk:{scale:'7 мов доступні · 52 на карті розвитку',eye:'КАРТА ПРАКТИК',title:'Мала практика. Ширший горизонт.',desc:'Вільний таймер — простий початок. Далі — увага, доброзичливість і ненасильницькі навички.',expand:'Переглянути карту практик і мов',collapse:'Згорнути карту',atlas:'Напрями практик',ideas:'30 ідей',ideasNote:'Ідеї для вивчення й експертної перевірки, а не готові вправи чи обіцяні випуски.',untranslated:'Назви майбутніх вправ поки наведено англійською.',languages:'Міжнародна мовна карта',live:'Зараз доступно 7 мов',langNote:'Севільську заяву опубліковано в 54 мовних редакціях 52 мовами. Це окремі тексти, а не переклади застосунку.',showCandidates:'Показати 46 кандидатів на нові мовні версії',source:'Про Севільську заяву ↗',done:'Бібліотека практик може зростати',doneNote:'Наступні напрями поки на рівні ідей.',doneOpen:'Переглянути карту →',menu:'Мовна карта · 46 кандидатів',waves:['Наступні кандидати','Інші писемності','RTL: потрібна окрема перевірка','Подальші кандидати'],groups:['Увага та ясність','Турбота й стосунки','Конфлікт і мовлення','Межі та безпека','Відповідальність і відновлення','Живий світ']},
    es:{scale:'7 idiomas disponibles · 52 en la hoja de ruta',eye:'MAPA DE PRÁCTICAS',title:'Una práctica pequeña. Un horizonte más amplio.',desc:'Un temporizador libre es una forma de empezar. Después, atención, benevolencia y habilidades para la no violencia.',expand:'Explorar el mapa de prácticas e idiomas',collapse:'Cerrar el mapa',atlas:'Áreas de práctica',ideas:'30 ideas',ideasNote:'Son propuestas para estudiar y revisar, no ejercicios disponibles ni lanzamientos prometidos.',untranslated:'Los nombres de las futuras prácticas se muestran en inglés por ahora.',languages:'Mapa internacional de idiomas',live:'7 idiomas disponibles',langNote:'La Declaración de Sevilla tiene 54 ediciones en 52 idiomas. Son otros textos, no traducciones terminadas de esta aplicación.',showCandidates:'Ver 46 variantes lingüísticas candidatas',source:'Sobre la Declaración de Sevilla ↗',done:'La biblioteca puede crecer',doneNote:'Los próximos temas siguen siendo ideas.',doneOpen:'Explorar el mapa →',menu:'Mapa de idiomas · 46 candidatos',waves:['Próximos candidatos','Otros sistemas de escritura','RTL: requiere revisión específica','Candidatos posteriores'],groups:['Atención y claridad','Cuidado y relaciones','Conflicto y comunicación','Límites y seguridad','Responsabilidad y reparación','Vida e interdependencia']},
    'pt-br':{scale:'7 idiomas disponíveis · 52 no mapa de expansão',eye:'MAPA DE PRÁTICAS',title:'Uma prática pequena. Um horizonte maior.',desc:'Um timer livre é um começo simples. Depois, atenção, benevolência e habilidades de não violência.',expand:'Explorar práticas e idiomas',collapse:'Fechar o mapa',atlas:'Áreas de prática',ideas:'30 ideias',ideasNote:'São ideias para estudo e avaliação, não exercícios disponíveis nem lançamentos prometidos.',untranslated:'Os nomes das futuras práticas aparecem em inglês por enquanto.',languages:'Mapa global de idiomas',live:'7 idiomas disponíveis',langNote:'A Declaração de Sevilha tem 54 edições em 52 idiomas. Esses textos não são traduções prontas do aplicativo.',showCandidates:'Ver 46 versões linguísticas candidatas',source:'Sobre a Declaração de Sevilha ↗',done:'A biblioteca pode crescer',doneNote:'Os próximos temas ainda são ideias.',doneOpen:'Explorar o mapa →',menu:'Mapa de idiomas · 46 candidatos',waves:['Próximos candidatos','Outros sistemas de escrita','RTL: revisão específica necessária','Candidatos futuros'],groups:['Atenção e clareza','Cuidado e relações','Conflito e fala','Limites e segurança','Responsabilidade e reparação','Vida e interdependência']},
    'pt-pt':{scale:'7 línguas disponíveis · 52 no plano de expansão',eye:'MAPA DE PRÁTICAS',title:'Uma prática pequena. Um horizonte maior.',desc:'Um temporizador livre é um começo simples. Depois, atenção, benevolência e competências de não violência.',expand:'Explorar práticas e línguas',collapse:'Fechar o mapa',atlas:'Áreas de prática',ideas:'30 ideias',ideasNote:'São ideias para estudo e avaliação, não exercícios disponíveis nem lançamentos prometidos.',untranslated:'Os nomes das futuras práticas surgem em inglês por enquanto.',languages:'Mapa global de línguas',live:'7 línguas disponíveis',langNote:'A Declaração de Sevilha tem 54 edições em 52 línguas. Esses textos não são traduções prontas da aplicação.',showCandidates:'Ver 46 versões linguísticas candidatas',source:'Sobre a Declaração de Sevilha ↗',done:'A biblioteca pode crescer',doneNote:'Os próximos temas ainda são ideias.',doneOpen:'Explorar o mapa →',menu:'Mapa de línguas · 46 candidatos',waves:['Próximos candidatos','Outros sistemas de escrita','RTL: requer avaliação própria','Candidatos futuros'],groups:['Atenção e clareza','Cuidado e relações','Conflito e comunicação','Limites e segurança','Responsabilidade e reparação','Vida e interdependência']},
    fr:{scale:'7 langues disponibles · 52 sur la feuille de route',eye:'CARTE DES PRATIQUES',title:'Une petite pratique. Un horizon plus large.',desc:'Un minuteur libre pour commencer. Ensuite, attention, bienveillance et compétences de non-violence.',expand:'Explorer les pratiques et les langues',collapse:'Refermer la carte',atlas:'Domaines de pratique',ideas:'30 idées',ideasNote:'Des idées à étudier et à faire évaluer, pas des exercices disponibles ni des sorties promises.',untranslated:'Les noms des futures pratiques sont actuellement en anglais.',languages:'Carte internationale des langues',live:'7 langues disponibles',langNote:'La Déclaration de Séville compte 54 éditions dans 52 langues. Ce sont des textes distincts, pas des traductions prêtes de l’application.',showCandidates:'Voir 46 variantes linguistiques envisagées',source:'À propos de la Déclaration de Séville ↗',done:'Cette bibliothèque peut grandir',doneNote:'Les prochains thèmes sont encore des idées.',doneOpen:'Explorer la carte →',menu:'Carte des langues · 46 candidats',waves:['Prochaines langues envisagées','Autres systèmes d’écriture','RTL : évaluation distincte requise','Candidats à plus long terme'],groups:['Attention et clarté','Soin et relations','Conflit et parole','Limites et sécurité','Responsabilité et réparation','Vie et interdépendance']},
    id:{scale:'7 bahasa tersedia · 52 dalam peta pengembangan',eye:'PETA LATIHAN',title:'Latihan kecil. Cakrawala lebih luas.',desc:'Pengatur waktu bebas adalah awal yang sederhana. Berikutnya: perhatian, niat baik, dan keterampilan tanpa kekerasan.',expand:'Jelajahi peta latihan dan bahasa',collapse:'Tutup peta',atlas:'Bidang latihan',ideas:'30 gagasan',ideasNote:'Ini masih gagasan untuk dipelajari dan ditinjau, bukan latihan yang sudah tersedia atau janji rilis.',untranslated:'Nama-nama latihan yang direncanakan sementara ditampilkan dalam bahasa Inggris.',languages:'Peta bahasa internasional',live:'Saat ini tersedia 7 bahasa',langNote:'Pernyataan Sevilla memiliki 54 edisi dalam 52 bahasa. Itu adalah dokumen terpisah, bukan terjemahan aplikasi yang sudah siap.',showCandidates:'Lihat 46 kandidat versi bahasa',source:'Tentang Pernyataan Sevilla ↗',done:'Perpustakaan latihan ini dapat berkembang',doneNote:'Tema berikutnya masih berupa gagasan.',doneOpen:'Jelajahi peta →',menu:'Peta bahasa · 46 kandidat',waves:['Kandidat berikutnya','Sistem tulisan lainnya','RTL: perlu tinjauan khusus','Kandidat jangka panjang'],groups:['Perhatian dan kejernihan','Kepedulian dan relasi','Konflik dan komunikasi','Batasan dan keamanan','Tanggung jawab dan pemulihan','Kehidupan dan keterhubungan']}
  };
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
  function compareLink(label, mode) {
    const a=make('a','',label);
    const url=new URL(location.href);
    url.searchParams.set('order',mode);
    if(!url.searchParams.has('demo'))url.searchParams.set('demo','1');
    a.href=url.pathname+'?'+url.searchParams.toString();
    a.dataset.worldOrder=mode;
    if(mode===order)a.setAttribute('aria-current','page');
    return a;
  }
  function syncCompareLinks() {
    const lang=currentCode();
    for(const link of document.querySelectorAll('.pw-world-compare a[data-world-order]')){
      const url=new URL(link.href,location.href);
      url.searchParams.set('lang',lang);
      link.href=url.pathname+'?'+url.searchParams.toString();
    }
  }
  const qa=document.querySelector('.pw-qa-banner');
  if(qa){
    const row=make('span','pw-world-compare');
    row.append(compareLink('A · Free first','free'),compareLink('B · Foundation first','foundation'));
    qa.appendChild(row);
  }
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
    const live=el('pwWorldLiveLocales'),rest=el('pwWorldCandidateList'),c=t();
    if(live){
      live.replaceChildren();
      for(const entry of atlas.available) live.appendChild(make('span','pw-world-language-live',entry.label));
    }
    if(rest){
      rest.replaceChildren();
      for(const [n,wave] of atlas.waves.entries()){
        const section=make('section','pw-world-wave');
        section.appendChild(make('h4','',c.waves[n]+' · '+wave.codes.length));
        const line=make('div','pw-world-wave-code-list');
        for(const code of wave.codes)line.appendChild(make('span','pw-world-wave-code',displayName(code)+' · '+code));
        section.appendChild(line);
        rest.appendChild(section);
      }
    }
  }
  function update() {
    const c=t();
    syncCompareLinks();
    put('pwWorldScaleLine',c.scale);
    put('pwWorldEyebrow',c.eye);
    put('pwWorldTitle',c.title);
    put('pwWorldDescription',c.desc);
    put('pwWorldOpenText',opened?c.collapse:c.expand);
    put('pwWorldCurriculumTitle',c.atlas);
    put('pwWorldCurriculumCount',c.ideas);
    put('pwWorldCurriculumNote',c.ideasNote);
    put('pwWorldUntranslatedNote',c.untranslated);
    put('pwWorldLanguagesTitle',c.languages);
    put('pwWorldLanguagesCount',c.live);
    put('pwWorldLanguagesNote',c.langNote);
    put('pwWorldCandidateSummary',c.showCandidates);
    put('pwWorldSourceLink',c.source);
    put('pwWorldDoneHeading',c.done);
    put('pwWorldDoneNote',c.doneNote);
    put('pwWorldDoneOpen',c.doneOpen);
    const chips=el('pwWorldThemeChips');
    if(chips){
      chips.replaceChildren();
      for(const label of [c.groups[0],c.groups[2],c.groups[5]])chips.appendChild(make('span','pw-world-chip',label));
      chips.setAttribute('aria-label',c.atlas);
    }
    const note=el('pwWorldUntranslatedNote');
    if(note)note.hidden=!c.untranslated;
    atlasCategories();atlasLanguages();
    const panel=document.querySelector('.pw-language-panel');
    const link=panel?.querySelector('.pw-world-menu-entry');
    if(link)link.textContent=c.menu;
  }
  function setOpen(next,focusTitle=false){
    opened=Boolean(next);
    const d=el('pwWorldDetails'),b=el('pwWorldOpen');
    if(d)d.hidden=!opened;
    if(b)b.setAttribute('aria-expanded',String(opened));
    put('pwWorldOpenText',opened?t().collapse:t().expand);
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
