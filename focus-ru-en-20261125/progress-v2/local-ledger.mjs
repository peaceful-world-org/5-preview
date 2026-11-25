// Isolated v2 adapter; not loaded by the released application.
import { mergePractice, mergeLegacy, summarize, FOCUS_MODES } from './ledger-contract.mjs';
import { validateLegacySnapshot, coversLegacy, sameSettledLegacy } from './legacy-import.mjs';
import * as removal from './account-removal.mjs';
const GUEST = '00000000-0000-0000-0000-000000000000';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MODES = new Set(['foundation', 'metta', 'free', ...FOCUS_MODES]);
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const request = req => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
const payload = r => ({ ownerId: r.ownerId, id: r.id, mode: r.mode, seconds: r.seconds, completed: r.completed, day: r.day });
const equal = (a, b) => ['ownerId','id','mode','seconds','completed','day'].every(k => a[k] === b[k]);

async function transaction(db, names, write, operation) {
  const tx = write ? db.transaction(names, 'readwrite', { durability: 'strict' }) : db.transaction(names, 'readonly');
  const done = new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onabort = () => reject(tx.error || new Error('transaction aborted'));
    tx.onerror = () => {}; // default abort; wait for terminal event
  });
  // A transaction can abort before the last request rejects.
  done.catch(() => {});
  try {
    const result = await operation(tx);
    await done; // request success alone is NOT a durable commit
    return result;
  } catch (error) {
    try { tx.abort(); } catch (_) {}
    await done.catch(() => {});
    throw error;
  }
}

