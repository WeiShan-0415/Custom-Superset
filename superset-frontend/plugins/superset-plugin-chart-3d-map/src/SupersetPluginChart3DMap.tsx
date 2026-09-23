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
import type { FeatureCollection, Point, Polygon } from 'geojson';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { styled } from '@apache-superset/core/theme';
import { Button, Icons, Switch } from '@superset-ui/core/components';
import {
  AllDistrictsFeatureCollection,
  loadAllDistricts,
} from './geo/loadDistricts';
import { MALAYSIA_PAN_BOUNDS } from './geo/bounds';
import { computeStateCentroids } from './geo/centroids';
import {
  calculateShakingRadii,
  createShakingZone,
  ShakingZoneProperties,
} from './geo/shakingZones';
import {
  SupersetPluginChart3DMapProps,
  SupersetPluginChart3DMapStylesProps,
} from './types';

// The fixed light cartographic palette keeps map controls and hazard semantics
// legible independently of the surrounding dashboard theme.
// eslint-disable-next-line theme-colors/no-literal-colors
const Styles = styled.div<SupersetPluginChart3DMapStylesProps>`
  position: relative;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: hidden;
  color: #0f1f4d;
  background: #f4f8ff;
  border-radius: ${({ theme }) => theme.borderRadiusLG * 2}px;

  .hazard-map-header {
    position: absolute;
    top: ${({ theme }) => theme.sizeUnit * 3}px;
    right: ${({ theme }) => theme.sizeUnit * 3}px;
    left: ${({ theme }) => theme.sizeUnit * 3}px;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60px;
    padding: 0 210px 0 ${({ theme }) => theme.sizeUnit * 4}px;
    background: rgb(255 255 255 / 92%);
    backdrop-filter: blur(12px);
    border: 1px solid rgb(83 132 204 / 18%);
    border-radius: 20px;
    box-shadow: 0 4px 14px rgb(35 85 155 / 10%);
  }

  .hazard-map-tabs {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
    padding: ${({ theme }) => theme.sizeUnit * 1.5}px;
    background: #f4f8ff / 50%;
    border: 1px solid rgb(83 132 204 / 10%);
    border-radius: 999px;
  }

  .hazard-map-last-updated {
    position: absolute;
    top: 50%;
    right: ${({ theme }) => theme.sizeUnit * 4}px;
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
    transform: translateY(-50%);
    color: #52658f;
    white-space: nowrap;
  }

  .hazard-map-last-updated-icon {
    display: flex;
    color: #5777b8;
  }

  .hazard-map-last-updated-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .hazard-map-last-updated-label {
    font-size: 11px;
    font-weight: ${({ theme }) => theme.fontWeightNormal};
    line-height: 1;
  }

  .hazard-map-last-updated-value {
    color: #0f1f4d;
    font-size: 12px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    line-height: 1;
  }

  .hazard-map-view-toggle {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
    padding: ${({ theme }) => theme.sizeUnit * 1.5}px
      ${({ theme }) => theme.sizeUnit * 3}px;
    color: #0f1f4d;
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    cursor: pointer;
    border-radius: 999px;
    transition: background-color 150ms ease;

    &:hover {
      background: rgb(255 255 255 / 60%);
    }
  }

  .hazard-map-body {
    position: absolute;
    inset: 0;
  }

  .hazard-map-map {
    position: absolute;
    inset: 0;
  }

  .hazard-map-canvas {
    position: absolute;
    inset: 0;
  }

  .hazard-map-sidebar {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .hazard-map-panel {
    box-sizing: border-box;
    padding: ${({ theme }) => theme.sizeUnit * 4}px;
    background: rgb(255 255 255 / 50%);
    border: 1px solid rgb(83 132 204 / 18%);
    border-radius: 16px;
    box-shadow: 0 12px 32px rgb(35 85 155 / 16%);
    pointer-events: auto;
  }

  .hazard-map-layers {
    position: absolute;
    top: 84px;
    right: ${({ theme }) => theme.sizeUnit * 3}px;
    display: ${({ width }) => (width >= 520 ? 'block' : 'none')};
    width: ${({ width }) => (width >= 720 ? '250px' : '220px')};
    background: rgb(255 255 255 / 50%);
  }

  .hazard-map-layers-heading,
  .hazard-map-severity-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
  }

  .hazard-map-layers-heading .hazard-map-panel-title,
  .hazard-map-severity-heading .hazard-map-panel-title {
    margin-bottom: 0;
  }

  .hazard-map-layers-content,
  .hazard-map-severity-content {
    margin-top: ${({ theme }) => theme.sizeUnit * 3}px;
  }

  .hazard-map-legends {
    position: absolute;
    bottom: ${({ theme }) => theme.sizeUnit * 6}px;
    left: ${({ theme }) => theme.sizeUnit * 3}px;
    display: ${({ width }) => (width >= 720 ? 'flex' : 'none')};
    align-items: stretch;
    gap: ${({ theme }) => theme.sizeUnit * 3}px;
  }

  .hazard-map-severity-panel {
    min-width: 190px;
  }

  .hazard-map-severity-panel-minimized {
    align-self: flex-end;
  }

  .hazard-map-earthquake-panel {
    min-width: 218px;
  }

  .hazard-map-panel-title {
    margin-bottom: ${({ theme }) => theme.sizeUnit * 3}px;
    color: #52658f;
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .hazard-map-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 34px;
    color: #0f1f4d;
    white-space: nowrap;
  }

  .hazard-map-option-label {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 3}px;
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
  }

  .hazard-map-option .ant-switch-checked,
  .hazard-map-view-toggle .ant-switch-checked {
    background: #2478f2;
  }

  .hazard-map-icon {
    width: 20px;
    text-align: center;
    font-size: 18px;
    opacity: 0.8;
  }

  .hazard-map-severity-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.sizeUnit * 2.5}px
      ${({ theme }) => theme.sizeUnit * 4}px;
  }

  .hazard-map-earthquake-panel .hazard-map-severity-grid {
    grid-template-columns: 1fr;
  }

  .hazard-map-legend-row {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 2.5}px;
    color: #0f1f4d;
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    white-space: nowrap;
  }

  .hazard-map-swatch {
    width: 14px;
    height: 14px;
    flex: 0 0 14px;
    border: 1px solid rgb(255 255 255 / 85%);
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(15 31 77 / 12%);
  }

  .hazard-map-empty {
    position: absolute;
    top: 84px;
    right: ${({ theme }) => theme.sizeUnit * 3}px;
    display: ${({ width }) => (width >= 520 ? 'block' : 'none')};
    width: ${({ width }) => (width >= 720 ? '250px' : '220px')};
    color: #52658f;
    line-height: 1.4;
  }

  .hazard-map-status {
    position: absolute;
    right: ${({ theme }) => theme.sizeUnit * 2}px;
    bottom: ${({ theme }) => theme.sizeUnit * 2}px;
    z-index: 2;
    padding: ${({ theme }) => theme.sizeUnit}px
      ${({ theme }) => theme.sizeUnit * 2}px;
    color: #1f2937;
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    background: rgb(255 255 255 / 88%);
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 3px rgb(15 23 42 / 16%);
    border-radius: ${({ theme }) => theme.borderRadius}px;
  }

  .maplibregl-popup-content {
    color: #1f2937;
  }

  .maplibregl-ctrl-top-right {
    top: ${({ width }) => (width >= 520 ? '326px' : '76px')};
    right: ${({ theme }) => theme.sizeUnit * 2}px;
  }

  &.hazard-map-layers-minimized .maplibregl-ctrl-top-right {
    top: ${({ width }) => (width >= 520 ? '146px' : '76px')};
  }

  .maplibregl-ctrl-bottom-left {
    bottom: ${({ width }) => (width >= 720 ? '146px' : '8px')};
    left: ${({ theme }) => theme.sizeUnit * 2}px;
  }

  @media (max-width: 520px) {
    .hazard-map-header {
      right: ${({ theme }) => theme.sizeUnit * 2}px;
      left: ${({ theme }) => theme.sizeUnit * 2}px;
      min-height: 52px;
      padding: ${({ theme }) => theme.sizeUnit * 3}px 156px 0
        ${({ theme }) => theme.sizeUnit * 2}px;
      border-radius: 16px;
      background: rgb(255 255 255 / 50%);
    }

    .hazard-map-tabs {
      width: 100%;
      justify-content: space-between;
      gap: 0;
      padding: ${({ theme }) => theme.sizeUnit}px;
    }

    .hazard-map-last-updated {
      right: ${({ theme }) => theme.sizeUnit * 2}px;
      gap: ${({ theme }) => theme.sizeUnit}px;
    }

    .hazard-map-last-updated-label {
      font-size: 9px;
    }

    .hazard-map-last-updated-value {
      font-size: 10px;
    }

    .hazard-map-view-toggle {
      flex-direction: column;
      gap: 2px;
      padding: ${({ theme }) => theme.sizeUnit}px;
      font-size: 11px;
    }
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
const SEVERITY_WARNING_COLOR = '#f97316';
const SEVERITY_HIGH_COLOR = '#e63946';
// Hazard colors must retain their fixed semantic meaning across themes.
// eslint-disable-next-line theme-colors/no-literal-colors
const EARTHQUAKE_STRONG_COLOR = '#e63946';
const DEFAULT_STATE_COLOR = SEVERITY_NONE_COLOR;
const DISTRICT_BORDER_COLOR = '#ffffff';
const DISTRICT_FILL_OPACITY = 0.5;
const EARTHQUAKE_SOURCE_ID = 'earthquakes';
const EARTHQUAKE_LAYER_ID = 'earthquake-points';
const EARTHQUAKE_ZONE_SOURCE_ID = 'earthquake-shaking-zones';
const EARTHQUAKE_ZONE_LEVELS = [
  { level: 'light', label: 'Light shaking', color: SEVERITY_MODERATE_COLOR },
  { level: 'medium', label: 'Medium shaking', color: SEVERITY_WARNING_COLOR },
  { level: 'strong', label: 'Strong shaking', color: EARTHQUAKE_STRONG_COLOR },
] as const;

type HazardKey =
  | 'strongWinds'
  | 'thunderstorm'
  | 'landslide'
  | 'flood'
  | 'earthquake';
type ViewKey = 'warnings' | 'sensors' | 'forecast';

type Hazard = {
  key: HazardKey;
  label: string;
  icon: string;
  eventTypes: readonly string[];
  titleIncludes?: readonly string[];
};

const HAZARDS: ReadonlyArray<Hazard> = [
  {
    key: 'strongWinds',
    label: 'Strong Winds',
    icon: '💨',
    eventTypes: [],
    titleIncludes: ['strong winds and rough seas'],
  },
  {
    key: 'thunderstorm',
    label: 'Thunderstorm',
    icon: '⚡',
    eventTypes: [],
    titleIncludes: ['thunderstorm'],
  },
  {
    key: 'landslide',
    label: 'Landslide',
    icon: '⛰',
    eventTypes: [],
    titleIncludes: ['landslide'],
  },
  {
    key: 'flood',
    label: 'Flood',
    icon: '≋',
    eventTypes: [],
    titleIncludes: ['flood'],
  },
  { key: 'earthquake', label: 'Earthquake', icon: '◉', eventTypes: [] },
];

const SEVERITIES = [
  ['#2ca25f', 'Advisory'],
  ['#f4c430', 'Watch'],
  ['#f97316', 'Warning'],
  ['#e63946', 'Severe'],
] as const;

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

function parseEventTime(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const rawValue = String(value).trim();
  const numericValue = Number(rawValue);
  const date = /^\d+$/.test(rawValue)
    ? new Date(
        numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue,
      )
    : new Date(rawValue);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function getEventDateKey(value: string | undefined): string | undefined {
  const date = parseEventTime(value);
  if (!date) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatLastUpdated(date: Date): string {
  const formattedDate = new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(/\b(am|pm)\b/, period => period.toUpperCase());
  return `${formattedDate} (MYT)`;
}

function matchesHazard(
  item: SupersetPluginChart3DMapProps['data'][number],
  hazard: Hazard,
): boolean {
  return (
    hazard.key !== 'earthquake' &&
    (hazard.eventTypes.includes(item.eventType) ||
      Boolean(hazard.titleIncludes?.some(title => item.title?.includes(title))))
  );
}

function buildFillColorExpression(
  data: SupersetPluginChart3DMapProps['data'],
): unknown[] {
  const severityByState = new Map<string, number>();
  data.forEach(item => {
    if (!item.state_key) return;
    severityByState.set(
      item.state_key,
      Math.max(severityByState.get(item.state_key) ?? 0, item.metric ?? 0),
    );
  });

  const colorsByState = Array.from(severityByState, ([stateKey, severity]) => [
    stateKey,
    severity >= 3
      ? SEVERITY_HIGH_COLOR
      : severity >= 2
        ? SEVERITY_WARNING_COLOR
        : severity >= 1
          ? SEVERITY_MODERATE_COLOR
          : SEVERITY_NONE_COLOR,
  ]);

  return [
    'match',
    ['get', 'stateKey'],
    ...colorsByState.flat(),
    DEFAULT_STATE_COLOR,
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
  const [enabledViews, setEnabledViews] = React.useState<
    Record<ViewKey, boolean>
  >({
    warnings: true,
    sensors: true,
    forecast: false,
  });
  const [enabledHazards, setEnabledHazards] = React.useState<
    Record<HazardKey, boolean>
  >({
    strongWinds: true,
    thunderstorm: true,
    landslide: true,
    flood: true,
    earthquake: true,
  });
  const [areHazardLayersMinimized, setAreHazardLayersMinimized] =
    React.useState(false);
  const [isWarningLevelMinimized, setIsWarningLevelMinimized] =
    React.useState(false);

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

  const latestWarningDate = React.useMemo(() => {
    const eventDates = data
      .map(item => getEventDateKey(item.eventTime))
      .filter((date): date is string => Boolean(date));
    return eventDates.sort()[eventDates.length - 1];
  }, [data]);

  const latestDatasetEventTime = React.useMemo(() => {
    const eventTimes = [...data, ...earthquakes]
      .map(item => parseEventTime(item.eventTime))
      .filter((date): date is Date => Boolean(date));
    if (eventTimes.length === 0) return undefined;
    return new Date(Math.max(...eventTimes.map(date => date.getTime())));
  }, [data, earthquakes]);

  const currentWarningData = React.useMemo(
    () =>
      data.filter(
        item =>
          !latestWarningDate ||
          getEventDateKey(item.eventTime) === latestWarningDate,
      ),
    [data, latestWarningDate],
  );

  const availableHazards = React.useMemo(
    () =>
      HAZARDS.filter(hazard =>
        hazard.key === 'earthquake'
          ? earthquakes.length > 0
          : currentWarningData.some(item => matchesHazard(item, hazard)),
      ),
    [currentWarningData, earthquakes.length],
  );

  const visibleData = React.useMemo(
    () =>
      currentWarningData.filter(item =>
        HAZARDS.some(
          hazard => enabledHazards[hazard.key] && matchesHazard(item, hazard),
        ),
      ),
    [currentWarningData, enabledHazards],
  );

  // const latestEventTime = React.useMemo(() => {
  //   const latestTime = data.reduce<string | undefined>((latest, item) => {
  //     if (item.eventType !== 'weather_warning' || !item.eventTime) {
  //       return latest;
  //     }
  //     return !latest || item.eventTime > latest ? item.eventTime : latest;
  //   }, undefined);
  //   return latestTime ? formatEventTime(latestTime) : 'Live data';
  // }, [data]);

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
        const timeout: { id?: ReturnType<typeof setTimeout> } = {};
        const finish = () => {
          if (timeout.id) clearTimeout(timeout.id);
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
        timeout.id = setTimeout(finish, 1000);
        map.once('render', finish);
        map.triggerRepaint();
      });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));
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
    // `map` fires a 'terrain' event whenever terrain is toggled — either
    // through the map's TerrainControl or programmatically — which keeps the
    // hillshade layer's visibility in sync.
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
        layout: { visibility: 'visible' },
        paint: { 'hillshade-exaggeration': 0.5 },
      },
      waterLayer?.id ?? styleLayers[0]?.id,
    );
    map.setTerrain({
      source: 'terrain-dem',
      exaggeration: TERRAIN_EXAGGERATION,
    });

    map.addSource('districts', { type: 'geojson', data: districtsFC });
    map.addLayer({
      id: 'districts-fill',
      type: 'fill',
      source: 'districts',
      paint: {
        'fill-color': SEVERITY_NONE_COLOR,
        'fill-opacity': DISTRICT_FILL_OPACITY,
      },
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
    map.addSource(EARTHQUAKE_ZONE_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    EARTHQUAKE_ZONE_LEVELS.forEach(({ level, color }) => {
      map.addLayer({
        id: `earthquake-zone-${level}`,
        type: 'fill',
        source: EARTHQUAKE_ZONE_SOURCE_ID,
        filter: ['==', ['get', 'level'], level],
        paint: {
          'fill-color': color,
          'fill-opacity':
            level === 'strong' ? 0.38 : level === 'medium' ? 0.27 : 0.18,
        },
      });
    });
    EARTHQUAKE_ZONE_LEVELS.forEach(({ level, color }) => {
      map.addLayer({
        id: `earthquake-zone-${level}-outline`,
        type: 'line',
        source: EARTHQUAKE_ZONE_SOURCE_ID,
        filter: ['==', ['get', 'level'], level],
        paint: {
          'line-color': color,
          'line-width': level === 'strong' ? 1.75 : 1.25,
          'line-opacity': level === 'light' ? 0.62 : 0.82,
          'line-blur': 0.2,
        },
      });
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
          3,
          4,
          4.5,
          6,
          7,
          8,
          11,
        ],
        'circle-color': EARTHQUAKE_STRONG_COLOR,
        'circle-opacity': 0.9,
        'circle-stroke-color': DISTRICT_BORDER_COLOR,
        'circle-stroke-width': 1.25,
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
        [
          'Strong shaking radius',
          properties.strongRadiusKm != null
            ? `${Math.round(properties.strongRadiusKm)} km`
            : null,
        ],
        [
          'Medium shaking radius',
          properties.mediumRadiusKm != null
            ? `${Math.round(properties.mediumRadiusKm)} km`
            : null,
        ],
        [
          'Light shaking radius',
          properties.lightRadiusKm != null
            ? `${Math.round(properties.lightRadiusKm)} km`
            : null,
        ],
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

    // The base style supplies building extrusions at close zoom levels.
    // Explicit visibility keeps them available alongside terrain.
    map
      .getStyle()
      .layers?.filter(layer => layer.type === 'fill-extrusion')
      .forEach(layer =>
        map.setLayoutProperty(layer.id, 'visibility', 'visible'),
      );
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
      visibleData.length > 0
        ? buildFillColorExpression(visibleData)
        : DEFAULT_STATE_COLOR,
    );
    map.setPaintProperty(
      'districts-fill',
      'fill-opacity',
      DISTRICT_FILL_OPACITY,
    );
    map.setLayoutProperty(
      'districts-fill',
      'visibility',
      enabledViews.warnings ? 'visible' : 'none',
    );
    map.setLayoutProperty(
      'districts-line',
      'visibility',
      showDistrictBorders ? 'visible' : 'none',
    );
  }, [
    visibleData,
    enabledViews.warnings,
    showDistrictBorders,
    mapLoaded,
    districtsFC,
  ]);

  // The GeoJSON is sent to an external MapLibre source, not to a React parent.
  /* eslint-disable react-you-might-not-need-an-effect/no-pass-data-to-parent */
  /* eslint-disable react-you-might-not-need-an-effect/no-pass-live-state-to-parent */
  React.useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(
      EARTHQUAKE_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | null;
    const zoneSource = map?.getSource(
      EARTHQUAKE_ZONE_SOURCE_ID,
    ) as maplibregl.GeoJSONSource | null;
    if (!source || !zoneSource) return;
    const visibleEarthquakes =
      enabledHazards.earthquake && enabledViews.warnings ? earthquakes : [];
    const radii = visibleEarthquakes.map(earthquake =>
      calculateShakingRadii(earthquake.magnitude, earthquake.depth),
    );
    const featureCollection: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: visibleEarthquakes.map((earthquake, index) => ({
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
          strongRadiusKm: radii[index].strong,
          mediumRadiusKm: radii[index].medium,
          lightRadiusKm: radii[index].light,
        },
      })),
    };
    const zoneFeatureCollection: FeatureCollection<
      Polygon,
      ShakingZoneProperties
    > = {
      type: 'FeatureCollection',
      features: EARTHQUAKE_ZONE_LEVELS.flatMap(({ level }) =>
        visibleEarthquakes.map((earthquake, index) => {
          const innerRadiusKm =
            level === 'light'
              ? radii[index].medium
              : level === 'medium'
                ? radii[index].strong
                : undefined;
          return createShakingZone(
            earthquake.longitude,
            earthquake.latitude,
            radii[index][level],
            level,
            innerRadiusKm,
          );
        }),
      ),
    };
    zoneSource.setData(zoneFeatureCollection);
    source.setData(featureCollection);
  }, [
    earthquakes,
    enabledHazards.earthquake,
    enabledViews.warnings,
    mapLoaded,
    districtsFC,
  ]);
  /* eslint-enable react-you-might-not-need-an-effect/no-pass-data-to-parent */
  /* eslint-enable react-you-might-not-need-an-effect/no-pass-live-state-to-parent */

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

  const toggleHazard = (key: HazardKey) => {
    setEnabledHazards(previous => ({ ...previous, [key]: !previous[key] }));
  };

  const toggleView = (key: ViewKey, checked: boolean) => {
    setEnabledViews(previous => ({ ...previous, [key]: checked }));
  };

  return (
    <Styles
      className={
        areHazardLayersMinimized ? 'hazard-map-layers-minimized' : undefined
      }
      height={height}
      width={width}
    >
      <header className="hazard-map-header">
        <nav className="hazard-map-tabs" aria-label="Map view">
          {(['warnings', 'sensors', 'forecast'] as const).map(view => (
            <label className="hazard-map-view-toggle" key={view}>
              <Switch
                checked={enabledViews[view]}
                size="small"
                onChange={checked => toggleView(view, checked)}
              />
              {view[0].toUpperCase() + view.slice(1)}
            </label>
          ))}
        </nav>
        {latestDatasetEventTime && (
          <div className="hazard-map-last-updated">
            <span className="hazard-map-last-updated-icon" aria-hidden="true">
              <Icons.ClockCircleOutlined iconSize="m" />
            </span>
            <div className="hazard-map-last-updated-copy">
              <span className="hazard-map-last-updated-label">
                Last updated
              </span>
              <time
                className="hazard-map-last-updated-value"
                dateTime={latestDatasetEventTime.toISOString()}
              >
                {formatLastUpdated(latestDatasetEventTime)}
              </time>
            </div>
          </div>
        )}
      </header>
      <div className="hazard-map-body">
        <div className="hazard-map-map">
          <div ref={rootElem} className="hazard-map-canvas" />
          {/* <div className="hazard-map-status">Data as of {latestEventTime}</div> */}
        </div>
        <aside
          className="hazard-map-sidebar"
          aria-label="Map legend and filters"
        >
          {enabledViews.warnings ? (
            <>
              <section
                className="hazard-map-panel hazard-map-layers"
                aria-label="Hazard filters"
              >
                <div className="hazard-map-layers-heading">
                  <div className="hazard-map-panel-title">Hazard Layers</div>
                  <Button
                    aria-expanded={!areHazardLayersMinimized}
                    aria-label={
                      areHazardLayersMinimized
                        ? 'Expand hazard layers'
                        : 'Minimize hazard layers'
                    }
                    buttonSize="xsmall"
                    buttonStyle="link"
                    icon={
                      areHazardLayersMinimized ? (
                        <Icons.DownOutlined iconSize="s" />
                      ) : (
                        <Icons.UpOutlined iconSize="s" />
                      )
                    }
                    showMarginRight={false}
                    onClick={() =>
                      setAreHazardLayersMinimized(previous => !previous)
                    }
                  />
                </div>
                {!areHazardLayersMinimized && (
                  <div className="hazard-map-layers-content">
                    {availableHazards.map(hazard => (
                      <div className="hazard-map-option" key={hazard.key}>
                        <span className="hazard-map-option-label">
                          <span className="hazard-map-icon" aria-hidden="true">
                            {hazard.icon}
                          </span>
                          {hazard.label}
                        </span>
                        <Switch
                          checked={enabledHazards[hazard.key]}
                          size="small"
                          onChange={() => toggleHazard(hazard.key)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <div className="hazard-map-legends">
                <section
                  className={`hazard-map-panel hazard-map-severity-panel${
                    isWarningLevelMinimized
                      ? ' hazard-map-severity-panel-minimized'
                      : ''
                  }`}
                  aria-label="Severity legend"
                >
                  <div className="hazard-map-severity-heading">
                    <div className="hazard-map-panel-title">Warning Level</div>
                    <Button
                      aria-expanded={!isWarningLevelMinimized}
                      aria-label={
                        isWarningLevelMinimized
                          ? 'Expand warning level legend'
                          : 'Minimize warning level legend'
                      }
                      buttonSize="xsmall"
                      buttonStyle="link"
                      icon={
                        isWarningLevelMinimized ? (
                          <Icons.DownOutlined iconSize="s" />
                        ) : (
                          <Icons.UpOutlined iconSize="s" />
                        )
                      }
                      showMarginRight={false}
                      onClick={() =>
                        setIsWarningLevelMinimized(previous => !previous)
                      }
                    />
                  </div>
                  {!isWarningLevelMinimized && (
                    <div className="hazard-map-severity-content">
                      <div className="hazard-map-severity-grid">
                        {SEVERITIES.map(([color, label]) => (
                          <div className="hazard-map-legend-row" key={label}>
                            <span
                              className="hazard-map-swatch"
                              style={{ backgroundColor: color }}
                            />
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
                {/* <section
                  className="hazard-map-panel hazard-map-earthquake-panel"
                  aria-label="Earthquake shaking legend"
                >
                  <div className="hazard-map-panel-title">
                    Earthquake shaking
                  </div>
                  <div className="hazard-map-severity-grid">
                    {EARTHQUAKE_ZONE_LEVELS.map(({ label, color }) => (
                      <div className="hazard-map-legend-row" key={label}>
                        <span
                          className="hazard-map-swatch"
                          style={{ backgroundColor: color }}
                        />
                        {label}
                      </div>
                    ))}
                  </div>
                </section> */}
              </div>
            </>
          ) : (
            <section className="hazard-map-panel hazard-map-empty">
              Enable Warnings to view the configured hazard layers.
            </section>
          )}
        </aside>
      </div>
    </Styles>
  );
}
