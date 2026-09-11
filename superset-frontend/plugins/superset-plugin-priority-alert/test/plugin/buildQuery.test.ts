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
import buildQuery from '../../src/plugin/buildQuery';

const formData = {
  datasource: '5__table',
  viz_type: 'priority_alert',
  metrics: ['count'],
  row_limit: 100,
  time_range: '2026-09-07 : 2026-09-08',
};

test('uses Superset time filters for event_time', () => {
  const [query] = buildQuery({
    ...formData,
    cols: ['location', 'alert_id'],
  }).queries;
  expect(query.columns).toEqual([
    'warning_key',
    'title_en',
    'location',
    'event_date',
    'severity',
    'event_time',
    'alert_id',
  ]);
  expect(query.metrics).toEqual(['count']);
  expect(query.row_limit).toBe(100);
  expect(query.granularity).toBe('event_time');
  expect(query.time_range).toBe('2026-09-07 : 2026-09-08');
});

test('queries mapped columns and optional details without duplicate columns', () => {
  const title = {
    expressionType: 'SQL' as const,
    sqlExpression: 'UPPER(name)',
    label: 'alert_name',
  };
  const [query] = buildQuery({
    ...formData,
    title_column: title,
    location_column: 'district',
    event_date_column: 'issued_at',
    severity_column: 'level',
    type_column: 'hazard',
    description_column: 'message',
    cols: ['district', 'alert_id'],
  }).queries;
  expect(query.columns).toEqual([
    'warning_key',
    title,
    'district',
    'issued_at',
    'level',
    'hazard',
    'message',
    'event_time',
    'alert_id',
  ]);
  expect(query.granularity).toBe('event_time');
});

test('uses the selected temporal column for time filtering', () => {
  const [query] = buildQuery({
    ...formData,
    time_column: 'issued_timestamp',
  }).queries;

  expect(query.columns).toContain('issued_timestamp');
  expect(query.granularity).toBe('issued_timestamp');
  expect(query.time_range).toBe('2026-09-07 : 2026-09-08');
});

test('includes the sort columns in the query when selected', () => {
  const [query] = buildQuery({
    ...formData,
    order_by_cols: [
      JSON.stringify(['priority_score', false]),
      JSON.stringify(['location', true]),
    ],
  }).queries;
  expect(query.columns).toEqual([
    'warning_key',
    'title_en',
    'location',
    'event_date',
    'severity',
    'event_time',
    'priority_score',
  ]);
  expect(query.orderby).toEqual([
    ['priority_score', false],
    ['location', true],
  ]);
});
