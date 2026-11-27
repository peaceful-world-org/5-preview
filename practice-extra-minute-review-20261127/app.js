/* 5 by Peaceful World — core practice runtime
   User-facing timing: prep 5→1, practice 59→0.
   Audio/haptics are provided by sound-v1.js through the hooks below.
*/
'use strict';

const CONFIG = {
  prepSeconds: 5,
  practiceSeconds: 60,
  demoPrepSeconds: 2,
  demoPracticeSeconds: 5,
  ringRadius: 49,
  transitionOutMs: 430,
  transitionInMs: 620,
  phaseChangeMs: 260,
  freezeGapMs: 2000
};

const FINAL_RETURN_RESET_MS = 30 * 60 * 1000;
const SHARE_URL = 'https://5.peaceful-world.org/';

// Last-resort Russian copy if both the i18n and rotation layers are unavailable.
// Keep in sync with copy-rotation.js and locales/ru.json.
const FALLBACK_STEPS = [
  { title:'Остановись', guide:'Найди то, на чём легко сосредоточиться: дыхание, предмет, звук или ощущение в теле. В течение минуты спокойно удерживай на этом внимание. Если отвлечёшься, мягко возвращайся к выбранному.' },
  { title:'Увидь живое', guide:'Начни с себя. Заметь: как и ты, каждое живое существо хочет жить и не хочет страдать. В течение минуты побудь с этой мыслью.' },
  { title:'Пожелай добра', guide:'Представь кого-то, кому легко пожелать добра. В течение минуты мысленно возвращайся к добрым пожеланиям.' },
  { title:'Уменьши вред', guide:'Вспомни что-то в повседневной жизни, что хотя бы немного вредит тебе или кому-то ещё. В течение минуты поищи способы уменьшить этот вред.' },
  { title:'Сделай выбор', guide:'Прими одно небольшое решение: что сделать или чего не делать в ближайшее время. Представь подходящий момент и мысленно репетируй, как поступишь.' }
];
let STEPS = FALLBACK_STEPS.map(step => ({ ...step }));

const REDUCED_MOTION = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (REDUCED_MOTION) {
  CONFIG.transitionOutMs = 0;
  CONFIG.transitionInMs = 0;
  CONFIG.phaseChangeMs = 60;
}

const IS_DEMO = true; // isolated review, no workout or account writes
// Real-speed isolated review; no practice/account writes.
const PREP = CONFIG.prepSeconds;
const PRACTICE = CONFIG.practiceSeconds;
const CIRC = 2 * Math.PI * CONFIG.ringRadius;

function i18nText(key, fallback, vars) {
  return window.PW_I18N?.text?.(key, fallback, vars) ?? fallback;
}

function currentLocale() {
  return window.PW_I18N?.locale || document.documentElement.lang || 'ru';
}
function localizedSeconds(value) {
  const format = window.PW_DRAFT_LOCALES?.[currentLocale()]?.formatSeconds;
  return typeof format === 'function' ? format(value) : value;
}

function localizedFallbackSteps() {
  const pack = window.PW_I18N?.pack;
  if (pack && window.PW_I18N?.locale) {
    const steps = [1, 2, 3, 4, 5].map(number => ({
      title: pack[`practice.step${number}.title`],
      guide: pack[`practice.step${number}.guide`]
    }));
    if (validPracticeSteps(steps)) return steps;
  }
  return FALLBACK_STEPS.map(step => ({ ...step }));
}

function validPracticeSteps(value) {
  return Array.isArray(value) &&
    value.length === FALLBACK_STEPS.length &&
    value.every(step =>
      step &&
      typeof step.title === 'string' && step.title.trim().length > 0 &&
      typeof step.guide === 'string' && step.guide.trim().length > 0
    );
}

