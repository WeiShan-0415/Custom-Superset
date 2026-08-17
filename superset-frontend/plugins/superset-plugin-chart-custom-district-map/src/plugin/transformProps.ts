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
import {
  ChartProps,
  QueryFormColumn,
  getColumnLabel,
  getMetricLabel,
} from '@superset-ui/core';
import { DistrictMapDataItem } from '../types';
import { inferStateKeyFromDistricts, normalizeStateKey } from '../districts';

// When a state column is configured and the (possibly dashboard-filtered)
// query result contains rows for exactly one state, use that state's map
// instead of the chart's manually-selected default. Multiple distinct
// states (e.g. no filter applied yet) is ambiguous, so falls back to the
// default in that case.
function deriveStateFromRows(
  rows: Record<string, unknown>[],
  stateColumn: QueryFormColumn | undefined,
): string | undefined {
  if (!stateColumn) return undefined;
  const stateLabel = getColumnLabel(stateColumn);
  const values = Array.from(
    new Set(
      rows.map(row => String(row[stateLabel] ?? '').trim()).filter(Boolean),
    ),
  );
  if (values.length !== 1) return undefined;
  return normalizeStateKey(values[0]);
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
  const {
    selectState,
    stateColumn,
    entity,
    metric,
    linearColorScheme,
    numberFormat,
    showDistrictLabels,
    sliceId,
  } = formData;

  const entityLabel = getColumnLabel(entity);
  const metricLabel = getMetricLabel(metric);
  const rows = (queriesData[0].data ?? []) as Record<string, unknown>[];

  const data: DistrictMapDataItem[] = rows.map(row => ({
    district_id: String(row[entityLabel] ?? ''),
    metric: Number(row[metricLabel] ?? 0),
  }));

  const dataState = deriveStateFromRows(rows, stateColumn);
  const districtState = inferStateKeyFromDistricts(
    data.map(({ district_id: districtId }) => districtId),
  );

  return {
    width,
    height,
    data,
    selectState: dataState ?? districtState ?? selectState,
    entity: entityLabel,
    linearColorScheme,
    numberFormat,
    showDistrictLabels,
    sliceId,
    setDataMask: hooks.setDataMask,
    filterState,
    emitCrossFilters,
  };
}
