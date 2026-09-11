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
import { ReactElement } from 'react';
import '@testing-library/jest-dom';
import {
  fireEvent,
  render as renderComponent,
  screen,
} from '@testing-library/react';
import { ThemeProvider, supersetTheme } from '@apache-superset/core/theme';
import { DataRecord } from '@superset-ui/core';
import SupersetPluginPriorityAlert, {
  calculatePageSize,
} from '../src/SupersetPluginPriorityAlert';
import { SupersetPluginPriorityAlertProps } from '../src/types';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/** Render with the chart theme without depending on application test helpers. */
function render(component: ReactElement) {
  return renderComponent(
    <ThemeProvider theme={supersetTheme}>{component}</ThemeProvider>,
  );
}

const today = new Date();
today.setHours(14, 28, 0, 0);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const allAlerts: DataRecord[] = [
  {
    warning_key: 'warning-1',
    title_en: 'Severe rainfall',
    location: 'Kota Bharu, Kelantan',
    event_date: today.toISOString(),
    severity: 'critical',
    description: 'Heavy rain expected.',
  },
  {
    title_en: 'Flash flood warning',
    location: 'Klang, Selangor',
    event_date: yesterday.toISOString(),
    severity: 'warning',
    description: null,
  },
  {
    title_en: 'Undated alert',
    location: null,
    event_date: 'invalid',
    severity: 'watch',
    description: null,
  },
];

const props: SupersetPluginPriorityAlertProps = {
  width: 470,
  height: 500,
  headerText: 'Priority alerts',
  headerFontSize: 'fontSizeHeading4' as const,
  boldText: true,
  emitCrossFilters: false,
  selectedWarningKeys: [],
  setDataMask: jest.fn(),
  sortColumns: [{ field: 'event_date', ascending: false }],
  warningKeyColumn: 'warning_key',
  data: [allAlerts[0]],
};

test('displays the rows returned by the Superset time filter', () => {
  render(<SupersetPluginPriorityAlert {...props} />);
  expect(screen.getByText('Severe rainfall')).toBeInTheDocument();
  expect(screen.getByText('Kota Bharu, Kelantan')).toBeInTheDocument();
  expect(screen.getByText('14:28')).toBeInTheDocument();
  expect(screen.queryByText('Flash flood warning')).not.toBeInTheDocument();
  expect(screen.queryByText('Undated alert')).not.toBeInTheDocument();
  expect(
    screen.getByText('Heavy rain expected.').closest('details'),
  ).not.toHaveAttribute('open');
});

test('empty query results have a useful message', () => {
  render(<SupersetPluginPriorityAlert {...props} data={[]} />);
  expect(screen.getByText('No alerts today')).toBeInTheDocument();
});

test('calculates page size from the available chart height', () => {
  expect(calculatePageSize(100)).toBe(1);
  expect(calculatePageSize(500)).toBe(4);
  expect(calculatePageSize(650)).toBe(7);
});

test('creates tabs from event types and filters alerts by the selected tab', () => {
  const data: DataRecord[] = [
    {
      title_en: 'Heavy rain',
      event_type: 'weather_warning',
      event_date: today.toISOString(),
    },
    {
      title_en: 'Ground shaking',
      event_type: 'earthquake',
      event_date: today.toISOString(),
    },
    {
      title_en: 'Missing category',
      event_date: today.toISOString(),
    },
  ];

  render(<SupersetPluginPriorityAlert {...props} data={data} />);

  expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: 'Weather Warning' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Earthquake' })).toBeInTheDocument();
  expect(screen.getByText('Heavy rain')).toBeInTheDocument();
  expect(screen.getByText('Ground shaking')).toBeInTheDocument();
  expect(screen.getByText('Missing category')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: 'Weather Warning' }));

  expect(screen.getByText('Heavy rain')).toBeInTheDocument();
  expect(screen.queryByText('Ground shaking')).not.toBeInTheDocument();
  expect(screen.queryByText('Missing category')).not.toBeInTheDocument();
});