function selectPracticeSteps() {
  try {
    const nextSteps = window.PW_COPY_ROTATION?.startSession?.({ demo: IS_DEMO });
    if (validPracticeSteps(nextSteps)) {
      STEPS = nextSteps.map(step => ({ title: step.title, guide: step.guide }));
      return true;
    }
  } catch (error) {
    console.warn('Copy rotation unavailable; using locale fallback copy.', error);
  }

  if(window.PW_FOCUS_PILOT.some(p=>p.id===window.PW_TRAINING_MODES?.mode))return false;
  const fallback = localizedFallbackSteps();
  if (!validPracticeSteps(fallback)) return false;
  STEPS = fallback;
  return true;
}

const store = {
  get(key, fallback) {
    try {
      const value = window.PW_REVIEW_STORAGE.getItem(key);
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    try { window.PW_REVIEW_STORAGE.setItem(key, value); } catch (_) {}
  }
};

let stepIndex = 0;
let phase = 'prep';
let interval = null;
let paused = false;
let remainingMs = 0;
let completedActiveSeconds = 0;
let startedAt = 0;
let durationMs = 0;
let lastTick = null;
let transitionLock = false;
let ticking = store.get('pw-ticking', 'on') !== 'off';
let lastLoopAt = performance.now();
let lastObservedRemainingMs = 0;
let deferredInstallPrompt = null;
let finalHiddenAt = 0;
let startingPractice = false;
let resumeAfterExitDialog = false;

const $ = id => document.getElementById(id);
const home = $('home');
const practice = $('practice');
const done = $('done');
const feedback = $('feedback');
const startBtn = $('startBtn');
const closeBtn = $('closeBtn');
const exitDialog = $('pwExitDialog');
const exitStayBtn = $('pwExitStay');
const exitLeaveBtn = $('pwExitLeave');
const pauseBtn = $('pauseBtn');
const extendBtn = $('extendMinuteBtn');
const feedbackBtn = $('feedbackBtn');
const shareBtn = $('shareBtn');
const feedbackBackBtn = $('feedbackBackBtn');
const feedbackDoneBtn = $('feedbackDoneBtn');
const researchOptin = $('researchOptin');
const emailWrap = $('emailWrap');
const soundToggle = $('soundToggle');
const stepCount = $('stepCount');
const dots = $('dots');
const stepTitle = $('stepTitle');
const stepGuide = $('stepGuide');
const timer = $('timer');
const timerCaption = $('timerCaption');
const progressRing = $('progressRing');
const timerShell = $('timerShell');
const practiceContent = $('practiceContent');
const srStatus = $('srStatus');
const doneKicker = $('doneKicker');
const doneTitle = $('doneTitle');
const feedbackTitle = $('feedbackTitle');
const installArea = $('installArea');
const installBtn = $('installBtn');
const installHelp = $('installHelp');
const installHelpCopy = $('installHelpCopy');
const installHelpClose = $('installHelpClose');

progressRing.style.strokeDasharray = String(CIRC);

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

function updateInstallUI() {
  if (!installArea || !installBtn) return;

  if (isStandalone()) {
    installArea.hidden = true;
    return;
  }

  installArea.hidden = false;
  if (installHelp) installHelp.hidden = true;

  if (deferredInstallPrompt) {
    installBtn.textContent = i18nText('install.device.fallback', 'Установить 5 на устройство');
    return;
  }

  if (isIOS()) {
    installBtn.textContent = i18nText('home.install.cta.ios', 'Как установить');
  } else {
    installBtn.textContent = i18nText('install.device.fallback', 'Установить 5 на устройство');
  }
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallUI();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installArea) installArea.hidden = true;
  announce(i18nText('install.installed.announce', '5 установлено на устройство.'));
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (isStandalone()) {
      installArea.hidden = true;
      return;
    }

    if (deferredInstallPrompt) {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
      } catch (_) {}
      updateInstallUI();
      return;
    }

    if (installHelp && installHelpCopy) {
      if (isIOS()) {
        installHelpCopy.textContent = i18nText(
          'install.help.ios',
          'Нажми «Поделиться» в браузере, затем выбери «На экран Домой».'
        );
      } else if (isAndroid()) {
        installHelpCopy.textContent = i18nText(
          'install.help.android',
          'Открой меню браузера и выбери «Установить приложение» или «Добавить на главный экран».'
        );
      } else {
        installHelpCopy.textContent = i18nText(
          'install.help.other',
          'Открой меню браузера и выбери установку приложения или добавление на главный экран.'
        );
      }
      installHelp.hidden = false;
      installHelpClose?.focus({ preventScroll:true });
    }
  });
}

