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
  const stepCount = document.getElementById('stepCount');
  const stepNumber = document.getElementById('stepNumber');
  if (!stepCount || !stepNumber) return;
  const sync = () => {
    const match = stepCount.textContent.match(/\d+/);
    stepNumber.textContent = match ? match[0] : '1';
  };
  sync();
  new MutationObserver(sync).observe(stepCount, { childList:true, characterData:true, subtree:true });
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
