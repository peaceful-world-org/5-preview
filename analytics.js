/* 5 by Peaceful World — consent-first product analytics */
'use strict';

(() => {
  const GOOGLE_TAG_ID = 'GT-KVFT6FHN';
  const PRODUCTION_HOST = '5.peaceful-world.org';
  const CONSENT_KEY = 'pw-analytics-consent-v1';
  const CONSENT_GRANTED = 'granted';
  const CONSENT_DENIED = 'denied';

  const params = new URLSearchParams(location.search);
  const isProduction = location.hostname === PRODUCTION_HOST;
  const isQaMode = params.has('debug') || params.has('demo') || location.pathname.endsWith('/demo.html');

  if (!isProduction || isQaMode) return;

  let consent = readConsent();
  let tagLoaded = false;
  let practiceInProgress = false;
  let completionSent = false;
  let feedbackSuccessWasVisible = false;
  let appOpenSent = false;

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
      app_version: window.PW_BUILD_VERSION || 'v0.18.51-alpha',
      app_locale: currentLocale(),
      app_surface: isStandalone() ? 'pwa' : 'browser',
      ...extra
    };
  }

  function isStandalone() {
    return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true);
  }

  function loadTag() {
    if (tagLoaded || consent !== CONSENT_GRANTED) return;
    tagLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_TAG_ID)}`;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    document.head.appendChild(script);

    // Match Google's supported gtag.js initialization order before config/events.
    window.gtag('js', new Date());
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
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
    hideNotice();
    loadTag();
    send('analytics_consent_granted');
    sendAppOpen();
  }

  function denyConsent() {
    writeConsent(CONSENT_DENIED);
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    deleteAnalyticsCookies();
    hideNotice();
  }

  function injectStyles() {
    if (document.getElementById('pwAnalyticsStyles')) return;
    const style = document.createElement('style');
    style.id = 'pwAnalyticsStyles';
    style.textContent = `
      .pw-analytics-notice{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));z-index:1200;width:min(520px,calc(100% - 24px));transform:translateX(-50%);padding:16px;border:1px solid #dedfd9;border-radius:18px;background:rgba(255,255,255,.98);box-shadow:0 14px 44px rgba(33,41,36,.13);color:#202522;font-family:inherit}
      .pw-analytics-notice[hidden]{display:none!important}
      .pw-analytics-copy{margin:0;font-size:14px;line-height:1.5;color:#4f5752}
      .pw-analytics-copy strong{color:#202522}
      .pw-analytics-copy a{color:inherit;text-underline-offset:3px}
      .pw-analytics-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
      .pw-analytics-btn{appearance:none;width:100%;min-height:44px;border:1px solid #d7d9d3;border-radius:999px;background:#fff;color:#202522;padding:9px 14px;font:600 14px/1 inherit;cursor:pointer;text-align:center}
      .pw-analytics-btn.is-primary{border-color:#202522;background:#202522;color:#fff}
    `;
    document.head.appendChild(style);
  }

  function syncNoticeCopy(notice = document.getElementById('pwAnalyticsNotice')) {
    if (!notice) return;
    notice.setAttribute('aria-label', text('analytics.dialog.aria', 'Настройки аналитики'));
    const title = notice.querySelector('[data-analytics-title]');
    const body = notice.querySelector('[data-analytics-body]');
    const more = notice.querySelector('[data-analytics-more]');
    const accept = notice.querySelector('[data-analytics-accept]');
    const decline = notice.querySelector('[data-analytics-decline]');
    if (title) title.textContent = text('analytics.title', 'Разрешить статистику?');
    if (body) body.textContent = text(
      'analytics.body',
      'Она поможет нам видеть, что в приложении работает хорошо, а что стоит улучшить. Мы используем Google Analytics только для общей статистики, без рекламы и рекламной персонализации.'
    );
    if (more) {
      more.textContent = text('analytics.more', 'Подробнее');
      more.setAttribute('href', currentPrivacyUrl());
    }
    if (accept) accept.textContent = text('analytics.accept', 'Разрешить');
    if (decline) decline.textContent = text('analytics.decline', 'Без аналитики');
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
    notice.className = 'pw-analytics-notice';
    notice.setAttribute('role', 'dialog');
    notice.hidden = true;
    notice.innerHTML = `
      <p class="pw-analytics-copy"><strong data-analytics-title></strong><br><span data-analytics-body></span> <a data-analytics-more target="_blank" rel="noopener noreferrer"></a>.</p>
      <div class="pw-analytics-actions">
        <button type="button" class="pw-analytics-btn is-primary" data-analytics-accept></button>
        <button type="button" class="pw-analytics-btn" data-analytics-decline></button>
      </div>`;
    document.body.appendChild(notice);
    notice.querySelector('[data-analytics-accept]')?.addEventListener('click', grantConsent);
    notice.querySelector('[data-analytics-decline]')?.addEventListener('click', denyConsent);
    syncNoticeCopy(notice);
    return notice;
  }

  function showNotice() {
    const notice = ensureNotice();
    notice.hidden = false;
  }

  function hideNotice() {
    const notice = document.getElementById('pwAnalyticsNotice');
    if (notice) notice.hidden = true;
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

  function watchPracticeCompletion() {
    const done = document.getElementById('done');
    if (!done) return;
    const check = () => {
      const active = done.classList.contains('active');
      if (active && practiceInProgress && !completionSent) {
        completionSent = true;
        practiceInProgress = false;
        send('practice_complete');
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

  async function init() {
    try { await window.PW_I18N?.ready; } catch (_) {}

    document.addEventListener('pw:practice-started', () => {
      practiceInProgress = true;
      completionSent = false;
      send('practice_start');
    });

    document.getElementById('feedbackBtn')?.addEventListener('click', () => send('feedback_open'));
    document.getElementById('shareBtn')?.addEventListener('click', () => send('share'));
    document.getElementById('installBtn')?.addEventListener('click', () => send('install_click', { surface:'completion' }));
    document.getElementById('homeInstallBtn')?.addEventListener('click', () => send('install_click', { surface:'home' }));
    window.addEventListener('appinstalled', () => send('install_complete'));

    watchPracticeCompletion();
    watchFeedbackSuccess();
    watchAiGuide();
    bindPrivacyLink();

    document.addEventListener('pw:locale-changed', () => {
      syncPrivacyLink();
      syncNoticeCopy();
    });

    if (consent === CONSENT_GRANTED) {
      loadTag();
      sendAppOpen();
    } else if (!consent) {
      showNotice();
    }

    window.PW_ANALYTICS = Object.freeze({
      event: send,
      showSettings: showNotice,
      consent: () => consent
    });
  }

  init();
})();