installHelpClose?.addEventListener('click', () => {
  if (installHelp) installHelp.hidden = true;
  installBtn?.focus({ preventScroll:true });
});

const pending = new Set();
function later(fn, ms) {
  const id = window.setTimeout(() => {
    pending.delete(id);
    fn();
  }, ms);
  pending.add(id);
  return id;
}
function clearPending() {
  pending.forEach(window.clearTimeout);
  pending.clear();
}

function shareUrl() {
  const url = new URL(SHARE_URL);
  const locale = currentLocale();
  if (window.PW_DRAFT_LOCALES?.[locale] && window.PW_I18N?.isPreview) {
    url.protocol = location.protocol;
    url.host = location.host;
  }
  if (locale) url.searchParams.set('lang', locale);
  return url.toString();
}

async function copyShareLink(url = shareUrl()) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch (_) {}

  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch (_) {
    return false;
  }
}

async function shareTrainer() {
  const url = shareUrl();
  const title = i18nText('share.title', '5 — тренажёр мирного ума');
  const text = i18nText('share.text', '5 — пятиминутный тренажёр мирного ума от Peaceful World.');

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }

  const copied = await copyShareLink(url);
  if (!copied) {
    announce(i18nText('share.fail', 'Не удалось поделиться ссылкой.'));
    return;
  }

  announce(i18nText('share.copied.announce', 'Ссылка на тренажёр скопирована.'));
  if (shareBtn) {
    const original = shareBtn.textContent;
    shareBtn.textContent = i18nText('share.copied.button', 'Ссылка скопирована');
    later(() => { shareBtn.textContent = original; }, 1800);
  }
}

shareBtn?.addEventListener('click', shareTrainer);

let audioCtx = null;

function ensureAudio() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (_) {}
}

// Runtime hooks. sound-v1.js replaces these immediately after app.js loads.
function playTick() {}
function playBell() {}
function haptic() {}

let wakeLock = null;
async function acquireWakeLock() {
  try {
    if (!('wakeLock' in navigator) || wakeLock) return;
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch (_) {}
}
function releaseWakeLock() {
  try { if (wakeLock) wakeLock.release(); } catch (_) {}
  wakeLock = null;
}

function show(screen) {
  [home, practice, done, feedback].forEach(s => s && s.classList.remove('active'));
  screen.classList.add('active');
  screen.scrollTop = 0;
  if (screen !== done) finalHiddenAt = 0;
  if (screen === done) updateInstallUI();
}

function focusQuietly(el) {
  if (!el) return;
  try { el.focus({ preventScroll:true }); }
  catch (_) { try { el.focus(); } catch (_) {} }
}

function announce(text) {
  if (srStatus) srStatus.textContent = text;
}

function initDots() {
  dots.innerHTML = '';
  STEPS.forEach(() => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dots.appendChild(dot);
  });
}

function updateDots() {
  [...dots.children].forEach((dot, i) => {
    dot.classList.toggle('done', i < stepIndex);
    dot.classList.toggle('active', i === stepIndex);
  });
}

function updateSound() {
  soundToggle.classList.toggle('sound-on', ticking);
  soundToggle.setAttribute('aria-pressed', String(ticking));
  soundToggle.setAttribute(
    'aria-label',
    ticking
      ? i18nText('practice.sound.on.aria', 'Тиканье включено')
      : i18nText('practice.sound.off.aria', 'Тиканье выключено')
  );
}

function left() {
  return paused ? remainingMs : Math.max(0, remainingMs - (performance.now() - startedAt));
}

