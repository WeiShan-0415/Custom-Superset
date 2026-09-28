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
import transformProps from '../../src/plugin/transformProps';

const baseFormData = {
  datasource: '3__table',
  vizType: 'ext-population',
  stateColumn: 'state',
  districtColumn: 'district',
  populationMetric: 'population',
  childrenMetric: 'children',
  adultMetric: 'adults',
  elderlyMetric: 'elderly',
};

function makeChartProps(
  data: Record<string, unknown>[],
  formData: Record<string, unknown> = baseFormData,
) {
  return new ChartProps({
    formData,
    width: 800,
    height: 600,
    theme: supersetTheme,
    queriesData: [{ data }],
  });
}

test('shows Malaysia totals and no districts without a state filter', () => {
  const result = transformProps(
    makeChartProps([
      {
        state: 'Johor',
        district: 'Johor Bahru',
        population: 120,
        children: 30,
        adults: 75,
        elderly: 10,
      },
      {
        state: 'Selangor',
        district: 'Petaling',
        population: 180,
        children: 40,
        adults: 110,
        elderly: 20,
      },
    ]),
  );

  expect(result).toMatchObject({
    width: 800,
    height: 600,
    location: 'Malaysia',
    totalPeople: 300000,
    districts: [],
    hasStateFilter: false,
  });
  expect(result.categories).toEqual([
    {
      key: 'children',
      label: 'Children',
      ageRange: '1–19',
      value: 70000,
      percentage: (70000 / 300000) * 100,
    },
    {
      key: 'adults',
      label: 'Adults',
      ageRange: '20–59',
      value: 185000,
      percentage: (185000 / 300000) * 100,
    },
    {
      key: 'elderly',
      label: 'Elderly',
      ageRange: '60+',
      value: 30000,
      percentage: 10,
    },
  ]);
});

test('shows sorted districts when a state filter resolves to one state', () => {
  const result = transformProps(
    makeChartProps(
      [
        {
          state: 'Johor',
          district: 'Pontian',
          population: '80',
          children: 20,
          adults: 50,
          elderly: 8,
        },
        {
          state: 'Johor',
          district: 'Johor Bahru',
          population: '120',
          children: 30,
          adults: 75,
          elderly: 10,
        },
      ],
      {
        ...baseFormData,
        extraFormData: {
          filters: [{ col: 'state', op: 'IN', val: ['Johor'] }],
        },
      },
    ),
  );

  expect(result).toMatchObject({
    location: 'Johor',
    totalPeople: 200000,
    hasStateFilter: true,
    districts: [
      { name: 'Johor Bahru', value: 120000, percentage: 60 },
      { name: 'Pontian', value: 80000, percentage: 40 },
    ],
  });
});
