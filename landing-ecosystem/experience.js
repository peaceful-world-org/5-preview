(()=>{
  const root=document.getElementById('pw-practice-v2');
  if(!root)return;

  const lang=root.dataset.pwLang==='en'?'en':'ru';

  const ATTRIBUTION_PARAMS=['gclid','gbraid','wbraid','gclsrc','utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id'];
  const decoratePracticeLinks=()=>{
    const incoming=new URLSearchParams(window.location.search);
    const hasGoogleAdClick=['gclid','gbraid','wbraid'].some(key=>incoming.has(key));
    if(hasGoogleAdClick){
      if(!incoming.has('utm_source'))incoming.set('utm_source','google');
      if(!incoming.has('utm_medium'))incoming.set('utm_medium','cpc');
    }

    root.querySelectorAll('a[href]').forEach(link=>{
      let url;
      try{url=new URL(link.href,window.location.href);}catch{return;}
      if(url.hostname!=='5.peaceful-world.org')return;

      ATTRIBUTION_PARAMS.forEach(key=>{
        const value=incoming.get(key);
        if(value)url.searchParams.set(key,value);
      });
      if(!url.searchParams.has('lang'))url.searchParams.set('lang',lang);
      link.href=url.toString();
    });
  };
  decoratePracticeLinks();
  const stepButtons=[...root.querySelectorAll('.pw-five-rail button')];
  const readout=root.querySelector('.pw-five-readout');
  const panel=root.querySelector('#pw-step-panel');
  const title=root.querySelector('#pw-step-title');
  const body=root.querySelector('#pw-step-body');
  const meter=root.querySelector('.pw-five-meter');
  const meterNo=root.querySelector('.pw-five-meter-no');
  let activeStep=1;

  const text=(el,enKey,ruKey)=>lang==='en'?el.dataset[enKey]:el.dataset[ruKey];

  const animateReadout=()=>{
    if(!readout)return;
    readout.classList.remove('is-changing');
    void readout.offsetWidth;
    readout.classList.add('is-changing');
  };

  const renderStep=(step,{animate=true}={})=>{
    activeStep=Math.max(1,Math.min(5,step));
    const btn=stepButtons.find(b=>Number(b.dataset.step)===activeStep)||stepButtons[0];
    if(!btn||!title||!body||!meter||!meterNo||!readout)return;

    stepButtons.forEach(b=>{
      const on=b===btn;
      b.classList.toggle('is-active',on);
      b.setAttribute('aria-selected',String(on));
      b.tabIndex=on?0:-1;
    });

    title.textContent=text(btn,'enTitle','ruTitle');
    body.textContent=text(btn,'enBody','ruBody');
    meterNo.textContent=String(activeStep).padStart(2,'0');
    meter.style.setProperty('--pw-progress',(activeStep*20)+'%');
    readout.dataset.step=String(activeStep);
    if(panel&&btn.id)panel.setAttribute('aria-labelledby',btn.id);
    if(animate)animateReadout();
  };

  stepButtons.forEach((btn,index)=>{
    const activate=()=>renderStep(Number(btn.dataset.step));
    btn.addEventListener('click',activate);
    btn.addEventListener('pointerenter',event=>{
      if(event.pointerType!=='touch')activate();
    });
    btn.addEventListener('focus',()=>renderStep(Number(btn.dataset.step),{animate:false}));
    btn.addEventListener('keydown',event=>{
      let nextIndex=null;
      if(event.key==='ArrowDown'||event.key==='ArrowRight')nextIndex=(index+1)%stepButtons.length;
      if(event.key==='ArrowUp'||event.key==='ArrowLeft')nextIndex=(index-1+stepButtons.length)%stepButtons.length;
      if(event.key==='Home')nextIndex=0;
      if(event.key==='End')nextIndex=stepButtons.length-1;
      if(nextIndex===null)return;
      event.preventDefault();
      stepButtons[nextIndex].focus();
      renderStep(Number(stepButtons[nextIndex].dataset.step));
    });
  });

  readout?.addEventListener('animationend',()=>readout.classList.remove('is-changing'));
  renderStep(1,{animate:false});
})();