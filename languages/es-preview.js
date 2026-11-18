/* 5 — Spanish (international) editorial draft. Not yet publicly released. */
'use strict';
(() => {
  const draft = {
  "modeUi": {
    "base": "Base",
    "metta": "Benevolencia",
    "free": "Práctica libre",
    "baseDesc": "Cinco pasos para pensar de manera más pacífica.",
    "mettaDesc": "De ti a todos los seres vivos.",
    "freeDesc": "Un temporizador abierto, a tu ritmo.",
    "baseMore": "Cinco pasos consecutivos: detente, observa un ser vivo, desea el bien a alguien, reduce el daño y elige cómo actuar. Cada paso dura un minuto después de una breve preparación. No hay una respuesta correcta que encontrar.",
    "mettaMore": "Cinco direcciones de benevolencia: hacia ti, hacia alguien que fue amable contigo, hacia alguien cercano, hacia alguien que apenas conoces y hacia todos los seres vivos. Desear felicidad y libertad del sufrimiento no exige sentir nada especial ni perdonar.",
    "freeMore": "Un temporizador sin duración fija para una práctica que ya conoces. Puedes abrir una sugerencia si lo deseas. El tiempo se suma a tu registro general de práctica.",
    "choose": "ELIGE UNA PRÁCTICA",
    "start": "Empezar · 5 minutos",
    "startFree": "Empezar",
    "details": "Más información sobre ",
    "close": "Cerrar",
    "total": "de práctica",
    "countOne": "práctica",
    "countFew": "prácticas",
    "countMany": "prácticas",
    "sample": "",
    "history": "Tiempo total",
    "new": "NUEVA",
    "planned": "Próximamente",
    "plannedHeader": "PRÓXIMAMENTE",
    "compassion": "Compasión",
    "anger": "Trabajar con la ira",
    "kicker": "Práctica terminada",
    "outcome": "RESUMEN",
    "session": "Esta fue la práctica número ",
    "totalTime": "Tiempo acumulado",
    "doneStart": "Volver a las prácticas",
    "roadmap": "Más prácticas en camino",
    "roadmapNote": "Estamos preparando otros enfoques.",
    "roadmapLink": "Conoce las próximas prácticas (en inglés) →",
    "statusNew": "Nueva",
    "doneFree": "Práctica libre",
    "infoFallback": "Acerca de esta práctica",
    "friendlyMetta": "Si quieres, haz algo pequeño y amable.",
    "infoTime": "Tiempo total",
    "freeDoneSubtitle": "Dedicaste este tiempo a practicar."
  },
  "metta": {
    "mode": {
      "title": "Benevolencia",
      "subtitle": "Mettā · 5 minutos",
      "description": "Cinco minutos para desearte a ti y a otras personas felicidad y libertad del sufrimiento."
    },
    "hint": {
      "label": "Ejemplo",
      "aria": "Mostrar un ejemplo de este paso",
      "continue": "Continuar",
      "dialog": "Ejemplo del paso"
    },
    "steps": [
      {
        "id": "metta.self",
        "title": "A ti",
        "guide": "En silencio, deséate felicidad y libertad del sufrimiento. Si te distraes, vuelve con calma a este deseo.",
        "example": "Incluso en un día difícil puedes desearte bienestar. No tienes que fingir que todo está bien."
      },
      {
        "id": "metta.kind_person",
        "title": "A quien te ayudó",
        "guide": "Recuerda a alguien cuya amabilidad o apoyo haya sido importante para ti. Deséale lo mismo que te deseaste a ti.",
        "example": "Puede ser un docente o alguien que te ayudó en algún momento. En el siguiente paso puedes pensar en alguien cercano."
      },
      {
        "id": "metta.close_being",
        "title": "A alguien cercano",
        "guide": "Ahora piensa en alguien a quien aprecias: una persona o un animal. Deséale felicidad y libertad del sufrimiento.",
        "example": "Tal vez una amistad, un familiar o un animal de compañía. Elige a alguien en quien te resulte fácil pensar ahora."
      },
      {
        "id": "metta.neutral_person",
        "title": "A un conocido",
        "guide": "Piensa en alguien a quien ves de vez en cuando, pero conoces muy poco. Deséale lo mismo que a alguien cercano.",
        "example": "Una persona que atiende una tienda o un vecino a quien solo saludas. No conoces su historia, pero, al igual que tú, desea ser feliz y no sufrir."
      },
      {
        "id": "metta.all_beings",
        "title": "A todos los seres vivos",
        "guide": "Ahora amplía el círculo a todo el mundo: «Que todos los seres vivos sean felices y estén libres del sufrimiento».",
        "example": "Puedes pensar en personas que viven lejos, aves al otro lado de la ventana o animales de un bosque. No hace falta imaginar a cada uno."
      }
    ],
    "intro": "Empieza contigo y amplía poco a poco el círculo de benevolencia. No necesitas sentir nada especial: basta con formular el deseo.",
    "completion": "Si quieres, haz algo pequeño y amable.",
    "guardrail": "Si pensar en alguien te resulta doloroso, elige a otra persona o detente. Desear el bien no significa perdonar a quien te dañó ni renunciar a tus límites."
  },
  "freePractice": {
    "totalLabel": "Tiempo dedicado a practicar",
    "practiceOne": "práctica",
    "practiceFew": "prácticas",
    "practiceMany": "prácticas",
    "entry": "Práctica libre",
    "screenLabel": "PRÁCTICA LIBRE",
    "title": "Temporizador",
    "idea": "Practica durante el tiempo que necesites.",
    "note": "Sin metas de duración ni rachas de días. Solo tiempo dedicado a practicar.",
    "start": "Empezar",
    "pause": "Pausar",
    "resume": "Continuar",
    "finish": "Terminar",
    "back": "Volver",
    "tickingOn": "Tic-tac activado",
    "tickingOff": "Tic-tac desactivado",
    "currentLabel": "PRÁCTICA ACTUAL",
    "hintTrigger": "Sugerencia",
    "hintAria": "Qué puedes hacer durante la práctica libre",
    "hintTitle": "¿Qué puedo hacer aquí?",
    "hintBody1": "Dedica este tiempo a cualquier ejercicio que conozcas y que te ayude a pensar de forma más pacífica: religioso, secular o terapéutico. Puedes observar la respiración, volver a la benevolencia o al perdón, rezar, meditar o hacer un ejercicio que te resulte familiar.",
    "hintBody2": "No hay una duración correcta para todos. Incluso un momento breve que dedicas conscientemente a practicar cuenta; por eso el temporizador registra cada segundo.",
    "hintContinue": "Continuar"
  },
  "foundationExamples": {
    "trigger": "Ejemplo",
    "triggerAria": "Mostrar un ejemplo de este paso",
    "continue": "Continuar",
    "step1": "Por ejemplo, de pronto notas que estás pensando en otras cosas. Darse cuenta de la distracción también forma parte del ejercicio.",
    "step2": "Por ejemplo, un ave al otro lado de la ventana puede convertirse en parte del paisaje. Intenta verla como una vida propia, y no solo como algo de fondo.",
    "step3": "Por ejemplo, puedes pensar en alguien cercano o en un animal y desearle: «Que estés bien». Tal vez no sientas una emoción cálida, y eso no impide practicar.",
    "step4": "Por ejemplo, fumar un cigarrillo menos, permitir que tu cuerpo descanse o dejar de hacer algo que te perjudica a ti o a otras personas.",
    "step5": "Por ejemplo, en vez de decir «intentaré ser más amable», decide: «cuando note que la ira empieza a subir, haré una pausa antes de decir algo que pueda herir a alguien»."
  },
  "progressSync": {
    "saveTitle": "Guardar progreso",
    "saveBody": "Copia de seguridad opcional para Base y Práctica libre. Por ahora, el historial de Benevolencia solo se guarda en este dispositivo.",
    "saveButton": "Guardar progreso",
    "savedTitle": "Progreso guardado",
    "savedBody": "Puedes recuperar el historial de Base y Práctica libre en otro dispositivo. El historial de Benevolencia permanece en este dispositivo por ahora.",
    "open": "Abrir copia de seguridad",
    "close": "Cerrar",
    "dialogTitle": "Guardar progreso",
    "dialogBody": "Sin contraseña: te enviaremos un código de un solo uso por correo. Solo se sincronizan Base y Práctica libre; Benevolencia permanece en este dispositivo por ahora.",
    "emailLabel": "Correo electrónico",
    "emailPlaceholder": "nombre@ejemplo.com",
    "sendCode": "Enviar código",
    "codeTitle": "Revisa tu correo",
    "codeBody": "Escribe el código que recibiste por correo.",
    "codeLabel": "Código",
    "verify": "Verificar y guardar",
    "resend": "Enviar otro código",
    "sending": "Enviando…",
    "verifying": "Verificando…",
    "syncing": "Guardando progreso…",
    "success": "Listo. Tu progreso está guardado.",
    "sendError": "No pudimos enviar el código. Inténtalo de nuevo.",
    "rateLimitError": "Espera un momento antes de solicitar otro código.",
    "verifyError": "El código no es válido o ha caducado. Revísalo e inténtalo de nuevo.",
    "syncError": "Has iniciado sesión. El progreso se guardará cuando vuelva la conexión.",
    "offline": "Necesitas conexión a internet para guardar el progreso.",
    "privacy": "Tu correo se usa únicamente para acceder y recuperar el progreso.",
    "localNote": "Sin iniciar sesión, el progreso solo se guarda en este dispositivo.",
    "restore": "Recuperar progreso",
    "manage": "Administrar progreso",
    "manageTitle": "Progreso guardado",
    "manageBody": "La copia en la nube está vinculada a {email}. El progreso de este dispositivo sigue guardado localmente.",
    "signOut": "Cerrar sesión en este dispositivo",
    "signingOut": "Cerrando sesión…",
    "signedOut": "Has cerrado sesión. No se borró el progreso local ni el de la nube.",
    "deleteAccount": "Borrar progreso en la nube y cuenta",
    "deleteConfirm": "¿Borrar la copia de progreso en la nube y la cuenta de acceso? El progreso local de este dispositivo permanecerá.",
    "deleting": "Borrando…",
    "deleted": "Se borraron la cuenta y el progreso en la nube. El progreso local sigue en este dispositivo.",
    "deleteError": "No pudimos borrar la cuenta. Inténtalo de nuevo.",
    "manageNote": "La eliminación solo afecta a la cuenta y al progreso en la nube. Para borrar los datos locales, elimina por separado los datos de la aplicación."
  }
};
  const pluralCategory = count => Math.abs(Math.trunc(Number(count) || 0)) === 1 ? 'one' : 'many';
  window.PW_ES_PREVIEW = Object.freeze({
    ...draft,
    pluralCategory,
    formatSeconds(value) {
      const n = Math.max(0, Math.trunc(Number(value) || 0));
      return n + (n === 1 ? ' segundo' : ' segundos');
    }
  });
})();
