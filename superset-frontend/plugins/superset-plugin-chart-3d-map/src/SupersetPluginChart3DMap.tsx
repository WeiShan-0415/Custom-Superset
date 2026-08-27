/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
// This plugin package's own babel build (@airbnb/config-babel) compiles
// JSX to the classic `React.createElement` runtime, which needs `React` in
// scope at runtime. Calling the hooks as `React.useX` (instead of
// destructuring them) keeps the import genuinely used, matching the same
// workaround in SupersetPluginChartCustomDistrictMap.tsx.
// eslint-disable-next-line no-restricted-syntax
import React from 'react';
import type { FeatureCollection, Point } from 'geojson';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { styled } from '@apache-superset/core/theme';
import {
  AllDistrictsFeatureCollection,
  loadAllDistricts,
} from './geo/loadDistricts';
import { MALAYSIA_PAN_BOUNDS } from './geo/bounds';
import { computeStateCentroids } from './geo/centroids';
import {
  SupersetPluginChart3DMapProps,
  SupersetPluginChart3DMapStylesProps,
} from './types';

const Styles = styled.div<SupersetPluginChart3DMapStylesProps>`
  position: relative;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: hidden;

  .maplibregl-popup-content {
    color: #1f2937;
  }
`;

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const MALAYSIA_CENTER: [number, number] = [109.5, 3.5];
// AWS's public "Terrarium" elevation tiles (s3://elevation-tiles-prod,
// part of the AWS Open Data program): free, keyless, no signup — chosen
// over Mapbox/MapTiler terrain-rgb sources for the same "no token needed"
// reason as the OpenFreeMap base style. OpenStreetMap itself is vector-only
// (roads, buildings, boundaries) and has no elevation data of its own.
const TERRAIN_DEM_URL =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const TERRAIN_EXAGGERATION = 1.5;

const SEVERITY_NONE_COLOR = '#2ca25f';
const SEVERITY_MODERATE_COLOR = '#f4c430';
const SEVERITY_HIGH_COLOR = '#e63946';
const FILTERED_OUT_STATE_COLOR = 'rgba(0, 0, 0, 0)';
const DISTRICT_BORDER_COLOR = '#ffffff';
const EARTHQUAKE_SOURCE_ID = 'earthquakes';
const EARTHQUAKE_LAYER_ID = 'earthquake-points';

// Pitch is purely a function of the current zoom level (not of which state
// is "active"), so it stays correct whether the camera got there via a
// filter-driven fitBounds or the user's own scroll/pinch zoom: zoomed out
// always reads flat/2D, while zooming in tilts the view to reveal terrain.
const MIN_PITCH_ZOOM = 8;
const MAX_PITCH_ZOOM = 14;
const MAX_PITCH = 60;
const FILTERED_STATE_ZOOM = 7.5;

type ImageExportContainer = HTMLDivElement & {
  _prepareForImageExport?: () => Promise<void>;
};
type ImageExportCanvas = HTMLCanvasElement & {
  _imageExportSnapshot?: string;
};
type CompatibleMapOptions = maplibregl.MapOptions & {
  // MapLibre releases before canvasContextAttributes used this top-level key.
  preserveDrawingBuffer: boolean;
};

function pitchForZoom(zoom: number): number {
  if (zoom <= MIN_PITCH_ZOOM) return 0;
  if (zoom >= MAX_PITCH_ZOOM) return MAX_PITCH;
  const t = (zoom - MIN_PITCH_ZOOM) / (MAX_PITCH_ZOOM - MIN_PITCH_ZOOM);
  return MAX_PITCH * t;
}

function formatEventTime(value: unknown): string {
  const rawValue = String(value ?? '');
  if (!/^\d+$/.test(rawValue)) return rawValue;
  const timestamp = Number(rawValue);
  if (!Number.isFinite(timestamp)) return rawValue;
  // Superset commonly serializes temporal values as Unix milliseconds. Also
  // accept Unix seconds for datasets that expose epoch values directly.
  const date = new Date(
    timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp,
  );
  if (Number.isNaN(date.getTime())) return rawValue;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(
    date.getMonth() + 1,
  )}/${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;
}

function buildFillColorExpression(
  data: SupersetPluginChart3DMapProps['data'],
): unknown[] {
  const colorsByState = new Map<string, string>();
  data.forEach(item => {
    if (!item.state_key) return;
    const color =
      item.metric === 2
        ? SEVERITY_HIGH_COLOR
        : item.metric === 1
          ? SEVERITY_MODERATE_COLOR
          : SEVERITY_NONE_COLOR;
    colorsByState.set(item.state_key, color);
  });

  return [
    'match',
    ['get', 'stateKey'],
    ...Array.from(colorsByState.entries()).flat(),
    FILTERED_OUT_STATE_COLOR,
  ];
}

