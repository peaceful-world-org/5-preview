/* Peaceful World 5 · French editorial draft; unreleased. */
'use strict';
(() => {
 const draft = {
  "modeUi": {
    "base": "Base",
    "metta": "Bienveillance",
    "free": "Pratique libre",
    "baseDesc": "Cinq étapes pour penser plus pacifiquement.",
    "mettaDesc": "De vous à tous les êtres vivants.",
    "freeDesc": "Un chronomètre libre, à votre rythme.",
    "baseMore": "Cinq étapes : Arrêtez-vous, Voyez un être vivant, Souhaitez du bien, Réduisez le tort et Faites un choix. Chaque étape dure une minute après une courte préparation. Il n'y a pas de bonne réponse à trouver.",
    "mettaMore": "Cinq cercles de bienveillance : vous-même, quelqu'un qui a été bon envers vous, un proche, une personne que vous connaissez à peine et tous les êtres vivants. Souhaiter le bonheur et la libération de la souffrance n'impose aucun sentiment particulier ni pardon.",
    "freeMore": "Un chronomètre sans durée imposée pour une pratique que vous connaissez déjà. Une suggestion facultative est proposée. Votre temps s'ajoute au total des pratiques.",
    "choose": "CHOISISSEZ UNE PRATIQUE",
    "start": "Commencer · 5 minutes",
    "startFree": "Commencer",
    "details": "En savoir plus sur ",
    "close": "Fermer",
    "total": "de pratique",
    "countOne": "pratique",
    "countFew": "pratiques",
    "countMany": "pratiques",
    "sample": "",
    "history": "Total cumulé",
    "new": "NOUVELLE",
    "planned": "Envisagé",
    "plannedHeader": "ENVISAGÉ",
    "compassion": "Compassion",
    "anger": "Travailler avec la colère",
    "kicker": "Pratique terminée",
    "outcome": "RÉCAPITULATIF",
    "session": "C'était votre pratique numéro ",
    "totalTime": "Temps total de pratique",
    "doneStart": "Retour aux pratiques",
    "roadmap": "D'autres pratiques sont prévues",
    "roadmapNote": "D'autres approches sont prévues.",
    "roadmapLink": "Découvrir les prochaines pratiques (en anglais) →",
    "statusNew": "Nouvelle",
    "doneFree": "Pratique libre",
    "infoFallback": "À propos de cette pratique",
    "friendlyMetta": "Si vous le souhaitez, faites un petit geste de gentillesse.",
    "infoTime": "Total cumulé",
    "freeDoneSubtitle": "Vous avez consacré ce temps à votre pratique."
  },
  "metta": {
    "mode": {
      "title": "Bienveillance",
      "subtitle": "Mettā · 5 minutes",
      "description": "Cinq minutes pour souhaiter, à vous-même et aux autres, le bonheur et la libération de la souffrance."
    },
    "hint": {
      "label": "Exemple",
      "aria": "Afficher un exemple pour cette étape",
      "continue": "Continuer",
      "dialog": "Exemple de l'étape"
    },
    "steps": [
      {
        "id": "metta.self",
        "title": "À vous-même",
        "guide": "Souhaitez-vous intérieurement le bonheur et la libération de la souffrance. Si votre esprit s'égare, revenez doucement à ce souhait.",
        "example": "Même dans une journée difficile, vous pouvez vous souhaiter du bien. Vous n'avez pas à prétendre que tout va bien."
      },
      {
        "id": "metta.kind_person",
        "title": "À qui vous a aidé",
        "guide": "Pensez à une personne dont vous gardez le souvenir de la gentillesse ou du soutien. Souhaitez-lui ce que vous vous êtes souhaité.",
        "example": "Un enseignant ou une personne qui vous a un jour soutenu. À l'étape suivante, vous pourrez penser à un proche."
      },
      {
        "id": "metta.close_being",
        "title": "À un être cher",
        "guide": "Pensez maintenant à un être qui compte pour vous — une personne ou un animal. Souhaitez-lui le bonheur et la libération de la souffrance.",
        "example": "Un ami, un membre de votre famille ou un animal de compagnie. Choisissez quelqu'un auquel il est facile de penser maintenant."
      },
      {
        "id": "metta.neutral_person",
        "title": "À une simple connaissance",
        "guide": "Pensez à une personne que vous croisez parfois, mais connaissez très peu. Souhaitez-lui ce que vous avez souhaité à un être cher.",
        "example": "Peut-être une personne à la caisse d'un magasin ou un voisin que vous saluez. Vous ne connaissez pas son histoire, mais comme vous, cette personne veut être heureuse et ne pas souffrir."
      },
      {
        "id": "metta.all_beings",
        "title": "À tous les êtres vivants",
        "guide": "Élargissez maintenant le cercle au monde entier : « Que tous les êtres vivants soient heureux et libérés de la souffrance. »",
        "example": "Vous pouvez penser à des personnes éloignées, à des oiseaux derrière la fenêtre ou à des animaux dans la forêt. Inutile de les imaginer un par un."
      }
    ],
    "intro": "Commencez par vous, puis élargissez progressivement le cercle de bienveillance. Vous n'avez pas besoin de ressentir quelque chose de particulier : le souhait suffit.",
    "completion": "Si vous le souhaitez, faites un petit geste de gentillesse.",
    "guardrail": "Si penser à quelqu'un est douloureux, choisissez une autre personne ou arrêtez. Souhaiter du bien à quelqu'un n'oblige ni à lui pardonner ni à renoncer à vos limites."
  },
  "freePractice": {
    "totalLabel": "Temps consacré à la pratique",
    "practiceOne": "pratique",
    "practiceFew": "pratiques",
    "practiceMany": "pratiques",
    "entry": "Pratique libre",
    "screenLabel": "PRATIQUE LIBRE",
    "title": "Chronomètre",
    "idea": "Pratiquez aussi longtemps que vous en avez besoin.",
    "note": "Aucun objectif de durée ni série de jours. Seulement du temps consacré à la pratique.",
    "start": "Commencer",
    "pause": "Pause",
    "resume": "Continuer",
    "finish": "Terminer",
    "back": "Retour",
    "tickingOn": "Tic-tac activé",
    "tickingOff": "Tic-tac désactivé",
    "currentLabel": "PRATIQUE EN COURS",
    "hintTrigger": "Suggestion",
    "hintAria": "Que faire pendant la pratique libre ?",
    "hintTitle": "Que puis-je faire ici ?",
    "hintBody1": "Utilisez ce temps pour tout exercice que vous connaissez et qui contribue à un esprit plus pacifique — religieux, laïque ou thérapeutique. Vous pouvez suivre votre respiration, revenir à la bienveillance ou au pardon, prier, méditer ou pratiquer un exercice familier.",
    "hintBody2": "Il n'existe pas de durée correcte. Même un court moment consacré consciemment à la pratique compte — c'est pourquoi le chronomètre mesure chaque seconde.",
    "hintContinue": "Continuer"
  },
  "foundationExamples": {
    "trigger": "Exemple",
    "triggerAria": "Afficher un exemple pour cette étape",
    "continue": "Continuer",
    "step1": "Par exemple, vous remarquez soudain que votre esprit s'est égaré. Le fait de le remarquer fait déjà partie de l'exercice.",
    "step2": "Par exemple, un oiseau derrière la fenêtre peut se fondre dans le décor. Essayez plutôt de le voir comme une vie à part entière, indépendante de vous.",
    "step3": "Par exemple, vous pouvez dire intérieurement à un ami ou à un animal : « J'espère que tout ira bien pour toi. » Il se peut qu'aucune chaleur n'apparaisse. Ce n'est pas nécessaire à l'exercice.",
    "step4": "Par exemple : fumer une cigarette de moins, vous reposer un peu plus ou refuser quelque chose qui ferait du mal à vous-même ou à quelqu'un d'autre.",
    "step5": "Par exemple, au lieu de dire « Je vais essayer de faire preuve de plus de gentillesse », décidez : « Quand je sentirai la colère monter, je ferai une pause avant de parler pour éviter des paroles blessantes. »"
  },
  "progressSync": {
    "saveTitle": "Enregistrer la progression",
    "saveBody": "Sauvegarde facultative pour les pratiques Base et Libre. Pour l'instant, l'historique de Bienveillance reste sur cet appareil.",
    "saveButton": "Enregistrer la progression",
    "savedTitle": "Progression enregistrée",
    "savedBody": "Les historiques Base et Libre peuvent être récupérés sur un autre appareil. Bienveillance reste ici pour le moment.",
    "open": "Ouvrir la sauvegarde",
    "close": "Fermer",
    "dialogTitle": "Enregistrer la progression",
    "dialogBody": "Sans mot de passe : nous vous enverrons un code à usage unique par e-mail. Seuls les historiques Base et Libre sont synchronisés ; Bienveillance reste sur cet appareil pour le moment.",
    "emailLabel": "Adresse e-mail",
    "emailPlaceholder": "nom@exemple.com",
    "sendCode": "Envoyer le code",
    "codeTitle": "Consultez votre boîte mail",
    "codeBody": "Saisissez le code reçu par e-mail.",
    "codeLabel": "Code",
    "verify": "Vérifier et enregistrer",
    "resend": "Renvoyer un code",
    "sending": "Envoi…",
    "verifying": "Vérification…",
    "syncing": "Enregistrement…",
    "success": "C'est fait. Votre progression est enregistrée.",
    "sendError": "Impossible d'envoyer le code. Réessayez.",
    "rateLimitError": "Patientez un peu avant de demander un nouveau code.",
    "verifyError": "Ce code est invalide ou a expiré. Vérifiez-le et réessayez.",
    "syncError": "Vous êtes connecté. Votre progression sera enregistrée au retour de la connexion.",
    "offline": "Une connexion Internet est nécessaire pour enregistrer la progression.",
    "privacy": "Votre adresse e-mail sert uniquement à la connexion et à la récupération de la progression.",
    "localNote": "Sans connexion à votre compte, votre progression reste uniquement sur cet appareil.",
    "restore": "Récupérer la progression",
    "manage": "Gérer la progression",
    "manageTitle": "Progression enregistrée",
    "manageBody": "La sauvegarde en ligne est liée à {email}. Votre progression reste également enregistrée localement sur cet appareil.",
    "signOut": "Se déconnecter sur cet appareil",
    "signingOut": "Déconnexion…",
    "signedOut": "Vous êtes déconnecté. La progression locale et en ligne n'a pas été supprimée.",
    "deleteAccount": "Supprimer la progression en ligne et le compte",
    "deleteConfirm": "Supprimer la sauvegarde en ligne et le compte de connexion ? La progression locale restera sur cet appareil.",
    "deleting": "Suppression…",
    "deleted": "La progression en ligne et le compte ont été supprimés. La progression locale reste sur cet appareil.",
    "deleteError": "Impossible de supprimer le compte. Réessayez.",
    "manageNote": "La suppression concerne seulement la sauvegarde en ligne et le compte. Pour supprimer les données locales, effacez séparément les données de l'application."
  }
};
  const pluralCategory = n => Math.abs(Math.trunc(Number(n)||0)) === 1 ? 'one' : 'many';
 window.PW_FR_PREVIEW = Object.freeze({...draft,pluralCategory,formatSeconds(n){const x=Math.max(0,Math.trunc(Number(n)||0));return x+(x===1?' seconde':' secondes');}});
})();
