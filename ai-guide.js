/* 5 by Peaceful World — ElevenLabs AI Guide */
'use strict';

(() => {
  const WIDGET_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
  const WIDGET_DELAY_MS = 10 * 1000;

  const home = document.getElementById('home');
  const practice = document.getElementById('practice');
  const done = document.getElementById('done');
  const startBtn = document.getElementById('startBtn');

  let widget = null;
  let widgetLocale = '';
  let widgetScriptReady = Boolean(customElements.get('elevenlabs-convai'));
  let widgetScriptLoading = false;
  let widgetRevealTimer = null;
  let widgetSurface = '';
  let widgetRevealReady = false;

  function localeConfig() {
    return window.PW_I18N?.config || null;
  }

  function openExternal(url) {
    if (!url) return { ok:false, reason:'url-unavailable' };
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) return { ok:true, target:'new-tab' };
    location.href = url;
    return { ok:true, target:'same-tab' };
  }

  function clearWidgetRevealTimer() {
    if (widgetRevealTimer === null) return;
    clearTimeout(widgetRevealTimer);
    widgetRevealTimer = null;
  }

  function unmountWidget() {
    if (!widget) return;
    try { widget.remove(); } catch (_) {}
    widget = null;
    widgetLocale = '';
  }

  function shouldShowWidget() {
    return Boolean(home?.classList.contains('active') || done?.classList.contains('active'));
  }

  function activeWidgetSurface() {
    if (home?.classList.contains('active')) return 'home';
    if (done?.classList.contains('active')) return 'done';
    return '';
  }

  function currentAgentId() {
    const value = localeConfig()?.ai?.agentId;
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  }

  function ensureWidgetScript() {
    if (widgetScriptReady || widgetScriptLoading || !currentAgentId()) return;
    widgetScriptLoading = true;
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.type = 'text/javascript';
    script.addEventListener('load', () => {
      widgetScriptLoading = false;
      widgetScriptReady = true;
      syncWidget();
    }, { once:true });
    script.addEventListener('error', () => {
      widgetScriptLoading = false;
    }, { once:true });
    document.head.appendChild(script);
  }

  function mountWidget() {
    const config = localeConfig();
    const agentId = currentAgentId();
    const activeLocale = window.PW_I18N?.locale || document.documentElement.lang || 'ru';

    if (!agentId || !widgetScriptReady || !widgetRevealReady || !shouldShowWidget()) return;
    if (activeWidgetSurface() !== widgetSurface) return;
    if (widget && widgetLocale === activeLocale) return;
    if (widget) unmountWidget();

    const articleUrl = config?.links?.article || '';
    const notebookUrl = config?.links?.notebook || '';

    widget = document.createElement('elevenlabs-convai');
    widgetLocale = activeLocale;
    widget.setAttribute('agent-id', agentId);
    widget.setAttribute('language', activeLocale);
    widget.setAttribute('data-pw-ai-guide', '1');
    widget.setAttribute('data-pw-locale', activeLocale);

    widget.addEventListener('elevenlabs-convai:call', event => {
      if (!event?.detail?.config) return;
      document.dispatchEvent(new CustomEvent('pw:ai-conversation-started'));
      event.detail.config.clientTools = {
        openPracticeArticle: () => openExternal(articleUrl),
        openPracticeNotebook: () => openExternal(notebookUrl),
        startTraining: () => {
          unmountWidget();
          if (!startBtn) return { ok:false, reason:'start-button-missing' };
          startBtn.click();
          return { ok:true };
        }
      };
    });

    document.body.appendChild(widget);
  }

  function beginWidgetSurface(nextSurface) {
    clearWidgetRevealTimer();
    unmountWidget();
    widgetSurface = nextSurface;
    widgetRevealReady = false;

    if (!nextSurface) return;

    ensureWidgetScript();
    widgetRevealTimer = setTimeout(() => {
      widgetRevealTimer = null;
      if (activeWidgetSurface() !== nextSurface) return;
      widgetRevealReady = true;
      syncWidget();
    }, WIDGET_DELAY_MS);
  }

  function syncWidget() {
    const nextSurface = practice?.classList.contains('active') ? '' : activeWidgetSurface();

    if (nextSurface !== widgetSurface) {
      beginWidgetSurface(nextSurface);
      return;
    }

    if (!nextSurface || !currentAgentId()) {
      unmountWidget();
      return;
    }

    ensureWidgetScript();
    if (!widgetRevealReady || !widgetScriptReady) return;
    mountWidget();
  }

  [home, practice, done].filter(Boolean).forEach(screen => {
    new MutationObserver(syncWidget).observe(screen, { attributes:true, attributeFilter:['class'] });
  });

  document.addEventListener('pw:locale-changed', () => {
    unmountWidget();
    syncWidget();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncWidget();
  });

  window.PW_I18N?.ready?.then(syncWidget).catch(() => {});
})();