export default function SupersetPluginChart3DMap(
  props: SupersetPluginChart3DMapProps,
) {
  const {
    data,
    earthquakes,
    height,
    width,
    activeStateKey,
    showDistrictBorders,
  } = props;

  const rootElem = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const layersReadyRef = React.useRef(false);

  // Native Superset filters drive the active state through transformed query
  // data. Map interaction itself does not emit or clear dashboard filters.
  const selectedStateKey = activeStateKey;

  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [districtsFC, setDistrictsFC] =
    React.useState<AllDistrictsFeatureCollection | null>(null);
  const [stateCentroids, setStateCentroids] = React.useState<Record<
    string,
    [number, number]
  > | null>(null);

  // Create the map once per mount.
  React.useEffect(() => {
    const container = rootElem.current;
    if (!container) return undefined;
    const mapOptions: CompatibleMapOptions = {
      container,
      style: MAP_STYLE_URL,
      center: MALAYSIA_CENTER,
      zoom: 5.5,
      pitch: 0,
      bearing: 0,
      // Dashboard image export copies the rendered WebGL canvas. Keep its
      // pixels available after compositing so the map is present in the JPEG.
      preserveDrawingBuffer: true,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    };
    const map = new maplibregl.Map(mapOptions);
    const exportContainer = container as ImageExportContainer;
    exportContainer.dataset.imageExportRenderer = 'maplibre';
    exportContainer._prepareForImageExport = () =>
      new Promise<void>(resolve => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const finish = () => {
          clearTimeout(timeoutId);
          map.off('render', finish);
          const canvas = map.getCanvas() as ImageExportCanvas;
          try {
            // Read the framebuffer synchronously during MapLibre's render
            // event. Waiting until a later animation frame can allow WebGL to
            // present or clear it before the dashboard exporter reads it.
            canvas._imageExportSnapshot = canvas.toDataURL('image/png');
          } catch {
            delete canvas._imageExportSnapshot;
          } finally {
            resolve();
          }
        };
        timeoutId = setTimeout(finish, 1000);
        map.once('render', finish);
        map.triggerRepaint();
      });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));
    map.addControl(new maplibregl.ScaleControl());
    // Default mouse-wheel zoom rate (1/450 per line) feels sluggish at
    // country scale; double it so each scroll tick moves further.
    map.scrollZoom.setWheelZoomRate(1 / 56.25);
    map.addControl(
      new maplibregl.TerrainControl({
        source: 'terrain-dem',
        exaggeration: TERRAIN_EXAGGERATION,
      }),
    );
    map.on('load', () => setMapLoaded(true));
    // Updating pitch during every `zoom` frame interrupts MapLibre camera
    // animations. Wait until navigation finishes so flyTo reaches its target.
    map.on('zoomend', () => map.setPitch(pitchForZoom(map.getZoom())));
    mapRef.current = map;
    return () => {
      delete exportContainer._prepareForImageExport;
      map.remove();
      mapRef.current = null;
      layersReadyRef.current = false;
      setMapLoaded(false);
    };
  }, []);

  // Load the (static, module-cached) Malaysia district geodata once.
  React.useEffect(() => {
    let cancelled = false;
    loadAllDistricts().then(fc => {
      if (cancelled) return;
      setDistrictsFC(fc);
      try {
        setStateCentroids(computeStateCentroids(fc));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to compute state centroids', error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Wire up sources/layers/click handling once the map and geodata are
  // both ready. Guarded by layersReadyRef so this only ever runs once per
  // map instance.
  React.useEffect(() => {
    const map = mapRef.current;
    // Synchronizing with the external MapLibre instance, not an avoidable
    // event-handler-in-effect: layers/sources can only be added once the
    // map's 'load' event and the async geodata fetch have both resolved.
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler
    if (!map || !mapLoaded || !districtsFC) {
      return;
    }
    if (layersReadyRef.current) return;
    layersReadyRef.current = true;

    map.addSource('terrain-dem', {
      type: 'raster-dem',
      tiles: [TERRAIN_DEM_URL],
      tileSize: 256,
      encoding: 'terrarium',
      maxzoom: 15,
    });
    // Terrain starts off; the map's own TerrainControl button (added at
    // init) turns it on. `map` fires a 'terrain' event whenever it's
    // toggled — either that way or programmatically — which is used below
    // to keep the hillshade layer's visibility in sync, so shading doesn't
    // linger once terrain itself is switched off.
    map.on('terrain', () => {
      map.setLayoutProperty(
        'hillshade',
        'visibility',
        map.getTerrain() ? 'visible' : 'none',
      );
    });
    // Shaded relief, inserted directly beneath the base style's own water
    // layer specifically — not the style's very first layer, which is an
    // opaque full-viewport `background` fill that would hide hillshade
    // everywhere (land included) if put below it. This way water (drawn
    // after/above) covers the shading over the sea, while land has nothing
    // opaque between it and hillshade, so relief still shows through.
    const styleLayers = map.getStyle().layers ?? [];
    const waterLayer = styleLayers.find(
      layer => 'source-layer' in layer && layer['source-layer'] === 'water',
    );
    map.addLayer(
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain-dem',
        layout: { visibility: 'none' },
        paint: { 'hillshade-exaggeration': 0.5 },
      },
      waterLayer?.id ?? styleLayers[0]?.id,
    );

    map.addSource('districts', { type: 'geojson', data: districtsFC });
    map.addLayer({
      id: 'districts-fill',
      type: 'fill',
      source: 'districts',
      paint: { 'fill-color': SEVERITY_NONE_COLOR, 'fill-opacity': 0.6 },
    });
    map.addLayer({
      id: 'districts-line',
      type: 'line',
      source: 'districts',
      layout: { visibility: 'none' },
      paint: { 'line-color': DISTRICT_BORDER_COLOR, 'line-width': 0.5 },
    });

    map.addSource(EARTHQUAKE_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: EARTHQUAKE_LAYER_ID,
      type: 'circle',
      source: EARTHQUAKE_SOURCE_ID,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'magnitude'], 0],
          0,
          4,
          4,
          7,
          6,
          13,
          8,
          22,
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'magnitude'], 0],
          0,
          '#f4c430',
          5,
          '#f97316',
          7,
          '#e63946',
        ],
        'circle-opacity': 0.85,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    });

    map.on('mouseenter', EARTHQUAKE_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', EARTHQUAKE_LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('click', EARTHQUAKE_LAYER_ID, event => {
      const feature = event.features?.[0];
      const geometry = feature?.geometry;
      if (!feature || geometry?.type !== 'Point') return;
      const properties = feature.properties ?? {};
      const content = document.createElement('div');
      const heading = document.createElement('strong');
      heading.textContent = String(properties.title || 'Earthquake');
      content.appendChild(heading);
      [
        ['Location', properties.location],
        ['Magnitude', properties.magnitude],
        ['Depth', properties.depth != null ? `${properties.depth} km` : null],
        ['Time', formatEventTime(properties.eventTime)],
      ].forEach(([label, value]) => {
        if (value === null || value === undefined || value === '') return;
        const line = document.createElement('div');
        line.textContent = `${label}: ${value}`;
        content.appendChild(line);
      });
      new maplibregl.Popup()
        .setLngLat((geometry as Point).coordinates as [number, number])
        .setDOMContent(content)
        .addTo(map);
    });

    // Keep 3D buildings disabled, including any extrusion layers supplied
    // by the base map style. Terrain remains available independently.
    map
      .getStyle()
      .layers?.filter(layer => layer.type === 'fill-extrusion')
      .forEach(layer => map.setLayoutProperty(layer.id, 'visibility', 'none'));
  }, [mapLoaded, districtsFC]);

  // Fill color / district border visibility react to prop changes on an
  // already-built map.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current || !map.getLayer('districts-fill')) {
      return;
    }
    map.setPaintProperty(
      'districts-fill',
      'fill-color',
      buildFillColorExpression(data),
    );
    map.setPaintProperty('districts-fill', 'fill-opacity', 0.6);
    map.setLayoutProperty(
      'districts-fill',
      'visibility',
      data.length > 0 ? 'visible' : 'none',
    );
    map.setLayoutProperty(
      'districts-line',
      'visibility',
      showDistrictBorders ? 'visible' : 'none',
    );
  }, [data, showDistrictBorders, mapLoaded, districtsFC]);

  React.useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(
      EARTHQUAKE_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | null;
    if (!source) return;
    const featureCollection: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: earthquakes.map(earthquake => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [earthquake.longitude, earthquake.latitude],
        },
        properties: {
          magnitude: earthquake.magnitude,
          depth: earthquake.depth,
          location: earthquake.location,
          eventTime: earthquake.eventTime,
          title: earthquake.title,
        },
      })),
    };
    source.setData(featureCollection);
  }, [earthquakes, mapLoaded, districtsFC]);

  // Fly/zoom the camera to the active state (or back out to the whole
  // country). The `zoomend` listener above derives pitch after the camera
  // animation completes, so flying in tilts and flying out flattens without
  // interrupting either animation.
  React.useEffect(() => {
    const map = mapRef.current;
    // Synchronizing the camera with the external MapLibre instance in
    // response to a prop change, not an avoidable event-handler-in-effect.
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler
    if (!map || !mapLoaded || !stateCentroids) return;
    try {
      if (selectedStateKey && stateCentroids[selectedStateKey]) {
        map.flyTo({
          center: stateCentroids[selectedStateKey],
          zoom: FILTERED_STATE_ZOOM,
          bearing: 0,
          duration: 1200,
        });
      } else {
        map.fitBounds(MALAYSIA_PAN_BOUNDS, {
          bearing: 0,
          duration: 800,
        });
      }
    } catch (error) {
      // A bad bounds/option value (out-of-range maxZoom, degenerate bbox,
      // etc.) would otherwise fail this silently — the camera just never
      // moves, with no visible indication why.
      // eslint-disable-next-line no-console
      console.error('Failed to fly to state', selectedStateKey, error);
    }
  }, [selectedStateKey, mapLoaded, stateCentroids]);

  return <Styles ref={rootElem} height={height} width={width} />;
}
