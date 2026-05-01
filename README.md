# Meater Home Assistant Cards

Mushroom-style Lovelace cards for Meater probe sensors in Home Assistant.

The repository ships two frontend cards:

- `custom:meater-probe-card` for live core temperature, ambient temperature, target, timing, status, and progress.
- `custom:meater-probe-history-card` for BBQ-style temperature history.

![Meater BBQ cards preview](docs/images/preview.svg)

## Installation

### HACS

1. Open HACS.
2. Add `https://github.com/gielk/meater-bbq-card` as a custom repository.
3. Choose category `Dashboard`.
4. Install `Meater BBQ Cards`.
5. Refresh the browser cache.

HACS should add the frontend resource automatically. If you add it manually, use:

```yaml
url: /hacsfiles/meater-bbq-card/meater-bbq-card.js
type: module
```

### Manual

Copy `meater-bbq-card.js` to `www/community/meater-bbq-card/meater-bbq-card.js` and add this dashboard resource:

```yaml
url: /local/community/meater-bbq-card/meater-bbq-card.js
type: module
```

## Quick Start

After installation, the cards are available in the Home Assistant card picker as `Meater Probe Card` and `Meater Probe History`.

For a single Meater probe, the cards usually auto-detect the sensor set:

```yaml
type: custom:meater-probe-card
```

Add the history card below it:

```yaml
type: custom:meater-probe-history-card
hours_to_show: 3
refresh_interval: 300
```

## Entity Matching

The cards look for Meater-style sensor suffixes, including the Dutch entity names from the current dashboard:

- `sensor.*_interne_temperatuur`
- `sensor.*_omgevingstemperatuur`
- `sensor.*_doeltemperatuur`
- `sensor.*_piektemperatuur`
- `sensor.*_kookstatus`
- `sensor.*_kookt`
- `sensor.*_resterende_tijd`
- `sensor.*_tijd_verstreken`

English-style suffixes such as `*_core_temperature`, `*_ambient_temperature`, and `*_target_temperature` are also supported.

If auto-detection cannot find the right probe, configure the core sensor or the entity prefix:

```yaml
type: custom:meater-probe-card
core_temp: sensor.meater_probe_ac7269c8_interne_temperatuur
```

or:

```yaml
type: custom:meater-probe-card
entity_prefix: meater_probe_ac7269c8
```

## Full Example

```yaml
type: sections
title: Meater
sections:
  - cards:
      - type: custom:meater-probe-card
        entity_prefix: meater_probe_ac7269c8
  - cards:
      - type: custom:meater-probe-history-card
        entity_prefix: meater_probe_ac7269c8
        hours_to_show: 3
        refresh_interval: 300
```

## Options

### Shared Options

| Option | Type | Description |
| --- | --- | --- |
| `name` | string | Optional card title. |
| `device_id` | device selector | Optional Home Assistant device selector from the visual editor. |
| `entity_prefix` | string | Prefix such as `meater_probe_ac7269c8`. |
| `core_temp` | entity | Core/internal temperature sensor. |
| `ambient_temp` | entity | Ambient/BBQ temperature sensor. |
| `target_temp` | entity | Target temperature sensor. |
| `peak_temp` | entity | Peak temperature sensor. |
| `cook_status` | entity | Cook status sensor. |
| `cook_name` | entity | Food/cook name sensor. |
| `remaining_time` | entity | Remaining time or estimated finish sensor. |
| `elapsed_time` | entity | Elapsed time or start time sensor. |

### History Card Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `hours_to_show` | number | `3` | History window in hours. |
| `refresh_interval` | number | `300` | Refresh interval in seconds. |

## Notes

This is a frontend-only card. It does not connect to Meater directly and does not create sensors. Use it with sensors already present in Home Assistant.
