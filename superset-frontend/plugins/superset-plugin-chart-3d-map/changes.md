# Changes

## 3D Map chart plugin build fixes

Updated `plugins/superset-plugin-chart-3d-map` to work with the current Superset frontend APIs and build configuration.

- Changed the `styled` import from `@superset-ui/core` to `@apache-superset/core/theme`.
- Changed translation imports to use `@apache-superset/core/translation`.
- Kept `ChartMetadata` and `ChartPlugin` imports in `@superset-ui/core`.
- Removed the unused default `React` import.
- Removed the unused and unavailable `supersetTheme` import.
- Updated the transform-props test to import `supersetTheme` from
  `@apache-superset/core/theme`.
- Reformatted the chart style property types.
- Added `@apache-superset/core` to the plugin peer dependencies and lockfile.
- Updated the plugin Jest configuration to transform the ESM dependencies used by Superset packages.
- Applied Prettier formatting to the changed plugin files.

## Feature: Malaysia 3D buildings map, state click-to-filter, fly-to-state on filter

Replaced the unmodified `create-plugin` scaffold with a working chart, based on a standalone
MapLibre GL demo (`map-buildings.html`) rendering Malaysia with 3D building extrusions.

- Added `maplibre-gl` as a `dependency` of this plugin (scoped here, not the workspace root —
  mirrors how the sibling `superset-plugin-chart-custom-district-map` scoped its own `d3`
  dependency), and `@types/geojson` as a `devDependency`. maplibre-gl was chosen over
  mapbox-gl (already a root devDependency, used by the legacy deck.gl plugins) because it
  needs no access token, unlike mapbox-gl v3+, and matches the reference demo exactly.
- Added a **State column** control (required groupby dimension) and an optional **metric**
  for choropleth coloring, plus **Show district borders** and **linear color scheme** display
  controls (`src/plugin/controlPanel.ts`, `src/plugin/buildQuery.ts`,
  `src/plugin/transformProps.ts`).
