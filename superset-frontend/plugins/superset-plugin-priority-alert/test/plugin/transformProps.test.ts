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

describe('SupersetPluginPriorityAlert transformProps', () => {
  const formData = {
    colorScheme: 'bnbColors',
    datasource: '3__table',
    granularity_sqla: 'ds',
    metric: 'sum__num',
    series: 'name',
    boldText: true,
    headerFontSize: 'xs',
    headerText: 'my text',
  };
  const chartProps = new ChartProps({
    formData,
    width: 800,
    height: 600,
    theme: supersetTheme,
    queriesData: [
      {
        data: [{ name: 'Hulk', sum__num: 1 }],
      },
    ],
  });

  test('should transform chart props for viz', () => {
    expect(transformProps(chartProps)).toEqual({
      width: 800,
      height: 600,
      boldText: true,
      headerFontSize: 'xs',
      headerText: 'my text',
      data: [{ name: 'Hulk', sum__num: 1 }],
      sortColumn: 'event_date',
      sortOrder: 'desc',
    });
  });
});

test('maps selected columns and SQL expression labels to alert fields', () => {
  const result = transformProps(
    new ChartProps({
      theme: supersetTheme,
      formData: {
        datasource: '3__table',
        viz_type: 'priority_alert',
        title_column: {
          expressionType: 'SQL',
          sqlExpression: 'UPPER(name)',
          label: 'alert_name',
        },
        location_column: 'district',
        event_date_column: 'issued_at',
        severity_column: 'level',
        type_column: 'hazard',
        description_column: 'message',
      },
      queriesData: [
        {
          data: [
            {
              alert_name: 'WIND WARNING',
              district: 'Klang',
              issued_at: '2026-09-07T14:00:00+08:00',
              level: 'warning',
              hazard: 'strong winds',
              message: 'Avoid the coast.',
            },
          ],
        },
      ],
    }),
  );
  expect(result.data[0]).toMatchObject({
    title_en: 'WIND WARNING',
    location: 'Klang',
    event_date: '2026-09-07T14:00:00+08:00',
    severity: 'warning',
    type: 'strong winds',
    description: 'Avoid the coast.',
  });
});

test('resolves the sort column and order from the sort controls', () => {
  const result = transformProps(
    new ChartProps({
      theme: supersetTheme,
      formData: {
        datasource: '3__table',
        viz_type: 'priority_alert',
        sort_column: 'district',
        sort_order: 'asc',
      },
      queriesData: [{ data: [] }],
    }),
  );
  expect(result.sortColumn).toBe('district');
  expect(result.sortOrder).toBe('asc');
});

test('handles an empty query response', () => {
  expect(
    transformProps(new ChartProps({ theme: supersetTheme })),
  ).toMatchObject({ data: [] });
});
