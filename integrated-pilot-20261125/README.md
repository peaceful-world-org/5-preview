# 5 · Integrated RU pilot 1 (2026-11-25)

Isolated guest-only test release combining approved Focus v4 with the My Progress review derived from PR #206 (261073b). Original previews preserved. 12 modes, 9 new candidates, 45 exact steps/hints. Default and ?demo=1 fast review never record sessions; ?mode=practice uses full timer and local v2 ledger. Calendar dates opt-in; per-mode totals; export; no account/cloud/analytics, no new worker or production data. Separate local storage and IndexedDB. Not an approval to merge or release native builds.

## Layout correction (revision 2)

Scoped Home-only CSS: unified content width, one shared desktop catalog surface, vertical mobile/tablet catalog, right-aligned progress summary, bounded calendar and explicit free-timer action layout. All runtime scripts, copy, existing local ledger and preferences are unchanged. Browser visual QA is pending.

## Revision 3

Align both information buttons on a single right-side rail, reserve independent action space, and preserve mobile full-width Foundation CTA. Fast review does not await the guest ledger, so another tab holding the write lock cannot prevent reviewing all practice steps. Full practice remains guarded by the original ledger initialization. The preview Pages workflow now waits for the uniquely named artifact to appear in the Actions API before deploying. No history is reset or cleared.

## Revision 4

Restore the existing Free practice start button as an explicit gold CTA; share the Foundation grid, desktop action dimensions, info-button rail and mobile full-width CTA. No changes to timers, event bindings, text, progress history or release behavior.