/* Permanent preview environment: test language/theme utilities and roadmap without touching production. */
if (location.hostname === 'preview-5.peaceful-world.org') {
  const darkPolish = document.createElement('link');
  darkPolish.rel = 'stylesheet';
  darkPolish.href = 'preview-dark-polish.css?v=2';
  document.head.appendChild(darkPolish);

  const utilities = document.createElement('script');
  utilities.src = 'preview-utilities.js?v=2';
  utilities.async = true;
  document.head.appendChild(utilities);

  const roadmap = document.createElement('script');
  roadmap.src = 'preview-roadmap.js?v=2';
  roadmap.async = true;
  document.head.appendChild(roadmap);

  const practiceHints = document.createElement('script');
  practiceHints.src = 'preview-practice-hints.js?v=1';
  practiceHints.async = true;
  document.head.appendChild(practiceHints);

  const loadFreeTimer = () => {
    if (document.querySelector('script[data-pw-free-timer-preview]')) return;
    const freeTimer = document.createElement('script');
    freeTimer.src = 'preview-free-timer.js?v=3';
    freeTimer.async = true;
    freeTimer.dataset.pwFreeTimerPreview = '1';
    document.head.appendChild(freeTimer);
  };
  if (window.PW_I18N?.ready) window.PW_I18N.ready.then(loadFreeTimer, loadFreeTimer);
  else loadFreeTimer();

  (() => {
    const report = document.createElement('button');
    report.type = 'button';
    report.hidden = true;
    report.style.cssText = 'position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(88px,calc(74px + env(safe-area-inset-bottom)));z-index:9999;border:0;background:transparent;padding:5px 7px;color:#68706b;font:500 11px/1.25 Inter,system-ui,sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer;opacity:.82';
    document.body.appendChild(report);

    const isRu = () => String(window.PW_I18N?.locale || document.documentElement.lang || 'ru').toLowerCase().startsWith('ru');
    let aiConversationStarted = false;

    function updateCopy() {
      report.textContent = isRu() ? 'Пожаловаться на ответ AI' : 'Report AI response';
      report.setAttribute('aria-label', report.textContent);
      const badge = document.querySelector('.build-version');
      if (badge) {
        badge.textContent = 'v0.18.52';
        badge.setAttribute('aria-label', isRu() ? 'Версия 0.18.52' : 'Version 0.18.52');
      }
    }

    function syncVisibility() {
      const feedback = document.getElementById('feedback');
      const practice = document.getElementById('practice');
      report.hidden = !aiConversationStarted || !document.querySelector('elevenlabs-convai') || feedback?.classList.contains('active') || practice?.classList.contains('active');
    }

    function setReportMode() {
      const kicker = document.querySelector('#feedbackHeader .feedback-kicker');
      const title = document.getElementById('feedbackTitle');
      const intro = document.querySelector('#feedbackHeader .feedback-intro');
      const label = document.querySelector('label[for="feedbackText"]');
      const textarea = document.getElementById('feedbackText');
      const submit = document.getElementById('feedbackSubmit');
      const optIn = document.getElementById('researchOptin')?.closest('label');
      const optInNote = optIn?.nextElementSibling;

      for (const node of [kicker,title,intro,label,submit]) node?.removeAttribute('data-i18n');
      textarea?.removeAttribute('data-i18n-placeholder');

      if (isRu()) {
        if (kicker) kicker.textContent = 'ЖАЛОБА НА AI-ОТВЕТ';
        if (title) title.textContent = 'Что было не так?';
        if (intro) intro.textContent = 'Опиши проблемный или оскорбительный ответ AI. Сообщение получит Peaceful World и сможет проверить работу проводника.';
        if (label) label.textContent = 'Что произошло';
        if (textarea) textarea.placeholder = 'Кратко опиши ответ и почему он был проблемным…';
        if (submit) submit.textContent = 'Отправить жалобу';
      } else {
        if (kicker) kicker.textContent = 'REPORT AI RESPONSE';
        if (title) title.textContent = 'What went wrong?';
        if (intro) intro.textContent = 'Describe a problematic or offensive AI response. Your report will be sent to Peaceful World for review.';
        if (label) label.textContent = 'What happened';
        if (textarea) textarea.placeholder = 'Briefly describe the response and why it was problematic…';
        if (submit) submit.textContent = 'Send report';
      }

      if (optIn) optIn.hidden = true;
      if (optInNote?.classList.contains('feedback-consent-copy')) optInNote.hidden = true;
      document.getElementById('emailWrap')?.setAttribute('hidden', '');
    }

    report.addEventListener('click', () => {
      document.getElementById('feedbackBtn')?.click();
      requestAnimationFrame(() => {
        setReportMode();
        document.getElementById('feedbackTitle')?.focus({ preventScroll:true });
      });
    });

    new MutationObserver(syncVisibility).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
    document.addEventListener('pw:ai-conversation-started', () => {
      aiConversationStarted = true;
      syncVisibility();
    });
    document.addEventListener('pw:locale-changed', updateCopy);
    updateCopy();
    syncVisibility();
  })();
}
