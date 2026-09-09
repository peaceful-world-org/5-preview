/* 5-preview — completion roadmap experiment. Preview environment only. */
'use strict';

(() => {
  if (location.hostname !== 'preview-5.peaceful-world.org') return;
  if (window.__PW_PREVIEW_ROADMAP__) return;
  window.__PW_PREVIEW_ROADMAP__ = true;

  const query = new URL(location.href).searchParams;
  if (query.get('roadmap') === 'off') return;

  const done = document.getElementById('done');
  const subtitle = done?.querySelector('.done-subtitle');
  if (!done || !subtitle) return;

  const STRINGS = {
    ru: {
      kicker: 'ДАЛЬШЕ',
      title: 'Практика будет расти',
      body: 'Сейчас доступна базовая тренировка. В планах — отдельные 5-минутные практики.',
      items: [
        'Доброжелательность',
        'Сострадание',
        'Работа с гневом',
        'Невраждебность',
        'Прощение',
        'Восстановление'
      ],
      link: 'Посмотреть планы развития →'
    },
    en: {
      kicker: 'NEXT',
      title: 'More practices are planned',
      body: 'This is the foundation practice. We plan to add focused five-minute practices.',
      items: [
        'Loving-kindness',
        'Compassion',
        'Working with anger',
        'Non-hostility',
        'Forgiveness',
        'Repairing harm'
      ],
      link: 'Read about future practices →'
    }
  };

  function localeCode() {
    return String(window.PW_I18N?.locale || document.documentElement.lang || 'en')
      .toLowerCase()
      .split('-')[0];
  }

  function strings() {
    return STRINGS[localeCode()] || STRINGS.en;
  }

  function articleUrl() {
    const configured = window.PW_I18N?.config?.links?.article;
    if (typeof configured === 'string' && configured.trim()) return configured.trim();
    return localeCode() === 'ru'
      ? 'https://peaceful-world.org/ru/research/peaceful-world-practice'
      : 'https://peaceful-world.org/research/peaceful-world-practice';
  }

  const style = document.createElement('style');
  style.id = 'pw-preview-roadmap-style';
  style.textContent = `
    #done.done-screen{
      justify-content:flex-start!important;
      overflow-y:auto!important;
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:contain;
      scroll-padding-bottom:320px;
    }
    #done.done-screen .done-stack{
      min-height:100%;
      justify-content:flex-start!important;
      padding-top:68px!important;
      padding-bottom:76px!important;
    }
    #done.done-screen .done-kicker{margin-bottom:18px}
    #done.done-screen .done-title{flex:0 0 auto}
    #done.done-screen .done-subtitle{flex:0 0 auto}

    .pw-preview-roadmap{
      width:min(100%,390px);
      flex:0 0 auto;
      margin:22px auto 0;
      padding:16px 14px 14px;
      border-top:1px solid var(--line);
      border-bottom:1px solid var(--line);
      text-align:center;
      color:var(--text);
    }
    .pw-preview-roadmap-kicker{
      margin:0;
      color:var(--accent-text);
      font-size:.64rem;
      font-weight:760;
      letter-spacing:.14em;
      padding-left:.14em;
    }
    .pw-preview-roadmap-title{
      margin:8px 0 0;
      color:var(--ink);
      font-size:1.02rem;
      font-weight:700;
      line-height:1.3;
      letter-spacing:-.005em;
    }
    .pw-preview-roadmap-body{
      max-width:350px;
      margin:7px auto 0;
      color:var(--muted);
      font-size:.82rem;
      line-height:1.48;
    }
    .pw-preview-roadmap-items{
      margin:12px auto 0;
      display:flex;
      flex-wrap:wrap;
      justify-content:center;
      gap:6px;
    }
    .pw-preview-roadmap-chip{
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
    .pw-preview-roadmap-link{
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
    .pw-preview-roadmap-link:hover{
      text-decoration:underline;
      text-underline-offset:4px;
    }
    .pw-preview-roadmap-link:focus-visible{
      outline:2px solid #6E866E;
      outline-offset:2px;
      border-radius:8px;
    }
    html[data-pw-theme="dark"] .pw-preview-roadmap-chip{
      background:#1D211E;
      border-color:var(--line);
    }
    .pw-preview-roadmap + .done-action{margin-top:18px!important}

    @media(max-width:640px){
      #done.done-screen .done-stack{
        padding-top:62px!important;
        padding-bottom:max(320px,calc(300px + env(safe-area-inset-bottom)))!important;
      }
    }
    @media(max-width:420px){
      .pw-preview-roadmap{width:100%;padding-left:8px;padding-right:8px}
      .pw-preview-roadmap-chip{font-size:.69rem;padding-left:8px;padding-right:8px}
    }
    @media(max-height:720px){
      #done.done-screen .done-stack{padding-top:52px!important}
      #done.done-screen .done-kicker{margin-bottom:14px}
      #done.done-screen .done-title{font-size:clamp(2.35rem,10vw,3.75rem)}
      #done.done-screen .done-subtitle{margin-top:15px}
      .pw-preview-roadmap{margin-top:16px;padding-top:12px;padding-bottom:11px}
      .pw-preview-roadmap-items{margin-top:9px;gap:5px}
      .pw-preview-roadmap-link{min-height:34px;margin-top:5px}
      .pw-preview-roadmap + .done-action{margin-top:13px!important}
    }
    @media(orientation:landscape) and (max-height:520px){
      #done.done-screen .done-stack{padding-top:42px!important}
      #done.done-screen .done-title{font-size:2.2rem}
      .pw-preview-roadmap{margin-top:11px;padding-top:9px;padding-bottom:8px}
      .pw-preview-roadmap-body{font-size:.76rem}
      .pw-preview-roadmap-items{margin-top:7px}
      .pw-preview-roadmap-chip{min-height:24px;font-size:.65rem}
      .pw-preview-roadmap-link{min-height:30px;font-size:.72rem;margin-top:3px}
    }
  `;
  document.head.appendChild(style);

  const roadmap = document.createElement('section');
  roadmap.className = 'pw-preview-roadmap';
  roadmap.setAttribute('aria-label', 'Practice roadmap');

  const kicker = document.createElement('p');
  kicker.className = 'pw-preview-roadmap-kicker';

  const title = document.createElement('p');
  title.className = 'pw-preview-roadmap-title';

  const body = document.createElement('p');
  body.className = 'pw-preview-roadmap-body';

  const items = document.createElement('div');
  items.className = 'pw-preview-roadmap-items';
  items.setAttribute('aria-label', 'Planned focused practices');

  const link = document.createElement('a');
  link.className = 'pw-preview-roadmap-link';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  roadmap.append(kicker, title, body, items, link);
  subtitle.insertAdjacentElement('afterend', roadmap);

  function render() {
    const s = strings();
    kicker.textContent = s.kicker;
    title.textContent = s.title;
    body.textContent = s.body;
    link.textContent = s.link;
    link.href = articleUrl();
    roadmap.setAttribute('aria-label', localeCode() === 'ru' ? 'Планы развития практики' : 'Future practices');
    items.setAttribute('aria-label', localeCode() === 'ru' ? 'Планируемые отдельные практики' : 'Planned focused practices');
    items.replaceChildren(...s.items.map(label => {
      const chip = document.createElement('span');
      chip.className = 'pw-preview-roadmap-chip';
      chip.textContent = label;
      return chip;
    }));
  }

  function keepCompletionAtTop() {
    if (!done.classList.contains('active')) return;
    requestAnimationFrame(() => { done.scrollTop = 0; });
  }

  new MutationObserver(keepCompletionAtTop).observe(done, {
    attributes:true,
    attributeFilter:['class']
  });

  render();
  keepCompletionAtTop();
  window.PW_I18N?.ready?.then(render).catch(() => {});
  document.addEventListener('pw:locale-changed', render);
})();