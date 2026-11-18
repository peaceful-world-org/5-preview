/* Peaceful World 5 · pt-PT draft; unreleased. */
'use strict';
(() => {
 const draft = {
  "modeUi": {
    "base": "Base",
    "metta": "Bondade amorosa",
    "free": "Prática livre",
    "baseDesc": "Cinco passos para pensar de forma mais pacífica.",
    "mettaDesc": "De ti a todos os seres vivos.",
    "freeDesc": "Um temporizador aberto, ao teu ritmo.",
    "baseMore": "Cinco passos: Pára, Vê um ser vivo, Deseja o bem a alguém, Reduz o dano e Faz uma escolha. Cada passo dura um minuto após uma breve preparação. Não há uma resposta certa a encontrar.",
    "mettaMore": "Cinco direções de bondade: tu, alguém que demonstrou bondade, alguém próximo, alguém que mal conheces e todos os seres vivos. Desejar felicidade e liberdade do sofrimento não exige um sentimento específico nem perdão.",
    "freeMore": "Um temporizador sem duração fixa para uma prática que já conheces. Há uma sugestão opcional. Na aplicação publicada, o teu tempo conta para o total de prática.",
    "choose": "ESCOLHE UMA PRÁTICA",
    "start": "Começar · 5 minutos",
    "startFree": "Começar",
    "details": "Saber mais sobre ",
    "close": "Fechar",
    "total": "de prática",
    "countOne": "prática",
    "countFew": "práticas",
    "countMany": "práticas",
    "sample": "",
    "history": "Total acumulado",
    "new": "NOVA",
    "planned": "Em breve",
    "plannedHeader": "EM BREVE",
    "compassion": "Compaixão",
    "anger": "Lidar com a raiva",
    "kicker": "Prática concluída",
    "outcome": "RESUMO",
    "session": "Esta foi a prática número ",
    "totalTime": "Tempo total de prática",
    "doneStart": "Voltar às práticas",
    "roadmap": "Mais práticas estão previstas",
    "roadmapNote": "Estão previstas outras abordagens.",
    "roadmapLink": "Conhece as próximas práticas (em inglês) →",
    "statusNew": "Nova",
    "doneFree": "Prática livre",
    "infoFallback": "Sobre esta prática",
    "friendlyMetta": "Se quiseres, faz um pequeno gesto de bondade.",
    "infoTime": "Total acumulado",
    "freeDoneSubtitle": "Dedicaste este tempo à prática."
  },
  "metta": {
    "mode": {
      "title": "Bondade amorosa",
      "subtitle": "Mettā · 5 minutos",
      "description": "Cinco minutos para desejares a ti e aos outros felicidade e liberdade do sofrimento."
    },
    "hint": {
      "label": "Exemplo",
      "aria": "Mostrar um exemplo deste passo",
      "continue": "Continuar",
      "dialog": "Exemplo do passo"
    },
    "steps": [
      {
        "id": "metta.self",
        "title": "A ti",
        "guide": "Deseja mentalmente a ti próprio felicidade e liberdade do sofrimento. Se te distraíres, regressa com tranquilidade a esse desejo.",
        "example": "Mesmo num dia difícil, podes desejar o bem a ti próprio. Não precisas de fingir que está tudo bem."
      },
      {
        "id": "metta.kind_person",
        "title": "A quem te ajudou",
        "guide": "Recorda alguém cuja bondade ou apoio te tenha marcado. Deseja a essa pessoa o mesmo que desejaste a ti.",
        "example": "Pode ser um professor ou alguém que te tenha apoiado. No passo seguinte, podes pensar numa pessoa próxima."
      },
      {
        "id": "metta.close_being",
        "title": "A alguém próximo",
        "guide": "Agora pensa em alguém de quem gostas — uma pessoa ou um animal. Deseja-lhe felicidade e liberdade do sofrimento.",
        "example": "Um amigo, um familiar ou um animal de companhia. Escolhe alguém em quem seja fácil pensar agora."
      },
      {
        "id": "metta.neutral_person",
        "title": "A alguém que mal conheces",
        "guide": "Pensa numa pessoa que vês de vez em quando, mas mal conheces. Deseja-lhe o mesmo que desejaste a alguém próximo.",
        "example": "Talvez uma pessoa que trabalha numa loja ou um vizinho que apenas cumprimentas. Não conheces a sua história, mas, tal como tu, quer ser feliz e não sofrer."
      },
      {
        "id": "metta.all_beings",
        "title": "A todos os seres vivos",
        "guide": "Agora alarga o círculo ao mundo inteiro: «Que todos os seres vivos sejam felizes e livres do sofrimento».",
        "example": "Podes pensar em pessoas que vivem longe, em aves à janela ou em animais na floresta. Não precisas de imaginar cada um."
      }
    ],
    "intro": "Começa por ti e alarga gradualmente o círculo de bondade. Não precisas de sentir nada de especial — basta o desejo.",
    "completion": "Se quiseres, faz um pequeno gesto de bondade.",
    "guardrail": "Se pensar em alguém for doloroso, escolhe outra pessoa ou pára. Desejar o bem não significa perdoar nem abdicar dos teus limites."
  },
  "freePractice": {
    "totalLabel": "Tempo dedicado à prática",
    "practiceOne": "prática",
    "practiceFew": "práticas",
    "practiceMany": "práticas",
    "entry": "Prática livre",
    "screenLabel": "PRÁTICA LIVRE",
    "title": "Temporizador",
    "idea": "Pratica durante o tempo de que precisares.",
    "note": "Sem metas nem sequências de dias. Apenas tempo dedicado à prática.",
    "start": "Começar",
    "pause": "Pausa",
    "resume": "Continuar",
    "finish": "Terminar",
    "back": "Voltar",
    "tickingOn": "Tique-taque ligado",
    "tickingOff": "Tique-taque desligado",
    "currentLabel": "PRÁTICA ATUAL",
    "hintTrigger": "Sugestão",
    "hintAria": "O que podes fazer na prática livre",
    "hintTitle": "O que posso fazer aqui?",
    "hintBody1": "Usa este tempo para qualquer exercício que ajude a treinar uma mente mais pacífica — religioso, secular ou terapêutico. Podes acompanhar a respiração, regressar à bondade ou ao perdão, rezar, meditar ou fazer um exercício que já conheças.",
    "hintBody2": "Não existe uma duração certa. Mesmo um período breve dedicado conscientemente à prática importa — por isso o temporizador conta cada segundo.",
    "hintContinue": "Continuar"
  },
  "foundationExamples": {
    "trigger": "Exemplo",
    "triggerAria": "Mostrar um exemplo deste passo",
    "continue": "Continuar",
    "step1": "Por exemplo, podes dar por ti a pensar noutra coisa. Reparar que te distraíste já faz parte do exercício.",
    "step2": "Por exemplo, uma ave do outro lado da janela pode tornar-se parte da paisagem. Tenta vê-la como uma vida própria, independente de ti.",
    "step3": "Por exemplo, podes desejar mentalmente a um amigo ou animal: «Espero que te corra tudo bem». Podes não sentir uma emoção calorosa. Isso não é necessário para o exercício.",
    "step4": "Por exemplo: fumar menos um cigarro, descansar um pouco mais ou dizer não a algo que te possa prejudicar a ti ou a outra pessoa.",
    "step5": "Por exemplo: em vez de apenas «vou tentar ser mais amável», decide: «Quando notar que estou a ficar zangado, faço uma pausa antes de falar para não dizer algo que magoe»."
  },
  "progressSync": {
    "saveTitle": "Guardar progresso",
    "saveBody": "Cópia de segurança opcional das práticas Base e Livre. Por enquanto, o histórico de Bondade amorosa fica guardado apenas neste dispositivo.",
    "saveButton": "Guardar progresso",
    "savedTitle": "Progresso guardado",
    "savedBody": "Podes recuperar o histórico das práticas Base e Livre noutro dispositivo. O de Bondade amorosa fica, por agora, apenas neste dispositivo.",
    "open": "Abrir cópia de segurança",
    "close": "Fechar",
    "dialogTitle": "Guardar progresso",
    "dialogBody": "Sem palavra-passe: vamos enviar-te um código de utilização única por email. Apenas o histórico das práticas Base e Livre é sincronizado; Bondade amorosa fica neste dispositivo por enquanto.",
    "emailLabel": "Email",
    "emailPlaceholder": "nome@exemplo.com",
    "sendCode": "Enviar código",
    "codeTitle": "Verifica o teu email",
    "codeBody": "Introduz o código recebido por email.",
    "codeLabel": "Código",
    "verify": "Confirmar e guardar",
    "resend": "Enviar código novamente",
    "sending": "A enviar…",
    "verifying": "A verificar…",
    "syncing": "A guardar progresso…",
    "success": "Pronto. O teu progresso foi guardado.",
    "sendError": "Não foi possível enviar o código. Tenta novamente.",
    "rateLimitError": "Espera um pouco antes de pedires outro código.",
    "verifyError": "O código é inválido ou expirou. Verifica e tenta novamente.",
    "syncError": "A sessão foi iniciada. O progresso será guardado quando a ligação for restabelecida.",
    "offline": "É necessária uma ligação à internet para guardares o progresso.",
    "privacy": "O teu email é usado apenas para iniciar sessão e recuperar o progresso.",
    "localNote": "Sem iniciares sessão, o progresso continua guardado apenas neste dispositivo.",
    "restore": "Recuperar progresso",
    "manage": "Gerir progresso",
    "manageTitle": "Progresso guardado",
    "manageBody": "A cópia na nuvem está associada a {email}. O progresso deste dispositivo continua guardado localmente.",
    "signOut": "Terminar sessão neste dispositivo",
    "signingOut": "A terminar sessão…",
    "signedOut": "Terminaste a sessão. O progresso local e o da nuvem não foram apagados.",
    "deleteAccount": "Eliminar o progresso na nuvem e a conta",
    "deleteConfirm": "Eliminar a cópia do progresso na nuvem e a conta de acesso? O progresso local neste dispositivo manter-se-á.",
    "deleting": "A eliminar…",
    "deleted": "O progresso na nuvem e a conta foram eliminados. O progresso local mantém-se no dispositivo.",
    "deleteError": "Não foi possível eliminar a conta. Tenta novamente.",
    "manageNote": "A eliminação afeta apenas a cópia na nuvem e a conta de acesso. Para remover os dados locais, limpa separadamente os dados da aplicação."
  }
};
 const pluralCategory = n => Math.abs(Math.trunc(Number(n)||0)) === 1 ? 'one' : 'many';
 window.PW_PT_PT_PREVIEW = Object.freeze({...draft,pluralCategory,formatSeconds(n){const x=Math.max(0,Math.trunc(Number(n)||0));return x+(x===1?' segundo':' segundos');}});
})();
