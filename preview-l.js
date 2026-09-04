/* 5-preview - L production candidate. Preview environment only. */
'use strict';

(() => {
  if (location.hostname !== 'preview-5.peaceful-world.org') return;
  if (window.__PW_PREVIEW_L__) return;
  window.__PW_PREVIEW_L__ = true;

  const STORAGE_KEY = 'pw-preview-design-variant';
  const PARAM_KEY = 'design';
  const SYSTEM_FONT = 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","Helvetica Neue",Arial,sans-serif';
  const root = document.documentElement;
  const initialParam = new URLSearchParams(location.search).get(PARAM_KEY)?.toLowerCase() || '';
  let savedAtBoot = '';
  try { savedAtBoot = localStorage.getItem(STORAGE_KEY) || ''; } catch (_) {}
  const shouldStartL = initialParam === 'l' || (!initialParam && savedAtBoot === 'l');

  const L_VARS = Object.freeze({
    '--bg': '#F9F8F4',
    '--surface': '#FFFFFF',
    '--ink': '#202522',
    '--text': '#3D4541',
    '--muted': '#6B716D',
    '--accent': '#7B8D7B',
    '--accent-text': '#677667',
    '--accent-soft': '#E9EEE8',
    '--line': '#E5E5E0',
    '--shadow': 'none',
    '--pw-preview-font': SYSTEM_FONT
  });

  const style = document.createElement('style');
  style.id = 'pw-preview-l-style';
  style.textContent = `
    /* L - Production Candidate: quiet structure, script-neutral typography. */
    html[data-pw-design="l"] body{font-family:var(--pw-preview-font,${SYSTEM_FONT})!important}

    html[data-pw-design="l"] .five-word{
      font-family:var(--pw-preview-font,${SYSTEM_FONT})!important;
      font-size:1.12rem;
      font-style:normal;
      font-weight:650!important;
      letter-spacing:.02em
    }
    html[data-pw-design="l"] .five-byline{letter-spacing:.175em}

    html[data-pw-design="l"] .primary{
      background:#202522;
      box-shadow:0 8px 20px rgba(32,37,34,.065)
    }

    /* Secondary home actions stay discoverable but lose visual mass. */
    html[data-pw-design="l"] .home-install-area{margin-top:5px}
    html[data-pw-design="l"] .home-install-cta{
      width:auto;
      min-height:44px;
      padding:0 14px;
      border:0;
      border-radius:0;
      background:transparent;
      color:var(--muted);
      font-weight:520;
      box-shadow:none!important;
      text-decoration:underline;
      text-decoration-style:dotted;
      text-decoration-color:rgba(107,113,109,.38);
      text-underline-offset:5px
    }
    html[data-pw-design="l"] .home-install-cta:hover{background:transparent;color:var(--text);box-shadow:none}
    html[data-pw-design="l"] .home-install-area + .howto{margin-top:2px}
    html[data-pw-design="l"] .howto{
      width:min(100%,380px);
      background:transparent;
      border:0;
      border-radius:0;
      box-shadow:none
    }
    html[data-pw-design="l"] .howto summary{
      min-height:44px;
      padding:11px 32px 11px 18px;
      color:var(--muted);
      font-weight:560
    }
    html[data-pw-design="l"] .howto summary::after{right:10px}
    html[data-pw-design="l"] .howto[open] summary{border-bottom:1px solid var(--line)}
    html[data-pw-design="l"] .howto-body{padding-left:14px;padding-right:14px}

    /* The practice container disappears visually but keeps its geometry. */
    html[data-pw-design="l"] .practice-card,
    html[data-pw-design="l"] .practice-card.is-prep,
    html[data-pw-design="l"] .practice-card.is-practice{
      background:transparent!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important
    }
    html[data-pw-design="l"] .practice-card{max-width:510px}
    html[data-pw-design="l"] #stepTitle{
      max-width:460px;
      font-family:var(--pw-preview-font,${SYSTEM_FONT})!important
    }
    html[data-pw-design="l"] .step-guide{
      max-width:420px;
      font-family:var(--pw-preview-font,${SYSTEM_FONT})!important
    }
    html[data-pw-design="l"] .step-number{color:rgba(103,118,103,.20)}

    /* One functional state green: live progress and keyboard focus. */
    html[data-pw-design="l"] .timer-progress{stroke:#6E866E}
    html[data-pw-design="l"] .dot.active::before{
      background:#6E866E;
      box-shadow:0 0 0 5px rgba(110,134,110,.08)
    }
    html[data-pw-design="l"] button:focus-visible,
    html[data-pw-design="l"] summary:focus-visible,
    html[data-pw-design="l"] input:focus-visible,
    html[data-pw-design="l"] textarea:focus-visible{
      outline-color:#6E866E
    }

    /* During the full minute, the clock recedes a little further. */
    html[data-pw-design="l"] .timer-shell.is-practice:not(.ending):not(.paused) .timer-center{opacity:.56}
    html[data-pw-design="l"] .timer-shell.is-practice:not(.ending):not(.paused) .timer-ring{opacity:.66}

    html[data-pw-design="l"] .round-btn,
    html[data-pw-design="l"] .secondary,
    html[data-pw-design="l"] .done-mark{box-shadow:none!important}
    html[data-pw-design="l"] .done-mark{background:transparent}
    html[data-pw-design="l"] .feedback-text,
    html[data-pw-design="l"] .feedback-email{box-shadow:none;background:rgba(255,255,255,.76)}

    /* Quietness is achieved through scale and placement, not opacity. */
    html[data-pw-design="l"] .build-version,
    html[data-pw-design="l"] .home-privacy-link{color:var(--muted);opacity:1!important}
    html[data-pw-design="l"] .locale-switcher,
    html[data-pw-design="l"] .locale-switcher button{color:var(--muted)}

    @media(prefers-reduced-motion:reduce){
      html[data-pw-design="l"] .timer-center,
      html[data-pw-design="l"] .timer-ring{transition-duration:.001ms!important}
    }
  `;
  document.head.appendChild(style);

  function safeWrite(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
  }

  function syncUrl(value) {
    try {
      const url = new URL(location.href);
      url.searchParams.set(PARAM_KEY, value);
      history.replaceState(history.state, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
    } catch (_) {}
  }

  function syncThemeColor() {
    const value = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (!value) return;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = value;
  }

  function syncPressed(selected) {
    document.querySelectorAll('.pw-design-lab button[data-design]').forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.design === selected ? 'true' : 'false');
    });
  }

  function applyL({ announce = true } = {}) {
    root.dataset.pwDesign = 'l';
    Object.entries(L_VARS).forEach(([name, value]) => root.style.setProperty(name, value));
    root.style.setProperty('--pw-preview-build-opacity', '1');
    root.style.setProperty('--pw-preview-privacy-opacity', '1');
    safeWrite('l');
    syncUrl('l');
    syncPressed('l');
    syncThemeColor();

    if (announce) {
      const toast = document.querySelector('.pw-design-lab__name');
      if (toast) {
        toast.textContent = 'L - Production Candidate';
        toast.classList.add('is-visible');
        window.setTimeout(() => toast.classList.remove('is-visible'), 1000);
      }
    }
  }

  function mountButton() {
    const lab = document.querySelector('.pw-design-lab');
    if (!lab || lab.querySelector('button[data-design="l"]')) return false;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pw-design-lab__button';
    button.dataset.design = 'l';
    button.textContent = 'L';
    button.title = 'L - Production Candidate';
    button.setAttribute('aria-label', 'L - Production Candidate');
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => applyL());
    lab.appendChild(button);

    if (shouldStartL) applyL({ announce:false });
    return true;
  }

  /* Keep browser/PWA chrome matched to whichever preview variant is active. */
  new MutationObserver(() => {
    if (root.dataset.pwDesign !== 'l') syncThemeColor();
  }).observe(root, { attributes:true, attributeFilter:['data-pw-design', 'style'] });

  if (!mountButton()) {
    const observer = new MutationObserver(() => {
      if (mountButton()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  window.PW_PREVIEW_L = Object.freeze({ apply:applyL, vars:L_VARS });
})();
