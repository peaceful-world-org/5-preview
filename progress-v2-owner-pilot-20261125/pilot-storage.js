(() => {
  'use strict';
  const prefix = 'pw-progress-owner-pilot-20261125:';
  const scope = getStorage => Object.freeze({
    getItem: key => getStorage().getItem(prefix + key),
    setItem: (key, value) => getStorage().setItem(prefix + key, value),
    removeItem: key => getStorage().removeItem(prefix + key),
  });
  Object.defineProperties(window, {
    PW_PILOT_LOCAL: {value: scope(() => window.localStorage)},
    PW_PILOT_SESSION: {value: scope(() => window.sessionStorage)},
  });
})();
