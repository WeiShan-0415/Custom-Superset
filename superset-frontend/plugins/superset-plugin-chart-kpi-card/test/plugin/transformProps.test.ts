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
import { supersetTheme } from '@apache-superset/core/theme';
import { ChartProps } from '@superset-ui/core';
import transformProps from '../../src/plugin/transformProps';

test('transformProps maps controls and query data to the KPI card', () => {
  const formData = {
    datasource: '3__table',
    granularity_sqla: 'ds',
    icon: '🌧️',
    title: 'Rainfall',
    value_column: 'rainfall_total',
    text_column: 'severity_text',
    status_column: 'severity',
    severe_column: 'severe_count',
    warning_column: 'warning_count',
    watch_column: 'watch_count',
  };
  const chartProps = new ChartProps({
    formData,
    width: 800,
    height: 600,
    theme: supersetTheme,
    queriesData: [
      {
        data: [
          {
            rainfall_total: 12,
            severity_text: '3 severe',
            severity: 3,
            severe_count: 3,
            warning_count: 5,
            watch_count: 4,
          },
        ],
      },
    ],
  });

  expect(transformProps(chartProps)).toEqual({
    width: 800,
    height: 600,
    icon: '🌧️',
    title: 'Rainfall',
    valueColumn: 'rainfall_total',
    textColumn: 'severity_text',
    statusColumn: 'severity',
    severeColumn: 'severe_count',
    warningColumn: 'warning_count',
    watchColumn: 'watch_count',
    data: [
      {
        rainfall_total: 12,
        severity_text: '3 severe',
        severity: 3,
        severe_count: 3,
        warning_count: 5,
        watch_count: 4,
      },
    ],
  });
});
