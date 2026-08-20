# Custom District Map — Fixes Applied

This documents the issues found while getting `superset-plugin-chart-custom-district-map`
running end-to-end (type-check, tests, and actual rendering in the browser), and why each
fix was necessary.

## 1. Jest couldn't run any test in the plugin

**Symptom:** `jest --ci` failed all 3 test suites with
`SyntaxError: Cannot use import statement outside a module`, pointing at `nanoid` (pulled in
transitively via `@superset-ui/core`).

**Cause:** [jest.config.js](jest.config.js) had no `transform`/`transformIgnorePatterns`
configuration, so Jest used its default of not transforming anything under `node_modules` —
including `nanoid`, which ships as an ES module.

**Fix:** Added the same `transform`/`transformIgnorePatterns` block already used by the
sibling `superset-plugin-chart-hello-world` plugin, so `node_modules` gets transformed too.

```js
transform: { '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest' },
transformIgnorePatterns: [],
```

## 2. `npm run type` failed on this plugin

**Symptom:** Several TypeScript errors when type-checking from the repo root:

- `d3` had no exported members `geoMercator`, `geoPath`, `select`, `extent` (named imports).
- Several implicit-`any` parameters (`noImplicitAny`).
- `test/plugin/transformProps.test.ts` imported `supersetTheme` from `@superset-ui/core`,
  which doesn't export it.

**Cause:**

- `supersetTheme` moved to `@apache-superset/core/theme` as part of the theming migration —
  every other plugin in the repo (e.g. `plugin-chart-echarts`) already imports it from there.
- The `d3`/implicit-`any` errors were plain gaps: named d3 imports don't resolve correctly
  under this project's module resolution, and several callback parameters lacked types.

**Fix:** Fixed the `supersetTheme` import path, and added explicit types to the flagged
parameters (see items 4 and 5 below for the d3 import specifically, which needed its own fix
beyond typing).

## 3. `transformProps.test.ts` was leftover boilerplate

**Symptom:** Once the theme import was fixed, the test still failed — its expected output
didn't match what `transformProps.ts` actually returns.

**Cause:** The test's `formData` and expected output were still using fields from the
`hello-world` scaffold (`boldText`, `headerText`, `sum__num`, `name`, ...) instead of this
chart's actual fields (`selectState`, `entity`, `linearColorScheme`, `district_id`/`metric`
data shape, ...). It was never updated after the scaffold was customized.

**Fix:** Rewrote the test's `formData` and expected output to match the real
`SupersetPluginChartCustomDistrictMapQueryFormData` shape and `transformProps.ts` output.

## 4. Missing package.json dependency declarations

**Symptom:** ESLint's `import/no-extraneous-dependencies` flagged `d3`, `@types/d3`, and
`@apache-superset/core` as used but not declared.

**Cause:** These resolved fine at build time only because the monorepo hoists dependencies
to the root `node_modules` — the plugin's own `package.json` never declared them.

**Fix:** Added `d3` as a `dependency`, `@types/d3`/`@types/geojson` as `devDependencies`, and
`@apache-superset/core` as a `peerDependency` (matching the pattern used by
`plugin-chart-echarts`).

## 5. Runtime crash: `React is not defined`

**Symptom:** `ReferenceError: React is not defined`, thrown from the compiled
`esm/SupersetPluginChartCustomDistrictMap.js` as soon as the component tried to render.

**Cause:** This plugin ships two separate build pipelines that don't agree on the JSX
runtime:

- The main app's webpack dev/build compiles this plugin's **source** directly via SWC,
  configured for the **automatic** JSX runtime (no `React` import needed).
- But webpack actually _loads_ this plugin through its published `lib`/`esm` output (per the
  `main`/`module` fields in `package.json`), which is built by the plugin's own **Babel**
  config (`@airbnb/config-babel`). That config compiles JSX to classic
  `React.createElement(...)` calls, which require `React` to be in scope.

  The component only imported the named hooks (`useEffect`, `useRef`, `useState`), never
  `React` itself, so the compiled output called `React.createElement` with nothing named
  `React` in scope.

