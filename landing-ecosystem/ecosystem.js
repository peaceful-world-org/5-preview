
/* 5 · Peace Practice living landing. Reads canonical public PWA catalogues.
 * Never marks a plan as shipped without the source status. No tracking, no storage. */
const root=document.querySelector('#pw-practice-v2[data-eco-landing]');
if(root){
  const lang=root.dataset.pwLang==='en'?'en':'ru';
  const en=lang==='en';
  const base=new URL('./',import.meta.url);
  const dataSources={
    roadmap:'https://5.peaceful-world.org/web-vnext/roadmap.json',
    locales:'https://5.peaceful-world.org/locales/index.json'
  };
  const localSources={
    roadmap:new URL('data/roadmap-fallback.json',base).href,
    locales:new URL('data/locales-fallback.json',base).href
  };
  const say=(ru,enText)=>en?enText:ru;
  const $=id=>document.getElementById(id);
  const create=(tag,cls,text)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=String(text);
    return el;
  };
  const readJson=async(url,limit=4500)=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),limit);
    try{
      const response=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      return await response.json();
    }finally{clearTimeout(timer);}
  };
  async function load(name,check){
    try{
      const live=await readJson(dataSources[name]);
      if(check(live))return {data:live,source:'live'};
    }catch(_){}
    const local=await readJson(localSources[name]);
    if(!check(local))throw Error('Invalid '+name+' snapshot');
    return {data:local,source:'fallback'};
  }
  const validRoadmap=data=>Array.isArray(data?.groups)&&Array.isArray(data?.waves)&&Array.isArray(data?.available);
  const validLocales=data=>data?.locales&&typeof data.locales==='object';
  const statusNames={
    available:say('Доступно','Available'),
    development:say('В работе','In development'),
    planned:say('В планах','Planned')
  };
  const allowedStatuses=new Set(['available','development','planned']);
  const ideaStatus=idea=>allowedStatuses.has(idea?.status)?idea.status:'planned';
  const allowedUrl=href=>{
    try{
      const url=new URL(href,'https://5.peaceful-world.org/');
      return url.protocol==='https:'&&url.hostname==='5.peaceful-world.org'?url.href:null;
    }catch(_){return null;}
  };
  const stampStatus=status=>{
    const span=create('span','eco-item-state');
    span.dataset.status=status;
    span.setAttribute('role','img');
    span.setAttribute('aria-label',statusNames[status]);
    span.title=statusNames[status];
    return span;
  };
  function drawRoadmap(data){
    const groups=data.groups;
    const container=$('eco-practice-catalog');
    const ideas=groups.flatMap(g=>g.ideas||[]);
    const futureCount=ideas.filter(idea=>ideaStatus(idea)!=='available').length;
    $('eco-idea-count').textContent=String(futureCount);
    const heroFuture=$('eco-hero-idea-count');
    if(heroFuture)heroFuture.textContent=String(futureCount);
    $('eco-category-count').textContent=String(groups.length);
    container.replaceChildren();
    const modeCount=$('eco-live-mode-count');
    if(modeCount)modeCount.textContent=String(root.querySelectorAll('.pw-mode-card').length);
    const heroModes=$('eco-hero-mode-count');
    if(heroModes)heroModes.textContent=String(root.querySelectorAll('.pw-mode-card').length);
    groups.forEach(group=>{
      const section=create('section','eco-practice-group');
      section.append(create('h3','',group[lang]||group.en||group.ru||''));
      const list=create('ul');
      (group.ideas||[]).forEach(idea=>{
        const status=ideaStatus(idea);
        const row=create('li');
        const label=(idea[lang]||idea.en||idea.ru||'').trim();
        const safeHref=status==='available'?allowedUrl(idea.href):null;
        row.append(stampStatus(status));
        if(safeHref){
          const a=create('a','eco-practice-label',label);
          a.href=safeHref;
          row.append(a);
        }else{row.append(create('span','eco-practice-label',label));}
        list.append(row);
      });
      section.append(list);
      container.append(section);
    });
    const development=ideas.filter(idea=>ideaStatus(idea)==='development').length;
    const devSummary=$('eco-dev-summary');
    if(development){
      devSummary.textContent=say('Сейчас в разработке: ','Currently in development: ')+development;
      devSummary.hidden=false;
    }else{devSummary.hidden=true;}
  }
  function resolveName(code,roadmap){
    const fixed=roadmap.languageNames?.[lang]?.[code]
      ||roadmap.languageNames?.en?.[code];
    if(fixed)return fixed;
    try{
      const result=new Intl.DisplayNames([lang],{type:'language'}).of(code);
      if(result && result.toLowerCase()!==code.toLowerCase()
          && !/^[a-z]{2,3}$/i.test(result))return result;
    }catch(_){}
    return code;
  }
  function drawLocales(roadmap,localeData){
    const released=Object.entries(localeData.locales||{})
      .filter(([,item])=>item&&item.released===true)
      .map(([code,item])=>({code,label:item.label||roadmap.available.find(v=>v.code===code)?.label||code}));
    const releasedCodes=new Set(released.map(x=>x.code.toLowerCase()));
    const sorter=new Intl.Collator(lang,{sensitivity:'base'});
    released.sort((a,b)=>sorter.compare(a.label,b.label));
    const current=$('eco-locales-live');
    current.replaceChildren(...released.map(({label})=>create('span','',label)));
    $('eco-live-count').textContent=String(released.length);
    const heroLocales=$('eco-hero-locale-count');
    if(heroLocales)heroLocales.textContent=String(released.length);
    const planned=[...new Set(roadmap.waves.flatMap(wave=>wave.codes||[]))]
      .filter(code=>!releasedCodes.has(code.toLowerCase()))
      .map(code=>({code,label:resolveName(code,roadmap)}))
      .sort((a,b)=>sorter.compare(a.label,b.label));
    $('eco-language-count').textContent=String(planned.length);
    const list=$('eco-locales-planned');
    list.replaceChildren(...planned.map(({label})=>create('li','',label)));
  }
  Promise.all([load('roadmap',validRoadmap),load('locales',validLocales)])
    .then(([roadmap,locales])=>{
      drawRoadmap(roadmap.data);
      drawLocales(roadmap.data,locales.data);
      root.dataset.ecoSource=(roadmap.source==='live'&&locales.source==='live')?'live':'fallback';
    })
    .catch(()=>{
      for(const id of ['eco-practice-catalog','eco-locales-live','eco-locales-planned']){
        const el=$(id);
        const p=create('p','eco-error',say('Сейчас не удалось загрузить карту. Открой приложение — там есть актуальная версия.','The roadmap could not load. Open the app for the latest version.'));
        el.replaceChildren(p);
      }
      root.dataset.ecoSource='unavailable';
    });
}
