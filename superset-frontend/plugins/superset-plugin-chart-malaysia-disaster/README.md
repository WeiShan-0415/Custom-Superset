# Malaysia Disaster Watch — Superset pixel-match plugin

This package adds a custom Superset chart that displays the existing MapLibre/D3 disaster application in an iframe. It is intentionally a visual-compatibility bridge: the HTML page remains the rendering authority, so its warning list, earthquake impact rings, tsunami timeline, terrain, detail cards, and responsive design remain pixel-matched.

## What this proves

- Superset can host the complete interactive visualization inside a dashboard chart.
- The map resizes to the chart container.
- MapLibre WebGL, D3 interactions, external basemap tiles, terrain, clicks, and animations continue to work.
- No rewrite of `app.js` is required for the visual proof.

## Important limitation

The bridge does not yet use `queriesData`, so Superset dashboard filters do not filter the records inside the iframe. The current map still loads its JSON/API data itself. A native-query second stage would move data normalization into `transformProps.ts`, render MapLibre inside React, and use Superset's `setDataMask` hook for cross-filtering.

## 1. Host the map

For a local Superset installation, start the included server from `C:\PD\map`:

```powershell
node scripts/server.mjs
```

The plugin's default URL is:

```text
http://127.0.0.1:4173/map-superset.html
```

For production, serve the entire `C:\PD\map` web folder behind HTTPS and use the HTTPS `map-superset.html` URL in Explore. Do not use Live Server as a production host.

## 2. Build the plugin

From this plugin directory:

```powershell
npm install
npm run build
```

The package follows the standard Superset visualization-plugin structure: `buildQuery`, `controlPanel`, `transformProps`, a React chart component, metadata, and a public plugin export. The local build uses Babel because Superset's historical standalone plugin-build helper is not published on npm.

## 3. Install into Superset

From the `superset-frontend` directory of your Superset source checkout:

```powershell
npm install -S C:\PD\map\superset-plugin-chart-malaysia-disaster
```

Add this import to `superset-frontend/src/visualizations/presets/MainPreset.js` (or `.ts` in your checkout):

```typescript
import { MalaysiaDisasterChartPlugin } from
  'superset-plugin-chart-malaysia-disaster';
```

Add the plugin to the preset's `plugins` array:

```typescript
new MalaysiaDisasterChartPlugin().configure({
  key: 'malaysia-disaster-watch',
}),
```

Rebuild/restart the Superset frontend. The chart picker will contain **Malaysia Disaster Watch**.

## 4. Create the chart

1. Select any small dataset. The bridge issues only a one-row query because the hosted map owns its data during this proof stage.
2. Choose **Malaysia Disaster Watch** as the visualization.
3. In **Customize → Map URL**, enter the absolute URL of `map-superset.html`.
4. Save the chart and add it to a dashboard.
5. Give the dashboard chart enough space; 1,100 × 650 px or larger is recommended for the desktop layout.

## Content Security Policy

Superset must allow the hosted map origin in `frame-src`. Merge the origin into the existing `TALISMAN_CONFIG` content-security policy in `superset_config.py`; do not replace unrelated directives:

```python
TALISMAN_CONFIG = {
    # Preserve the rest of your existing Talisman configuration.
    "content_security_policy": {
        # Preserve the rest of your existing CSP directives.
        "frame-src": ["'self'", "http://127.0.0.1:4173"],
    },
}
```

When Superset runs over HTTPS, the map must also use HTTPS or the browser will block it as mixed content.

## Stage 2: native Superset data

For dashboard filters and warehouse-governed data, build a single virtual dataset/view containing a normalized hazard row shape:

```text
event_key
hazard_type
event_datetime
title
detail
latitude
longitude
magnitude
depth_km
state
map_state
valid_from
valid_to
geometry_geojson
wave_frame
population
```

Then replace the iframe component with a React MapLibre component that consumes `queriesData[0].data`. The current visual design can remain, but this is a real integration project rather than an iframe bridge.

## Compatibility target

The scaffold follows the visualization-plugin pattern documented for Apache Superset 6.0.0. Older Superset releases may require small import or `MainPreset` filename changes.
