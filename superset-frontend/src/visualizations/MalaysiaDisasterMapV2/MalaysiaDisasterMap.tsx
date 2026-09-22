import { styled } from '@apache-superset/core/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import earthquakesJson from './data/earthquakes.json';
import knownFeaturesJson from './data/kl-known-features.json';
import statesJson from './data/malaysia-states.json';
import tsunamiJson from './data/tsunami-scenarios.json';
import warningsJson from './data/weather-warnings.json';
import { MalaysiaDisasterMapProps } from './types';

type Warning = {
  warning_issue?: { issued?: string; title_en?: string };
  valid_from?: string | null;
  valid_to?: string | null;
  heading_en?: string;
  text_en?: string;
};

type Earthquake = {
  localdatetime: string;
  lat: number;
  lon: number;
  depth: number;
  location?: string;
  location_original?: string;
  n_distancemas?: string;
  magdefault: number;
  visible?: boolean;
};

type TsunamiScenario = {
  id: string;
  title: string;
  status: string;
  instruction: string;
  affected_state: string;
  earthquake: { magnitude: number; depth_km: number; coordinates: [number, number] };
  affected_areas: { name: string; coordinates: [number, number] }[];
  wave_frames: { minutes: number; label: string }[];
  expected_wave_height_m: number;
};

type View = 'warning' | 'earthquake' | 'tsunami';
type KnownFeature = { name: string; category?: string; coordinates: [number, number]; geometry?: GeoJSON.Geometry; area_m2?: number };
type AreaResults = { places: KnownFeature[]; roads: KnownFeature[]; buildings: KnownFeature[]; source: string };

const STATE_ALIASES: Record<string, string[]> = {
  SABAH: ['sabah'],
  JOHOR: ['johor'],
  PERLIS: ['perlis'],
  SARAWAK: ['sarawak'],
  PERAK: ['perak'],
  'PULAU PINANG': ['pulau pinang', 'penang'],
  MELAKA: ['melaka', 'malacca'],
  SELANGOR: ['selangor'],
  'WILAYAH PERSEKUTUAN': [
    'kuala lumpur',
    'putrajaya',
    'labuan',
    'wilayah persekutuan',
  ],
  'NEGERI SEMBILAN': ['negeri sembilan'],
  KELANTAN: ['kelantan'],
  PAHANG: ['pahang'],
  KEDAH: ['kedah'],
  TERENGGANU: ['terengganu'],
};

const warnings = (warningsJson as Warning[]).filter(
  warning =>
    !/no advisory|tiada nasihat/i.test(
      `${warning.warning_issue?.title_en ?? ''} ${warning.heading_en ?? ''}`,
    ),
);
const earthquakes = (earthquakesJson as Earthquake[]).filter(
  earthquake => earthquake.visible !== false,
);
const tsunamiScenarios = (
  tsunamiJson as unknown as { scenarios: TsunamiScenario[] }
).scenarios;
const knownFeatures = knownFeaturesJson as unknown as Omit<AreaResults, 'buildings' | 'source'>;

const Root = styled.div<{ height: number; width: number }>`
  background: #102326;
  color: #d7f5ff;
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  height: ${({ height }) => height}px;
  overflow: hidden;
  width: ${({ width }) => width}px;

  * { box-sizing: border-box; }
  button, select { font: inherit; }
  .panel { background: #102326; border-right: 1px solid #2c4b4d; display: flex; flex-direction: column; min-width: 0; padding: 16px; z-index: 2; }
  .eyebrow { color: #36e5ec; font-size: 10px; font-weight: 700; letter-spacing: .15em; }
  h2 { font-size: 18px; line-height: 1.15; margin: 5px 0 2px; }
  .summary { color: #9bc9be; font-size: 11px; margin-bottom: 12px; }
  .tabs, .layers { display: grid; gap: 6px; grid-template-columns: 1fr 1fr; margin-bottom: 10px; }
  button, select { background: #173438; border: 1px solid #36575a; border-radius: 4px; color: #b8d8d5; cursor: pointer; min-height: 32px; padding: 6px 8px; }
  button.active { background: #17636d; border-color: #36e5ec; color: #efffff; }
  select { margin-bottom: 10px; width: 100%; }
  .records { display: flex; flex: 1; flex-direction: column; gap: 6px; min-height: 0; overflow: auto; }
  .record { align-items: center; display: grid; gap: 8px; grid-template-columns: 34px 1fr; text-align: left; width: 100%; }
  .record strong, .record small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .record small { color: #88aaa8; font-size: 10px; margin-top: 2px; }
  .badge { align-items: center; background: #213f42; border-radius: 50%; color: #f2ca68; display: flex; font-size: 11px; font-weight: 700; height: 30px; justify-content: center; width: 30px; }
  .warning .badge { color: #ff7770; }
  .map-wrap { min-width: 0; position: relative; }
  .map { height: 100%; width: 100%; }
  .detail { background: rgba(16,35,38,.96); border-left: 3px solid #36e5ec; bottom: 20px; left: 20px; max-height: 42%; max-width: 520px; overflow: auto; padding: 12px 14px; position: absolute; right: 20px; z-index: 3; }
  .detail strong { display: block; margin-bottom: 4px; }
  .detail p { color: #b8d8d5; font-size: 11px; line-height: 1.45; margin: 4px 0; }
  .detail button { float: right; min-height: 24px; padding: 1px 7px; }
  .maplibregl-ctrl-group { background: #e9f7f5; }
  .hidden-input { display: none; }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    grid-template-rows: 210px minmax(0, 1fr);
    .panel { border-bottom: 1px solid #2c4b4d; border-right: 0; padding: 10px; }
    .records { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
`;

