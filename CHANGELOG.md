# Changelog

## v0.3.6 - 2026-05-02

- Switched the visual editor color fields to Home Assistant's native color picker so shared, app, and history colors are easier to configure.

## v0.3.5 - 2026-05-02

- Fixed the visual editors so styling and history options show their effective default values instead of empty fields.
- Kept the saved card config clean by stripping unchanged default values back out when editing.

## v0.3.4 - 2026-05-02

- Fixed the Meater app card so the target pointer stays at 12 o'clock while the core and ambient pointers move with their temperatures.
- Fixed the history card to parse Home Assistant's compact history websocket response correctly, so charts render points again.
- Added configurable styling across the cards, including shared palette colors, progress bar thickness, tile meter thickness, app arc width, app pointer/bubble colors, and history chart line styling.

## v0.3.3 - 2026-05-02

- Fixed Home Assistant Sections sizing for the compact, strip, and app cards by aligning their reported height with the rendered card height.
- Made all Meater cards default to a full 12-column width in the layout editor while keeping lower minimum widths where manual shrinking is allowed.

## v0.3.2 - 2026-05-02

- Fixed Sections view card overlap by switching the Meater cards to auto-height grid rows instead of fixed row spans.
- This makes the probe, compact, countdown, strip, app, and history cards follow their intrinsic height more reliably across responsive section widths.

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