function renderTimer() {
  const ms = left();
  if(extendBtn)extendBtn.disabled=phase!=='practice'||!interval||transitionLock||ms<=0||v2GuidedSaving;

  if (phase === 'prep') {
    const seconds = Math.max(1, Math.ceil(ms / 1000));
    timer.textContent = String(seconds);
    timerCaption.textContent = i18nText('practice.preparing', 'ПОДГОТОВКА');
    timerShell.classList.add('preparing');
    timerShell.classList.remove('is-practice', 'ending','extended');
    timerShell.setAttribute(
      'aria-label',
      i18nText(
        'practice.timer.prep.aria',
        'Подготовка, осталось {seconds} секунд',
        { seconds: localizedSeconds(seconds) }
      )
    );
    progressRing.style.strokeDasharray = '48 260';
    progressRing.style.strokeDashoffset = '0';
    return;
  }

  timerShell.classList.remove('preparing');
  timerShell.classList.add('is-practice');
  progressRing.style.strokeDasharray = String(CIRC);

  const seconds = Math.max(0, Math.ceil(ms / 1000) - 1);
  const ariaSeconds = Math.max(0, Math.ceil(ms / 1000));
  timerShell.classList.toggle('ending', seconds <= 5);
  const extended=durationMs>PRACTICE*1000;
  timerShell.classList.toggle('extended',extended);
  timer.textContent=extended?Math.floor(ariaSeconds/60)+':'+String(ariaSeconds%60).padStart(2,'0'):String(seconds);
  timerCaption.textContent=extended?'МИН:СЕК':i18nText('practice.seconds','СЕКУНД');
  timerShell.setAttribute(
    'aria-label',
    i18nText(
      'practice.timer.run.aria',
      'Тренировка, осталось {seconds} секунд',
      { seconds: localizedSeconds(ariaSeconds) }
    )
  );

  const fraction = durationMs ? Math.max(0, Math.min(1, ms / durationMs)) : 1;
  progressRing.style.strokeDashoffset = String(CIRC * (1 - fraction));

  if (!paused && ticking && seconds !== lastTick) {
    lastTick = seconds;
    playTick(seconds % 2 === 0);
  }
}

function extendCurrentMinute() {
  if (!practice.classList.contains('active')||!interval||phase!=='practice'||transitionLock||v2GuidedSaving||document.hidden||exitDialog?.open||document.querySelector('dialog[open]'))return false;
  const ms=left();
  if(ms<=0)return false;
  // Extend only the current active-work interval. Never resume a paused timer,
  // count paused/preparation time, ring a bell, or start a new practice.
  const increment=60000;
  if(!Number.isSafeInteger(durationMs+increment))return false;
  remainingMs=ms+increment;
  durationMs+=increment;
  startedAt=performance.now();
  lastObservedRemainingMs=remainingMs;
  lastLoopAt=startedAt;
  lastTick=Math.max(0,Math.ceil(remainingMs/1000)-1);
  renderTimer();
  announce('Добавлена одна минута.');
  return true;
}
function updatePhaseVisual() {
  practiceContent.classList.toggle('is-prep', phase === 'prep');
  practiceContent.classList.toggle('is-practice', phase === 'practice');
}

function writeStep() {
  const step = STEPS[stepIndex];
  stepCount.textContent = `${stepIndex + 1} / ${STEPS.length}`;
  $('stepNumber').textContent=String(stepIndex+1);
  stepTitle.textContent = step.title;
  stepGuide.textContent = step.guide;
  updateDots();
  updatePhaseVisual();
  renderTimer();
}

function stepAnnouncement(index = stepIndex) {
  const step = STEPS[index];
  return i18nText(
    'practice.sr.step.template',
    'Шаг {n} из {total}. {title}. {guide}',
    { n: index + 1, total: STEPS.length, title: step.title, guide: step.guide }
  );
}

function renderStep(animate = false) {
  if (!animate) {
    writeStep();
    return;
  }

  transitionLock = true;
  if(extendBtn)extendBtn.disabled=true;
  practiceContent.classList.remove('entering');
  practiceContent.classList.add('changing');

  later(() => {
    if (phase === 'prep') {
      remainingMs = durationMs;
      startedAt = performance.now();
    }

    writeStep();
    practiceContent.classList.remove('changing');
    void practiceContent.offsetWidth;
    practiceContent.classList.add('entering');
    transitionLock = false;

    announce(stepAnnouncement());

    later(() => {
      practiceContent.classList.remove('entering');
    }, CONFIG.transitionInMs);
  }, CONFIG.transitionOutMs);
}