**Fix:** Import `React` and call the hooks as `React.useRef`/`React.useState`/
`React.useEffect` (matching the exact pattern already used by
`SupersetPluginChartHelloWorld`). Using `React.xxx` instead of a bare `import React from
'react'` also keeps TypeScript's `noUnusedLocals` happy under the app's automatic-JSX-runtime
tsconfig, which would otherwise flag a bare `import React` as unused (JSX alone doesn't count
as "using" `React` under that mode).

## 6. Runtime crash: `Cannot read properties of undefined (reading 'select')`

**Symptom:** After fixing #5, a new crash: `d3.select(container)` threw because `d3` was
`undefined`.

**Cause:** d3 v7 is a real ES module with **no default export** (only named exports like
`select`, `geoPath`, etc.). `import d3 from 'd3'` relies on Babel's CJS/ESM interop, which
resolves a default import to `module.exports.default` — and since d3 sets `__esModule: true`
but has no actual `default` export, that resolves to `undefined`.

**Fix:** Switched to a namespace import, `import * as d3 from 'd3'` (again matching
`SupersetPluginChartHelloWorld`, which already uses this pattern for the same reason).
This trips ESLint's `no-restricted-syntax` (wildcard imports are discouraged), so that one
line has a `// eslint-disable-next-line` with a comment explaining why it's necessary.

## 7. Lint: "adjusting state when a prop changes"

**Symptom:** `react-you-might-not-need-an-effect/no-adjust-state-on-prop-change` fired on the
effect that resets `geoData`/`loadError` whenever `selectState` changes.

**Cause:** The original code called `setLoadError`/`setGeoData` synchronously inside a
`useEffect` keyed on the `selectState` prop — exactly the anti-pattern React's docs (and this
lint rule) warn about: "resetting state when a prop changes" should happen during render, not
in an effect.

**Fix:** Moved the synchronous reset to render time (comparing `selectState` against a
`prevSelectState` state variable, per React's documented pattern), and initialized `geoData`/
`loadError` via lazy `useState` initializers instead of `null`/`false`. The `useEffect` now
only handles the genuinely asynchronous part — fetching the GeoJSON when it isn't already
cached.

## 8. Rendering bug: map showed one solid rectangle, no district boundaries, labels stacked

**Symptom:** The chart rendered as a single solid-colored rectangle filling almost the whole
canvas, with no visible district borders, and all district labels overlapping in the center.

**Cause:** GeoJSON ring winding order. `d3-geo` follows RFC 7946's right-hand rule: exterior
polygon rings must be wound **clockwise** in the (longitude, latitude) plane (holes
counter-clockwise). All 16 state boundary files in `src/districts/` have their exterior rings
wound the opposite way (counter-clockwise) — likely an artifact of whatever tool exported
them, since many older/simpler GIS tools don't enforce RFC 7946 winding.

With the winding backwards, d3-geo interprets every district polygon as its own geometric
_complement_ — "the entire map minus this district" — so every single `<path>` rendered as a
near-full-canvas shape, all stacked on top of each other. This was confirmed outside the
browser: before the fix, every district's computed centroid collapsed to the exact same point
(the canvas center) and every district's bounds equaled the full fitted extent, regardless of
the district's actual size or location. A synthetic 1×1 test polygon reproduced the identical
symptom, and reversing its ring order fixed it — isolating the cause to winding direction
rather than the specific dataset.

**Fix:** Added `rewindFeatureCollection` (and helpers `ringSignedArea`, `rewindRing`,
`rewindGeometry`) that runs once on each state's GeoJSON right after it's fetched, before
caching or rendering it. It computes each ring's shoelace signed area and reverses any ring
that isn't wound the way d3-geo expects. This fixes all 16 state files, not just the one that
was being tested, since they all use the same (wrong) winding convention.

## 9. Feature: dashboard filter can now switch the displayed state

**Request:** The "State" selector was a fixed chart-level dropdown, so a dashboard filter on
a `state_name` column couldn't reach it — filtering by state changed nothing on this chart.

**Change:**

- Added an optional **State column** control (`state_column`), a normal column picker like
  `entity`/District. When set, it's included in `groupby` ([buildQuery.ts](src/plugin/buildQuery.ts)),
  so the query — and therefore any dashboard filter scoped to that column — actually reaches it.
- [transformProps.ts](src/plugin/transformProps.ts) derives the state to render from the
  (possibly filtered) query result: if all returned rows share exactly one state value, that
  state wins over the manual dropdown. If the result spans zero or multiple states (e.g. no
  filter applied yet, or state column left unset), it falls back to the existing **Default
  state** dropdown — renamed from "State" to make that fallback role explicit, but otherwise
  unchanged.
- Added `normalizeStateKey` in [districts/index.ts](src/districts/index.ts) to match a
  free-text state value (whatever string is in the dataset, e.g. `"Selangor"`,
  `"Kuala Lumpur"`, `"Melaka"`) to one of the 16 known state keys — trying an exact key match,
  a couple of known aliases (`Melaka` → `malacca`, `Pulau Pinang` → `penang`), then a
  case-insensitive label match. Values that don't match any known state are ignored (falls
  back to the default dropdown).

