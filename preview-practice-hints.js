/* 5-preview — optional practice examples. Permanent preview only. */
'use strict';

(() => {
  if (location.hostname !== 'preview-5.peaceful-world.org') return;
  if (window.__PW_PRACTICE_HINTS_PREVIEW__) return;
  window.__PW_PRACTICE_HINTS_PREVIEW__ = true;

  const practiceScreen = document.getElementById('practice');
  const stepGuideEl = document.getElementById('stepGuide');
  const stepCountEl = document.getElementById('stepCount');
  if (!practiceScreen || !stepGuideEl || !stepCountEl) return;

  const COPY = {
    ru: {
      trigger: 'Пример',
      triggerAria: 'Показать пример для этого шага',
      continue: 'Продолжить',
      step1: 'Например: ты вдруг замечаешь, что уже думаешь о других делах. Сам факт замечания — уже часть упражнения.',
      step2: 'Например: птица за окном легко становится частью пейзажа. Попробуй увидеть не фон, а отдельную жизнь, которая продолжается независимо от тебя.',
      step3: 'Например: можно мысленно сказать другу или животному: «Пусть у тебя всё будет хорошо». Тёплое чувство может не появиться — это не мешает практике.',
      step4: 'Например: выкурить на одну сигарету меньше, дать телу отдохнуть или отказаться от чего-то, что вредит тебе или другим.',
      step5: 'Например: не просто «постараюсь быть добрее», а «когда почувствую, что злюсь, сначала сделаю паузу и не скажу того, что может ранить другого».'
    },
    en: {
      trigger: 'Example',
      triggerAria: 'Show an example for this step',
      continue: 'Continue',
      step1: 'For example, you might notice your mind has wandered. Noticing that is already part of the exercise.',
      step2: 'For example, a bird outside the window can easily fade into the background. Try to see it instead as a life of its own, independent of you.',
      step3: 'For example, you might silently say to a friend or an animal, “I hope things go well for you.” A warm feeling may not come. You do not need one for the exercise.',
      step4: 'For example: smoking one less cigarette, getting a little more rest, or saying no to something that would harm you or someone else.',
      step5: 'For example: not just “I’ll try to be kinder,” but “When I notice I’m getting angry, I’ll pause before I speak so I don’t say something hurtful.”'
    }
  };

  const style = document.createElement('style');
  style.id = 'pwPracticeHintPreviewStyles';
  style.textContent = `
    .pw-practice-hint-trigger{
      appearance:none;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:34px;
      margin:15px auto 0;
      padding:4px 11px;
      border:1px solid var(--line);
      border-radius:999px;
      background:transparent;
      color:var(--muted);
      font:600 .78rem/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      cursor:pointer;
      opacity:.9;
      transition:opacity .18s ease,background .18s ease,border-color .18s ease,transform .15s ease;
    }
    .pw-practice-hint-trigger[hidden]{display:none!important}
    .pw-practice-hint-trigger:hover{
      opacity:1;
      background:rgba(123,141,123,.07);
      border-color:rgba(123,141,123,.28);
    }
    .pw-practice-hint-trigger:active{transform:scale(.98)}
    .pw-practice-hint-trigger:focus-visible{outline:2px solid #67766A;outline-offset:2px}
    .pw-practice-hint-overlay{
      position:fixed;
      inset:0;
      z-index:1600;
      display:grid;
      place-items:center;
      padding:22px;
      background:rgba(18,22,20,.28);
      backdrop-filter:blur(2px);
      -webkit-backdrop-filter:blur(2px);
    }
    .pw-practice-hint-overlay[hidden]{display:none!important}
    .pw-practice-hint-card{
      width:min(100%,390px);
      padding:24px 22px 20px;
      border:1px solid var(--line);
      border-radius:24px;
      background:var(--surface);
      color:var(--ink);
      box-shadow:0 22px 70px rgba(18,22,20,.18);
      text-align:center;
    }
    .pw-practice-hint-text{
      margin:0 auto;
      max-width:340px;
      color:var(--text);
      font-size:.98rem;
      line-height:1.62;
    }
    .pw-practice-hint-continue{
      appearance:none;
      min-width:160px;
      min-height:46px;
      margin-top:20px;
      padding:0 24px;
      border:1px solid var(--line);
      border-radius:999px;
      background:var(--ink);
      color:var(--surface);
      font:700 .92rem/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      cursor:pointer;
    }
    .pw-practice-hint-continue:focus-visible{outline:2px solid #67766A;outline-offset:3px}
    @media(max-width:420px){
      .pw-practice-hint-overlay{padding:18px}
      .pw-practice-hint-card{padding:22px 19px 18px;border-radius:22px}
      .pw-practice-hint-text{font-size:.94rem;line-height:1.58}
    }
  `;
  document.head.appendChild(style);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'pw-practice-hint-trigger';
  trigger.hidden = true;
  stepGuideEl.insertAdjacentElement('afterend', trigger);

  const overlay = document.createElement('div');
  overlay.className = 'pw-practice-hint-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-describedby', 'pwPracticeHintText');
  overlay.innerHTML = `
    <div class="pw-practice-hint-card">
      <p id="pwPracticeHintText" class="pw-practice-hint-text"></p>
      <button type="button" class="pw-practice-hint-continue"></button>
    </div>`;
  document.body.appendChild(overlay);

  const hintText = overlay.querySelector('.pw-practice-hint-text');
  const continueBtn = overlay.querySelector('.pw-practice-hint-continue');
  let openStep = 0;
  let pausedByHint = false;

  function currentLocale() {
    const code = String(window.PW_I18N?.locale || document.documentElement.lang || 'ru').toLowerCase().split('-')[0];
    return code === 'en' ? 'en' : 'ru';
  }

  function localeCopy() {
    return COPY[currentLocale()];
  }

  function currentStep() {
    try {
      if (typeof stepIndex !== 'undefined' && Number.isInteger(stepIndex)) return stepIndex + 1;
    } catch (_) {}
    const match = String(stepCountEl.textContent || '').match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function isPausedNow() {
    try { return typeof paused !== 'undefined' && paused === true; }
    catch (_) { return false; }
  }

  function syncCopy() {
    const copy = localeCopy();
    trigger.textContent = copy.trigger;
    trigger.setAttribute('aria-label', copy.triggerAria);
    overlay.setAttribute('aria-label', copy.trigger);
    continueBtn.textContent = copy.continue;
  }

  function syncTrigger() {
    syncCopy();
    const step = currentStep();
    const available = practiceScreen.classList.contains('active') && step >= 1 && step <= 5;
    trigger.hidden = !available;
    if (!available && !overlay.hidden) closeHint(practiceScreen.classList.contains('active'));
  }

  function renderHint(step) {
    hintText.textContent = localeCopy()[`step${step}`] || '';
  }

  function pauseForHint() {
    pausedByHint = false;
    if (isPausedNow()) return;
    try {
      if (typeof pausePractice === 'function') {
        pausePractice();
        pausedByHint = isPausedNow();
      }
    } catch (_) {}
  }

  function resumeAfterHint() {
    const shouldResume = pausedByHint;
    pausedByHint = false;
    if (!shouldResume || !isPausedNow()) return;
    try {
      if (typeof pausePractice === 'function') pausePractice();
    } catch (_) {}
  }

  function openHint() {
    const step = currentStep();
    if (step < 1 || step > 5) return;
    openStep = step;
    pauseForHint();
    renderHint(step);
    overlay.hidden = false;
    window.PW_ANALYTICS?.event?.('practice_hint_open', { practice_step: step });
    window.setTimeout(() => continueBtn.focus({ preventScroll:true }), 0);
  }

  function closeHint(resume = true) {
    if (overlay.hidden) return;
    overlay.hidden = true;
    openStep = 0;
    if (resume) resumeAfterHint();
    else pausedByHint = false;
    if (practiceScreen.classList.contains('active')) {
      window.setTimeout(() => trigger.focus({ preventScroll:true }), 0);
    }
  }

  trigger.addEventListener('click', openHint);
  continueBtn.addEventListener('click', () => closeHint(true));
  overlay.addEventListener('click', event => {
    if (event.target !== overlay) return;
    continueBtn.focus({ preventScroll:true });
  });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Tab') {
      event.preventDefault();
      continueBtn.focus({ preventScroll:true });
      return;
    }
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeHint(true);
  }, true);

  new MutationObserver(syncTrigger).observe(stepCountEl, { childList:true, characterData:true, subtree:true });
  new MutationObserver(syncTrigger).observe(practiceScreen, { attributes:true, attributeFilter:['class'] });
  document.addEventListener('pw:locale-changed', () => {
    syncTrigger();
    if (!overlay.hidden && openStep) renderHint(openStep);
  });

  syncTrigger();
})();