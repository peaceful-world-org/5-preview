/* Peaceful World 5 · pt-BR editorial draft; unreleased. */
'use strict';
(() => {
 const draft = {
  "modeUi": {
    "base": "Base",
    "metta": "Benevolência",
    "free": "Prática livre",
    "baseDesc": "Cinco etapas para pensar de forma mais pacífica.",
    "mettaDesc": "De você a todos os seres vivos.",
    "freeDesc": "Um cronômetro aberto, no seu ritmo.",
    "baseMore": "Cinco etapas: Pare, Veja um ser vivo, Deseje o bem a alguém, Reduza os danos e Faça uma escolha. Cada etapa dura um minuto após uma breve preparação. Não há uma resposta certa a encontrar.",
    "mettaMore": "Cinco direções de benevolência: você, alguém que mostrou gentileza, alguém próximo, alguém que você mal conhece e todos os seres vivos. Desejar felicidade e liberdade do sofrimento não exige um sentimento específico nem perdão.",
    "freeMore": "Um cronômetro sem duração fixa para uma prática que você já conhece. Há uma dica opcional. Seu tempo conta para o total de prática.",
    "choose": "ESCOLHA UMA PRÁTICA",
    "start": "Começar · 5 minutos",
    "startFree": "Começar",
    "details": "Saiba mais sobre ",
    "close": "Fechar",
    "total": "de prática",
    "countOne": "prática",
    "countFew": "práticas",
    "countMany": "práticas",
    "sample": "",
    "history": "Total geral",
    "new": "NOVA",
    "planned": "Previsto",
    "plannedHeader": "PREVISTO",
    "compassion": "Compaixão",
    "anger": "Lidar com a raiva",
    "kicker": "Prática concluída",
    "outcome": "RESUMO",
    "session": "Esta foi a prática número ",
    "totalTime": "Tempo total de prática",
    "doneStart": "Voltar às práticas",
    "roadmap": "Mais práticas estão previstas",
    "roadmapNote": "Outras abordagens estão previstas.",
    "roadmapLink": "Conheça as próximas práticas (em inglês) →",
    "statusNew": "Nova",
    "doneFree": "Prática livre",
    "infoFallback": "Sobre esta prática",
    "friendlyMetta": "Se quiser, faça um pequeno gesto de bondade.",
    "infoTime": "Total geral",
    "freeDoneSubtitle": "Você dedicou este tempo à prática."
  },
  "metta": {
    "mode": {
      "title": "Benevolência",
      "subtitle": "Mettā · 5 minutos",
      "description": "Cinco minutos para desejar a você e aos outros felicidade e liberdade do sofrimento."
    },
    "hint": {
      "label": "Exemplo",
      "aria": "Mostrar um exemplo desta etapa",
      "continue": "Continuar",
      "dialog": "Exemplo da etapa"
    },
    "steps": [
      {
        "id": "metta.self",
        "title": "Para você",
        "guide": "Em silêncio, deseje a si mesmo felicidade e liberdade do sofrimento. Se sua mente se distrair, volte gentilmente a esse desejo.",
        "example": "Mesmo em um dia difícil, você pode desejar o bem a si. Não precisa fingir que está tudo bem."
      },
      {
        "id": "metta.kind_person",
        "title": "A quem ajudou você",
        "guide": "Lembre-se de alguém cuja bondade ou apoio tenha marcado você. Deseje a essa pessoa o mesmo que desejou a si.",
        "example": "Pode ser um professor ou alguém que ofereceu apoio. Na próxima etapa, você poderá pensar em alguém próximo."
      },
      {
        "id": "metta.close_being",
        "title": "A alguém próximo",
        "guide": "Agora pense em alguém de quem você gosta — uma pessoa ou um animal. Deseje-lhe felicidade e liberdade do sofrimento.",
        "example": "Um amigo, alguém da família ou um animal de estimação. Escolha alguém em quem seja fácil pensar agora."
      },
      {
        "id": "metta.neutral_person",
        "title": "A quem você mal conhece",
        "guide": "Pense em uma pessoa que você vê de vez em quando, mas mal conhece. Deseje a ela o mesmo que desejou a alguém próximo.",
        "example": "Talvez um atendente ou um vizinho que você só cumprimenta. Você não conhece a história dessa pessoa, mas ela também quer ser feliz e não sofrer."
      },
      {
        "id": "metta.all_beings",
        "title": "A todos os seres vivos",
        "guide": "Agora amplie o círculo para o mundo inteiro: “Que todos os seres vivos sejam felizes e livres do sofrimento”.",
        "example": "Você pode pensar em pessoas distantes, pássaros do lado de fora ou animais na floresta. Não precisa imaginar cada um."
      }
    ],
    "intro": "Comece por você e amplie aos poucos o círculo de bondade. Não é preciso sentir nada especial — basta o desejo.",
    "completion": "Se quiser, faça um pequeno gesto de bondade.",
    "guardrail": "Se pensar em alguém for doloroso, escolha outra pessoa ou pare. Desejar o bem não significa perdoar alguém nem abrir mão dos seus limites."
  },
  "freePractice": {
    "totalLabel": "Tempo dedicado à prática",
    "practiceOne": "prática",
    "practiceFew": "práticas",
    "practiceMany": "práticas",
    "entry": "Prática livre",
    "screenLabel": "PRÁTICA LIVRE",
    "title": "Cronômetro",
    "idea": "Pratique pelo tempo que precisar.",
    "note": "Sem metas ou sequências de dias. Apenas o tempo dedicado à prática.",
    "start": "Começar",
    "pause": "Pausar",
    "resume": "Continuar",
    "finish": "Concluir",
    "back": "Voltar",
    "tickingOn": "Tique-taque ativado",
    "tickingOff": "Tique-taque desativado",
    "currentLabel": "PRÁTICA ATUAL",
    "hintTrigger": "Dica",
    "hintAria": "O que você pode fazer na prática livre",
    "hintTitle": "O que posso fazer aqui?",
    "hintBody1": "Use este tempo para qualquer exercício que ajude a treinar uma mente mais pacífica — religioso, secular ou terapêutico. Você pode acompanhar a respiração, voltar à bondade ou ao perdão, orar, meditar ou fazer um exercício que já conheça.",
    "hintBody2": "Não há uma duração certa. Mesmo um período breve dedicado conscientemente à prática importa — por isso o cronômetro conta cada segundo.",
    "hintContinue": "Continuar"
  },
  "foundationExamples": {
    "trigger": "Exemplo",
    "triggerAria": "Mostrar um exemplo desta etapa",
    "continue": "Continuar",
    "step1": "Por exemplo, você percebe que a mente se distraiu. Notar isso já faz parte do exercício.",
    "step2": "Por exemplo, um pássaro fora da janela pode parecer apenas parte da paisagem. Tente vê-lo como uma vida própria, independente de você.",
    "step3": "Por exemplo, você pode desejar em silêncio a um amigo ou animal: “Espero que tudo fique bem para você”. Talvez não sinta uma emoção calorosa. Ela não é necessária para o exercício.",
    "step4": "Por exemplo: fumar um cigarro a menos, descansar um pouco mais ou dizer não a algo que possa fazer mal a você ou a outra pessoa.",
    "step5": "Por exemplo: em vez de apenas “vou tentar ser mais gentil”, decida: “Quando perceber que estou ficando com raiva, vou fazer uma pausa antes de falar para não dizer algo que machuque”."
  },
  "progressSync": {
    "saveTitle": "Salvar progresso",
    "saveBody": "Backup opcional das práticas Base e Livre. O histórico de Benevolência fica, por enquanto, somente neste dispositivo.",
    "saveButton": "Salvar progresso",
    "savedTitle": "Progresso salvo",
    "savedBody": "O histórico das práticas Base e Livre pode ser recuperado em outro dispositivo. Por enquanto, Benevolência fica somente aqui.",
    "open": "Abrir backup do progresso",
    "close": "Fechar",
    "dialogTitle": "Salvar progresso",
    "dialogBody": "Sem senha: enviaremos um código de uso único por e-mail. Só o histórico das práticas Base e Livre é sincronizado; Benevolência fica neste dispositivo por enquanto.",
    "emailLabel": "E-mail",
    "emailPlaceholder": "nome@exemplo.com",
    "sendCode": "Enviar código",
    "codeTitle": "Confira seu e-mail",
    "codeBody": "Digite o código recebido por e-mail.",
    "codeLabel": "Código",
    "verify": "Confirmar e salvar",
    "resend": "Enviar código novamente",
    "sending": "Enviando…",
    "verifying": "Verificando…",
    "syncing": "Salvando progresso…",
    "success": "Pronto. Seu progresso foi salvo.",
    "sendError": "Não foi possível enviar o código. Tente novamente.",
    "rateLimitError": "Espere um pouco antes de solicitar outro código.",
    "verifyError": "Esse código é inválido ou expirou. Confira e tente novamente.",
    "syncError": "Você entrou na conta. O progresso será salvo quando a conexão voltar.",
    "offline": "É necessária uma conexão com a internet para salvar o progresso.",
    "privacy": "Seu e-mail é usado somente para entrar na conta e recuperar o progresso.",
    "localNote": "Sem entrar na conta, o progresso continua salvo apenas neste dispositivo.",
    "restore": "Recuperar progresso",
    "manage": "Gerenciar progresso",
    "manageTitle": "Progresso salvo",
    "manageBody": "O backup na nuvem está vinculado a {email}. O progresso deste dispositivo continua salvo localmente.",
    "signOut": "Sair da conta neste dispositivo",
    "signingOut": "Saindo da conta…",
    "signedOut": "Você saiu da conta. O progresso local e o da nuvem não foram apagados.",
    "deleteAccount": "Excluir o progresso na nuvem e a conta",
    "deleteConfirm": "Excluir o backup na nuvem e a conta de acesso? O progresso local neste dispositivo permanecerá.",
    "deleting": "Excluindo…",
    "deleted": "O progresso na nuvem e a conta foram excluídos. O progresso local permaneceu no dispositivo.",
    "deleteError": "Não foi possível excluir a conta. Tente novamente.",
    "manageNote": "A exclusão afeta apenas o backup na nuvem e a conta de acesso. Para remover os dados locais, limpe os dados do aplicativo separadamente."
  }
};
  const pluralCategory = n => Math.abs(Math.trunc(Number(n)||0)) === 1 ? 'one' : 'many';
 window.PW_PT_BR_PREVIEW = Object.freeze({...draft,pluralCategory,formatSeconds(n){const x=Math.max(0,Math.trunc(Number(n)||0));return x+(x===1?' segundo':' segundos');}});
})();
