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
import { ChartProps } from '@superset-ui/core';
import { supersetTheme } from '@apache-superset/core/theme';
import transformProps, {
  calculateDurationHours,
} from '../../src/plugin/transformProps';

const formData = {
  colorScheme: 'bnbColors',
  datasource: '3__table',
  headerText: '24-hour hazard outlook',
  hazardColumn: 'hazard',
  severityColumn: 'risk_level',
  validFromColumn: 'starts_at',
  validToColumn: 'ends_at',
};
const chartProps = new ChartProps({
  formData,
  width: 800,
  height: 600,
  theme: supersetTheme,
  queriesData: [
    {
      from_dttm: Date.parse('2026-09-10T00:00:00Z'),
      data: [
        {
          hazard: 'Rainfall',
          starts_at: '2026-09-10T00:00:00Z',
          ends_at: '2026-09-10T06:30:00Z',
        },
      ],
    },
  ],
});

const chartPropsWithNativeDateFilter = new ChartProps({
  formData: {
    ...formData,
    extra_form_data: {
      filters: [{ col: 'Date', op: 'IN', val: ['2026-08-20'] }],
    },
  },
  width: 800,
  height: 600,
  theme: supersetTheme,
  queriesData: [{ data: [] }],
});

test('calculates duration_hours from the selected timestamp columns', () => {
  expect(transformProps(chartProps)).toEqual({
    width: 800,
    height: 600,
    forecastStartMilliseconds: Date.parse('2026-09-10T00:00:00Z'),
    headerText: '24-hour hazard outlook',
    hazardColumn: 'hazard',
    severityColumn: 'risk_level',
    validFromColumn: 'starts_at',
    validToColumn: 'ends_at',
    data: [
      {
        hazard: 'Rainfall',
        starts_at: '2026-09-10T00:00:00Z',
        ends_at: '2026-09-10T06:30:00Z',
        duration_hours: 6.5,
      },
    ],
  });
});

test('calculates hours from millisecond timestamps', () => {
  const start = 1_757_462_400_000;
  expect(calculateDurationHours(start, start + 24 * 60 * 60 * 1000)).toBe(24);
});

test('calculates hours from epoch-second timestamps', () => {
  expect(calculateDurationHours(1_757_462_400, 1_757_484_000)).toBe(6);
});

test('calculates hours from day-first dates without a time', () => {
  expect(calculateDurationHours('20-08-2026', '21-08-2026')).toBe(24);
});

test('returns null for missing, invalid, or reversed timestamps', () => {
  expect(calculateDurationHours(null, '2026-09-10T06:00:00Z')).toBeNull();
  expect(calculateDurationHours('invalid', '2026-09-10T06:00:00Z')).toBeNull();
  expect(
    calculateDurationHours('2026-09-10T12:00:00Z', '2026-09-10T06:00:00Z'),
  ).toBeNull();
});

test('uses a native Date filter when from_dttm is unavailable', () => {
  expect(
    transformProps(chartPropsWithNativeDateFilter).forecastStartMilliseconds,
  ).toBe(new Date(2026, 7, 20).getTime());
});
