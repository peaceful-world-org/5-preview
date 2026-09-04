/* 5-preview — language/theme utility experiment. Preview environment only. */
'use strict';

(() => {
  if (location.hostname !== 'preview-5.peaceful-world.org') return;
  if (window.__PW_PREVIEW_UTILITIES__) return;
  window.__PW_PREVIEW_UTILITIES__ = true;

  /* Keep permanent preview fast to inspect. Use ?timing=full for production timing. */
  const bootUrl = new URL(location.href);
  if (bootUrl.searchParams.get('timing') !== 'full' && !bootUrl.searchParams.has('demo')) {
    bootUrl.searchParams.set('demo', '1');
    bootUrl.searchParams.delete('design');
    location.replace(`${bootUrl.pathname}?${bootUrl.searchParams.toString()}${bootUrl.hash}`);
    return;
  }
  if (bootUrl.searchParams.has('design')) {
    bootUrl.searchParams.delete('design');
    try { history.replaceState(history.state, '', `${bootUrl.pathname}?${bootUrl.searchParams.toString()}${bootUrl.hash}`); } catch (_) {}
  }
  try { localStorage.removeItem('pw-preview-design-variant'); } catch (_) {}

  const THEME_KEY = 'pw-preview-theme';
  const LIGHT_BG = '#F9F8F4';
  const DARK_BG = '#171A18';
  const root = document.documentElement;
  const home = document.getElementById('home');
  const practice = document.getElementById('practice');
  const done = document.getElementById('done');
  const feedback = document.getElementById('feedback');
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');

  const STRINGS = {
    ru: {
      language: 'Язык',
      theme: 'Тема',
      system: 'Системная',
      light: 'Светлая',
      dark: 'Тёмная',
      chooseLanguage: 'Выбрать язык',
      chooseTheme: 'Выбрать тему'
    },
    en: {
      language: 'Language',
      theme: 'Theme',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
      chooseLanguage: 'Choose language',
      chooseTheme: 'Choose theme'
    }
  };

  function localeStrings() {
    const code = String(window.PW_I18N?.locale || root.lang || 'en').toLowerCase().split('-')[0];
    return STRINGS[code] || STRINGS.en;
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function validTheme(value) {
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
  }

  let themePreference = validTheme(safeGet(THEME_KEY) || 'system');
  let openPanel = '';

  const style = document.createElement('style');
  style.id = 'pw-preview-utilities-style';
  style.textContent = `
    /* The old footer switcher remains in app code for production comparison, but preview tests the scalable utility menu. */
    #localeSwitcher{display:none!important}

    .pw-preview-utilities{
      position:fixed;
      top:max(12px,env(safe-area-inset-top));
      right:max(12px,env(safe-area-inset-right));
      z-index:9000;
      display:flex;
      align-items:center;
      gap:7px;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","Helvetica Neue",Arial,sans-serif;
    }
    .pw-preview-utilities[hidden]{display:none!important}
    .pw-preview-utility-button{
      width:42px;
      height:42px;
      padding:0;
      border:1px solid var(--line);
      border-radius:50%;
      background:rgba(255,255,255,.72);
      color:var(--muted);
      display:grid;
      place-items:center;
      cursor:pointer;
      box-shadow:none;
      backdrop-filter:blur(10px);
      -webkit-backdrop-filter:blur(10px);
      transition:color .16s ease,background .16s ease,border-color .16s ease,transform .12s ease;
    }
    .pw-preview-utility-button:hover{color:var(--text);background:rgba(255,255,255,.94)}
    .pw-preview-utility-button:active{transform:scale(.96)}
    .pw-preview-utility-button[aria-expanded="true"]{color:var(--text);border-color:#C9CEC9;background:rgba(255,255,255,.96)}
    .pw-preview-utility-button svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}

    .pw-preview-utility-panel{
      position:fixed;
      top:max(62px,calc(env(safe-area-inset-top) + 62px));
      right:max(12px,env(safe-area-inset-right));
      z-index:8999;
      min-width:184px;
      max-width:min(280px,calc(100vw - 24px));
      padding:7px;
      border:1px solid var(--line);
      border-radius:16px;
      background:rgba(255,255,255,.96);
      color:var(--text);
      box-shadow:0 14px 42px rgba(32,37,34,.10);
      backdrop-filter:blur(18px);
      -webkit-backdrop-filter:blur(18px);
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","Helvetica Neue",Arial,sans-serif;
    }
    .pw-preview-utility-panel[hidden]{display:none!important}
    .pw-preview-utility-title{
      margin:4px 8px 6px;
      color:var(--muted);
      font-size:.68rem;
      font-weight:700;
      letter-spacing:.08em;
      text-transform:uppercase;
    }
    .pw-preview-utility-option{
      width:100%;
      min-height:42px;
      padding:0 10px;
      border:0;
      border-radius:11px;
      background:transparent;
      color:var(--text);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      text-align:left;
      font:600 .9rem/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","Helvetica Neue",Arial,sans-serif;
      cursor:pointer;
    }
    .pw-preview-utility-option:hover{background:rgba(103,118,103,.08)}
    .pw-preview-utility-option[aria-checked="true"]{font-weight:700}
    .pw-preview-utility-check{width:14px;color:var(--accent-text);font-size:.9rem;text-align:center}
    .pw-preview-utility-option:focus-visible,
    .pw-preview-utility-button:focus-visible{outline:2px solid #6E866E;outline-offset:2px}

    /* Dark experiment: warm graphite, not pure black. */
    html[data-pw-theme="dark"] .five-mark{filter:invert(94%)}
    html[data-pw-theme="dark"] .primary{
      background:#E8EAE5!important;
      color:#171A18!important;
      box-shadow:none!important;
    }
    html[data-pw-theme="dark"] .primary:hover{box-shadow:none!important}
    html[data-pw-theme="dark"] .round-btn,
    html[data-pw-theme="dark"] .secondary,
    html[data-pw-theme="dark"] .done-action,
    html[data-pw-theme="dark"] .install-help,
    html[data-pw-theme="dark"] .feedback-text,
    html[data-pw-theme="dark"] .feedback-email{
      background:#1D211E!important;
      color:var(--text)!important;
      border-color:var(--line)!important;
      box-shadow:none!important;
    }
    html[data-pw-theme="dark"] .done-action:hover{background:#232824!important;border-color:#454C46!important;box-shadow:none!important}
    html[data-pw-theme="dark"] .sound-on{background:#273129!important;color:#9CB19C!important}
    html[data-pw-theme="dark"] .timer-track{stroke:#3A403B!important}
    html[data-pw-theme="dark"] .timer-shell.preparing .timer-track{stroke:#343A35!important}
    html[data-pw-theme="dark"] .dot::before{background:#3D433E}
    html[data-pw-theme="dark"] .dot:not(:last-child)::after{background:#343A35}
    html[data-pw-theme="dark"] .dot.done::before{background:#68746A}
    html[data-pw-theme="dark"] .dot.done::after{background:#465047}
    html[data-pw-theme="dark"] .feedback-text::placeholder,
    html[data-pw-theme="dark"] .feedback-email::placeholder{color:#7F8781}
    html[data-pw-theme="dark"] .ios-install-guide-sheet{background:#171A18!important;border-color:#343A35!important;color:var(--text)!important}
    html[data-pw-theme="dark"] .ios-install-guide-close{background:#1D211E!important;color:var(--text)!important;border-color:var(--line)!important}
    html[data-pw-theme="dark"] .ios-install-guide-actions{background:rgba(23,26,24,.97)!important;border-color:var(--line)!important}
    html[data-pw-theme="dark"] .ios-install-guide-image{background:#212622!important}
    html[data-pw-theme="dark"] .ios-install-guide-done{background:#E8EAE5!important;color:#171A18!important}
    html[data-pw-theme="dark"] .pw-preview-utility-button{
      background:rgba(29,33,30,.82);
      border-color:#3B423C;
      color:#AAB2AC;
    }
    html[data-pw-theme="dark"] .pw-preview-utility-button:hover,
    html[data-pw-theme="dark"] .pw-preview-utility-button[aria-expanded="true"]{
      background:#252A26;
      border-color:#505951;
      color:#ECEDE8;
    }
    html[data-pw-theme="dark"] .pw-preview-utility-panel{
      background:rgba(29,33,30,.97);
      border-color:#3B423C;
      box-shadow:0 16px 46px rgba(0,0,0,.28);
    }
    html[data-pw-theme="dark"] .pw-preview-utility-option:hover{background:rgba(143,166,143,.10)}

    @media(max-width:520px){
      .pw-preview-utilities{top:max(9px,env(safe-area-inset-top));right:max(9px,env(safe-area-inset-right));gap:6px}
      .pw-preview-utility-button{width:40px;height:40px}
      .pw-preview-utility-panel{top:max(58px,calc(env(safe-area-inset-top) + 58px));right:max(9px,env(safe-area-inset-right))}
    }
    @media(prefers-reduced-motion:reduce){
      .pw-preview-utility-button{transition:none}
    }
  `;
  document.head.appendChild(style);

  const cluster = document.createElement('div');
  cluster.className = 'pw-preview-utilities';
  cluster.setAttribute('aria-label', 'Preview utilities');

  const languageButton = document.createElement('button');
  languageButton.type = 'button';
  languageButton.className = 'pw-preview-utility-button';
  languageButton.dataset.utility = 'language';
  languageButton.setAttribute('aria-haspopup', 'menu');
  languageButton.setAttribute('aria-expanded', 'false');
  languageButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M3.8 12h16.4M12 3.5c2.15 2.35 3.25 5.18 3.25 8.5S14.15 18.15 12 20.5M12 3.5C9.85 5.85 8.75 8.68 8.75 12s1.1 6.15 3.25 8.5"></path></svg>';

  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.className = 'pw-preview-utility-button';
  themeButton.dataset.utility = 'theme';
  themeButton.setAttribute('aria-haspopup', 'menu');
  themeButton.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('div');
  panel.className = 'pw-preview-utility-panel';
  panel.setAttribute('role', 'menu');
  panel.hidden = true;

  cluster.append(languageButton, themeButton);
  document.body.append(cluster, panel);

  const sunIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.25 5.25l1.45 1.45M17.3 17.3l1.45 1.45M18.75 5.25 17.3 6.7M6.7 17.3l-1.45 1.45"></path></svg>';
  const moonIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.2 15.15A7.7 7.7 0 0 1 8.85 4.8 7.9 7.9 0 1 0 19.2 15.15Z"></path></svg>';

  function effectiveTheme() {
    if (themePreference === 'system') return systemDark?.matches ? 'dark' : 'light';
    return themePreference;
  }

  function setThemeVariables(theme) {
    const names = ['--bg','--surface','--ink','--text','--muted','--accent','--accent-text','--accent-soft','--line','--shadow'];
    names.forEach(name => root.style.removeProperty(name));
    if (theme !== 'dark') return;
    const dark = {
      '--bg':'#171A18',
      '--surface':'#1D211E',
      '--ink':'#ECEDE8',
      '--text':'#E2E5E0',
      '--muted':'#A8B0AA',
      '--accent':'#8FA68F',
      '--accent-text':'#9CB19C',
      '--accent-soft':'#273129',
      '--line':'#3A413B',
      '--shadow':'none'
    };
    Object.entries(dark).forEach(([name, value]) => root.style.setProperty(name, value));
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

  function applyTheme() {
    const theme = effectiveTheme();
    root.dataset.pwTheme = theme;
    root.dataset.pwThemePreference = themePreference;
    root.style.colorScheme = theme;
    setThemeVariables(theme);
    syncThemeColor(theme);
    themeButton.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    syncLabels();
    if (openPanel === 'theme') renderThemePanel();
  }

  function chooseTheme(value) {
    themePreference = validTheme(value);
    safeSet(THEME_KEY, themePreference);
    applyTheme();
  }

  function availableLocales() {
    const registry = window.PW_I18N?.registry;
    const isPreview = Boolean(window.PW_I18N?.isPreview);
    return Object.entries(registry?.locales || {})
      .filter(([, config]) => Boolean(config?.released || isPreview));
  }

  function option(label, selected, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pw-preview-utility-option';
    button.setAttribute('role', 'menuitemradio');
    button.setAttribute('aria-checked', String(selected));
    const text = document.createElement('span');
    text.textContent = label;
    const check = document.createElement('span');
    check.className = 'pw-preview-utility-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = selected ? '✓' : '';
    button.append(text, check);
    button.addEventListener('click', onClick);
    return button;
  }

  function panelTitle(text) {
    const title = document.createElement('p');
    title.className = 'pw-preview-utility-title';
    title.textContent = text;
    return title;
  }

  function renderLanguagePanel() {
    const strings = localeStrings();
    const fragment = document.createDocumentFragment();
    fragment.appendChild(panelTitle(strings.language));
    availableLocales().forEach(([code, config]) => {
      fragment.appendChild(option(config.label || code, code === window.PW_I18N?.locale, async () => {
        if (!window.PW_I18N || code === window.PW_I18N.locale) {
          closePanel();
          return;
        }
        try {
          await window.PW_I18N.setLocale(code, {
            source: config.released ? 'explicit' : 'preview',
            allowUnreleased: !config.released
          });
        } catch (error) {
          console.warn('[5-preview] locale switch failed', error);
        }
        closePanel();
        syncLabels();
      }));
    });
    panel.replaceChildren(fragment);
  }

  function renderThemePanel() {
    const strings = localeStrings();
    const fragment = document.createDocumentFragment();
    fragment.appendChild(panelTitle(strings.theme));
    fragment.appendChild(option(strings.system, themePreference === 'system', () => chooseThemeAndClose('system')));
    fragment.appendChild(option(strings.light, themePreference === 'light', () => chooseThemeAndClose('light')));
    fragment.appendChild(option(strings.dark, themePreference === 'dark', () => chooseThemeAndClose('dark')));
    panel.replaceChildren(fragment);
  }

  function chooseThemeAndClose(value) {
    chooseTheme(value);
    closePanel();
  }

  function syncLabels() {
    const strings = localeStrings();
    languageButton.setAttribute('aria-label', strings.chooseLanguage);
    languageButton.title = strings.language;
    themeButton.setAttribute('aria-label', strings.chooseTheme);
    themeButton.title = `${strings.theme}: ${strings[effectiveTheme()]}`;
  }

  function closePanel() {
    openPanel = '';
    panel.hidden = true;
    languageButton.setAttribute('aria-expanded', 'false');
    themeButton.setAttribute('aria-expanded', 'false');
  }

  function togglePanel(kind) {
    if (openPanel === kind) {
      closePanel();
      return;
    }
    openPanel = kind;
    languageButton.setAttribute('aria-expanded', String(kind === 'language'));
    themeButton.setAttribute('aria-expanded', String(kind === 'theme'));
    if (kind === 'language') renderLanguagePanel();
    else renderThemePanel();
    panel.hidden = false;
    window.setTimeout(() => panel.querySelector('.pw-preview-utility-option')?.focus({ preventScroll:true }), 0);
  }

  function syncVisibility() {
    const visible = Boolean(home?.classList.contains('active') || done?.classList.contains('active'));
    cluster.hidden = !visible;
    if (!visible) closePanel();
  }

  languageButton.addEventListener('click', () => togglePanel('language'));
  themeButton.addEventListener('click', () => togglePanel('theme'));

  document.addEventListener('click', event => {
    if (!openPanel) return;
    if (cluster.contains(event.target) || panel.contains(event.target)) return;
    closePanel();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !openPanel) return;
    const returnTarget = openPanel === 'language' ? languageButton : themeButton;
    closePanel();
    returnTarget.focus({ preventScroll:true });
  });

  [home, practice, done, feedback].filter(Boolean).forEach(screen => {
    new MutationObserver(syncVisibility).observe(screen, { attributes:true, attributeFilter:['class'] });
  });

  systemDark?.addEventListener?.('change', () => {
    if (themePreference === 'system') applyTheme();
  });

  window.PW_I18N?.ready?.then(() => {
    syncLabels();
    document.addEventListener('pw:locale-changed', () => {
      syncLabels();
      if (openPanel === 'language') renderLanguagePanel();
      if (openPanel === 'theme') renderThemePanel();
    });
  }).catch(() => {});

  applyTheme();
  syncVisibility();

  window.PW_PREVIEW_UTILITIES = Object.freeze({
    get themePreference() { return themePreference; },
    get effectiveTheme() { return effectiveTheme(); },
    setTheme: chooseTheme
  });
})();
