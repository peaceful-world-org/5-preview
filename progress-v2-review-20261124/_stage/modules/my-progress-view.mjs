// Presentation only. The verified ledger remains the sole source of history.
const GUEST='00000000-0000-0000-0000-000000000000';
const modes=[['foundation','guided'],['metta','metta'],['free','free']];
const natural=n=>Number.isSafeInteger(n)&&n>=0;
export function progressView(snapshot,account,prefs){
  const empty=reason=>({visible:false,reason,modes:[],calendar:new Map()});
  if(!prefs?.record)return empty('paused');
  if(account?.transitioning||account?.unavailable)return empty('unverified');
  const owner=account?.signedIn?account.owner:GUEST;
  if(!snapshot||!owner||snapshot.ownerId!==owner)return empty('unverified');
  const totals=snapshot.totals;
  if(!totals||!natural(totals.practices)||!natural(totals.seconds))return empty('unverified');
  const result=modes.map(([mode,key])=>({mode,practices:totals[key+'_practices'],seconds:totals[key+'_seconds']}));
  if(result.some(r=>!natural(r.practices)||!natural(r.seconds))||result.reduce((n,r)=>n+r.seconds,0)!==totals.seconds||result.reduce((n,r)=>n+r.practices,0)!==totals.practices)return empty('unverified');
  return {visible:true,reason:null,practices:totals.practices,seconds:totals.seconds,modes:result,calendar:prefs.dates&&totals.calendar instanceof Map?new Map(totals.calendar):new Map()};
}
export function durationText(seconds,locale){
  if(!natural(seconds))throw Error('Invalid displayed duration');
  const parts=[];
  for(const [unit,scale] of [['hour',3600],['minute',60],['second',1]]){
    const n=Math.floor(seconds/scale);seconds%=scale;
    if(n||(!parts.length&&scale===1))parts.push(new Intl.NumberFormat(locale,{style:'unit',unit,unitDisplay:'short'}).format(n));
  }
  return parts.join(' ');
}