function begin(nextPhase, seconds, animate = false) {
  const keepPaused = paused;
  phase = nextPhase;
  durationMs = seconds * 1000;
  remainingMs = durationMs;
  startedAt = performance.now();
  paused = keepPaused;
  lastTick = null;
  lastObservedRemainingMs = remainingMs;
  timerShell.classList.toggle('paused', paused);
  pauseBtn.textContent = paused
    ? i18nText('practice.resume', 'Продолжить')
    : i18nText('practice.pause', 'Пауза');
  renderStep(animate);
}

function startStep(animate = false) {
  begin('prep', PREP, animate);
}

function startMinute() {
  transitionLock = true;
  if(extendBtn)extendBtn.disabled=true;
  timerShell.classList.add('phase-change');
  haptic();
  playBell();
  announce(i18nText('practice.sr.minute.started', 'Минута тренировки началась.'));

  later(() => {
    begin('practice', PRACTICE, false);
    requestAnimationFrame(() => {
      timerShell.classList.remove('phase-change');
      transitionLock = false;
      renderTimer();
    });
  }, CONFIG.phaseChangeMs);
}

function startTicker() {
  clearInterval(interval);
  lastLoopAt = performance.now();
  lastObservedRemainingMs = remainingMs;
  interval = window.setInterval(tick, 100);
}

function stopSession({ unlockLocale = true } = {}) {
  clearInterval(interval);
  interval = null;
  if(extendBtn)extendBtn.disabled=true;
  clearPending();
  transitionLock = false;
  paused = false;
  timerShell.classList.remove('preparing', 'phase-change', 'is-practice', 'ending', 'paused');
  practiceContent.classList.remove('changing', 'entering');
  releaseWakeLock();
  if (unlockLocale) window.PW_I18N?.unlockLocale?.();
}

let v2GuidedSaving = false;
async function startPractice() {
  if (startingPractice || v2GuidedSaving) return;
  startingPractice = true;
  startBtn.disabled = true;

  try {
    await window.PW_I18N?.ready;
    stopSession();
    window.PW_I18N?.lockLocale?.();

    if (!selectPracticeSteps()) {
      window.PW_I18N?.unlockLocale?.();
      return;
    }

    if (!IS_DEMO) {
      const v2 = await window.PW_PROGRESS_PREVIEW_READY;
      await v2.startGuided(window.PW_TRAINING_MODES?.mode || 'foundation', false);
    }
    ensureAudio();
    document.dispatchEvent(new CustomEvent('pw:practice-started', {
      detail: {
        mode: window.PW_TRAINING_MODES?.mode || 'foundation',
        locale: window.PW_COPY_ROTATION?.currentLocale || currentLocale(),
        copyVersion: window.PW_COPY_ROTATION?.copyVersion || window.PW_I18N?.config?.copyVersion || ''
      }
    }));
    stepIndex = 0;
    completedActiveSeconds=0;
    window.PW_LAST_COMPLETION=null;
    show(practice);
    initDots();
    updateSound();
    startStep(false);
    startTicker();
    acquireWakeLock();
    announce(stepAnnouncement(0));
    focusQuietly(stepTitle);
  } catch (error) {
    window.PW_PROGRESS_PREVIEW?.report(error);
    window.PW_I18N?.unlockLocale?.();
  } finally {
    startingPractice = false;
    startBtn.disabled = false;
  }
}

