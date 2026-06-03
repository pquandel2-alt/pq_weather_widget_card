# 🌤️ Weather Widget Card

Eine kompakte Lovelace-Karte für Home Assistant im Glasmorphism-Stil. Zeigt das aktuelle Wetter in einem übersichtlichen 3-Spalten-Layout: Emoji-Icon, Temperatur mit Zustandsbezeichnung sowie Luftfeuchtigkeit und Windgeschwindigkeit.

## ✨ Features

- **Kompaktes 3-Spalten-Layout** – Icon | Temperatur + Zustand | Luftfeuchtigkeit + Wind
- **Emoji-Wettericons** – passend zum aktuellen Wetterzustand
- **Deutsche Zustandsbezeichnungen** – Sonnig, Bewölkt, Regen, Gewitter usw.
- **Tippen- & Halte-Aktion** – z.B. Navigation zur Wetterseite
- **Vollständig konfigurierbar** – Höhe, Breite, Schriftgrößen, Eckenradius
- **Visueller Editor** – alles per Maske einstellbar, kein YAML nötig
- **Glasmorphism-Design** – passend zur [Glass Button Card](https://github.com/pquandel2-alt/pq_glass-button-card)

## 📦 Installation

### Über HACS (empfohlen)

1. HACS → Frontend → ⋮ → **Custom Repositories**
2. URL: `https://github.com/pquandel2-alt/pq_weather_widget_card` → Typ: **Lovelace**
3. Installieren und Seite neu laden

### Manuell

1. `weather-widget-card.js` nach `/config/www/` kopieren
2. In `configuration.yaml` unter `lovelace → resources` eintragen:
   ```yaml
   resources:
     - url: /local/weather-widget-card.js
       type: module
   ```

## ⚙️ Konfiguration

### Minimal

```yaml
type: custom:weather-widget-card
entity: weather.mein_ort
```

### Vollständig

```yaml
type: custom:weather-widget-card
entity: weather.mein_ort
height: 65
width: 400
border_radius: 20
show_humidity: true
show_wind: true
icon_size: 28
temp_size: 18
label_size: 10
info_size: 12
tap_action:
  action: navigate
  navigation_path: /lovelace/wetter
hold_action:
  action: more-info
```

### Optionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `entity` | string | – | Entity-ID der Wetter-Entität (**Pflicht**) |
| `height` | number | `65` | Höhe der Karte in px |
| `width` | number | – | Breite in px (Standard: volle Breite) |
| `border_radius` | number | `20` | Eckenradius in px |
| `show_humidity` | boolean | `true` | Luftfeuchtigkeit anzeigen |
| `show_wind` | boolean | `true` | Windgeschwindigkeit anzeigen |
| `icon_size` | number | `28` | Größe des Emoji-Icons in px |
| `temp_size` | number | `18` | Schriftgröße Temperatur in px |
| `label_size` | number | `10` | Schriftgröße Zustandsbezeichnung in px |
| `info_size` | number | `12` | Schriftgröße Luftfeuchtigkeit/Wind in px |
| `tap_action` | object | `none` | Aktion bei Tippen |
| `hold_action` | object | – | Aktion bei Gedrückt halten |

### Aktionen

| Aktion | Beschreibung |
|---|---|
| `none` | Nichts |
| `navigate` | Zu einer Lovelace-Seite navigieren (`navigation_path`) |
| `more-info` | Info-Fenster der Entität öffnen |
| `call-service` | Einen HA-Dienst aufrufen (`service`, `data`) |
| `url` | Externe URL öffnen (`url_path`) |

## 🌡️ Unterstützte Wetterzustände

| Zustand | Emoji | Bezeichnung |
|---|---|---|
| `sunny` | ☀️ | Sonnig |
| `clear-night` | 🌙 | Klar |
| `partlycloudy` | ⛅ | Leicht bewölkt |
| `cloudy` | ☁️ | Bewölkt |
| `rainy` | 🌧️ | Regen |
| `pouring` | 🌧️ | Starkregen |
| `snowy` | ❄️ | Schnee |
| `snowy-rainy` | 🌨️ | Schneeregen |
| `lightning-rainy` | ⛈️ | Gewitter |
| `lightning` | ⚡ | Blitz |
| `fog` | 🌫️ | Nebel |
| `hail` | 🌨️ | Hagel |
| `windy` | 💨 | Windig |

## 🔗 Verwandte Projekte

- [Glass Button Card](https://github.com/pquandel2-alt/pq_glass-button-card) – Konfigurierbarer Button im gleichen Glasstil
- [Trash Widget Card](https://github.com/pquandel2-alt/pq_trash_widget_card) – Müllabholtermin im gleichen Glasstil
