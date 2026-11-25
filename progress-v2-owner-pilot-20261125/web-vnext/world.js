/* Web-only practice atlas and secondary actions. Practice clocks and progress use the released runtime. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const locale = () => window.PW_I18N?.locale || 'ru';
  const copy = () => window.PW_WEB_COPY[locale()] || window.PW_WEB_COPY.en;
  const set = (id, value) => { $(id).textContent = value; };
  const make = (tag, text, className) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const atlasButton = $('pwWorldOpen');
  const atlasPanel = $('pwWorldDetails');
  let atlas;

  function setAtlas(open, focus = false) {
    atlasPanel.hidden = !open;
    atlasButton.setAttribute('aria-expanded', String(open));
    set('pwWorldOpenText', open ? copy().collapse : copy().expand);
    if (focus) {
      atlasButton.scrollIntoView({block:'center'});
      atlasButton.focus({preventScroll:true});
    }
  }

  function renderAtlas() {
    if (!atlas) return;
    const lang = locale();
    const labels = copy();
    $('pwWorldCurriculumList').replaceChildren(...atlas.groups.map((group, index) => {
      const section = make('section', '', 'pw-world-atlas-group');
      const list = make('ul');
      list.append(...group.ideas.map((idea, n) => make('li', labels.ideas[index * 5 + n])));
      section.append(make('h4', labels.groups[index]), list);
      return section;
    }));
    $('pwWorldLiveLocales').replaceChildren(...atlas.available.map(item =>
      make('span', item.label, 'pw-world-language-live')
    ));

    let names;
    try { names = new Intl.DisplayNames([lang], {type:'language'}); } catch (_) {}
    const name = code => {
      if (code === 'kmr') return 'Kurdî (Kurmancî)';
      try { return names?.of(code) || code; } catch (_) { return code; }
    };
    $('pwWorldCandidateList').replaceChildren(...atlas.waves.map((wave, index) => {
      const section = make('div', '', 'pw-world-wave');
      const list = make('div', '', 'pw-world-wave-code-list');
      list.append(...wave.codes.map(code => {
        const translated = name(code);
        const item = make('span', translated, 'pw-world-wave-code');
        try {
          const endonym = new Intl.DisplayNames([code], {type:'language',fallback:'none'}).of(code);
          if (endonym && endonym.toLocaleLowerCase() !== translated.toLocaleLowerCase()) {
            const nativeName = make('span', endonym);
            nativeName.lang = code;
            item.append(' · ', nativeName);
          }
        } catch (_) {}
        return item;
      }));
      section.append(make('h4', labels.waveTitles[index] + ' · ' + wave.codes.length), list);
      return section;
    }));
  }

  function update() {
    const labels = copy();
    const fields = {
      pwWorldTitle: labels.title,
      pwWorldDescription: labels.home,
      pwWorldCurriculumTitle: labels.atlas,
      pwWorldCurriculumCount: labels.ideaCount,
      pwWorldCurriculumNote: labels.ideasNote,
      pwWorldLanguagesTitle: labels.languages,
      pwWorldLanguagesCount: labels.live,
      pwWorldLanguagesNote: labels.langNote,
      pwWorldCandidateSummary: labels.langSummary,
      pwWorldTraditionTitle: labels.traditionTitle,
      pwWorldTraditionStatus: labels.traditionStatus,
      pwWorldTraditionLead: labels.traditionLead,
      pwWorldTraditionDetail: labels.traditionDetail,
      pwWorldExpertHeading: labels.expertHeading,
      pwWorldExpertText: labels.expertText,
      pwWorldDoneOpen: labels.doneOpen,
      pwWorldShareBtn: labels.shareLabel,
      pwWorldSupportHome: labels.supportLabel,
      supportBtn: labels.supportLabel
    };
    for (const [id, value] of Object.entries(fields)) set(id, value);
    $('pwWorldTools').setAttribute('aria-label', labels.toolsAria);
    $('pwWorldDoneActions').setAttribute('aria-label', labels.doneActionsAria);
    const tracks = $('pwWorldThemeChips');
    tracks.setAttribute('aria-label', labels.tracksAria);
    tracks.replaceChildren(...labels.tracks.map(track => make('li', track, 'pw-world-track')));
    for (const link of document.querySelectorAll('#pwWorldTools [data-i18n-link="privacy"], .pw-world-done-tools [data-i18n-link="privacy"]')) {
      link.textContent = labels.privacyLabel;
      link.title = link.getAttribute('aria-label');
    }
    for (const id of ['pwWebAiHomeNote','pwWebAiDoneNote']) {
      const note = $(id);
      note.hidden = Boolean(window.PW_I18N?.config?.ai?.agentId);
      note.textContent = labels.aiAvailability;
    }
    for (const id of ['pwWorldExpertLink','pwWorldExpertInAtlas','pwWorldExpertDone']) {
      const link = $(id);
      link.href = 'mailto:hello@peaceful-world.org?subject=' + encodeURIComponent(labels.expertSubject);
      link.textContent = id === 'pwWorldExpertDone' ? labels.expertShort : labels.expertAction;
    }
    setAtlas(!atlasPanel.hidden);
    renderAtlas();
  }

  atlasButton.addEventListener('click', () => setAtlas(atlasPanel.hidden));
  document.addEventListener('pw:open-language-atlas', () => {
    if ($('done').classList.contains('active')) $('pwModeBack').click();
    setAtlas(true);
    $('pwWorldCandidateDisclosure').open = true;
    const summary = $('pwWorldCandidateSummary');
    summary.scrollIntoView({block:'center'});
    summary.focus({preventScroll:true});
  });
  $('pwWorldDoneOpen').addEventListener('click', () => {
    $('pwModeBack').click();
    requestAnimationFrame(() => setAtlas(true, true));
  });

  $('pwWorldShareBtn').addEventListener('click', async () => {
    const status = $('pwWorldToolsStatus');
    status.textContent = '';
    const payload = {url:shareUrl(), title:i18nText('share.title'), text:i18nText('share.text')};
    if (typeof navigator.share === 'function') {
      try { await navigator.share(payload); return; }
      catch (error) { if (error?.name === 'AbortError') return; }
    }
    status.textContent = (await copyShareLink(payload.url)) ? copy().shareSuccess : copy().shareError;
  });

  document.addEventListener('pw:locale-ready', update);
  document.addEventListener('pw:locale-changed', update);
  window.PW_I18N?.ready.then(update);
  update();
  fetch('web-vnext/roadmap.json')
    .then(response => {
      if (!response.ok) throw new Error('Practice atlas unavailable');
      return response.json();
    })
    .then(data => { atlas = data; renderAtlas(); })
    .catch(() => { $('pwWorldCurriculumList').textContent = copy().atlasError; });
})();
