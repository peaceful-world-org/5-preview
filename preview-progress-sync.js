/* 5-preview — optional email backup for practice progress. Preview only. */
'use strict';

(() => {
  if (location.hostname !== 'preview-5.peaceful-world.org') return;
  if (window.__PW_PROGRESS_SYNC_PREVIEW__) return;
  window.__PW_PROGRESS_SYNC_PREVIEW__ = true;

  const SUPABASE_URL = 'https://iugzwpsjtciyetlomkjo.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__HgsczIUlztttrf8O7m4Qg__ppii5Uc';
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  const GUIDED_KEY = 'pw-completed-practices';
  const FREE_PRACTICES_KEY = 'pw-free-practice-sessions-v1';
  const FREE_SECONDS_KEY = 'pw-free-practice-seconds-v1';
  const SYNC_STATE_KEY = 'pw-progress-sync-state-v1';

  const done = document.getElementById('done');
  const feedbackBtn = document.getElementById('feedbackBtn');
  if (!done || !feedbackBtn) return;

  const STRINGS = {
    ru: {
      saveTitle:'Сохранить прогресс',
      saveBody:'Необязательно. Сохрани время и практики, чтобы восстановить их после переустановки или смены устройства.',
      saveButton:'Сохранить прогресс',
      savedTitle:'Прогресс сохранён',
      savedBody:'Он будет доступен после входа с тем же email на другом устройстве.',
      open:'Открыть сохранение прогресса',
      close:'Закрыть',
      dialogTitle:'Сохранить прогресс',
      dialogBody:'Без пароля. Мы отправим одноразовый код на email.',
      emailLabel:'Email',
      emailPlaceholder:'name@example.com',
      sendCode:'Отправить код',
      codeTitle:'Проверь почту',
      codeBody:'Введи 6-значный код из письма.',
      codeLabel:'Код',
      verify:'Подтвердить и сохранить',
      resend:'Отправить код ещё раз',
      sending:'Отправляем…',
      verifying:'Проверяем…',
      syncing:'Сохраняем прогресс…',
      success:'Готово. Прогресс сохранён.',
      sendError:'Не удалось отправить код. Попробуй ещё раз.',
      verifyError:'Код не подошёл или истёк. Проверь его и попробуй ещё раз.',
      offline:'Для сохранения прогресса нужен интернет.',
      privacy:'Email используется только для входа и восстановления прогресса.',
      localNote:'Без входа прогресс продолжит храниться только на этом устройстве.'
    },
    en: {
      saveTitle:'Save progress',
      saveBody:'Optional. Save your time and practices so you can restore them after reinstalling or changing devices.',
      saveButton:'Save progress',
      savedTitle:'Progress saved',
      savedBody:'It will be available after signing in with the same email on another device.',
      open:'Open progress backup',
      close:'Close',
      dialogTitle:'Save progress',
      dialogBody:'No password. We will email you a one-time code.',
      emailLabel:'Email',
      emailPlaceholder:'name@example.com',
      sendCode:'Send code',
      codeTitle:'Check your email',
      codeBody:'Enter the 6-digit code from the email.',
      codeLabel:'Code',
      verify:'Verify and save',
      resend:'Send code again',
      sending:'Sending…',
      verifying:'Checking…',
      syncing:'Saving progress…',
      success:'Done. Your progress is saved.',
      sendError:'We could not send the code. Please try again.',
      verifyError:'That code is invalid or expired. Check it and try again.',
      offline:'An internet connection is required to save progress.',
      privacy:'Your email is used only for sign-in and progress recovery.',
      localNote:'Without sign-in, progress continues to be stored only on this device.'
    }
  };

  function localeCode() {
    return String(document.documentElement.lang || window.PW_I18N?.locale || 'en').toLowerCase().split('-')[0];
  }
  function s() { return STRINGS[localeCode()] || STRINGS.en; }
  function safeGet(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_) { return fallback; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, String(value)); return true; }
    catch (_) { return false; }
  }
  function safeInt(value) {
    const n = Number.parseInt(String(value || '0'), 10);
    return Number.isSafeInteger(n) && n >= 0 ? n : 0;
  }
  function localProgress() {
    const guided = safeInt(safeGet(GUIDED_KEY, '0'));
    return {
      guided_practices:guided,
      free_practices:safeInt(safeGet(FREE_PRACTICES_KEY, '0')),
      guided_seconds:guided * 300,
      free_seconds:safeInt(safeGet(FREE_SECONDS_KEY, '0'))
    };
  }
  function writeLocalProgress(progress) {
    safeSet(GUIDED_KEY, safeInt(progress.guided_practices));
    safeSet(FREE_PRACTICES_KEY, safeInt(progress.free_practices));
    safeSet(FREE_SECONDS_KEY, safeInt(progress.free_seconds));
    document.dispatchEvent(new CustomEvent('pw:progress-restored', { detail:{ ...progress } }));
  }
  let client = null;
  let session = null;
  let pendingEmail = '';
  let loadingClient = null;
  let syncPromise = null;

  function loadSupabase() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    if (loadingClient) return loadingClient;
    loadingClient = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SUPABASE_JS;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.addEventListener('load', () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error('Supabase unavailable')), { once:true });
      script.addEventListener('error', () => reject(new Error('Supabase failed to load')), { once:true });
      document.head.appendChild(script);
    });
    return loadingClient;
  }

  async function ensureClient() {
    if (client) return client;
    const lib = await loadSupabase();
    client = lib.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:false,
        storageKey:'pw-progress-auth-v1'
      }
    });
    const current = await client.auth.getSession();
    session = current.data?.session || null;
    client.auth.onAuthStateChange((_event, nextSession) => {
      session = nextSession || null;
      renderCard();
      if (session?.user?.id) void syncProgress();
    });
    return client;
  }

  async function syncProgress() {
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      const supabaseClient = await ensureClient();
      const sessionResult = await supabaseClient.auth.getSession();
      session = sessionResult.data?.session || null;
      if (!session?.user?.id) return null;

      const local = localProgress();
      const merged = await supabaseClient.rpc('merge_practice_progress', {
        p_guided_practices:local.guided_practices,
        p_free_practices:local.free_practices,
        p_guided_seconds:local.guided_seconds,
        p_free_seconds:local.free_seconds
      });
      if (merged.error) throw merged.error;

      const cloud = normalizeRow(merged.data);
      writeLocalProgress(cloud);
      renderCard();
      return cloud;
    })().finally(() => { syncPromise = null; });
    return syncPromise;
  }

  const style = document.createElement('style');
  style.id = 'pw-progress-sync-style';
  style.textContent = [
    '.pw-progress-save{width:min(100%,390px);margin:18px auto 2px;padding:15px 14px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.42);text-align:center;color:var(--text)}',
    '.pw-progress-save-title{margin:0;font-size:.91rem;font-weight:700;color:var(--ink)}',
    '.pw-progress-save-body{margin:6px auto 0;max-width:340px;font-size:.76rem;line-height:1.48;color:var(--muted)}',
    '.pw-progress-save-btn{min-height:40px;margin-top:10px;padding:0 16px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);font-size:.79rem;font-weight:650;cursor:pointer}',
    '.pw-progress-save.is-saved{background:transparent}.pw-progress-save.is-saved .pw-progress-save-title{color:var(--accent-text)}.pw-progress-save.is-saved .pw-progress-save-btn{display:none}',
    '.pw-progress-modal{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:18px;background:rgba(17,20,18,.48);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
    '.pw-progress-modal[hidden]{display:none!important}',
    '.pw-progress-sheet{width:min(100%,430px);max-height:min(680px,calc(100dvh - 36px));overflow:auto;padding:22px;border:1px solid var(--line);border-radius:24px;background:var(--bg);color:var(--text);box-shadow:0 24px 70px rgba(0,0,0,.18);text-align:left}',
    '.pw-progress-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.pw-progress-sheet-title{margin:0;font-size:1.35rem;line-height:1.2;color:var(--ink)}',
    '.pw-progress-close{width:40px;height:40px;border:1px solid var(--line);border-radius:50%;background:var(--surface);color:var(--muted);cursor:pointer;font-size:1.2rem}',
    '.pw-progress-sheet-copy{margin:12px 0 0;color:var(--muted);font-size:.88rem;line-height:1.55}',
    '.pw-progress-field-label{display:block;margin:20px 0 7px;font-size:.78rem;font-weight:650;color:var(--text)}',
    '.pw-progress-input{width:100%;min-height:52px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);padding:0 14px;font-size:1rem}',
    '.pw-progress-code{letter-spacing:.18em;text-align:center;font-size:1.25rem;font-variant-numeric:tabular-nums}',
    '.pw-progress-primary{width:100%;min-height:52px;margin-top:14px;border:0;border-radius:999px;background:var(--ink);color:var(--bg);font-weight:700;font-size:.95rem;cursor:pointer}',
    '.pw-progress-secondary{width:100%;min-height:40px;margin-top:7px;border:0;background:transparent;color:var(--muted);font-size:.82rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}',
    '.pw-progress-note{margin:14px 2px 0;color:var(--muted);font-size:.73rem;line-height:1.5;text-align:center}.pw-progress-status{min-height:20px;margin:11px 2px 0;color:var(--muted);font-size:.78rem;line-height:1.4;text-align:center}.pw-progress-status.error{color:#9A4F49}',
    'html[data-pw-theme="dark"] .pw-progress-save{background:rgba(29,33,30,.62)}html[data-pw-theme="dark"] .pw-progress-sheet{background:#171A18}html[data-pw-theme="dark"] .pw-progress-primary{background:#E8EAE5;color:#171A18}'
  ].join('\n');
  document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'pw-progress-save';
  card.innerHTML = '<p class="pw-progress-save-title"></p><p class="pw-progress-save-body"></p><button type="button" class="pw-progress-save-btn"></button>';
  feedbackBtn.insertAdjacentElement('beforebegin', card);

  const modal = document.createElement('div');
  modal.className = 'pw-progress-modal';
  modal.hidden = true;
  modal.innerHTML = '<section class="pw-progress-sheet" role="dialog" aria-modal="true" aria-labelledby="pwProgressTitle"><div class="pw-progress-sheet-head"><h2 id="pwProgressTitle" class="pw-progress-sheet-title"></h2><button type="button" class="pw-progress-close" aria-label="Close">×</button></div><p class="pw-progress-sheet-copy"></p><div class="pw-progress-email-step"><label class="pw-progress-field-label" for="pwProgressEmail"></label><input id="pwProgressEmail" class="pw-progress-input" type="email" inputmode="email" autocomplete="email" maxlength="320" /><button type="button" class="pw-progress-primary pw-progress-send"></button></div><div class="pw-progress-code-step" hidden><label class="pw-progress-field-label" for="pwProgressCode"></label><input id="pwProgressCode" class="pw-progress-input pw-progress-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" /><button type="button" class="pw-progress-primary pw-progress-verify"></button><button type="button" class="pw-progress-secondary pw-progress-resend"></button></div><p class="pw-progress-status" role="status" aria-live="polite"></p><p class="pw-progress-note"></p></section>';
  document.body.appendChild(modal);

  const saveBtn = card.querySelector('.pw-progress-save-btn');
  const closeBtn = modal.querySelector('.pw-progress-close');
  const title = modal.querySelector('.pw-progress-sheet-title');
  const copy = modal.querySelector('.pw-progress-sheet-copy');
  const emailStep = modal.querySelector('.pw-progress-email-step');
  const codeStep = modal.querySelector('.pw-progress-code-step');
  const emailLabel = modal.querySelector('label[for="pwProgressEmail"]');
  const emailInput = modal.querySelector('#pwProgressEmail');
  const codeLabel = modal.querySelector('label[for="pwProgressCode"]');
  const codeInput = modal.querySelector('#pwProgressCode');
  const sendBtn = modal.querySelector('.pw-progress-send');
  const verifyBtn = modal.querySelector('.pw-progress-verify');
  const resendBtn = modal.querySelector('.pw-progress-resend');
  const status = modal.querySelector('.pw-progress-status');
  const note = modal.querySelector('.pw-progress-note');

  function setStatus(message = '', isError = false) {
    status.textContent = message;
    status.classList.toggle('error', Boolean(isError));
  }
  function renderCard() {
    const copyText = s();
    const signedIn = Boolean(session?.user?.id);
    card.classList.toggle('is-saved', signedIn);
    card.querySelector('.pw-progress-save-title').textContent = signedIn ? copyText.savedTitle : copyText.saveTitle;
    card.querySelector('.pw-progress-save-body').textContent = signedIn ? copyText.savedBody : copyText.saveBody;
    saveBtn.textContent = copyText.saveButton;
    saveBtn.setAttribute('aria-label', copyText.open);
  }
  function renderModal() {
    const copyText = s();
    title.textContent = codeStep.hidden ? copyText.dialogTitle : copyText.codeTitle;
    copy.textContent = codeStep.hidden ? copyText.dialogBody : copyText.codeBody;
    emailLabel.textContent = copyText.emailLabel;
    emailInput.placeholder = copyText.emailPlaceholder;
    codeLabel.textContent = copyText.codeLabel;
    sendBtn.textContent = copyText.sendCode;
    verifyBtn.textContent = copyText.verify;
    resendBtn.textContent = copyText.resend;
    note.textContent = copyText.privacy + ' ' + copyText.localNote;
    closeBtn.setAttribute('aria-label', copyText.close);
  }
  function openModal() {
    emailStep.hidden = false;
    codeStep.hidden = true;
    setStatus();
    renderModal();
    modal.hidden = false;
    requestAnimationFrame(() => emailInput.focus({ preventScroll:true }));
  }
  function closeModal() { modal.hidden = true; setStatus(); }

  async function sendCode() {
    if (!navigator.onLine) { setStatus(s().offline, true); return; }
    const email = emailInput.value.trim().toLowerCase();
    if (!email || !emailInput.checkValidity()) { emailInput.reportValidity(); return; }
    sendBtn.disabled = true;
    sendBtn.textContent = s().sending;
    setStatus();
    try {
      const supabaseClient = await ensureClient();
      const result = await supabaseClient.auth.signInWithOtp({ email, options:{ shouldCreateUser:true } });
      if (result.error) throw result.error;
      pendingEmail = email;
      emailStep.hidden = true;
      codeStep.hidden = false;
      codeInput.value = '';
      renderModal();
      requestAnimationFrame(() => codeInput.focus({ preventScroll:true }));
    } catch (error) {
      console.warn('[5-preview] progress OTP send failed', error);
      setStatus(s().sendError, true);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = s().sendCode;
    }
  }

  async function verifyCode() {
    const token = codeInput.value.replace(/\D/g, '').slice(0, 6);
    if (token.length !== 6 || !pendingEmail) { setStatus(s().verifyError, true); return; }
    verifyBtn.disabled = true;
    verifyBtn.textContent = s().verifying;
    setStatus();
    try {
      const supabaseClient = await ensureClient();
      const result = await supabaseClient.auth.verifyOtp({ email:pendingEmail, token, type:'email' });
      if (result.error || !result.data?.session) throw result.error || new Error('No session returned');
      session = result.data.session;
      verifyBtn.textContent = s().syncing;
      await syncProgress();
      setStatus(s().success);
      renderCard();
      setTimeout(closeModal, 750);
    } catch (error) {
      console.warn('[5-preview] progress OTP verify failed', error);
      setStatus(s().verifyError, true);
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = s().verify;
    }
  }

  saveBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  sendBtn.addEventListener('click', sendCode);
  verifyBtn.addEventListener('click', verifyCode);
  resendBtn.addEventListener('click', () => {
    emailStep.hidden = false;
    codeStep.hidden = true;
    emailInput.value = pendingEmail || emailInput.value;
    renderModal();
    requestAnimationFrame(() => emailInput.focus({ preventScroll:true }));
  });
  codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6); });

  document.addEventListener('pw:locale-changed', () => { renderCard(); renderModal(); });
  document.addEventListener('pw:locale-ready', () => { renderCard(); renderModal(); });

  new MutationObserver(() => {
    if (!done.classList.contains('active')) return;
    if (session?.user?.id) void syncProgress().catch(error => console.warn('[5-preview] progress sync failed', error));
  }).observe(done, { attributes:true, attributeFilter:['class'] });

  window.PW_PROGRESS_SYNC = Object.freeze({
    syncNow:() => syncProgress(),
    get signedIn() { return Boolean(session?.user?.id); }
  });

  window.PW_I18N?.ready?.then(async () => {
    renderCard();
    renderModal();
    try {
      await ensureClient();
      renderCard();
      if (session?.user?.id) await syncProgress();
    } catch (error) {
      console.warn('[5-preview] progress auth init skipped', error);
    }
  }).catch(() => { renderCard(); renderModal(); });
})();