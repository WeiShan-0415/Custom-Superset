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
import { QueryFormMetric } from '@superset-ui/core';
import buildQuery from '../../src/plugin/buildQuery';

test('buildQuery aggregates the KPI value and groups by supporting columns', () => {
  const valueMetric: QueryFormMetric = {
    expressionType: 'SIMPLE',
    column: { column_name: 'rainfall_total' },
    aggregate: 'SUM',
    label: 'SUM(rainfall_total)',
  };
  const formData = {
    datasource: '5__table',
    granularity_sqla: 'ds',
    time_column: 'event_time',
    value_column: valueMetric,
    text_column: 'severity_text',
    status_column: 'severity',
    severe_column: 'severe_count',
    warning_column: 'warning_count',
    watch_column: 'watch_count',
    viz_type: 'my_chart',
  };

  const queryContext = buildQuery(formData);
  const [query] = queryContext.queries;

  expect(query.columns).toEqual([]);
  expect(query.granularity).toBe('event_time');
  expect(query.metrics).toEqual([
    valueMetric,
    expect.objectContaining({ aggregate: 'SUM', label: 'severe_count' }),
    expect.objectContaining({ aggregate: 'SUM', label: 'warning_count' }),
    expect.objectContaining({ aggregate: 'SUM', label: 'watch_count' }),
  ]);
});

test('buildQuery treats a legacy value column as a SUM metric', () => {
  const queryContext = buildQuery({
    datasource: '5__table',
    value_column: 'no_case',
    viz_type: 'kpi_card',
  });

  expect(queryContext.queries[0].metrics).toEqual([
    expect.objectContaining({
      aggregate: 'SUM',
      column: { column_name: 'no_case' },
      label: 'no_case',
    }),
  ]);
  expect(queryContext.queries[0].granularity).toBe('event_time');
});

test('buildQuery applies the time range to the selected temporal column', () => {
  const queryContext = buildQuery({
    datasource: '5__table',
    time_column: 'parsed_event_date',
    time_range: '2026-08-20 : 2026-08-21',
    value_column: 'alert_count',
    viz_type: 'kpi_card',
  });
  const [query] = queryContext.queries;

  expect(query.granularity).toBe('parsed_event_date');
  expect(query.time_range).toBe('2026-08-20 : 2026-08-21');
  expect(query.columns).toEqual([]);
});
