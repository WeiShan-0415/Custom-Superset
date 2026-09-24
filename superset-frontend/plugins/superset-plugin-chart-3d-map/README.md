# superset-plugin-chart-3-d-map

This is the Superset Plugin Chart 3 D Map Superset Chart Plugin.

The chart supports a combined state-warning, earthquake, and tsunami dataset. Select
`state_name` as the state column and expose these columns from the dataset:

- `event_type` (`weather_warning`, `earthquake`, or `tsunami`)
- `event_time`, `title`, and `severity`
- `lat`, `lon`, `depth`, `magnitude`, and `location`

Rows with `event_type = 'earthquake'` and valid coordinates are rendered with
estimated strong (dark red), medium (orange), and light (yellow) shaking zones.
The geodesic zone radii grow logarithmically with magnitude and are attenuated
by earthquake depth. They are visualization estimates rather than observed
ShakeMap contours. The levels render as non-overlapping bands so their colors
remain distinct. Earthquakes initially render as red epicentre circles without
zone bands. Clicking an epicentre reveals only that earthquake's calculated
zone radii without opening a description popup. Warning rows continue to color
Malaysian state polygons; their `severity` value is used when no chart metric
is selected.

Tsunami rows render expanding wave-front rings from the earthquake epicentre,
plus affected coastal markers and a minimizable playback timeline. They
require these additional columns:

- `earthquake_coordinates`: JSON `[longitude, latitude]`
- `affected_areas`: JSON array of objects with `name` and
  `[longitude, latitude]` `coordinates`
- `wave_frames`: JSON array of objects with a display `label` and elapsed
  `minutes`
- `expected_wave_height_m`, `earthquake_location`, `valid_from`, `valid_to`,
  `instruction`, `source_name`, `source_url`, and `advisory_source_status`

The animation expands the outer wave front toward the farthest affected
location at the supplied frame times and draws fading rings behind it. It is
an illustrative radial wave, not a scientific propagation model. Operational
use requires authoritative wave-front geometry from a tsunami model.

Tsunami rows do not change the initial camera extent; the chart continues to
open on the standard Malaysia view. Hazard Layers, Warning Level, and Tsunami
Animation panels start minimized, while all available hazard switches start
enabled.

When dashboard filters narrow the query to one `warning_key`, the camera
focuses the corresponding incident: weather warnings use the state centroid,
while earthquake and tsunami rows use their epicentre coordinates.

light = 2.5 × 10^(0.5M − 1) ÷ √(1 + depth/70)
medium = light × 0.6
strong = light × 0.3

### Usage

To build the plugin, run the following commands:

```
npm ci
npm run build
```

Alternatively, to run the plugin in development mode (=rebuilding whenever changes are made), start the dev server with the following command:

```
npm run dev
```

To add the package to Superset, go to the `superset-frontend` subdirectory in your Superset source folder (assuming both the `superset-plugin-chart-3-d-map` plugin and `superset` repos are in the same root directory) and run

```
npm i -S ../../superset-plugin-chart-3-d-map
```

You may also wish to add the following to the `include` array in `tsconfig.json` to make Superset types available to your plugin:

```
"../../types/**/*"
```

Finally, if you wish to ensure your plugin `tsconfig.json` is aligned with the root Superset project, you may add the following to your `tsconfig.json` file:

```
"extends": "../../tsconfig.json",
```

After this edit the `superset-frontend/src/visualizations/presets/MainPreset.js` and make the following changes:

```js
import { SupersetPluginChart3DMap } from 'superset-plugin-chart-3-d-map';
```

to import the plugin and later add the following to the array that's passed to the `plugins` property:

```js
new SupersetPluginChart3DMap().configure({ key: 'superset-plugin-chart-3-d-map' }),
```

After that the plugin should show up when you run Superset, e.g. the development server:

```
npm run dev-server
```
