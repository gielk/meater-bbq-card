const MEATER_BBQ_CARD_VERSION = "0.3.3";
const MEATER_PROBE_CARD_TAG = "meater-probe-card";
const MEATER_HISTORY_CARD_TAG = "meater-probe-history-card";
const MEATER_COMPACT_CARD_TAG = "meater-compact-card";
const MEATER_COUNTDOWN_CARD_TAG = "meater-countdown-card";
const MEATER_STRIP_CARD_TAG = "meater-strip-card";
const MEATER_APP_CARD_TAG = "meater-app-card";
const MEATER_PROBE_CARD_EDITOR_TAG = "meater-probe-card-editor";
const MEATER_HISTORY_CARD_EDITOR_TAG = "meater-probe-history-card-editor";

const UNAVAILABLE_STATES = new Set(["unknown", "unavailable", "", null, undefined]);

const ENTITY_KEYS = [
  "core_temp",
  "ambient_temp",
  "target_temp",
  "peak_temp",
  "cook_status",
  "cook_name",
  "remaining_time",
  "elapsed_time",
];

const ENTITY_DEFINITIONS = {
  core_temp: {
    domain: "sensor",
    suffixes: [
      "_interne_temperatuur",
      "_internal_temperature",
      "_core_temperature",
      "_core_temp",
      "_meat_temperature",
    ],
  },
  ambient_temp: {
    domain: "sensor",
    suffixes: [
      "_omgevingstemperatuur",
      "_ambient_temperature",
      "_ambient_temp",
      "_bbq_temperature",
    ],
  },
  target_temp: {
    domain: "sensor",
    suffixes: [
      "_doeltemperatuur",
      "_target_temperature",
      "_target_temp",
    ],
  },
  peak_temp: {
    domain: "sensor",
    suffixes: [
      "_piektemperatuur",
      "_peak_temperature",
      "_peak_temp",
    ],
  },
  cook_status: {
    domain: "sensor",
    suffixes: [
      "_kookstatus",
      "_cook_status",
      "_status",
    ],
  },
  cook_name: {
    domain: "sensor",
    suffixes: [
      "_kookt",
      "_cooking",
      "_cook",
      "_food",
    ],
  },
  remaining_time: {
    domain: "sensor",
    suffixes: [
      "_resterende_tijd",
      "_remaining_time",
      "_time_remaining",
      "_estimated_end_time",
    ],
  },
  elapsed_time: {
    domain: "sensor",
    suffixes: [
      "_tijd_verstreken",
      "_elapsed_time",
      "_time_elapsed",
      "_start_time",
    ],
  },
};

const EDITOR_LABELS = {
  name: "Name",
  device_id: "Meater device",
  entity_prefix: "Entity prefix",
  core_temp: "Core temperature",
  ambient_temp: "Ambient temperature",
  target_temp: "Target temperature",
  peak_temp: "Peak temperature",
  cook_status: "Cook status",
  cook_name: "Cook name / food",
  remaining_time: "Remaining time",
  elapsed_time: "Elapsed / start time",
  hours_to_show: "Hours to show",
  refresh_interval: "Refresh interval",
};

const html = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const escapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return escapes[char];
  });

const entityDomain = (entityId) => String(entityId ?? "").split(".")[0];

const entityObjectId = (entityId) =>
  String(entityId ?? "").includes(".")
    ? String(entityId).split(".").slice(1).join(".")
    : "";

const registryEntry = (hass, entityId) => hass?.entities?.[entityId];

const isAvailable = (stateObj) =>
  Boolean(stateObj && !UNAVAILABLE_STATES.has(stateObj.state));

const numericState = (stateObj) => {
  if (!isAvailable(stateObj)) {
    return null;
  }
  const numeric = Number(stateObj.state);
  return Number.isFinite(numeric) ? numeric : null;
};

