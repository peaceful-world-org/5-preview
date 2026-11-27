// Presentation only: move the existing controls; keep one Auth controller and one set of IDs.
export function mountAccountEntry(panel,{t,localizeProgress}){
  const state=panel.querySelector('#pwV2AccountState');
  const fields=panel.querySelector('#pwV2LoginFields');
  const google=fields.querySelector('#pwV2Google');
  const notice=panel.querySelector('#pwV2AccountNotice');
  const summary=panel.querySelector('summary');
  const choose=document.getElementById('pwModeChoose');
  if(!state||!fields||!google||!notice||!summary||!choose)throw Error('Missing account entry controls');
  const entry=document.createElement('section');
  entry.id='pwV2AccountEntry';
  entry.className='pw-account-entry';
  entry.setAttribute('aria-labelledby','pwV2EntryTitle');
  entry.hidden=true;
  entry.innerHTML='<div class="pw-account-layout"><div class="pw-account-intro">'+
    '<h2 id="pwV2EntryTitle" data-progress-copy="Save your progress">Save your progress</h2>'+
    '<p id="pwV2EntryLead" data-progress-copy="Keep your practice history across devices.">Keep your practice history across devices.</p>'+
    '</div><div class="pw-account-auth"></div></div>'+
    '<p id="pwV2GuestNote" class="pw-account-guest" data-progress-copy="You can practise without an account.">You can practise without an account.</p>';
  const email=document.createElement('details');
  email.id='pwV2EmailDetails';
  email.className='pw-account-email';
  email.innerHTML='<summary data-progress-copy="Continue with email">Continue with email</summary>';
  // Move, rather than recreate, the tested input and buttons.
  email.append(...Array.from(fields.children).filter(child=>child!==google));
  google.classList.add('pw-google-signin');
  fields.replaceChildren(google,email);
  entry.querySelector('.pw-account-auth').append(fields);
  state.classList.add('pw-account-status');
  notice.classList.add('pw-account-notice');
  panel.removeAttribute('style');
  entry.append(state,notice,panel);
  choose.before(entry);
  const title=entry.querySelector('#pwV2EntryTitle');
  const lead=entry.querySelector('#pwV2EntryLead');
  const guest=entry.querySelector('#pwV2GuestNote');
  function update(s){
    const managed=Boolean(s.signedIn||s.unavailable);
    const guestAvailable=!managed&&!s.pendingEmail;
    entry.dataset.accountMode=managed?'account':'guest';
    title.dataset.progressCopy=managed?'My account':'Save your progress';
    lead.hidden=managed;
    guest.hidden=!guestAvailable;
    summary.dataset.progressCopy=managed?'Manage account':'Backup on this device';
    if(s.unavailable)panel.open=true;
    entry.hidden=false;
    localizeProgress(entry);
  }
  return Object.freeze({root:entry,update});
}
