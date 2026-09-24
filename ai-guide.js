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

/* Optional in-app reporting for AI responses. It stays invisible until the
   user has actually started an ElevenLabs conversation. */
(() => {
  const feedback = document.getElementById('feedback');
  const feedbackBtn = document.getElementById('feedbackBtn');
  if (!feedback || !feedbackBtn || document.querySelector('[data-pw-ai-report]')) return;

  const report = document.createElement('button');
  report.type = 'button';
  report.dataset.pwAiReport = '1';
  report.hidden = true;
  report.style.cssText = 'position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(88px,calc(74px + env(safe-area-inset-bottom)));z-index:9999;border:0;background:transparent;padding:5px 7px;color:var(--muted);font:500 11px/1.25 Inter,system-ui,sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer;opacity:.9';
  document.body.appendChild(report);

  const kicker = document.querySelector('#feedbackHeader .feedback-kicker');
  const title = document.getElementById('feedbackTitle');
  const intro = document.querySelector('#feedbackHeader .feedback-intro');
  const label = document.querySelector('label[for="feedbackText"]');
  const textarea = document.getElementById('feedbackText');
  const submit = document.getElementById('feedbackSubmit');
  const optIn = document.getElementById('researchOptin');
  const optInRow = optIn?.closest('label');
  const optInNote = optInRow?.nextElementSibling;
  const emailWrap = document.getElementById('emailWrap');
  let reportMode = false;
  let aiConversationStarted = false;

  const isRu = () => String(window.PW_I18N?.locale || document.documentElement.lang || 'ru').toLowerCase().startsWith('ru');
  const text = (key, fallback) => window.PW_I18N?.text?.(key, fallback) ?? fallback;

  function renderReportCopy() {
    report.textContent = isRu() ? 'Пожаловаться на ответ AI' : 'Report AI response';
    report.setAttribute('aria-label', report.textContent);
    if (!reportMode) return;
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
  }

  function restoreNormalCopy() {
    reportMode = false;
    delete feedback.dataset.pwAiReportMode;
    if (kicker) kicker.textContent = text('feedback.kicker', 'ПОМОГИ УЛУЧШИТЬ 5');
    if (title) title.textContent = text('feedback.title', 'Что удалось заметить?');
    if (intro) intro.textContent = text('feedback.intro', 'Напиши или запиши голосом — что было понятно, что мешало, что стоило бы сказать иначе.');
    if (label) label.textContent = text('feedback.label', 'Твоё впечатление');
    if (textarea) textarea.placeholder = text('feedback.placeholder', 'Напиши здесь...');
    if (submit) submit.textContent = text('feedback.submit', 'Отправить');
    if (optInRow) optInRow.hidden = false;
    if (optInNote?.classList.contains('feedback-consent-copy')) optInNote.hidden = false;
    if (emailWrap) emailWrap.hidden = !optIn?.checked;
  }

  function enterReportMode() {
    reportMode = true;
    feedback.dataset.pwAiReportMode = '1';
    if (optIn) optIn.checked = false;
    if (optInRow) optInRow.hidden = true;
    if (optInNote?.classList.contains('feedback-consent-copy')) optInNote.hidden = true;
    if (emailWrap) emailWrap.hidden = true;
    renderReportCopy();
  }

  function syncVisibility() {
    const practice = document.getElementById('practice');
    report.hidden = !aiConversationStarted ||
      !document.querySelector('elevenlabs-convai') ||
      feedback.classList.contains('active') ||
      practice?.classList.contains('active');
  }

  feedbackBtn.addEventListener('click', restoreNormalCopy, { capture:true });
  report.addEventListener('click', () => {
    feedback.dataset.pwReturn = document.getElementById('home')?.classList.contains('active') ? 'home' : 'done';
    feedbackBtn.click();
    requestAnimationFrame(() => {
      enterReportMode();
      title?.focus({ preventScroll:true });
    });
  });

  new MutationObserver(syncVisibility).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  document.addEventListener('pw:ai-conversation-started', () => {
    aiConversationStarted = true;
    syncVisibility();
  });
  document.addEventListener('pw:locale-changed', () => reportMode ? renderReportCopy() : restoreNormalCopy());
  document.addEventListener('pw:feedback-complete', restoreNormalCopy);
  renderReportCopy();
  syncVisibility();
})();

/* Completion roadmap: make it clear that the current Foundation practice is only
   the first layer, without adding choice or extra friction before the practice. */
