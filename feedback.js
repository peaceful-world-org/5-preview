/* 5 by Peaceful World — Feedback Alpha */
'use strict';

(() => {
  const SUPABASE_URL = 'https://iugzwpsjtciyetlomkjo.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoiaXVnendwc2p0Y2l5ZXRsb21ram8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NzQ4MzMxMiwiZXhwIjoyMTAzMDU5MzEyfQ.e-v9tpaTzr3-YF-BqthXvDKNmbrHpeZ6EL5f38UCSUk';
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/submit-feedback`;
  const APP_VERSION = window.PW_BUILD_VERSION || 'v0.18.51-alpha';
  const RU_FALLBACK_COPY_VERSION = 'ru-v0.18.50-stable';
  const MAX_RECORDING_MS = 120000;
  const MAX_SUBMIT_MS = 60000;

  const $ = id => document.getElementById(id);
  const form = $('feedbackForm');
  if (!form) return;

  const feedbackText = $('feedbackText');
  const optIn = $('researchOptin');
  const email = $('feedbackEmail');
  const emailWrap = $('emailWrap');
  const submit = $('feedbackSubmit');
  const status = $('feedbackStatus');
  const recordBtn = $('audioRecordBtn');
  const audioStatus = $('audioStatus');
  const audioPreview = $('audioPreview');
  const audioPlayer = $('audioPlayer');
  const audioPlayBtn = $('audioPlayBtn');
  const audioDuration = $('audioDuration');
  const audioSeek = $('audioSeek');
  const audioDelete = $('audioDeleteBtn');
  const feedbackAudio = $('feedbackAudio');
  const fields = $('feedbackFields');
  const header = $('feedbackHeader');
  const success = $('feedbackSuccess');
  const successBack = $('feedbackSuccessBack');
  const honeypot = $('feedbackWebsite');

  let recorder = null;
  let stream = null;
  let chunks = [];
  let audioBlob = null;
  let audioUrl = null;
  let recordingStartedAt = 0;
  let recordedSeconds = 0;
  let recordingTimer = null;
  let recordingLimitTimer = null;
  let recordingStarting = false;
  let cancelPendingRecording = false;

  function i18nText(key, fallback, vars) {
    return window.PW_I18N?.text?.(key, fallback, vars) ?? fallback;
  }

  function currentLocale() {
    return window.PW_I18N?.locale || document.documentElement.lang || 'ru';
  }

  function currentCopyVersion() {
    return window.PW_I18N?.config?.copyVersion || RU_FALLBACK_COPY_VERSION;
  }

  function setStatus(message = '', type = '') {
    status.textContent = message;
    status.className = `feedback-status${type ? ` ${type}` : ''}`;
  }

  function sessionId() {
    try {
      const key = 'pw-feedback-session-id';
      let id = sessionStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(key, id);
      }
      return id;
    } catch (_) {
      return crypto.randomUUID();
    }
  }

  function completedPracticeMeta() {
    const rotation = window.PW_COPY_ROTATION;
    const practiceNumber = rotation?.lastCompletedPracticeNumber;
    return {
      version: rotation?.lastCompletedCopyVersion || rotation?.copyVersion || currentCopyVersion(),
      key: rotation?.lastCompletedSetId || rotation?.currentSetId || '',
      locale: rotation?.lastCompletedLocale || rotation?.currentLocale || currentLocale(),
      practiceNumber: Number.isSafeInteger(practiceNumber) && practiceNumber > 0 ? practiceNumber : null
    };
  }

  function preferredMimeType() {
    if (!window.MediaRecorder) return '';
    const choices = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    return choices.find(type => MediaRecorder.isTypeSupported(type)) || '';
  }

  function releaseStream() {
    if (!stream) return;
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  function clearRecordingTimers() {
    if (recordingTimer) clearInterval(recordingTimer);
    if (recordingLimitTimer) clearTimeout(recordingLimitTimer);
    recordingTimer = null;
    recordingLimitTimer = null;
  }

  function formatSeconds(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const min = Math.floor(safe / 60);
    const sec = String(safe % 60).padStart(2, '0');
    return `${min}:${sec}`;
  }

  function updateRecordingClock() {
    const elapsed = Math.min(120, Math.floor((Date.now() - recordingStartedAt) / 1000));
    recordedSeconds = elapsed;
    audioStatus.textContent = i18nText('feedback.audio.recording.template', 'Запись идёт · {elapsed} из 2:00', { elapsed: formatSeconds(elapsed) });
  }

  function resetPlayer() {
    try { audioPlayer.pause(); } catch (_) {}
    audioPlayer.currentTime = 0;
    audioPlayBtn.textContent = '▶';
    audioPlayBtn.setAttribute('aria-label', i18nText('feedback.audio.play.aria', 'Прослушать запись'));
    audioSeek.value = '0';
  }

  function idleRecordLabel() {
    return audioBlob ? i18nText('feedback.audio.rerecord', 'Перезаписать') : i18nText('feedback.voice.record', 'Записать голос');
  }

  function clearAudio() {
    if (recorder && recorder.state === 'recording') {
      try { recorder.stop(); } catch (_) {}
    }
    clearRecordingTimers();
    releaseStream();
    resetPlayer();
    audioBlob = null;
    chunks = [];
    recordedSeconds = 0;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = null;
    audioPlayer.removeAttribute('src');
    audioPlayer.load();
    audioPreview.hidden = true;
    feedbackAudio?.classList.remove('recording', 'recorded');
    recordBtn.classList.remove('recording');
    recordBtn.textContent = i18nText('feedback.voice.record', 'Записать голос');
    audioDuration.textContent = '0:00';
    audioStatus.textContent = i18nText('feedback.voice.initial', 'До 2 минут. Запись не отправится, пока ты не нажмёшь «Отправить».');
  }

  async function startRecording() {
    if (recordingStarting) return;
    setStatus();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      audioStatus.textContent = i18nText('feedback.audio.unavailable', 'На этом устройстве запись голоса недоступна. Можно написать текст.');
      recordBtn.disabled = true;
      return;
    }

    recordingStarting = true;
    cancelPendingRecording = false;
    recordBtn.disabled = true;

    try {
      if (audioBlob) {
        resetPlayer();
        audioPreview.hidden = true;
        feedbackAudio?.classList.remove('recorded');
      }

      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelPendingRecording) {
        nextStream.getTracks().forEach(track => track.stop());
        return;
      }
      stream = nextStream;
      chunks = [];
      recordedSeconds = 0;
      const mimeType = preferredMimeType();
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.addEventListener('dataavailable', event => {
        if (event.data && event.data.size) chunks.push(event.data);
      });

      recorder.addEventListener('stop', () => {
        clearRecordingTimers();
        releaseStream();
        recordedSeconds = Math.max(1, Math.min(120, Math.ceil((Date.now() - recordingStartedAt) / 1000)));
        const type = recorder?.mimeType || chunks[0]?.type || 'audio/webm';
        const nextBlob = new Blob(chunks, { type });
        chunks = [];
        recordBtn.classList.remove('recording');
        feedbackAudio?.classList.remove('recording');

        if (!nextBlob.size) {
          audioStatus.textContent = i18nText('feedback.audio.empty', 'Запись не получилась. Попробуй ещё раз.');
          recordBtn.textContent = i18nText('feedback.audio.retry', 'Записать снова');
          return;
        }

        audioBlob = nextBlob;
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
        audioPlayer.load();
        audioPreview.hidden = false;
        feedbackAudio?.classList.add('recorded');
        recordBtn.textContent = i18nText('feedback.audio.rerecord', 'Перезаписать');
        audioDuration.textContent = formatSeconds(recordedSeconds);
        audioStatus.textContent = i18nText('feedback.audio.ready.template', 'Готово · {duration}. Можно прослушать, удалить или отправить.', { duration: formatSeconds(recordedSeconds) });
        resetPlayer();
      }, { once: true });

      recorder.start(250);
      recordingStartedAt = Date.now();
      recordBtn.classList.add('recording');
      feedbackAudio?.classList.add('recording');
      recordBtn.textContent = i18nText('feedback.audio.stop', 'Остановить');
      audioPreview.hidden = true;
      updateRecordingClock();
      recordingTimer = setInterval(updateRecordingClock, 500);
      recordingLimitTimer = setTimeout(() => {
        if (recorder?.state === 'recording') recorder.stop();
      }, MAX_RECORDING_MS);
    } catch (error) {
      releaseStream();
      feedbackAudio?.classList.remove('recording');
      recordBtn.classList.remove('recording');
      recordBtn.textContent = idleRecordLabel();
      audioStatus.textContent = i18nText('feedback.audio.mic_error', 'Не удалось получить доступ к микрофону. Можно написать отзыв текстом.');
      console.warn('Microphone unavailable', error);
    } finally {
      recordingStarting = false;
      cancelPendingRecording = false;
      recordBtn.disabled = false;
    }
  }

  function stopRecording() { if (recorder?.state === 'recording') recorder.stop(); }
  function stopRecordingOnLeave() {
    if (recorder?.state === 'recording') {
      try { recorder.stop(); } catch (_) {}
    } else if (recordingStarting) cancelPendingRecording = true;
  }

  recordBtn?.addEventListener('click', () => recorder?.state === 'recording' ? stopRecording() : startRecording());
  $('feedbackBackBtn')?.addEventListener('click', stopRecordingOnLeave);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    stopRecordingOnLeave();
    if (!success.hidden) restoreForm();
  });
  audioDelete?.addEventListener('click', clearAudio);

  audioPlayBtn?.addEventListener('click', async () => {
    if (!audioBlob) return;
    if (audioPlayer.paused) {
      try { await audioPlayer.play(); } catch (_) {}
    } else audioPlayer.pause();
  });
  audioPlayer?.addEventListener('play', () => {
    audioPlayBtn.textContent = 'Ⅱ';
    audioPlayBtn.setAttribute('aria-label', i18nText('feedback.audio.pause.aria', 'Поставить запись на паузу'));
  });
  audioPlayer?.addEventListener('pause', () => {
    audioPlayBtn.textContent = '▶';
    audioPlayBtn.setAttribute('aria-label', i18nText('feedback.audio.play.aria', 'Прослушать запись'));
  });
  audioPlayer?.addEventListener('ended', resetPlayer);
  audioPlayer?.addEventListener('timeupdate', () => {
    const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0 ? audioPlayer.duration : recordedSeconds;
    if (!duration) return;
    audioSeek.value = String(Math.min(1, audioPlayer.currentTime / duration));
    audioDuration.textContent = `${formatSeconds(audioPlayer.currentTime)} / ${formatSeconds(duration)}`;
  });
  audioSeek?.addEventListener('input', () => {
    const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0 ? audioPlayer.duration : recordedSeconds;
    if (!duration) return;
    audioPlayer.currentTime = Number(audioSeek.value) * duration;
  });

  optIn?.addEventListener('change', () => {
    emailWrap.hidden = !optIn.checked;
    email.required = optIn.checked;
    if (optIn.checked) setTimeout(() => email.focus(), 0);
    else email.setCustomValidity('');
  });

  function resetForm() {
    form.reset();
    emailWrap.hidden = true;
    email.required = false;
    clearAudio();
    setStatus();
  }
  function showSuccess() {
    fields.hidden = true;
    header.hidden = true;
    success.hidden = false;
    $('feedback')?.classList.add('success-mode');
    success.querySelector('h2')?.focus({ preventScroll: true });
  }
  function restoreForm() {
    success.hidden = true;
    fields.hidden = false;
    header.hidden = false;
    $('feedback')?.classList.remove('success-mode');
    resetForm();
  }

  document.addEventListener('pw:practice-started', restoreForm);
  successBack?.addEventListener('click', () => {
    restoreForm();
    document.dispatchEvent(new CustomEvent('pw:feedback-complete'));
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus();
    if (recorder?.state === 'recording') {
      setStatus(i18nText('feedback.submit.stop_recording', 'Сначала останови запись.'), 'error');
      return;
    }

    const message = feedbackText.value.trim();
    const wantsResearch = Boolean(optIn.checked);
    const emailValue = email.value.trim();
    if (wantsResearch && !emailValue) {
      email.focus();
      setStatus(i18nText('feedback.email.required', 'Укажи email, если хочешь участвовать в тестировании.'), 'error');
      return;
    }
    if (wantsResearch && !email.checkValidity()) {
      email.reportValidity();
      return;
    }
    if (!message && !audioBlob && !wantsResearch) {
      feedbackText.focus();
      setStatus(i18nText('feedback.empty.required', 'Напиши несколько слов или запиши голосовое сообщение.'), 'error');
      return;
    }

    const copyMeta = completedPracticeMeta();
    const data = new FormData();
    data.append('message', message);
    data.append('locale', copyMeta.locale || currentLocale());
    data.append('app_version', APP_VERSION);
    data.append('copy_version', copyMeta.version);
    if (copyMeta.key) data.append('copy_key', copyMeta.key);
    if (copyMeta.practiceNumber) data.append('practice_number', String(copyMeta.practiceNumber));
    data.append('feedback_type', 'general');
    data.append('research_opt_in', wantsResearch ? 'true' : 'false');
    data.append('email', wantsResearch ? emailValue : '');
    data.append('session_id', sessionId());
    data.append('page_url', location.href.slice(0, 600));
    data.append('website', honeypot?.value || '');

    if (audioBlob) {
      const type = audioBlob.type || 'audio/webm';
      const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
      data.append('audio', audioBlob, `feedback.${ext}`);
    }

    submit.disabled = true;
    submit.textContent = i18nText('feedback.submitting.button', 'Отправляем…');
    setStatus(i18nText('feedback.saving.status', 'Сохраняем отзыв…'));
    const controller = new AbortController();
    const submitTimeout = setTimeout(() => controller.abort(), MAX_SUBMIT_MS);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: data,
        signal: controller.signal
      });
      let payload = null;
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
      resetForm();
      showSuccess();
    } catch (error) {
      console.error('Feedback submit failed', error);
      const timedOut = error?.name === 'AbortError';
      setStatus(timedOut
        ? i18nText('feedback.timeout', 'Отправка заняла слишком много времени. Проверь интернет и попробуй ещё раз.')
        : i18nText('feedback.send_error', 'Не получилось отправить. Проверь интернет и попробуй ещё раз.'), 'error');
    } finally {
      clearTimeout(submitTimeout);
      submit.disabled = false;
      submit.textContent = i18nText('feedback.submit', 'Отправить');
    }
  });

  function syncDynamicCopy() {
    if (recorder?.state === 'recording') {
      recordBtn.textContent = i18nText('feedback.audio.stop', 'Остановить');
      updateRecordingClock();
    } else {
      recordBtn.textContent = idleRecordLabel();
      audioStatus.textContent = audioBlob
        ? i18nText('feedback.audio.ready.template', 'Готово · {duration}. Можно прослушать, удалить или отправить.', { duration: formatSeconds(recordedSeconds) })
        : i18nText('feedback.voice.initial', 'До 2 минут. Запись не отправится, пока ты не нажмёшь «Отправить».');
    }
    const isPlaying = audioPlayer && !audioPlayer.paused;
    audioPlayBtn?.setAttribute('aria-label', isPlaying
      ? i18nText('feedback.audio.pause.aria', 'Поставить запись на паузу')
      : i18nText('feedback.audio.play.aria', 'Прослушать запись'));
    if (!submit.disabled) submit.textContent = i18nText('feedback.submit', 'Отправить');
  }

  document.addEventListener('pw:locale-changed', syncDynamicCopy);
  window.PW_I18N?.ready?.then(syncDynamicCopy).catch(() => {});

  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    recordBtn.disabled = true;
    audioStatus.textContent = i18nText('feedback.audio.unavailable', 'На этом устройстве запись голоса недоступна. Можно написать текст.');
  }
})();
