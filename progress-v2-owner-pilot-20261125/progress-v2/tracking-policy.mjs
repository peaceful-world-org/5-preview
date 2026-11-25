// Device-local preferences. These are not account or analytics consent.
const KEY='pw-progress-v2-preferences';
const DEFAULT=Object.freeze({record:true,dates:false});
const PRIVATE=Object.freeze({record:false,dates:false});
const assert=(ok,message)=>{if(!ok)throw Error(message);};
function normalize(value){
  assert(value&&typeof value.record==='boolean'&&typeof value.dates==='boolean','Invalid tracking preferences');
  return Object.freeze({record:value.record,dates:value.record&&value.dates});
}
export function localDay(date){
  assert(date instanceof Date&&Number.isFinite(date.getTime()),'Invalid practice date');
  const year=date.getFullYear();
  assert(year>=1&&year<=9999,'Invalid practice year');
  return String(year).padStart(4,'0')+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
export function createTrackingPolicy({storage,now=()=>new Date()}){
  let current;
  try{
    const raw=storage.getItem(KEY);
    current=raw===null?DEFAULT:normalize(JSON.parse(raw));
  }catch(_){current=PRIVATE;} // never silently enable recording after a read failure
  function set(next){
    const value=normalize(next);
    storage.setItem(KEY,JSON.stringify(value)); // fail before changing live preference
    current=value;
    return current;
  }
  function plan({demo=false}={}){
    const record=current.record&&!demo;
    return Object.freeze({record,day:record&&current.dates?localDay(now()):null});
  }
  return Object.freeze({state:()=>current,set,plan});
}
// In-memory handles let the same timers finish without writing any progress.
// Decisions and local dates are captured once at session start.
export async function beginGuided(ledger,policy,mode){
  const plan=policy.plan();
  return plan.record?ledger.beginBound(mode,{day:plan.day}):Object.freeze({record:async()=>{},discard:async()=>{}});
}
export async function beginFree(ledger,policy){
  const plan=policy.plan();
  return plan.record?Object.freeze({recorded:true,id:await ledger.begin('free',{day:plan.day})}):Object.freeze({recorded:false,id:null});
}
export async function recordFree(ledger,handle,seconds,completed){
  assert(handle,'Free session missing');
  if(handle.recorded)await ledger.record(handle.id,seconds,completed);
}
// Display only completed, explicitly dated records. Never infer dates from totals.
export function monthDays(calendar,year,month){
  assert(calendar instanceof Map&&Number.isInteger(year)&&year>=1&&year<=9999&&Number.isInteger(month)&&month>=1&&month<=12,'Invalid calendar month');
  const date=new Date(0);date.setUTCFullYear(year,month-1,1);date.setUTCHours(0,0,0,0);
  const start=(date.getUTCDay()+6)%7;
  const end=new Date(date);end.setUTCMonth(month);end.setUTCDate(0);
  const prefix=String(year).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-';
  const cells=Array(start).fill(null);
  for(let d=1;d<=end.getUTCDate();d++){
    const day=prefix+String(d).padStart(2,'0');
    const count=calendar.get(day)??0;
    assert(Number.isSafeInteger(count)&&count>=0,'Invalid calendar count');
    cells.push(Object.freeze({day,number:d,count}));
  }
  return cells;
}
