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
import { renderSubtitleTemplate } from '../../src/utils/subtitleTemplate';

const valueMetric = {
  expressionType: 'SIMPLE' as const,
  column: { column_name: 'rainfall_total' },
  aggregate: 'SUM',
  label: 'SUM(rainfall_total)',
};

const makeChartProps = (
  formData: Record<string, unknown>,
  row: Record<string, unknown>,
) =>
  new ChartProps({
    formData: { datasource: '3__table', ...formData },
    width: 800,
    height: 600,
    theme: supersetTheme,
    queriesData: [{ data: [row] }],
  });

test('transformProps keeps the alert-summary look for legacy charts', () => {
  const chartProps = makeChartProps(
    {
      icon: '🌧️',
      title: 'Rainfall',
      value_column: valueMetric,
      severe_column: 'severe_count',
      warning_column: 'warning_count',
      watch_column: 'watch_count',
    },
    {
      'SUM(rainfall_total)': 12,
      severe_count: 0,
      warning_count: 5,
      watch_count: 4,
    },
  );

  expect(transformProps(chartProps)).toEqual({
    width: 800,
    height: 600,
    icon: '🌧️',
    title: 'Rainfall',
    value: 12,
    subtitle: '12 warning',
    subtitleStatus: 2,
    statusItems: [
      { label: 'Severe', status: 3, value: 0 },
      { label: 'Warning', status: 2, value: 5 },
      { label: 'Watch', status: 1, value: 4 },
    ],
    iconStyle: 'circle',
    valueColor: 'default',
    background: 'theme',
    showBorder: true,
    accentColor: undefined,
    accentTint: undefined,
  });
});

test('transformProps renders a compact card with a subtitle template', () => {
  const props = transformProps(
    makeChartProps(
      {
        title: 'Water Level Alert',
        value_column: 'alert_count',
        subtitle_template: '{value} live station alerts',
        derive_severity_subtitle: false,
        icon_style: 'dot',
        accent_color: { r: 59, g: 130, b: 246, a: 1 },
        background: 'transparent',
        show_border: false,
      },
      { alert_count: 17 },
    ),
  );

  expect(props).toMatchObject({
    value: 17,
    subtitle: '17 live station alerts',
    subtitleStatus: undefined,
    statusItems: [],
    iconStyle: 'dot',
    background: 'transparent',
    showBorder: false,
    accentColor: 'rgba(59, 130, 246, 1)',
    accentTint: 'rgba(59, 130, 246, 0.18)',
  });
});

test('transformProps leaves the subtitle empty when nothing is configured', () => {
  const props = transformProps(
    makeChartProps(
      {
        value_column: 'centers',
        derive_severity_subtitle: false,
        icon_style: 'square',
        value_color: 'accent',
      },
      { centers: 5 },
    ),
  );

  expect(props.subtitle).toBe('');
  expect(props.valueColor).toBe('accent');
});

test('renderSubtitleTemplate fills value and column placeholders', () => {
  expect(
    renderSubtitleTemplate('{value} of {total} ({missing})', 3, { total: 9 }),
  ).toBe('3 of 9 ({missing})');
});