function tick() {
  const now = performance.now();
  const gap = now - lastLoopAt;
  lastLoopAt = now;

  if (paused || transitionLock) return;

  if (gap > CONFIG.freezeGapMs) {
    remainingMs = Math.max(0, lastObservedRemainingMs);
    paused = true;
    pauseBtn.textContent = i18nText('practice.resume', 'Продолжить');
    timerShell.classList.add('paused');
    releaseWakeLock();
    renderTimer();
    announce(i18nText('practice.sr.paused.auto', 'Тренировка поставлена на паузу.'));
    return;
  }

  const ms = left();
  lastObservedRemainingMs = ms;
  if (ms <= 0) {
    if (phase === 'prep') {
      startMinute();
      return;
    }
    completedActiveSeconds+=durationMs/1000;
    if(extendBtn)extendBtn.disabled=true;
    if (stepIndex < STEPS.length - 1) {
      stepIndex += 1;
      haptic();
      startStep(true);
      return;
    }
    playBell();
    haptic();
    finish();
    return;
  }

  renderTimer();
}

function pausePractice() {
  if (paused) {
    ensureAudio();
    paused = false;
    timerShell.classList.remove('paused');
    const now = performance.now();
    startedAt = now;
    lastLoopAt = now;
    if (phase === 'practice') lastTick = Math.max(0, Math.ceil(remainingMs / 1000) - 1);
    pauseBtn.textContent = i18nText('practice.pause', 'Пауза');
    acquireWakeLock();
    announce(i18nText('practice.sr.resumed', 'Тренировка продолжена.'));
    return;
  }

  remainingMs = left();
  lastObservedRemainingMs = remainingMs;
  paused = true;
  timerShell.classList.add('paused');
  pauseBtn.textContent = i18nText('practice.resume', 'Продолжить');
  releaseWakeLock();
  renderTimer();
  announce(i18nText('practice.sr.paused.manual', 'Пауза.'));
}

function completionLabel() {
  if (IS_DEMO) return i18nText('done.demo', 'Демо-тренировка');
  if (window.PW_LAST_COMPLETION?.mode === 'free') {
    return i18nText('done.kicker', 'Тренировка завершена');
  }
  const practiceNumber = window.PW_COPY_ROTATION?.lastCompletedPracticeNumber;
  if (Number.isSafeInteger(practiceNumber) && practiceNumber > 0) {
    return i18nText(
      'done.count.template',
      'Это была тренировка № {n}',
      { n: practiceNumber }
    );
  }
  return i18nText('done.kicker', 'Тренировка завершена');
}

function updateDoneMeta() {
  if (doneKicker) doneKicker.textContent = completionLabel();
}

async function finish() {
  if (v2GuidedSaving) return;
  v2GuidedSaving = true;
  stopSession();
  closeBtn.disabled = true;
  pauseBtn.disabled = true;
  try {
    if (!IS_DEMO) await (await window.PW_PROGRESS_PREVIEW_READY).finishGuided();
    window.PW_COPY_ROTATION?.completeSession?.();
    if(IS_DEMO)window.PW_LAST_COMPLETION={mode:window.PW_TRAINING_MODES?.mode||'foundation',durationSeconds:completedActiveSeconds,demo:true};
  } catch (error) {
    window.PW_PROGRESS_PREVIEW?.report(error, finish);
    return;
  } finally {
    v2GuidedSaving = false;
    closeBtn.disabled = false;
    pauseBtn.disabled = false;
  }
  updateDoneMeta();
  show(done);
  announce(`${doneKicker?.textContent || completionLabel()}. ${i18nText('done.title', 'Теперь просто действуй.')}`);
  focusQuietly(doneTitle);
}

async function exit() {
  if (v2GuidedSaving) return;
  if (exitDialog?.open) exitDialog.close();
  v2GuidedSaving = true;
  stopSession();
  try { if (!IS_DEMO) await (await window.PW_PROGRESS_PREVIEW_READY).abandonGuided(); }
  catch (error) { window.PW_PROGRESS_PREVIEW?.report(error, exit); return; }
  finally { v2GuidedSaving = false; }
  show(home);
  announce(i18nText('practice.sr.ended', 'Тренировка завершена.'));
  focusQuietly($('pwModeChoose'));
}

function markFinalHidden() {
  if (done.classList.contains('active')) finalHiddenAt = Date.now();
}

function maybeResetCompletedView() {
  if (!finalHiddenAt) return;
  const hiddenFor = Date.now() - finalHiddenAt;
  finalHiddenAt = 0;
  if (hiddenFor < FINAL_RETURN_RESET_MS || !done.classList.contains('active')) return;
  show(home);
  focusQuietly($('pwModeChoose'));
}

