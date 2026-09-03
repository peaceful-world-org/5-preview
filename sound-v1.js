/* 5 by Peaceful World — production sound language
   - practice button: boundary bell x1 + haptic
   - minute start after prep: short UI click x1
   - minute end (steps 1–4): select click x1
   - practice finish: boundary bell x1 + haptic
   - tick/tock: final phone-QA level, including displayed 0
*/
'use strict';

(() => {
  const HAPTIC_TRIGGER_MS = 1200;
  const BOUNDARY_CUE_URL = 'boundary-tone.mp3';
  const MINUTE_START_CUE_URL = 'ui-click-tone.mp3';
  const MINUTE_END_CUE_URL = 'minute-end-select.mp3';

  const BOUNDARY_CUE_GAIN_DB = 6;
  const BOUNDARY_CUE_GAIN = Math.pow(10, BOUNDARY_CUE_GAIN_DB / 20);
  const TICK_GAIN_TICK = 0.096;
  const TICK_GAIN_TOCK = 0.108;

  const cueBytesPromises = new Map();
  const cueBufferPromises = new Map();

  function playBoundaryHaptic() {
    try {
      if (typeof navigator.vibrate !== 'function') return false;
      return navigator.vibrate(HAPTIC_TRIGGER_MS);
    } catch (_) {
      return false;
    }
  }

  function fetchCueBytes(url) {
    if (!cueBytesPromises.has(url)) {
      const promise = fetch(url, { cache: 'force-cache' })
        .then(response => {
          if (!response.ok) throw new Error(`Cue HTTP ${response.status}: ${url}`);
          return response.arrayBuffer();
        })
        .catch(error => {
          cueBytesPromises.delete(url);
          throw error;
        });
      cueBytesPromises.set(url, promise);
    }
    return cueBytesPromises.get(url);
  }

  function getCueBuffer(url) {
    try {
      ensureAudio();
      if (!audioCtx) return Promise.resolve(null);
      if (!cueBufferPromises.has(url)) {
        const promise = fetchCueBytes(url)
          .then(bytes => audioCtx.decodeAudioData(bytes.slice(0)))
          .catch(error => {
            cueBufferPromises.delete(url);
            throw error;
          });
        cueBufferPromises.set(url, promise);
      }
      return cueBufferPromises.get(url);
    } catch (_) {
      return Promise.resolve(null);
    }
  }

  async function playAssetCue(url, targetGain = 1) {
    try {
      ensureAudio();
      if (!audioCtx) return false;
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const buffer = await getCueBuffer(url);
      if (!buffer || audioCtx.state !== 'running') return false;

      const safeGain = Math.max(0.05, Math.min(8, Number(targetGain) || 1));
      const source = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      source.buffer = buffer;
      gain.gain.setValueAtTime(safeGain, audioCtx.currentTime);
      source.connect(gain).connect(audioCtx.destination);
      source.start();
      return true;
    } catch (_) {
      return false;
    }
  }

  function playBoundaryCue() {
    return playAssetCue(BOUNDARY_CUE_URL, BOUNDARY_CUE_GAIN);
  }

  function playMinuteStartCue() {
    return playAssetCue(MINUTE_START_CUE_URL);
  }

  function playMinuteEndCue() {
    return playAssetCue(MINUTE_END_CUE_URL);
  }

  [BOUNDARY_CUE_URL, MINUTE_START_CUE_URL, MINUTE_END_CUE_URL]
    .forEach(url => fetchCueBytes(url).catch(() => {}));

  function playTickAtGain(tock = false) {
    try {
      ensureAudio();
      if (!audioCtx || audioCtx.state !== 'running') return;

      const now = audioCtx.currentTime;
      const length = Math.floor(audioCtx.sampleRate * 0.04);
      const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
        const env = Math.exp(-i / (length * 0.15));
        data[i] = (Math.random() * 2 - 1) * env;
      }

      const source = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(tock ? 1300 : 1700, now);
      filter.Q.setValueAtTime(1, now);
      gain.gain.setValueAtTime(tock ? TICK_GAIN_TOCK : TICK_GAIN_TICK, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      source.buffer = buffer;
      source.connect(filter).connect(gain).connect(audioCtx.destination);
      source.start(now);
    } catch (_) {}
  }

  playTick = function(tock = false) {
    playTickAtGain(tock);
  };

  function playSoundCue() {
    if (phase === 'prep') {
      void playMinuteStartCue();
      return;
    }

    if (phase === 'practice' && stepIndex === STEPS.length - 1) {
      playBoundaryHaptic();
      void playBoundaryCue();
    }
  }

  const originalStartStep = startStep;
  startStep = function(animate = false) {
    if (animate && phase === 'practice' && stepIndex > 0) void playMinuteEndCue();
    return originalStartStep(animate);
  };

  startBtn?.addEventListener('click', () => {
    ensureAudio();
    playBoundaryHaptic();
    void playBoundaryCue();
  }, { capture: true });

  window.PW_HAPTIC_TEST = {
    single: () => playBoundaryHaptic(),
    triggerMs: HAPTIC_TRIGGER_MS
  };

  window.PW_SOUND_TEST = {
    boundaryAsset: BOUNDARY_CUE_URL,
    boundaryGainDb: BOUNDARY_CUE_GAIN_DB,
    boundaryCue: () => playBoundaryCue(),
    minuteStartAsset: MINUTE_START_CUE_URL,
    minuteEndAsset: MINUTE_END_CUE_URL,
    minuteStart: () => playMinuteStartCue(),
    minuteEnd: () => playMinuteEndCue(),
    tick: () => playTick(false),
    tock: () => playTick(true),
    tickGain: TICK_GAIN_TICK,
    tockGain: TICK_GAIN_TOCK
  };

  // Base runtime calls these hooks at phase boundaries. All accepted haptics
  // and cue routing now live here, so the generic hook stays intentionally quiet.
  haptic = () => {};
  playBell = playSoundCue;
})();
