// Legacy data is an undated aggregate, not a set of identifiable sessions.
// Call only after the v1 timer/sync writers have stopped on this installation.
import { mergeLegacy } from './ledger-contract.mjs';
const KEYS = ['pw-completed-practices','pw-metta-completed-practices-v1','pw-free-practice-sessions-v1','pw-free-practice-seconds-v1','pw-free-practice-session-v1'];
const assert = (ok,msg) => { if (!ok) throw new Error(msg); };
function count(raw) {
  if (raw === null) return 0;
  assert(typeof raw === 'string' && /^\d+$/.test(raw), 'invalid legacy counter');
  const value = Number(raw);
  assert(Number.isSafeInteger(value) && value >= 0, 'invalid legacy counter');
  return value;
}
export function validateLegacySnapshot(raw) {
  assert(Array.isArray(raw) && raw.length === KEYS.length, 'invalid legacy snapshot');
  const [guided,metta,free,seconds] = raw.slice(0,4).map(count);
  if (raw[4] !== null) {
    let checkpoint;
    try { checkpoint = JSON.parse(raw[4]); } catch (_) { throw new Error('invalid legacy free checkpoint'); }
    assert(checkpoint && Number.isSafeInteger(checkpoint.elapsedMs) && checkpoint.elapsedMs >= 0 && Number.isSafeInteger(checkpoint.creditedSeconds) && checkpoint.creditedSeconds >= 0, 'invalid legacy free checkpoint');
    assert(checkpoint.elapsedMs === 0 && checkpoint.creditedSeconds === 0, 'unfinished legacy free practice');
  }
  return { raw: [...raw], baseline: mergeLegacy({}, {guided_practices:guided,guided_seconds:guided*300,metta_practices:metta,metta_seconds:metta*300,free_practices:free,free_seconds:seconds}) };
}
export function captureLegacy(storage) {
  const raw = KEYS.map(key => storage.getItem(key)); // read failures must surface
  assert(KEYS.every((key,i)=>storage.getItem(key)===raw[i]), 'legacy counters changed during capture');
  return validateLegacySnapshot(raw);
}
// v1 pagehide can recreate a zero checkpoint immediately after finish.
// Both absent and validated zero checkpoints mean no unfinished practice.
// All four counter strings must still match exactly; retain original raw data.
export function sameSettledLegacy(left, right) {
  const a=validateLegacySnapshot(left).raw, b=validateLegacySnapshot(right).raw;
  return a.slice(0,4).every((value,i)=>value===b[i]);
}
export function coversLegacy(server, required) {
  const actual = mergeLegacy({}, server), expected = mergeLegacy({}, required);
  return Object.keys(expected).every(k=>actual[k]>=expected[k]);
}
