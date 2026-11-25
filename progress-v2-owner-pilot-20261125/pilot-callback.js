(() => {
  'use strict';
  const url = new URL(location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const fields = ['code', 'error', 'error_code', 'error_description'];
  if (!fields.some(key => url.searchParams.has(key) || fragment.has(key))) return;
  const values = url.searchParams.getAll('code');
  const failed = fields.slice(1).some(key => url.searchParams.has(key) || fragment.has(key));
  const code = values.length === 1 && /^[a-zA-Z0-9_-]{20,128}$/.test(values[0]) ? values[0] : null;
  for (const key of fields) url.searchParams.delete(key);
  url.hash = '';
  history.replaceState(null, '', url);
  Object.defineProperty(window, 'PW_PILOT_CALLBACK', {value:Object.freeze({code, failed: failed || !code})});
})();
