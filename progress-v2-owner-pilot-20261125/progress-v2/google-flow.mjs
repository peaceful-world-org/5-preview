// Optional Google PKCE flow for the isolated v2 preview. Never merges accounts.
const KEY='pw-v2-google-pending';
const MARK='pw_google';
const BLOCK='pw-v2-google-quarantine';
const TTL=10*60*1000;
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
function data(result){if(result?.error)throw Error('Authentication request failed');return result?.data;}
export function createGoogleFlow({auth,endpoint,appUrl,storage,quarantineStorage,navigate,cleanUrl,enabled=false,now=Date.now}){
  const backend=new URL(endpoint),home=new URL(appUrl);
  assert(!backend.username&&!backend.password&&backend.pathname==='/'&&!backend.search&&!backend.hash,'Invalid Auth endpoint');
  assert((backend.protocol==='https:'&&home.protocol==='https:')||(backend.protocol==='http:'&&backend.hostname==='127.0.0.1'&&home.protocol==='http:'&&home.hostname==='127.0.0.1'),'Invalid OAuth origin');
  assert(!home.username&&!home.password&&!home.search&&!home.hash,'Exact callback base required');
  const callback=new URL(home);callback.searchParams.set(MARK,'1');
  async function begin(){
    assert(enabled,'Google sign-in is disabled');
    assert(!quarantineStorage.getItem(BLOCK),'Sign out of unverified session first');
    assert(!data(await auth.getSession())?.session,'Sign out before starting Google sign-in');
    storage.removeItem(KEY);
    const result=data(await auth.signInWithOAuth({provider:'google',options:{redirectTo:callback.href,skipBrowserRedirect:true,scopes:'openid email profile',queryParams:{prompt:'select_account'}}}));
    const url=new URL(result.url);
    assert(url.origin===backend.origin&&url.pathname==='/auth/v1/authorize'&&!url.username&&!url.password&&!url.hash&&url.searchParams.getAll('provider').length===1&&url.searchParams.get('provider')==='google'&&url.searchParams.getAll('redirect_to').length===1&&url.searchParams.get('redirect_to')===callback.href&&url.searchParams.getAll('code_challenge_method').length===1&&url.searchParams.get('code_challenge_method')==='s256'&&url.searchParams.getAll('code_challenge').length===1&&/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('code_challenge')||''),'Unexpected OAuth redirect');
    assert(result.flowId==null||/^[a-f0-9]{32}$/.test(result.flowId),'Invalid PKCE flow identifier');
    storage.setItem(KEY,JSON.stringify({at:now(),callback:callback.href,flowId:result.flowId}));
    try{navigate(url.href);}catch(e){storage.removeItem(KEY);throw e;}
  }
  async function finish(href){
    const url=new URL(href);
    const isCallback=url.searchParams.has(MARK);
    // Remove code/error from the address before any network request.
    if(isCallback)cleanUrl(home.href);
    if(quarantineStorage.getItem(BLOCK))return 'blocked';
    if(!isCallback)return 'none';
    let exchangeAttempted=false;
    try{
      const raw=storage.getItem(KEY);storage.removeItem(KEY);
      const marker=raw?JSON.parse(raw):null;
      assert(enabled&&marker?.callback===callback.href&&Number.isFinite(marker.at)&&now()>=marker.at&&now()-marker.at<=TTL,'Unsolicited or expired callback');
      assert(url.origin===home.origin&&url.pathname===home.pathname&&url.searchParams.getAll(MARK).length===1&&url.searchParams.get(MARK)==='1'&&!url.hash,'Invalid OAuth callback');
      // Never replace a pre-existing account with a callback session.
      assert(!data(await auth.getSession())?.session,'An account is already active');
      if(url.searchParams.has('error')||url.searchParams.has('error_code'))return 'cancelled';
      const codes=url.searchParams.getAll('code');
      assert(codes.length===1&&codes[0].length>0&&codes[0].length<=2048,'Missing or ambiguous OAuth code');
      // Persist before exchange: a process crash must not unlock an
      // unverified session on the next launch or in another tab.
      quarantineStorage.setItem(BLOCK,'1');
      exchangeAttempted=true;
      assert(marker.flowId==null||/^[a-f0-9]{32}$/.test(marker.flowId),'Invalid PKCE flow identifier');
      const session=data(await auth.exchangeCodeForSession(codes[0],marker.flowId?{flowId:marker.flowId}:undefined))?.session;
      assert(session?.access_token&&session.user?.id,'Missing session');
      const user=data(await auth.getUser(session.access_token))?.user;
      assert(user?.id===session.user.id&&user.is_anonymous===false&&user.email_confirmed_at&&user.identities?.some(i=>i.provider==='google'),'Unverified Google identity');
      // The normal verified account bootstrap independently checks this session.
      quarantineStorage.removeItem(BLOCK);
      return 'complete';
    }catch(_){
      // Exchange may have stored a session before failing verification. Do not
      // permit the account bootstrap to use it unless cleanup is confirmed.
      if(exchangeAttempted){
        try{data(await auth.signOut({scope:'local'}));}catch(_){return 'blocked';}
      }
      try{
        if(data(await auth.getSession())?.session)return 'blocked';
        if(exchangeAttempted)quarantineStorage.removeItem(BLOCK);
        return 'failed';
      }catch(_){return 'blocked';}
    }
  }
  async function clearAfterSignOut(){
    assert(!data(await auth.getSession())?.session,'Sign-out not confirmed');
    storage.removeItem(KEY);
    quarantineStorage.removeItem(BLOCK);
  }
  return Object.freeze({begin,finish,clearAfterSignOut,
    hasPending:()=>Boolean(storage.getItem(KEY)),
    discardPending:()=>storage.removeItem(KEY),
    callback:callback.href});
}
