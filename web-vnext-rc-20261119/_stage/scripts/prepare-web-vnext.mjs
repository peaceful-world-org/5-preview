import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../web-vnext/', import.meta.url));
if (!process.argv[2]) throw new Error('Pass the prepared Web output directory');
const output = resolve(process.argv[2]);
if (resolve(source, '..') === output) throw new Error('Use a separate Web output directory');
const version = 'v0.18.63';
const locales = ['ru', 'en', 'uk', 'es', 'pt-br', 'pt-pt', 'fr', 'id'];
const assets = ['world.css', 'world.js', 'roadmap.json'];
const sourceText = file => readFileSync(resolve(source, file), 'utf8');
const put = (file, text) => writeFileSync(resolve(output, file), text);

function replaceOnce(text, marker, replacement) {
  const pattern = typeof marker === 'string'
    ? new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    : new RegExp(marker.source, marker.flags.replace('g', '') + 'g');
  if ([...text.matchAll(pattern)].length !== 1) throw new Error('Web template anchor changed: ' + marker);
  return text.replace(pattern, replacement);
}

function edit(file, changes) {
  const text = readFileSync(resolve(output, file), 'utf8');
  put(file, changes.reduce((current, [marker, replacement]) => replaceOnce(current, marker, replacement), text));
}

mkdirSync(resolve(output, 'web-vnext'), { recursive: true });
for (const file of assets) copyFileSync(resolve(source, file), resolve(output, 'web-vnext', file));
const vision = JSON.parse(sourceText('vision-data.json'));
put('web-vnext/copy.js', 'window.PW_WEB_COPY = ' + JSON.stringify(vision) + ';\n');

edit('index.html', [
  ['<html lang="ru">', '<html lang="ru" data-pw-web-vnext>'],
  ['</head>', '  <link rel="stylesheet" href="web-vnext/world.css" />\n</head>'],
  ['        <div class="five-brand"', '        <div id="pwWorldHero" class="pw-world-hero">\n          <div class="pw-world-brandline">\n        <div class="five-brand"'],
  [/<p class="subtitle home-headline"([\s\S]*?)<\/p>/, '<h1 class="subtitle home-headline"$1</h1>\n          </div>'],
  ['id="startBtn" type="button" class="primary"', 'id="startBtn" type="button" class="primary" hidden aria-hidden="true" tabindex="-1"'],
  ['        <h2 id="pwModeChoose" class="mode-section-label">', '        </div>\n        <h2 id="pwModeChoose" tabindex="-1" class="mode-section-label">'],
  [/(          <article class="practice-choice practice-choice--foundation"[\s\S]*?)(          <article class="practice-choice practice-choice--free"[\s\S]*?<\/article>\n)/, '$2$1'],
  [/^.*id="pwCardNew".*\n/m, ''],
  [/        <section id="pwModeUpcoming"[\s\S]*?<\/section>\n/, () => sourceText('home.html')],
  [/^.*class="home-privacy-row".*\n/m, ''],
  [/        <div class="preview-done-actions"[\s\S]*?        <\/div>\n/, () => sourceText('done.html')],
  [/        <section id="pwModeRoadmap"[\s\S]*?<\/section>\n/, ''],
  ['  <script src="practice-modes.js"></script>', '  <script src="web-vnext/copy.js"></script>\n  <script src="practice-modes.js"></script>'],
  ['</body>', '  <script src="web-vnext/world.js"></script>\n</body>'],
  ['>v0.18.59</div>', '>' + version + '</div>'],
  ['aria-label="Версия 0.18.59"', 'aria-label="Версия ' + version.slice(1) + '"']
]);