const dateKey = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kuala_Lumpur',
      }).format(new Date(value))
    : '';

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-MY', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kuala_Lumpur',
      }).format(new Date(value))
    : 'Ongoing';

function statesForWarning(warning: Warning) {
  const text = `${warning.heading_en ?? ''} ${warning.text_en ?? ''}`.toLowerCase();
  return Object.entries(STATE_ALIASES)
    .filter(([state, aliases]) => {
      const searchable =
        state === 'MELAKA'
          ? text.replace(/\b(?:northern|southern)\s+straits?\s+of\s+melaka\b/gi, '')
          : text;
      return aliases.some(alias => searchable.includes(alias));
    })
    .map(([state]) => state);
}

function destinationPoint(origin: [number, number], distance: number, bearing: number) {
  const radius = 6371;
  const angularDistance = distance / radius;
  const angle = (bearing * Math.PI) / 180;
  const latitude = (origin[1] * Math.PI) / 180;
  const longitude = (origin[0] * Math.PI) / 180;
  const destinationLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance) +
      Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(angle),
  );
  const destinationLongitude =
    longitude +
    Math.atan2(
      Math.sin(angle) * Math.sin(angularDistance) * Math.cos(latitude),
      Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(destinationLatitude),
    );
  return [
    (((destinationLongitude * 180) / Math.PI + 540) % 360) - 180,
    (destinationLatitude * 180) / Math.PI,
  ];
}

function earthquakeImpact(quake: Earthquake): GeoJSON.FeatureCollection {
  const magnitude = Number(quake.magdefault) || 0;
  const depth = Number(quake.depth) || 0;
  const depthFactor = Math.max(0.55, 1 - Math.min(depth, 800) / 2000);
  const origin: [number, number] = [Number(quake.lon), Number(quake.lat)];
  const zones = [
    { zone: 'possible', label: 'Possible felt', offset: -0.3 },
    { zone: 'moderate', label: 'Moderate estimate', offset: -0.7 },
    { zone: 'higher', label: 'Higher estimate', offset: -1.2 },
  ];
  return {
    type: 'FeatureCollection',
    features: zones.map(item => {
      const radiusKm = Math.max(
        8,
        Math.round(10 ** (0.5 * magnitude + item.offset) * depthFactor),
      );
      const ring = Array.from({ length: 97 }, (_, index) =>
        destinationPoint(origin, radiusKm, (index * 360) / 96),
      );
      return {
        type: 'Feature',
        properties: { zone: item.zone, label: item.label, radiusKm },
        geometry: { type: 'Polygon', coordinates: [ring] },
      };
    }),
  };
}

function focusEarthquake(map: MapLibreMap | null, quake: Earthquake) {
  if (!map) return;
  (map.getSource('earthquake-impact') as GeoJSONSource | undefined)?.setData(
    earthquakeImpact(quake),
  );
  map.flyTo({ center: [Number(quake.lon), Number(quake.lat)], zoom: 6 });
}

