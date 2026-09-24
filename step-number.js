/* 5 by Peaceful World — small UI enhancements */
'use strict';

window.PW_BUILD_VERSION = 'v0.18.55';

var i18nText = (key, fallback, vars) =>
  window.PW_I18N?.text?.(key, fallback, vars) ?? fallback;

(() => {
  const badge = document.querySelector('.build-version');
  if (!badge) return;
  badge.textContent = 'v0.18.55';
  const sync = () => badge.setAttribute('aria-label', i18nText('build.aria', 'Версия 0.18.55'));
  sync();
  document.addEventListener('pw:locale-changed', sync);
})();

(() => {
  const THEME_KEY = 'pw-theme';
  const LIGHT_BG = '#F9F8F4';
  const DARK_BG = '#171A18';
  const root = document.documentElement;
  const home = document.getElementById('home');
  const practice = document.getElementById('practice');
  const done = document.getElementById('done');
  const feedback = document.getElementById('feedback');
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!home || !practice || !done || !window.PW_I18N) return;

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function validTheme(value) {
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
  }

  let themePreference = validTheme(safeGet(THEME_KEY) || root.dataset.pwThemePreference || 'system');
  let languagePanelOpen = false;

  const utilities = document.createElement('div');
  utilities.className = 'pw-utilities';

  const languageButton = document.createElement('button');
  languageButton.type = 'button';
  languageButton.className = 'pw-utility-button pw-language-button';
  languageButton.setAttribute('aria-haspopup', 'menu');
  languageButton.setAttribute('aria-expanded', 'false');
  languageButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M3.8 12h16.4M12 3.5c2.15 2.35 3.25 5.18 3.25 8.5S14.15 18.15 12 20.5M12 3.5C9.85 5.85 8.75 8.68 8.75 12s1.1 6.15 3.25 8.5"></path></svg>';

  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.className = 'pw-utility-button pw-theme-button';

  const panel = document.createElement('div');
  panel.className = 'pw-language-panel';
  panel.setAttribute('role', 'menu');
  panel.hidden = true;

  utilities.append(languageButton, themeButton);
  document.body.append(utilities, panel);

  const sunIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.25 5.25l1.45 1.45M17.3 17.3l1.45 1.45M18.75 5.25 17.3 6.7M6.7 17.3l-1.45 1.45"></path></svg>';
  const moonIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.2 15.15A7.7 7.7 0 0 1 8.85 4.8 7.9 7.9 0 1 0 19.2 15.15Z"></path></svg>';

  function effectiveTheme() {
    if (themePreference === 'system') return systemDark?.matches ? 'dark' : 'light';
    return themePreference;
  }

  function syncThemeColor(theme) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'dark' ? DARK_BG : LIGHT_BG;
  }

  function availableLocales() {
    const registry = window.PW_I18N.registry;
    return Object.entries(registry?.locales || {})
      .filter(([, config]) => config?.released === true);
  }

  function syncLabels() {
    const current = effectiveTheme();
    const languageLabel = i18nText('locale.switcher.aria', 'Выбрать язык');
    const themeLabel = current === 'dark'
      ? i18nText('theme.switch.light.aria', 'Переключить на светлый режим')
      : i18nText('theme.switch.dark.aria', 'Переключить на тёмный режим');
    languageButton.setAttribute('aria-label', languageLabel);
    languageButton.title = languageLabel;
    themeButton.setAttribute('aria-label', themeLabel);
    themeButton.title = themeLabel;
    languageButton.hidden = availableLocales().length < 2;
  }

  function applyTheme() {
    const theme = effectiveTheme();
    root.dataset.pwTheme = theme;
    root.dataset.pwThemePreference = themePreference;
    root.style.colorScheme = theme;
    syncThemeColor(theme);
    themeButton.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    syncLabels();
  }

  function chooseTheme(value) {
    themePreference = validTheme(value);
    if (themePreference === 'system') {
      try { localStorage.removeItem(THEME_KEY); } catch (_) {}
    } else {
      safeSet(THEME_KEY, themePreference);
    }
    applyTheme();
  }

  function toggleTheme() {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    closeLanguagePanel();
    chooseTheme(next);
  }

  function languageOption(label, selected, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pw-language-option';
    button.setAttribute('role', 'menuitemradio');
    button.setAttribute('aria-checked', String(selected));
    const text = document.createElement('span');
    text.textContent = label;
    const check = document.createElement('span');
    check.className = 'pw-language-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = selected ? '✓' : '';
    button.append(text, check);
    button.addEventListener('click', onClick);
    return button;
  }

  function renderLanguagePanel() {
    const fragment = document.createDocumentFragment();
    const title = document.createElement('p');
    title.className = 'pw-language-title';
    title.textContent = i18nText('locale.switcher.aria', 'Выбрать язык');
    fragment.appendChild(title);

    availableLocales().forEach(([code, config]) => {
      fragment.appendChild(languageOption(config.label || code, code === window.PW_I18N.locale, async () => {
        if (code === window.PW_I18N.locale) {
          closeLanguagePanel();
          return;
        }
        try {
          await window.PW_I18N.setLocale(code, {
            source: 'explicit',
            allowUnreleased: false
          });
        } catch (error) {
          console.warn('[5][i18n] locale switch failed', error);
        }
        closeLanguagePanel();
        syncLabels();
      }));
    });
    panel.replaceChildren(fragment);
  }

  function closeLanguagePanel() {
    languagePanelOpen = false;
    panel.hidden = true;
    languageButton.setAttribute('aria-expanded', 'false');
  }

  function toggleLanguagePanel() {
    if (languagePanelOpen) {
      closeLanguagePanel();
      return;
    }
    languagePanelOpen = true;
    languageButton.setAttribute('aria-expanded', 'true');
    renderLanguagePanel();
    panel.hidden = false;
    window.setTimeout(() => panel.querySelector('.pw-language-option')?.focus({ preventScroll:true }), 0);
  }

  function syncVisibility() {
    const visible = Boolean(home.classList.contains('active') || done.classList.contains('active'));
    utilities.hidden = !visible;
    if (!visible) closeLanguagePanel();
  }

  languageButton.addEventListener('click', toggleLanguagePanel);
  themeButton.addEventListener('click', toggleTheme);

  document.addEventListener('click', event => {
    if (!languagePanelOpen) return;
    if (languageButton.contains(event.target) || panel.contains(event.target)) return;
    closeLanguagePanel();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !languagePanelOpen) return;
    closeLanguagePanel();
    languageButton.focus({ preventScroll:true });
  });

  [home, practice, done, feedback].filter(Boolean).forEach(screen => {
    new MutationObserver(syncVisibility).observe(screen, { attributes:true, attributeFilter:['class'] });
  });

  systemDark?.addEventListener?.('change', () => {
    if (themePreference === 'system') applyTheme();
  });

  window.PW_I18N.ready.then(() => {
    syncLabels();
    document.addEventListener('pw:locale-changed', () => {
      syncLabels();
      if (languagePanelOpen) renderLanguagePanel();
    });
  }).catch(() => {});

  applyTheme();
  syncVisibility();

  window.PW_THEME = Object.freeze({
    get preference() { return themePreference; },
    get effective() { return effectiveTheme(); },
    set: chooseTheme,
    toggle: toggleTheme
  });
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