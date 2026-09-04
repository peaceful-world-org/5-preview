/* 5-preview — tiny design comparison lab. Preview environment only. */
'use strict';

(() => {
  if (location.hostname !== 'preview-5.peaceful-world.org') return;
  if (window.__PW_PREVIEW_DESIGN_LAB__) return;
  window.__PW_PREVIEW_DESIGN_LAB__ = true;

  const STORAGE_KEY = 'pw-preview-design-variant';
  const PARAM_KEY = 'design';
  const SYSTEM_FONT = 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","Helvetica Neue",Arial,sans-serif';

  // Future design ideas belong here. Add a new key and the switcher will render it automatically.
  const VARIANTS = Object.freeze({
    a: Object.freeze({
      short: 'A',
      name: 'Original',
      vars: Object.freeze({ '--pw-preview-font': SYSTEM_FONT }),
      markFilter: 'none',
      buildOpacity: '.7',
      privacyOpacity: '.78'
    }),
    b: Object.freeze({
      short: 'B',
      name: 'Text contrast',
      vars: Object.freeze({ '--pw-preview-font': SYSTEM_FONT }),
      markFilter: 'none',
      buildOpacity: '1',
      privacyOpacity: '1'
    })
  });

  const style = document.createElement('style');
  style.id = 'pw-preview-design-style';
  style.textContent = `
    body{font-family:var(--pw-preview-font,${SYSTEM_FONT})!important}
    .five-mark{filter:var(--pw-preview-mark-filter,none);transition:filter .12s ease}
    .build-version{opacity:var(--pw-preview-build-opacity,1)!important}
    .home-privacy-link{opacity:var(--pw-preview-privacy-opacity,1)!important}

    .pw-design-lab{
      position:fixed;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));
      z-index:2147483000;display:flex;align-items:center;gap:5px;padding:5px 6px 5px 9px;
      border:1px solid rgba(32,37,34,.12);border-radius:999px;background:rgba(255,255,255,.91);
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
      z-index:2147483000;padding:6px 9px;border-radius:9px;background:rgba(32,37,34,.9);color:#fff;
      font:600 11px/1.2 ${SYSTEM_FONT};opacity:0;transform:translateY(-3px);pointer-events:none;
      transition:opacity .14s ease,transform .14s ease
    }
    .pw-design-lab__name.is-visible{opacity:1;transform:none}
    @media(max-width:520px){
      .pw-design-lab{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));padding-left:6px}
      .pw-design-lab__label{display:none}
      .pw-design-lab__button{width:28px;height:28px}
      .pw-design-lab__name{top:max(49px,calc(env(safe-area-inset-top) + 49px));right:max(8px,env(safe-area-inset-right))}
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
    toastTimer = window.setTimeout(() => nameToast.classList.remove('is-visible'), 900);
  }

  function apply(key, { announce = true } = {}) {
    const normalized = Object.prototype.hasOwnProperty.call(VARIANTS, key) ? key : 'b';
    const variant = VARIANTS[normalized];

    root.dataset.pwDesign = normalized;
    Object.entries(variant.vars).forEach(([name, value]) => root.style.setProperty(name, value));
    root.style.setProperty('--pw-preview-mark-filter', variant.markFilter);
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
  apply(Object.prototype.hasOwnProperty.call(VARIANTS, requested) ? requested : (Object.prototype.hasOwnProperty.call(VARIANTS, saved) ? saved : 'b'), { announce:false });

  window.PW_PREVIEW_DESIGN = Object.freeze({
    variants: VARIANTS,
    apply,
    get current() { return root.dataset.pwDesign || 'b'; }
  });
})();
