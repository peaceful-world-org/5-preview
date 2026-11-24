/* Uses the existing runtime's pause/resume. No analytics or feedback network calls. */
'use strict';
(() => {
 const trigger=document.createElement('button');trigger.type='button';trigger.className='pw-practice-hint-trigger';trigger.textContent='Пример';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','pilotHint');stepGuide.insertAdjacentElement('afterend',trigger);
 const dialog=document.createElement('dialog');dialog.id='pilotHint';dialog.className='practice-info-dialog pilot-hint';dialog.setAttribute('aria-label','Пример для шага');dialog.innerHTML='<div class="practice-info-surface"><p class="practice-info-text" id="pilotHintText"></p><button class="practice-info-start" id="pilotHintContinue" type="button">Продолжить</button></div>';document.body.append(dialog);
 const continueBtn=document.getElementById('pilotHintContinue');let resume=false;
 trigger.addEventListener('click',()=>{if(!practice.classList.contains('active')||transitionLock||dialog.open)return;const hint=window.PW_TRAINING_MODES.example(stepIndex+1);if(!hint)return;resume=!paused;if(resume)pausePractice();document.getElementById('pilotHintText').textContent=hint;dialog.showModal();continueBtn.focus();});
 continueBtn.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
 dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
 dialog.addEventListener('close',()=>{if(resume&&paused&&practice.classList.contains('active')&&!document.hidden)pausePractice();resume=false;if(practice.classList.contains('active'))trigger.focus({preventScroll:true});});
 new MutationObserver(()=>{if(!practice.classList.contains('active')&&dialog.open){resume=false;dialog.close();}}).observe(practice,{attributes:true,attributeFilter:['class']});
 document.getElementById('pilotBack').addEventListener('click',exit);
 document.getElementById('pilotRepeat').addEventListener('click',()=>startBtn.click());
})();
