/* 5 by Peaceful World — consent-first product analytics */
'use strict';

(() => {
  const GOOGLE_TAG_ID = 'GT-KVFT6FHN';
  const PRODUCTION_HOST = '5.peaceful-world.org';
  const NATIVE_ANDROID_HOST = 'android.5.peaceful-world.org';
  const CONSENT_KEY = 'pw-analytics-consent-v1';
  const CONSENT_GRANTED = 'granted';
  const CONSENT_DENIED = 'denied';

  const params = new URLSearchParams(location.search);
  const normalizedHost = String(location.hostname || '').trim().toLowerCase().replace(/\.+$/, '');
  const isProduction = normalizedHost === PRODUCTION_HOST;
  const isNativeAndroidHost = normalizedHost === NATIVE_ANDROID_HOST;
  const isNativeAndroid = window.PW_NATIVE_ANDROID === true || window.Capacitor?.getPlatform?.() === 'android' || isNativeAndroidHost;
  const isQaMode = params.has('debug') || params.has('demo') || location.pathname.endsWith('/demo.html');

  if ((!isProduction && !isNativeAndroid) || isQaMode) return;

  let consent = readConsent();
  let tagLoaded = false;
  let nativeAnalytics = null;
  let nativeConsentReady = null;
  let practiceInProgress = false;
  let practiceMode = 'guided';
  let completionSent = false;
  let feedbackSuccessWasVisible = false;
  let appOpenSent = false;
  const nativeDiagnostics = {
    bridgePluginAvailable: null,
    pluginProxyCreated: false,
    configureSucceeded: false,
    instanceIdSucceeded: null,
    lastEventSucceeded: null,
    lastEventName: '',
    lastError: ''
  };

  if (!isNativeAndroid) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

    // Consent Mode defaults remain denied. In Basic Consent Mode the Google tag
    // itself is not loaded until the user explicitly grants analytics consent.
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500
    });
  }

  function text(key, fallback, vars) {
    return window.PW_I18N?.text?.(key, fallback, vars) ?? fallback;
  }

  function currentLocale() {
    return window.PW_I18N?.locale || document.documentElement.lang || 'ru';
  }

  function currentPrivacyUrl() {
    return window.PW_I18N?.config?.privacy || 'privacy.html';
  }

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY) || ''; }
    catch (_) { return ''; }
  }

  function writeConsent(value) {
    consent = value;
    try { localStorage.setItem(CONSENT_KEY, value); } catch (_) {}
  }

  function commonParams(extra = {}) {
    return {
      app_version: window.PW_BUILD_VERSION || (isNativeAndroid ? 'v0.18.59' : 'v0.18.51-alpha'),
      app_locale: currentLocale(),
      app_surface: isNativeAndroid ? 'android' : (isStandalone() ? 'pwa' : 'browser'),
      ...extra
    };
  }

  function isStandalone() {
    return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true);
  }

  function getNativeAnalytics() {
    if (!isNativeAndroid) return null;
    if (nativeAnalytics) return nativeAnalytics;

    const capacitor = window.Capacitor;

    // Capacitor's native Android bridge exports registered plugins directly on
    // window.Capacitor.Plugins. This app ships plain browser JavaScript rather
    // than a bundled @capacitor/core runtime, so registerPlugin()/isPluginAvailable()
    // are not guaranteed to exist on the global object even though the native
    // plugin itself is present and callable.
    const injectedPlugin = capacitor?.Plugins?.FirebaseAnalytics;
    if (injectedPlugin) {
      nativeDiagnostics.bridgePluginAvailable = true;
      nativeDiagnostics.pluginProxyCreated = true;
      nativeAnalytics = injectedPlugin;
      return nativeAnalytics;
    }

    // Bundled Capacitor apps expose registerPlugin(). Keep that path as a
    // compatibility fallback for future packaging changes.
    if (!capacitor?.registerPlugin) {
      nativeDiagnostics.bridgePluginAvailable = false;
      nativeDiagnostics.pluginProxyCreated = false;
      nativeDiagnostics.lastError = 'FirebaseAnalytics is not exposed by the native bridge';
      return null;
    }

    try {
      nativeDiagnostics.bridgePluginAvailable = typeof capacitor.isPluginAvailable === 'function'
        ? Boolean(capacitor.isPluginAvailable('FirebaseAnalytics'))
        : null;
      nativeAnalytics = capacitor.registerPlugin('FirebaseAnalytics');
      nativeDiagnostics.pluginProxyCreated = Boolean(nativeAnalytics);
      return nativeAnalytics;
    } catch (error) {
      nativeDiagnostics.lastError = String(error?.message || error);
      return null;
    }
  }

  async function configureNativeAnalytics(granted) {
    const plugin = getNativeAnalytics();
    if (!plugin) throw new Error('FirebaseAnalytics native plugin is unavailable');

    nativeDiagnostics.configureSucceeded = false;
    nativeDiagnostics.lastError = '';
    const analyticsStatus = granted ? 'GRANTED' : 'DENIED';
    await plugin.setConsent({ type:'ANALYTICS_STORAGE', status:analyticsStatus });
    await plugin.setConsent({ type:'AD_STORAGE', status:'DENIED' });
    await plugin.setConsent({ type:'AD_USER_DATA', status:'DENIED' });
    await plugin.setConsent({ type:'AD_PERSONALIZATION', status:'DENIED' });
    await plugin.setEnabled({ enabled:granted });
    nativeDiagnostics.configureSucceeded = true;
    return plugin;
  }

  function ensureNativeAnalyticsGranted() {
    if (!isNativeAndroid) return Promise.resolve(null);
    if (!nativeConsentReady) {
      nativeConsentReady = configureNativeAnalytics(true).catch(error => {
        nativeDiagnostics.configureSucceeded = false;
        nativeDiagnostics.lastError = String(error?.message || error);
        console.warn('Native analytics could not be enabled.', error);
        nativeConsentReady = null;
        return null;
      });
    }
    return nativeConsentReady;
  }

  async function disableNativeAnalytics({ reset = false } = {}) {
    if (!isNativeAndroid) return;
    nativeConsentReady = null;
    try {
      const plugin = await configureNativeAnalytics(false);
      if (reset) await plugin.resetAnalyticsData();
    } catch (error) {
      console.warn('Native analytics could not be disabled cleanly.', error);
    }
  }

  function grantGoogleConsent() {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function loadTag({ refreshConsent = false } = {}) {
    if (isNativeAndroid || consent !== CONSENT_GRANTED) return;

    // The script only needs to be inserted once, but Consent Mode may need to
    // be updated again if a user changes Deny -> Allow without reloading.
    if (tagLoaded) {
      if (refreshConsent) grantGoogleConsent();
      return;
    }
    tagLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_TAG_ID)}`;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    document.head.appendChild(script);

    // Match Google's supported gtag.js initialization order before config/events.
    window.gtag('js', new Date());
    grantGoogleConsent();
    window.gtag('set', {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    window.gtag('config', GOOGLE_TAG_ID, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function send(name, extra = {}) {
    if (consent !== CONSENT_GRANTED) return;

    if (isNativeAndroid) {
      void ensureNativeAnalyticsGranted().then(async plugin => {
        if (!plugin) throw new Error('FirebaseAnalytics native plugin is unavailable');
        await plugin.logEvent({ name, params:commonParams(extra) });
        nativeDiagnostics.lastEventName = name;
        nativeDiagnostics.lastEventSucceeded = true;
      }).catch(error => {
        nativeDiagnostics.lastEventName = name;
        nativeDiagnostics.lastEventSucceeded = false;
        nativeDiagnostics.lastError = String(error?.message || error);
        console.warn(`Native analytics event failed: ${name}`, error);
      });
      return;
    }

    loadTag();
    window.gtag('event', name, commonParams(extra));
  }

  function sendAppOpen() {
    if (appOpenSent || consent !== CONSENT_GRANTED) return;
    appOpenSent = true;
    send('app_open');
  }

  function deleteAnalyticsCookies() {
    const names = document.cookie.split(';').map(part => part.trim().split('=')[0]).filter(name => /^_ga(?:_|$)/.test(name));
    const domains = ['', location.hostname, `.${location.hostname}`, '.peaceful-world.org'];
    names.forEach(name => {
      domains.forEach(domain => {
        const domainPart = domain ? `; domain=${domain}` : '';
        document.cookie = `${name}=; Max-Age=0; path=/${domainPart}; SameSite=Lax`;
      });
    });
  }

  function grantConsent() {
    writeConsent(CONSENT_GRANTED);
    acknowledgeGrant();

    if (isNativeAndroid) {
      nativeConsentReady = null;
      void ensureNativeAnalyticsGranted().then(() => {
        send('analytics_consent_granted');
        sendAppOpen();
      });
      return;
    }

    loadTag({ refreshConsent:true });
    send('analytics_consent_granted');
    sendAppOpen();
  }

  function denyConsent() {
    const wasGranted = consent === CONSENT_GRANTED;
    writeConsent(CONSENT_DENIED);

    if (isNativeAndroid) {
      void disableNativeAnalytics({ reset:wasGranted });
      hideNotice();
      return;
    }

    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    deleteAnalyticsCookies();
    hideNotice();
  }

  // Canonical Peaceful World consent artwork and visual system. Identical image
  // bytes and shared structure, with app-specific privacy behavior retained.
  const COOKIE_IMAGE = 'data:image/webp;base64,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';
  let noticeCloseTimer = null;

  function injectStyles() {
    if (document.getElementById('pwAnalyticsStyles')) return;
    const style = document.createElement('style');
    style.id = 'pwAnalyticsStyles';
    style.textContent = `#pwAnalyticsNotice{position:fixed;inset:auto 12px max(12px,env(safe-area-inset-bottom),var(--safe-area-inset-bottom,0px)) 12px;z-index:2147483000;display:none;justify-content:center;pointer-events:none;font-family:inherit}
