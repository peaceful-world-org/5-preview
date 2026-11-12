/* 5 by Peaceful World — privacy-minimal aggregate analytics. */
'use strict';

(() => {
  const host = String(location.hostname || '').trim().toLowerCase().replace(/\.+$/, '');
  const allowedHosts = new Set([
    '5.peaceful-world.org',
    'android.5.peaceful-world.org'
  ]);

  if (!allowedHosts.has(host)) return;
  if (document.querySelector('script[data-pw-simple-analytics="1"]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://scripts.simpleanalyticscdn.com/latest.js';
  script.dataset.hostname = host;
  script.dataset.strictUtm = 'true';
  script.dataset.pwSimpleAnalytics = '1';
  document.head.appendChild(script);
})();
