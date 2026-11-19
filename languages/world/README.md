# World Practice · isolated concept preview

Preview route: https://preview-5.peaceful-world.org/languages/world/?lang=ru&demo=1

This is **not the production app**. It is a stage-only copy of the 18 Nov 2026 /languages/ eight-locale review shell. The `<base href="/languages/">` keeps its original scripts and locale assets intact; only this route loads `world.css` and `world.js`. The root /languages/ QA, main preview and production are unchanged.

Goals: Free-first start vs Foundation-first comparison, calm larger desktop Home, visible practice curriculum, expandable 30-concept practice atlas and independent 46-variant language candidate list, 8 available locale choices, and light reading/contrast improvements. Draft learning concepts shown in RU/EN only with a disclosure in other languages. The multilingual candidate list is a **working concept for translating the 5 app**. Candidates require prioritization, professional review and implementation; none is a ready or promised app translation. Research publications unrelated to the app are not cited in this UI.

Safety: no account creation, cloud sync, feedback submission, PWA installation or native builds on this preview. Runtime must keep real practice mode IDs, time counters and saved history unchanged. No analytics experimentation without an approved measurement plan.

Acceptance: 320/375/430px mobile + desktop, 8 locales, switchers, all 3 practice starts, examples, Free pause/exit, dark/light, 200/400% zoom, aria and offline considerations. Read-only page QA is insufficient to claim physical device QA.

Sources: 5 product issues #184, #185, #186; 5-preview experiments/UX_AUDIT_2026-11-12.md.

Out of scope: new languages, any native store release, editing current production PWA, replacing the previously audited manual-ready/exit variants. Behavioral audit changes are still separate until reviewed and regression tested.

## Stable cross-device review (2026-11-18)

User link: https://preview-5.peaceful-world.org/languages/world/?lang=ru

- One responsive URL for phone, tablet and desktop, no demo/QA query needed.
- Diagnostic A/B overlay removed from user-facing HTML. Preview-only restrictions remain: noindex, no PWA installation, no feedback submission or cloud progress sync.
- Free, Foundation and Mettā retain their original runtime action IDs; full atlas is expandable and the language map remains visible without promising unreleased translations.
- 700–979px tablet now uses full width; <=699px phone remains stacked; >=980px desktop retains coherent grouped hero and 2/3-card width logic. Real phone and screen-reader QA remain a separate gate.

## Language-map UX correction (2026-11-19)

The previous prototype incorrectly tied future app languages to the editions of an unrelated peace-research document. This association has been removed from the UI and roadmap metadata. The 46 exploratory target variants are now explicitly presented as unapproved translation possibilities for 5, not existing translated app versions. All eight preview locales have updated copy. Expanded chips have explicit row gaps, wrapping and separation from section dividers across screen sizes. No changes to timers, runtime locale registry or production.
