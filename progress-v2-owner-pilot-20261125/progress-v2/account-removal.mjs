// Scoped account deletion. No credentials are stored in the durable journal.
const GUEST='00000000-0000-0000-0000-000000000000';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const owner=id=>{assert(typeof id==='string'&&UUID.test(id)&&id!==GUEST,'Invalid deletion owner');return id;};
function marker(device){
  const m=device?.accountRemoval??null;
  if(m){owner(m.ownerId);assert(['requested','confirmed','cleaned'].includes(m.phase),'Invalid deletion journal');}
  return m;
}
// All store operations are called inside the existing strict IDB transactions.
export async function readRemoval(tx,request){return marker(await request(tx.objectStore('meta').get(GUEST)));}
export async function stageRemoval(tx,request,id){
  owner(id);const meta=tx.objectStore('meta'),device=await request(meta.get(GUEST));
  const old=marker(device);
  if(old){assert(old.ownerId===id,'Another deletion is pending');return old;}
  const next={ownerId:id,phase:'requested'};
  await request(meta.put({...device,ownerId:GUEST,accountRemoval:next}));return next;
}
export async function confirmRemoval(tx,request,id){
  const meta=tx.objectStore('meta'),device=await request(meta.get(GUEST)),old=marker(device);
  assert(old?.ownerId===owner(id),'Deletion journal missing');
  if(old.phase!=='requested')return old;
  const next={ownerId:id,phase:'confirmed'};
  await request(meta.put({...device,accountRemoval:next}));return next;
}
export async function purgeRemoval(tx,request,id){
  const meta=tx.objectStore('meta'),records=tx.objectStore('records'),queue=tx.objectStore('outbox');
  const device=await request(meta.get(GUEST)),old=marker(device);
  assert(old?.ownerId===owner(id)&&old.phase!=='requested','Cloud deletion not confirmed');
  if(old.phase==='cleaned')return old;
  for(const row of await request(records.index('owner').getAll(id)))await request(records.delete([id,row.id]));
  for(const row of await request(queue.index('owner').getAll(id)))await request(queue.delete([id,row.id]));
  // A claimed guest practice is part of the deleted account, not free to
  // reappear in another account. Unclaimed guest rows are untouched.
  for(const row of await request(records.index('owner').getAll(GUEST)))if(row.claimedBy===id)await request(records.delete([GUEST,row.id]));
  await request(meta.delete(id));
  const next={...device,accountRemoval:{ownerId:id,phase:'cleaned'}};
  if(next.legacySnapshot?.ownerId===id){
    delete next.legacySnapshot;
    // Old window.PW_PILOT_LOCAL is shared with v1 and cannot be safely attributed or
    // atomically cleared here. Do not let the old snapshot reappear as an offer.
    next.legacyRetired=true;
  }
  await request(meta.put(next));return next.accountRemoval;
}
export async function finishRemoval(tx,request,id){
  const meta=tx.objectStore('meta'),device=await request(meta.get(GUEST)),old=marker(device);
  assert(old?.ownerId===owner(id)&&old.phase==='cleaned','Device cleanup not confirmed');
  const next={...device};delete next.accountRemoval;await request(meta.put(next));
}
function data(result){if(result?.error)throw result.error;return result?.data;}
export async function removeAccount({ledger,auth,expectedOwner,send,lock,onPending=()=>{}}){
  const id=owner(expectedOwner);
  let pending=await ledger.readRemoval();
  assert(!pending||pending.ownerId===id,'Another deletion is pending');
  if(!pending||pending.phase==='requested'){
    const session=data(await auth.getSession())?.session;
    assert(session?.user?.id===id&&typeof session.access_token==='string'&&session.access_token,'Verify the same account before deletion');
    const user=data(await auth.getUser(session.access_token))?.user;
    assert(user?.id===id&&user.is_anonymous===false&&user.email_confirmed_at,'Verify the same account before deletion');
    if(!pending)pending=await ledger.stageRemoval(id);
    lock();onPending(pending);
    // Only an explicit, successful server acknowledgement authorizes purge.
    const reply=await send(session.access_token);
    assert(reply?.deleted===true,'Cloud deletion not confirmed');
    pending=await ledger.confirmRemoval(id);onPending(pending);
  }else{lock();onPending(pending);}
  if(pending.phase==='confirmed'){
    pending=await ledger.purgeRemoval(id);onPending(pending);
  }
  assert(pending.phase==='cleaned','Device cleanup not confirmed');
  const session=data(await auth.getSession())?.session;
  // Never revoke another account's session. A deleted user's refresh token
  // may already be invalid, so no session is also a valid local outcome.
  if(session?.user?.id===id){
    data(await auth.signOut({scope:'local'}));
    const after=data(await auth.getSession())?.session;
    assert(after?.user?.id!==id,'Local sign-out not confirmed');
  }
  await ledger.finishRemoval(id);onPending(null);
}
export function createDeletionTransport({endpoint,publishableKey,fetchImpl=globalThis.fetch}){
  const base=new URL(endpoint);
  assert(base.protocol==='http:'&&base.hostname==='127.0.0.1'&&base.port==='54321'&&base.pathname==='/'&&!base.search&&!base.hash&&!base.username&&!base.password,'Only disposable loopback deletion allowed');
  assert(/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey),'Public key required');
  return async token=>{
    assert(typeof token==='string'&&token,'Verified token required');
    const response=await fetchImpl(new URL('/functions/v1/delete-progress-account',base),{
      method:'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({confirm:'DELETE'}),redirect:'error',signal:AbortSignal.timeout(15000)
    });
    assert(response.ok,'Cloud deletion not confirmed');
    const reply=await response.json();assert(reply?.deleted===true,'Cloud deletion not confirmed');return {deleted:true};
  };
}
