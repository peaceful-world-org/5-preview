/* 5-preview — cumulative practice time + free timer MVP. Preview environment only. */
'use strict';

(() => {
  if (location.hostname !== 'preview-5.peaceful-world.org') return;
  if (window.__PW_FREE_TIMER_PREVIEW__) return;
  window.__PW_FREE_TIMER_PREVIEW__ = true;

  const home = document.getElementById('home');
  const app = document.querySelector('.app');
  const startBtn = document.getElementById('startBtn');
  if (!home || !app || !startBtn) return;

  const COMPLETED_KEY = 'pw-completed-practices';
  const FREE_SECONDS_KEY = 'pw-free-practice-seconds-v1';
  const SESSION_KEY = 'pw-free-practice-session-v1';
  const TICKING_KEY = 'pw-ticking';

  const STRINGS = {
    ru: {
      totalLabel: 'В практике',
      practiceOne: 'тренировка',
      practiceFew: 'тренировки',
      practiceMany: 'тренировок',
      entry: 'Свободная практика',
      screenLabel: 'СВОБОДНАЯ ПРАКТИКА',
      title: 'Таймер',
      idea: 'Каждая секунда практики имеет значение.',
      note: 'Без цели и без серии. Просто время, которое ты действительно провёл в практике.',
      start: 'Начать',
      pause: 'Пауза',
      resume: 'Продолжить',
      finish: 'Завершить',
      back: 'Назад',
      tickingOn: 'Тиканье включено',
      tickingOff: 'Тиканье выключено',
      currentLabel: 'ТЕКУЩАЯ ПРАКТИКА'
    },
    en: {
      totalLabel: 'In practice',
      practiceOne: 'practice',
      practiceFew: 'practices',
      practiceMany: 'practices',
      entry: 'Free practice',
      screenLabel: 'FREE PRACTICE',
      title: 'Timer',
      idea: 'Every second of practice counts.',
      note: 'No goal and no streak. Just the time you actually spent practising.',
      start: 'Start',
      pause: 'Pause',
      resume: 'Continue',
      finish: 'Finish',
      back: 'Back',
      tickingOn: 'Ticking sound on',
      tickingOff: 'Ticking sound off',
      currentLabel: 'CURRENT PRACTICE'
    }
  };

  function localeCode() {
    return String(window.PW_I18N?.locale || document.documentElement.lang || 'en')
      .toLowerCase().split('-')[0];
  }

  function s() {
    return STRINGS[localeCode()] || STRINGS.en;
  }

  function safeGet(key, fallback = '') {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function safeRemove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  function safeInt(value) {
    const n = Number.parseInt(String(value || '0'), 10);
    return Number.isSafeInteger(n) && n >= 0 ? n : 0;
  }

  function completedPractices() {
    return safeInt(safeGet(COMPLETED_KEY, '0'));
  }

  function freeSeconds() {
    return safeInt(safeGet(FREE_SECONDS_KEY, '0'));
  }

  function setFreeSeconds(value) {
    safeSet(FREE_SECONDS_KEY, Math.max(0, Math.floor(value)));
  }

  function totalSeconds() {
    // Current guided practice is exactly five full minutes. Keep guided and free
    // time separate in storage; combine only for the user-facing odometer.
    return completedPractices() * 300 + freeSeconds();
  }

  function formatTotal(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours > 0) return hours + ' ч ' + String(minutes).padStart(2, '0') + ' мин';
    if (minutes > 0) return minutes + ' мин';
    return total + ' сек';
  }

  function formatStopwatch(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) {
      return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }
    return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function practiceWord(n) {
    const copy = s();
    if (localeCode() !== 'ru') return n === 1 ? copy.practiceOne : copy.practiceMany;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return copy.practiceOne;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return copy.practiceFew;
    return copy.practiceMany;
  }

  const style = document.createElement('style');
  style.id = 'pw-free-timer-preview-style';
  style.textContent = [
    '.pw-time-odometer{margin:18px auto 0;display:flex;align-items:baseline;justify-content:center;gap:7px;flex-wrap:wrap;color:var(--muted);font-variant-numeric:tabular-nums}',
    '.pw-time-odometer-label{font-size:.76rem;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-text)}',
    '.pw-time-odometer-value{font-size:.96rem;font-weight:720;color:var(--text)}',
    '.pw-time-odometer-count{font-size:.8rem;color:var(--muted)}',
    '.pw-free-entry{width:min(100%,340px);min-height:48px;margin-top:10px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--text);font-size:.92rem;font-weight:620;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;transition:background .2s ease,transform .15s ease,border-color .2s ease}',
    '.pw-free-entry:hover{background:rgba(255,255,255,.48);border-color:rgba(107,113,109,.28)}',
    '.pw-free-entry:active{transform:scale(.985)}',
    '.pw-free-entry:focus-visible{outline:2px solid #67766A;outline-offset:3px}',
    '.pw-free-timer-screen{justify-content:space-between;padding-block:2px}',
    '.pw-free-timer-topbar{width:100%;display:grid;grid-template-columns:44px 1fr 44px;align-items:center}',
    '.pw-free-timer-meta{display:grid;gap:3px;text-align:center}',
    '.pw-free-timer-meta span{font-size:.82rem;font-weight:700;color:var(--text);letter-spacing:.02em}',
    '.pw-free-timer-meta small{font-size:.6rem;letter-spacing:.14em;color:var(--muted);padding-left:.14em}',
    '.pw-free-timer-main{width:100%;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 0 16px}',
    '.pw-free-clock{position:relative;width:184px;height:184px;border:1px solid var(--line);border-radius:50%;background:rgba(255,255,255,.72);box-shadow:0 18px 48px rgba(33,41,36,.04);display:grid;place-items:center}',
    '.pw-free-clock::before{content:"";position:absolute;inset:13px;border:1px solid rgba(123,141,123,.12);border-radius:50%}',
    '.pw-free-clock-dot{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--accent);z-index:3}',
    '.pw-free-clock-hand{position:absolute;left:50%;top:50%;width:1.8px;height:67px;border-radius:999px;background:var(--accent-text);transform-origin:50% 100%;transform:translate(-50%,-100%) rotate(0deg);z-index:2}',
    '.pw-free-clock-hand::after{content:"";position:absolute;left:50%;bottom:-22px;width:1.8px;height:22px;background:rgba(103,118,103,.46);transform:translateX(-50%)}',
    '.pw-free-time{margin-top:28px;font-size:clamp(3.1rem,14vw,4.6rem);font-weight:700;letter-spacing:-.045em;font-variant-numeric:tabular-nums;color:var(--ink);line-height:1}',
    '.pw-free-idea{margin:21px 0 0;font-size:1.05rem;line-height:1.45;font-weight:620;color:var(--text)}',
    '.pw-free-note{max-width:360px;margin:9px auto 0;font-size:.84rem;line-height:1.52;color:var(--muted)}',
    '.pw-free-timer-actions{width:100%;display:flex;flex-direction:column;align-items:center;padding-bottom:4px}',
    '.pw-free-timer-actions .primary{margin-top:0}',
    '.pw-free-finish{margin-top:9px;border:0;background:transparent;color:var(--muted);font-size:.86rem;text-decoration:underline;text-decoration-color:rgba(107,113,109,.34);text-underline-offset:4px;cursor:pointer;min-height:36px;padding:4px 12px}',
    '.pw-free-finish[hidden]{display:none!important}',
    '.pw-free-timer-screen .sound-on{background:var(--accent-soft);color:var(--accent)}',
    'html[data-pw-theme="dark"] .pw-free-entry{background:transparent;border-color:var(--line)}',
    'html[data-pw-theme="dark"] .pw-free-entry:hover{background:#202521}',
    'html[data-pw-theme="dark"] .pw-free-clock{background:#1D211E;border-color:var(--line)}',
    '@media(max-height:720px){.pw-time-odometer{margin-top:12px}.pw-free-entry{min-height:44px}.pw-free-clock{width:148px;height:148px}.pw-free-clock-hand{height:54px}.pw-free-time{margin-top:19px}.pw-free-idea{margin-top:15px}.pw-free-note{margin-top:6px}}',
    '@media(orientation:landscape) and (max-height:520px){.pw-free-timer-main{padding:4px 0}.pw-free-clock{width:94px;height:94px}.pw-free-clock-hand{height:33px}.pw-free-clock-hand::after{bottom:-11px;height:11px}.pw-free-time{margin-top:7px;font-size:2rem}.pw-free-idea{margin-top:6px;font-size:.88rem}.pw-free-note{display:none}.pw-free-entry{min-height:38px}.pw-time-odometer{margin-top:5px}}'
  ].join('\n');
  document.head.appendChild(style);

  const odometer = document.createElement('div');
  odometer.className = 'pw-time-odometer';
  odometer.setAttribute('aria-live', 'polite');
  odometer.innerHTML = '<span class="pw-time-odometer-label"></span><strong class="pw-time-odometer-value"></strong><span class="pw-time-odometer-count"></span>';

  const entry = document.createElement('button');
  entry.type = 'button';
  entry.className = 'pw-free-entry';
  entry.innerHTML = '<span class="pw-free-entry-label"></span><span aria-hidden="true">→</span>';

  const heroCopy = home.querySelector('.hero-copy');
  if (heroCopy) heroCopy.insertAdjacentElement('afterend', odometer);
  else startBtn.insertAdjacentElement('beforebegin', odometer);
  startBtn.insertAdjacentElement('afterend', entry);

  const screen = document.createElement('section');
  screen.id = 'pwFreeTimerScreen';
  screen.className = 'screen pw-free-timer-screen';
  screen.innerHTML = [
    '<div class="pw-free-timer-topbar">',
      '<button id="pwFreeBack" type="button" class="round-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></button>',
      '<div class="pw-free-timer-meta"><span class="pw-free-screen-label"></span><small class="pw-free-current-label"></small></div>',
      '<button id="pwFreeSound" type="button" class="round-btn sound-on" aria-pressed="true">',
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5v5l3.2 1.8"></path><path class="sound-slash" d="M5.5 18.5l13-13"></path></svg>',
      '</button>',
    '</div>',
    '<div class="pw-free-timer-main">',
      '<div class="pw-free-clock" aria-hidden="true"><span class="pw-free-clock-hand"></span><span class="pw-free-clock-dot"></span></div>',
      '<div id="pwFreeTime" class="pw-free-time">00:00</div>',
      '<p class="pw-free-idea"></p>',
      '<p class="pw-free-note"></p>',
    '</div>',
    '<div class="pw-free-timer-actions">',
      '<button id="pwFreePrimary" type="button" class="primary"></button>',
      '<button id="pwFreeFinish" type="button" class="pw-free-finish" hidden></button>',
    '</div>'
  ].join('');
  app.appendChild(screen);

  const backBtn = screen.querySelector('#pwFreeBack');
  const soundBtn = screen.querySelector('#pwFreeSound');
  const primaryBtn = screen.querySelector('#pwFreePrimary');
  const finishBtn = screen.querySelector('#pwFreeFinish');
  const timeEl = screen.querySelector('#pwFreeTime');
  const hand = screen.querySelector('.pw-free-clock-hand');

  let running = false;
  let elapsedMs = 0;
  let runStartedAt = 0;
  let creditedSeconds = 0;
  let frame = 0;
  let lastSoundSecond = 0;
  let wakeLock = null;

  function loadSession() {
    try {
      const parsed = JSON.parse(safeGet(SESSION_KEY, '') || '{}');
      const ms = Number(parsed.elapsedMs);
      const credited = Number(parsed.creditedSeconds);
      elapsedMs = Number.isFinite(ms) && ms >= 0 ? ms : 0;
      creditedSeconds = Number.isSafeInteger(credited) && credited >= 0 ? credited : Math.floor(elapsedMs / 1000);
      lastSoundSecond = Math.floor(elapsedMs / 1000);
    } catch (_) {
      elapsedMs = 0;
      creditedSeconds = 0;
      lastSoundSecond = 0;
    }
  }

  function currentMs() {
    return elapsedMs + (running ? Math.max(0, performance.now() - runStartedAt) : 0);
  }

  function saveSession(ms = currentMs()) {
    safeSet(SESSION_KEY, JSON.stringify({
      elapsedMs: Math.max(0, Math.floor(ms)),
      creditedSeconds: Math.max(0, creditedSeconds)
    }));
  }

  function creditElapsedSeconds(ms) {
    const whole = Math.floor(Math.max(0, ms) / 1000);
    if (whole <= creditedSeconds) return;
    const delta = whole - creditedSeconds;
    setFreeSeconds(freeSeconds() + delta);
    creditedSeconds = whole;
    saveSession(ms);
    renderOdometer();
  }

  async function acquireWakeLock() {
    try {
      if (!navigator.wakeLock?.request) return;
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (_) {}
  }

  function releaseWakeLock() {
    try { wakeLock?.release?.(); } catch (_) {}
    wakeLock = null;
  }

  function isTicking() {
    return safeGet(TICKING_KEY, 'on') !== 'off';
  }

  function setTicking(next) {
    safeSet(TICKING_KEY, next ? 'on' : 'off');
    renderSound();
  }

  function renderSound() {
    const on = isTicking();
    const copy = s();
    soundBtn.classList.toggle('sound-on', on);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? copy.tickingOn : copy.tickingOff);
  }

  function maybeTick(second) {
    if (!running || !isTicking() || second <= lastSoundSecond || second <= 0) return;
    lastSoundSecond = second;
    const sound = second % 2 === 0 ? window.PW_SOUND_TEST?.tock : window.PW_SOUND_TEST?.tick;
    try { sound?.(); } catch (_) {}
  }

  function renderTimer(ms = currentMs()) {
    const secondsFloat = Math.max(0, ms) / 1000;
    const seconds = Math.floor(secondsFloat);
    timeEl.textContent = formatStopwatch(seconds);
    hand.style.transform = 'translate(-50%,-100%) rotate(' + ((secondsFloat % 60) * 6).toFixed(2) + 'deg)';
    creditElapsedSeconds(ms);
    maybeTick(seconds);
    finishBtn.hidden = seconds <= 0;
  }

  function loop() {
    if (!running) return;
    renderTimer();
    frame = requestAnimationFrame(loop);
  }

  function renderOdometer() {
    const copy = s();
    const count = completedPractices();
    odometer.querySelector('.pw-time-odometer-label').textContent = copy.totalLabel;
    odometer.querySelector('.pw-time-odometer-value').textContent = formatTotal(totalSeconds());
    odometer.querySelector('.pw-time-odometer-count').textContent = '· ' + count + ' ' + practiceWord(count);
  }

  function renderCopy() {
    const copy = s();
    entry.querySelector('.pw-free-entry-label').textContent = copy.entry;
    screen.querySelector('.pw-free-screen-label').textContent = copy.screenLabel;
    screen.querySelector('.pw-free-current-label').textContent = copy.currentLabel;
    screen.querySelector('.pw-free-idea').textContent = copy.idea;
    screen.querySelector('.pw-free-note').textContent = copy.note;
    finishBtn.textContent = copy.finish;
    backBtn.setAttribute('aria-label', copy.back);
    primaryBtn.textContent = running ? copy.pause : (currentMs() > 0 ? copy.resume : copy.start);
    renderSound();
    renderOdometer();
  }

  function showFreeTimer() {
    document.querySelectorAll('.screen.active').forEach(node => node.classList.remove('active'));
    screen.classList.add('active');
    renderCopy();
    renderTimer();
  }

  function showHome() {
    if (running) pauseTimer();
    screen.classList.remove('active');
    home.classList.add('active');
    renderOdometer();
  }

  function startTimer() {
    if (running) return;
    running = true;
    runStartedAt = performance.now();
    lastSoundSecond = Math.floor(elapsedMs / 1000);
    primaryBtn.textContent = s().pause;
    void acquireWakeLock();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(loop);
  }

  function pauseTimer() {
    if (!running) return;
    elapsedMs = currentMs();
    running = false;
    cancelAnimationFrame(frame);
    creditElapsedSeconds(elapsedMs);
    saveSession(elapsedMs);
    releaseWakeLock();
    renderTimer(elapsedMs);
    primaryBtn.textContent = elapsedMs > 0 ? s().resume : s().start;
  }

  function finishTimer() {
    if (running) pauseTimer();
    creditElapsedSeconds(elapsedMs);
    elapsedMs = 0;
    creditedSeconds = 0;
    lastSoundSecond = 0;
    safeRemove(SESSION_KEY);
    renderOdometer();
    showHome();
  }

  entry.addEventListener('click', showFreeTimer);
  backBtn.addEventListener('click', showHome);
  primaryBtn.addEventListener('click', () => running ? pauseTimer() : startTimer());
  finishBtn.addEventListener('click', finishTimer);
  soundBtn.addEventListener('click', () => setTicking(!isTicking()));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) pauseTimer();
  });
  window.addEventListener('pagehide', () => {
    if (running) pauseTimer();
    else saveSession();
  });
  document.addEventListener('pw:locale-changed', renderCopy);

  // The existing guided-practice counter changes only after a completed practice.
  // Re-render whenever the user comes back to Home or Done.
  [home, document.getElementById('done')].filter(Boolean).forEach(node => {
    new MutationObserver(renderOdometer).observe(node, { attributes:true, attributeFilter:['class'] });
  });

  loadSession();
  renderCopy();
  renderTimer(elapsedMs);
})();