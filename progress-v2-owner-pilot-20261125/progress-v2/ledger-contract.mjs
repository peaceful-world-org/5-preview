// Progress & Identity v2: executable reference contract, NOT application runtime.
// No network, database, real user data, or persistence side effects.
export const FOCUS_MODES=Object.freeze(["F01","F02","F03","F04","F05","F06","F07","F08","F09"]);
const GUIDED = new Set(['foundation', 'metta', ...FOCUS_MODES]);
const MODES = new Set([...GUIDED, 'free']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = ['guided_practices', 'guided_seconds', 'free_practices', 'free_seconds', 'metta_practices', 'metta_seconds'];
const uint = n => Number.isSafeInteger(n) && n >= 0;
const id = s => typeof s === 'string' && UUID.test(s);
function assert(ok, message) { if (!ok) throw new Error(message); }
function plus(a, b) { const n = a + b; assert(uint(n), 'counter overflow'); return n; }

// Baseline represents cumulative legacy observations, NOT independent events.
// Never add two old snapshots: their overlap is unknowable.
export function mergeLegacy(previous = {}, observed = {}) {
  const result = {};
  for (const key of fields) {
    const a = previous[key] ?? 0, b = observed[key] ?? 0;
    assert(uint(a) && uint(b), 'invalid legacy counter');
    result[key] = Math.max(a, b);
  }
  assert(result.guided_seconds === result.guided_practices * 300, 'inconsistent foundation legacy time');
  assert(result.metta_seconds === result.metta_practices * 300, 'inconsistent metta legacy time');
  return result;
}

// A stable ID is generated once, on the local device, before any upload.
// Foundation/Metta: completed only, exactly 300 seconds. Demo never enters ledger.
// Free: monotonic checkpoint of credited seconds, terminal finish with same ID.
// Date is nullable and immutable; absent dates are never synthesized for calendar.
export function mergePractice(ownerId, previous, incoming) {
  assert(id(ownerId) && incoming?.ownerId === ownerId, 'wrong account');
  assert(id(incoming.id) && MODES.has(incoming.mode), 'invalid practice identity');
  assert(uint(incoming.seconds) && incoming.seconds > 0, 'invalid practice duration');
  assert(typeof incoming.completed === 'boolean', 'invalid completion flag');
  const day = incoming.day ?? null;
  if (day !== null) {
    assert(typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day), 'invalid local day');
    const date = new Date(day + 'T00:00:00Z');
    assert(Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day, 'invalid local day');
  }
  assert(!incoming.demo, 'demo excluded');
  if (GUIDED.has(incoming.mode)) assert(incoming.completed && incoming.seconds === 300, 'guided completion must be 300 seconds');
  const next = { ownerId, id: incoming.id, mode: incoming.mode, seconds: incoming.seconds, completed: incoming.completed, day };
  if (!previous) return next;
  assert(previous.ownerId === ownerId && previous.id === next.id && previous.mode === next.mode && previous.day === next.day, 'immutable identity conflict');
  if (previous.completed) {
    // Old retries cannot unfinish a practice; conflicting finals need review.
    assert(next.seconds <= previous.seconds && (!next.completed || next.seconds === previous.seconds), 'conflicting completed duration');
    return previous;
  }
  if (next.completed) {
    assert(next.seconds >= previous.seconds, 'final smaller than credited checkpoint');
    return next;
  }
  return next.seconds > previous.seconds ? next : previous;
}

export function applyPractice(ownerId, ledger, incoming) {
  // The production adapter must perform this read/merge/write atomically.
  const key = incoming?.id;
  const next = mergePractice(ownerId, ledger.get(key), incoming);
  return new Map(ledger).set(key, next);
}

export function summarize(ownerId, baseline, ledger) {
  assert(id(ownerId), 'invalid owner');
  const total = mergeLegacy({}, baseline);
  for(const mode of FOCUS_MODES){total[mode+'_seconds']=0;total[mode+'_practices']=0;}
  const calendar = new Map();
  for (const row of ledger.values()) {
    assert(row.ownerId === ownerId, 'mixed account ledger');
    const prefix = row.mode === 'foundation' ? 'guided' : row.mode;
    total[prefix + '_seconds'] = plus(total[prefix + '_seconds'], row.seconds);
    if (row.completed) total[prefix + '_practices'] = plus(total[prefix + '_practices'], 1);
    if (row.day !== null && row.completed) calendar.set(row.day, plus(calendar.get(row.day) || 0, 1));
  }
  return { ...total, practices: FOCUS_MODES.reduce((n,mode)=>plus(n,total[mode+'_practices']),plus(plus(total.guided_practices,total.metta_practices),total.free_practices)), seconds: FOCUS_MODES.reduce((n,mode)=>plus(n,total[mode+'_seconds']),plus(plus(total.guided_seconds,total.metta_seconds),total.free_seconds)), calendar };
}
