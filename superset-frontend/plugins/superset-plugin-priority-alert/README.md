# superset-plugin-priority-alert

This is the Superset Plugin Priority Alert Superset Chart Plugin.

### Dashboard cross-filtering

Set **Warning key column** to the dataset's stable unique warning identifier
(the default is `warning_key`) and enable **Emit dashboard cross filters** for
the chart. Clicking an alert filters charts in its dashboard scope by that
warning key; clicking the selected alert again clears the filter. The Malaysia
3D Map can use the same key to fly to the affected state and color it using the
selected warning's severity.

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

To add the package to Superset, go to the `superset-frontend` subdirectory in your Superset source folder (assuming both the `superset-plugin-priority-alert` plugin and `superset` repos are in the same root directory) and run
```
npm i -S ../../superset-plugin-priority-alert
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
import { SupersetPluginPriorityAlert } from 'superset-plugin-priority-alert';
```

to import the plugin and later add the following to the array that's passed to the `plugins` property:
```js
new SupersetPluginPriorityAlert().configure({ key: 'superset-plugin-priority-alert' }),
```

After that the plugin should show up when you run Superset, e.g. the development server:

```
npm run dev-server
```
