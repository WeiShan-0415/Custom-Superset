# superset-plugin-chart-selected-incident

This is the Superset Plugin Chart Selected Incident Superset Chart Plugin.

It displays the incident selected in the Priority alerts chart. Both charts
must use the same dataset and map their warning key control to the same
`warning_key` column. Configure the dashboard as follows:

1. Enable dashboard cross-filtering.
2. Enable **Emit dashboard cross filters** on the Priority alerts chart.
3. Include the Selected Incident chart in the Priority alerts chart's
   cross-filter scope.
4. Set both charts' **Warning key column** to the same unique dataset column.

Before a warning is selected, the chart displays a selection prompt. Clicking
an alert emits a `warning_key IN (...)` filter, and this chart displays the
matching title, location, severity color, and description.

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

To add the package to Superset, go to the `superset-frontend` subdirectory in your Superset source folder (assuming both the `superset-plugin-chart-selected-incident` plugin and `superset` repos are in the same root directory) and run

```
npm i -S ../../superset-plugin-chart-selected-incident
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
import { SupersetPluginChartSelectedIncident } from 'superset-plugin-chart-selected-incident';
```

to import the plugin and later add the following to the array that's passed to the `plugins` property:

```js
new SupersetPluginChartSelectedIncident().configure({ key: 'superset-plugin-chart-selected-incident' }),
```

After that the plugin should show up when you run Superset, e.g. the development server:

```
npm run dev-server
```
