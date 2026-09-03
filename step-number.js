/* 5 by Peaceful World — small UI enhancements */
'use strict';

window.PW_BUILD_VERSION = 'v0.18.51-alpha';

const i18nText = (key, fallback, vars) =>
  window.PW_I18N?.text?.(key, fallback, vars) ?? fallback;

(() => {
  const badge = document.querySelector('.build-version');
  if (!badge) return;
  badge.textContent = 'ALPHA · v0.18.51';
  const sync = () => badge.setAttribute('aria-label', i18nText('build.aria', 'Альфа-версия 0.18.51'));
  sync();
  document.addEventListener('pw:locale-changed', sync);
})();

(() => {
  const home = document.getElementById('home');
  const host = home?.querySelector('.home-stack');
  if (!home || !host || !window.PW_I18N) return;

  const switcher = document.createElement('nav');
  switcher.id = 'localeSwitcher';
  switcher.className = 'locale-switcher';
  switcher.hidden = true;

  const style = document.createElement('style');
  style.textContent = `
    .locale-switcher{margin-top:16px;display:flex;align-items:center;justify-content:center;gap:3px;color:var(--muted)}
    .locale-switcher[hidden]{display:none!important}
    .locale-switcher button{border:0;background:transparent;color:var(--muted);padding:4px 6px;font:inherit;font-size:.76rem;line-height:1.2;cursor:pointer;text-decoration:none;transition:color .18s ease,opacity .18s ease}
    .locale-switcher button:hover{color:var(--text)}
    .locale-switcher button[aria-pressed="true"]{color:var(--text);font-weight:650}
    .locale-switcher button:disabled{cursor:default;opacity:.55}
    .locale-switcher .locale-separator{font-size:.72rem;opacity:.55;user-select:none}
    .locale-switcher button:focus-visible{outline:2px solid #67766A;outline-offset:2px;border-radius:7px}
  `;
  document.head.appendChild(style);

  const privacyRow = host.querySelector('.home-privacy-row');
  if (privacyRow) privacyRow.before(switcher);
  else host.appendChild(switcher);

  function availableLocales() {
    const registry = window.PW_I18N.registry;
    const preview = window.PW_I18N.isPreview;
    return Object.entries(registry?.locales || {})
      .filter(([, config]) => Boolean(config?.released || preview));
  }

  function render() {
    const available = availableLocales();
    switcher.hidden = available.length < 2;
    if (switcher.hidden) {
      switcher.replaceChildren();
      return;
    }

    switcher.setAttribute('aria-label', i18nText('locale.switcher.aria', 'Выбрать язык'));
    const fragment = document.createDocumentFragment();

    available.forEach(([code, config], index) => {
      if (index) {
        const separator = document.createElement('span');
        separator.className = 'locale-separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = '·';
        fragment.appendChild(separator);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.locale = code;
      button.textContent = config.label || code;
      button.setAttribute('aria-pressed', String(code === window.PW_I18N.locale));
      button.addEventListener('click', async () => {
        if (code === window.PW_I18N.locale || switcher.dataset.busy === '1') return;
        switcher.dataset.busy = '1';
        switcher.querySelectorAll('button').forEach(item => { item.disabled = true; });
        try {
          await window.PW_I18N.setLocale(code, {
            source: config.released ? 'explicit' : 'preview',
            allowUnreleased: !config.released
          });
        } catch (error) {
          console.warn('[5][i18n] locale switch failed', error);
        } finally {
          delete switcher.dataset.busy;
          render();
        }
      });
      fragment.appendChild(button);
    });

    switcher.replaceChildren(fragment);
  }

  window.PW_I18N.ready.then(render).catch(() => {});
  document.addEventListener('pw:locale-changed', render);
})();

(() => {
  const practice = document.getElementById('practice');
  const stepCount = document.getElementById('stepCount');
  const stepNumber = document.getElementById('stepNumber');
  const stepTitle = document.getElementById('stepTitle');
  if (!practice || !stepCount || !stepNumber) return;

  let watchTimer = null;

  const sync = () => {
    let next = '';
    try {
      if (typeof stepIndex !== 'undefined' && Number.isInteger(stepIndex)) {
        next = String(stepIndex + 1);
      }
    } catch (_) {}
    if (!next) {
      const match = String(stepCount.textContent || '').match(/\d+/);
      next = match ? match[0] : '1';
    }
    if (stepNumber.textContent !== next) stepNumber.textContent = next;
  };

  const syncWatcher = () => {
    if (practice.classList.contains('active')) {
      sync();
      if (watchTimer === null) watchTimer = window.setInterval(sync, 250);
      return;
    }
    if (watchTimer !== null) {
      window.clearInterval(watchTimer);
      watchTimer = null;
    }
  };

  sync();
  new MutationObserver(sync).observe(stepCount, { childList:true, characterData:true, subtree:true });
  if (stepTitle) new MutationObserver(sync).observe(stepTitle, { childList:true, characterData:true, subtree:true });
  new MutationObserver(syncWatcher).observe(practice, { attributes:true, attributeFilter:['class'] });
  syncWatcher();
})();

(() => {
  const script = document.createElement('script');
  script.src = '/ios-install-guide.js?v=1';
  script.async = true;
  document.head.appendChild(script);
})();

(() => {
  const area = document.getElementById('homeInstallArea');
  const button = document.getElementById('homeInstallBtn');
  const help = document.getElementById('homeInstallHelp');
  const helpCopy = document.getElementById('homeInstallHelpCopy');
  const helpClose = document.getElementById('homeInstallHelpClose');
  if (!area || !button || !help || !helpCopy || !helpClose) return;

  function syncInstallAction() {
    if (isStandalone()) {
      area.hidden = true;
      help.hidden = true;
      return;
    }

    area.hidden = false;
    button.textContent = isIOS()
      ? i18nText('home.install.cta.ios', 'Как установить')
      : i18nText('home.install.cta', 'Установить');
  }

  button.addEventListener('click', async () => {
    if (isStandalone()) {
      area.hidden = true;
      return;
    }

    if (isIOS() && window.PW_IOS_INSTALL_GUIDE?.open) {
      help.hidden = true;
      window.PW_IOS_INSTALL_GUIDE.open(button);
      return;
    }

    if (typeof deferredInstallPrompt !== 'undefined' && deferredInstallPrompt) {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
      } catch (_) {}
      updateInstallUI();
      syncInstallAction();
      return;
    }

    if (isIOS()) {
      helpCopy.textContent = i18nText(
        'install.help.ios',
        'Нажми «Поделиться» в браузере, затем выбери «На экран Домой».'
      );
    } else if (isAndroid()) {
      helpCopy.textContent = i18nText(
        'install.help.android',
        'Открой меню браузера и выбери «Установить приложение» или «Добавить на главный экран».'
      );
    } else {
      helpCopy.textContent = i18nText(
        'install.help.other',
        'Открой меню браузера и выбери установку приложения или добавление на главный экран.'
      );
    }
    help.hidden = false;
    helpClose.focus({ preventScroll:true });
  });

  helpClose.addEventListener('click', () => {
    help.hidden = true;
    button.focus({ preventScroll:true });
  });

  window.addEventListener('beforeinstallprompt', () => window.setTimeout(syncInstallAction, 0));
  window.addEventListener('appinstalled', () => {
    area.hidden = true;
    help.hidden = true;
  });
  window.addEventListener('pageshow', syncInstallAction);
  document.addEventListener('pw:locale-changed', syncInstallAction);

  syncInstallAction();
})();

