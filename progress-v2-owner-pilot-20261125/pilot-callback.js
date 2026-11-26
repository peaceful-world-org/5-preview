(() => {
  'use strict';
  const url = new URL(location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const fields = ['code', 'error', 'error_code', 'error_description'];
  const google = url.searchParams.has('pw_google') || fragment.has('pw_google');
  if (!google && !fields.some(key => url.searchParams.has(key) || fragment.has(key))) return;
  let googleURL = google ? url.href : null;
  const values = url.searchParams.getAll('code');
  const failed = fields.slice(1).some(key => url.searchParams.has(key) || fragment.has(key));
  let code = !google && !failed && values.length === 1 && /^[a-zA-Z0-9_-]{20,128}$/.test(values[0]) ? values[0] : null;
  for (const key of fields) url.searchParams.delete(key);
  url.searchParams.delete('pw_google');
  url.hash = '';
  url.searchParams.set('mode','practice');
  history.replaceState(null, '', url);
  Object.defineProperty(window, 'PW_PILOT_CALLBACK', {value:Object.freeze({
    kind: google ? 'google' : 'email',
    failed: !google && (failed || !code),
    takeGoogleURL() {
      const value = googleURL;
      googleURL = null;
      return value;
    },
    takeCode() {
      const value = code;
      code = null;
      return value;
    },
  })});
})();
