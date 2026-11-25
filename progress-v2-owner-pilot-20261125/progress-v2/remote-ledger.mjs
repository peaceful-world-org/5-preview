// Isolated transport candidate. Never imported by released app.
// The caller must obtain the verified uid and the corresponding access token.
// Every RPC receives that uid as an expected identity; the server checks auth.uid().
import { mergePractice, mergeLegacy } from './ledger-contract.mjs';
import { coversLegacy } from './legacy-import.mjs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
function integer(value) {
  assert(typeof value === 'number' || (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)), 'invalid server integer');
  const n = Number(value);
  assert(Number.isSafeInteger(n) && n >= 0, 'invalid server integer');
  return n;
}
function rowFromServer(ownerId, row) {
  assert(row && row.user_id === ownerId, 'wrong server account');
  return mergePractice(ownerId, null, { ownerId, id: row.practice_id, mode: row.mode, seconds: integer(row.seconds), completed: row.completed, day: row.practice_day ?? null });
}
function single(value) {
  if (Array.isArray(value)) { assert(value.length === 1, 'invalid RPC response'); return value[0]; }
  return value;
}
export function createRemoteLedger({ url, publishableKey, ownerId, accessToken, fetchImpl = globalThis.fetch }) {
  const origin = new URL(url);
  assert(origin.protocol === 'https:' && origin.pathname === '/' && !origin.search && !origin.hash && !origin.username && !origin.password, 'invalid backend URL');
  assert(UUID.test(ownerId) && ownerId !== '00000000-0000-0000-0000-000000000000', 'invalid account identity');
  assert(typeof publishableKey === 'string' && publishableKey.startsWith('sb_publishable_') && typeof accessToken === 'string' && accessToken.length > 0, 'missing credentials');
  async function rpc(name, args) {
    const result = await fetchImpl(new URL('/rest/v1/rpc/' + name, origin), {
      method: 'POST', redirect: 'error', cache: 'no-store', credentials: 'omit',
      headers: { apikey: publishableKey, Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...args, p_expected_user: ownerId })
    });
    if (!result.ok) { const err = new Error('progress RPC failed (' + result.status + ')'); err.status = result.status; throw err; }
    return result.json();
  }
  return Object.freeze({
    ownerId,
    async send(row) {
      const checked = mergePractice(ownerId, null, row);
      const value = single(await rpc('merge_practice_session_v2', { p_practice_id: checked.id, p_mode: checked.mode, p_seconds: checked.seconds, p_completed: checked.completed, p_day: checked.day }));
      const accepted = rowFromServer(ownerId, value);
      assert(accepted.id === checked.id, 'wrong practice acknowledgement');
      const merged = mergePractice(ownerId, checked, accepted);
      assert(['id','ownerId','mode','seconds','completed','day'].every(k => merged[k] === accepted[k]), 'server did not confirm sent progress');
      return accepted;
    },
    async importLegacy(baseline) {
      const checked = mergeLegacy({}, baseline);
      const value = single(await rpc('import_legacy_progress_v2', { p_guided_practices: checked.guided_practices, p_guided_seconds: checked.guided_seconds, p_free_practices: checked.free_practices, p_free_seconds: checked.free_seconds, p_metta_practices: checked.metta_practices }));
      assert(value && value.user_id === ownerId, 'wrong server account');
      const accepted = Object.fromEntries(Object.keys(checked).map(key => [key, integer(value[key])]));
      assert(coversLegacy(accepted, checked), 'server did not confirm legacy progress');
      return accepted;
    },
    async readBaseline() {
      const value = single(await rpc('read_practice_baseline_v2', {}));
      assert(value && value.user_id === ownerId, 'wrong server account');
      const baseline = Object.fromEntries(['guided_practices','guided_seconds','free_practices','free_seconds','metta_practices','metta_seconds'].map(key => [key, integer(value[key])]));
      return mergeLegacy({}, baseline);
    },
    async readPage(after = null, limit = 100) {
      assert(after === null || UUID.test(after), 'invalid page cursor');
      assert(Number.isInteger(limit) && limit >= 1 && limit <= 200, 'invalid page limit');
      const value = await rpc('list_practice_sessions_v2', { p_after: after, p_limit: limit });
      assert(Array.isArray(value) && value.length <= limit, 'invalid history page');
      const rows = value.map(row => rowFromServer(ownerId, row));
      let cursor = after;
      for (const row of rows) { assert(UUID.test(row.id) && (cursor === null || row.id > cursor), 'invalid history ordering'); cursor = row.id; }
      return { rows, next: rows.length === limit ? cursor : null };
    }
  });
}