test('shows more than five alerts when the chart has enough height', () => {
  const data = Array.from({ length: 8 }, (_, index) => ({
    warning_key: `warning-${index + 1}`,
    title_en: `Alert ${index + 1}`,
    event_date: today.toISOString(),
    severity: 'warning',
  }));

  render(<SupersetPluginPriorityAlert {...props} data={data} height={650} />);

  expect(screen.getByText('Alert 7')).toBeInTheDocument();
  expect(screen.queryByText('Alert 8')).not.toBeInTheDocument();
});

test('sorts by event date by default', () => {
  const data: DataRecord[] = [
    {
      title_en: 'Old critical',
      event_date: yesterday.toISOString(),
      severity: 'critical',
    },
    {
      title_en: 'New warning',
      event_date: today.toISOString(),
      severity: 'warning',
    },
  ];
  const { container } = render(
    <SupersetPluginPriorityAlert {...props} data={data} />,
  );
  const titles = Array.from(container.querySelectorAll('.alert-title')).map(
    el => el.textContent,
  );
  expect(titles).toEqual(['New warning', 'Old critical']);
});

test('sorts ascending by the selected column', () => {
  const data: DataRecord[] = [
    { title_en: 'Zebra warning', event_date: today.toISOString() },
    { title_en: 'Alpha warning', event_date: yesterday.toISOString() },
  ];
  const { container } = render(
    <SupersetPluginPriorityAlert
      {...props}
      data={data}
      sortColumns={[{ field: 'title_en', ascending: true }]}
    />,
  );
  const titles = Array.from(container.querySelectorAll('.alert-title')).map(
    el => el.textContent,
  );
  expect(titles).toEqual(['Alpha warning', 'Zebra warning']);
});

test('sorts descending by the selected column', () => {
  const data: DataRecord[] = [
    { title_en: 'Zebra warning', event_date: today.toISOString() },
    { title_en: 'Alpha warning', event_date: yesterday.toISOString() },
  ];
  const { container } = render(
    <SupersetPluginPriorityAlert
      {...props}
      data={data}
      sortColumns={[{ field: 'title_en', ascending: false }]}
    />,
  );
  const titles = Array.from(container.querySelectorAll('.alert-title')).map(
    el => el.textContent,
  );
  expect(titles).toEqual(['Zebra warning', 'Alpha warning']);
});

test('sorts by a second column to break ties in the first', () => {
  const data: DataRecord[] = [
    {
      title_en: 'Zebra warning',
      event_date: today.toISOString(),
      severity: 'watch',
    },
    {
      title_en: 'Alpha warning',
      event_date: today.toISOString(),
      severity: 'critical',
    },
  ];
  const { container } = render(
    <SupersetPluginPriorityAlert
      {...props}
      data={data}
      sortColumns={[
        { field: 'event_date', ascending: false },
        { field: 'severity', ascending: true },
      ]}
    />,
  );
  const titles = Array.from(container.querySelectorAll('.alert-title')).map(
    el => el.textContent,
  );
  expect(titles).toEqual(['Alpha warning', 'Zebra warning']);
});

test('renders date-only events returned by the Superset time filter', () => {
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  render(
    <SupersetPluginPriorityAlert
      {...props}
      data={[{ title_en: 'Date-only alert', event_date: localDate }]}
    />,
  );
  expect(screen.getByText('Date-only alert')).toBeInTheDocument();
});

test('cross-filters the dashboard by warning key when an alert is clicked', () => {
  const setDataMask = jest.fn();
  render(
    <SupersetPluginPriorityAlert
      {...props}
      emitCrossFilters
      setDataMask={setDataMask}
    />,
  );

  fireEvent.click(screen.getByText('Severe rainfall'));

  expect(setDataMask).toHaveBeenCalledWith({
    extraFormData: {
      filters: [{ col: 'warning_key', op: 'IN', val: ['warning-1'] }],
    },
    filterState: {
      value: ['warning-1'],
      selectedValues: ['warning-1'],
    },
  });
});
