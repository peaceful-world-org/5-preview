// Isolated v2 orchestration candidate; no production runtime wiring.
// The server and local ledger each retain their own account and payload checks.
import { createRemoteLedger } from './remote-ledger.mjs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const assert = (ok, message) => { if (!ok) throw new Error(message); };

// getUser(jwt) verifies the specific token, unlike reading cached session.user.
// Auth callbacks should synchronously invalidate on sign-out/account change,
// then invoke connect outside the SDK's callback/lock. Never log access tokens.
export function createProgressSync({ ledger, auth, url, publishableKey,
  fetchImpl = globalThis.fetch, pageSize = 100, maxPages = 1000, maxUploads = 1000 }) {
  assert(Number.isInteger(pageSize) && pageSize >= 1 && pageSize <= 200, 'invalid page size');
  assert(Number.isInteger(maxPages) && maxPages > 0 && Number.isInteger(maxUploads) && maxUploads > 0, 'invalid sync limits');
  let epoch = 0, active = null, localOwner = null, closed = false;
  function invalidate({ keepLocal = false } = {}) {
    ++epoch;
    active?.abort.abort(); active = null;
    if (!keepLocal) { ledger.lock(); localOwner = null; }
    return epoch;
  }
  function lock() { invalidate(); }
  function guest() { assert(!closed, 'coordinator closed'); lock(); ledger.activate(); }
  function close() { lock(); closed = true; ledger.close(); }
  async function connect(session) {
    assert(!closed, 'coordinator closed');
    const expected = session?.user?.id, token = session?.access_token;
    if (typeof expected !== 'string' || !UUID.test(expected) || expected === '00000000-0000-0000-0000-000000000000' || typeof token !== 'string' || !token) {
      lock(); throw new Error('valid session required');
    }
    // A refresh of the same already verified owner does not interrupt the local
    // timer/ledger. While verifying the replacement token, no cloud sync runs.
    const sameOwner = localOwner === expected;
    const attempt = invalidate({ keepLocal: sameOwner });
    const stillCurrent = () => assert(!closed && attempt === epoch, 'progress account changed');
    let result;
    try { result = await auth.getUser(token); }
    catch (_) { stillCurrent(); throw new Error('account verification unavailable'); }
    stillCurrent();
    const user = result?.data?.user;
    if (result?.error || !user || user.id !== expected || user.is_anonymous !== false || !user.email_confirmed_at) {
      lock(); throw new Error('verified permanent email account required');
    }
    const abort = new AbortController();
    const remote = createRemoteLedger({ url, publishableKey, ownerId: expected, accessToken: token,
      fetchImpl: (input, init) => fetchImpl(input, { ...init, signal: abort.signal }) });
    if (!sameOwner) ledger.activate(expected);
    localOwner = expected;
    active = { epoch: attempt, ownerId: expected, remote, abort, flight: null };
    return expected;
  }
  function check(s) { assert(!closed && active === s && s.epoch === epoch, 'progress account changed'); }
  async function run(s) {
    check(s);
    // Incomplete status is persisted before the first network request. An
    // interrupted scan never erases previously known rows or legacy totals.
    const scan = await ledger.startScan(); check(s);
    const legacy = await ledger.pendingLegacy(); check(s);
    if (legacy) {
      const accepted = await s.remote.importLegacy(legacy.baseline); check(s);
      await ledger.confirmLegacy(legacy.id, accepted); check(s);
    }
    const baseline = await s.remote.readBaseline(); check(s);
    await ledger.acceptBaseline(scan, baseline); check(s);
    let after = null, terminal = false, pages = 0;
    while (pages < maxPages) {
      const page = await s.remote.readPage(after, pageSize); check(s);
      await ledger.acceptPage(scan, page.rows, { after, next: page.next }); check(s);
      pages++;
      if (page.next === null) { terminal = true; break; }
      after = page.next;
    }
    // Do not pretend a truncated history is a completed restore. A bounded
    // scan needs a later larger limit/resumable paging strategy if exhausted.
    assert(terminal, 'history scan limit reached');
    let uploads = 0;
    while (uploads < maxUploads) {
      check(s);
      const result = await ledger.flushOne(async row => {
        check(s);
        const reply = await s.remote.send(row);
        check(s);
        return reply;
      });
      check(s);
      if (result === 'empty') break;
      assert(result !== 'local-only', 'unexpected guest partition');
      uploads++;
    }
    const status = await ledger.finishScan(scan); check(s);
    return { status, pages, uploads };
  }
  function sync() {
    assert(!closed && active, 'no verified cloud account');
    const s = active;
    // Coalesce simultaneous triggers in this coordinator. Other tabs remain
    // independent; durable scan IDs and server idempotency prevent false ACKs.
    if (s.flight) return s.flight;
    const flight = run(s).finally(() => { if (s.flight === flight) s.flight = null; });
    s.flight = flight;
    return flight;
  }
  return Object.freeze({ connect, lock, guest, close, sync });
}
