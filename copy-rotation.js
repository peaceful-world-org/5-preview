/* 5 by Peaceful World — copy rotation scaffold
   The five anchors stay fixed inside each released locale. Only guide variants rotate.
   Rotation activates automatically only when every configured slot for that locale is filled.
*/
'use strict';

(() => {
  const STORAGE_KEY = 'pw-completed-practices';
  const RU_ROTATION_COPY_VERSION = 'ru-rotation-v1';
  const RU_FALLBACK_COPY_VERSION = 'ru-v0.18.50-stable';
  const EXPECTED_SET_IDS = ['set-1', 'set-2', 'set-3', 'set-4', 'set-5', 'set-6', 'set-7'];

  // Canonical Russian production fallback. Keep this byte-stable while RU is the
  // released legacy locale; the i18n pack must match it.
  const ANCHORS = [
    'Остановись',
    'Увидь живое',
    'Пожелай добра',
    'Уменьши вред',
    'Сделай выбор'
  ];

  const FALLBACK_GUIDES = [
    'Найди то, на чём легко сосредоточиться: дыхание, предмет, звук или ощущение в теле. В течение минуты спокойно удерживай на этом внимание. Если отвлечёшься, мягко возвращайся к выбранному.',
    'Начни с себя. Заметь: как и ты, каждое живое существо хочет жить и не хочет страдать. В течение минуты побудь с этой мыслью.',
    'Представь кого-то, кому легко пожелать добра. В течение минуты мысленно возвращайся к добрым пожеланиям.',
    'В течение минуты подумай, как можно уменьшить вред себе или другим.',
    'Прими одно небольшое решение: что сделать или чего не делать в ближайшее время. Представь подходящий момент и мысленно репетируй, как поступишь.'
  ];

  // Fill these 35 Russian slots after editorial selection. Do not change the
  // anchors above. Rotation stays disabled until every slot is non-empty.
  const COPY_SETS = [
    { id:'set-1', guides:[null, null, null, null, null] },
    { id:'set-2', guides:[null, null, null, null, null] },
    { id:'set-3', guides:[null, null, null, null, null] },
    { id:'set-4', guides:[null, null, null, null, null] },
    { id:'set-5', guides:[null, null, null, null, null] },
    { id:'set-6', guides:[null, null, null, null, null] },
    { id:'set-7', guides:[null, null, null, null, null] }
  ];

  const PRACTICE_KEYS = [1, 2, 3, 4, 5].map(number => ({
    title: `practice.step${number}.title`,
    guide: `practice.step${number}.guide`
  }));

  let activeSetId = null;
  let activeCopyVersion = RU_FALLBACK_COPY_VERSION;
  let activeLocale = 'ru';
  let activeCountable = false;
  let activeCompleted = false;
  let activeDemo = false;
  let lastCompletedMeta = null;

  function readCompletedCount() {
    try {
      const value = Number.parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      return Number.isSafeInteger(value) && value >= 0 ? value : 0;
    } catch (_) {
      return 0;
    }
  }

  function writeCompletedCount(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.max(0, value)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function currentLocale() {
    const code = window.PW_I18N?.locale;
    return typeof code === 'string' && code ? code : 'ru';
  }

  function configFor(code) {
    const config = window.PW_I18N?.registry?.locales?.[code];
    if (config) return config;
    if (code === 'ru') {
      return {
        copyVersion: RU_FALLBACK_COPY_VERSION,
        rotationVersion: RU_ROTATION_COPY_VERSION
      };
    }
    return null;
  }

  function rotationSetsFor(code) {
    // EN v1 intentionally has no copy rotation yet. Future locales can add
    // their own independent sets without changing the global practice count.
    return code === 'ru' ? COPY_SETS : [];
  }

  function rotationReadyFor(code) {
    const sets = rotationSetsFor(code);
    if (code !== 'ru') return false;
    if (sets.length !== EXPECTED_SET_IDS.length) return false;
    return sets.every((set, index) =>
      set &&
      set.id === EXPECTED_SET_IDS[index] &&
      Array.isArray(set.guides) &&
      set.guides.length === ANCHORS.length &&
      set.guides.every(isNonEmptyString)
    );
  }

  function buildRussianFallbackSteps(guides = FALLBACK_GUIDES) {
    return ANCHORS.map((title, index) => ({ title, guide: guides[index] }));
  }

  function buildLocaleFallbackSteps(code) {
    if (code === 'ru' && (!window.PW_I18N || window.PW_I18N.locale !== 'ru')) {
      return buildRussianFallbackSteps();
    }

    const i18n = window.PW_I18N;
    if (!i18n || i18n.locale !== code || !i18n.pack) {
      if (code === 'ru') return buildRussianFallbackSteps();
      throw new Error(`[5] Locale pack is not ready for practice: ${code}`);
    }

    const steps = PRACTICE_KEYS.map(keys => ({
      title: i18n.pack[keys.title],
      guide: i18n.pack[keys.guide]
    }));
    if (!steps.every(step => isNonEmptyString(step.title) && isNonEmptyString(step.guide))) {
      throw new Error(`[5] Incomplete practice copy for locale: ${code}`);
    }
    return steps;
  }

  function startSession({ demo = false } = {}) {
    activeCompleted = false;
    activeDemo = Boolean(demo);
    activeCountable = !activeDemo;
    activeLocale = currentLocale();

    const config = configFor(activeLocale);
    if (!config?.copyVersion) {
      throw new Error(`[5] Missing copy version for locale: ${activeLocale}`);
    }

    if (!rotationReadyFor(activeLocale)) {
      activeCopyVersion = config.copyVersion;
      activeSetId = `${activeCopyVersion}${activeDemo ? '-demo' : ''}`;
      return buildLocaleFallbackSteps(activeLocale);
    }

    const sets = rotationSetsFor(activeLocale);
    const completedCount = readCompletedCount();
    const setIndex = activeDemo ? 0 : completedCount % sets.length;
    const set = sets[setIndex];
    const rotationVersion = config.rotationVersion || RU_ROTATION_COPY_VERSION;

    activeSetId = `${rotationVersion}-${set.id}${activeDemo ? '-demo' : ''}`;
    activeCopyVersion = rotationVersion;
    return activeLocale === 'ru'
      ? buildRussianFallbackSteps(set.guides)
      : buildLocaleFallbackSteps(activeLocale);
  }

  function completeSession() {
    if (activeCompleted) return lastCompletedMeta;

    if (activeDemo) {
      activeCompleted = true;
      lastCompletedMeta = {
        practiceNumber: null,
        copyVersion: activeCopyVersion,
        setId: activeSetId,
        locale: activeLocale,
        demo: true
      };
      return lastCompletedMeta;
    }

    if (!activeCountable) return lastCompletedMeta;

    const practiceNumber = readCompletedCount() + 1;
    writeCompletedCount(practiceNumber);
    activeCompleted = true;
    lastCompletedMeta = {
      practiceNumber,
      copyVersion: activeCopyVersion,
      setId: activeSetId,
      locale: activeLocale,
      demo: false
    };
    return lastCompletedMeta;
  }

  window.PW_COPY_ROTATION = {
    startSession,
    completeSession,
    get rotationReady() { return rotationReadyFor(currentLocale()); },
    get copyVersion() { return activeCopyVersion; },
    get currentSetId() { return activeSetId; },
    get currentLocale() { return activeLocale; },
    get completedPracticeCount() { return readCompletedCount(); },
    get lastCompletedPracticeNumber() { return lastCompletedMeta?.practiceNumber ?? null; },
    get lastCompletedCopyVersion() { return lastCompletedMeta?.copyVersion || null; },
    get lastCompletedSetId() { return lastCompletedMeta?.setId || null; },
    get lastCompletedLocale() { return lastCompletedMeta?.locale || null; },
    get lastCompletedWasDemo() { return Boolean(lastCompletedMeta?.demo); }
  };
})();
