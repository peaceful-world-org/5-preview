/* 5 by Peaceful World — visual iOS install guide */
'use strict';

(() => {
  const PART_COUNT = 6;
  const guideUrlPromises = new Map();
  let lastTrigger = null;

  function text(key, fallback, vars) {
    return window.PW_I18N?.text?.(key, fallback, vars) ?? fallback;
  }

  function currentAssetBase() {
    const assetLocale = window.PW_I18N?.config?.iosGuide?.assetLocale;
    if (!assetLocale) return '';
    // Preserve the released Russian asset path. New locale assets live in the
    // scalable locale-specific structure without forcing a production move.
    return assetLocale === 'ru'
      ? '/ios-guide'
      : `/assets/ios-guide/${encodeURIComponent(assetLocale)}`;
  }

  function partUrls(assetBase) {
    return Array.from({ length: PART_COUNT }, (_, index) =>
      `${assetBase}/part${String(index + 1).padStart(2, '0')}.b64`
    );
  }

  function loadGuideUrl() {
    const assetBase = currentAssetBase();
    if (!assetBase) return Promise.resolve(null);
    if (guideUrlPromises.has(assetBase)) return guideUrlPromises.get(assetBase);

    const promise = Promise.all(partUrls(assetBase).map(async url => {
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`iOS guide asset failed: ${response.status}`);
      return response.text();
    })).then(parts => {
      const base64 = parts.join('').replace(/\s+/g, '');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
    }).catch(error => {
      guideUrlPromises.delete(assetBase);
      throw error;
    });

    guideUrlPromises.set(assetBase, promise);
    return promise;
  }

  function syncCopy(root = document.getElementById('iosInstallGuide')) {
    if (!root) return;
    const setText = (selector, key, fallback) => {
      const node = root.querySelector(selector);
      if (node) node.textContent = text(key, fallback);
    };

    setText('.ios-install-guide-kicker', 'ios.guide.kicker', 'iPhone · Safari');
    setText('#iosInstallGuideTitle', 'install.title', 'Как установить 5');
    setText('.ios-install-guide-note', 'ios.guide.note', 'Если страница открылась в Telegram — сначала открой её в Safari.');
    setText('[data-ios-guide-loading]', 'ios.guide.loading', 'Загружаю инструкцию…');
    setText('[data-ios-guide-sr]', 'ios.guide.sr', 'В Safari нажми «Поделиться». Выбери «На экран Домой» или «Add to Home Screen». Нажми «Добавить» или «Add». Иконка 5 появится на экране Домой.');
    setText('[data-ios-guide-open]', 'ios.guide.open_image', 'Открыть изображение отдельно');
    setText('.ios-install-guide-done', 'ios.guide.close', 'Закрыть');

    const close = root.querySelector('.ios-install-guide-close');
    if (close) close.setAttribute('aria-label', text('ios.guide.close.aria', 'Закрыть инструкцию'));
    const image = root.querySelector('[data-ios-guide-image]');
    if (image) image.alt = text('ios.guide.image.alt', 'Пошаговая инструкция установки 5 на iPhone: Поделиться, На экран Домой, Добавить.');
  }

  function ensureDialog() {
    let root = document.getElementById('iosInstallGuide');
    if (root) {
      syncCopy(root);
      return root;
    }

    root = document.createElement('div');
    root.id = 'iosInstallGuide';
    root.className = 'ios-install-guide';
    root.hidden = true;
    root.innerHTML = `
      <div class="ios-install-guide-backdrop" data-ios-guide-close></div>
      <section class="ios-install-guide-sheet" role="dialog" aria-modal="true" aria-labelledby="iosInstallGuideTitle">
        <div class="ios-install-guide-head">
          <div>
            <p class="ios-install-guide-kicker"></p>
            <h2 id="iosInstallGuideTitle"></h2>
          </div>
          <button type="button" class="ios-install-guide-close" data-ios-guide-close>×</button>
        </div>
        <p class="ios-install-guide-note"></p>
        <div class="ios-install-guide-image-wrap">
          <p class="ios-install-guide-loading" data-ios-guide-loading></p>
          <img class="ios-install-guide-image" data-ios-guide-image hidden />
        </div>
        <p class="sr-only" data-ios-guide-sr></p>
        <div class="ios-install-guide-actions">
          <a class="ios-install-guide-open" data-ios-guide-open target="_blank" rel="noopener" hidden></a>
          <button type="button" class="ios-install-guide-done" data-ios-guide-close></button>
        </div>
      </section>`;

    document.body.appendChild(root);
    syncCopy(root);
    root.querySelectorAll('[data-ios-guide-close]').forEach(element => {
      element.addEventListener('click', closeGuide);
    });

    return root;
  }

  function closeGuide() {
    const root = document.getElementById('iosInstallGuide');
    if (!root || root.hidden) return;
    root.hidden = true;
    document.documentElement.classList.remove('ios-install-guide-opened');
    try { lastTrigger?.focus({ preventScroll: true }); } catch (_) {}
  }

  async function openGuide(trigger) {
    lastTrigger = trigger || document.activeElement;
    try { await window.PW_I18N?.ready; } catch (_) {}

    const root = ensureDialog();
    syncCopy(root);
    const image = root.querySelector('[data-ios-guide-image]');
    const loading = root.querySelector('[data-ios-guide-loading]');
    const openLink = root.querySelector('[data-ios-guide-open]');

    root.hidden = false;
    document.documentElement.classList.add('ios-install-guide-opened');
    if (loading) {
      loading.hidden = false;
      loading.textContent = text('ios.guide.loading', 'Загружаю инструкцию…');
    }
    if (image) image.hidden = true;
    if (openLink) openLink.hidden = true;
    root.querySelector('.ios-install-guide-close')?.focus({ preventScroll: true });

    const assetBase = currentAssetBase();
    if (!assetBase) {
      if (loading) {
        loading.textContent = text('ios.guide.load_error', 'Не удалось загрузить картинку. В Safari нажми «Поделиться» → «На экран Домой» → «Добавить».');
      }
      return;
    }

    try {
      const guideUrl = await loadGuideUrl();
      if (guideUrl && image) {
        image.src = guideUrl;
        image.hidden = false;
      }
      if (guideUrl && openLink) {
        openLink.href = guideUrl;
        openLink.hidden = false;
      }
      if (loading) loading.hidden = true;
    } catch (_) {
      if (loading) {
        loading.textContent = text('ios.guide.load_error', 'Не удалось загрузить картинку. В Safari нажми «Поделиться» → «На экран Домой» → «Добавить».');
      }
    }
  }

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const root = document.getElementById('iosInstallGuide');
    if (root && !root.hidden) closeGuide();
  });

  document.addEventListener('pw:locale-changed', () => {
    const root = document.getElementById('iosInstallGuide');
    if (root) syncCopy(root);
  });

  window.PW_IOS_INSTALL_GUIDE = {
    open: openGuide,
    preload: loadGuideUrl
  };
})();