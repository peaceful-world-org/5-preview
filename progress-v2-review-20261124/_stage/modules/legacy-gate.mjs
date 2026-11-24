// A cutover guard, not a lock on previously shipped v1 writers.
// Never mutate legacy storage. A conflict pauses new recording until recovery.
import {sameSettledLegacy} from './legacy-import.mjs';
export function createLegacyGate({storage,ledger,capture,onBlocked=()=>{}}){
  let initial=null,offer=null,reason=null;
  function block(code){
    if(!reason){reason=code;offer=null;onBlocked(code);}
    return false;
  }
  async function prepare(){
    try{initial=capture(storage);}catch(_){block('legacy-unreadable-or-unfinished');return null;}
    try{
      // Even an empty capture is staged, so later v1 changes cannot silently
      // replace a previously preserved device snapshot.
      const staged=await ledger.stageLegacy(initial.raw);
      offer=Object.values(initial.baseline).some(n=>n>0)?staged:null;
      if(!check())return null;
      return offer;
    }catch(_){block('legacy-snapshot-conflict');return null;}
  }
  function check(){
    if(reason)return false;
    if(!initial)return block('legacy-not-prepared');
    try{
      const next=capture(storage);
      return sameSettledLegacy(next.raw,initial.raw)||block('legacy-source-changed');
    }catch(_){return block('legacy-unreadable-or-unfinished');}
  }
  async function adopt(id){
    if(!check()||!offer||offer.id!==id)throw Error('Legacy progress needs recovery before import');
    const result=await ledger.adoptLegacy(id);
    offer=null;
    check();
    return result;
  }
  function policy(base){
    return Object.freeze({plan:()=>check()?base.plan():Object.freeze({record:false,day:null})});
  }
  return Object.freeze({prepare,check,adopt,policy,reason:()=>reason});
}
