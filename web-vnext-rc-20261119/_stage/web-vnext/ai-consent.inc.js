  let cancelConsent = null;

  function requestConsent() {
    const dialog = document.createElement('dialog');
    if (typeof dialog.showModal !== 'function') return Promise.resolve(false);

    const english = window.PW_I18N?.locale === 'en';
    const title = document.createElement('h2');
    const details = document.createElement('p');
    const buttons = document.createElement('div');
    const decline = document.createElement('button');
    const accept = document.createElement('button');

    dialog.className = 'pw-web-ai-consent';
    dialog.setAttribute('aria-labelledby', 'pwAiConsentTitle');
    dialog.setAttribute('aria-describedby', 'pwAiConsentDetails');
    title.id = 'pwAiConsentTitle';
    title.textContent = english ? 'Open the AI Guide?' : 'Открыть AI-проводника?';
    details.id = 'pwAiConsentDetails';
    details.textContent = english
      ? 'The guide is provided by ElevenLabs. If you start a conversation, ElevenLabs processes your messages and, if you use the microphone, your voice.'
      : 'AI-проводник работает на платформе ElevenLabs. Если ты начнёшь разговор, ElevenLabs будет обрабатывать текст твоих сообщений и голос, если ты включишь микрофон.';
    decline.type = accept.type = 'button';
    decline.setAttribute('data-pw-ai-consent-decline', '');
    accept.setAttribute('data-pw-ai-consent-accept', '');
    decline.textContent = english ? 'Cancel' : 'Отмена';
    accept.textContent = english ? 'Open guide' : 'Открыть проводника';
    accept.className = 'primary';
    buttons.appendChild(decline);
    buttons.appendChild(accept);
    dialog.appendChild(title);
    dialog.appendChild(details);
    dialog.appendChild(buttons);

    return new Promise(resolve => {
      const finish = (accepted) => {
        cancelConsent = null;
        if (dialog.open) dialog.close();
        dialog.remove();
        resolve(accepted);
      };
      cancelConsent = () => finish(false);
      decline.addEventListener('click', cancelConsent);
      accept.addEventListener('click', () => finish(true));
      dialog.addEventListener('cancel', event => {
        event.preventDefault();
        finish(false);
      });
      document.body.appendChild(dialog);
      try {
        dialog.showModal();
        decline.focus();
      } catch (_) {
        finish(false);
      }
    });
  }