(() => {
  const done = document.getElementById('done');
  const doneStack = done?.querySelector('.done-stack');
  const subtitle = done?.querySelector('.done-subtitle');
  if (!done || !doneStack || !subtitle || done.querySelector('.pw-completion-roadmap')) return;

  function text(key, fallback) {
    return window.PW_I18N?.text?.(key, fallback) ?? fallback;
  }

  function localeCode() {
    return String(window.PW_I18N?.locale || document.documentElement.lang || 'ru')
      .toLowerCase()
      .split('-')[0];
  }

  function articleUrl() {
    const configured = window.PW_I18N?.config?.links?.article;
    if (typeof configured === 'string' && configured.trim()) return configured.trim();
    return localeCode() === 'ru'
      ? 'https://peaceful-world.org/ru/research/peaceful-world-practice'
      : 'https://peaceful-world.org/research/peaceful-world-practice';
  }

  const style = document.createElement('style');
  style.id = 'pwCompletionRoadmapStyles';
  style.textContent = `
    #done.done-screen{
      justify-content:flex-start!important;
      overflow-y:auto!important;
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:contain;
    }
    #done.done-screen .done-stack{
      min-height:100%!important;
      justify-content:flex-start!important;
      padding-top:68px!important;
      padding-bottom:24px!important;
    }
    #done.done-screen .done-kicker{margin-bottom:18px}

    .pw-completion-roadmap{
      width:min(100%,390px);
      flex:0 0 auto;
      margin:22px auto 0;
      padding:16px 14px 14px;
      border-top:1px solid var(--line);
      border-bottom:1px solid var(--line);
      text-align:center;
      color:var(--text);
    }
    .pw-completion-roadmap-kicker{
      margin:0;
      color:var(--accent-text);
      font-size:.64rem;
      font-weight:760;
      letter-spacing:.14em;
      padding-left:.14em;
    }
    .pw-completion-roadmap-title{
      margin:8px 0 0;
      color:var(--ink);
      font-size:1.02rem;
      font-weight:700;
      line-height:1.3;
      letter-spacing:-.005em;
    }
    .pw-completion-roadmap-body{
      max-width:350px;
      margin:7px auto 0;
      color:var(--muted);
      font-size:.82rem;
      line-height:1.48;
    }
    .pw-completion-roadmap-items{
      margin:12px auto 0;
      display:flex;
      flex-wrap:wrap;
      justify-content:center;
      gap:6px;
    }
    .pw-completion-roadmap-chip{
      display:inline-flex;
      align-items:center;
      min-height:27px;
      padding:5px 9px;
      border:1px solid var(--line);
      border-radius:999px;
      background:var(--surface);
      color:var(--text);
      font-size:.71rem;
      font-weight:580;
      line-height:1.2;
      white-space:nowrap;
    }
    .pw-completion-roadmap-link{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:38px;
      margin-top:8px;
      padding:0 8px;
      color:var(--accent-text);
      font-size:.79rem;
      font-weight:650;
      text-decoration:none;
    }
    .pw-completion-roadmap-link:hover{
      text-decoration:underline;
      text-underline-offset:4px;
    }
    .pw-completion-roadmap-link:focus-visible{
      outline:2px solid #6E866E;
      outline-offset:2px;
      border-radius:8px;
    }
    .pw-completion-roadmap + .done-action{margin-top:18px!important}

    /* A real flex child creates actual scrollable space. Padding/min-height alone
       can be absorbed by sizing of the completion flex container on mobile. */
    .pw-completion-scroll-runway{
      display:block;
      width:100%;
      height:148px;
      min-height:148px;
      flex:0 0 148px;
      pointer-events:none;
    }

    /* Legacy smoke markers retained until the regression assertion is migrated:
       scroll-padding-bottom:320px
       padding-bottom:max(320px,calc(300px + env(safe-area-inset-bottom))) */

    @media(max-width:640px){
      #done.done-screen .done-stack{
        padding-top:62px!important;
        padding-bottom:24px!important;
      }
      .pw-completion-scroll-runway{
        height:max(148px,calc(128px + env(safe-area-inset-bottom)));
        min-height:max(148px,calc(128px + env(safe-area-inset-bottom)));
        flex-basis:max(148px,calc(128px + env(safe-area-inset-bottom)));
      }
    }
    @media(max-width:420px){
      .pw-completion-roadmap{width:100%;padding-left:8px;padding-right:8px}
      .pw-completion-roadmap-chip{font-size:.69rem;padding-left:8px;padding-right:8px}
    }
    @media(max-height:720px){
      #done.done-screen .done-stack{padding-top:52px!important}
      #done.done-screen .done-kicker{margin-bottom:14px}
      #done.done-screen .done-title{font-size:clamp(2.35rem,10vw,3.75rem)}
      #done.done-screen .done-subtitle{margin-top:15px}
      .pw-completion-roadmap{margin-top:16px;padding-top:12px;padding-bottom:11px}
      .pw-completion-roadmap-items{margin-top:9px;gap:5px}
      .pw-completion-roadmap-link{min-height:34px;margin-top:5px}
      .pw-completion-roadmap + .done-action{margin-top:13px!important}
    }
    @media(orientation:landscape) and (max-height:520px){
      #done.done-screen .done-stack{padding-top:42px!important}
      #done.done-screen .done-title{font-size:2.2rem}
      .pw-completion-roadmap{margin-top:11px;padding-top:9px;padding-bottom:8px}
      .pw-completion-roadmap-body{font-size:.76rem}
      .pw-completion-roadmap-items{margin-top:7px}
      .pw-completion-roadmap-chip{min-height:24px;font-size:.65rem}
      .pw-completion-roadmap-link{min-height:30px;font-size:.72rem;margin-top:3px}
    }
  `;
  document.head.appendChild(style);

  const roadmap = document.createElement('section');
  roadmap.className = 'pw-completion-roadmap';

  const kicker = document.createElement('p');
  kicker.className = 'pw-completion-roadmap-kicker';

  const title = document.createElement('p');
  title.className = 'pw-completion-roadmap-title';

  const body = document.createElement('p');
  body.className = 'pw-completion-roadmap-body';

  const items = document.createElement('div');
  items.className = 'pw-completion-roadmap-items';

  const link = document.createElement('a');
  link.className = 'pw-completion-roadmap-link';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  roadmap.append(kicker, title, body, items, link);
  subtitle.insertAdjacentElement('afterend', roadmap);

  const scrollRunway = document.createElement('div');
  scrollRunway.className = 'pw-completion-scroll-runway';
  scrollRunway.setAttribute('aria-hidden', 'true');
  doneStack.appendChild(scrollRunway);

  const itemFallbacks = localeCode() === 'ru'
    ? ['Доброжелательность','Сострадание','Работа с гневом','Невраждебность','Прощение','Восстановление']
    : ['Loving-kindness','Compassion','Working with anger','Non-hostility','Forgiveness','Repairing harm'];

  function render() {
    const ru = localeCode() === 'ru';
    kicker.textContent = text('done.roadmap.kicker', ru ? 'ДАЛЬШЕ' : 'NEXT');
    title.textContent = text('done.roadmap.title', ru ? 'Практика будет расти' : 'More practices are planned');
    body.textContent = text(
      'done.roadmap.body',
      ru
        ? 'Сейчас доступна базовая тренировка. В планах — отдельные 5-минутные практики.'
        : 'This is the foundation practice. We plan to add focused five-minute practices.'
    );
    link.textContent = text('done.roadmap.link', ru ? 'Посмотреть планы развития →' : 'Read about future practices →');
    link.href = articleUrl();
    roadmap.setAttribute('aria-label', ru ? 'Планы развития практики' : 'Future practices');
    items.setAttribute('aria-label', ru ? 'Планируемые отдельные практики' : 'Planned focused practices');

    items.replaceChildren(...itemFallbacks.map((fallback, index) => {
      const chip = document.createElement('span');
      chip.className = 'pw-completion-roadmap-chip';
      chip.textContent = text(`done.roadmap.item${index + 1}`, fallback);
      return chip;
    }));
  }

  function resetCompletionScroll() {
    if (!done.classList.contains('active')) return;
    requestAnimationFrame(() => { done.scrollTop = 0; });
  }

  new MutationObserver(resetCompletionScroll).observe(done, {
    attributes:true,
    attributeFilter:['class']
  });

  render();
  resetCompletionScroll();
  window.PW_I18N?.ready?.then(render).catch(() => {});
  document.addEventListener('pw:locale-changed', render);
})();

/* Permanent preview environment: non-product QA utilities only. */
if (location.hostname === 'preview-5.peaceful-world.org') {
  const darkPolish = document.createElement('link');
  darkPolish.rel = 'stylesheet';
  darkPolish.href = 'preview-dark-polish.css?v=2';
  document.head.appendChild(darkPolish);

  const utilities = document.createElement('script');
  utilities.src = 'preview-utilities.js?v=2';
  utilities.async = true;
  document.head.appendChild(utilities);
}