#pwAnalyticsNotice:not([hidden]){display:flex}
#pw-consent-card{position:relative;pointer-events:auto;width:min(620px,100%);padding:18px 20px 16px;background:#fff;color:#252620;border:1px solid #e1ded5;border-radius:22px;box-shadow:0 16px 55px rgba(0,0,0,.22)}
.pw-consent-copyhead{display:flex;align-items:flex-start;gap:12px}
.pw-consent-cookie{flex:0 0 52px;width:52px;height:52px;display:block;overflow:hidden;border-radius:12px}
.pw-consent-cookie img{width:100%;height:100%;display:block;object-fit:contain;mix-blend-mode:multiply}
#pw-consent-thanks{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:inherit;background:#fff;color:#283028;font-size:clamp(18px,4vw,21px);font-weight:750;line-height:1.3;letter-spacing:0}
#pw-consent-thanks[hidden]{display:none}
.pw-consent-copy{min-width:0}
#pw-consent-title{font-size:18px;font-weight:750;line-height:1.32;letter-spacing:0;margin:0 0 6px}
#pw-consent-description{font-size:13px;line-height:1.52;color:#5a5c54;margin:0}
#pw-consent-description a{color:#4d554b;text-decoration:underline;text-underline-offset:2px;font-weight:400}
#pw-consent-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:18px}
#pw-consent-actions button{appearance:none;min-height:48px;border-radius:999px;padding:10px 13px;font:inherit;font-size:13px;font-weight:750;line-height:1.25;cursor:pointer;border:1px solid #9a9c94}
#pw-consent-actions button[data-action="necessary"]{background:#fff;color:#262923}
#pw-consent-actions button[data-action="accept"]{background:#f1c75c;color:#252924;border-color:#e0b24d}
#pw-consent-actions button[data-action="necessary"]:hover{background:#f1f1ec}
#pw-consent-actions button[data-action="accept"]:hover{background:#f3d070}
#pw-consent-card{max-height:calc(100dvh - 24px - env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain}
#pw-consent-card button:focus-visible,#pw-consent-card a:focus-visible{outline:3px solid #d5a743;outline-offset:3px}
@media(max-width:640px){
  #pwAnalyticsNotice{inset:auto 8px max(8px,env(safe-area-inset-bottom),var(--safe-area-inset-bottom,0px)) 8px}
  #pw-consent-card{padding:15px 15px 12px;border-radius:19px}
  .pw-consent-copyhead{gap:10px}
  .pw-consent-cookie{flex-basis:44px;width:44px;height:44px;border-radius:10px}
  #pw-consent-title{font-size:16px;margin-bottom:4px}
  #pw-consent-description{font-size:12px;line-height:1.43}
  #pw-consent-actions{gap:7px;margin-top:13px}
  #pw-consent-actions button{min-height:52px;padding:8px 7px;font-size:12px;line-height:1.3}
}
@media(prefers-reduced-motion:reduce){
  #pwAnalyticsNotice *{animation:none!important;transition:none!important}
}

