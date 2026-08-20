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
import React from 'react';
// d3 v7 has no default export; a namespace import is required for the
// Babel/CJS interop used to build this plugin's lib/esm output (see also
// SupersetPluginChartHelloWorld, which follows the same pattern).
// eslint-disable-next-line no-restricted-syntax
import * as d3 from 'd3';
import type { FeatureCollection, Feature, Geometry, Position } from 'geojson';
import {
  getNumberFormatter,
  getSequentialSchemeRegistry,
} from '@superset-ui/core';
import { styled, useTheme } from '@apache-superset/core/theme';
import districtMapUrls, { getStateLabel } from './districts';
import {
  DistrictMapDataItem,
  SupersetPluginChartCustomDistrictMapProps,
} from './types';

interface DistrictProperties {
  state: string;
  district: string;
}

type DistrictFeature = Feature<Geometry, DistrictProperties>;
type DistrictFeatureCollection = FeatureCollection<
  Geometry,
  DistrictProperties
>;

function ringSignedArea(ring: Position[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

// d3-geo expects exterior rings wound clockwise in the (lng, lat) plane and
// holes wound counter-clockwise (the right-hand rule from RFC 7946). This
// source data uses the opposite convention, which makes every polygon render
// as its complement (the whole map minus the district) instead of the
// district itself.
function rewindRing(ring: Position[], isExterior: boolean): Position[] {
  const isClockwise = ringSignedArea(ring) < 0;
  return isClockwise === isExterior ? ring : [...ring].reverse();
}

function rewindGeometry(geometry: Geometry): Geometry {
  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring, i) =>
        rewindRing(ring, i === 0),
      ),
    };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(polygon =>
        polygon.map((ring, i) => rewindRing(ring, i === 0)),
      ),
    };
  }
  return geometry;
}

function rewindFeatureCollection(
  featureCollection: DistrictFeatureCollection,
): DistrictFeatureCollection {
  return {
    ...featureCollection,
    features: featureCollection.features.map(feature => ({
      ...feature,
      geometry: rewindGeometry(feature.geometry),
    })),
  };
}

const geojsonCache: Record<string, DistrictFeatureCollection> = {};
const metricCache: Record<
  string,
  {
    metrics: Record<string, number>;
    colorExtent: [number, number];
    selectionActive: boolean;
  }
> = {};
const STATE_TITLE_HEIGHT = 32;
const COUNTRY_MAP_STATE_SELECTED_EVENT = 'superset:country-map:state-selected';

const Styles = styled.div<{ height: number; width: number }>`
  position: relative;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;

  svg {
    background-color: ${({ theme }) => theme.colorBgContainer};
    display: block;
  }

  .state-title {
    align-items: center;
    color: ${({ theme }) => theme.colorText};
    display: flex;
    font-size: ${({ theme }) => theme.fontSizeLG}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    height: ${STATE_TITLE_HEIGHT}px;
    justify-content: center;
  }

  path.district {
    stroke: ${({ theme }) => theme.colorBorderSecondary};
    cursor: pointer;
  }

  text.district-label {
    fill: ${({ theme }) => theme.colorText};
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    pointer-events: none;
    text-anchor: middle;
    paint-order: stroke;
    stroke: ${({ theme }) => theme.colorBgContainer};
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  .hover-popup {
    position: absolute;
    display: none;
    padding: ${({ theme }) => theme.sizeUnit}px
      ${({ theme }) => theme.sizeUnit * 2}px;
    border-radius: ${({ theme }) => theme.borderRadius}px;
    background-color: ${({ theme }) => theme.colorBgElevated};
    box-shadow: ${({ theme }) => theme.boxShadow};
    border: 1px solid ${({ theme }) => theme.colorBorder};
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    pointer-events: none;
    z-index: 10;
  }

  .message {
    padding: ${({ theme }) => theme.sizeUnit * 4}px;
    color: ${({ theme }) => theme.colorTextSecondary};
  }
`;