- Copied all 16 states'/territories' district-level GeoJSON boundary files and the
  `normalizeStateKey`/`getStateLabel`/`stateOptions` helpers from the sibling
  `superset-plugin-chart-custom-district-map`'s `src/districts/` into this plugin's own
  `src/districts/` (trimmed to drop the district-inference helpers this plugin doesn't need).
  Duplicated rather than cross-imported: sibling `plugins/*` packages resolve through their
  built `lib`/`esm` output at runtime, not live `src` (only `@superset-ui/*`/
  `@apache-superset/*` get webpack's live-src aliasing), so a cross-import would silently go
  stale during iterative development.
- Added `src/geo/loadDistricts.ts` (fetches and merges all 16 states' GeoJSON in parallel,
  tagging each feature with a normalized `stateKey`, cached at module scope) and
  `src/geo/bounds.ts` (a plain min/max coordinate walk computing each state's bounding box —
  no geometry library needed).
- `src/SupersetPluginChart3DMap.tsx`: initializes a MapLibre map against the
  `tiles.openfreemap.org` Liberty style, renders every district as one clickable
  `districts-fill` layer (colored by a `match` expression on each feature's `stateKey`, or by
  metric value via a sequential color scale when a metric is set), and toggles/adds the
  demo's `buildings-3d` `fill-extrusion` layer. Clicking a district applies a cross-filter via
  `setDataMask` (same `extraFormData`/`filterState` contract as the sibling plugin). A
  `zoom` listener derives the camera pitch purely from the current zoom level (flat below
  zoom 8, fully tilted by zoom 14), so both a filter-driven `fitBounds` fly-in and the user's
  own manual zooming produce the same 2D-when-zoomed-out / 3D-when-zoomed-in behavior.

### Fix: removed the "other countries" sky-blue mask (performance)

**Symptom:** map loading became very slow after the mask feature was added.

**Cause:** the mask was one `Polygon` feature — a rectangle covering the region around
Malaysia with every district's exterior ring (~130+ rings across all 16 states) punched out
as a hole — rendered as an opaque sky-blue fill. MapLibre triangulates a single feature's
holes with one `earcut` call on the main thread; a single polygon with that many complex,
real-world-boundary holes is far more expensive to tessellate than the same districts
rendered as ~130 separate features (which the `districts-fill` layer already does, and which
MapLibre can pipeline more efficiently per-feature).

**Fix:** removed the mask source/layer and all mask-polygon-construction code entirely (no
longer needed — the "Malaysia only" framing came from a explicit user request to drop it).
`src/geo/mask.ts` was replaced by `src/geo/bounds.ts`, keeping only the still-needed
`computeStateBBoxes`/`MALAYSIA_PAN_BOUNDS` bbox logic and dropping the winding-normalization
helpers (`ringSignedArea`, `rewindOpposite`, `buildMaskFeature`) that existed solely to build
the mask's holes correctly.

### Fix: `React is not defined` runtime crash

**Symptom:** `ReferenceError: React is not defined`, thrown from the compiled
`esm/SupersetPluginChart3DMap.js` as soon as the component tried to render.

**Cause:** same root cause as item 5 in the sibling plugin's `CHANGES.md` — this plugin's own
Babel build (`@airbnb/config-babel`) compiles JSX to classic `React.createElement(...)` calls,
which need `React` in scope at runtime, but the component only imported the named hooks
(`useEffect`, `useRef`, `useState`), never `React` itself.

**Fix:** import `React` and call the hooks as `React.useRef`/`React.useState`/
`React.useEffect` instead of destructuring them — keeps the import genuinely used (so
TypeScript's unused-import check stays happy under the app's automatic-JSX-runtime tsconfig,
which doesn't otherwise count bare JSX as "using" `React`), matching the sibling plugin's
identical workaround.

### Fix: state highlight got stuck / didn't reset when filters were cleared

**Symptom:** clicking a state highlighted it correctly, but clicking a _different_ state left
the first one still highlighted; clearing all filters didn't return the map to its default
(unfiltered) appearance.

**Cause:** the highlight color, opacity, and fly-to-state camera were all driven by
`activeStateKey`, a value derived from Superset's echoed `filterState` prop — a round-trip
through the dashboard's filter machinery that can lag, or (for a chart's own self-emitted
cross-filter) not echo back to the same chart promptly.

**Fix:** added local component state (`selectedStateKey`) that the click handler updates
optimistically the instant a district is clicked, decoupled from any assumption about
Superset's filterState timing. It's still kept in sync with `activeStateKey` via an effect,
so externally-driven changes (another chart's cross-filter, a dashboard filter, or clearing
filters) still take effect. All highlight/opacity/fly-to logic now reads from this local
state instead of the prop directly.

### Fix: highlight still stuck / didn't reset (native filters, and after clearing)

**Symptom:** after the previous fix, clicking a state via a map click worked, but changing
the state through a dashboard **native filter** (not a map click) left the previously
clicked state still highlighted; clearing filters also didn't always reset the map.

**Cause:** the previous fix synced local click state from `activeStateKey`, a value derived
in `transformProps.ts` from `filterState.selectedValues` (populated for chart-to-chart
cross-filters) with a fallback to inspecting the query rows. Native dashboard filters scope
the query the same way a cross-filter does, but don't necessarily go through the same
`filterState` echo path, so `activeStateKey` wasn't a reliable single source of truth across
every way this chart's query can get filtered.

**Fix:** removed `activeStateKey`/`filterState` from `transformProps.ts` and
`types.ts` entirely. The component now derives the "queried state" directly from `props.data`
(`deriveQueryStateKey` in `SupersetPluginChart3DMap.tsx`) — unambiguous ground truth, since it
reflects whatever the query actually returned regardless of _how_ it got filtered (native
filter, cross-filter, or this chart's own click). A short-lived local override
(`clickedStateKey`) still makes a click feel instant instead of waiting on the requery, but is
reset the moment the query result changes at all — using the same render-time "adjust state
when a prop changes" pattern (`prevQueryStateKey` comparison) already used by the sibling
plugin for `selectState`, rather than a `useEffect`.

### Feature: clicking outside a state clears the filter

**Request:** clicking on open water/another country (outside any district) should clear the
current filter, the same as clicking the active state again.

**Change:** replaced the `districts-fill`-scoped click listener with a single unscoped
`map.on('click', ...)` handler that does its own hit test via
`map.queryRenderedFeatures(event.point, { layers: ['districts-fill'] })`. A hit toggles/selects
that district's state as before; no hit clears the filter entirely.

### Fix: default color didn't reliably return right after clearing a filter

**Symptom:** immediately after clearing the filter (clicking outside a state, or deselecting
by clicking the active state again), the map didn't reliably show its default appearance.

**Cause:** `clickedStateKey` used `null` for two different meanings at once: "no local
override, defer to the query result" _and_ "explicitly deselected." Both the click-outside
handler and the deselect-by-reclicking path set it to `null` to mean the latter, but
`selectedStateKey = clickedStateKey ?? queryStateKey` treats any `null` as "no override" and
falls through to `queryStateKey` — which, for a brief window right after clearing, still holds
the _previous_ (stale, pre-requery) value. So the explicit clear could resolve back to the old
highlighted state instead of nothing, until the requery happened to also settle on a
`queryStateKey` of `null`.

**Fix:** gave "no override" its own distinct value (`undefined`) so it no longer collides with
`null` ("explicitly deselected"): `selectedStateKey = clickedStateKey !== undefined ?
clickedStateKey : queryStateKey`. Clearing now resolves to `null` immediately and
unambiguously, independent of whatever `queryStateKey` happens to be mid-requery.

### Fix: highlight/color still didn't reset after clearing (root cause found)

**Symptom:** even after the previous two fixes, a state clicked earlier (e.g. Sarawak) could
still visually stand out (via the opacity dimming applied to non-selected states) after every
filter was cleared, if the clear happened through anything other than clicking on the map
itself (e.g. removing the filter badge from the dashboard's own UI).

**Cause:** the previous fix derived the "active state" purely from `props.data`, on the theory
that it's the one unambiguous ground truth regardless of filter mechanism. That's true only if
this chart's own query is actually re-scoped by its own emitted cross-filter — but Superset's
default cross-filter scope typically **excludes the emitting chart from its own filter**, so
`data` may never change at all in response to this chart's own clicks. With `data` never
changing, `activeStateKey`/`queryStateKey` derived from it never changes either, so the
render-time reset that was supposed to clear a stale local click override never fired for
anything other than another click on the map — an external clear (filter badge, dashboard
"clear filters") was invisible to the component entirely.

**Fix:** restored `filterState.selectedValues`-based derivation in `transformProps.ts`
(`deriveActiveStateKey`), since `filterState` is the one signal Superset reliably updates for
the _owning_ chart regardless of whether its own query gets re-scoped — falling back to
inferring from query rows only when `filterState` has no opinion (the native-dashboard-filter
case, which doesn't touch `filterState` at all). Also changed the component's own
`applyStateFilter` to send an explicit `selectedValues: []` (not `null`) when clearing, so
`deriveActiveStateKey` can tell "explicitly cleared" apart from "no cross-filter opinion, infer
from rows" unambiguously — otherwise a clear could still resolve back to a stale row-inferred
state while the requery was in flight. The component's local `clickedStateKey` optimistic
override (for instant click feedback) and its `undefined`-vs-`null` sentinel distinction (from
the previous fix) are unchanged, just now synced from `activeStateKey` instead of a
client-side-only derivation from `data`.

### Fix: selection unreadable against metric-driven choropleth colors

**Symptom:** switching the filter from Sarawak to Sabah correctly updated the filter badge to
"Sabah", but Sabah didn't visually stand out and Sarawak still looked "dark"/prominent.

**Cause:** this chart has a metric configured, so `districts-fill`'s color is entirely
metric-driven (`buildFillColorExpression`'s first branch) — each state's color reflects its
own metric value and has nothing to do with which state is "selected". The only selection
signal was `fill-opacity` (0.75 selected / 0.35 not), which is a weak, easy-to-miss cue against
a choropleth that's already varying in color/darkness per state for unrelated reasons (e.g. a
state with a naturally high metric value reads as "dark" regardless of selection).

**Fix:** added a dedicated `selected-state-outline` line layer, filtered via `map.setFilter`
to just the selected state's `stateKey` and styled with a bold, high-contrast color unrelated
to the fill palette. This is unambiguous no matter what `districts-fill` looks like. Simplified
`fill-opacity` back to a flat `0.6` (removed the selected/non-selected split) now that
selection has its own dedicated visual.

### Fix: removed metric-driven choropleth coloring entirely (root cause of the "dark blob")

**Symptom:** clicking Pahang turned most of the peninsula (not just Pahang) a uniform dark
gray; clicking Kedah afterward moved the selection outline correctly, but the same dark fill
persisted across the same broad area instead of following the new selection or resetting.

**Cause:** this chart had a metric configured, so `fill-color` was computed from a per-state
linear color scale (`buildFillColorExpression`'s metric branch, added earlier as an optional
bonus feature). The moment the query narrows to a single selected state, that scale's domain
collapses to one point (`min === max`), which produces degenerate, unpredictable output — in
practice, a very dark, saturated color — applied via the `match` expression. Combined with
uncertainty over whether this chart's own query is even reliably re-scoped by its own filter
(see the two preceding fixes), the metric branch was a second, compounding source of exactly
the kind of "wrong color, doesn't follow the filter" symptoms reported across this whole
thread — and it was never actually what was wanted: the desired behavior ("dark = currently
selected, follows the filter, resets on clear") is a plain selection highlight, not a
value-driven choropleth.

**Fix:** removed metric-driven coloring entirely, including the `metric` and
`linear_color_scheme` controls (no longer used by anything). `fill-color` is now always the
simple two-tone `HIGHLIGHT_STATE_COLOR`/`DEFAULT_STATE_COLOR` `match` expression keyed on
`selectedStateKey` — deterministic, and combined with the dedicated outline layer from the
previous fix, directly matches "dark fill follows the filter, resets to default when cleared."
`StateMapDataItem`/`buildQuery.ts`/`transformProps.ts`/`types.ts` were all trimmed to drop the
now-unused `metric` plumbing.

### Change: restored metric-driven coloring, removed the selection outline

**Request:** keep the metric-based choropleth coloring; drop the dedicated selection outline
layer added two fixes ago.

**Change:** reverted the previous fix's removal of metric coloring — `buildFillColorExpression`,
the `metric`/`linear_color_scheme` controls, and the `metric` field on `StateMapDataItem` are
all back, unchanged from their original design. Removed the `selected-state-outline` layer and
its `map.setFilter` update entirely; `fill-opacity` stays a flat `0.6`. Selection is once again
communicated purely through the fill color itself — the metric scale's degenerate-domain
behavior when a single state is selected (documented in the previous fix) still applies, but
per this request that's the desired "dark = selected" effect, not something to guard against.

### Fix: metric color follows the active dashboard filter

**Symptom:** changing the dashboard filter from one state to another updated the filter
badge, but the previous state's dark metric color remained visible.

**Cause:** the metric branch of `buildFillColorExpression` ignored `selectedStateKey` and
always emitted colors for every state in the query result. This is especially visible when
the chart is excluded from its own cross-filter and continues to receive the complete
dataset.

**Fix:** preserve the full dataset as the metric scale domain, but emit a metric color only
for the selected state while a single-state filter is active. With no active filter, the
complete metric choropleth is still shown.

**Result:** the unfiltered map continues to color every state according to its metric. When
the filter changes from Pahang to Perak (or between any other states), the previous state
returns to the default fill and the metric-colored fill follows the newly active state.
Clearing the filter restores the complete choropleth.

### Revert: back to the simple two-tone highlight + selection outline

**Request:** revert both the "restored metric-driven coloring, removed the selection outline"
change and the "metric color follows the active dashboard filter" fix above.

**Change:** `buildFillColorExpression` is metric-free again — a plain `match` expression on
`selectedStateKey` (`HIGHLIGHT_STATE_COLOR` for the selected state, `DEFAULT_STATE_COLOR`
otherwise), with no dependency on `data` or `linearColorScheme`. The `metric`/
`linear_color_scheme` controls and all metric plumbing (`buildQuery.ts`, `transformProps.ts`,
`types.ts`) are removed again. The dedicated `selected-state-outline` layer and its
`map.setFilter` update are restored. This is the same end state as the "Fix: removed
metric-driven choropleth coloring entirely" entry above — the two changes since then are
undone in full, not just cosmetically.

## Feature: state name shown above the map

**Request:** when a state is clicked, show its name above the map.

**Change:** the component's root element is now split into two: an outer `Styles` wrapper
(sized to the chart's `height`/`width`) and an inner `.map-container` div that's the *only*
element MapLibre's `container` option ever touches. A `.state-title` div — plain React JSX,
rendered as a sibling of `.map-container`, not a child of it — shows `getStateLabel
(selectedStateKey)` as an absolutely-positioned bar across the top whenever a state is
selected, and renders nothing otherwise. Split deliberately: MapLibre takes ownership of its
container element's DOM once initialized, so rendering the title as a React child *inside*
that same element would risk React and MapLibre fighting over the same DOM subtree (MapLibre
appends its own canvas/control nodes there; React's reconciliation doesn't know about them).
Keeping the title as a sibling avoids that entirely — no `map.resize()` call is needed either,
since the title overlays the map rather than shrinking its container.

## Feature: 3D terrain, and d3-geo for click hit-testing

**Request:** add terrain to the map, sourced from OpenStreetMap; use d3 to do the state
click-filtering instead of MapLibre's own hit-testing.

**Terrain:** OpenStreetMap itself doesn't publish elevation data (it's vector-only — roads,
buildings, administrative boundaries), so there's no literal "terrain from OSM" to add.
Used AWS's public "Terrarium" elevation tiles instead
(`s3://elevation-tiles-prod`, part of the AWS Open Data program) — free, keyless, no signup,
for the same reason the OpenFreeMap base style was chosen originally over a token-gated
alternative. Added a `terrain-dem` `raster-dem` source (`encoding: 'terrarium'`), called
`map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 })` so the whole map — base style,
districts, buildings — drapes over real elevation, added a `hillshade` layer beneath
`districts-fill` for visible relief through the (semi-transparent) district fill, and added a
`maplibregl.TerrainControl` so terrain can be toggled off from the map's own UI.

**Click filtering with d3:** replaced the `map.queryRenderedFeatures(event.point, {layers:
[...]})` hit test (a rendered-pixel query) with `d3.geoContains(feature, [lng, lat])` — using
`event.lngLat` (MapLibre computes this for every click, layer-scoped or not) tested against
each feature in the already-loaded `districtsFC.features`, same pattern the sibling
`superset-plugin-chart-custom-district-map` uses `d3` for (added as a `dependency` here too,
matching that plugin's `d3`/`@types/d3` versions and its namespace-import workaround for d3
v7 having no default export). The click-outside-clears and select/deselect logic is otherwise
unchanged — only *how* the clicked state is determined moved from MapLibre to d3-geo.

## Revert: state name above the map

**Request:** revert the "state name shown above the map" feature.

**Change:** removed the `.state-title` element and its styles, and collapsed the root back to
a single `<Styles ref={rootElem} height={height} width={width} />` — the split into an outer
`Styles` wrapper plus an inner `.map-container` div (added specifically to give the title a
safe sibling slot outside MapLibre's own DOM subtree) is undone along with it, since nothing
else needed that split. `getStateLabel` stays imported — it's also used for the click
handler's raw-value fallback, unrelated to the title.

## Fix: only one state was ever clickable after switching to d3-geo hit-testing

**Symptom:** after the previous change (d3-geo point-in-polygon for click hit-testing),
clicking any district anywhere on the map always selected a Johor district — every other
state was effectively unclickable.

**Cause:** the same GeoJSON ring-winding issue the sibling `superset-plugin-chart-custom-
district-map` plugin already hit and documented (its `CHANGES.md` item 8): `d3-geo` follows
RFC 7946's right-hand rule (exterior rings wound clockwise in the lon/lat plane), but these
district files are wound the opposite way. `d3.geoContains` therefore treated almost every
polygon as its own geometric *complement* — matching nearly the entire globe *except* the
district's real shape. Since `districtsFC.features.find(...)` returns the first match, and
Johor is the first state merged into the collection (`districts/index.ts`'s import order),
practically any click resolved to "the point is in the complement of some Johor district" —
the first entry the inverted test matched, everywhere.

**Fix:** added `src/geo/rewind.ts` (`rewindGeometry`, adapted from the sibling plugin's
`rewindRing`/`rewindGeometry`/`ringSignedArea`) and applied it to every feature's geometry in
`loadAllDistricts()` right after fetching, before the `stateKey` gets tagged on. MapLibre's own
polygon fill rendering isn't winding-sensitive the same way (confirmed back when the mask
layer was still in the picture), so this only needed to change what d3-geo consumes — no
effect on how `districts-fill`/`districts-line`/`selected-state-outline` render.

**Tests:** added `test/geo/rewind.test.ts`, which reproduces the bug numerically first
(`d3.geoContains` returns `false` for a point actually inside an unrewound test square, and
`true` for a point clearly outside it — the exact inverted behavior) before asserting the fix
corrects both cases.

**Also fixed:** the plugin's own `jest.config.js` `transformIgnorePatterns` only allowlisted a
handful of specific `d3-*` submodules (a scaffold leftover), not the full `d3` package now
imported directly — `d3`'s own entry point re-exports every d3-* submodule (including
`d3-delaunay`, which pulls in the ESM-only `delaunator`/`robust-predicates`), all of which
need Babel transformation same as those already-listed ones. Broadened the pattern to
`d3(-[a-z-]+)?` plus `delaunator`/`robust-predicates` rather than trying to enumerate every
individual d3 submodule.

## Tweak: thinner selection outline

**Request:** make the selected-state outline less bold.

**Change:** `selected-state-outline`'s `line-width` reduced from `3` to `1.5`.

## Fix: hillshade texture visible over the sea

**Request:** hide the terrain effect over the sea.

**Cause:** the `hillshade` layer is a full-coverage raster (no per-feature filter like a vector
layer would have), and it was inserted just below `districts-fill` — above almost the entire
base style, including its water layer. That let the shading texture show through open water
(and under roads/labels) instead of being covered by them.

**Fix:** insert `hillshade` before the base style's own first layer instead, so every one of
the base style's layers — water included — draws on top of it. Terrain elevation/shading now
only shows up where nothing else in the style already covers it, i.e. wherever land is
actually rendered.

## Fix: terrain shading disappeared entirely, land included

**Symptom:** after the previous fix, hillshade wasn't visible anywhere on the map at all —
not just over the sea, but over Malaysia's own land area too.

**Cause:** the base style's very first layer is an opaque `background` fill covering the
*entire* viewport (a standard base layer in vector styles, meant to paint underneath
everything). Inserting `hillshade` before that layer put it underneath an opaque layer that
covers 100% of the canvas, not just the water — hiding it everywhere, land included.

**Fix:** target the base style's water layer specifically (found at runtime by
`source-layer === 'water'`) as the `beforeId`, instead of the style's first layer. Hillshade
now sits above `background` and any landcover layers (so relief shows through on land, same
as before terrain was added) but below `water` (so the sea still covers it), matching the
standard "hillshade beneath water, above land" layering convention used in terrain-enabled
map styles generally.

## Removed: selected-state outline

**Request:** don't show the district outline for the selected state.

**Change:** removed the `selected-state-outline` layer entirely — its `map.addLayer` call,
the `map.setFilter` update that kept it pointed at the selected state, and the
`SELECTED_OUTLINE_COLOR` constant. Since this layer was built from per-district geometry, it
was drawing every individual district boundary within the selected state (not a single clean
state-level outline), which read as visual clutter. Selection is communicated by
`districts-fill`'s highlight color alone again — same as the very first version of this
interaction, before the outline was added.

## Change: terrain off by default

**Request:** the terrain toggle button should start with terrain disabled.

**Change:** removed the unconditional `map.setTerrain(...)` call made right after adding the
`terrain-dem` source — terrain now starts off, and the map's own `TerrainControl` button turns
it on when clicked (it already had the source/exaggeration to do so, from how the control was
constructed at map init). Also set the `hillshade` layer's initial visibility to `none` and
added a `map.on('terrain', ...)` listener that keeps it in sync with `map.getTerrain()`
whenever terrain is toggled — otherwise the shading would keep showing even with terrain (the
3D displacement) switched off, which would look inconsistent with the button's own state.

## Feature: per-state disaster-count badges

**Request:** a metric counting how many disasters are happening in each state, shown as a
colored number badge on top of the state — yellow for 2 or fewer, red for more than 2.

**Change:** reintroduced the `metric` control (removed in an earlier revert), but with a
deliberately different coloring model than the old choropleth: `['step', ['get','count'],
YELLOW, 3, RED]` — a fixed threshold, not a min/max scale. This matters because it's what
makes this feature safe against the exact bug that plagued the earlier metric-driven fill
color: a threshold comparison ("is this count above 2?") doesn't depend on what other states'
counts happen to be, so it behaves identically whether `data` currently holds one state or
sixteen. No degenerate-domain failure mode like the linear scale had.

Added `src/geo/centroids.ts` (`computeStateCentroids`, using `d3.geoCentroid` — same winding
caveat as `d3.geoContains`, so it also needs already-rewound geometry, which `loadAllDistricts`
already provides) to place each badge somewhere sensibly inside its state rather than at a
bounding-box corner. Added a `disaster-counts` GeoJSON point source (one point per state with
a `count` property, positioned at that state's centroid) plus two layers reading it: a `circle`
layer for the colored badge background, and a `symbol` layer for the number itself. Both are
added last in the layer stack so they render above buildings/districts/terrain. A dedicated
effect keeps the source's data in sync with `data`/`stateCentroids` as either changes —
deliberately not frozen at the initial unfiltered view, so the badges reflect whatever the
current query result actually is, filtered or not.

Per the "badge only, not the state fill" decision: `districts-fill`'s own color is untouched by
this feature — it's still the plain highlight/default two-tone driven by `selectedStateKey`.

**Tests:** added `test/geo/centroids.test.ts` (verifying computed centroids land inside their
source geometry — also demonstrates the fixture must be rewound first, same as the real
pipeline, or `d3.geoCentroid` gives nonsense results for the same reason `d3.geoContains` did),
and restored the metric-related `buildQuery.test.ts`/`transformProps.test.ts` cases.

## Tweak: faster mouse-wheel zoom

**Request:** scrolling to zoom feels slow.

**Change:** `map.scrollZoom.setWheelZoomRate(1 / 225)`, doubling MapLibre's default
mouse-wheel zoom rate (`1 / 450` per line) — each scroll tick now moves the zoom level twice
as far.

## Fix: clicking a state never moved the camera

**Symptom:** clicking a state correctly highlighted it and applied the filter, but the camera
stayed at the whole-country view — screenshots showed identical framing whether nothing,
Terengganu, or (after clearing) nothing was selected again.

**Cause:** `maxZoom` in the fly-to-state `fitBounds` call had been changed to `200` outside
this conversation (found while re-reading the current file — the surrounding session had
already flagged it as externally modified). MapLibre zoom levels are meaningfully bounded
(typically 0–24); `200` is far outside that range and silently breaks the camera transform
computation, so `fitBounds` becomes a no-op instead of erroring visibly — exactly matching
"nothing moves at all" while the unrelated fill-color effect (driven by the same
`selectedStateKey`, but not going through `fitBounds`) kept working fine.

**Fix:** restored `maxZoom: 16`. Also wrapped both the geodata bbox/centroid computation and
the `fitBounds` calls themselves in `try`/`catch` with `console.error` — independently for
bboxes vs. centroids, so a failure in one (e.g. a degenerate geometry breaking
`d3.geoCentroid`) can no longer leave `stateBBoxes` stuck at `null` forever the way an
uncaught exception previously could. This is defensive, not just a fix for this one bad
value: the next time something like this happens, it'll show up as a console error instead of
a silent, hard-to-diagnose no-op.

**Separately observed, not yet confirmed as a real bug:** the screenshots also showed the
disaster-count badges still limited to just Terengganu immediately after "cancelling" the
filter, even though the highlight correctly reset to no selection. That's consistent with
`data` (the query result) not having caught up yet at the moment the screenshot was taken —
`activeStateKey` resets independently and immediately once `filterState.selectedValues`
becomes `[]`, while the badges are driven entirely by `data`, which depends on the actual
requery completing. If this turns out to persist rather than self-correct after a moment,
that's a distinct issue worth its own investigation.

## Investigating: badges still stuck on stale data after clearing a filter

**Update:** confirmed by the user this is a real bug, not a requery-timing artifact — the
underlying query result itself is correct (verified directly) after clearing, but the badges
on the map still only reflect the previously-filtered single state. Every code path traced by
hand (`transformProps.ts`'s `data` construction, `buildDisasterCountFeatures`, the
`disaster-counts` source-update effect, the `disaster-count-circle`/`disaster-count-label`
layer definitions) looks correct on inspection, so the cause isn't obvious from static review
alone.

Added temporary diagnostic logging (`console.log('[3D map] disaster-counts update', ...)`) in
the source-update effect, reporting `data.length`, each row's `state_key`, how many centroids
are available, and the resulting feature count — logged every time the effect actually runs.

**Resolution: not a bug.** The diagnostic showed `dataStateKeys` doesn't change at all when
clicking a different state on the map — `data` (this chart's own query result) never narrows
in response to this chart's own emitted cross-filter at all. That's expected Superset
behavior: cross-filter scope defaults to excluding the emitting chart from its own filter, so
this chart's query only ever changes in response to something *external* to it (a native
dashboard filter, or another chart's cross-filter explicitly scoped to include this one) —
never its own clicks.

Given the badges were originally requested as "before any filter, show a count for every
state," this is actually the correct, desired behavior, not a defect: the badges stay a
persistent country-wide overview no matter what gets clicked/highlighted on the map, since the
highlight (`selectedStateKey`) and the badges (`data`) are driven by genuinely different
signals on purpose. Removed the temporary diagnostic logging and left the source-update
effect's own comment explaining this scoping behavior in place, so it isn't relitigated.

## Fix: 404 on the disaster-count badge's font glyphs

**Symptom:** `GET https://tiles.openfreemap.org/fonts/Open%20Sans%20Regular,Arial%20Unicode%20MS%20Regular/0-255.pbf 404`.

**Cause:** `disaster-count-label` (the `symbol` layer showing each badge's count) never set
`text-font`, so MapLibre fell back to its built-in default font stack — `Open Sans Regular,
Arial Unicode MS Regular`, a Mapbox-specific default. OpenFreeMap's Liberty style is
self-hosted and doesn't serve that font from its glyph endpoint, hence the 404 (the numbers
still rendered, just via MapLibre's own fallback-glyph behavior, not the requested font).

**Fix:** look up an existing `symbol` layer already in the loaded base style and reuse its
`text-font` for `disaster-count-label`, falling back to `['Noto Sans Regular']` (OpenFreeMap's
own typeface for the Liberty style) if none is found. This avoids hardcoding a guess at what
OpenFreeMap happens to host — it uses whatever font the style's own labels are already
successfully requesting.

## Fix: missing badge for one state (Kedah)

**Symptom:** filtering to Kedah correctly highlighted it and flew the camera there (both
driven by `stateBBoxes`, proven working), but no disaster-count badge appeared, even though
the SQL confirmed the query returned a correct row for Kedah.

**Cause:** narrowing this down to "camera/highlight work, only the badge doesn't" isolated the
problem to `stateCentroids` specifically — the only piece unique to the badge feature.
`d3.geoCentroid`'s spherical area-weighted formula is more fragile than the plain min/max
bbox walk: empirically, it can land on a finite-but-wrong point for certain geometries (e.g.
two contributions with near-canceling signed areas), not just `NaN` — so a simple
`Number.isFinite` check wasn't sufficient to catch every failure mode.

**Fix:**
- `computeStateCentroids` now discards any centroid that isn't finite, rather than storing an
  unusable `NaN` point (tested by mocking `d3.geoCentroid`'s return value directly, since no
  synthetic GeoJSON fixture reliably reproduced the real degenerate case — empirically,
  "obviously degenerate" inputs like a zero-area or empty-ring polygon all came back finite
  anyway).
- `buildDisasterCountFeatures` now validates that a state's centroid actually falls within
  its own bounding box (`isCentroidInBBox`) — a centroid, by definition, has to lie inside its
  own bbox, so this catches the finite-but-wrong case the `NaN` check alone couldn't. Whenever
  the centroid is missing or fails this check, it falls back to the bbox's own center
  (`bboxCenter`), which — since `stateBBoxes` is what the camera fly-to already relies on and
  is proven reliable — is a dependable fallback position for the badge.

## Feature: disaster-count badges no longer affected by filtering

**Request:** the disaster count shouldn't be affected by filtering.

**Context:** the Kedah SQL query in the previous exchange made clear `data` genuinely does get
narrowed by filters that are external to this chart — a native dashboard filter, or another
chart's cross-filter scoped to include this one (this chart's *own* clicks stay excluded per
Superset's default cross-filter scope, but that's not the only way `data` can narrow). The
badges were still built directly from `data`, so any of those external filters would narrow
the badges down too.

**Change:** added `badgeData`, a render-time cache (same "adjust state during render" pattern
used elsewhere in this file) of the *largest* `data` result seen so far — it only ever grows,
never shrinks, so once a fuller picture has been observed, a later filter narrowing `data`
back down no longer affects it. The badge source-update effect now reads from `badgeData`
instead of `data` directly, decoupling the badges from every filter source, not just this
chart's own clicks.

## Revert: Kedah badge fix, and badges-unaffected-by-filtering

**Request:** revert both the "Fix: missing badge for one state (Kedah)" and "Feature:
disaster-count badges no longer affected by filtering" changes above.

**Change:**
- `computeStateCentroids` (`src/geo/centroids.ts`) no longer discards non-finite centroids —
  back to unconditionally storing whatever `d3.geoCentroid` returns. Its dedicated Jest test
  (mocking `d3.geoCentroid` to return `[NaN, NaN]`) was removed along with it.
- `buildDisasterCountFeatures` (`SupersetPluginChart3DMap.tsx`) is back to its original
  2-argument form (`data`, `stateCentroids`), with no bounding-box validation or fallback.
  `isCentroidInBBox` and `bboxCenter` are removed entirely.
- `badgeData` (the render-time "largest `data` seen so far" cache) is removed. The
  `disaster-counts` source-update effect reads directly from `data`/`stateCentroids` again,
  matching the "Feature: per-state disaster-count badges" entry's original design — the badges
  once again reflect whatever the current query result actually is, filtered or not, rather
  than being decoupled from filtering.

## Validation

The following command completes successfully:

```bash
npm run build --workspace superset-plugin-chart-3-d-map
```

This validates:

- CommonJS compilation
- ES module compilation
- TypeScript declaration generation
- Passing Jest test suites (`buildQuery`, `transformProps`, `geo/bounds`, plugin-exists smoke test)

Also verified independently: `npx tsc --noEmit` and `npx eslint` clean on all touched files.

After the revert to the two-tone highlight + outline design, the plugin's 7 Jest tests,
TypeScript declaration build, and Prettier check complete successfully.

After reverting the Kedah badge fix and the badges-unaffected-by-filtering feature, the
plugin's 14 Jest tests, TypeScript declaration build, and lint all complete successfully.

The build still prints non-failing Browserslist database and translation initialization warnings.

The Superset application health check at `http://localhost:8088/health` could not run because the local server was not available in this environment; behavior in the actual dashboard (map rendering, click-to-filter, fly-to-state, clearing filters) was verified interactively by the user in their own running instance.

## Feature: earthquake point layer for combined event datasets

Extended the map to render earthquake events alongside the existing Malaysian
state-warning polygons.

- Updated the chart query to request the combined dataset's `event_type`,
  `event_time`, `title`, `severity`, `lat`, `lon`, `depth`, `magnitude`, and
  `location` columns in addition to the configured state column.
- Added earthquake-row transformation with numeric conversion and coordinate
  validation. Rows with missing or out-of-range latitude/longitude values are
  excluded from the point layer.
- Added a MapLibre GeoJSON source and circle layer for rows where
  `event_type = 'earthquake'`.
- Scaled earthquake marker size and color by magnitude and added a white marker
  outline for visibility against the base map.
- Added click popups showing the earthquake title, location, magnitude, depth,
  and event time. Popup content uses DOM text nodes so dataset values are not
  interpreted as HTML.
- Removed the Malaysia-only pan restriction so earthquakes outside the country
  remain reachable while preserving Malaysia as the initial/default view.
- Used the dataset's `severity` column for state coloring when no optional chart
  metric is configured.
- Documented the combined dataset schema in `README.md` and added focused query
  and transform-props tests for earthquake data.
- Fixed a source-initialization race where earthquake data could be processed
  before the asynchronously loaded district geometry created the MapLibre
  source, leaving the point layer empty until another chart update.
- Set an explicit dark popup text color so earthquake details remain readable
  when the chart is displayed in a dark-themed dashboard.
- Formatted numeric Unix event timestamps as readable local date/time values in
  earthquake popups using `DD/MM/YYYY HH:mm:ss`.
- Hid the state-warning fill layer when filtering leaves only earthquake rows,
  and fixed its asynchronous initialization dependency so the empty state is
  applied as soon as the district layers become available.
- Limited earthquake markers to events whose `event_time` falls within the
  viewer's current calendar year; warning rows are not affected.

## Fix: earthquake rows polluted the state choropleth data

**Symptom:** with the combined weather-warning/earthquake dataset (earthquake
rows carry no state, and can be outside Malaysia entirely), `transformProps`
built the state-choropleth `data` array from every row returned by the query,
not just the weather-warning ones.

**Cause:** earthquake rows have `NULL` state columns, so mapping over them
for `data` produced junk entries with an empty `state_key`. Both event types
also share the `severity` column on different scales (weather-warning
severity vs. an earthquake-magnitude-derived value), so with no optional
chart metric configured, an earthquake row's `severity` could leak into the
state color badges.

**Fix:** `transformProps.ts` now filters out `event_type === 'earthquake'`
rows before building the state `data` array and before deriving
`activeStateKey`, mirroring the existing `event_type === 'earthquake'` filter
already used to build the `earthquakes` point-layer array. Weather-warning
rows (or any row not tagged `earthquake`) still populate the choropleth as
before, and non-Malaysia earthquakes still populate the point layer via the
already-existing `earthquakes` filter, which has no Malaysia-only
restriction.

**Tests:** added a `transformProps.test.ts` case with mixed weather-warning
and earthquake rows in one query response, asserting the state `data` array
and `activeStateKey` ignore the earthquake row entirely.
