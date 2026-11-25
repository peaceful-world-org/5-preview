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

    // Browser language databases differ (notably on mobile). Never show a raw language code.
    const stable = atlas.languageNames;
    const known = stable.en;
    let names;
    try { names = new Intl.DisplayNames([lang], {type:'language'}); } catch (_) {}
    const meaningful = (label, code) => typeof label === 'string' &&
      Boolean(label.trim()) && label.toLowerCase() !== code.toLowerCase() &&
      !/^[a-z]{2,3}$/i.test(label.trim());
    const name = code => {
      const english = known[code];
      if (lang === 'ru') return stable.ru[code] || english;
      if (lang === 'en') return english;
      try {
        if (code === 'kmr') {
          const kurdish = names?.of('ku');
          return meaningful(kurdish, 'ku') ? kurdish + ' (Kurmanji)' : english;
        }
        if (code === 'ro-MD') {
          const romanian = names?.of('ro');
          if (!meaningful(romanian, 'ro')) return english;
          let country = 'Moldova';
          try {
            const localRegion = new Intl.DisplayNames([lang], {type:'region'}).of('MD');
            if (meaningful(localRegion, 'MD')) country = localRegion;
          } catch (_) {}
          return romanian + ' (' + country + ')';
        }
        const localized = names?.of(code);
        return meaningful(localized, code) ? localized : english;
      } catch (_) { return english; }
    };
    const sorter = new Intl.Collator(lang, {sensitivity:'base'});
    const candidates = [...new Set(atlas.waves.flatMap(wave => wave.codes))]
      .map(code => ({code, label:name(code)}))
      .sort((a,b) => sorter.compare(a.label,b.label) || a.code.localeCompare(b.code));
    const list = make('ul', '', 'pw-world-flat-language-list');
    list.append(...candidates.map(({label}) => make('li',label)));
    $('pwWorldCandidateList').replaceChildren(list);

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
    const nativeShare = window.Capacitor?.Plugins?.Share;
    if ((window.PW_NATIVE_IOS || window.PW_NATIVE_ANDROID) && typeof nativeShare?.share === 'function') {
      try { await nativeShare.share(payload); return; }
      catch (error) { if (error?.name === 'AbortError') return; }
    }
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
      // Capacitor local assets can return readable status-zero responses.
      const nativeLocal = (window.PW_NATIVE_IOS || window.PW_NATIVE_ANDROID) &&
        response.status === 0 && response.type === 'basic';
      if (!response.ok && !nativeLocal) throw new Error('Practice atlas unavailable');
      return response.json();
    })
    .then(data => { atlas = data; renderAtlas(); })
    .catch(() => { $('pwWorldCurriculumList').textContent = copy().atlasError; });
})();