export async function openLocalLedger({ name = 'pw-progress-v2', indexedDB = globalThis.indexedDB, newId = () => crypto.randomUUID() } = {}) {
  assert(indexedDB, 'IndexedDB unavailable');
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    let blocked = false;
    req.onupgradeneeded = () => {
      for (const key of ['records', 'outbox']) {
        const store = req.result.createObjectStore(key, { keyPath: ['ownerId', 'id'] });
        store.createIndex('owner', 'ownerId');
      }
      req.result.createObjectStore('meta', { keyPath: 'ownerId' });
    };
    req.onblocked = () => { blocked = true; reject(new Error('database upgrade blocked')); };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { if (blocked) req.result.close(); else resolve(req.result); };
  });
  let scope = null, closed = false, failure = null;
  const close = () => { closed = true; scope = null; db.close(); };
  db.onversionchange = close;
  const current = () => { assert(!closed && scope, 'no active progress partition'); return scope; };
  const check = s => assert(!closed && s === scope, 'progress account changed');
  const run = async (s, names, write, fn) => {
    check(s);
    const result = await transaction(db, names, write, async tx => { check(s); return fn(tx); });
    check(s);
    return result;
  };
  function activate(ownerId = null) {
    assert(!closed, 'database closed');
    assert(ownerId === null || (typeof ownerId === 'string' && UUID.test(ownerId) && ownerId !== GUEST), 'invalid account identity');
    // Caller must use a verified Auth uid. This is local partitioning, not authentication.
    scope = { ownerId: ownerId === null ? GUEST : ownerId.toLowerCase() };
    failure = null;
  }
  async function begin(mode, { day = null } = {}) {
    const s = current(), id = newId();
    assert(MODES.has(mode), 'invalid mode');
    assert(typeof id === 'string' && UUID.test(id), 'invalid practice id');
    // Validate the immutable date with the same contract used for credited rows.
    mergePractice(s.ownerId, null, { ownerId: s.ownerId, id, mode, seconds: mode === 'free' ? 1 : 300, completed: true, day });
    const row = { ownerId: s.ownerId, id, mode, day, seconds: 0, completed: false, revision: 0 };
    return run(s, ['records'], true, async tx => { await request(tx.objectStore('records').add(row)); return id; });
  }
  async function record(id, seconds, completed) {
    const s = current();
    return run(s, ['records','outbox'], true, async tx => {
      const records = tx.objectStore('records'), outbox = tx.objectStore('outbox');
      const old = await request(records.get([s.ownerId,id]));
      check(s); assert(old && !old.claimedBy, 'practice not found in active partition');
      const merged = mergePractice(s.ownerId, old.seconds ? payload(old) : null, { ...payload(old), seconds, completed });
      if (equal(merged, old)) return payload(old);
      const next = { ...merged, revision: old.revision + 1 };
      assert(Number.isSafeInteger(next.revision), 'revision overflow');
      await request(records.put(next));
      if (s.ownerId !== GUEST) await request(outbox.put(next));
      return payload(next);
    });
  }
  async function discardDraft(id) {
    const s = current();
    return run(s, ['records'], true, async tx => {
      const store = tx.objectStore('records');
      const row = await request(store.get([s.ownerId,id]));
      check(s); assert(row && !row.claimedBy && row.seconds === 0 && !row.completed, 'only uncredited drafts can be discarded');
      await request(store.delete([s.ownerId,id]));
    });
  }
  async function read() {
    const s = current();
    return run(s, ['records','outbox','meta'], false, async tx => {
      const stored = await request(tx.objectStore('records').index('owner').getAll(s.ownerId));
      const rows = stored.filter(r => !r.claimedBy);
      const pending = await request(tx.objectStore('outbox').index('owner').count(s.ownerId));
      const meta = await request(tx.objectStore('meta').get(s.ownerId));
      const credited = rows.filter(r => r.seconds > 0);
      return { ownerId:s.ownerId, baseline:mergeLegacy({},meta?.baseline ?? {}), rows: rows.map(payload), totals: summarize(s.ownerId, meta?.baseline ?? {}, new Map(credited.map(r => [r.id, r]))), pending,
        legacyPending: Boolean(meta?.legacyPending),
        reconciliation: { state: meta?.scanState ?? 'never', lastSuccessfulScan: meta?.lastSuccessfulScan ?? null },
        lastConfirmed: meta?.lastConfirmed ?? null, state: s.ownerId === GUEST ? 'local' : pending || meta?.legacyPending ? (failure ? 'failed' : 'pending') : meta?.lastConfirmed != null ? 'confirmed' : 'empty' };
    });
  }
  async function flushOne(send) {
    const s = current();
    if (s.ownerId === GUEST) return 'local-only';
    // Transport must bind requests to this immutable verified uid and its auth token.
    const sent = await run(s, ['outbox'], false, tx => request(tx.objectStore('outbox').index('owner').get(s.ownerId)));
    if (!sent) return 'empty';
    try {
      check(s);
      const reply = await send(Object.freeze(payload(sent)));
      check(s);
      const accepted = mergePractice(s.ownerId, null, reply);
      const combined = mergePractice(s.ownerId, payload(sent), accepted);
      assert(equal(combined, accepted), 'server did not confirm sent progress');
      const result = await run(s, ['records','outbox','meta'], true, async tx => {
        const queue = tx.objectStore('outbox'), records = tx.objectStore('records');
        const key = [s.ownerId, sent.id], newest = await request(queue.get(key));
        check(s);
        if (!newest) return 'already-acknowledged';
        if (newest.revision !== sent.revision || !equal(newest, sent)) return 'newer-pending';
        const local = await request(records.get(key));
        check(s); assert(local && local.revision === sent.revision && equal(local, sent), 'ledger/outbox mismatch');
        if (!equal(local, accepted)) await request(records.put({ ...accepted, revision: local.revision + 1 }));
        await request(queue.delete(key));
        // The original guest payload survives until its account-owned row is
        // acknowledged. Then retain only a local ownership receipt.
        const guest = await request(records.get([GUEST, sent.id]));
        check(s);
        if (guest?.claimedBy === s.ownerId && !guest.claimConfirmed) {
          await request(records.put({ ownerId: GUEST, id: sent.id, claimedBy: s.ownerId, claimConfirmed: true }));
        }
        const meta = tx.objectStore('meta');
        const prior = await request(meta.get(s.ownerId));
        check(s);
        await request(meta.put({ ...prior, ownerId: s.ownerId, lastConfirmed: Date.now() }));
        return 'acknowledged';
      });
      failure = null;
      return result;
    } catch (error) {
      if (s === scope) failure = true;
      throw error;
    }
  }
  // A scan is an owner-scoped, durable operation. A new scan supersedes an
  // interrupted scan (including from another tab). It never deletes records.
  async function startScan() {
    const s = current(); assert(s.ownerId !== GUEST, 'guest cannot restore cloud');
    const scanId = crypto.randomUUID();
    return run(s, ['meta'], true, async tx => {
      const meta = tx.objectStore('meta'), prior = await request(meta.get(s.ownerId));
      check(s);
      await request(meta.put({ ...prior, ownerId: s.ownerId, scanId, scanState: 'incomplete', scanBaselineAccepted: false, scanAfter: null, scanTerminal: false }));
      return scanId;
    });
  }
  async function scanMeta(s, tx, scanId) {
    const store = tx.objectStore('meta'), meta = await request(store.get(s.ownerId));
    check(s);
    assert(s.ownerId !== GUEST && meta?.scanId === scanId && meta.scanState === 'incomplete', 'restore scan superseded');
    return { store, meta };
  }
  async function acceptBaseline(scanId, baseline) {
    const s = current();
    const checked = mergeLegacy({}, baseline);
    return run(s, ['meta'], true, async tx => {
      const { store, meta } = await scanMeta(s, tx, scanId);
      await request(store.put({ ...meta, baseline: mergeLegacy(meta.baseline ?? {}, checked), scanBaselineAccepted: true }));
    });
  }
  async function acceptPage(scanId, rows, { after, next }) {
    const s = current();
    assert(Array.isArray(rows) && rows.length <= 200, 'invalid restore page');
    const validated = rows.map(row => mergePractice(s.ownerId, null, row));
    assert(after === null || (typeof after === 'string' && UUID.test(after)), 'invalid restore cursor');
    let cursor = after;
    for (const row of validated) {
      assert(cursor === null || row.id > cursor, 'invalid restore order');
      cursor = row.id;
    }
    assert(next === null || (validated.length > 0 && next === cursor), 'invalid next cursor');
    return run(s, ['records','outbox','meta'], true, async tx => {
      const { store, meta } = await scanMeta(s, tx, scanId);
      assert(meta.scanBaselineAccepted && !meta.scanTerminal && meta.scanAfter === after, 'unexpected restore page');
      const records = tx.objectStore('records'), queue = tx.objectStore('outbox');
      for (const remote of validated) {
        const key = [s.ownerId, remote.id];
        const old = await request(records.get(key));
        check(s);
        // A draft has no credited time, but its identity is already immutable.
        if (old) assert(old.mode === remote.mode && old.day === remote.day, 'immutable draft identity conflict');
        const merged = mergePractice(s.ownerId, old?.seconds ? payload(old) : null, remote);
        if (old && equal(old, merged)) continue;
        const next = { ...merged, revision: (old?.revision ?? 0) + 1 };
        assert(Number.isSafeInteger(next.revision), 'revision overflow');
        const pending = await request(queue.get(key));
        check(s);
        if (pending) assert(old && pending.revision === old.revision && equal(pending, old), 'ledger/outbox mismatch');
        await request(records.put(next));
        // Do not discard a pending upload on a pull. Only its validated ACK
        // clears it; if the server was ahead, send the merged canonical row.
        if (pending) await request(queue.put(next));
      }
      await request(store.put({ ...meta, scanAfter: next, scanTerminal: next === null }));
    });
  }
  async function finishScan(scanId) {
    const s = current();
    return run(s, ['meta','outbox'], true, async tx => {
      const { store, meta } = await scanMeta(s, tx, scanId);
      assert(meta.scanBaselineAccepted && meta.scanTerminal, 'restore scan incomplete');
      const pending = await request(tx.objectStore('outbox').index('owner').count(s.ownerId));
      check(s);
      if (pending !== 0 || meta.legacyPending) return 'pending';
      // This is the end of a full keyset scan, NOT an atomic server snapshot.
      await request(store.put({ ...meta, scanState: 'complete', lastSuccessfulScan: Date.now() }));
      return 'complete';
    });
  }
  // One immutable device snapshot; retain the original raw values and never
  // erase the v1 keys here. Cutover must stop v1 writers before capture.
  function visibleOffer(s, staged) {
    if (!staged || (staged.ownerId && staged.ownerId !== s.ownerId)) return null;
    return { id: staged.id, baseline: staged.baseline, state: staged.state };
  }
  async function stageLegacy(raw) {
    const s = current(), snapshot = validateLegacySnapshot(raw);
    return run(s, ['meta'], true, async tx => {
      const meta = tx.objectStore('meta'), device = await request(meta.get(GUEST));
      check(s);
      if(device?.legacyRetired)return null;
      const existing = device?.legacySnapshot;
      if (existing) {
        assert(sameSettledLegacy(existing.raw,snapshot.raw), 'legacy snapshot changed; explicit reconciliation required');
        return visibleOffer(s, existing);
      }
      const staged = { ...snapshot, id: crypto.randomUUID(), state: 'offered', ownerId: null };
      await request(meta.put({ ...device, ownerId: GUEST, legacySnapshot: staged }));
      return visibleOffer(s, staged);
    });
  }
  async function legacyOffer() {
    const s = current();
    return run(s, ['meta'], false, async tx => {
      const device = await request(tx.objectStore('meta').get(GUEST));
      return visibleOffer(s, device?.legacySnapshot);
    });
  }
  // Explicit user choice: continue without an account, or attach the legacy
  // aggregate to the active verified account. A snapshot has one owner only.
  async function adoptLegacy(id) {
    const s = current();
    return run(s, ['meta'], true, async tx => {
      const meta = tx.objectStore('meta'), device = await request(meta.get(GUEST));
      check(s);
      const staged = device?.legacySnapshot;
      assert(staged && staged.id === id, 'legacy offer unavailable');
      assert(!staged.ownerId || staged.ownerId === s.ownerId, 'legacy snapshot already belongs to another account');
      if (staged.ownerId === s.ownerId) return staged.state;
      if (s.ownerId === GUEST) {
        await request(meta.put({ ...device, baseline: staged.baseline, legacySnapshot: { ...staged, state: 'local' } }));
        return 'local';
      }
      const prior = await request(meta.get(s.ownerId));
      check(s);
      const pending = { id, baseline: staged.baseline };
      await request(meta.put({ ...prior, ownerId: s.ownerId, baseline: mergeLegacy(prior?.baseline ?? {}, staged.baseline), legacyPending: pending, scanState: 'incomplete' }));
      // Remove only the guest's adopted aggregate, not any new guest sessions.
      await request(meta.put({ ...device, baseline: {}, legacySnapshot: { ...staged, ownerId: s.ownerId, state: 'pending' } }));
      return 'pending';
    });
  }
  async function pendingLegacy() {
    const s = current();
    return run(s, ['meta'], false, async tx => (await request(tx.objectStore('meta').get(s.ownerId)))?.legacyPending ?? null);
  }
  async function confirmLegacy(id, serverBaseline) {
    const s = current(); assert(s.ownerId !== GUEST, 'guest has no cloud import');
    return run(s, ['meta'], true, async tx => {
      const meta = tx.objectStore('meta'), prior = await request(meta.get(s.ownerId)), device = await request(meta.get(GUEST));
      check(s);
      const staged = device?.legacySnapshot;
      assert(staged?.id === id && staged.ownerId === s.ownerId, 'legacy import owner mismatch');
      assert(coversLegacy(serverBaseline, staged.baseline), 'server did not confirm legacy progress');
      if (staged.state === 'confirmed') return 'confirmed';
      assert(prior?.legacyPending?.id === id, 'legacy import receipt missing');
      await request(meta.put({ ...prior, baseline: mergeLegacy(prior.baseline, serverBaseline), legacyPending: null }));
      await request(meta.put({ ...device, legacySnapshot: { ...staged, state: 'confirmed' } }));
      return 'confirmed';
    });
  }
  // Explicit claim of completed guest sessions only. Unfinished timers and
  // undated legacy aggregates use their existing separate recovery paths.
  async function guestOffer() {
    const s = current(); assert(s.ownerId !== GUEST, 'verified account required');
    return run(s, ['records'], false, async tx => {
      const all = await request(tx.objectStore('records').index('owner').getAll(GUEST));
      const rows = all.filter(r => !r.claimedBy && r.completed && r.seconds > 0).sort((a,b)=>a.id.localeCompare(b.id));
      const batch = rows.slice(0,200);
      const totals = summarize(GUEST, {}, new Map(batch.map(r=>[r.id,r])));
      return { ids: batch.map(r=>r.id), practices: totals.practices, seconds: totals.seconds,
        remaining: rows.length-batch.length, unfinished: all.filter(r=>!r.claimedBy&&!r.completed&&r.seconds>0).length };
    });
  }
  async function claimGuest(ids) {
    const s = current(); assert(s.ownerId !== GUEST, 'verified account required');
    assert(Array.isArray(ids) && ids.length > 0 && ids.length <= 200 && ids.every(id=>typeof id==='string'&&UUID.test(id)) && new Set(ids).size===ids.length, 'invalid guest selection');
    return run(s, ['records','outbox','meta'], true, async tx => {
      const records = tx.objectStore('records'), queue = tx.objectStore('outbox');
      let claimed = 0, alreadyClaimed = 0;
      for (const id of ids) {
        const source = await request(records.get([GUEST,id]));
        const target = await request(records.get([s.ownerId,id]));
        check(s); assert(source, 'guest practice unavailable');
        if (source.claimedBy) {
          assert(source.claimedBy===s.ownerId && target, 'guest practice already assigned to another account or missing receipt');
          alreadyClaimed++; continue;
        }
        assert(source.completed && source.seconds > 0, 'only completed guest practices can be claimed');
        assert(!target, 'guest practice identity conflict');
        const row = {...mergePractice(s.ownerId,null,{...payload(source),ownerId:s.ownerId}),revision:1};
        await request(records.add(row));
        await request(queue.add(row));
        await request(records.put({...source,claimedBy:s.ownerId,claimConfirmed:false}));
        claimed++;
      }
      if (claimed) {
        const meta = tx.objectStore('meta'), prior = await request(meta.get(s.ownerId));
        check(s); await request(meta.put({...prior,ownerId:s.ownerId,scanState:'incomplete'}));
      }
      return {claimed,alreadyClaimed};
    });
  }
  // A timer handle is bound to the scope at creation, not whichever account
  // happens to be active when its delayed completion callback fires.
  async function beginBound(mode, options) {
    const s = current(), id = await begin(mode, options);
    check(s);
    return Object.freeze({ id, record(seconds, completed) { check(s); return record(id, seconds, completed); }, discard() { check(s); return discardDraft(id); } });
  }
  // The deletion journal survives loss of the active auth scope. The
  // only operation which can start it requires the current verified owner.
  const readRemoval=()=>transaction(db,['meta'],false,tx=>removal.readRemoval(tx,request));
  function stageRemoval(id){
    const s=current();assert(s.ownerId!==GUEST&&s.ownerId===id,'Deletion owner mismatch');
    return run(s,['meta'],true,tx=>removal.stageRemoval(tx,request,id));
  }
  const confirmRemoval=id=>transaction(db,['meta'],true,tx=>removal.confirmRemoval(tx,request,id));
  const purgeRemoval=id=>transaction(db,['meta','records','outbox'],true,tx=>removal.purgeRemoval(tx,request,id));
  const finishRemoval=id=>transaction(db,['meta'],true,tx=>removal.finishRemoval(tx,request,id));
  return Object.freeze({readRemoval,stageRemoval,confirmRemoval,purgeRemoval,finishRemoval, activate, lock() { scope = null; failure = null; }, close, begin, beginBound, record, discardDraft, read, flushOne, startScan, acceptBaseline, acceptPage, finishScan, stageLegacy, legacyOffer, adoptLegacy, pendingLegacy, confirmLegacy, guestOffer, claimGuest });
}
