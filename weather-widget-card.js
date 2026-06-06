// @ts-check
// =====================================================================
//  Weather Widget Card v1.0.3
// =====================================================================

const WEATHER_ICONS = {
  sunny:              '☀️',
  'clear-night':      '🌙',
  partlycloudy:       '⛅',
  'partlycloudy-night':'🌙',
  cloudy:             '☁️',
  rainy:              '🌧️',
  pouring:            '🌧️',
  snowy:              '❄️',
  'snowy-rainy':      '🌨️',
  'lightning-rainy':  '⛈️',
  lightning:          '⚡',
  fog:                '🌫️',
  hail:               '🌨️',
  windy:              '💨',
  'windy-variant':    '💨',
  exceptional:        '⚠️',
};

const WEATHER_LABELS = {
  sunny:              'Sonnig',
  'clear-night':      'Klar',
  partlycloudy:       'Leicht bewölkt',
  'partlycloudy-night':'Leicht bewölkt',
  cloudy:             'Bewölkt',
  rainy:              'Regen',
  pouring:            'Starkregen',
  snowy:              'Schnee',
  'snowy-rainy':      'Schneeregen',
  'lightning-rainy':  'Gewitter',
  lightning:          'Blitz',
  fog:                'Nebel',
  hail:               'Hagel',
  windy:              'Windig',
  'windy-variant':    'Windig',
  exceptional:        'Außergewöhnlich',
};