export default function SupersetPluginChartCustomDistrictMap(
  props: SupersetPluginChartCustomDistrictMapProps,
) {
  const {
    data,
    height,
    width,
    selectState,
    entity,
    linearColorScheme,
    numberFormat,
    showDistrictLabels,
    sliceId,
    setDataMask,
    filterState,
    emitCrossFilters,
  } = props;

  const rootElem = React.useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const mapHeight = Math.max(height - STATE_TITLE_HEIGHT, 0);
  const stateLabel = getStateLabel(selectState);
  const noMapSelected = selectState === 'no_map';
  const selectedValuesKey = JSON.stringify(filterState?.selectedValues ?? []);
  const dataKey = JSON.stringify(data);
  const [geoData, setGeoData] =
    React.useState<DistrictFeatureCollection | null>(
      () => geojsonCache[selectState] ?? null,
    );
  const [loadError, setLoadError] = React.useState(
    () => !geojsonCache[selectState] && !districtMapUrls[selectState],
  );
  const [prevSelectState, setPrevSelectState] = React.useState(selectState);

  if (selectState !== prevSelectState) {
    setPrevSelectState(selectState);
    const cached = geojsonCache[selectState];
    setGeoData(cached ?? null);
    setLoadError(!cached && !districtMapUrls[selectState]);
  }

  React.useEffect(() => {
    const clearDistrictFilter = () => {
      const selectedValues = JSON.parse(selectedValuesKey) as string[];
      if (!emitCrossFilters || selectedValues.length === 0) return;
      setDataMask({
        extraFormData: { filters: [] },
        filterState: {
          value: null,
          selectedValues: null,
        },
      });
    };
    window.addEventListener(
      COUNTRY_MAP_STATE_SELECTED_EVENT,
      clearDistrictFilter,
    );
    return () => {
      window.removeEventListener(
        COUNTRY_MAP_STATE_SELECTED_EVENT,
        clearDistrictFilter,
      );
    };
  }, [emitCrossFilters, selectedValuesKey, setDataMask]);

  React.useEffect(() => {
    if (geojsonCache[selectState]) return undefined;
    const url = districtMapUrls[selectState];
    if (!url) return undefined;
    let cancelled = false;
    fetch(url)
      .then(response => {
        if (!response.ok)
          throw new Error(`Failed to load map for ${selectState}`);
        return response.json();
      })
      .then((json: DistrictFeatureCollection) => {
        if (cancelled) return;
        const rewound = rewindFeatureCollection(json);
        geojsonCache[selectState] = rewound;
        setGeoData(rewound);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selectState]);

  React.useEffect(() => {
    const container = rootElem.current;
    if (!container || !geoData || width <= 0 || mapHeight <= 0) return;

    const div = d3.select(container);
    div.selectAll('svg').remove();

    const format = getNumberFormatter(numberFormat);
    // Superset may reuse the data array while replacing its row contents.
    // Reading from the serialized dependency guarantees a redraw uses the
    // latest district and metric values after a cross-filter changes.
    const chartData = JSON.parse(dataKey) as DistrictMapDataItem[];
    const renderedMetrics: Record<string, number> = {};
    chartData.forEach(d => {
      renderedMetrics[d.district_id] = d.metric;
    });
    const renderedExtent = d3.extent(chartData.map(d => d.metric));
    const renderedColorExtent: [number, number] =
      renderedExtent[0] != null && renderedExtent[1] != null
        ? renderedExtent
        : [0, 1];

    const selectedValues = JSON.parse(selectedValuesKey) as string[];
    const hasSelection = selectedValues.length > 0;
    const metricCacheKey = `${sliceId}:${selectState}`;
    const cachedMetrics = metricCache[metricCacheKey];
    let metricByDistrict = renderedMetrics;
    let colorExtent = renderedColorExtent;

    if (hasSelection) {
      if (cachedMetrics) {
        cachedMetrics.selectionActive = true;
      } else {
        metricCache[metricCacheKey] = {
          metrics: renderedMetrics,
          colorExtent: renderedColorExtent,
          selectionActive: true,
        };
      }
    } else if (cachedMetrics?.selectionActive) {
      // Clearing a cross-filter can render once with the last selected query
      // result before the unfiltered query completes. Restore the pre-click
      // metrics during that transition.
      cachedMetrics.selectionActive = false;
      metricByDistrict = cachedMetrics.metrics;
      colorExtent = cachedMetrics.colorExtent;
    } else {
      metricCache[metricCacheKey] = {
        metrics: renderedMetrics,
        colorExtent: renderedColorExtent,
        selectionActive: false,
      };
    }

    const colorSchemeObj = getSequentialSchemeRegistry().get(linearColorScheme);
    const colorScale = colorSchemeObj
      ? colorSchemeObj.createLinearScale(colorExtent)
      : () => theme.colorBgContainer;

    const getFill = (feature: DistrictFeature) => {
      const value = metricByDistrict[feature.properties.district];
      return value === undefined
        ? theme.colorBgContainer
        : (colorScale(value) ?? theme.colorBgContainer);
    };
    const getOpacity = (feature: DistrictFeature) =>
      hasSelection && !selectedValues.includes(feature.properties.district)
        ? 0.35
        : 1;

    const projection = d3.geoMercator();
    const path = d3.geoPath(projection);
    projection.fitSize([width, mapHeight], geoData);

    const svg = div
      .append('svg')
      .attr('width', width)
      .attr('height', mapHeight)
      .attr('viewBox', `0 0 ${width} ${mapHeight}`);

    const hoverPopup = div.append('div').attr('class', 'hover-popup');
    const applyDistrictFilter = (values: string[]) => {
      setDataMask({
        extraFormData: {
          filters: values.length
            ? [{ col: entity, op: 'IN', val: values }]
            : [],
        },
        filterState: {
          value: values.length ? values : null,
          selectedValues: values.length ? values : null,
        },
      });
    };

    svg
      .append('rect')
      .attr('class', 'map-background')
      .attr('width', width)
      .attr('height', mapHeight)
      .attr('fill', 'transparent')
      .style('pointer-events', 'all')
      .on('click', () => {
        if (!emitCrossFilters || !hasSelection) return;
        hoverPopup.style('display', 'none');
        applyDistrictFilter([]);
      });

    const mapLayer = svg.append('g');

    mapLayer
      .selectAll('path.district')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('class', 'district')
      .attr('d', (feature: DistrictFeature) => path(feature) ?? '')
      .style('fill', getFill)
      .style('opacity', getOpacity)
      .on(
        'mouseenter',
        function onEnter(
          this: SVGPathElement,
          event: MouseEvent,
          feature: DistrictFeature,
        ) {
          d3.select(this).style('opacity', 0.8);
          const value = metricByDistrict[feature.properties.district];
          const [px, py] = [event.offsetX, event.offsetY];
          hoverPopup
            .style('display', 'block')
            .style('left', `${px + 12}px`)
            .style('top', `${py + 12}px`)
            .html(
              `<strong>${feature.properties.district}</strong>${
                value === undefined ? '' : `<br/>${format(value)}`
              }`,
            );
        },
      )
      .on('mousemove', (event: MouseEvent) => {
        hoverPopup
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY + 12}px`);
      })
      .on(
        'mouseleave',
        function onLeave(
          this: SVGPathElement,
          _event: MouseEvent,
          feature: DistrictFeature,
        ) {
          d3.select(this).style('opacity', getOpacity(feature));
          hoverPopup.style('display', 'none');
        },
      )
      .on('click', (_event: MouseEvent, feature: DistrictFeature) => {
        if (!emitCrossFilters) return;
        const districtName = feature.properties.district;
        const isDeselecting = selectedValues.includes(districtName);
        const values = isDeselecting ? [] : [districtName];
        applyDistrictFilter(values);
      });

    if (showDistrictLabels) {
      mapLayer
        .selectAll('text.district-label')
        .data(geoData.features)
        .enter()
        .append('text')
        .attr('class', 'district-label')
        .attr('x', (feature: DistrictFeature) => path.centroid(feature)[0])
        .attr('y', (feature: DistrictFeature) => path.centroid(feature)[1])
        .text((feature: DistrictFeature) => feature.properties.district);
    }

    return () => {
      div.selectAll('svg').remove();
      div.selectAll('.hover-popup').remove();
    };
  }, [
    geoData,
    dataKey,
    width,
    mapHeight,
    linearColorScheme,
    numberFormat,
    showDistrictLabels,
    entity,
    selectedValuesKey,
    emitCrossFilters,
    setDataMask,
    theme,
  ]);

  if (loadError) {
    return (
      <Styles
        ref={rootElem}
        height={height}
        width={width}
        data-testid={sliceId}
      >
        {!noMapSelected && <div className="state-title">{stateLabel}</div>}
        <div className="message">
          {noMapSelected
            ? 'Select a state to display its district map.'
            : 'No map data available for the selected state.'}
        </div>
      </Styles>
    );
  }

  return (
    <Styles ref={rootElem} height={height} width={width} data-testid={sliceId}>
      <div className="state-title">{stateLabel}</div>
    </Styles>
  );
}
