/* 5 by Peaceful World — service worker */
const VERSION = 'v0.18.51-alpha-i18n1';
const CORE = 'pw-core-' + VERSION;
const NETWORK_TIMEOUT_MS = 1800;
const IOS_GUIDE_PART_COUNT = 6;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/privacy.html',
  '/privacy.en.html',
  '/styles.css',
  '/feedback.css',
  '/brand.css',
  '/install.css',
  '/step-number.css',
  '/completion-polish.css',
  '/copy-rotation.js',
  '/app.js',
  '/sound-v1.js',
  '/step-number.js',
  '/ios-install-guide.js',
  '/ai-guide.js',
  '/analytics.js',
  '/feedback.js',
  '/i18n.js',
  '/locales/index.json',
  '/locales/ru.json',
  '/locales/en.json',
  '/ios-guide/part01.b64',
  '/ios-guide/part02.b64',
  '/ios-guide/part03.b64',
  '/ios-guide/part04.b64',
  '/ios-guide/part05.b64',
  '/ios-guide/part06.b64',
  '/boundary-tone.mp3',
  '/minute-end-select.mp3',
  '/ui-click-tone.mp3',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-maskable.svg',
  '/five-mark.svg',
  '/icon-v4-192.png',
  '/icon-v4-512.png',
  '/icon-maskable-v4-512.png',
  '/apple-touch-icon-v4.png',
  '/logo.svg',
  '/peaceful-world-logo.png',
  '/demo.html'
];

const NETWORK_FIRST_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.webmanifest']);

async function fetchWithTimeout(request, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    return await fetch(request, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function discoverLocaleAssets() {
  try {
    const response = await fetch(new Request('/locales/index.json', { cache: 'reload' }));
    if (!response || !response.ok) return [];
    const registry = await response.json();
    const locales = registry?.locales && typeof registry.locales === 'object'
      ? registry.locales
      : {};
    const assets = [];

    for (const [code, config] of Object.entries(locales)) {
      if (!/^[a-z0-9-]+$/i.test(code)) continue;
      assets.push(`/locales/${code}.json`);
      if (typeof config?.privacy === 'string' && config.privacy.startsWith('/')) {
        assets.push(config.privacy);
      }

      const assetLocale = typeof config?.iosGuide?.assetLocale === 'string'
        ? config.iosGuide.assetLocale.trim()
        : '';
      if (assetLocale && assetLocale !== 'ru' && /^[a-z0-9-]+$/i.test(assetLocale)) {
        for (let index = 1; index <= IOS_GUIDE_PART_COUNT; index += 1) {
          assets.push(`/assets/ios-guide/${encodeURIComponent(assetLocale)}/part${String(index).padStart(2, '0')}.b64`);
        }
      }
    }

    return [...new Set(assets)];
  } catch (error) {
    console.warn('[5] locale asset discovery skipped', error);
    return [];
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE);
    const localeAssets = await discoverLocaleAssets();
    const assets = [...new Set([...CORE_ASSETS, ...localeAssets])];

    await Promise.all(assets.map(async asset => {
      try {
        const request = new Request(asset, { cache: 'reload' });
        const response = await fetch(request);
        if (!response || !response.ok) throw new Error(`Failed to cache ${asset}`);
        await cache.put(asset, response.clone());
      } catch (error) {
        console.warn('[5] precache skipped', asset, error);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CORE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CORE);
      try {
        const response = await fetchWithTimeout(request, { cache: 'no-store' });
        if (response && response.ok) await cache.put(request, response.clone());
        return response;
      } catch (_) {
        return await cache.match(request) || await cache.match('/index.html') || await cache.match('/') || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  const extension = url.pathname.includes('.') ? url.pathname.slice(url.pathname.lastIndexOf('.')).toLowerCase() : '';
  if (NETWORK_FIRST_EXTENSIONS.has(extension)) {
    event.respondWith((async () => {
      const cache = await caches.open(CORE);
      try {
        const response = await fetchWithTimeout(request, { cache: 'no-store' });
        if (response && response.ok) await cache.put(request, response.clone());
        return response;
      } catch (_) {
        return await cache.match(request) || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CORE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    } catch (_) {
      return cached || new Response('Offline', { status: 503 });
    }
  })());
});