const percent = (value, max) => {
  const current = Number(value);
  const target = Number(max);
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (current / target) * 100));
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0m";
  }
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const parsedTimestamp = (state) => {
  if (UNAVAILABLE_STATES.has(state)) {
    return null;
  }
  const text = String(state ?? "").trim();
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatTemperature = (stateObj, fallback = "--") => {
  const value = numericState(stateObj);
  if (value === null) {
    return fallback;
  }
  return `${Math.round(value)}${stateObj.attributes?.unit_of_measurement ?? "\u00b0C"}`;
};

const formatPlainValue = (stateObj, fallback = "--") => {
  if (!isAvailable(stateObj)) {
    return fallback;
  }
  const unit = stateObj.attributes?.unit_of_measurement ?? "";
  return `${stateObj.state}${unit ? ` ${unit}` : ""}`;
};

const formatRemaining = (stateObj) => {
  if (!isAvailable(stateObj)) {
    return "--";
  }
  const timestamp = parsedTimestamp(stateObj.state);
  if (timestamp !== null) {
    return formatDuration((timestamp - Date.now()) / 1000);
  }
  const numeric = Number(stateObj.state);
  if (Number.isFinite(numeric)) {
    return formatDuration(numeric * 60);
  }
  return String(stateObj.state);
};

const formatFinishTime = (stateObj) => {
  const timestamp = parsedTimestamp(stateObj?.state);
  if (timestamp === null) {
    return "";
  }
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFinishLabel = (stateObj, fallback = "Meater ETA") => {
  const finishTime = formatFinishTime(stateObj);
  return finishTime ? `Ready ${finishTime}` : fallback;
};

const formatElapsed = (stateObj) => {
  if (!isAvailable(stateObj)) {
    return "--";
  }
  const timestamp = parsedTimestamp(stateObj.state);
  if (timestamp !== null) {
    return formatDuration((Date.now() - timestamp) / 1000);
  }
  const numeric = Number(stateObj.state);
  if (Number.isFinite(numeric)) {
    return formatDuration(numeric * 60);
  }
  return String(stateObj.state);
};

const normalizeLabel = (value, fallback) => {
  if (!value || UNAVAILABLE_STATES.has(value)) {
    return fallback;
  }
  return String(value).replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());
};

const definitionMatches = (entityId, key) => {
  const definition = ENTITY_DEFINITIONS[key];
  if (!definition || entityDomain(entityId) !== definition.domain) {
    return false;
  }
  const objectId = entityObjectId(entityId);
  return definition.suffixes.some((suffix) => objectId.endsWith(suffix));
};

const stripKnownSuffix = (entityId, key) => {
  const objectId = entityObjectId(entityId);
  for (const suffix of ENTITY_DEFINITIONS[key]?.suffixes ?? []) {
    if (objectId.endsWith(suffix)) {
      return objectId.slice(0, -suffix.length);
    }
  }
  return objectId;
};

const configuredEntity = (config, key) => config[key] || undefined;

const deviceEntity = (hass, deviceId, key) => {
  if (!hass?.states || !deviceId) {
    return undefined;
  }
  return Object.keys(hass.states)
    .filter((entityId) => registryEntry(hass, entityId)?.device_id === deviceId)
    .find((entityId) => definitionMatches(entityId, key));
};

const defaultEntityForPrefix = (hass, prefix, key) => {
  const definition = ENTITY_DEFINITIONS[key];
  if (!prefix || !definition?.suffixes?.length) {
    return undefined;
  }
  const existing = definition.suffixes
    .map((suffix) => `${definition.domain}.${prefix}${suffix}`)
    .find((entityId) => hass?.states?.[entityId]);
  if (existing) {
    return existing;
  }
  return `${definition.domain}.${prefix}${definition.suffixes[0]}`;
};

const findMeaterCoreCandidates = (hass) =>
  Object.keys(hass?.states ?? {}).filter((entityId) => definitionMatches(entityId, "core_temp"));

const inferMeaterPrefix = (hass, config) => {
  if (config.entity_prefix) {
    return config.entity_prefix;
  }
  if (config.core_temp) {
    return stripKnownSuffix(config.core_temp, "core_temp");
  }
  if (config.device_id) {
    const core = deviceEntity(hass, config.device_id, "core_temp");
    if (core) {
      return stripKnownSuffix(core, "core_temp");
    }
  }
  const candidates = findMeaterCoreCandidates(hass);
  return candidates.length === 1 ? stripKnownSuffix(candidates[0], "core_temp") : undefined;
};

const buildMeaterEntities = (config, hass) => {
  const prefix = inferMeaterPrefix(hass, config);
  const entities = {};
  for (const key of ENTITY_KEYS) {
    entities[key] =
      configuredEntity(config, key) ||
      deviceEntity(hass, config.device_id, key) ||
      defaultEntityForPrefix(hass, prefix, key);
  }
  return entities;
};

const entityIds = (entities, keys = ENTITY_KEYS) =>
  keys.map((key) => entities[key]).filter((entityId) => Boolean(entityId));

const linePath = (points) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

const buildSeriesPath = (points, minTime, maxTime, minValue, maxValue, width, height) => {
  const timeSpan = Math.max(1, maxTime - minTime);
  const valueSpan = Math.max(1, maxValue - minValue);
  return linePath(
    points.map((point) => ({
      x: ((point.time - minTime) / timeSpan) * width,
      y: height - ((point.value - minValue) / valueSpan) * height,
    })),
  );
};

class MeaterBaseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._entities = {};
    this._handleClick = this._handleClick.bind(this);
  }

  setConfig(config) {
    this._config = { ...(config ?? {}) };
    this._entities = this._buildEntities();
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._entities = this._buildEntities();
    this._render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("click", this._handleClick);
    this._render();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this._handleClick);
  }

  _buildEntities() {
    return buildMeaterEntities(this._config, this._hass);
  }

  _isNarrowLayout() {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(max-width: 520px)").matches;
  }

  _cardSize(desktopSize, mobileSize = desktopSize) {
    return this._isNarrowLayout() ? mobileSize : desktopSize;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _showMoreInfo(entityId) {
    if (!entityId) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _handleClick(event) {
    const button = event.target.closest("button[data-entity]");
    if (button) {
      this._showMoreInfo(button.dataset.entity);
    }
  }

  _renderEntitySetupHelp(title, detail) {
    const candidates = findMeaterCoreCandidates(this._hass);
    const candidateText = candidates.length
      ? ` Candidates: ${candidates.join(", ")}.`
      : "";
    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="meater-shell error-state">
          <header class="meater-header">
            <span class="hero-icon"><ha-icon icon="mdi:food-steak"></ha-icon></span>
            <span>
              <span class="eyebrow">Configuration</span>
              <span class="title">${html(title)}</span>
            </span>
          </header>
          <p class="error-copy">${html(detail + candidateText)}</p>
        </div>
      </ha-card>
    `;
  }

  _styles() {
    return `
      <style>
        :host {
          display: block;
          --meater-hot: #ff6b2c;
          --meater-ember: #ffb300;
          --meater-steak: #d84315;
          --meater-green: #43a047;
          --meater-cool: #00a6a6;
          --meater-muted: var(--secondary-text-color, #727272);
          --meater-tile-bg: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
          --meater-soft-hot: color-mix(in srgb, var(--meater-hot) 17%, transparent);
          --meater-soft-steak: color-mix(in srgb, var(--meater-steak) 17%, transparent);
          --meater-soft-green: color-mix(in srgb, var(--meater-green) 16%, transparent);
          --meater-soft-cool: color-mix(in srgb, var(--meater-cool) 15%, transparent);
        }

        ha-card {
          overflow: hidden;
          border-radius: var(--ha-card-border-radius, 24px);
          background: var(--ha-card-background, var(--card-background-color, #fff));
          border: 1px solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
          color: var(--primary-text-color, #1f1f1f);
        }

        button {
          appearance: none;
          border: 0;
          cursor: pointer;
          color: inherit;
          font: inherit;
          letter-spacing: 0;
        }

        button:focus-visible {
          outline: 2px solid var(--meater-hot);
          outline-offset: 2px;
        }

        .meater-shell {
          display: grid;
          gap: 16px;
          padding: 18px;
        }

        .meater-header {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .header-title {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-icon,
        .tile-icon {
          display: inline-grid;
          place-items: center;
          border-radius: 18px;
        }

        .hero-icon {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          color: var(--meater-hot);
          background: var(--meater-soft-hot);
        }

        .eyebrow {
          display: block;
          color: var(--meater-muted);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.15;
        }

        .title {
          display: block;
          overflow: hidden;
          font-size: 18px;
          font-weight: 800;
          line-height: 1.18;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-pill,
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          box-sizing: border-box;
          color: var(--meater-muted);
          background: var(--meater-tile-bg);
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        button.status-pill {
          border: 0;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--meater-green);
        }

        .offline .status-dot {
          background: var(--error-color, #d93025);
        }

        .summary {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .temperature-focus {
          display: grid;
          gap: 3px;
          padding: 0;
          background: none;
          text-align: left;
        }

        .header-title.temperature-focus {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .current-temp {
          font-size: 54px;
          font-weight: 900;
          line-height: 0.92;
        }

        .current-label {
          color: var(--meater-muted);
          font-size: 13px;
          font-weight: 700;
        }

        .summary-side {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }

        .chip.hot {
          color: var(--meater-hot);
          background: var(--meater-soft-hot);
        }

        .chip.green {
          color: var(--meater-green);
          background: var(--meater-soft-green);
        }

        .chip.time {
          color: var(--meater-hot);
          background: var(--meater-soft-hot);
        }

        .chip ha-icon,
        .status-pill ha-icon {
          --mdc-icon-size: 18px;
        }

        .progress-panel {
          display: grid;
          gap: 8px;
          padding: 14px;
          border-radius: 20px;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--meater-hot) 10%, transparent), transparent),
            var(--meater-tile-bg);
        }

        .progress-copy {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: var(--meater-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .progress-bar,
        .tile-meter {
          overflow: hidden;
          border-radius: 999px;
          background: color-mix(in srgb, var(--primary-text-color) 9%, transparent);
        }

        .progress-bar {
          height: 11px;
        }

        .progress-bar span,
        .tile-meter span,
        .chart-path-core {
          background: linear-gradient(90deg, var(--meater-steak), var(--meater-hot), var(--meater-ember));
        }

        .progress-bar span,
        .tile-meter span {
          display: block;
          height: 100%;
          border-radius: inherit;
        }

        .time-grid,
        .tile-grid,
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .time-card,
        .tile,
        .stat {
          min-width: 0;
          border-radius: 20px;
          background: var(--meater-tile-bg);
          box-sizing: border-box;
        }

        .time-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
        }

        .time-icon {
          width: 38px;
          height: 38px;
          display: inline-grid;
          place-items: center;
          flex: 0 0 38px;
          border-radius: 16px;
          color: var(--meater-hot);
          background: var(--meater-soft-hot);
        }

        .time-label,
        .tile-label,
        .stat-label {
          color: var(--meater-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .time-value,
        .tile-value,
        .stat-value {
          overflow: hidden;
          font-size: 21px;
          font-weight: 900;
          line-height: 1.12;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tile {
          position: relative;
          appearance: none;
          min-height: 86px;
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 0;
          text-align: left;
          overflow: hidden;
        }

        .tile-icon {
          width: 42px;
          height: 42px;
          color: var(--meater-hot);
          background: var(--meater-soft-hot);
        }

        .tile.core .tile-icon {
          color: var(--meater-steak);
          background: var(--meater-soft-steak);
        }

        .tile.target .tile-icon {
          color: var(--meater-green);
          background: var(--meater-soft-green);
        }

        .tile.ambient .tile-icon,
        .tile.peak .tile-icon {
          color: var(--meater-ember);
          background: color-mix(in srgb, var(--meater-ember) 18%, transparent);
        }

        .tile-meter {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 9px;
          height: 5px;
        }

        .status-line {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--meater-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .status-line ha-icon {
          --mdc-icon-size: 17px;
        }

        .compact-shell {
          gap: 14px;
        }

        .compact-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(118px, 0.75fr);
          gap: 12px;
          align-items: stretch;
        }

        .compact-temp,
        .countdown-panel,
        .strip-metric {
          min-width: 0;
          border-radius: 22px;
          background: var(--meater-tile-bg);
          box-sizing: border-box;
        }

        .compact-temp {
          display: grid;
          gap: 2px;
          padding: 16px;
          text-align: left;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--meater-hot) 11%, transparent), transparent),
            var(--meater-tile-bg);
        }

        .compact-temp-value {
          font-size: 46px;
          font-weight: 900;
          line-height: 0.95;
        }

        .compact-countdown {
          min-width: 0;
          display: grid;
          align-content: center;
          gap: 2px;
          padding: 15px;
          border-radius: 22px;
          color: var(--meater-hot);
          background: var(--meater-soft-hot);
        }

        .compact-countdown-value {
          overflow: hidden;
          color: var(--primary-text-color, #1f1f1f);
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .compact-meta,
        .strip-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .countdown-layout {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 14px;
          align-items: stretch;
        }

        .countdown-orb {
          min-height: 150px;
          display: grid;
          place-items: center;
          border-radius: 28px;
          background:
            radial-gradient(circle at center, var(--ha-card-background, var(--card-background-color, #fff)) 0 55%, transparent 56%),
            conic-gradient(var(--meater-hot) var(--progress, 0%), color-mix(in srgb, var(--primary-text-color) 10%, transparent) 0);
        }

        .countdown-orb-inner {
          display: grid;
          gap: 3px;
          text-align: center;
        }

        .countdown-value {
          max-width: 118px;
          overflow: hidden;
          color: var(--primary-text-color, #1f1f1f);
          font-size: 31px;
          font-weight: 900;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .countdown-panel {
          display: grid;
          gap: 12px;
          padding: 15px;
        }

        .countdown-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .countdown-stat {
          min-width: 0;
          display: grid;
          gap: 3px;
          padding: 11px;
          border-radius: 18px;
          background: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
        }

        .countdown-stat strong,
        .strip-metric strong {
          overflow: hidden;
          font-size: 20px;
          font-weight: 900;
          line-height: 1.1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .strip-shell {
          gap: 12px;
          padding: 16px;
        }

        .strip-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .strip-title {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .strip-icon {
          width: 44px;
          height: 44px;
          display: inline-grid;
          place-items: center;
          flex: 0 0 44px;
          border-radius: 17px;
          color: var(--meater-hot);
          background: var(--meater-soft-hot);
        }

        .strip-temp {
          font-size: 40px;
          font-weight: 900;
          line-height: 0.95;
          white-space: nowrap;
        }

        .strip-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .strip-metric {
          display: grid;
          gap: 3px;
          padding: 11px;
        }

        .app-shell {
          gap: 18px;
        }

        .app-bubbles {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .app-bubble {
          min-width: 0;
          display: grid;
          justify-items: center;
          gap: 8px;
          padding: 0;
          background: none;
          text-align: center;
        }

        .app-bubble-value {
          width: 76px;
          height: 76px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: white;
          font-size: 25px;
          font-weight: 800;
          line-height: 1;
          box-shadow: 0 14px 26px color-mix(in srgb, var(--primary-text-color) 13%, transparent);
        }

        .app-bubble-value.core {
          background: linear-gradient(135deg, #b735d6, var(--meater-steak));
        }

        .app-bubble-value.target {
          background: linear-gradient(135deg, #39b6ff, var(--meater-cool));
        }

        .app-bubble-value.ambient {
          background: linear-gradient(135deg, #66d24f, var(--meater-green));
        }

        .app-cook-title {
          margin-top: -3px;
          color: var(--meater-hot);
          font-size: 17px;
          font-weight: 850;
          text-align: center;
        }

        .app-arc-wrap {
          position: relative;
          min-height: 225px;
          display: grid;
          place-items: center;
          border-radius: 28px;
          background:
            radial-gradient(circle at center, color-mix(in srgb, var(--meater-hot) 7%, transparent), transparent 58%),
            var(--meater-tile-bg);
        }

        .app-arc {
          width: min(100%, 360px);
          height: auto;
          overflow: visible;
        }

        .app-arc-track {
          fill: none;
          stroke: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
          stroke-width: 30;
          stroke-linecap: round;
        }

        .app-arc-fill {
          fill: none;
          stroke: url(#meater-app-arc-gradient);
          stroke-width: 30;
          stroke-linecap: round;
          transition: stroke-dashoffset 250ms ease;
        }

        .app-pointer {
          filter: drop-shadow(0 4px 7px color-mix(in srgb, var(--primary-text-color) 18%, transparent));
        }

        .app-pointer.core {
          fill: #b735d6;
        }

        .app-pointer.target {
          fill: #39b6ff;
        }

        .app-pointer.ambient {
          fill: var(--meater-green);
        }

        .app-center {
          position: absolute;
          inset: 62px 0 0;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .app-center-button {
          pointer-events: auto;
          display: grid;
          justify-items: center;
          gap: 3px;
          padding: 10px 16px;
          border-radius: 24px;
          background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color, #fff)) 84%, transparent);
          text-align: center;
          box-shadow: 0 10px 24px color-mix(in srgb, var(--primary-text-color) 9%, transparent);
        }

        .app-remaining-value {
          max-width: 170px;
          overflow: hidden;
          color: var(--primary-text-color, #1f1f1f);
          font-size: 46px;
          font-weight: 300;
          line-height: 0.95;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .app-food {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--meater-muted);
          font-size: 15px;
          font-weight: 750;
          text-align: center;
        }

        .app-food ha-icon {
          color: var(--meater-hot);
          --mdc-icon-size: 20px;
        }

        .chart-wrap {
          min-height: 246px;
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 22px;
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--meater-hot) 8%, transparent), transparent),
            var(--meater-tile-bg);
        }

        .chart {
          width: 100%;
          height: 178px;
        }

        .grid-line {
          stroke: color-mix(in srgb, var(--primary-text-color) 12%, transparent);
          stroke-width: 1;
        }

        .chart-path {
          fill: none;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .chart-core {
          stroke: var(--meater-hot);
        }

        .chart-ambient {
          stroke: var(--meater-ember);
        }

        .chart-target {
          stroke: var(--meater-green);
          stroke-dasharray: 7 7;
        }

        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          color: var(--meater-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          display: inline-block;
          border-radius: 999px;
          margin-right: 5px;
        }

        .stat {
          min-height: 76px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          display: inline-grid;
          place-items: center;
          flex: 0 0 38px;
          border-radius: 16px;
          color: var(--meater-hot);
          background: var(--meater-soft-hot);
        }

        .error-copy {
          margin: 0;
          color: var(--meater-muted);
          font-size: 14px;
          line-height: 1.45;
        }

        @media (max-width: 520px) {
          .meater-shell {
            padding: 16px;
          }

          .meater-header,
          .summary {
            align-items: flex-start;
          }

          .status-pill {
            max-width: 42%;
            white-space: normal;
          }

          .current-temp {
            font-size: 44px;
          }

          .time-grid,
          .tile-grid,
          .stats-grid,
          .compact-hero,
          .countdown-layout,
          .strip-main,
          .strip-metrics {
            grid-template-columns: 1fr;
          }

          .countdown-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      </style>
    `;
  }
}

class MeaterProbeCard extends MeaterBaseCard {
  static getStubConfig(hass) {
    const candidates = findMeaterCoreCandidates(hass);
    return candidates.length === 1 ? { core_temp: candidates[0] } : {};
  }

  static getConfigElement() {
    return document.createElement(MEATER_PROBE_CARD_EDITOR_TAG);
  }

  getCardSize() {
    return this._cardSize(9, 13);
  }

  getGridOptions() {
    return {
      rows: "auto",
      columns: 12,
      min_rows: 7,
      min_columns: 6,
    };
  }

  _render() {
    if (!this.shadowRoot || !this._hass) {
      return;
    }
    this._entities = this._buildEntities();
    const coreState = this._state(this._entities.core_temp);
    if (!coreState) {
      this._renderEntitySetupHelp(
        "Meater probe card",
        "No Meater core temperature sensor could be selected automatically. Select the core temperature entity or set an entity prefix in the card editor.",
      );
      return;
    }

    const ambientState = this._state(this._entities.ambient_temp);
    const targetState = this._state(this._entities.target_temp);
    const peakState = this._state(this._entities.peak_temp);
    const statusState = this._state(this._entities.cook_status);
    const cookNameState = this._state(this._entities.cook_name);
    const remainingState = this._state(this._entities.remaining_time);
    const elapsedState = this._state(this._entities.elapsed_time);

    const core = numericState(coreState);
    const target = numericState(targetState);
    const progress = target ? percent(core, target) : 0;
    const connected = isAvailable(coreState);
    const status = normalizeLabel(statusState?.state, connected ? "Ready" : "Probe offline");
    const cookName = normalizeLabel(cookNameState?.state, "Cook");
    const title =
      this._config.name ||
      registryEntry(this._hass, this._entities.core_temp)?.name ||
      coreState.attributes?.friendly_name ||
      "Meater probe";
    const subtitle = connected ? cookName : "Connect the probe";

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="meater-shell ${connected ? "online" : "offline"}">
          <header class="meater-header">
            <button class="header-title temperature-focus" data-entity="${html(this._entities.core_temp)}">
              <span class="hero-icon"><ha-icon icon="mdi:food-steak"></ha-icon></span>
              <span>
                <span class="eyebrow">${html(subtitle)}</span>
                <span class="title">${html(title)}</span>
              </span>
            </button>
            <span class="status-pill">
              <span class="status-dot"></span>
              ${html(status)}
            </span>
          </header>

          <section class="summary">
            <button class="temperature-focus" data-entity="${html(this._entities.core_temp)}">
              <span class="current-temp">${html(formatTemperature(coreState, "--"))}</span>
              <span class="current-label">core temperature</span>
            </button>
            <div class="summary-side">
              <span class="chip time">
                <ha-icon icon="mdi:timer-sand"></ha-icon>
                ${html(formatRemaining(remainingState))}
              </span>
              <span class="chip hot">
                <ha-icon icon="mdi:grill"></ha-icon>
                ${html(formatTemperature(ambientState, "--"))}
              </span>
              <span class="chip green">
                <ha-icon icon="mdi:bullseye-arrow"></ha-icon>
                ${html(formatTemperature(targetState, "--"))}
              </span>
            </div>
          </section>

          <section class="progress-panel">
            <div class="progress-copy">
              <span>${html(target ? "Progress to target" : "Target not set")}</span>
              <span>${Math.round(progress)}%</span>
            </div>
            <div class="progress-bar" aria-hidden="true">
              <span style="width: ${progress}%"></span>
            </div>
          </section>

          <section class="time-grid">
            <div class="time-card">
              <span class="time-icon"><ha-icon icon="mdi:timer-sand"></ha-icon></span>
              <span>
                <span class="time-label">Remaining</span>
                <span class="time-value">${html(formatRemaining(remainingState))}</span>
              </span>
            </div>
            <div class="time-card">
              <span class="time-icon"><ha-icon icon="mdi:clock-start"></ha-icon></span>
              <span>
                <span class="time-label">Elapsed</span>
                <span class="time-value">${html(formatElapsed(elapsedState))}</span>
              </span>
            </div>
          </section>

          <section class="tile-grid">
            ${this._temperatureTile("Core", this._entities.core_temp, "mdi:food-steak", target || 100, "core")}
            ${this._temperatureTile("Ambient", this._entities.ambient_temp, "mdi:fire", 300, "ambient")}
            ${this._temperatureTile("Target", this._entities.target_temp, "mdi:target", 100, "target")}
            ${this._temperatureTile("Peak", this._entities.peak_temp, "mdi:chart-line", 120, "peak")}
          </section>

          <div class="status-line">
            <ha-icon icon="mdi:chef-hat"></ha-icon>
            <span>${html(connected ? `${cookName} · ${status}` : "Meater probe is not reporting live data")}</span>
          </div>
        </div>
      </ha-card>
    `;
  }

  _temperatureTile(label, entityId, icon, max, tone) {
    const stateObj = this._state(entityId);
    const value = numericState(stateObj);
    const width = percent(value, max);
    return `
      <button class="tile ${html(tone)}" data-entity="${html(entityId)}">
        <span class="tile-icon"><ha-icon icon="${html(icon)}"></ha-icon></span>
        <span>
          <span class="tile-label">${html(label)}</span>
          <span class="tile-value">${html(formatTemperature(stateObj, "--"))}</span>
        </span>
        <span class="tile-meter" aria-hidden="true"><span style="width: ${width}%"></span></span>
      </button>
    `;
  }
}

class MeaterCompactCard extends MeaterBaseCard {
  static getStubConfig(hass) {
    const candidates = findMeaterCoreCandidates(hass);
    return candidates.length === 1 ? { core_temp: candidates[0] } : {};
  }

  static getConfigElement() {
    return document.createElement(MEATER_PROBE_CARD_EDITOR_TAG);
  }

  getCardSize() {
    return this._cardSize(6, 7);
  }

  getGridOptions() {
    return {
      rows: "auto",
      columns: 12,
      min_rows: 6,
      min_columns: 4,
    };
  }

  _render() {
    if (!this.shadowRoot || !this._hass) {
      return;
    }
    this._entities = this._buildEntities();
    const coreState = this._state(this._entities.core_temp);
    if (!coreState) {
      this._renderEntitySetupHelp(
        "Meater compact card",
        "No Meater core temperature sensor could be selected automatically. Select the core temperature entity or set an entity prefix in the card editor.",
      );
      return;
    }

    const ambientState = this._state(this._entities.ambient_temp);
    const targetState = this._state(this._entities.target_temp);
    const statusState = this._state(this._entities.cook_status);
    const cookNameState = this._state(this._entities.cook_name);
    const remainingState = this._state(this._entities.remaining_time);
    const core = numericState(coreState);
    const target = numericState(targetState);
    const progress = target ? percent(core, target) : 0;
    const connected = isAvailable(coreState);
    const status = normalizeLabel(statusState?.state, connected ? "Ready" : "Probe offline");
    const cookName = normalizeLabel(cookNameState?.state, "Cook");
    const title =
      this._config.name ||
      registryEntry(this._hass, this._entities.core_temp)?.name ||
      coreState.attributes?.friendly_name ||
      "Meater probe";

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="meater-shell compact-shell ${connected ? "online" : "offline"}">
          <header class="meater-header">
            <span class="header-title">
              <span class="hero-icon"><ha-icon icon="mdi:food-steak"></ha-icon></span>
              <span>
                <span class="eyebrow">${html(cookName)}</span>
                <span class="title">${html(title)}</span>
              </span>
            </span>
            <span class="status-pill"><span class="status-dot"></span>${html(status)}</span>
          </header>

          <section class="compact-hero">
            <button class="compact-temp" data-entity="${html(this._entities.core_temp)}">
              <span class="time-label">Core</span>
              <span class="compact-temp-value">${html(formatTemperature(coreState, "--"))}</span>
            </button>
            <button class="compact-countdown" data-entity="${html(this._entities.remaining_time)}">
              <span class="time-label">Remaining</span>
              <span class="compact-countdown-value">${html(formatRemaining(remainingState))}</span>
              <span class="time-label">${html(formatFinishLabel(remainingState))}</span>
            </button>
          </section>

          <section class="progress-panel">
            <div class="progress-copy">
              <span>${html(target ? "Target progress" : "Target not set")}</span>
              <span>${Math.round(progress)}%</span>
            </div>
            <div class="progress-bar" aria-hidden="true"><span style="width: ${progress}%"></span></div>
          </section>

          <div class="compact-meta">
            <span class="chip hot"><ha-icon icon="mdi:grill"></ha-icon>${html(formatTemperature(ambientState, "--"))}</span>
            <span class="chip green"><ha-icon icon="mdi:target"></ha-icon>${html(formatTemperature(targetState, "--"))}</span>
          </div>
        </div>
      </ha-card>
    `;
  }
}

class MeaterCountdownCard extends MeaterBaseCard {
  static getStubConfig(hass) {
    const candidates = findMeaterCoreCandidates(hass);
    return candidates.length === 1 ? { core_temp: candidates[0] } : {};
  }

  static getConfigElement() {
    return document.createElement(MEATER_PROBE_CARD_EDITOR_TAG);
  }

  getCardSize() {
    return this._cardSize(4, 7);
  }

  getGridOptions() {
    return {
      rows: "auto",
      columns: 12,
      min_rows: 4,
      min_columns: 4,
    };
  }

  _render() {
    if (!this.shadowRoot || !this._hass) {
      return;
    }
    this._entities = this._buildEntities();
    const coreState = this._state(this._entities.core_temp);
    if (!coreState) {
      this._renderEntitySetupHelp(
        "Meater countdown card",
        "No Meater core temperature sensor could be selected automatically. Select the core temperature entity or set an entity prefix in the card editor.",
      );
      return;
    }

    const ambientState = this._state(this._entities.ambient_temp);
    const targetState = this._state(this._entities.target_temp);
    const statusState = this._state(this._entities.cook_status);
    const remainingState = this._state(this._entities.remaining_time);
    const elapsedState = this._state(this._entities.elapsed_time);
    const core = numericState(coreState);
    const target = numericState(targetState);
    const progress = target ? percent(core, target) : 0;
    const connected = isAvailable(coreState);
    const status = normalizeLabel(statusState?.state, connected ? "Cooking" : "Probe offline");
    const title = this._config.name || "Meater countdown";

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="meater-shell ${connected ? "online" : "offline"}">
          <header class="meater-header">
            <span class="header-title">
              <span class="hero-icon"><ha-icon icon="mdi:timer-sand"></ha-icon></span>
              <span>
                <span class="eyebrow">${html(status)}</span>
                <span class="title">${html(title)}</span>
              </span>
            </span>
            <span class="status-pill"><span class="status-dot"></span>${html(Math.round(progress))}%</span>
          </header>

          <section class="countdown-layout">
            <button class="countdown-orb" style="--progress: ${progress}%" data-entity="${html(this._entities.remaining_time)}">
              <span class="countdown-orb-inner">
                <span class="time-label">Remaining</span>
                <span class="countdown-value">${html(formatRemaining(remainingState))}</span>
                <span class="time-label">${html(formatFinishLabel(remainingState, "ETA"))}</span>
              </span>
            </button>
            <div class="countdown-panel">
              <div class="countdown-stats">
                <button class="countdown-stat" data-entity="${html(this._entities.core_temp)}">
                  <span class="time-label">Core</span>
                  <strong>${html(formatTemperature(coreState, "--"))}</strong>
                </button>
                <button class="countdown-stat" data-entity="${html(this._entities.target_temp)}">
                  <span class="time-label">Target</span>
                  <strong>${html(formatTemperature(targetState, "--"))}</strong>
                </button>
                <button class="countdown-stat" data-entity="${html(this._entities.ambient_temp)}">
                  <span class="time-label">BBQ</span>
                  <strong>${html(formatTemperature(ambientState, "--"))}</strong>
                </button>
              </div>
              <section class="progress-panel">
                <div class="progress-copy">
                  <span>Cook progress</span>
                  <span>${Math.round(progress)}%</span>
                </div>
                <div class="progress-bar" aria-hidden="true"><span style="width: ${progress}%"></span></div>
              </section>
              <div class="status-line">
                <ha-icon icon="mdi:clock-start"></ha-icon>
                <span>Elapsed ${html(formatElapsed(elapsedState))}</span>
              </div>
            </div>
          </section>
        </div>
      </ha-card>
    `;
  }
}

class MeaterStripCard extends MeaterBaseCard {
  static getStubConfig(hass) {
    const candidates = findMeaterCoreCandidates(hass);
    return candidates.length === 1 ? { core_temp: candidates[0] } : {};
  }

  static getConfigElement() {
    return document.createElement(MEATER_PROBE_CARD_EDITOR_TAG);
  }

  getCardSize() {
    return this._cardSize(4, 6);
  }

  getGridOptions() {
    return {
      rows: "auto",
      columns: 12,
      min_rows: 4,
      min_columns: 6,
    };
  }

  _render() {
    if (!this.shadowRoot || !this._hass) {
      return;
    }
    this._entities = this._buildEntities();
    const coreState = this._state(this._entities.core_temp);
    if (!coreState) {
      this._renderEntitySetupHelp(
        "Meater strip card",
        "No Meater core temperature sensor could be selected automatically. Select the core temperature entity or set an entity prefix in the card editor.",
      );
      return;
    }

    const ambientState = this._state(this._entities.ambient_temp);
    const targetState = this._state(this._entities.target_temp);
    const statusState = this._state(this._entities.cook_status);
    const remainingState = this._state(this._entities.remaining_time);
    const core = numericState(coreState);
    const target = numericState(targetState);
    const progress = target ? percent(core, target) : 0;
    const connected = isAvailable(coreState);
    const status = normalizeLabel(statusState?.state, connected ? "Ready" : "Probe offline");
    const title =
      this._config.name ||
      registryEntry(this._hass, this._entities.core_temp)?.name ||
      coreState.attributes?.friendly_name ||
      "Meater probe";

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="meater-shell strip-shell ${connected ? "online" : "offline"}">
          <section class="strip-main">
            <span class="strip-title">
              <span class="strip-icon"><ha-icon icon="mdi:food-steak"></ha-icon></span>
              <span>
                <span class="eyebrow">${html(status)}</span>
                <span class="title">${html(title)}</span>
              </span>
            </span>
            <button class="temperature-focus" data-entity="${html(this._entities.core_temp)}">
              <span class="strip-temp">${html(formatTemperature(coreState, "--"))}</span>
            </button>
          </section>

          <section class="strip-metrics">
            <button class="strip-metric" data-entity="${html(this._entities.remaining_time)}">
              <span class="time-label">Remaining</span>
              <strong>${html(formatRemaining(remainingState))}</strong>
            </button>
            <button class="strip-metric" data-entity="${html(this._entities.ambient_temp)}">
              <span class="time-label">BBQ</span>
              <strong>${html(formatTemperature(ambientState, "--"))}</strong>
            </button>
            <button class="strip-metric" data-entity="${html(this._entities.target_temp)}">
              <span class="time-label">Target</span>
              <strong>${html(formatTemperature(targetState, "--"))}</strong>
            </button>
          </section>
          <div class="progress-bar" aria-hidden="true"><span style="width: ${progress}%"></span></div>
        </div>
      </ha-card>
    `;
  }
}

class MeaterAppCard extends MeaterBaseCard {
  static getStubConfig(hass) {
    const candidates = findMeaterCoreCandidates(hass);
    return candidates.length === 1 ? { core_temp: candidates[0] } : {};
  }

  static getConfigElement() {
    return document.createElement(MEATER_PROBE_CARD_EDITOR_TAG);
  }

  getCardSize() {
    return this._cardSize(9, 10);
  }

  getGridOptions() {
    return {
      rows: "auto",
      columns: 12,
      min_rows: 9,
      min_columns: 4,
    };
  }

  _render() {
    if (!this.shadowRoot || !this._hass) {
      return;
    }
    this._entities = this._buildEntities();
    const coreState = this._state(this._entities.core_temp);
    if (!coreState) {
      this._renderEntitySetupHelp(
        "Meater app card",
        "No Meater core temperature sensor could be selected automatically. Select the core temperature entity or set an entity prefix in the card editor.",
      );
      return;
    }

    const ambientState = this._state(this._entities.ambient_temp);
    const targetState = this._state(this._entities.target_temp);
    const statusState = this._state(this._entities.cook_status);
    const cookNameState = this._state(this._entities.cook_name);
    const remainingState = this._state(this._entities.remaining_time);
    const core = numericState(coreState);
    const target = numericState(targetState);
    const progress = target ? percent(core, target) : 0;
    const arcLength = 440;
    const arcOffset = arcLength - (arcLength * progress) / 100;
    const connected = isAvailable(coreState);
    const status = normalizeLabel(statusState?.state, connected ? "Cooking" : "Probe offline");
    const cookName = normalizeLabel(cookNameState?.state, "Cook");
    const title = this._config.name || "Meater";

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="meater-shell app-shell ${connected ? "online" : "offline"}">
          <header class="meater-header">
            <span class="header-title">
              <span class="hero-icon"><ha-icon icon="mdi:food-steak"></ha-icon></span>
              <span>
                <span class="eyebrow">${html(status)}</span>
                <span class="title">${html(title)}</span>
              </span>
            </span>
            <span class="status-pill"><span class="status-dot"></span>${html(formatFinishLabel(remainingState, "ETA"))}</span>
          </header>

          <section class="app-bubbles">
            ${this._bubble("Internal", this._entities.core_temp, coreState, "core")}
            ${this._bubble("Target", this._entities.target_temp, targetState, "target")}
            ${this._bubble("Ambient", this._entities.ambient_temp, ambientState, "ambient")}
          </section>

          <div class="app-cook-title">${html(cookName)}</div>

          <section class="app-arc-wrap">
            <svg class="app-arc" viewBox="0 0 360 230" role="img" aria-label="Meater cook progress">
              <defs>
                <linearGradient id="meater-app-arc-gradient" x1="20" y1="190" x2="340" y2="190" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#405fb8"></stop>
                  <stop offset="0.38" stop-color="#b735d6"></stop>
                  <stop offset="0.68" stop-color="#ff6b2c"></stop>
                  <stop offset="1" stop-color="#8e2c22"></stop>
                </linearGradient>
              </defs>
              <path class="app-arc-track" d="M 42 190 A 138 138 0 0 1 318 190"></path>
              <path
                class="app-arc-fill"
                d="M 42 190 A 138 138 0 0 1 318 190"
                style="stroke-dasharray: ${arcLength}; stroke-dashoffset: ${arcOffset};"
              ></path>
              <polygon class="app-pointer core" points="38,181 66,170 62,199"></polygon>
              <polygon class="app-pointer target" points="180,38 193,68 167,68"></polygon>
              <polygon class="app-pointer ambient" points="322,181 294,170 298,199"></polygon>
            </svg>
            <div class="app-center">
              <button class="app-center-button" data-entity="${html(this._entities.remaining_time)}">
                <span class="app-remaining-value">${html(formatRemaining(remainingState))}</span>
                <span class="current-label">remaining</span>
              </button>
            </div>
          </section>

          <div class="app-food">
            <ha-icon icon="mdi:chef-hat"></ha-icon>
            <span>${html(cookName)} · ${html(status)} · ${Math.round(progress)}%</span>
          </div>
        </div>
      </ha-card>
    `;
  }

  _bubble(label, entityId, stateObj, tone) {
    return `
      <button class="app-bubble" data-entity="${html(entityId)}">
        <span class="app-bubble-value ${html(tone)}">${html(formatTemperature(stateObj, "--"))}</span>
        <span class="time-label">${html(label)}</span>
      </button>
    `;
  }
}

class MeaterProbeHistoryCard extends MeaterBaseCard {
  static getStubConfig(hass) {
    const candidates = findMeaterCoreCandidates(hass);
    return candidates.length === 1 ? { core_temp: candidates[0] } : {};
  }

  static getConfigElement() {
    return document.createElement(MEATER_HISTORY_CARD_EDITOR_TAG);
  }

  constructor() {
    super();
    this._history = null;
    this._loading = false;
    this._lastFetchAt = 0;
    this._refreshTimer = undefined;
  }

  setConfig(config) {
    this._config = {
      hours_to_show: 3,
      refresh_interval: 300,
      ...(config ?? {}),
    };
    this._entities = this._buildEntities();
    this._render();
    this._maybeLoadHistory();
  }

  set hass(hass) {
    this._hass = hass;
    this._entities = this._buildEntities();
    this._render();
    this._maybeLoadHistory();
  }

  connectedCallback() {
    super.connectedCallback();
    this._maybeLoadHistory();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this._refreshTimer);
  }

  getCardSize() {
    return this._cardSize(7, 11);
  }

  getGridOptions() {
    return {
      rows: "auto",
      columns: 12,
      min_rows: 6,
      min_columns: 6,
    };
  }

  _hoursToShow() {
    return Math.max(1, Number(this._config.hours_to_show) || 3);
  }

  _refreshMs() {
    return Math.max(60, Number(this._config.refresh_interval) || 300) * 1000;
  }

  _maybeLoadHistory() {
    if (!this._hass || this._loading || !this.isConnected) {
      return;
    }
    const now = Date.now();
    if (this._lastFetchAt && now - this._lastFetchAt < this._refreshMs()) {
      return;
    }
    this._loadHistory();
  }

  async _loadHistory() {
    const ids = entityIds(this._entities, ["core_temp", "ambient_temp", "target_temp"]);
    if (!ids.length || !this._hass?.callWS) {
      return;
    }
    this._loading = true;
    this._render();
    const end = new Date();
    const start = new Date(end.getTime() - this._hoursToShow() * 60 * 60 * 1000);
    try {
      this._history = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        entity_ids: ids,
        minimal_response: false,
        no_attributes: true,
        significant_changes_only: false,
      });
      this._lastFetchAt = Date.now();
    } catch (error) {
      this._history = { error: String(error?.message || error) };
    } finally {
      this._loading = false;
      this._render();
      window.clearTimeout(this._refreshTimer);
      this._refreshTimer = window.setTimeout(() => this._loadHistory(), this._refreshMs());
    }
  }

  _render() {
    if (!this.shadowRoot || !this._hass) {
      return;
    }
    this._entities = this._buildEntities();
    const coreState = this._state(this._entities.core_temp);
    if (!coreState) {
      this._renderEntitySetupHelp(
        "Meater history card",
        "No Meater core temperature sensor could be selected automatically. Select the core temperature entity or set an entity prefix in the card editor.",
      );
      return;
    }

    const summary = this._historySummary();
    const title = this._config.name || "Meater temperature history";
    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="meater-shell">
          <header class="meater-header">
            <span class="header-title">
              <span class="hero-icon"><ha-icon icon="mdi:chart-line"></ha-icon></span>
              <span>
                <span class="eyebrow">BBQ history</span>
                <span class="title">${html(title)}</span>
              </span>
            </span>
            <button class="status-pill" data-action="refresh">
              <ha-icon icon="mdi:refresh"></ha-icon>
              ${html(this._loading ? "Loading" : `${this._hoursToShow()}h`)}
            </button>
          </header>

          <section class="stats-grid">
            ${this._stat("Core now", formatTemperature(this._state(this._entities.core_temp)), "mdi:food-steak")}
            ${this._stat("Ambient now", formatTemperature(this._state(this._entities.ambient_temp)), "mdi:fire")}
            ${this._stat("Peak core", summary.peakCore, "mdi:arrow-up-bold")}
            ${this._stat("Target", formatTemperature(this._state(this._entities.target_temp)), "mdi:target")}
          </section>

          <section class="chart-wrap">
            ${this._chart(summary)}
            <div class="legend">
              <span><i class="legend-dot" style="background: var(--meater-hot)"></i>Core</span>
              <span><i class="legend-dot" style="background: var(--meater-ember)"></i>Ambient</span>
              <span><i class="legend-dot" style="background: var(--meater-green)"></i>Target</span>
            </div>
          </section>
        </div>
      </ha-card>
    `;
    const refresh = this.shadowRoot.querySelector('[data-action="refresh"]');
    if (refresh) {
      refresh.addEventListener("click", () => this._loadHistory(), { once: true });
    }
  }

  _historySummary() {
    const series = this._historySeries();
    const corePoints = series.core;
    const peakCore = corePoints.length
      ? `${Math.round(Math.max(...corePoints.map((point) => point.value)))}\u00b0C`
      : "--";
    return { series, peakCore };
  }

  _historySeries() {
    const result = { core: [], ambient: [], target: [] };
    if (!Array.isArray(this._history)) {
      return result;
    }
    const byEntity = new Map();
    for (const rows of this._history) {
      for (const row of rows ?? []) {
        if (!row?.entity_id) {
          continue;
        }
        if (!byEntity.has(row.entity_id)) {
          byEntity.set(row.entity_id, []);
        }
        byEntity.get(row.entity_id).push(row);
      }
    }
    const collect = (key, outputKey) => {
      for (const row of byEntity.get(this._entities[key]) ?? []) {
        const value = Number(row.state);
        const time = Date.parse(row.last_changed || row.last_updated);
        if (Number.isFinite(value) && Number.isFinite(time)) {
          result[outputKey].push({ time, value });
        }
      }
    };
    collect("core_temp", "core");
    collect("ambient_temp", "ambient");
    collect("target_temp", "target");
    return result;
  }

  _chart(summary) {
    const width = 560;
    const height = 176;
    const allPoints = [
      ...summary.series.core,
      ...summary.series.ambient,
      ...summary.series.target,
    ];
    if (!allPoints.length) {
      return `
        <div class="chart status-line">
          <ha-icon icon="mdi:chart-line"></ha-icon>
          <span>${html(this._loading ? "Loading history..." : "No history points yet")}</span>
        </div>
      `;
    }
    const minTime = Math.min(...allPoints.map((point) => point.time));
    const maxTime = Math.max(...allPoints.map((point) => point.time));
    const minValue = Math.min(0, ...allPoints.map((point) => point.value));
    const maxValue = Math.max(100, ...allPoints.map((point) => point.value)) + 5;
    const corePath = buildSeriesPath(summary.series.core, minTime, maxTime, minValue, maxValue, width, height);
    const ambientPath = buildSeriesPath(summary.series.ambient, minTime, maxTime, minValue, maxValue, width, height);
    const targetPath = buildSeriesPath(summary.series.target, minTime, maxTime, minValue, maxValue, width, height);

    return `
      <svg class="chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Meater temperature history">
        <line class="grid-line" x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}"></line>
        <line class="grid-line" x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}"></line>
        <line class="grid-line" x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}"></line>
        ${ambientPath ? `<path class="chart-path chart-ambient" d="${ambientPath}"></path>` : ""}
        ${targetPath ? `<path class="chart-path chart-target" d="${targetPath}"></path>` : ""}
        ${corePath ? `<path class="chart-path chart-core" d="${corePath}"></path>` : ""}
      </svg>
    `;
  }

  _stat(label, value, icon) {
    return `
      <div class="stat">
        <span class="stat-icon"><ha-icon icon="${html(icon)}"></ha-icon></span>
        <span>
          <span class="stat-label">${html(label)}</span>
          <span class="stat-value">${html(value)}</span>
        </span>
      </div>
    `;
  }
}

class MeaterCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...(config ?? {}) };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const form = this.shadowRoot.querySelector("ha-form");
    if (form) {
      form.hass = hass;
      return;
    }
    this._render();
  }

  _schema(extra = []) {
    return [
      { name: "name", selector: { text: {} } },
      { name: "device_id", selector: { device: {} } },
      { name: "entity_prefix", selector: { text: {} } },
      ...ENTITY_KEYS.map((key) => ({
        name: key,
        selector: { entity: { domain: "sensor" } },
      })),
      ...extra,
    ];
  }

  _labels(extra = {}) {
    return { ...EDITOR_LABELS, ...extra };
  }

  _renderForm(schema, labels) {
    this.shadowRoot.innerHTML = `
      <ha-form></ha-form>
    `;
    const form = this.shadowRoot.querySelector("ha-form");
    form.hass = this._hass;
    form.data = this._config;
    form.schema = schema;
    form.computeLabel = (schemaItem) => labels[schemaItem.name] || schemaItem.name;
    form.addEventListener("value-changed", (event) => {
      event.stopPropagation();
      this._config = event.detail.value;
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        }),
      );
    });
  }
}

class MeaterProbeCardEditor extends MeaterCardEditor {
  _render() {
    this._renderForm(this._schema(), this._labels());
  }
}

class MeaterHistoryCardEditor extends MeaterCardEditor {
  _render() {
    this._renderForm(
      this._schema([
        { name: "hours_to_show", selector: { number: { min: 1, max: 24, mode: "box" } } },
        { name: "refresh_interval", selector: { number: { min: 60, max: 3600, mode: "box" } } },
      ]),
      this._labels(),
    );
  }
}

if (!customElements.get(MEATER_PROBE_CARD_TAG)) {
  customElements.define(MEATER_PROBE_CARD_TAG, MeaterProbeCard);
}
if (!customElements.get(MEATER_HISTORY_CARD_TAG)) {
  customElements.define(MEATER_HISTORY_CARD_TAG, MeaterProbeHistoryCard);
}
if (!customElements.get(MEATER_COMPACT_CARD_TAG)) {
  customElements.define(MEATER_COMPACT_CARD_TAG, MeaterCompactCard);
}
if (!customElements.get(MEATER_COUNTDOWN_CARD_TAG)) {
  customElements.define(MEATER_COUNTDOWN_CARD_TAG, MeaterCountdownCard);
}
if (!customElements.get(MEATER_STRIP_CARD_TAG)) {
  customElements.define(MEATER_STRIP_CARD_TAG, MeaterStripCard);
}
if (!customElements.get(MEATER_APP_CARD_TAG)) {
  customElements.define(MEATER_APP_CARD_TAG, MeaterAppCard);
}
if (!customElements.get(MEATER_PROBE_CARD_EDITOR_TAG)) {
  customElements.define(MEATER_PROBE_CARD_EDITOR_TAG, MeaterProbeCardEditor);
}
if (!customElements.get(MEATER_HISTORY_CARD_EDITOR_TAG)) {
  customElements.define(MEATER_HISTORY_CARD_EDITOR_TAG, MeaterHistoryCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push(
  {
    type: MEATER_PROBE_CARD_TAG,
    name: "Meater Probe Card",
    description: "Mushroom-style live BBQ card for Meater probes.",
    documentationURL: "https://github.com/gielk/meater-bbq-card",
  },
  {
    type: MEATER_HISTORY_CARD_TAG,
    name: "Meater Probe History",
    description: "BBQ-style temperature history card for Meater probes.",
    documentationURL: "https://github.com/gielk/meater-bbq-card",
  },
  {
    type: MEATER_COMPACT_CARD_TAG,
    name: "Meater Compact Card",
    description: "Compact Meater card with core temperature, remaining time, target, and BBQ temperature.",
    documentationURL: "https://github.com/gielk/meater-bbq-card",
  },
  {
    type: MEATER_COUNTDOWN_CARD_TAG,
    name: "Meater Countdown Card",
    description: "Remaining-time first Meater card for active cooks.",
    documentationURL: "https://github.com/gielk/meater-bbq-card",
  },
  {
    type: MEATER_STRIP_CARD_TAG,
    name: "Meater Strip Card",
    description: "Slim Meater dashboard strip with core, remaining time, BBQ, and target values.",
    documentationURL: "https://github.com/gielk/meater-bbq-card",
  },
  {
    type: MEATER_APP_CARD_TAG,
    name: "Meater App Card",
    description: "MEATER-app inspired Mushroom-style card with temperature bubbles and remaining-time arc.",
    documentationURL: "https://github.com/gielk/meater-bbq-card",
  },
);

console.info(
  `%c MEATER BBQ CARDS %c v${MEATER_BBQ_CARD_VERSION} `,
  "color: white; background: #ff6b2c; font-weight: 700; padding: 2px 4px; border-radius: 3px 0 0 3px;",
  "color: white; background: #1f1f1f; font-weight: 700; padding: 2px 4px; border-radius: 0 3px 3px 0;",
);
