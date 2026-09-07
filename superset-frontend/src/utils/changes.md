# Image Download Changes

## Malaysia 3D Map export

- Fixed the Malaysia 3D Map appearing blank when downloading a dashboard as a
  JPEG image.
- Enabled MapLibre's `preserveDrawingBuffer` WebGL context option so
  `downloadAsImage.tsx` can copy the rendered map canvas into the exported
  image.
- Prevented the image exporter's scrollable-content expansion from replacing
  MapLibre and deck.gl renderer dimensions with `height: auto`.
- Snapshot map canvases as static PNG image elements before
  `dom-to-image-more` serializes the cloned dashboard, preventing WebGL pixels
  from being lost during the library's internal clone operation.
- Added an image-export handshake that requests a fresh MapLibre render and
  waits for browser compositing before snapshotting its WebGL canvas.
- Capture the PNG synchronously inside MapLibre's `render` event and pass that
  exact frame to the dashboard exporter, avoiding a WebGL framebuffer race.
- Enable `preserveDrawingBuffer` using both the legacy top-level MapLibre option
  and the newer `canvasContextAttributes` option for runtime-version
  compatibility.
- Build the custom 3D map ESM output before starting either frontend development
  command so Webpack cannot bundle stale generated plugin code.
- The change was made in
  `superset-frontend/plugins/superset-plugin-chart-3d-map/src/SupersetPluginChart3DMap.tsx`.

## Validation

- The 3D map plugin TypeScript build passed.
- All 17 tests in the 3D map plugin passed.
- `git diff --check` passed.
- Live browser verification was not performed because the local Superset server
  was not running.

## Production map and table loading

- Allowed `tiles.openfreemap.org` and the AWS terrain tile host in Superset's
  production and development Content Security Policy `connect-src` directives.
- Registered AG Grid's event and row-selection modules globally before grids
  are created.
- Replaced the row-number column's string expression with a typed value-getter
  function so it works without weakening production CSP with `unsafe-eval`.
