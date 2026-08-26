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
import { ChartProps, getColumnLabel, getMetricLabel } from '@superset-ui/core';
import { EarthquakeDataItem, StateMapDataItem } from '../types';
import { normalizeStateKey } from '../districts';

// A single state returned by the native dashboard-filtered query drives the
// map highlight and camera. Multiple or unfiltered state rows show Malaysia.
function deriveActiveStateKey(
  rows: Record<string, unknown>[],
  stateColumnLabel: string,
): string | null {
  const values = Array.from(
    new Set(
      rows
        .map(row => String(row[stateColumnLabel] ?? '').trim())
        .filter(Boolean),
    ),
  );
  if (values.length !== 1) return null;
  return normalizeStateKey(values[0]) ?? null;
}

function parseEventDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const rawValue = String(value).trim();
  const numericValue = Number(rawValue);
  const date = /^\d+$/.test(rawValue)
    ? new Date(
        numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue,
      )
    : new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isInCurrentYear(value: unknown, currentDate: Date): boolean {
  const eventDate = parseEventDate(value);
  return (
    eventDate !== null && eventDate.getFullYear() === currentDate.getFullYear()
  );
}

export default function transformProps(chartProps: ChartProps) {
  const {
    width,
    height,
    formData,
    queriesData,
    hooks,
    filterState,
    emitCrossFilters,
  } = chartProps;
  const { stateColumn, metric, showDistrictBorders, sliceId } = formData;

  const stateColumnLabel = getColumnLabel(stateColumn);
  const metricLabel = metric ? getMetricLabel(metric) : undefined;
  const rows = (queriesData[0]?.data ?? []) as Record<string, unknown>[];
  const currentDate = new Date();

  // Earthquake rows carry no state info (they're global, not Malaysia-only)
  // and reuse the `severity` column for a different scale, so they must be
  // excluded from the state choropleth data.
  const stateRows = rows.filter(
    row =>
      String(row.event_type ?? '')
        .trim()
        .toLowerCase() !== 'earthquake',
  );

  const data: StateMapDataItem[] = stateRows.map(row => {
    const rawValue = String(row[stateColumnLabel] ?? '');
    return {
      state_key: normalizeStateKey(rawValue) ?? '',
      raw_value: rawValue,
      metric:
        metricLabel || row.severity !== undefined
          ? Number(row[metricLabel ?? 'severity'] ?? 0)
          : undefined,
    };
  });

  const earthquakes: EarthquakeDataItem[] = rows.flatMap(row => {
    if (
      String(row.event_type ?? '')
        .trim()
        .toLowerCase() !== 'earthquake' ||
      !isInCurrentYear(row.event_time, currentDate)
    ) {
      return [];
    }
    const latitude = Number(row.lat);
    const longitude = Number(row.lon);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return [];
    }
    const optionalNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined || value === '')
        return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    const optionalString = (value: unknown): string | undefined =>
      value === null || value === undefined || value === ''
        ? undefined
        : String(value);
    return [
      {
        latitude,
        longitude,
        magnitude: optionalNumber(row.magnitude),
        depth: optionalNumber(row.depth),
        location: optionalString(row.location),
        eventTime: optionalString(row.event_time),
        title: optionalString(row.title),
      },
    ];
  });

  console.log('[3D Map] Transforming query response', {
    sliceId,
    stateColumnLabel,
    filterState,
    rows,
    transformedData: data,
  });

  return {
    width,
    height,
    data,
    earthquakes,
    activeStateKey: deriveActiveStateKey(stateRows, stateColumnLabel),
    stateColumn: stateColumnLabel,
    showDistrictBorders,
    sliceId,
    setDataMask: hooks.setDataMask,
    emitCrossFilters,
  };
}