function requestExit() {
  if (v2GuidedSaving || !practice.classList.contains('active') || exitDialog?.open) return;
  resumeAfterExitDialog = Boolean(interval) && !paused;
  if (resumeAfterExitDialog) pausePractice();
  if (!exitDialog?.showModal) {
    answerExitDialog(window.confirm(i18nText('practice.exit.title', 'Прервать тренировку?') + '\n\n' + i18nText('practice.exit.body', 'Текущий сеанс не сохранится. Следующий начнётся с первого шага.')));
    return;
  }
  exitDialog.showModal();
  exitStayBtn?.focus({ preventScroll:true });
}
function answerExitDialog(shouldLeave) {
  if (exitDialog?.open) exitDialog.close();
  if (shouldLeave) { resumeAfterExitDialog = false; void exit(); return; }
  if (resumeAfterExitDialog && paused && interval && !document.hidden) pausePractice();
  resumeAfterExitDialog = false;
  closeBtn.focus({ preventScroll:true });
}
exitStayBtn?.addEventListener('click', () => answerExitDialog(false));
exitLeaveBtn?.addEventListener('click', () => answerExitDialog(true));
exitDialog?.addEventListener('cancel', e => { e.preventDefault(); answerExitDialog(false); });

startBtn.addEventListener('click', startPractice);
closeBtn.addEventListener('click', requestExit);
pauseBtn.addEventListener('click', pausePractice);
extendBtn?.addEventListener('click',extendCurrentMinute);

if (feedbackBtn) {
  feedbackBtn.addEventListener('click', () => {
    show(feedback);
    announce(i18nText('feedback.form.announce', 'Форма обратной связи.'));
    focusQuietly(feedbackTitle);
  });
}

function backToDone() {
  updateDoneMeta();
  show(done);
  focusQuietly(doneTitle);
}

function backFromFeedback() {
  const target = feedback?.dataset?.pwReturn || 'done';
  if (feedback?.dataset) delete feedback.dataset.pwReturn;
  if (target === 'home') {
    show(home);
    focusQuietly($('pwModeChoose'));
    return;
  }
  backToDone();
}

if (feedbackBackBtn) feedbackBackBtn.addEventListener('click', backFromFeedback);
if (feedbackDoneBtn) feedbackDoneBtn.addEventListener('click', backFromFeedback);
document.addEventListener('pw:feedback-complete', backFromFeedback);
document.addEventListener('pw:completion-changed', updateDoneMeta);

if (researchOptin && emailWrap) {
  researchOptin.addEventListener('change', () => {
    emailWrap.hidden = !researchOptin.checked;
  });
}

soundToggle.addEventListener('click', () => {
  ensureAudio();
  ticking = !ticking;
  store.set('pw-ticking', ticking ? 'on' : 'off');
  updateSound();
  if (ticking && !paused && phase === 'practice') playTick(false);
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (exitDialog?.open) return;
  if (practice.classList.contains('active')) { event.preventDefault(); requestExit(); }
  else if (feedback && feedback.classList.contains('active')) backFromFeedback();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    markFinalHidden();
    if (interval && !paused) {
      remainingMs = left();
      lastObservedRemainingMs = remainingMs;
      paused = true;
      timerShell.classList.add('paused');
      pauseBtn.textContent = i18nText('practice.resume', 'Продолжить');
      releaseWakeLock();
      announce(i18nText('practice.sr.paused.auto', 'Тренировка поставлена на паузу.'));
    }
    return;
  }
  maybeResetCompletedView();
});

window.addEventListener('pagehide', markFinalHidden);
window.addEventListener('pageshow', maybeResetCompletedView);

document.addEventListener('pw:locale-changed', () => {
  updateSound();
  updateInstallUI();
  if (!practice.classList.contains('active')) updateDoneMeta();
});

window.PW_I18N?.ready?.then(() => {
  updateSound();
  updateInstallUI();
  updateDoneMeta();
}).catch(() => {});

updateSound();
updateInstallUI();
