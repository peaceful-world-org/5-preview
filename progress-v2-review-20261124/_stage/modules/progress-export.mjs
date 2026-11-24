// Export one committed local partition, never SDK/session storage or raw metadata.
const GUEST='00000000-0000-0000-0000-000000000000';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fields=['guided_practices','guided_seconds','metta_practices','metta_seconds','free_practices','free_seconds'];
const assert=(ok,message)=>{if(!ok)throw Error(message);};
function uint(n){assert(Number.isSafeInteger(n)&&n>=0,'Invalid export counter');return n;}
function counters(input){return Object.fromEntries(fields.map(k=>[k,uint(input?.[k])]));}
function sum(a,b){return uint(a+b);}
function timestamp(n){return n==null?null:new Date(uint(n)).toISOString();}
export function formatProgressExport(snapshot,verifiedOwner,{now=new Date()}={}){
  const owner=verifiedOwner===null?GUEST:verifiedOwner;
  assert(typeof owner==='string'&&UUID.test(owner)&&snapshot?.ownerId===owner,'Wrong export partition');
  const legacy=counters(snapshot.baseline), totals={...legacy};
  assert(legacy.guided_seconds===legacy.guided_practices*300&&legacy.metta_seconds===legacy.metta_practices*300,'Invalid legacy export baseline');
  assert(Array.isArray(snapshot.rows),'Missing export rows');
  const ids=new Set(),practices=[];
  for(const r of snapshot.rows){
    assert(r.ownerId===owner&&typeof r.id==='string'&&UUID.test(r.id)&&!ids.has(r.id),'Invalid or foreign export row');
    ids.add(r.id);
    assert(['foundation','metta','free'].includes(r.mode)&&typeof r.completed==='boolean','Invalid export practice');
    const seconds=uint(r.seconds);
    if(!seconds){assert(!r.completed,'Invalid export draft');continue;}
    assert(r.mode==='free'||(r.completed&&seconds===300),'Invalid export duration');
    const day=r.day;
    assert(day===null||(typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day),'Invalid export day');
    const prefix=r.mode==='foundation'?'guided':r.mode;
    totals[prefix+'_seconds']=sum(totals[prefix+'_seconds'],seconds);
    if(r.completed)totals[prefix+'_practices']=sum(totals[prefix+'_practices'],1);
    practices.push({id:r.id,mode:r.mode,seconds,completed:r.completed,day});
  }
  totals.practices=sum(sum(totals.guided_practices,totals.metta_practices),totals.free_practices);
  totals.seconds=sum(sum(totals.guided_seconds,totals.metta_seconds),totals.free_seconds);
  assert(Object.entries(totals).every(([k,v])=>snapshot.totals?.[k]===v),'Export totals do not reconcile');
  practices.sort((a,b)=>a.id.localeCompare(b.id));
  assert(typeof snapshot.legacyPending==='boolean','Invalid export import state');
  const pending=uint(snapshot.pending),scan=snapshot.reconciliation?.state;
  assert(['never','incomplete','complete'].includes(scan),'Invalid export scan state');
  return {
    format:'peaceful-world-practice-progress',version:1,exportedAt:now.toISOString(),
    scope:verifiedOwner===null?'guest':'account',source:'local-snapshot',
    cloud:{pendingRecords:pending,legacyImportPending:snapshot.legacyPending,reconciliation:scan,lastSuccessfulScan:timestamp(snapshot.reconciliation.lastSuccessfulScan)},
    legacyUndated:legacy,totals,practices
  };
}
