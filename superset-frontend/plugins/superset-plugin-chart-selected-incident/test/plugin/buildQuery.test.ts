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

test('queries the fields required by the selected incident card', () => {
  const [query] = buildQuery({
    datasource: '5__table',
    viz_type: 'selected_incident',
    row_limit: 1,
  }).queries;

  expect(query.columns).toEqual([
    'warning_key',
    'title_en',
    'location',
    'severity',
    'description',
  ]);
  expect(query.row_limit).toBe(1);
});

test('queries mapped dataset columns without duplicates', () => {
  const title = {
    expressionType: 'SQL' as const,
    sqlExpression: 'UPPER(name)',
    label: 'incident_name',
  };
  const [query] = buildQuery({
    datasource: '5__table',
    viz_type: 'selected_incident',
    warning_key_column: 'alert_id',
    title_column: title,
    location_column: 'district',
    severity_column: 'level',
    description_column: 'message',
    cols: ['district'],
  }).queries;

  expect(query.columns).toEqual([
    'alert_id',
    title,
    'district',
    'level',
    'message',
  ]);
});