(() => {
  const area = document.getElementById('installArea');
  const button = document.getElementById('installBtn');
  const feedbackButton = document.getElementById('feedbackBtn');
  const help = document.getElementById('installHelp');
  if (!area || !button || !feedbackButton) return;

  area.classList.add('done-install-area');
  button.classList.remove('text-action');
  button.classList.add('done-action');
  feedbackButton.before(area);

  function syncCompletionInstallAction() {
    if (isStandalone()) {
      area.hidden = true;
      if (help) help.hidden = true;
      return;
    }

    const label = isIOS()
      ? i18nText('home.install.cta.ios', 'Как установить')
      : i18nText('home.install.cta', 'Установить');
    if (button.textContent !== label) button.textContent = label;
  }

  button.addEventListener('click', event => {
    if (!isIOS() || isStandalone() || !window.PW_IOS_INSTALL_GUIDE?.open) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (help) help.hidden = true;
    window.PW_IOS_INSTALL_GUIDE.open(button);
  }, { capture:true });

  new MutationObserver(syncCompletionInstallAction).observe(button, {
    childList:true,
    characterData:true,
    subtree:true
  });

  window.addEventListener('beforeinstallprompt', () => window.setTimeout(syncCompletionInstallAction, 0));
  window.addEventListener('appinstalled', () => {
    area.hidden = true;
    if (help) help.hidden = true;
  });
  window.addEventListener('pageshow', syncCompletionInstallAction);
  document.addEventListener('pw:locale-changed', syncCompletionInstallAction);

  syncCompletionInstallAction();
})();

