/* Independent QA harness: executes actual clicks in a same-origin noindex iframe.
   No feedback submission, cloud sync, donations or PWA installation. */
'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const params=new URLSearchParams(location.search);
  const flow=params.get('flow')||'free';
  const lang=params.get('lang')||'ru';
  const frame=$('frame');
  const entries=[];
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const update=(label,state)=>{const p=$('result');p.textContent=label;p.className=state;document.title=label+' · 5 QA'};
  function record(ok,message){
    entries.push({ok,message});
    const li=document.createElement('li');
    li.className=ok?'pass':'fail';
    li.textContent=(ok?'PASS · ':'FAIL · ')+message;
    $('steps').appendChild(li);
    if(!ok)throw new Error(message);
  }
  function assert(value,message){record(Boolean(value),message)}
  const wait=async (condition,description,limit=8500)=>{
    const end=Date.now()+limit;
    while(Date.now()<end){try{if(condition())return true}catch(_){/* loading */}await sleep(40)}
    throw new Error('Timed out waiting for '+description);
  };
  async function run(){
    const w=frame.contentWindow,d=frame.contentDocument;
    await wait(()=>Boolean(w.PW_I18N?.ready && w.PW_TRAINING_MODES && d.querySelector('#pwModeFreeStart')), 'app runtime');
    await w.PW_I18N.ready;
    await wait(()=>!d.documentElement.hasAttribute('data-preview-pending'),'translated home');
    const click=id=>{const node=d.getElementById(id);if(!node)throw Error('Missing '+id);node.click();return node};
    const active=id=>Boolean(d.getElementById(id)?.classList.contains('active'));
    assert(active('home'),'Home visible and interactive');
    assert(d.getElementById('pwModeCards')?.firstElementChild?.classList.contains('practice-choice--free'),'Free card first');
    if(flow==='free'){
      await wait(()=>Boolean(d.getElementById('pwFreeTimerScreen')),'free timer script');
      click('pwModeFreeStart');
      await wait(()=>active('pwFreeTimerScreen'),'Free screen');
      assert(active('pwFreeTimerScreen'),'Free start activates timer screen');
      click('pwFreePrimary');
      await sleep(1400);
      const elapsed=d.getElementById('pwFreeTime')?.textContent||'';
      assert(elapsed!=='00:00','Free timer counts actual elapsed time ('+elapsed+')');
      click('pwFreeHint');
      const overlay=d.querySelector('.pw-free-hint-card')?.closest('.pw-practice-hint-overlay');
      assert(overlay && !overlay.hidden,'Free optional hint opens');
      d.querySelector('.pw-free-hint-card .pw-practice-hint-continue')?.click();
      await wait(()=>overlay?.hidden,'hint close');
      assert(overlay.hidden,'Free hint closes and returns to timer');
      click('pwFreeFinish');
      await wait(()=>active('done'),'Free completion');
      assert(active('done'),'Free finish shows completion');
      const doneMode=d.getElementById('pwModeDoneSummaryMode')?.textContent||'';
      assert(doneMode.length>0,'Completion names the mode: '+doneMode);
      click('pwModeBack');
      await wait(()=>active('home'),'return from completion');
      assert(active('home'),'Back from completion returns Home');
    } else if(flow==='foundation'||flow==='metta'){
      const id=flow==='foundation'?'pwModeBaseStart':'pwModeMettaStart';
      click(id);
      await wait(()=>active('practice'),'guided practice');
      assert(active('practice'),'Guided start activates practice');
      const step=d.getElementById('stepTitle')?.textContent||'';
      assert(step.trim().length>0,'First step has a translated instruction: '+step);
      click('pauseBtn');
      assert(d.getElementById('timerShell')?.classList.contains('paused'),'Pause changes timer state');
      click('pauseBtn');
      assert(!d.getElementById('timerShell')?.classList.contains('paused'),'Resume restores timer state');
      click('closeBtn');
      await wait(()=>active('home'),'exit from guided');
      assert(active('home'),'Exit returns Home');
      const info=flow==='foundation'?'pwModeInfoFoundation':'pwModeInfoMetta';
      click(info);
      assert(d.getElementById('pwModeInfoDialog')?.open,'Information dialog opens');
      click('pwModeInfoClose');
      assert(!d.getElementById('pwModeInfoDialog')?.open,'Information dialog closes');
    } else if(flow==='foundation-complete'||flow==='metta-complete'){
      // Simulated clock in a disposable iframe; tests timer state transitions,
      // not real elapsed five-minute timing, OS haptics or background behavior.
      const mode=flow==='foundation-complete'?'foundation':'metta';
      const source=w.performance.now.bind(w.performance);
      let synthetic=source();
      Object.defineProperty(w.performance,'now',{configurable:true,value:()=>synthetic});
      // Bypass animation delays inside this disposable test frame only.
      // The unchanged practice state machine still receives every manual tick.
      w.eval('CONFIG.transitionOutMs=0;CONFIG.transitionInMs=0;CONFIG.phaseChangeMs=0');
      assert(typeof w.tick==='function','Guided timer tick is exposed to the test frame');
      click(mode==='foundation'?'pwModeBaseStart':'pwModeMettaStart');
      await wait(()=>active('practice'),'guided demo practice');
      assert(active('practice'),'Guided demo started');
      await sleep(40);
      const tickForward=()=>{synthetic+=950;w.tick()};
      const stepCount=()=>d.getElementById('stepCount')?.textContent||'';
      for(let step=0;step<5;step++){
        for(let n=0;n<3;n++)tickForward();
        await wait(()=>d.getElementById('timerShell')?.classList.contains('is-practice') &&
          !d.getElementById('timerShell')?.classList.contains('phase-change'),'step '+(step+1)+' practice phase',3000);
        for(let n=0;n<6;n++)tickForward();
        if(step<4){
          await wait(()=>stepCount().includes(String(step+2)),'transition to step '+(step+2),3500);
          record(true,'Demo advanced to step '+(step+2)+' of 5');
        }else{
          await wait(()=>active('done'),'guided demo completion',4000);
        }
      }
      assert(active('done'),'Guided demo reaches completion screen');
      const summary=d.getElementById('pwModeDoneSummaryMode')?.textContent||'';
      assert(summary.trim().length>0,'Completion summary shows mode: '+summary);
      click('pwModeBack');
      await wait(()=>active('home'),'return from completed practice');
      assert(active('home'),'Completion return action works');
      Object.defineProperty(w.performance,'now',{configurable:true,value:source});
    } else if(flow==='locale'){
      const btn=d.querySelector('.pw-language-button');
      assert(Boolean(btn)&&!btn.hidden,'Language switcher available');
      btn.click();
      const panel=d.querySelector('.pw-language-panel');
      assert(panel&&!panel.hidden,'Language menu opens');
      const option=[...d.querySelectorAll('.pw-language-option')].find(el=>(el.textContent||'').toLowerCase().includes('fran'));
      assert(Boolean(option),'French selectable');
      option.click();
      await wait(()=>d.documentElement.lang.toLowerCase().startsWith('fr'),'French copy');
      assert((d.getElementById('pwCardFreeTitle')?.textContent||'').toLowerCase().includes('libre'),'French title rendered');
      const current=w.PW_THEME?.effective||d.documentElement.dataset.pwTheme;
      d.querySelector('.pw-theme-button')?.click();
      await wait(()=>d.documentElement.dataset.pwTheme!==current,'theme switched');
      assert(d.documentElement.dataset.pwTheme!==current,'Theme toggle changed appearance');
      d.querySelector('.pw-theme-button')?.click();
      await wait(()=>d.documentElement.dataset.pwTheme===current,'theme restored');
      assert(d.documentElement.dataset.pwTheme===current,'Theme toggled back');
    } else if(flow==='atlas'){
      click('pwWorldOpen');
      await wait(()=>!d.getElementById('pwWorldDetails')?.hidden,'atlas opened');
      assert(d.getElementById('pwWorldOpen')?.getAttribute('aria-expanded')==='true','Atlas open and accessible');
      await wait(()=>d.querySelectorAll('.pw-world-atlas-group').length===6,'atlas data');
      assert(d.querySelectorAll('.pw-world-atlas-group').length===6,'Six curriculum categories');
      assert(d.querySelectorAll('.pw-world-wave-code').length===46,'46 candidate locale variants');
      click('pwWorldOpen');
      assert(d.getElementById('pwWorldDetails')?.hidden,'Atlas closes');
    } else if(flow==='layout'){
      for(const width of [320,375,430,768,1280]){
        frame.style.width=width+'px';frame.style.maxWidth='none';
        await sleep(85);
        const viewport=d.documentElement.clientWidth||w.innerWidth;
        const overflowing=d.documentElement.scrollWidth-viewport;
        const visibleIds=['pwModeFreeStart','pwModeBaseStart','pwModeMettaStart','pwWorldOpen'];
        const widths=visibleIds.map(id=>{
          const r=d.getElementById(id)?.getBoundingClientRect();
          return r&&r.width>80&&r.left>=-2&&r.right<=viewport+3;
        });
        assert(overflowing<=4 && widths.every(Boolean),'Viewport '+width+' px: no horizontal overflow, four primary actions in bounds');
      }
    } else throw new Error('Unknown QA flow '+flow);
    update('PASS · '+flow.toUpperCase()+' · '+entries.length+' checks','pass');
  }
  frame.onload=()=>run().catch(error=>{
    const msg=String(error?.message||error);
    const li=document.createElement('li');li.className='fail';li.textContent='ERROR · '+msg;$('steps').appendChild(li);
    update('FAIL · '+flow.toUpperCase()+' · '+msg,'fail');
  });
  frame.src='/languages/world/?lang='+encodeURIComponent(lang)+'&demo=1';
})();