#pwAnalyticsNotice[hidden]{display:none!important}
html[data-pw-theme="dark"] #pw-consent-card{background:#1D211E;border-color:#454C46;color:#E2E5E0;box-shadow:0 16px 55px rgba(0,0,0,.36)}
html[data-pw-theme="dark"] #pw-consent-title{color:#ECEDE8}
html[data-pw-theme="dark"] #pw-consent-description{color:#C0C7BE}
html[data-pw-theme="dark"] #pw-consent-description a{color:#E5D4AC}
html[data-pw-theme="dark"] #pw-consent-actions button[data-action="necessary"]{background:#292E2A;border-color:#727C73;color:#ECEDE8}
html[data-pw-theme="dark"] #pw-consent-actions button[data-action="necessary"]:hover{background:#353C36}
html[data-pw-theme="dark"] #pw-consent-actions button[data-action="accept"]{background:#F1C75C;border-color:#E0B24D;color:#252924}
html[data-pw-theme="dark"] #pw-consent-actions button[data-action="accept"]:hover{background:#F3D070}
html[data-pw-theme="dark"] #pw-consent-thanks{background:#1D211E;color:#ECEDE8}
html[data-pw-theme="dark"] .pw-consent-cookie img{mix-blend-mode:normal}
`;
    document.head.appendChild(style);
  }

  function resetNoticeAcknowledgement() {
    if (noticeCloseTimer !== null) {
      clearTimeout(noticeCloseTimer);
      noticeCloseTimer = null;
    }
    const notice = document.getElementById('pwAnalyticsNotice');
    if (!notice) return;
    const thanks = notice.querySelector('#pw-consent-thanks');
    if (thanks) thanks.hidden = true;
    notice.querySelectorAll('button[data-action]').forEach(button => {
      button.disabled = false;
    });
  }

  function acknowledgeGrant() {
    const notice = document.getElementById('pwAnalyticsNotice');
    if (!notice || notice.hidden) return;
    const thanks = notice.querySelector('#pw-consent-thanks');
    if (thanks) {
      thanks.textContent = text('analytics.thanks', 'Спасибо! 😊');
      thanks.hidden = false;
    }
    notice.querySelectorAll('button[data-action]').forEach(button => {
      button.disabled = true;
    });
    if (noticeCloseTimer !== null) clearTimeout(noticeCloseTimer);
    noticeCloseTimer = setTimeout(() => {
      noticeCloseTimer = null;
      hideNotice();
    }, 700);
  }

  function syncNoticeCopy(notice = document.getElementById('pwAnalyticsNotice')) {
    if (!notice) return;
    const title = notice.querySelector('[data-analytics-title]');
    const body = notice.querySelector('[data-analytics-body]');
    const more = notice.querySelector('[data-analytics-more]');
    const accept = notice.querySelector('[data-analytics-accept]');
    const decline = notice.querySelector('[data-analytics-decline]');
    if (title) title.textContent = text('analytics.title', 'Помогите нам стать лучше');
    if (body) body.textContent = isNativeAndroid
      ? text('analytics.body.native', 'Google Analytics for Firebase помогает улучшать тренажёр «5». Сбор статистики включается только с вашего разрешения.')
      : text('analytics.body', 'Google Analytics помогает улучшать мирное образование. Аналитические cookie используются только с вашего разрешения.');
    if (more) {
      more.textContent = text('analytics.more', 'Подробнее');
      more.setAttribute('href', currentPrivacyUrl());
    }
    if (accept) accept.textContent = text('analytics.accept', 'Разрешить аналитику');
    if (decline) decline.textContent = text('analytics.decline', 'Только необходимые');
  }

  function ensureNotice() {
    injectStyles();
    let notice = document.getElementById('pwAnalyticsNotice');
    if (notice) {
      syncNoticeCopy(notice);
      return notice;
    }

    notice = document.createElement('aside');
    notice.id = 'pwAnalyticsNotice';
    notice.className = 'pw-consent-root';
    notice.hidden = true;
    notice.innerHTML = `
      <section id="pw-consent-card" role="dialog" aria-modal="false" aria-labelledby="pw-consent-title" aria-describedby="pw-consent-description">
        <div class="pw-consent-copyhead">
          <span class="pw-consent-cookie" aria-hidden="true"><img src="${COOKIE_IMAGE}" alt="" width="52" height="52" decoding="async"></span>
          <div class="pw-consent-copy">
            <h2 id="pw-consent-title" data-analytics-title></h2>
            <p id="pw-consent-description"><span data-analytics-body></span> <a data-analytics-more target="_blank" rel="noopener noreferrer"></a>.</p>
          </div>
        </div>
        <div id="pw-consent-actions">
          <button type="button" data-action="necessary" data-analytics-decline></button>
          <button type="button" data-action="accept" data-primary="1" data-analytics-accept></button>
        </div>
        <div id="pw-consent-thanks" role="status" aria-live="polite" aria-atomic="true" hidden></div>
      </section>`;
    document.body.appendChild(notice);
    notice.querySelector('[data-analytics-accept]')?.addEventListener('click', grantConsent);
    notice.querySelector('[data-analytics-decline]')?.addEventListener('click', denyConsent);
    syncNoticeCopy(notice);
    return notice;
  }

  function showNotice() {
    const notice = ensureNotice();
    resetNoticeAcknowledgement();
    notice.hidden = false;
  }

  function hideNotice() {
    const notice = document.getElementById('pwAnalyticsNotice');
    if (notice) notice.hidden = true;
    resetNoticeAcknowledgement();
  }

  function syncPrivacyLink() {
    const link = document.querySelector('.home-privacy-link');
    if (!link) return;
    link.setAttribute('aria-label', text(
      'home.privacy.aria',
      'Открыть настройки конфиденциальности и аналитики'
    ));
  }

  function bindPrivacyLink() {
    const link = document.querySelector('.home-privacy-link');
    if (!link || link.dataset.analyticsBound === '1') return;
    link.dataset.analyticsBound = '1';
    syncPrivacyLink();
    link.addEventListener('click', event => {
      event.preventDefault();
      showNotice();
    });
  }

  function practiceNumberBucket(value) {
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n <= 0) return null;
    if (n === 1) return '1';
    if (n <= 3) return '2-3';
    if (n <= 5) return '4-5';
    if (n <= 10) return '6-10';
    if (n <= 20) return '11-20';
    if (n <= 50) return '21-50';
    return '51+';
  }

  function watchPracticeCompletion() {
    const done = document.getElementById('done');
    if (!done) return;
    const check = () => {
      const active = done.classList.contains('active');
      if (active && practiceInProgress && !completionSent) {
        completionSent = true;
        practiceInProgress = false;
        const lastCompletion = window.PW_LAST_COMPLETION;
        const isFree = practiceMode === 'free' || lastCompletion?.mode === 'free';
        const practiceNumber = isFree
          ? lastCompletion?.freePracticeNumber
          : window.PW_COPY_ROTATION?.lastCompletedPracticeNumber;
        const extra = {
          practice_mode:isFree ? 'free' : (lastCompletion?.mode === 'metta' ? 'metta' : 'guided')
        };
        const numberBucket = practiceNumberBucket(practiceNumber);
        if (numberBucket) {
          extra.practice_number_bucket = numberBucket;
        }
        if (isFree && Number.isSafeInteger(lastCompletion?.durationSeconds) && lastCompletion.durationSeconds > 0) {
          extra.practice_duration_seconds = lastCompletion.durationSeconds;
        }
        send('practice_complete', extra);
      }
    };
    new MutationObserver(check).observe(done, { attributes:true, attributeFilter:['class'] });
  }

  function watchFeedbackSuccess() {
    const success = document.getElementById('feedbackSuccess');
    if (!success) return;
    const check = () => {
      const visible = !success.hidden;
      if (visible && !feedbackSuccessWasVisible) send('feedback_submit');
      feedbackSuccessWasVisible = visible;
    };
    feedbackSuccessWasVisible = !success.hidden;
    new MutationObserver(check).observe(success, { attributes:true, attributeFilter:['hidden'] });
  }

  function watchAiGuide() {
    const attach = widget => {
      if (!widget || widget.dataset.analyticsBound === '1') return;
      widget.dataset.analyticsBound = '1';
      widget.addEventListener('elevenlabs-convai:call', () => send('ai_guide_open'));
    };
    document.querySelectorAll('[data-pw-ai-guide="1"]').forEach(attach);
    new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.('[data-pw-ai-guide="1"]')) attach(node);
        node.querySelectorAll?.('[data-pw-ai-guide="1"]').forEach(attach);
      }));
    }).observe(document.body, { childList:true, subtree:true });
  }

  function nativeDiagnosticSnapshot() {
    return {
      nativeAndroid: isNativeAndroid,
      consentGranted: consent === CONSENT_GRANTED,
      bridgePluginAvailable: nativeDiagnostics.bridgePluginAvailable,
      pluginProxyCreated: nativeDiagnostics.pluginProxyCreated,
      configureSucceeded: nativeDiagnostics.configureSucceeded,
      instanceIdSucceeded: nativeDiagnostics.instanceIdSucceeded,
      lastEventSucceeded: nativeDiagnostics.lastEventSucceeded,
      lastEventName: nativeDiagnostics.lastEventName,
      lastError: nativeDiagnostics.lastError
    };
  }

  async function runNativeDiagnostic() {
    if (!isNativeAndroid) return nativeDiagnosticSnapshot();
    if (consent !== CONSENT_GRANTED) {
      nativeDiagnostics.lastError = 'Analytics consent is not granted';
      return nativeDiagnosticSnapshot();
    }

    try {
      const plugin = await ensureNativeAnalyticsGranted();
      if (!plugin) throw new Error('FirebaseAnalytics native plugin is unavailable');

      try {
        const result = await plugin.getAppInstanceId();
        nativeDiagnostics.instanceIdSucceeded = Boolean(result?.appInstanceId);
      } catch (error) {
        nativeDiagnostics.instanceIdSucceeded = false;
        nativeDiagnostics.lastError = `getAppInstanceId: ${error?.message || error}`;
      }

      try {
        await plugin.logEvent({
          name:'analytics_diagnostic_ping',
          params:commonParams({ diagnostic_source:'self_test' })
        });
        nativeDiagnostics.lastEventName = 'analytics_diagnostic_ping';
        nativeDiagnostics.lastEventSucceeded = true;
      } catch (error) {
        nativeDiagnostics.lastEventName = 'analytics_diagnostic_ping';
        nativeDiagnostics.lastEventSucceeded = false;
        nativeDiagnostics.lastError = `logEvent: ${error?.message || error}`;
      }
    } catch (error) {
      nativeDiagnostics.configureSucceeded = false;
      nativeDiagnostics.lastError = String(error?.message || error);
    }

    return nativeDiagnosticSnapshot();
  }

  function formatNativeDiagnostic(report) {
    const value = item => item === true ? 'OK' : item === false ? 'FAIL' : 'n/a';
    return [
      'Android analytics diagnostic',
      `Native Android: ${value(report.nativeAndroid)}`,
      `Consent granted: ${value(report.consentGranted)}`,
      `Bridge reports plugin: ${value(report.bridgePluginAvailable)}`,
      `Plugin proxy created: ${value(report.pluginProxyCreated)}`,
      `Consent + enable: ${value(report.configureSucceeded)}`,
      `Firebase instance: ${value(report.instanceIdSucceeded)}`,
      `Diagnostic event: ${value(report.lastEventSucceeded)}`,
      `Last event: ${report.lastEventName || 'none'}`,
      `Error: ${report.lastError || 'none'}`
    ].join('\n');
  }

  function bindNativeDiagnostics() {
    if (!isNativeAndroid) return;
    const badge = document.querySelector('.build-version');
    if (!badge || badge.dataset.analyticsDiagnosticBound === '1') return;
    badge.dataset.analyticsDiagnosticBound = '1';
    let taps = 0;
    let resetTimer = 0;
    badge.addEventListener('click', () => {
      taps += 1;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { taps = 0; }, 4000);
      if (taps < 7) return;
      taps = 0;
      clearTimeout(resetTimer);
      void runNativeDiagnostic().then(report => window.alert(formatNativeDiagnostic(report)));
    });
  }

  async function init() {
    try { await window.PW_I18N?.ready; } catch (_) {}

    document.addEventListener('pw:practice-started', event => {
      practiceInProgress = true;
      practiceMode = event?.detail?.mode === 'free' ? 'free' : (event?.detail?.mode === 'metta' ? 'metta' : 'guided');
      completionSent = false;
      send('practice_start', { practice_mode:practiceMode });
    });

    document.addEventListener('pw:progress-backup-open', () => send('progress_backup_open'));
    document.addEventListener('pw:progress-backup-complete', () => send('progress_backup_complete'));
    document.addEventListener('pw:progress-restore-complete', () => send('progress_restore_complete'));
    document.addEventListener('pw:progress-account-deleted', () => send('progress_account_delete'));

    document.getElementById('feedbackBtn')?.addEventListener('click', () => send('feedback_open'));
    document.getElementById('shareBtn')?.addEventListener('click', () => send('share'));

    if (!isNativeAndroid) {
      document.getElementById('installBtn')?.addEventListener('click', () => send('install_click', { surface:'completion' }));
      document.getElementById('homeInstallBtn')?.addEventListener('click', () => send('install_click', { surface:'home' }));
      window.addEventListener('appinstalled', () => send('install_complete'));
    }

    watchPracticeCompletion();
    watchFeedbackSuccess();
    watchAiGuide();
    bindPrivacyLink();
    bindNativeDiagnostics();

    document.addEventListener('pw:locale-changed', () => {
      syncPrivacyLink();
      syncNoticeCopy();
    });

    if (consent === CONSENT_GRANTED) {
      if (isNativeAndroid) {
        void ensureNativeAnalyticsGranted().then(sendAppOpen);
      } else {
        loadTag();
        sendAppOpen();
      }
    } else if (!consent) {
      showNotice();
    }

    window.PW_ANALYTICS = Object.freeze({
      event: send,
      showSettings: showNotice,
      consent: () => consent,
      surface: () => isNativeAndroid ? 'android' : (isStandalone() ? 'pwa' : 'browser'),
      diagnostics: nativeDiagnosticSnapshot,
      runDiagnostics: runNativeDiagnostic
    });
  }

  init();
})();