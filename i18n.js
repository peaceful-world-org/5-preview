/* 5 by Peaceful World — lightweight locale runtime */
'use strict';

(() => {
  const REGISTRY_URL = '/locales/index.json';
  const LOCALE_KEY = 'pw-locale';
  const LOCALE_SOURCE_KEY = 'pw-locale-source';
  const LEGACY_LOCALE = 'ru';
  const PRODUCTION_HOST = '5.peaceful-world.org';
  const LEGACY_STATE_KEYS = [
    'pw-completed-practices',
    'pw-analytics-consent-v1',
    'pw-ticking'
  ];

  let registry = null;
  let locale = LEGACY_LOCALE;
  let localeConfig = null;
  let pack = Object.freeze({});
  let locked = false;

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalizeLocale(value) {
    if (!value) return '';
    return String(value).trim().toLowerCase().replace('_', '-').split('-')[0];
  }

  function previewMode() {
    if (location.hostname === PRODUCTION_HOST) return false;
    const params = new URLSearchParams(location.search);
    return params.get('i18nPreview') === '1';
  }

  function isStandalone() {
    try {
      return window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
        window.navigator?.standalone === true;
    } catch (_) {
      return false;
    }
  }

  function hasLegacyState() {
    return LEGACY_STATE_KEYS.some(key => safeGet(key) !== null);
  }

  function validLocale(code, { includeUnreleased = false } = {}) {
    const config = registry?.locales?.[code];
    return Boolean(config && (config.released || includeUnreleased));
  }

  function localeFromBrowser() {
    const candidates = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
    for (const candidate of candidates) {
      const code = normalizeLocale(candidate);
      if (validLocale(code)) return code;
    }
    return '';
  }

  function localeFromUrl() {
    const params = new URLSearchParams(location.search);
    return normalizeLocale(params.get('lang'));
  }

  function stripLocaleHint() {
    const url = new URL(location.href);
    if (!url.searchParams.has('lang')) return;
    url.searchParams.delete('lang');
    const query = url.searchParams.toString();
    const next = `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
    try { history.replaceState(history.state, '', next); } catch (_) {}
  }

  function persistLocale(code, source) {
    safeSet(LOCALE_KEY, code);
    safeSet(LOCALE_SOURCE_KEY, source);
  }

  function resolveInitialLocale() {
    const allowPreview = previewMode();
    const urlLocale = localeFromUrl();
    if (validLocale(urlLocale, { includeUnreleased: allowPreview })) {
      const source = allowPreview && !registry.locales[urlLocale].released ? 'preview' : 'url';
      persistLocale(urlLocale, source);
      stripLocaleHint();
      return urlLocale;
    }

    const saved = normalizeLocale(safeGet(LOCALE_KEY));
    const savedSource = safeGet(LOCALE_SOURCE_KEY);
    if (validLocale(saved, { includeUnreleased: allowPreview && savedSource === 'preview' })) return saved;

    // Protect users of the already-released Russian PWA from a silent
    // language flip when English is introduced on devices with an EN OS.
    if (hasLegacyState() || isStandalone()) {
      if (validLocale(LEGACY_LOCALE)) {
        persistLocale(LEGACY_LOCALE, 'legacy-migration');
        return LEGACY_LOCALE;
      }
    }

    const browserLocale = localeFromBrowser();
    if (browserLocale) {
      persistLocale(browserLocale, 'auto');
      return browserLocale;
    }

    const configuredDefault = normalizeLocale(registry?.default);
    if (validLocale(configuredDefault)) {
      persistLocale(configuredDefault, 'auto');
      return configuredDefault;
    }

    const legacyDefault = normalizeLocale(registry?.legacyDefault) || LEGACY_LOCALE;
    if (validLocale(legacyDefault)) {
      persistLocale(legacyDefault, 'auto');
      return legacyDefault;
    }

    throw new Error('No released locale is available');
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadPack(code) {
    const value = await fetchJson(`/locales/${encodeURIComponent(code)}.json`);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`Invalid locale pack: ${code}`);
    }
    const entries = Object.entries(value);
    if (!entries.length || entries.some(([, text]) => typeof text !== 'string' || !text.trim())) {
      throw new Error(`Incomplete locale pack: ${code}`);
    }
    return Object.freeze(value);
  }

  function interpolate(value, vars = {}) {
    return String(value).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
    );
  }

  function t(key, vars) {
    const value = pack[key];
    if (typeof value !== 'string') {
      console.warn('[5][i18n] missing key', key, 'for', locale);
      return key;
    }
    return interpolate(value, vars);
  }

  function text(key, fallback = '', vars) {
    const value = pack[key];
    return typeof value === 'string' ? interpolate(value, vars) : interpolate(fallback || key, vars);
  }

  function resolveConfiguredLink(name) {
    if (!localeConfig) return null;
    if (name === 'privacy') return localeConfig.privacy || null;
    return localeConfig.links?.[name] || null;
  }

  function applyDocumentLocale() {
    const root = document.documentElement;
    if (root) {
      root.lang = locale;
      root.dir = localeConfig?.dir || 'ltr';
    }

    const description = document.querySelector('meta[name="description"]');
    if (description && pack['meta.description']) description.content = pack['meta.description'];

    document.querySelectorAll('[data-i18n]').forEach(node => {
      const key = node.getAttribute('data-i18n');
      if (key && pack[key] !== undefined) node.textContent = pack[key];
    });

    document.querySelectorAll('[data-i18n-lines]').forEach(node => {
      const key = node.getAttribute('data-i18n-lines');
      if (!key || pack[key] === undefined) return;
      const lines = String(pack[key]).split('\n');
      const targets = Array.from(node.children);
      if (targets.length === lines.length) {
        targets.forEach((target, index) => { target.textContent = lines[index]; });
      } else {
        node.textContent = pack[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (key && pack[key] !== undefined) node.setAttribute('placeholder', pack[key]);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(node => {
      const key = node.getAttribute('data-i18n-aria-label');
      if (key && pack[key] !== undefined) node.setAttribute('aria-label', pack[key]);
    });

    document.querySelectorAll('[data-i18n-link]').forEach(node => {
      const linkName = node.getAttribute('data-i18n-link');
      const href = resolveConfiguredLink(linkName);
      if (href) node.setAttribute('href', href);
    });
  }

  async function activateLocale(code, { source = 'explicit', persist = true, allowUnreleased = false } = {}) {
    const normalized = normalizeLocale(code);
    const canUseUnreleased = allowUnreleased && previewMode();
    if (!validLocale(normalized, { includeUnreleased: canUseUnreleased })) {
      throw new Error(`Unsupported locale: ${normalized || code}`);
    }
    if (locked && normalized !== locale) return false;

    const nextPack = await loadPack(normalized);
    locale = normalized;
    localeConfig = registry.locales[normalized];
    pack = nextPack;
    if (persist) persistLocale(locale, source);
    applyDocumentLocale();

    document.dispatchEvent(new CustomEvent('pw:locale-changed', {
      detail: { locale, source, config: localeConfig }
    }));
    return true;
  }

  function lockLocale() { locked = true; }
  function unlockLocale() { locked = false; }

  const ready = (async () => {
    try {
      registry = await fetchJson(REGISTRY_URL);
      const initial = resolveInitialLocale();
      const initialConfig = registry.locales[initial];
      const initialSource = safeGet(LOCALE_SOURCE_KEY) || 'auto';
      await activateLocale(initial, {
        source: initialSource,
        persist: true,
        allowUnreleased: initialSource === 'preview' && Boolean(initialConfig && !initialConfig.released)
      });
      return locale;
    } catch (error) {
      console.error('[5][i18n] bootstrap failed', error);
      // The current production HTML is Russian, so a failed pre-release
      // bootstrap leaves the existing RU interface intact rather than
      // producing a partially translated screen.
      locale = LEGACY_LOCALE;
      localeConfig = registry?.locales?.[LEGACY_LOCALE] || { dir:'ltr' };
      document.documentElement.lang = LEGACY_LOCALE;
      document.documentElement.dir = 'ltr';
      return locale;
    }
  })();

  window.PW_I18N = {
    ready,
    t,
    text,
    setLocale: (code, options = {}) => activateLocale(code, { ...options, source: options.source || 'explicit' }),
    lockLocale,
    unlockLocale,
    get isLocked() { return locked; },
    get locale() { return locale; },
    get config() { return localeConfig; },
    get registry() { return registry; },
    get pack() { return pack; },
    get source() { return safeGet(LOCALE_SOURCE_KEY) || ''; },
    get isPreview() { return previewMode(); },
    normalizeLocale
  };
})();
