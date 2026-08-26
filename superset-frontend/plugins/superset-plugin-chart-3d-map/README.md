# superset-plugin-chart-3-d-map

This is the Superset Plugin Chart 3 D Map Superset Chart Plugin.

The chart supports a combined state-warning and earthquake dataset. Select
`state_name` as the state column and expose these columns from the dataset:

- `event_type` (`weather_warning` or `earthquake`)
- `event_time`, `title`, and `severity`
- `lat`, `lon`, `depth`, `magnitude`, and `location`

Rows with `event_type = 'earthquake'` and valid coordinates are rendered as
magnitude-scaled points. Clicking a point shows its title, location, magnitude,
depth, and event time. Warning rows continue to color Malaysian state polygons;
their `severity` value is used when no chart metric is selected.

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
