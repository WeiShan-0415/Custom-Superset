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
  DataRecord,
  DataRecordValue,
  getColumnLabel,
} from '@superset-ui/core';
import { SupersetPluginChartHazardRiskOutlookQueryFormData } from '../types';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const DAY_FIRST_DATE_PATTERN =
  /^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T](\d{1,2})(?::(\d{2})(?::(\d{2}))?)?)?$/;
const ISO_DATE_ONLY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function localTimestamp(
  year: string,
  month: string,
  day: string,
  hour = '0',
  minute = '0',
  second = '0',
) {
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return parsedDate.getFullYear() === Number(year) &&
    parsedDate.getMonth() === Number(month) - 1 &&
    parsedDate.getDate() === Number(day)
    ? parsedDate.getTime()
    : Number.NaN;
}

function dayFirstTimestamp(value: string) {
  const match = DAY_FIRST_DATE_PATTERN.exec(value.trim());
  if (!match) {
    return Number.NaN;
  }
  const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
  return localTimestamp(year, month, day, hour, minute, second);
}

function timestampMilliseconds(value: DataRecordValue | undefined) {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return Number.NaN;
  }
  const isoDateOnly = ISO_DATE_ONLY_PATTERN.exec(value.trim());
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    return localTimestamp(year, month, day);
  }
  const dayFirstValue = dayFirstTimestamp(value);
  return Number.isFinite(dayFirstValue) ? dayFirstValue : Date.parse(value);
}

function filterValueMilliseconds(value: unknown): number {
  if (Array.isArray(value)) {
    return filterValueMilliseconds(value[0]);
  }
  if (typeof value === 'string') {
    const [rangeStart] = value.split(/\s+:\s+/);
    return timestampMilliseconds(rangeStart);
  }
  if (typeof value === 'number' || value instanceof Date) {
    return timestampMilliseconds(value);
  }
  return Number.NaN;
}

interface NativeFilterClause {
  col?: unknown;
  comparator?: unknown;
  op?: unknown;
  operator?: unknown;
  subject?: unknown;
  val?: unknown;
}

interface DashboardFilterFormData {
  adhocFilters?: NativeFilterClause[];
  extraFormData?: {
    filters?: NativeFilterClause[];
    timeRange?: unknown;
  };
  timeRange?: unknown;
}

function dashboardFilterMilliseconds(
  formData: DashboardFilterFormData,
  filterStateValue: unknown,
) {
  const extraFilters = formData.extraFormData?.filters ?? [];
  const adhocFilters = formData.adhocFilters ?? [];
  const clauses = [...extraFilters, ...adhocFilters];
  const preferredClauses = clauses.filter(clause =>
    /date|time|temporal/i.test(
      `${String(clause.col ?? clause.subject ?? '')} ${String(
        clause.op ?? clause.operator ?? '',
      )}`,
    ),
  );
  const candidateValues = [
    formData.timeRange,
    formData.extraFormData?.timeRange,
    ...preferredClauses.map(clause => clause.val ?? clause.comparator),
    filterStateValue,
    ...clauses.map(clause => clause.val ?? clause.comparator),
  ];

  return candidateValues.map(filterValueMilliseconds).find(Number.isFinite);
}

export function calculateDurationHours(
  validFrom: DataRecordValue | undefined,
  validTo: DataRecordValue | undefined,
): number | null {
  const validFromMilliseconds = timestampMilliseconds(validFrom);
  const validToMilliseconds = timestampMilliseconds(validTo);
  const durationMilliseconds = validToMilliseconds - validFromMilliseconds;

  if (!Number.isFinite(durationMilliseconds) || durationMilliseconds < 0) {
    return null;
  }

  return Number((durationMilliseconds / MILLISECONDS_PER_HOUR).toFixed(2));
}

export default function transformProps(chartProps: ChartProps) {
  /**
   * This function is called after a successful response has been
   * received from the chart data endpoint, and is used to transform
   * the incoming data prior to being sent to the Visualization.
   *
   * The transformProps function is also quite useful to return
   * additional/modified props to your data viz component. The formData
   * can also be accessed from your SupersetPluginChartHazardRiskOutlook.tsx file, but
   * doing supplying custom props here is often handy for integrating third
   * party libraries that rely on specific props.
   *
   * A description of properties in `chartProps`:
   * - `height`, `width`: the height/width of the DOM element in which
   *   the chart is located
   * - `formData`: the chart data request payload that was sent to the
   *   backend.
   * - `queriesData`: the chart data response payload that was received
   *   from the backend. Some notable properties of `queriesData`:
   *   - `data`: an array with data, each row with an object mapping
   *     the column/alias to its value. Example:
   *     `[{ col1: 'abc', metric1: 10 }, { col1: 'xyz', metric1: 20 }]`
   *   - `rowcount`: the number of rows in `data`
   *   - `query`: the query that was issued.
   *
   * Please note: the transformProps function gets cached when the
   * application loads. When making changes to the `transformProps`
   * function during development with hot reloading, changes won't
   * be seen until restarting the development server.
   */
  const { width, height, queriesData } = chartProps;
  const formData =
    chartProps.formData as SupersetPluginChartHazardRiskOutlookQueryFormData;
  const { headerText = '24-hour hazard outlook' } = formData;
  const hazardColumn = getColumnLabel(
    formData.hazardColumn ?? formData.hazard_column ?? 'title',
  );
  const severityColumn = getColumnLabel(
    formData.severityColumn ?? formData.severity_column ?? 'severity',
  );
  const validFromColumn = getColumnLabel(
    formData.validFromColumn ?? formData.valid_from_column ?? 'valid_from',
  );
  const validToColumn = getColumnLabel(
    formData.validToColumn ?? formData.valid_to_column ?? 'valid_to',
  );
  const queryResult = queriesData[0];
  const queryData = (queryResult?.data ?? []) as DataRecord[];
  const resolvedFilterStart = timestampMilliseconds(
    queryResult?.from_dttm as DataRecordValue | undefined,
  );
  const nativeFilterStart = dashboardFilterMilliseconds(
    formData as DashboardFilterFormData,
    chartProps.filterState?.value,
  );
  const forecastStartMilliseconds = Number.isFinite(resolvedFilterStart)
    ? resolvedFilterStart
    : (nativeFilterStart ?? Date.now());
  const data = queryData.map(row => ({
    ...row,
    duration_hours: calculateDurationHours(
      row[validFromColumn],
      row[validToColumn],
    ),
  }));

  return {
    width,
    height,
    data,
    forecastStartMilliseconds,
    headerText,
    hazardColumn,
    severityColumn,
    validFromColumn,
    validToColumn,
  };
}
