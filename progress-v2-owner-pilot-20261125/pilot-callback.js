(() => {
  'use strict';
  const url = new URL(location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const fields = ['code', 'error', 'error_code', 'error_description'];
  if (!fields.some(key => url.searchParams.has(key) || fragment.has(key))) return;
  const values = url.searchParams.getAll('code');
  const failed = fields.slice(1).some(key => url.searchParams.has(key) || fragment.has(key));
  let code = !failed && values.length === 1 && /^[a-zA-Z0-9_-]{20,128}$/.test(values[0]) ? values[0] : null;
  for (const key of fields) url.searchParams.delete(key);
  url.hash = '';
  url.searchParams.set('mode','practice');
  history.replaceState(null, '', url);
  Object.defineProperty(window, 'PW_PILOT_CALLBACK', {value:Object.freeze({
    failed: failed || !code,
    takeCode() {
      const value = code;
      code = null;
      return value;
    },
  })});
})();