function tsunamiWaves(scenario: TsunamiScenario, frameIndex: number): GeoJSON.FeatureCollection {
  const progress = frameIndex / Math.max(1, scenario.wave_frames.length - 1);
  const start = scenario.earthquake.coordinates;
  const end = [118.35, 4.65];
  return {
    type: 'FeatureCollection',
    features: [0, 0.055, 0.11]
      .filter(offset => progress >= offset)
      .map(offset => {
        const value = Math.max(0, Math.min(1, progress - offset));
        const centerLongitude = start[0] + (end[0] - start[0]) * value;
        const centerLatitude =
          start[1] + (end[1] - start[1]) * value - 0.3 * Math.sin(Math.PI * value);
        const span = 0.35 + 1.05 * Math.sin(Math.PI * value);
        const coordinates = Array.from({ length: 17 }, (_, index) => {
          const unit = -1 + index * 0.125;
          return [
            centerLongitude + 0.18 * (1 - unit * unit) * Math.sin(Math.PI * value) - 0.08 * unit,
            centerLatitude + unit * span,
          ];
        });
        return {
          type: 'Feature',
          properties: { age: offset, progress: value },
          geometry: { type: 'LineString', coordinates },
        };
      }),
  };
}

function pointInPolygon(point: [number, number], vertices: [number, number][]) {
  let inside = false;
  let previous = vertices.length - 1;
  for (let index = 0; index < vertices.length; index += 1) {
    const [x, y] = vertices[index];
    const [previousX, previousY] = vertices[previous];
    const crosses = y > point[1] !== previousY > point[1];
    if (crosses && point[0] < ((previousX - x) * (point[1] - y)) / (previousY - y) + x) {
      inside = !inside;
    }
    previous = index;
  }
  return inside;
}

function localAreaData(vertices: [number, number][], close: boolean): GeoJSON.FeatureCollection {
  if (vertices.length === 0) return { type: 'FeatureCollection', features: [] };
  if (vertices.length === 1) {
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: vertices[0] },
      }],
    };
  }
  const coordinates = close && vertices.length >= 3 ? [...vertices, vertices[0]] : vertices;
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: close && vertices.length >= 3
        ? { type: 'Polygon', coordinates: [coordinates] }
        : { type: 'LineString', coordinates },
    }],
  };
}

function validateRing(value: unknown): [number, number][] {
  if (!Array.isArray(value) || value.length < 4 || value.length > 500) {
    throw new Error('Polygon must contain 3–499 vertices plus its closing coordinate.');
  }
  const ring = value.map(point => {
    if (!Array.isArray(point) || point.length < 2) throw new Error('Invalid polygon coordinate.');
    const longitude = Number(point[0]);
    const latitude = Number(point[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new Error('Coordinates must use valid [longitude, latitude] values.');
    }
    return [longitude, latitude] as [number, number];
  });
  const [first, ...remaining] = ring;
  const last = remaining.at(-1) ?? first;
  if (first[0] === last[0] && first[1] === last[1]) ring.pop();
  if (ring.length < 3) throw new Error('Polygon requires at least three distinct vertices.');
  return ring;
}

function geoJsonVertices(value: unknown) {
  const input = value as {
    type?: string;
    coordinates?: unknown[];
    geometry?: { type?: string; coordinates?: unknown[] };
    features?: { type?: string; geometry?: { type?: string; coordinates?: unknown[] } }[];
  };
  let geometry = input.type === 'Feature' ? input.geometry : input;
  if (input.type === 'FeatureCollection') {
    const polygons = (input.features ?? []).filter(item => item.geometry?.type === 'Polygon');
    if (polygons.length !== 1) throw new Error(`GeoJSON must contain exactly one Polygon; found ${polygons.length}.`);
    const [{ geometry: polygonGeometry }] = polygons;
    geometry = polygonGeometry;
  }
  if (geometry?.type !== 'Polygon') throw new Error('Upload a Polygon, Feature, or single-polygon FeatureCollection.');
  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length !== 1) throw new Error('Polygon holes are not supported yet.');
  return validateRing(geometry.coordinates[0]);
}

function capVertices(xmlText: string) {
  const documentValue = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (documentValue.querySelector('parsererror')) throw new Error('The CAP file is not valid XML.');
  if (documentValue.documentElement.localName !== 'alert') throw new Error('The XML root must be a CAP <alert>.');
  const [polygonNode] = documentValue.getElementsByTagNameNS('*', 'polygon');
  if (!polygonNode?.textContent?.trim()) throw new Error('The CAP alert has no polygon coverage.');
  const ring = polygonNode.textContent.trim().split(/\s+/).map(pair => {
    const [latitudeText, longitudeText] = pair.split(',');
    return [Number(longitudeText), Number(latitudeText)];
  });
  const headline = documentValue.getElementsByTagNameNS('*', 'headline')[0]?.textContent?.trim();
  return { vertices: validateRing(ring), headline: headline || 'Uploaded CAP warning' };
}

