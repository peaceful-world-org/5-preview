/* 5 by Peaceful World — ElevenLabs AI Guide */
'use strict';

(() => {
  const WIDGET_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';

  const home = document.getElementById('home');
  const practice = document.getElementById('practice');
  const done = document.getElementById('done');
  const startBtn = document.getElementById('startBtn');

  let widget = null;
  let widgetLocale = '';
  let widgetScriptReady = Boolean(customElements.get('elevenlabs-convai'));
  let widgetScriptLoading = false;

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

  function unmountWidget() {
    if (!widget) return;
    try { widget.remove(); } catch (_) {}
    widget = null;
    widgetLocale = '';
  }

  function shouldShowWidget() {
    return Boolean(home?.classList.contains('active') || done?.classList.contains('active'));
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

    if (!agentId || !widgetScriptReady || !shouldShowWidget()) return;
    if (widget && widgetLocale === activeLocale) return;
    if (widget) unmountWidget();

    const articleUrl = config?.links?.article || '';
    const notebookUrl = config?.links?.notebook || '';

    widget = document.createElement('elevenlabs-convai');
    widgetLocale = activeLocale;
    widget.setAttribute('agent-id', agentId);
    widget.setAttribute('data-pw-ai-guide', '1');
    widget.setAttribute('data-pw-locale', activeLocale);

    widget.addEventListener('elevenlabs-convai:call', event => {
      if (!event?.detail?.config) return;
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

  function syncWidget() {
    if (practice?.classList.contains('active') || !shouldShowWidget() || !currentAgentId()) {
      unmountWidget();
      return;
    }
    if (!widgetScriptReady) {
      ensureWidgetScript();
      return;
    }
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

/* Permanent preview environment: test language/theme utilities without touching production. */
if (location.hostname === 'preview-5.peaceful-world.org') {
  const utilities = document.createElement('script');
  utilities.src = 'preview-utilities.js?v=1';
  utilities.async = true;
  document.head.appendChild(utilities);
}
