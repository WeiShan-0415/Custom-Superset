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
  hazard_column: 'hazard_name',
  severity_column: 'risk_level',
  valid_from_column: 'starts_at',
  valid_to_column: 'ends_at',
  cols: ['hazard'],
  viz_type: 'hazard_risk_outlook',
};

test('includes both validity timestamps and additional columns', () => {
  const queryContext = buildQuery(formData);
  const [query] = queryContext.queries;

  expect(query.columns).toEqual([
    'hazard_name',
    'risk_level',
    'starts_at',
    'ends_at',
    'event_time',
    'hazard',
  ]);
  expect(query.metrics).toEqual([]);
  expect(query.granularity).toBe('event_time');
});

test('uses conventional validity column names by default', () => {
  const queryContext = buildQuery({
    datasource: '5__table',
    viz_type: 'hazard_risk_outlook',
  });
  const [query] = queryContext.queries;

  expect(query.columns).toEqual([
    'title',
    'severity',
    'valid_from',
    'valid_to',
    'event_time',
  ]);
});

test('applies the selected time range to event_time', () => {
  const queryContext = buildQuery({
    ...formData,
    time_range: '2026-08-20 : 2026-08-21',
  });

  expect(queryContext.queries).toHaveLength(1);
  expect(queryContext.queries[0].time_range).toBe('2026-08-20 : 2026-08-21');
  expect(queryContext.queries[0].granularity).toBe('event_time');
});
