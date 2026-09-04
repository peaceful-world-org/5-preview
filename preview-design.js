/* 5-preview — design comparison lab. Preview environment only. */
'use strict';

(() => {
  if (location.hostname !== 'preview-5.peaceful-world.org') return;
  if (window.__PW_PREVIEW_DESIGN_LAB__) return;
  window.__PW_PREVIEW_DESIGN_LAB__ = true;

  /* Preview is for rapid QA/design review. Reuse the app's built-in demo timing
     (2 s preparation + 5 s practice) and demo session semantics so test runs do
     not increment the normal completed-practice rotation. Add ?timing=full to
     temporarily inspect real 5+60 second timing. */
  const bootParams = new URLSearchParams(location.search);
  if (bootParams.get('timing') !== 'full' && !bootParams.has('demo')) {
    bootParams.set('demo', '1');
    const next = `${location.pathname}?${bootParams.toString()}${location.hash}`;
    location.replace(next);
    return;
  }

  const STORAGE_KEY = 'pw-preview-design-variant';
  const PARAM_KEY = 'design';
  const SYSTEM_FONT = 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","Helvetica Neue",Arial,sans-serif';
  const MODERN_FONT = 'Arial,"Helvetica Neue",Helvetica,sans-serif';
  const EDITORIAL_SERIF = 'Georgia,"Times New Roman",Times,serif';

  const BASE_VARS = Object.freeze({
    '--bg': '#FAFAF7',
    '--surface': '#FFFFFF',
    '--ink': '#202522',
    '--text': '#3D4541',
    '--muted': '#6B716D',
    '--accent': '#7B8D7B',
    '--accent-text': '#677667',
    '--accent-soft': '#E9EEE8',
    '--line': '#E7E9E4',
    '--shadow': '0 18px 48px rgba(33,41,36,.055)',
    '--pw-preview-font': SYSTEM_FONT
  });

  function vars(overrides = {}) {
    return Object.freeze({ ...BASE_VARS, ...overrides });
  }

  const VARIANTS = Object.freeze({
    a: Object.freeze({
      short: 'A',
      name: 'Canonical',
      vars: vars(),
      buildOpacity: '1',
      privacyOpacity: '1'
    }),
    b: Object.freeze({
      short: 'B',
      name: 'Quiet',
      vars: vars(),
      buildOpacity: '.48',
      privacyOpacity: '.58'
    }),
    c: Object.freeze({
      short: 'C',
      name: 'Editorial',
      vars: vars({
        '--accent-text': '#5E6D60',
        '--line': '#E2E3DE'
      }),
      buildOpacity: '.58',
      privacyOpacity: '.68'
    }),
    d: Object.freeze({
      short: 'D',
      name: 'Modern',
      vars: vars({
        '--bg': '#F7F8F5',
        '--surface': '#FFFFFF',
        '--ink': '#171A18',
        '--text': '#343A36',
        '--muted': '#69706C',
        '--accent-text': '#53685A',
        '--line': '#E0E4DF',
        '--pw-preview-font': MODERN_FONT
      }),
      buildOpacity: '.62',
      privacyOpacity: '.72'
    }),
    e: Object.freeze({
      short: 'E',
      name: 'Warm Paper',
      vars: vars({
        '--bg': '#F3EFE6',
        '--surface': '#FFFDF8',
        '--ink': '#2B2924',
        '--text': '#4A463F',
        '--muted': '#756F66',
        '--accent': '#7D8E75',
        '--accent-text': '#65765F',
        '--accent-soft': '#E7EBDD',
        '--line': '#DDD6C9',
        '--shadow': '0 18px 48px rgba(53,46,35,.06)'
      }),
      buildOpacity: '.55',
      privacyOpacity: '.66'
    }),
    f: Object.freeze({
      short: 'F',
      name: 'Radical Minimal',
      vars: vars({
        '--line': '#E1E4DF',
        '--shadow': 'none'
      }),
      buildOpacity: '.42',
      privacyOpacity: '.52'
    }),
    g: Object.freeze({
      short: 'G',
      name: 'Green Identity',
      vars: vars({
        '--bg': '#F5F8F4',
        '--surface': '#FFFFFF',
        '--ink': '#1E2E25',
        '--text': '#34483C',
        '--muted': '#68766E',
        '--accent': '#5F7D68',
        '--accent-text': '#4F6F5A',
        '--accent-soft': '#E3EEE5',
        '--line': '#DCE6DE',
        '--shadow': '0 18px 48px rgba(44,74,55,.065)'
      }),
      buildOpacity: '.55',
      privacyOpacity: '.66'
    }),
    h: Object.freeze({
      short: 'H',
      name: 'Hybrid Candidate',
      vars: vars({
        '--bg': '#F8F5EE',
        '--surface': '#FFFDF9',
        '--ink': '#202522',
        '--text': '#3D4541',
        '--muted': '#6F746F',
        '--accent': '#7B8D7B',
        '--accent-text': '#617260',
        '--accent-soft': '#E9EEE8',
        '--line': '#E5E1D8',
        '--shadow': 'none'
      }),
      buildOpacity: '.46',
      privacyOpacity: '.56'
    })
  });

  const style = document.createElement('style');
  style.id = 'pw-preview-design-style';
  style.textContent = `
    body{font-family:var(--pw-preview-font,${SYSTEM_FONT})!important}
    .build-version{opacity:var(--pw-preview-build-opacity,1)!important}
    .home-privacy-link{opacity:var(--pw-preview-privacy-opacity,1)!important}

    /* B · Quiet — utility UI recedes; the practice CTA stays dominant. */
    html[data-pw-design="b"] .text-action{opacity:.62}
    html[data-pw-design="b"] .howto{border-color:rgba(231,233,228,.62);box-shadow:none}
    html[data-pw-design="b"] .howto summary{color:var(--muted)}
    html[data-pw-design="b"] .five-byline{opacity:.82}

    /* C · Editorial — bookish headings, interface remains utilitarian sans. */
    html[data-pw-design="c"] .five-word,
    html[data-pw-design="c"] .subtitle,
    html[data-pw-design="c"] #stepTitle,
    html[data-pw-design="c"] .done-title,
    html[data-pw-design="c"] .outro-title,
    html[data-pw-design="c"] .feedback-title{
      font-family:${EDITORIAL_SERIF}!important;
      font-weight:600!important;
      letter-spacing:-.025em!important;
    }
    html[data-pw-design="c"] .five-word{font-size:1.22rem;font-style:italic;font-weight:500!important}
    html[data-pw-design="c"] .subtitle{font-size:1.3rem;line-height:1.34;max-width:460px;margin-inline:auto}
    html[data-pw-design="c"] #stepTitle{font-size:clamp(2.55rem,10.6vw,3.85rem);line-height:1.04}
    html[data-pw-design="c"] .practice-card{border-radius:22px}
    html[data-pw-design="c"] .primary{box-shadow:none}

    /* D · Modern — denser product typography and less pill-shaped geometry. */
    html[data-pw-design="d"] .subtitle{font-size:1.34rem;line-height:1.28;letter-spacing:-.025em;font-weight:700}
    html[data-pw-design="d"] .intro{max-width:420px;font-size:1rem;line-height:1.48}
    html[data-pw-design="d"] .primary{border-radius:15px;min-height:56px;box-shadow:0 10px 24px rgba(23,26,24,.11)}
    html[data-pw-design="d"] .howto{border-radius:14px;box-shadow:none}
    html[data-pw-design="d"] .practice-card{border-radius:18px;box-shadow:0 12px 36px rgba(23,26,24,.045)}
    html[data-pw-design="d"] .secondary{border-radius:13px}
    html[data-pw-design="d"] #stepTitle{letter-spacing:-.035em}
    html[data-pw-design="d"] .round-btn{border-radius:13px}
    html[data-pw-design="d"] .round-btn:focus-visible{border-radius:13px}

    /* E · Warm Paper — visibly material, warm, almost printed. */
    html[data-pw-design="e"] .howto,
    html[data-pw-design="e"] .practice-card,
    html[data-pw-design="e"] .round-btn,
    html[data-pw-design="e"] .secondary,
    html[data-pw-design="e"] .done-mark,
    html[data-pw-design="e"] .feedback-text,
    html[data-pw-design="e"] .feedback-email{
      background:rgba(255,253,248,.88)!important;
    }
    html[data-pw-design="e"] .primary{background:#2B2924;box-shadow:0 12px 28px rgba(53,46,35,.13)}
    html[data-pw-design="e"] .practice-card{box-shadow:0 18px 54px rgba(53,46,35,.045)}
    html[data-pw-design="e"] .five-byline,
    html[data-pw-design="e"] .brand-name,
    html[data-pw-design="e"] .kicker{letter-spacing:.18em}

    /* F · Radical Minimal — remove containers, shadows and most ornamental chrome. */
    html[data-pw-design="f"] .primary{box-shadow:none}
    html[data-pw-design="f"] .howto{
      background:transparent;border:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);
      border-radius:0;box-shadow:none
    }
    html[data-pw-design="f"] .howto[open] summary{border-bottom:1px solid var(--line)}
    html[data-pw-design="f"] .practice-card,
    html[data-pw-design="f"] .practice-card.is-prep,
    html[data-pw-design="f"] .practice-card.is-practice{
      background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;
      padding-left:10px;padding-right:10px
    }
    html[data-pw-design="f"] .round-btn,
    html[data-pw-design="f"] .secondary,
    html[data-pw-design="f"] .done-mark{
      background:transparent!important;box-shadow:none!important
    }
    html[data-pw-design="f"] .done-mark{border:0}
    html[data-pw-design="f"] .timer-track{stroke:#E0E4DF}
    html[data-pw-design="f"] .five-brand + .hero-copy{margin-top:34px}
    html[data-pw-design="f"] .intro{max-width:360px}

    /* G · Green Identity — let the Peaceful World green become a real product color. */
    html[data-pw-design="g"] .primary{
      background:#5F7D68;
      box-shadow:0 14px 30px rgba(62,96,72,.18)
    }
    html[data-pw-design="g"] .primary:hover{box-shadow:0 17px 36px rgba(62,96,72,.22)}
    html[data-pw-design="g"] .howto{border-color:#D7E3DA;background:rgba(255,255,255,.82)}
    html[data-pw-design="g"] .practice-card{border-color:#DCE6DE;background:rgba(255,255,255,.86)}
    html[data-pw-design="g"] .done-mark{background:var(--accent-soft);border-color:#D4E2D7}
    html[data-pw-design="g"] .five-byline,
    html[data-pw-design="g"] .brand-name,
    html[data-pw-design="g"] .kicker{color:#4F6F5A}

    /* H · Hybrid Candidate — A/B calm, a little C, a little E, and F-style restraint. */
    html[data-pw-design="h"] .five-word{
      font-family:${EDITORIAL_SERIF}!important;
      font-size:1.2rem;
      font-style:italic;
      font-weight:500!important;
      letter-spacing:.005em;
    }
    html[data-pw-design="h"] .five-byline{opacity:.88;letter-spacing:.175em}
    html[data-pw-design="h"] .primary{
      background:#202522;
      box-shadow:0 10px 24px rgba(32,37,34,.075)
    }
    html[data-pw-design="h"] .home-install-area{margin-top:5px}
    html[data-pw-design="h"] .home-install-cta{
      width:auto;min-height:40px;padding:0 14px;border:0;border-radius:0;background:transparent;
      color:var(--muted);font-weight:500;box-shadow:none!important;text-decoration:underline;
      text-decoration-style:dotted;text-decoration-color:rgba(111,116,111,.45);text-underline-offset:5px
    }
    html[data-pw-design="h"] .home-install-cta:hover{background:transparent;color:var(--text);box-shadow:none}
    html[data-pw-design="h"] .home-install-area + .howto{margin-top:3px}
    html[data-pw-design="h"] .howto{
      width:min(100%,370px);background:transparent;border:0;border-radius:0;box-shadow:none
    }
    html[data-pw-design="h"] .howto summary{
      padding:10px 30px 10px 18px;color:var(--muted);font-weight:560
    }
    html[data-pw-design="h"] .howto summary::after{right:10px}
    html[data-pw-design="h"] .howto[open] summary{border-bottom:1px solid var(--line)}
    html[data-pw-design="h"] .howto-body{padding-left:14px;padding-right:14px}
    html[data-pw-design="h"] .practice-card,
    html[data-pw-design="h"] .practice-card.is-prep,
    html[data-pw-design="h"] .practice-card.is-practice{
      background:rgba(255,253,249,.62)!important;border-color:rgba(229,225,216,.72)!important;
      box-shadow:none!important;border-radius:26px
    }
    html[data-pw-design="h"] .round-btn,
    html[data-pw-design="h"] .secondary,
    html[data-pw-design="h"] .done-mark{box-shadow:none!important}
    html[data-pw-design="h"] .done-mark{background:rgba(255,253,249,.7)}
    html[data-pw-design="h"] .feedback-text,
    html[data-pw-design="h"] .feedback-email{box-shadow:none;background:rgba(255,253,249,.78)}

    .pw-design-lab{
      position:fixed;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));
      z-index:2147483000;display:flex;align-items:center;gap:4px;padding:5px 6px 5px 9px;
      border:1px solid rgba(32,37,34,.12);border-radius:999px;background:rgba(255,255,255,.93);
      box-shadow:0 6px 22px rgba(32,37,34,.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      font-family:${SYSTEM_FONT};color:#3D4541;user-select:none;-webkit-user-select:none
    }
    .pw-design-lab__label{font-size:9px;font-weight:750;letter-spacing:.12em;opacity:.58;padding-right:2px}
    .pw-design-lab__button{
      width:30px;height:30px;padding:0;border:0;border-radius:999px;background:transparent;color:#59615D;
      font:700 11px/1 ${SYSTEM_FONT};cursor:pointer;transition:background .12s ease,color .12s ease,transform .12s ease
    }
    .pw-design-lab__button:hover{background:#F0F2EE}
    .pw-design-lab__button:active{transform:scale(.94)}
    .pw-design-lab__button[aria-pressed="true"]{background:#202522;color:#fff}
    .pw-design-lab__button:focus-visible{outline:2px solid #67766A;outline-offset:2px}
    .pw-design-lab__name{
      position:fixed;top:max(58px,calc(env(safe-area-inset-top) + 58px));right:max(12px,env(safe-area-inset-right));
      z-index:2147483000;padding:7px 10px;border-radius:9px;background:rgba(32,37,34,.92);color:#fff;
      font:600 11px/1.2 ${SYSTEM_FONT};opacity:0;transform:translateY(-3px);pointer-events:none;
      transition:opacity .14s ease,transform .14s ease
    }
    .pw-design-lab__name.is-visible{opacity:1;transform:none}
    @media(max-width:520px){
      .pw-design-lab{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));padding-left:6px;gap:2px}
      .pw-design-lab__label{display:none}
      .pw-design-lab__button{width:27px;height:27px}
      .pw-design-lab__name{top:max(47px,calc(env(safe-area-inset-top) + 47px));right:max(8px,env(safe-area-inset-right))}
    }
  `;
  document.head.appendChild(style);

  const root = document.documentElement;
  const lab = document.createElement('div');
  lab.className = 'pw-design-lab';
  lab.setAttribute('role', 'group');
  lab.setAttribute('aria-label', 'Design comparison');
  lab.innerHTML = '<span class="pw-design-lab__label">DESIGN</span>';

  const nameToast = document.createElement('div');
  nameToast.className = 'pw-design-lab__name';
  nameToast.setAttribute('aria-hidden', 'true');

  let toastTimer = 0;

  function safeRead() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (_) { return ''; }
  }

  function safeWrite(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
  }

  function keyFromUrl() {
    try { return new URLSearchParams(location.search).get(PARAM_KEY)?.toLowerCase() || ''; } catch (_) { return ''; }
  }

  function syncUrl(key) {
    try {
      const url = new URL(location.href);
      url.searchParams.set(PARAM_KEY, key);
      history.replaceState(history.state, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
    } catch (_) {}
  }

  function showName(variant) {
    clearTimeout(toastTimer);
    nameToast.textContent = `${variant.short} · ${variant.name}`;
    nameToast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => nameToast.classList.remove('is-visible'), 1000);
  }

  function apply(key, { announce = true } = {}) {
    const normalized = Object.prototype.hasOwnProperty.call(VARIANTS, key) ? key : 'a';
    const variant = VARIANTS[normalized];

    root.dataset.pwDesign = normalized;
    Object.entries(variant.vars).forEach(([name, value]) => root.style.setProperty(name, value));
    root.style.setProperty('--pw-preview-build-opacity', variant.buildOpacity);
    root.style.setProperty('--pw-preview-privacy-opacity', variant.privacyOpacity);

    lab.querySelectorAll('button[data-design]').forEach(button => {
      const selected = button.dataset.design === normalized;
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    safeWrite(normalized);
    syncUrl(normalized);
    if (announce) showName(variant);
  }

  Object.entries(VARIANTS).forEach(([key, variant]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pw-design-lab__button';
    button.dataset.design = key;
    button.textContent = variant.short;
    button.title = `${variant.short} — ${variant.name}`;
    button.setAttribute('aria-label', `${variant.short} — ${variant.name}`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => apply(key));
    lab.appendChild(button);
  });

  document.body.appendChild(lab);
  document.body.appendChild(nameToast);

  const requested = keyFromUrl();
  const saved = safeRead();
  apply(Object.prototype.hasOwnProperty.call(VARIANTS, requested) ? requested : (Object.prototype.hasOwnProperty.call(VARIANTS, saved) ? saved : 'a'), { announce:false });

  window.PW_PREVIEW_DESIGN = Object.freeze({
    variants: VARIANTS,
    apply,
    get current() { return root.dataset.pwDesign || 'a'; }
  });
})();