edit('practice-modes.js', [
  ['In the released app, your time contributes to the overall practice total.', 'Your time is added to your overall practice total.'],
  ['function formatTime(s) {', 'function formatTime(s, exact = false) {'],
  [`    if (h > 0) return h + unit[0] + String(m).padStart(2,'0') + unit[1];
    if (m > 0) return m + unit[1];
    return amount + unit[2];`, `    const seconds = amount % 60;
    if (h > 0 || m > 0) {
      const minutes = (h > 0 ? h + unit[0] + String(m).padStart(2,'0') : m) + unit[1];
      return exact && seconds > 0 ? minutes + ' ' + seconds + unit[2] : minutes;
    }
    return seconds + unit[2];`],
  [/    let number=d.guided;[\s\S]*?    \$\('pwModeDoneSummary'\)\?\.setAttribute/, String.raw`    const webText = window.PW_WEB_COPY[locale()] || window.PW_WEB_COPY.en;
    const demo = last?.demo || new URLSearchParams(location.search).has('demo') ||
      location.pathname.endsWith('/demo.html');
    const duration = demo ? null : last?.durationSeconds;
    if (doneLabel && demo) doneLabel.textContent = window.PW_I18N.text('done.demo');
    set('pwModeDoneSummaryHeading',c.outcome);
    set('pwModeDoneSummaryTitle',modeTitle(c,mode));
    const separator = locale() === 'fr' ? '\u00a0: ' : ': ';
    set('pwModeDoneSummaryTime',Number.isFinite(duration) ? webText.sessionTime+separator+formatTime(duration,true) : '');
    set('pwModeDoneSummaryMode',c.totalTime+separator+formatTime(d.seconds));
    $('pwModeDoneSummary')?.setAttribute`],
  ["'aria-label',c.outcome", "'aria-label',webText.outcomeAria"],
  ["$('pwModeBaseStart')?.focus({preventScroll:true});", "$('pwModeChoose')?.focus({preventScroll:true});"],
  ["set('pwModeDoneBackText',c.doneStart);", "set('pwModeDoneBackText', window.PW_WEB_COPY[locale()]?.back || c.doneStart);"],
  ["set('pwModeChoose',c.choose);", "set('pwModeChoose',window.PW_WEB_COPY[locale()]?.choose || c.choose);"]
]);

edit('ai-guide.js', [
  ["      if (privacyRow) privacyRow.insertAdjacentElement", `      const slot = document.getElementById('pwWebAiHome');
      if (slot) {
        slot.replaceWith(homeTrigger);
        homeTrigger.classList.add('pw-world-tool');
      } else if (privacyRow) privacyRow.insertAdjacentElement`],
  ["      if (supportBtn) supportBtn.insertAdjacentElement", `      const slot = document.getElementById('pwWebAiDone');
      if (slot) {
        slot.replaceWith(doneTrigger);
        doneTrigger.classList.add('pw-world-tool');
      } else if (supportBtn) supportBtn.insertAdjacentElement`],
  ['  async function requestGuide(surface) {', () => sourceText('ai-consent.inc.js') + '\n  async function requestGuide(surface) {'],
  [/^    if \(surface !== activeWidgetSurface\(\) \|\| practice\?\.classList\.contains\('active'\)\) return;/m, `    if (!currentAgentId() || cancelConsent || surface !== activeWidgetSurface() || practice?.classList.contains('active')) return;
    if (!await requestConsent() || surface !== activeWidgetSurface()) return;`],
  ["    if (pendingRequestSurface && pendingRequestSurface !== surface) {", `    if (!surface) cancelConsent?.();
    if (pendingRequestSurface && pendingRequestSurface !== surface) {`],
  ["  document.addEventListener('pw:locale-changed', () => {\n    pendingRequestToken", `  document.addEventListener('pw:locale-changed', () => {
    cancelConsent?.();
    pendingRequestToken`],
  ["done.querySelector('#pwModeRoadmap')) return;", "done.querySelector('#pwModeRoadmap') || done.querySelector('#pwWorldDoneOpen')) return;"]
]);

