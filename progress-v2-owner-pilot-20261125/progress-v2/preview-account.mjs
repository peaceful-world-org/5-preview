// Account controls for the isolated authenticated preview only.
// The existing SDK handles OTP/session persistence; never log credentials.
import { createProgressSync } from './sync-coordinator.mjs';

const assert = (ok,msg) => { if(!ok) throw Error(msg); };
const PILOT_BACKEND='https://infxxghlchechanqkjwx.supabase.co';

export function createPreviewAccount({ledger,auth,endpoint,publishableKey,
  onChange=()=>{},onError=()=>{},onReload=()=>location.reload(),onSignedOut=async()=>{},onDeleted=()=>{},
  fetchImpl=globalThis.fetch,online=()=>navigator.onLine}) {
  const base=new URL(endpoint);
  assert(base.href===PILOT_BACKEND+'/','Only isolated owner pilot Auth allowed');
  let user=null, verified=null, token=null, pendingEmail=null, unavailable=false, transitioning=false, flight=null, lastError=false, removal=null;
  const sync=createProgressSync({ledger,auth:{async getUser(jwt){
    const result=await auth.getUser(jwt);
    if(result.error && (result.error.name==='AuthRetryableFetchError'||result.error.status===0||result.error.status>=500))throw Error('Identity verification temporarily unavailable');
    if(!result.error) verified=result.data?.user??null;
    return result;
  }},url:PILOT_BACKEND,publishableKey,fetchImpl:(input,init)=>{
    const u=new URL(input);
    assert(u.origin===PILOT_BACKEND&&u.pathname.startsWith('/rest/v1/rpc/'),'Unexpected transport');
    return fetchImpl(new URL(u.pathname,base),init);
  }});
  const state=()=>({signedIn:!!user,owner:user?.id??null,email:user?.email??'',pendingEmail,unavailable,transitioning,syncing:!!flight,syncError:lastError,deletionPending:!!removal,deletionPhase:removal?.phase??null});
  function changed(){onChange(state());}
  function unwrap(result){if(result?.error)throw result.error;return result?.data;}
  async function start({blockSession=false}={}){
    sync.guest();
    if(blockSession){unavailable=true;changed();return state();}
    try{
      removal=await ledger.readRemoval();
      if(removal){unavailable=true;changed();return state();}
      const session=unwrap(await auth.getSession())?.session;
      if(session){
        verified=null;
        await sync.connect(session);
        assert(verified?.id===session.user.id,'Verified user mismatch');
        user=verified;token=session.access_token;
      }
    }catch(_){
      // Cold-start verification failed: keep the old account partition locked,
      // use the guest partition only, and do not implicitly attach its records.
      sync.guest();user=null;token=null;unavailable=true;
    }
    changed();return state();
  }
  async function send(email){
    assert(!user&&!transitioning&&!unavailable,'Account transition unavailable');
    assert(online(),'Network unavailable');
    assert(typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Invalid email');
    const address=email.trim().toLowerCase();
    unwrap(await auth.signInWithOtp({email:address,options:{shouldCreateUser:true,emailRedirectTo:'https://preview-5.peaceful-world.org/progress-v2-owner-pilot-20261125/'}}));
    pendingEmail=address;changed();
  }
  function cancel(){pendingEmail=null;changed();}
  async function verify(code){
    assert(!user&&pendingEmail&&!transitioning,'Request an email code first');
    assert(/^\d{6,10}$/.test(code),'Invalid code');
    transitioning=true;changed();
    try{
      const data=unwrap(await auth.verifyOtp({email:pendingEmail,token:code,type:'email'}));
      assert(data?.session?.user?.id,'No authenticated session');
      // A reload reinitializes the timer and account partition together.
      // Do not import guest data merely because an email was verified.
      pendingEmail=null;onReload();
    }catch(e){transitioning=false;changed();throw e;}
  }
  async function signOut(){
    assert((user||unavailable)&&!removal&&!transitioning&&!flight,'Wait for current synchronization');
    transitioning=true;changed();
    try{
      // Abort old transport before revoking the session. Account data is
      // never copied into the guest partition and pending rows stay on disk.
      sync.lock();
      unwrap(await auth.signOut({scope:'local'}));
      await onSignedOut();
      user=null;token=null;onReload();
    }catch(e){
      // Sign-out may have partially succeeded. Do not reopen any partition
      // or advertise success; require reload/reverification before practice.
      unavailable=true;lastError=true;onError('Sign-out not confirmed. Reload to retry.');changed();throw e;
    }
  }
  async function deleteAccount(){throw Error('Deletion is unavailable in the owner pilot');}
  function syncNow(){
    if(flight)return flight;
    assert(user&&!transitioning,'Sign in first');
    const expected=user.id;
    lastError=false;
    flight=(async()=>{
      assert(online(),'Network unavailable');
      const session=unwrap(await auth.getSession())?.session;
      if(session?.user?.id!==expected){
        sync.lock();user=null;token=null;transitioning=true;unavailable=true;
        throw Error('Account changed; reload required');
      }
      if(session.access_token!==token){
        verified=null;
        try {
          await sync.connect(session);
          assert(verified?.id===expected,'Verified user mismatch');
          user=verified;token=session.access_token;
        } catch(e) {
          // If the coordinator could not retain its old verified scope,
          // prevent any further practice or progress display until reload.
          try { await ledger.read(); }
          catch(_) { sync.lock();user=null;token=null;transitioning=true;unavailable=true; }
          throw e;
        }
      }
      return sync.sync();
    })().catch(e=>{lastError=true;throw e;}).finally(()=>{flight=null;changed();});
    changed();return flight;
  }
  return Object.freeze({start,state,send,cancel,verify,signOut,syncNow,deleteAccount,close:()=>sync.close()});
}
