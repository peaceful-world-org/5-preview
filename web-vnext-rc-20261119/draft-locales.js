/* Single draft locale registry; never released without registry approval. */
'use strict';
(() => {
  window.PW_DRAFT_LOCALES = Object.freeze({
    uk: window.PW_UK_PREVIEW,
    es: window.PW_ES_PREVIEW,
    'pt-br': window.PW_PT_BR_PREVIEW,
    'pt-pt': window.PW_PT_PT_PREVIEW,
    fr: window.PW_FR_PREVIEW,
    id: window.PW_ID_PREVIEW
  });
})();
