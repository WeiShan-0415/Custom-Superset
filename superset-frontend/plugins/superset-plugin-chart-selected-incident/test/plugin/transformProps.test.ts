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

test('maps configured columns and detects a warning key selection', () => {
  const result = transformProps(
    new ChartProps({
      width: 800,
      height: 600,
      theme: supersetTheme,
      formData: {
        datasource: '3__table',
        viz_type: 'selected_incident',
        boldText: true,
        headerFontSize: 'fontSizeHeading4',
        headerText: 'Selected incident',
        warning_key_column: 'alert_id',
        title_column: 'name',
        location_column: 'district',
        severity_column: 'level',
        description_column: 'message',
        extra_form_data: {
          filters: [{ col: 'alert_id', op: 'IN', val: ['warning-1'] }],
        },
      },
      queriesData: [
        {
          data: [
            {
              alert_id: 'warning-1',
              name: 'Severe rainfall',
              district: 'Kota Bharu',
              level: 'critical',
              message: 'Heavy rain expected.',
            },
          ],
        },
      ],
    }),
  );

  expect(result).toMatchObject({
    width: 800,
    height: 600,
    boldText: true,
    headerFontSize: 'fontSizeHeading4',
    headerText: 'Selected incident',
    hasSelection: true,
    data: [
      {
        warning_key: 'warning-1',
        title_en: 'Severe rainfall',
        location: 'Kota Bharu',
        severity: 'critical',
        description: 'Heavy rain expected.',
      },
    ],
  });
});

test('does not select an arbitrary row without a warning key filter', () => {
  const result = transformProps(
    new ChartProps({
      theme: supersetTheme,
      formData: {
        datasource: '3__table',
        viz_type: 'selected_incident',
      },
      queriesData: [{ data: [{ warning_key: 'warning-1' }] }],
    }),
  );

  expect(result.hasSelection).toBe(false);
});
