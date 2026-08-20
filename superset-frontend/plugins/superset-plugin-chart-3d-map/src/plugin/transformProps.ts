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
import { StateMapDataItem } from '../types';
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

  const data: StateMapDataItem[] = rows.map(row => {
    const rawValue = String(row[stateColumnLabel] ?? '');
    return {
      state_key: normalizeStateKey(rawValue) ?? '',
      raw_value: rawValue,
      metric: metricLabel ? Number(row[metricLabel] ?? 0) : undefined,
    };
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
    activeStateKey: deriveActiveStateKey(rows, stateColumnLabel),
    stateColumn: stateColumnLabel,
    showDistrictBorders,
    sliceId,
    setDataMask: hooks.setDataMask,
    emitCrossFilters,
  };
}
