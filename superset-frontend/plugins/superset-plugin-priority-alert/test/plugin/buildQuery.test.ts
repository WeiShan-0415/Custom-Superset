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

test('uses Superset time filters for the event date column', () => {
  const [query] = buildQuery({
    ...formData,
    cols: ['location', 'alert_id'],
  }).queries;
  expect(query.columns).toEqual([
    'title_en',
    'location',
    'event_date',
    'severity',
    'alert_id',
  ]);
  expect(query.metrics).toEqual(['count']);
  expect(query.row_limit).toBe(100);
  expect(query.granularity).toBe('event_date');
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
    title,
    'district',
    'issued_at',
    'level',
    'hazard',
    'message',
    'alert_id',
  ]);
  expect(query.granularity).toBe('issued_at');
});

test('includes the sort column in the query when selected', () => {
  const [query] = buildQuery({
    ...formData,
    sort_column: 'priority_score',
  }).queries;
  expect(query.columns).toEqual([
    'title_en',
    'location',
    'event_date',
    'severity',
    'priority_score',
  ]);
});
