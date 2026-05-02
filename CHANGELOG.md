# Changelog

## v0.3.1 - 2026-05-02

- Fixed mobile dashboard overlap by increasing Home Assistant size hints for cards that stack into single-column layouts on narrow screens.
- Improved responsive `getCardSize()` and `getGridOptions()` reporting for the probe, compact, countdown, strip, and history cards.

## v0.3.0 - 2026-05-01

- Added `custom:meater-app-card`.
- Added a MEATER-app inspired layout with internal, target, and ambient temperature bubbles.
- Added a large remaining-time arc that uses `remaining_time` / `sensor.*_resterende_tijd`.
- Kept styling aligned with Home Assistant and Mushroom-style cards.

## v0.2.0 - 2026-05-01

- Added `custom:meater-compact-card`.
- Added `custom:meater-countdown-card`.
- Added `custom:meater-strip-card`.
- Made the remaining time sensor more visible in the main live card.
- Documented explicit `remaining_time: sensor.meater_probe_ac7269c8_resterende_tijd` configuration.

## v0.1.0 - 2026-05-01

- Initial HACS Dashboard release.
- Added `custom:meater-probe-card`.
- Added `custom:meater-probe-history-card`.
- Added visual editor support and automatic Dutch/English Meater entity matching.