// =====================================================================
//  Haupt-Card
// =====================================================================
class WeatherWidgetCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._lastKey = null;
  }

  /** @param {LovelaceCardConfig} config */
  setConfig(config) {
    if (!config) throw new Error('Keine Konfiguration');
    this._config = {
      border_radius: 20,
      height: 65,
      show_humidity: true,
      show_wind: true,
      show_forecast: false,
      icon_size: 28,
      temp_size: 18,
      label_size: 10,
      info_size: 12,
      tap_action: { action: 'none' },
      ...config,
    };
    delete this._lastKey;
  }

  /** @param {HomeAssistant} hass */
  /** @param {HomeAssistant} hass */
  set hass(hass) { this._hass = hass; this._render(); }

  _entityState() {
    if (!this._hass || !this._config.entity) return null;
    return this._hass.states[this._config.entity] || null;
  }

  _performAction(action) {
    if (!action || action.action === 'none') return;
    switch (action.action) {
      case 'navigate':
        if (action.navigation_path) {
          history.pushState(null, '', action.navigation_path);
          this.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }));
        }
        break;
      case 'more-info':
        this._fireMoreInfo(action.entity || this._config.entity);
        break;
      case 'call-service':
      case 'perform-action': {
        const svc = action.service || action.perform_action;
        if (svc) {
          const [domain, service] = svc.split('.');
          this._hass.callService(domain, service, action.data || {}, action.target || {});
        }
        break;
      }
      case 'url':
        if (action.url_path) window.open(action.url_path, '_blank');
        break;
    }
  }

  _fireMoreInfo(entityId) {
    if (!entityId) return;
    const e = new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId } });
    this.dispatchEvent(e);
  }

  getCardSize() {
    if (this._config?.show_forecast) return 4;
    const h = this._config?.height;
    if (h) return Math.max(1, Math.ceil(h / 50));
    return 2;
  }

  static getConfigElement() { return document.createElement('weather-widget-card-editor'); }
  static getStubConfig() {
    return {
      entity: '',
      border_radius: 20,
      height: 65,
      show_humidity: true,
      show_wind: true,
      show_forecast: false,
      tap_action: { action: 'none' },
    };
  }

  _render() {
    if (!this._hass) return;

    const st = this._entityState();
    const weatherState = st?.state || '';
    const unavailable   = !st || weatherState === 'unavailable' || weatherState === 'unknown';

    const temp     = st?.attributes.temperature     ?? '–';
    const humidity = st?.attributes.humidity        ?? '–';
    const wind     = st?.attributes.wind_speed      ?? '–';
    const windUnit = st?.attributes.wind_speed_unit || 'km/h';

    const icon  = WEATHER_ICONS[weatherState]  || '🌤️';
    const label = WEATHER_LABELS[weatherState] || weatherState;

    const showForecast = this._config.show_forecast === true;
    const forecast = showForecast ? (st?.attributes.forecast || []).slice(0, 4) : [];

    const forecastKey = forecast.map(f => `${f.datetime}:${f.condition}:${f.temperature}`).join('|');
    const key = `${weatherState}|${temp}|${humidity}|${wind}|${forecastKey}`;
    if (key === this._lastKey) return;
    this._lastKey = key;

    const h  = this._config.height      || 65;
    const w  = this._config.width;
    const br = this._config.border_radius;
    const hasTap  = this._config.tap_action?.action  && this._config.tap_action.action  !== 'none';
    const hasHold = this._config.hold_action?.action && this._config.hold_action.action !== 'none';

    const showHumidity = this._config.show_humidity !== false;
    const showWind     = this._config.show_wind     !== false;
    const showInfo     = showHumidity || showWind;

    const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const forecastHtml = forecast.map(f => {
      const d = new Date(f.datetime);
      const dayName = DAY_NAMES[d.getDay()];
      const fIcon = WEATHER_ICONS[f.condition] || '🌤️';
      const fHi = f.temperature != null ? `${f.temperature}°` : '–';
      const fLo = f.templow     != null ? `${f.templow}°`     : '';
      return `
        <div class="fc-day">
          <span class="fc-name">${dayName}</span>
          <span class="fc-icon">${fIcon}</span>
          <span class="fc-hi">${fHi}</span>
          ${fLo ? `<span class="fc-lo">${fLo}</span>` : ''}
        </div>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          box-sizing: border-box;
          ${!showForecast && h ? `height:${h}px;` : ''}
        }
        .card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: ${br}px;
          ${!showForecast ? 'height: 100%;' : ''}
          padding: ${showForecast ? '10px 16px' : '0 16px'};
          display: grid;
          grid-template-columns: 40px 1fr ${showInfo ? '1fr' : ''};
          grid-template-rows: ${showForecast ? `${h}px auto` : '1fr'};
          align-items: center;
          gap: 0 12px;
          box-sizing: border-box;
          transition: all 0.3s ease;
          cursor: ${hasTap ? 'pointer' : 'default'};
          ${w ? `width:min(${w}px,100%); max-width:100%; margin:0 auto;` : ''}
          ${unavailable ? 'opacity:0.5;' : ''}
        }
        .card:active { transform: ${hasTap ? 'scale(0.98)' : 'none'}; }
        .col-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${this._config.icon_size}px;
          line-height: 1;
        }
        .col-temp {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1.3;
        }
        .temp-value {
          font-size: ${this._config.temp_size}px;
          font-weight: 600;
          color: rgba(255,255,255,0.95);
        }
        .temp-label {
          font-size: ${this._config.label_size}px;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
        }
        .col-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }
        .info-row {
          font-size: ${this._config.info_size}px;
          color: rgba(255,255,255,0.7);
          white-space: nowrap;
        }
        .forecast {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-around;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 8px;
          margin-top: 4px;
        }
        .fc-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          flex: 1;
        }
        .fc-name {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .fc-icon { font-size: 20px; line-height: 1; }
        .fc-hi {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
        }
        .fc-lo {
          font-size: 11px;
          color: rgba(255,255,255,0.45);
        }
        .empty { font-size:12px; color:rgba(255,255,255,0.3); grid-column:1/-1; text-align:center; }
      </style>
      <div class="card" id="card">
        ${!this._config.entity
          ? `<span class="empty">Keine Entität konfiguriert</span>`
          : `
            <div class="col-icon">${icon}</div>
            <div class="col-temp">
              <span class="temp-value">${temp}°</span>
              <span class="temp-label">${label}</span>
            </div>
            ${showInfo ? `
            <div class="col-info">
              ${showHumidity ? `<span class="info-row">💧 ${humidity}%</span>` : ''}
              ${showWind     ? `<span class="info-row">💨 ${wind} ${windUnit}</span>` : ''}
            </div>` : ''}
            ${showForecast && forecast.length > 0 ? `<div class="forecast">${forecastHtml}</div>` : ''}
          `
        }
      </div>
    `;

    const card = this.shadowRoot.getElementById('card');
    if (!card) return;

    let holdTimer = null, held = false;

    if (hasTap) {
      card.addEventListener('click', () => {
        if (held) { held = false; return; }
        this._performAction(this._config.tap_action);
      });
    }

    if (hasHold) {
      const start  = () => { held=false; holdTimer=setTimeout(()=>{ held=true; this._performAction(this._config.hold_action); }, 500); };
      const cancel = () => clearTimeout(holdTimer);
      card.addEventListener('mousedown',  start);
      card.addEventListener('touchstart', start, { passive: true });
      card.addEventListener('mouseup',    cancel);
      card.addEventListener('mouseleave', cancel);
      card.addEventListener('touchend',   cancel);
    }
  }
}

customElements.define('weather-widget-card', WeatherWidgetCard);

// =====================================================================
//  Visueller Editor
// =====================================================================
class WeatherWidgetCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._rendered = false;
  }

  /** @param {LovelaceCardConfig} config */
  setConfig(config) {
    this._config = {
      border_radius: 20, height: 65, show_humidity: true, show_wind: true, show_forecast: false,
      icon_size: 28, temp_size: 18, label_size: 10, info_size: 12,
      tap_action: { action: 'none' },
      ...config,
    };
    this._render();
  }

  /** @param {HomeAssistant} hass */
  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._render();
  }

  _emit() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config }, bubbles: true, composed: true,
    }));
  }

  _update(key, value) {
    this._config = { ...this._config, [key]: value };
    this._emit();
  }

  _setActionType(actionKey, type) {
    this._config = { ...this._config, [actionKey]: { action: type } };
    this._emit();
    this._render();
  }

  _updateAction(actionKey, subKey, value) {
    this._config = { ...this._config, [actionKey]: { ...(this._config[actionKey] || {}), [subKey]: value } };
    this._emit();
  }

  _buildEntityPicker(container, currentValue, onChange) {
    container.innerHTML = '';
    const picker = /** @type {HaEntityPicker} */ (document.createElement('ha-entity-picker'));
    picker.hass = this._hass;
    picker.value = currentValue || '';
    picker.setAttribute('allow-custom-entity', '');
    picker.includeDomains = ['weather'];
    picker.style.cssText = 'display:block;width:100%;';
    picker.addEventListener('value-changed', e => {
      if ((/** @type {CustomEvent} */ (e)).detail.value !== undefined) onChange((/** @type {CustomEvent} */ (e)).detail.value);
    });
    container.appendChild(picker);
  }

  _render() {
    this._rendered = true;
    const root = this.shadowRoot;
    const c = this._config;
    const tapAction  = c.tap_action?.action  || 'none';
    const holdAction = c.hold_action?.action || 'none';

    const actions = [
      ['none','Nichts'],['navigate','Zu Seite navigieren'],
      ['more-info','Info-Fenster öffnen'],['call-service','Dienst auslösen'],
      ['url','Webseite öffnen'],
    ];

    root.innerHTML = `
      <style>
        .editor{display:flex;flex-direction:column;gap:14px;padding:8px 0;}
        .field{display:flex;flex-direction:column;gap:5px;}
        .row{display:flex;gap:12px;} .row .field{flex:1;}
        label{font-size:13px;font-weight:500;color:var(--primary-text-color,#212121);}
        .hint{font-size:11px;color:var(--secondary-text-color,#727272);}
        input[type=text],input[type=number],select{
          padding:9px 11px;border-radius:8px;border:1px solid var(--divider-color,#e0e0e0);
          background:var(--card-background-color,#fff);color:var(--primary-text-color,#212121);
          font-size:13px;outline:none;box-sizing:border-box;width:100%;}
        input[type=text]:focus,input[type=number]:focus,select:focus{border-color:var(--primary-color,#03a9f4);}
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:4px 0;}
        .toggle-row label{flex:1;}
        .section{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;
          color:var(--secondary-text-color,#727272);margin-top:6px;
          border-bottom:1px solid var(--divider-color,#e0e0e0);padding-bottom:4px;}
      </style>
      <div class="editor">

        <div class="section">Entität</div>
        <div class="field">
          <label>Wetter-Entität</label>
          <div id="entityPicker"></div>
        </div>

        <div class="section">Anzeige</div>
        <div class="toggle-row">
          <label>Luftfeuchtigkeit anzeigen</label>
          <input type="checkbox" id="show_humidity" ${c.show_humidity !== false ? 'checked' : ''} />
        </div>
        <div class="toggle-row">
          <label>Wind anzeigen</label>
          <input type="checkbox" id="show_wind" ${c.show_wind !== false ? 'checked' : ''} />
        </div>
        <div class="toggle-row">
          <label>4-Tage-Vorschau anzeigen</label>
          <input type="checkbox" id="show_forecast" ${c.show_forecast ? 'checked' : ''} />
        </div>

        <div class="section">Größe</div>
        <div class="row">
          <div class="field">
            <label>Höhe (px)</label>
            <input type="number" id="height" value="${c.height || ''}" min="40" max="200" placeholder="65" />
          </div>
          <div class="field">
            <label>Breite (px, optional)</label>
            <input type="number" id="width" value="${c.width || ''}" min="100" max="800" placeholder="volle Breite" />
          </div>
        </div>
        <div class="field">
          <label>Eckenradius (px)</label>
          <input type="number" id="border_radius" value="${c.border_radius}" min="0" max="40" />
        </div>

        <div class="section">Schrift & Icon</div>
        <div class="row">
          <div class="field">
            <label>Icon-Größe (px)</label>
            <input type="number" id="icon_size" value="${c.icon_size}" min="16" max="64" />
          </div>
          <div class="field">
            <label>Temperatur (px)</label>
            <input type="number" id="temp_size" value="${c.temp_size}" min="10" max="48" />
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Beschriftung (px)</label>
            <input type="number" id="label_size" value="${c.label_size}" min="8" max="24" />
          </div>
          <div class="field">
            <label>Info-Zeilen (px)</label>
            <input type="number" id="info_size" value="${c.info_size}" min="8" max="24" />
          </div>
        </div>

        <div class="section">Aktion bei Tippen</div>
        <div class="field">
          <select id="tap_type">
            ${actions.map(([v,l]) => `<option value="${v}" ${tapAction===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        ${tapAction==='navigate'    ? `<div class="field"><label>Navigationspfad</label><input type="text" id="nav_path" value="${c.tap_action?.navigation_path||''}" placeholder="/lovelace/wetter" /></div>` : ''}
        ${tapAction==='call-service'? `<div class="field"><label>Dienst</label><input type="text" id="svc" value="${c.tap_action?.service||''}" placeholder="script.mein_script" /></div>` : ''}
        ${tapAction==='url'         ? `<div class="field"><label>URL</label><input type="text" id="url_path" value="${c.tap_action?.url_path||''}" placeholder="https://..." /></div>` : ''}

        <div class="section">Aktion bei Gedrückt halten</div>
        <div class="field">
          <select id="hold_type">
            ${actions.map(([v,l]) => `<option value="${v}" ${holdAction===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        ${holdAction==='navigate'    ? `<div class="field"><label>Navigationspfad</label><input type="text" id="hold_nav_path" value="${c.hold_action?.navigation_path||''}" placeholder="/lovelace/wetter" /></div>` : ''}
        ${holdAction==='call-service'? `<div class="field"><label>Dienst</label><input type="text" id="hold_svc" value="${c.hold_action?.service||''}" placeholder="script.mein_script" /></div>` : ''}
        ${holdAction==='url'         ? `<div class="field"><label>URL</label><input type="text" id="hold_url_path" value="${c.hold_action?.url_path||''}" placeholder="https://..." /></div>` : ''}

      </div>
    `;

    this._buildEntityPicker(root.getElementById('entityPicker'), c.entity || '', val => {
      this._config = { ...this._config, entity: val }; this._emit();
    });

    ['show_humidity','show_wind','show_forecast'].forEach(id => {
      root.getElementById(id)?.addEventListener('change', e => this._update(id, (/** @type {HTMLInputElement} */ (e.target)).checked));
    });

    ['border_radius','icon_size','temp_size','label_size','info_size'].forEach(id => {
      root.getElementById(id)?.addEventListener('change', e => this._update(id, parseInt((/** @type {HTMLInputElement} */ (e.target)).value)));
    });

    ['height','width'].forEach(id => {
      root.getElementById(id)?.addEventListener('change', e => {
        const v = (/** @type {HTMLInputElement} */ (e.target)).value.trim();
        const cfg = { ...this._config };
        if (v === '') { delete cfg[id]; } else { cfg[id] = parseInt(v); }
        this._config = cfg; this._emit();
      });
    });

    root.getElementById('tap_type')?.addEventListener('change',  e => this._setActionType('tap_action',  (/** @type {HTMLInputElement} */ (e.target)).value));
    root.getElementById('hold_type')?.addEventListener('change', e => this._setActionType('hold_action', (/** @type {HTMLInputElement} */ (e.target)).value));

    root.getElementById('nav_path')?.addEventListener('change',      e => this._updateAction('tap_action',  'navigation_path', (/** @type {HTMLInputElement} */ (e.target)).value));
    root.getElementById('svc')?.addEventListener('change',           e => this._updateAction('tap_action',  'service',         (/** @type {HTMLInputElement} */ (e.target)).value));
    root.getElementById('url_path')?.addEventListener('change',      e => this._updateAction('tap_action',  'url_path',        (/** @type {HTMLInputElement} */ (e.target)).value));
    root.getElementById('hold_nav_path')?.addEventListener('change', e => this._updateAction('hold_action', 'navigation_path', (/** @type {HTMLInputElement} */ (e.target)).value));
    root.getElementById('hold_svc')?.addEventListener('change',      e => this._updateAction('hold_action', 'service',         (/** @type {HTMLInputElement} */ (e.target)).value));
    root.getElementById('hold_url_path')?.addEventListener('change', e => this._updateAction('hold_action', 'url_path',        (/** @type {HTMLInputElement} */ (e.target)).value));
  }
}

customElements.define('weather-widget-card-editor', WeatherWidgetCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'weather-widget-card',
  name: 'Weather Widget Card',
  description: 'Kompaktes Wetter-Widget im Glasstil mit Temperatur, Zustand, Luftfeuchtigkeit und Wind',
  preview: true,
});