async function querySpatialArea(vertices: [number, number][]) {
  const ring = [...vertices, vertices[0]];
  const response = await fetch('/api/osm/within', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      polygon: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } },
      limit: 300,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as Partial<AreaResults> & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Spatial query failed: HTTP ${response.status}`);
  return {
    places: body.places ?? [],
    roads: body.roads ?? [],
    buildings: body.buildings ?? [],
    source: body.source ?? 'postgis-openstreetmap',
  } satisfies AreaResults;
}

export default function MalaysiaDisasterMap({
  height,
  width,
}: MalaysiaDisasterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialZoomRef = useRef(width < 760 ? 3.7 : 4.7);
  const drawingRef = useRef(false);
  const verticesRef = useRef<[number, number][]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [view, setView] = useState<View>('warning');
  const [day, setDay] = useState('all');
  const [showWarnings, setShowWarnings] = useState(true);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showTerrain, setShowTerrain] = useState(false);
  const [showTsunami, setShowTsunami] = useState(true);
  const [scenario, setScenario] = useState<TsunamiScenario | null>(null);
  const [tsunamiFrame, setTsunamiFrame] = useState(0);
  const [tsunamiPlaying, setTsunamiPlaying] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [areaResults, setAreaResults] = useState<AreaResults | null>(null);
  const [detail, setDetail] = useState<{ title: string; text: string } | null>(null);

  const days = useMemo(
    () =>
      Array.from(
        new Set([
          ...warnings.map(item => dateKey(item.warning_issue?.issued)),
          ...earthquakes.map(item => dateKey(item.localdatetime)),
        ]),
      )
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a)),
    [],
  );
  const visibleWarnings = useMemo(
    () => warnings.filter(item => day === 'all' || dateKey(item.warning_issue?.issued) === day),
    [day],
  );
  const visibleEarthquakes = useMemo(
    () => earthquakes.filter(item => day === 'all' || dateKey(item.localdatetime) === day),
    [day],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [109.4, 4.1],
      zoom: initialZoomRef.current,
      pitch: 20,
      bearing: -4,
      minZoom: 2,
      maxZoom: 18,
      maxPitch: 70,
      renderWorldCopies: false,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');
    map.on('load', () => {
      map.addSource('malaysia-risk', { type: 'geojson', data: statesJson as GeoJSON.FeatureCollection });
      map.addLayer({ id: 'state-fill', type: 'fill', source: 'malaysia-risk', paint: { 'fill-color': ['case', ['>', ['get', 'warningCount'], 0], '#f25252', '#58a99b'], 'fill-opacity': ['case', ['>', ['get', 'warningCount'], 0], 0.26, 0.08] } });
      map.addLayer({ id: 'state-line', type: 'line', source: 'malaysia-risk', paint: { 'line-color': ['case', ['>', ['get', 'warningCount'], 0], '#ff7770', '#74b8ad'], 'line-width': ['case', ['>', ['get', 'warningCount'], 0], 2.5, 1] } });
      map.addSource('earthquakes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'earthquake-halo', type: 'circle', source: 'earthquakes', paint: { 'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 4, 10, 7, 25], 'circle-color': '#f2ca68', 'circle-opacity': 0.18 } });
      map.addLayer({ id: 'earthquake-points', type: 'circle', source: 'earthquakes', paint: { 'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 4, 4, 7, 10], 'circle-color': '#f2ca68', 'circle-stroke-color': '#fff4c7', 'circle-stroke-width': 2 } });
      map.addSource('earthquake-impact', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'earthquake-impact-fill', type: 'fill', source: 'earthquake-impact', paint: { 'fill-color': ['match', ['get', 'zone'], 'higher', '#f25252', 'moderate', '#f28a4b', '#f2ca68'], 'fill-opacity': ['match', ['get', 'zone'], 'higher', 0.2, 'moderate', 0.13, 0.08] } }, 'earthquake-halo');
      map.addLayer({ id: 'earthquake-impact-line', type: 'line', source: 'earthquake-impact', paint: { 'line-color': ['match', ['get', 'zone'], 'higher', '#f25252', 'moderate', '#f28a4b', '#f2ca68'], 'line-width': ['match', ['get', 'zone'], 'higher', 2.4, 'moderate', 1.8, 1.3], 'line-opacity': 0.9 } }, 'earthquake-halo');
      map.addSource('terrain-dem', { type: 'raster-dem', url: 'https://tiles.mapterhorn.com/tilejson.json', tileSize: 512, maxzoom: 14 });
      map.addSource('hillshade-dem', { type: 'raster-dem', url: 'https://tiles.mapterhorn.com/tilejson.json', tileSize: 512, maxzoom: 14 });
      map.addLayer({ id: 'terrain-hillshade', type: 'hillshade', source: 'hillshade-dem', layout: { visibility: 'none' }, paint: { 'hillshade-shadow-color': '#668078', 'hillshade-highlight-color': '#f1efd9', 'hillshade-accent-color': '#7e968c', 'hillshade-exaggeration': 0.18 } });
      map.addSource('tsunami-state', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'tsunami-state-fill', type: 'fill', source: 'tsunami-state', paint: { 'fill-color': '#57bde8', 'fill-opacity': 0.12 } });
      map.addLayer({ id: 'tsunami-state-line', type: 'line', source: 'tsunami-state', paint: { 'line-color': '#79d4f6', 'line-width': 2.4, 'line-dasharray': [2, 1.4] } });
      map.addSource('tsunami-wave', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'tsunami-wave-glow', type: 'line', source: 'tsunami-wave', paint: { 'line-color': '#57bde8', 'line-width': 9, 'line-blur': 8, 'line-opacity': 0.35 } });
      map.addLayer({ id: 'tsunami-wave-line', type: 'line', source: 'tsunami-wave', paint: { 'line-color': '#b8edff', 'line-width': 3, 'line-opacity': 0.9 } });
      map.addSource('tsunami-areas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'tsunami-area-halo', type: 'circle', source: 'tsunami-areas', paint: { 'circle-radius': 11, 'circle-color': '#57bde8', 'circle-opacity': 0.18, 'circle-stroke-color': '#79d4f6', 'circle-stroke-width': 1 } });
      map.addLayer({ id: 'tsunami-area-point', type: 'circle', source: 'tsunami-areas', paint: { 'circle-radius': 4, 'circle-color': '#d7f5ff', 'circle-stroke-color': '#1689b8', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'tsunami-area-label', type: 'symbol', source: 'tsunami-areas', layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-offset': [0, 1.2], 'text-anchor': 'top' }, paint: { 'text-color': '#102326', 'text-halo-color': '#d7f5ff', 'text-halo-width': 1.5 } });
      map.addSource('tsunami-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'tsunami-source-point', type: 'circle', source: 'tsunami-source', paint: { 'circle-radius': 9, 'circle-color': '#0b2020', 'circle-stroke-color': '#57bde8', 'circle-stroke-width': 3 } });
      map.addSource('local-area', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'local-area-fill', type: 'fill', source: 'local-area', filter: ['==', '$type', 'Polygon'], paint: { 'fill-color': '#16b4cc', 'fill-opacity': 0.22 } });
      map.addLayer({ id: 'local-area-line', type: 'line', source: 'local-area', paint: { 'line-color': '#36e5ec', 'line-width': 3.4 } });
      map.addSource('local-area-vertices', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'local-area-vertices', type: 'circle', source: 'local-area-vertices', paint: { 'circle-radius': 6, 'circle-color': '#e7ffff', 'circle-stroke-color': '#102326', 'circle-stroke-width': 2.5 } });
      map.addSource('area-catalogue', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'area-catalogue-points', type: 'circle', source: 'area-catalogue', paint: { 'circle-radius': 6, 'circle-color': ['match', ['get', 'kind'], 'road', '#b8edff', '#d7f5ff'], 'circle-stroke-color': '#1689b8', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'area-catalogue-labels', type: 'symbol', source: 'area-catalogue', layout: { 'text-field': ['get', 'name'], 'text-size': 10, 'text-offset': [0, 1.15], 'text-anchor': 'top' }, paint: { 'text-color': '#102326', 'text-halo-color': '#d7f5ff', 'text-halo-width': 1.5 } });
      map.addSource('area-buildings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'area-buildings-fill', type: 'fill', source: 'area-buildings', paint: { 'fill-color': '#78e5d0', 'fill-opacity': 0.28 } });
      map.addLayer({ id: 'area-buildings-line', type: 'line', source: 'area-buildings', paint: { 'line-color': '#1689b8', 'line-width': 1.4 } });
      map.on('click', 'earthquake-points', event => {
        const record = event.features?.[0]?.properties?.record;
        if (typeof record === 'string') {
          const quake = JSON.parse(record) as Earthquake;
          focusEarthquake(map, quake);
          setDetail({ title: `M${Number(quake.magdefault).toFixed(1)} · ${quake.location_original ?? quake.location ?? 'Earthquake'}`, text: `${formatDate(quake.localdatetime)} · ${quake.depth} km depth · ${quake.n_distancemas ?? 'Distance unavailable'}` });
        }
      });
      map.on('mouseenter', 'earthquake-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'earthquake-points', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', event => {
        if (!drawingRef.current) return;
        const next = [...verticesRef.current, [event.lngLat.lng, event.lngLat.lat] as [number, number]];
        verticesRef.current = next;
        setVertices(next);
      });
      setMapReady(true);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => { mapRef.current?.resize(); }, [height, width]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const warningCounts = new Map<string, number>();
    visibleWarnings.forEach(item => statesForWarning(item).forEach(state => warningCounts.set(state, (warningCounts.get(state) ?? 0) + 1)));
    const stateData = structuredClone(statesJson) as GeoJSON.FeatureCollection;
    stateData.features.forEach(feature => { feature.properties = { ...feature.properties, warningCount: warningCounts.get(String(feature.properties?.name)) ?? 0 }; });
    (map.getSource('malaysia-risk') as GeoJSONSource).setData(stateData);
    const quakeData: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: visibleEarthquakes.map(quake => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [Number(quake.lon), Number(quake.lat)] }, properties: { magnitude: Number(quake.magdefault), record: JSON.stringify(quake) } })) };
    (map.getSource('earthquakes') as GeoJSONSource).setData(quakeData);
  }, [mapReady, visibleEarthquakes, visibleWarnings]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    ['state-fill', 'state-line'].forEach(id => map.setLayoutProperty(id, 'visibility', showWarnings ? 'visible' : 'none'));
    ['earthquake-halo', 'earthquake-points', 'earthquake-impact-fill', 'earthquake-impact-line'].forEach(id => map.setLayoutProperty(id, 'visibility', showEarthquakes ? 'visible' : 'none'));
  }, [mapReady, showEarthquakes, showWarnings]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    map.setTerrain(showTerrain ? { source: 'terrain-dem', exaggeration: 1.05 } : null);
    map.setLayoutProperty('terrain-hillshade', 'visibility', showTerrain ? 'visible' : 'none');
  }, [mapReady, showTerrain]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const ids = ['tsunami-state-fill', 'tsunami-state-line', 'tsunami-wave-glow', 'tsunami-wave-line', 'tsunami-area-halo', 'tsunami-area-point', 'tsunami-area-label', 'tsunami-source-point'];
    ids.forEach(id => map.setLayoutProperty(id, 'visibility', showTsunami ? 'visible' : 'none'));
  }, [mapReady, showTsunami]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !scenario) return;
    const state = (statesJson as GeoJSON.FeatureCollection).features.find(
      feature => feature.properties?.name === scenario.affected_state,
    );
    (map.getSource('tsunami-state') as GeoJSONSource).setData({ type: 'FeatureCollection', features: state ? [state] : [] });
    (map.getSource('tsunami-areas') as GeoJSONSource).setData({ type: 'FeatureCollection', features: scenario.affected_areas.map(area => ({ type: 'Feature', properties: { name: area.name }, geometry: { type: 'Point', coordinates: area.coordinates } })) });
    (map.getSource('tsunami-source') as GeoJSONSource).setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { magnitude: scenario.earthquake.magnitude }, geometry: { type: 'Point', coordinates: scenario.earthquake.coordinates } }] });
    map.fitBounds([[116.8, 3.45], [127.45, 7.2]], { padding: 50, pitch: 16, bearing: 0, duration: 1000 });
  }, [mapReady, scenario]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !scenario) return;
    (map.getSource('tsunami-wave') as GeoJSONSource).setData(tsunamiWaves(scenario, tsunamiFrame));
  }, [mapReady, scenario, tsunamiFrame]);

  useEffect(() => {
    if (!tsunamiPlaying || !scenario) return undefined;
    const timer = window.setInterval(() => {
      setTsunamiFrame(current => {
        if (current >= scenario.wave_frames.length - 1) {
          setTsunamiPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [scenario, tsunamiPlaying]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    (map.getSource('local-area') as GeoJSONSource).setData(localAreaData(vertices, !drawing));
    (map.getSource('local-area-vertices') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: vertices.map((coordinates, index) => ({
        type: 'Feature',
        properties: { index: index + 1 },
        geometry: { type: 'Point', coordinates },
      })),
    });
    map.getCanvas().style.cursor = drawing ? 'crosshair' : '';
  }, [drawing, mapReady, vertices]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const features = areaResults
      ? [
          ...areaResults.places.map(item => ({ ...item, kind: 'place' })),
          ...areaResults.roads.map(item => ({ ...item, kind: 'road' })),
        ]
      : [];
    (map.getSource('area-catalogue') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: features.map(item => ({
        type: 'Feature',
        properties: { name: item.name, category: item.category ?? '', kind: item.kind },
        geometry: { type: 'Point', coordinates: item.coordinates },
      })),
    });
    (map.getSource('area-buildings') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: (areaResults?.buildings ?? [])
        .filter(item => item.geometry)
        .map(item => ({
          type: 'Feature',
          properties: { name: item.name, category: item.category ?? '', area_m2: item.area_m2 ?? 0 },
          geometry: item.geometry as GeoJSON.Geometry,
        })),
    });
  }, [areaResults, mapReady]);

  const startDrawing = () => {
    drawingRef.current = true;
    verticesRef.current = [];
    setVertices([]);
    setAreaResults(null);
    setDrawing(true);
    setDetail({ title: 'Draw local area', text: 'Click at least three points on the map, then select Finish.' });
  };

  const clearArea = () => {
    drawingRef.current = false;
    verticesRef.current = [];
    setDrawing(false);
    setVertices([]);
    setAreaResults(null);
    setDetail(null);
  };

  const completeArea = async (nextVertices: [number, number][], title: string) => {
    drawingRef.current = false;
    verticesRef.current = nextVertices;
    setDrawing(false);
    setVertices(nextVertices);
    const inside = (items: KnownFeature[]) =>
      items.filter(item => pointInPolygon(item.coordinates, nextVertices));
    const fallback: AreaResults = {
      places: inside(knownFeatures.places),
      roads: inside(knownFeatures.roads),
      buildings: [],
      source: 'local-catalogue',
    };
    setDetail({
      title,
      text: 'Querying PostGIS for OpenStreetMap places, roads, and buildings…',
    });
    try {
      const results = await querySpatialArea(nextVertices);
      setAreaResults(results);
      setDetail({
        title,
        text: `${results.places.length} named places · ${results.roads.length} roads · ${results.buildings.length} buildings. Source: PostGIS/OpenStreetMap.`,
      });
    } catch (error) {
      setAreaResults(fallback);
      setDetail({
        title: `${title} · local fallback`,
        text: `${error instanceof Error ? error.message : 'Spatial query unavailable'}. Showing ${fallback.places.length} named places and ${fallback.roads.length} road reference points from the small local catalogue.`,
      });
    }
  };

  const finishArea = async () => {
    if (verticesRef.current.length < 3) return;
    await completeArea(verticesRef.current, 'Local area analysis');
  };

  const uploadArea = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      if (/\.xml$/i.test(file.name) || /^\s*</.test(text)) {
        const cap = capVertices(text);
        await completeArea(cap.vertices, `CAP warning · ${cap.headline}`);
      } else {
        await completeArea(geoJsonVertices(JSON.parse(text)), `Uploaded area · ${file.name}`);
      }
    } catch (error) {
      setDetail({
        title: 'Area upload failed',
        text: error instanceof Error ? error.message : 'Unable to read this file.',
      });
    } finally {
      if (uploadRef.current) uploadRef.current.value = '';
    }
  };

  const records = view === 'warning' ? visibleWarnings.slice(0, 8) : view === 'earthquake' ? visibleEarthquakes.slice(0, 8) : tsunamiScenarios;

  return (
    <Root height={height} width={width}>
      <aside className="panel">
        <span className="eyebrow">MALAYSIA HAZARD INTELLIGENCE</span>
        <h2>Disaster Map</h2>
        <span className="summary">{visibleWarnings.length} warnings · {visibleEarthquakes.length} earthquakes</span>
        <div className="tabs">
          <button className={view === 'warning' ? 'active' : ''} onClick={() => setView('warning')} type="button">Warnings</button>
          <button className={view === 'earthquake' ? 'active' : ''} onClick={() => setView('earthquake')} type="button">Earthquakes</button>
          <button className={view === 'tsunami' ? 'active' : ''} onClick={() => { setView('tsunami'); setScenario(tsunamiScenarios[0] ?? null); setTsunamiFrame(0); }} type="button">Tsunami</button>
        </div>
        <select aria-label="Date filter" onChange={event => setDay(event.target.value)} value={day}>
          <option value="all">All dates</option>
          {days.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <div className="layers">
          <button className={showWarnings ? 'active' : ''} onClick={() => setShowWarnings(value => !value)} type="button">Warning layer</button>
          <button className={showEarthquakes ? 'active' : ''} onClick={() => setShowEarthquakes(value => !value)} type="button">Quake layer</button>
          <button className={showTerrain ? 'active' : ''} onClick={() => setShowTerrain(value => !value)} type="button">Terrain</button>
          <button className={showTsunami ? 'active' : ''} onClick={() => setShowTsunami(value => !value)} type="button">Tsunami layer</button>
        </div>
        <div className="layers">
          <button className={drawing ? 'active' : ''} onClick={startDrawing} type="button">{drawing ? 'Click map…' : 'Draw area'}</button>
          <button disabled={!drawing || vertices.length < 3} onClick={async () => { await finishArea(); }} type="button">Finish ({vertices.length})</button>
          <button disabled={!vertices.length} onClick={clearArea} type="button">Clear area</button>
          <button onClick={() => uploadRef.current?.click()} type="button">Upload area</button>
          <input accept=".geojson,.json,.xml,application/geo+json,application/json,application/xml,text/xml" className="hidden-input" onChange={async event => { await uploadArea(event.target.files?.[0]); }} ref={uploadRef} type="file" />
        </div>
        {areaResults && <div className="summary">{areaResults.source === 'postgis-openstreetmap' ? 'PostGIS' : 'Fallback'}: {areaResults.places.length} places · {areaResults.roads.length} roads · {areaResults.buildings.length} buildings</div>}
        <div className="records">
          {records.map((record, index) => {
            const warning = view === 'warning' ? (record as Warning) : null;
            const quake = view === 'earthquake' ? (record as Earthquake) : null;
            const tsunami = view === 'tsunami' ? (record as TsunamiScenario) : null;
            const title = warning ? warning.heading_en ?? warning.warning_issue?.title_en ?? 'Weather warning' : quake ? `M${Number(quake.magdefault).toFixed(1)} · ${quake.location_original ?? quake.location ?? 'Earthquake'}` : tsunami?.title ?? 'Tsunami scenario';
            const meta = warning ? `Issued ${formatDate(warning.warning_issue?.issued)}` : quake ? `${formatDate(quake.localdatetime)} · ${quake.depth} km` : `${tsunami?.status} · ${tsunami?.affected_areas.length ?? 0} areas`;
            return <button className={`record ${view}`} key={`${view}-${index}-${title}`} onClick={() => { setDetail({ title, text: warning ? warning.text_en ?? 'No detail supplied.' : quake ? `${quake.n_distancemas ?? 'Distance unavailable'} · depth ${quake.depth} km` : `${tsunami?.instruction ?? ''} Historical prototype; not a live warning.` }); if (quake) focusEarthquake(mapRef.current, quake); if (tsunami) { setScenario(tsunami); setTsunamiFrame(0); setTsunamiPlaying(false); } }} type="button"><span className="badge">{warning ? '!' : quake ? Number(quake.magdefault).toFixed(1) : '≋'}</span><span><strong>{title}</strong><small>{meta}</small></span></button>;
          })}
        </div>
      </aside>
      <section className="map-wrap">
        <div className="map" ref={containerRef} />
        {scenario && view === 'tsunami' && <div className="detail"><strong>MODELLED HISTORICAL SCENARIO · NOT LIVE</strong><p>{scenario.wave_frames[tsunamiFrame]?.label} · +{scenario.wave_frames[tsunamiFrame]?.minutes} MIN · expected archived height {scenario.expected_wave_height_m} m</p><input aria-label="Tsunami timeline" max={scenario.wave_frames.length - 1} min={0} onChange={event => { setTsunamiPlaying(false); setTsunamiFrame(Number(event.target.value)); }} type="range" value={tsunamiFrame} /><button onClick={() => { if (tsunamiFrame >= scenario.wave_frames.length - 1) setTsunamiFrame(0); setTsunamiPlaying(value => !value); }} type="button">{tsunamiPlaying ? 'Pause' : 'Play'}</button></div>}
        {detail && <div className="detail"><button aria-label="Close details" onClick={() => setDetail(null)} type="button">×</button><strong>{detail.title}</strong><p>{detail.text}</p></div>}
      </section>
    </Root>
  );
}