edit('app.js', [
  [/function localizedSeconds\(value\) \{[\s\S]*?\n\}/, `function localizedSeconds(value) {
  const language = currentLocale();
  const format = window.PW_DRAFT_LOCALES?.[language]?.formatSeconds;
  if (typeof format === 'function') return format(value);
  if (language === 'en') return value + (value === 1 ? ' second' : ' seconds');
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return value + ' секунд';
  if (lastDigit === 1) return value + ' секунда';
  if (lastDigit >= 2 && lastDigit <= 4) return value + ' секунды';
  return value + ' секунд';
}`],
  ['Подготовка, осталось {seconds} секунд', 'Подготовка, осталось {seconds}'],
  ['Тренировка, осталось {seconds} секунд', 'Тренировка, осталось {seconds}'],
  ["  announce(i18nText('practice.sr.ended', 'Тренировка завершена.'));\n  focusQuietly(startBtn);", "  announce(i18nText('practice.sr.ended', 'Тренировка завершена.'));\n  focusQuietly($('pwModeChoose'));"],
  ["  show(home);\n  focusQuietly(startBtn);", "  show(home);\n  focusQuietly($('pwModeChoose'));"]
]);
edit('free-practice.js', [
  ["    nativeHistoryReplace('home');\n    renderOdometer();", "    nativeHistoryReplace('home');\n    renderOdometer();\n    document.getElementById('pwModeFreeStart')?.focus({preventScroll:true});"]
]);

edit('step-number.js', [
  ["window.PW_BUILD_VERSION = 'v0.18.59';", "window.PW_BUILD_VERSION = '" + version + "';"],
  [/    const plannedHeading = document.createElement\('p'\);[\s\S]*?    panel.replaceChildren\(fragment\);/, `    const atlas = document.createElement('button');
    atlas.type = 'button';
    atlas.className = 'pw-language-option pw-language-atlas';
    atlas.setAttribute('role', 'menuitem');
    atlas.textContent = (window.PW_WEB_COPY[window.PW_I18N.locale] || window.PW_WEB_COPY.en).menu;
    atlas.addEventListener('click', () => {
      closeLanguagePanel();
      document.dispatchEvent(new Event('pw:open-language-atlas'));
    });
    fragment.appendChild(atlas);
    panel.replaceChildren(fragment);`]
]);
edit('progress-sync.js', [
  ["completionActions.insertAdjacentElement('beforebegin', card)", "completionActions.insertAdjacentElement('afterend', card)"],
  ["document.querySelector('#home .home-privacy-row')", "document.querySelector('#pwWorldExpertInvite')"]
]);
edit('sw.js', [
  ["const VERSION = 'v0.18.59-wave2-eight-locale-release-20261118';", "const VERSION = '" + version + "-web-vnext-2';"],
  ["  '/ai-guide.js',", "  '/ai-guide.js',\n  '/ai-guide.js?v=1',"],
  ["  '/index.html',", "  '/index.html',\n" + [...assets,'copy.js'].map(file => "  '/web-vnext/" + file + "',").join('\n')],
  ["console.warn('[5] precache skipped', asset, error);", "if (asset.startsWith('/web-vnext/') || asset === '/index.html') throw error;\n        console.warn('[5] precache skipped', asset, error);"]
]);

const registry = JSON.parse(readFileSync(resolve(output, 'locales/index.json'), 'utf8'));
for (const locale of ['uk','es','pt-br','pt-pt','id']) registry.locales[locale].copyVersion += '-web-vnext';
put('locales/index.json', JSON.stringify(registry, null, 2) + '\n');
for (const [file, changes] of Object.entries(JSON.parse(sourceText('runtime-edits.json')))) {
  let text = readFileSync(resolve(output, file), 'utf8');
  for (const [from, to, count] of changes) {
    if (text.split(from).length - 1 !== count) throw new Error('Web copy anchor changed: ' + file + '/' + from);
    text = text.replaceAll(from, () => to);
  }
  put(file, text);
}
const edits = JSON.parse(sourceText('locale-edits.json'));
for (const locale of locales) {
  const file = 'locales/' + locale + '.json';
  const pack = JSON.parse(readFileSync(resolve(output, file), 'utf8'));
  for (const [key, value] of Object.entries(edits[locale])) {
    if (!Object.hasOwn(pack, key)) throw new Error('Unknown locale key: ' + locale + '/' + key);
    pack[key] = value;
  }
  pack['build.aria'] = pack['build.aria'].replace('0.18.59', version.slice(1));
  put(file, JSON.stringify(pack, null, 2) + '\n');
}
