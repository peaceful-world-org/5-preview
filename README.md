# 5-preview

Permanent isolated preview environment for **5 · Peace Practice by Peaceful World**.

Production remains at `https://5.peaceful-world.org/`.

Preview target: `https://preview-5.peaceful-world.org/`.

This repository contains preview artifacts only; source development remains in the private `peaceful-world-org/5` repository.

## Design comparator

The preview host has a small preview-only design switcher in the top-right corner.

- `A` — Original palette.
- `B` — Warm polish (`#171A18` numeral, refined muted/brand tones and stronger tiny-text contrast).

The selected variant persists in local storage and is also reflected in the URL as `?design=a` or `?design=b`, so comparisons can be shared directly.

Future color, typography, spacing, or other visual variants can be added in one place: the `VARIANTS` object in `preview-design.js`. The comparator is never loaded on production.

The `Reset preview from production` workflow is manual-only. When used, it refreshes the base application from production while preserving the preview-only design lab.
