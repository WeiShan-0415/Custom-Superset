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
import { buildOutlookRows } from '../src/SupersetPluginChartHazardRiskOutlook';
import { HazardRiskOutlookDataRecord } from '../src/types';

const now = Date.parse('2026-09-10T00:00:00Z');
const columns = {
  hazardColumn: 'hazard',
  severityColumn: 'severity',
  validFromColumn: 'valid_from',
  validToColumn: 'valid_to',
};

test('builds five six-hour outlook points for every hazard', () => {
  const data: HazardRiskOutlookDataRecord[] = [
    {
      hazard: 'Rainfall',
      severity: 'low',
      valid_from: '2026-09-10T00:00:00Z',
      valid_to: '2026-09-10T06:00:00Z',
      duration_hours: 6,
    },
    {
      hazard: 'Rainfall',
      severity: 'warning',
      valid_from: '2026-09-10T06:00:00Z',
      valid_to: '2026-09-11T00:00:00Z',
      duration_hours: 18,
    },
  ];

  expect(buildOutlookRows(data, now, columns)).toEqual([
    {
      hazard: 'Rainfall',
      cells: [
        { severity: 'low', severityLevel: 0 },
        { severity: 'warning', severityLevel: 2 },
        { severity: 'warning', severityLevel: 2 },
        { severity: 'warning', severityLevel: 2 },
        { severity: 'warning', severityLevel: 2 },
      ],
    },
  ]);
});

test('uses the highest overlapping severity and supports numeric levels', () => {
  const data: HazardRiskOutlookDataRecord[] = [
    {
      hazard: 'Flood',
      severity: 1,
      valid_from: '2026-09-10T00:00:00Z',
      valid_to: '2026-09-11T00:00:00Z',
      duration_hours: 24,
    },
    {
      hazard: 'Flood',
      severity: 4,
      valid_from: '2026-09-10T12:00:00Z',
      valid_to: '2026-09-10T18:00:00Z',
      duration_hours: 6,
    },
  ];

  expect(buildOutlookRows(data, now, columns)[0].cells).toEqual([
    { severity: '1', severityLevel: 1 },
    { severity: '1', severityLevel: 1 },
    { severity: '4', severityLevel: 3 },
    { severity: '1', severityLevel: 1 },
    { severity: '1', severityLevel: 1 },
  ]);
});

test('colors a window when an interval falls between checkpoint times', () => {
  const data: HazardRiskOutlookDataRecord[] = [
    {
      hazard: 'Thunderstorm',
      severity: 3,
      valid_from: '2026-09-10T01:00:00Z',
      valid_to: '2026-09-10T02:00:00Z',
      duration_hours: 1,
    },
  ];

  expect(buildOutlookRows(data, now, columns)[0].cells[0]).toEqual({
    severity: '3',
    severityLevel: 3,
  });
});

test('matches day-first validity dates without an hour', () => {
  const data: HazardRiskOutlookDataRecord[] = [
    {
      hazard: 'Strong Winds',
      severity: 1,
      valid_from: '17-08-2026',
      valid_to: '21-08-2026',
      duration_hours: 96,
    },
  ];

  const selectedDate = Date.parse('2026-08-20T00:00:00Z');
  expect(buildOutlookRows(data, selectedDate, columns)[0].cells[0]).toEqual({
    severity: '1',
    severityLevel: 1,
  });
});