**To use it:** In the chart editor, set **State column** to your `state_name` column. On a
dashboard, add a native filter (Value type) scoped to that same column and apply it to this
chart — selecting a state there will scope the query and switch the map automatically. If your
dataset only has `state_code` (not name), this won't match automatically; ask to have
`normalizeStateKey` extended with a code-to-state mapping instead.

**Tests:** Added cases to `buildQuery.test.ts` (groupby includes the state column when set)
and `transformProps.test.ts` (state is derived from a single-state result; falls back to the
default when results span multiple states). Writing these caught a real bug during
development: `ChartProps` camelCases `formData` keys before `transformProps` sees them (this
is why `selectState`/`linearColorScheme`/etc. are already camelCase in that file, despite
their control names being snake_case) — the initial implementation destructured
`state_column: stateColumn` in `transformProps.ts`, which no longer exists as a key by that
point; it needed to be the already-camelCased `stateColumn`. `buildQuery.ts` runs on the raw,
still-snake_case formData, so `state_column` is correct there.

## 10. Feature: infer the state from filtered district results

**Symptom:** Filtering the dashboard to another state returned that state's districts and
metrics, but the visualization continued to display the default Selangor map when the chart's
optional **State column** was not configured.

**Cause:** The map selection only used either the configured State column or the chart's
saved Default state. A result containing only district and metric columns therefore had no
state value to override `selangor`.

**Fix:** Added district metadata for all 16 available maps and
`inferStateKeyFromDistricts` in [districts/index.ts](src/districts/index.ts). When the query
does not provide an explicit state, [transformProps.ts](src/plugin/transformProps.ts) now
matches the returned district names against that metadata and selects the corresponding map.
Matching ignores letter case and surrounding whitespace.

The map-selection priority is:

1. A single state value returned through the configured **State column**.
2. A state uniquely identified by all districts in the filtered result.
3. The chart's configured **Default state**.

Unknown district names are ignored when other returned districts identify exactly one state.
This supports datasets that use renamed or alternate district names. Inference is skipped for
empty results, results with no known districts, or results containing known districts from
multiple states. This prevents the chart from selecting an incorrect map for ambiguous data.

**Tests:** Added focused cases in
[districts/index.test.ts](src/districts/index.test.ts) covering successful inference,
case/whitespace normalization, alternate or unknown district names, mixed-state results, and
empty results. They pass with the repository-level Jest runner. TypeScript compilation and
both CommonJS and ESM builds also pass. The plugin-local Jest command still encounters its
existing Babel/Jest configuration error before running tests.

## 11. Feature: display the active state name above the map

**Request:** Show which state's district map is displayed after the dashboard filter changes
the active state.

**Change:** Added `getStateLabel` in [districts/index.ts](src/districts/index.ts) and a centered
state heading in
[SupersetPluginChartCustomDistrictMap.tsx](src/SupersetPluginChartCustomDistrictMap.tsx).
The heading uses the active inferred, query-provided, or default state and therefore updates
whenever the map changes. The map projection uses the remaining chart height below the
heading so the title does not overlap or crop the map.

