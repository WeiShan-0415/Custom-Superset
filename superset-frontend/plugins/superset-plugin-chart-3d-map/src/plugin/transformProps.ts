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
import {
  EarthquakeDataItem,
  StateMapDataItem,
  TsunamiAffectedArea,
  TsunamiDataItem,
  TsunamiWaveFrame,
} from '../types';
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

function deriveActiveWarningKey(
  rows: Record<string, unknown>[],
): string | null {
  const warningKeys = Array.from(
    new Set(
      rows.map(row => String(row.warning_key ?? '').trim()).filter(Boolean),
    ),
  );
  return warningKeys.length === 1 ? warningKeys[0] : null;
}

function parseSeverity(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) return numericValue;
  const normalizedValue = String(value).trim().toLowerCase();
  if (['critical', 'severe', 'high'].includes(normalizedValue)) return 3;
  if (['warning', 'medium'].includes(normalizedValue)) return 2;
  if (['watch', 'low'].includes(normalizedValue)) return 1;
  return 0;
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

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function parseCoordinates(value: unknown): [number, number] | undefined {
  const parsed = parseJsonValue(value);
  if (!Array.isArray(parsed) || parsed.length < 2) return undefined;
  const longitude = Number(parsed[0]);
  const latitude = Number(parsed[1]);
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return undefined;
  }
  return [longitude, latitude];
}

function parseAffectedAreas(value: unknown): TsunamiAffectedArea[] {
  const parsed = parseJsonValue(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap(area => {
    if (!area || typeof area !== 'object') return [];
    const record = area as Record<string, unknown>;
    const coordinates = parseCoordinates(record.coordinates);
    const name = String(record.name ?? '').trim();
    return coordinates && name ? [{ name, coordinates }] : [];
  });
}

function parseWaveFrames(value: unknown): TsunamiWaveFrame[] {
  const parsed = parseJsonValue(value);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .flatMap(frame => {
      if (!frame || typeof frame !== 'object') return [];
      const record = frame as Record<string, unknown>;
      const minutes = Number(record.minutes);
      const label = String(record.label ?? '').trim();
      return Number.isFinite(minutes) && minutes >= 0 && label
        ? [{ label, minutes }]
        : [];
    })
    .sort((first, second) => first.minutes - second.minutes);
}

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalString(value: unknown): string | undefined {
  return value === null || value === undefined || value === ''
    ? undefined
    : String(value);
}

export default function transformProps(chartProps: ChartProps) {
  const { width, height, formData, queriesData, hooks, emitCrossFilters } =
    chartProps;
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
    const title = String(row.title ?? '')
      .trim()
      .toLowerCase();
    const eventTime = String(row.event_time ?? '').trim();
    const warningKey = String(row.warning_key ?? '').trim();
    return {
      state_key: normalizeStateKey(rawValue) ?? '',
      raw_value: rawValue,
      ...(warningKey ? { warningKey } : {}),
      eventType: String(row.event_type ?? '')
        .trim()
        .toLowerCase(),
      ...(title ? { title } : {}),
      ...(eventTime ? { eventTime } : {}),
      metric:
        metricLabel || row.severity !== undefined
          ? parseSeverity(row[metricLabel ?? 'severity'])
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
    const warningKey = optionalString(row.warning_key);
    return [
      {
        ...(warningKey ? { warningKey } : {}),
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

  const tsunamis: TsunamiDataItem[] = rows.flatMap(row => {
    if (
      String(row.event_type ?? '')
        .trim()
        .toLowerCase() !== 'tsunami'
    ) {
      return [];
    }
    const earthquakeCoordinates = parseCoordinates(row.earthquake_coordinates);
    const affectedAreas = parseAffectedAreas(row.affected_areas);
    const waveFrames = parseWaveFrames(row.wave_frames);
    if (!earthquakeCoordinates || affectedAreas.length === 0) return [];
    return [
      {
        warningKey: optionalString(row.warning_key),
        stateName: optionalString(row[stateColumnLabel]),
        title: optionalString(row.title),
        eventTime: optionalString(row.event_time),
        validFrom: optionalString(row.valid_from),
        validTo: optionalString(row.valid_to),
        severity: parseSeverity(row.severity),
        expectedWaveHeightM: optionalNumber(row.expected_wave_height_m),
        instruction: optionalString(row.instruction),
        sourceName: optionalString(row.source_name),
        sourceUrl: optionalString(row.source_url),
        advisorySourceStatus: optionalString(row.advisory_source_status),
        earthquakeLocation: optionalString(row.earthquake_location),
        earthquakeCoordinates,
        affectedAreas,
        waveFrames:
          waveFrames.length > 0
            ? waveFrames
            : [{ label: 'Event time', minutes: 0 }],
      },
    ];
  });

  return {
    width,
    height,
    data,
    earthquakes,
    tsunamis,
    activeStateKey: deriveActiveStateKey(stateRows, stateColumnLabel),
    activeWarningKey: deriveActiveWarningKey(rows),
    stateColumn: stateColumnLabel,
    showDistrictBorders,
    sliceId,
    setDataMask: hooks.setDataMask,
    emitCrossFilters,
  };
}
