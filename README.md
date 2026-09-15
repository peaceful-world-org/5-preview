# 5 Preview — public infrastructure

> This is a supporting infrastructure repository, not the main development repository for 5 Practice.

**5 Practice** is Peaceful World's five-minute secular practice for training more peaceful responses.

- [Open 5 Practice](https://5.peaceful-world.org/)
- [Peaceful World on GitHub](https://github.com/peaceful-world-org)
- [Follow the current 5 Practice phase](https://github.com/peaceful-world-org/.github/issues/10)
- [Volunteer with Peaceful World](https://github.com/peaceful-world-org/.github/blob/main/VOLUNTEER.md)
- [Support Peaceful World](https://peaceful-world.org/help)

## What this repository does

This repository provides a permanent isolated preview environment for **5 Practice**.

Production: `https://5.peaceful-world.org/`

Preview: `https://preview-5.peaceful-world.org/`

It contains preview artifacts only. Source development remains in the private `peaceful-world-org/5` repository while active product and release work is underway.

## Design comparator

The preview host has a small preview-only design switcher in the top-right corner.

- `A` — Original palette.
- `B` — Warm polish (`#171A18` numeral, refined muted/brand tones and stronger tiny-text contrast).

The selected variant persists in local storage and is also reflected in the URL as `?design=a` or `?design=b`, so comparisons can be shared directly.

Future visual variants can be added through the `VARIANTS` object in `preview-design.js`. The comparator is never loaded on production.

The `Reset preview from production` workflow is manual-only. When used, it refreshes the base application from production while preserving the preview-only design lab.