## 12. Interaction: clear the district filter from the map background

**Request:** Clear the active district cross-filter when clicking outside a district shape.

**Change:** Added a full-size transparent SVG background rectangle in
[SupersetPluginChartCustomDistrictMap.tsx](src/SupersetPluginChartCustomDistrictMap.tsx).
Clicking an empty area inside the map canvas sends an empty filter and resets both the filter
value and selected district values. District clicks continue to select or deselect that
district, and background clearing only runs when cross-filter emission is enabled and a
district is selected. The explicit rectangle ensures empty areas receive pointer events;
depending on the SVG element's CSS background did not reliably emit clicks.

## 13. Fix: restore district colors after clearing a cross-filter

**Symptom:** After selecting a district and removing the resulting cross-filter, the filter
was removed from the dashboard but the map retained its filtered appearance: the previously
unselected districts stayed faded.

**Cause:** The D3 rendering effect depended on the `filterState` object reference. Superset
can reuse that object while changing its selected values, so React did not always rerun the
effect when the filter was cleared.

**Fix:** The rendering effect in
[SupersetPluginChartCustomDistrictMap.tsx](src/SupersetPluginChartCustomDistrictMap.tsx) now
depends on a serialized key containing the selected district values. Selecting or clearing a
district therefore forces the opacity calculation to run again, restoring every district to
full color after the filter is removed.

## 14. Feature: default to no map

**Request:** Do not display Selangor or another state map before a state has been selected.

**Change:** Added **No map** as the first Default state option and made it the control's
default. When the query does not identify exactly one state, a new chart displays “Select a
state to display its district map.” Applying a state filter still infers the state and loads
its map automatically.

Charts saved before this change retain their saved default state. To adopt the new behavior
on an existing chart, select **No map** under **Default state** and save the chart.

## 15. Fix: update district color when selecting another district

**Symptom:** Clicking another district updated the dashboard cross-filter value, but the map
continued to color the previously selected district.

**Cause:** The D3 rendering effect depended on the query-data array reference. Superset can
reuse that array while replacing its row contents, so React did not always redraw the map
after the selected district changed.

**Fix:** The rendering effect now depends on the serialized district and metric values and
builds its color lookup from that snapshot. When the filtered query changes from one district
to another, the map redraws and moves the metric color to the newly selected district.

## 16. Fix: restore the original default map after clearing a district filter

**Symptom:** The first district selection on the default map filtered correctly, but removing
that filter left the map displaying the selected-query colors. The same action worked after a
state had first been selected through the country map.

**Cause:** Clearing a cross-filter can render once with the previous one-district query result
before the complete unfiltered query arrives. During this transition the chart replaced its
full metric lookup with the selected district only.

**Fix:** Added a metric cache scoped by chart and state. Before district filtering, the chart
stores the complete metric lookup. When the selection is cleared, it restores those metrics
for the transition render, then replaces the cache when the complete query result arrives.
This follows the transition-cache behavior used by the legacy country map.

## 17. Interaction: selecting a state clears the district filter

**Request:** When another state is selected through the country map, remove the active
district cross-filter so it does not restrict the newly selected state's query.

**Change:** The country map emits a dashboard-local event when a state is selected. A district
map with an active district selection listens for that event and clears its own data mask.
The new state's complete district data can then load without the previous state's district
filter. Deselecting or clearing the country-map state remains independent and does not trigger
this behavior.

## Verification performed

- `npm run type` (root, full monorepo type-check) — passes.
- `npx eslint` on all touched files — passes except one pre-existing, unavoidable warning
  (`no-restricted-syntax` on the `React` default import), which mirrors an identical,
  unresolved warning already present in the `hello-world` reference plugin for the same
  underlying reason (see #5).
- `npx jest plugins/superset-plugin-chart-custom-district-map` — 3/3 suites, 7/7 tests pass.
- Rebuilt `lib`/`esm` output and manually inspected the compiled JS to confirm `React` and
  `d3` are correctly bound.
- Reproduced the winding-order bug and its fix numerically (outside the browser) against the
  real `selangor.geojson` data and a minimal synthetic polygon, to confirm the root cause
  before patching the component.