(() => {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  window.addEventListener('load', () => {
    window.setTimeout(async () => {
      try {
        let registration = await navigator.serviceWorker.getRegistration('/');
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache:'none'
          });
        }
        await registration.update();
      } catch (_) {}
    }, 0);
  });
})();

(() => {
  const params = new URLSearchParams(location.search);
  const showQa = params.get('qa') === '1' || (params.has('debug') && params.get('debug') !== '1');
  if (!showQa) return;

  const panel = document.createElement('aside');
  panel.setAttribute('aria-label', 'Диагностика приложения');
  panel.style.cssText = [
    'position:fixed','left:10px','bottom:10px','z-index:9999','max-width:calc(100vw - 20px)',
    'padding:10px 12px','border:1px solid rgba(32,37,34,.15)','border-radius:12px',
    'background:rgba(250,250,247,.96)','color:#202522','font:12px/1.45 system-ui,sans-serif',
    'box-shadow:0 8px 28px rgba(32,37,34,.12)','text-align:left'
  ].join(';');

  const vibrationAvailable = typeof navigator.vibrate === 'function';
  const rotationReady = Boolean(window.PW_COPY_ROTATION?.rotationReady);
  const completedPractices = window.PW_COPY_ROTATION?.completedPracticeCount ?? 'n/a';
  panel.innerHTML = `
    <strong>5 · QA</strong><br>
    <span>${window.PW_BUILD_VERSION || 'version unknown'}</span><br>
    <span>${isStandalone() ? 'PWA' : 'browser'} · vibration API ${vibrationAvailable ? '✓' : '—'}</span><br>
    <span>Copy rotation: ${rotationReady ? 'ON' : 'fallback'} · practices ${completedPractices}</span><br>
    <span>Session bell: +${window.PW_SOUND_TEST?.boundaryGainDb ?? 'n/a'} dB</span><br>
    <span>Tick/tock: ${window.PW_SOUND_TEST?.tickGain ?? 'n/a'} / ${window.PW_SOUND_TEST?.tockGain ?? 'n/a'}</span><br>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">
      <button data-test-sound="boundary" type="button">Сессия</button>
      <button data-test-sound="minuteStart" type="button">Начало минуты</button>
      <button data-test-sound="minuteEnd" type="button">Конец минуты</button>
      <button data-test-sound="tick" type="button">Tick</button>
      <button data-test-sound="tock" type="button">Tock</button>
      <button data-test-haptic type="button">Haptic</button>
    </div>
    <div data-qa-result style="margin-top:7px;max-width:320px;color:#68706b"></div>`;

  panel.querySelectorAll('button').forEach(button => {
    button.style.cssText += ';padding:6px 9px;border:1px solid #d9ddd7;border-radius:999px;background:#fff;color:#202522;font:inherit';
  });

  const result = panel.querySelector('[data-qa-result]');
  const soundTests = {
    boundary: async () => window.PW_SOUND_TEST?.boundaryCue?.(),
    minuteStart: async () => window.PW_SOUND_TEST?.minuteStart?.(),
    minuteEnd: async () => window.PW_SOUND_TEST?.minuteEnd?.(),
    tick: async () => window.PW_SOUND_TEST?.tick?.(),
    tock: async () => window.PW_SOUND_TEST?.tock?.()
  };

  panel.querySelectorAll('[data-test-sound]').forEach(button => {
    button.addEventListener('click', async () => {
      const key = button.dataset.testSound;
      try {
        ensureAudio();
        const ok = await soundTests[key]?.();
        result.textContent = ok === false
          ? `Звук «${button.textContent}» не проигрался.`
          : `Проиграно: ${button.textContent}.`;
      } catch (error) {
        result.textContent = `Ошибка звука: ${error?.name || 'unknown'}`;
      }
    });
  });

  panel.querySelector('[data-test-haptic]').addEventListener('click', () => {
    if (!vibrationAvailable) { result.textContent = 'Vibration API недоступен.'; return; }
    try {
      window.PW_HAPTIC_TEST?.single?.();
      const trigger = window.PW_HAPTIC_TEST?.triggerMs ?? 'n/a';
      result.textContent = `Production haptic: один триггер ${trigger} мс.`;
    } catch (error) {
      result.textContent = `Ошибка haptic: ${error?.name || 'unknown'}`;
    }
  });

  document.body.appendChild(panel);
})();

(() => {
  const script = document.createElement('script');
  script.src = '/ai-guide.js?v=1';
  script.async = true;
  document.body.appendChild(script);
})();
