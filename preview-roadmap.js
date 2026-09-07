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
      path: 'FULL BODY → FOCUS → CYCLES → САМОСТОЯТЕЛЬНО',
      link: 'Посмотреть планы развития →'
    },
    en: {
      kicker: 'NEXT',
      title: 'The practice will grow',
      body: 'The foundation practice is available now. More focused five-minute practices are planned.',
      items: [
        'Loving-kindness',
        'Compassion',
        'Working with anger',
        'Non-hostility',
        'Forgiveness',
        'Repair'
      ],
      path: 'FULL BODY → FOCUS → CYCLES → INDEPENDENT PRACTICE',
      link: 'See the development roadmap →'
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
    .pw-preview-roadmap{
      width:min(100%,390px);
      margin:25px auto 1px;
      padding:18px 16px 17px;
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
      margin:13px auto 0;
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
    .pw-preview-roadmap-path{
      margin:13px 0 0;
      color:var(--muted);
      font-size:.59rem;
      font-weight:700;
      line-height:1.45;
      letter-spacing:.055em;
    }
    .pw-preview-roadmap-link{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:40px;
      margin-top:7px;
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
    .pw-preview-roadmap + .done-action{
      margin-top:17px!important;
    }
    @media(max-width:420px){
      .pw-preview-roadmap{width:100%;padding-left:8px;padding-right:8px}
      .pw-preview-roadmap-chip{font-size:.69rem;padding-left:8px;padding-right:8px}
    }
    @media(max-height:720px){
      .pw-preview-roadmap{margin-top:18px;padding-top:13px;padding-bottom:12px}
      .pw-preview-roadmap-items{margin-top:10px;gap:5px}
      .pw-preview-roadmap-path{margin-top:10px}
      .pw-preview-roadmap-link{min-height:36px;margin-top:3px}
      .pw-preview-roadmap + .done-action{margin-top:13px!important}
    }
    @media(orientation:landscape) and (max-height:520px){
      .pw-preview-roadmap{margin-top:11px;padding-top:9px;padding-bottom:8px}
      .pw-preview-roadmap-body{font-size:.76rem}
      .pw-preview-roadmap-items{margin-top:7px}
      .pw-preview-roadmap-chip{min-height:24px;font-size:.65rem}
      .pw-preview-roadmap-path{margin-top:7px}
      .pw-preview-roadmap-link{min-height:30px;font-size:.72rem}
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

  const path = document.createElement('p');
  path.className = 'pw-preview-roadmap-path';

  const link = document.createElement('a');
  link.className = 'pw-preview-roadmap-link';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  roadmap.append(kicker, title, body, items, path, link);
  subtitle.insertAdjacentElement('afterend', roadmap);

  function render() {
    const s = strings();
    kicker.textContent = s.kicker;
    title.textContent = s.title;
    body.textContent = s.body;
    path.textContent = s.path;
    link.textContent = s.link;
    link.href = articleUrl();
    roadmap.setAttribute('aria-label', localeCode() === 'ru' ? 'Планы развития практики' : 'Practice roadmap');
    items.setAttribute('aria-label', localeCode() === 'ru' ? 'Планируемые отдельные практики' : 'Planned focused practices');
    items.replaceChildren(...s.items.map(label => {
      const chip = document.createElement('span');
      chip.className = 'pw-preview-roadmap-chip';
      chip.textContent = label;
      return chip;
    }));
  }

  render();
  window.PW_I18N?.ready?.then(render).catch(() => {});
  document.addEventListener('pw:locale-changed', render);
})();
