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
import { render as renderComponent, screen } from '@testing-library/react';
import { ThemeProvider, supersetTheme } from '@apache-superset/core/theme';
import { DataRecord } from '@superset-ui/core';
import SupersetPluginPriorityAlert from '../src/SupersetPluginPriorityAlert';
import { SupersetPluginPriorityAlertProps } from '../src/types';

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
  sortColumn: 'event_date',
  sortOrder: 'desc',
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
      sortColumn="title_en"
      sortOrder="asc"
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
      sortColumn="title_en"
      sortOrder="desc"
    />,
  );
  const titles = Array.from(container.querySelectorAll('.alert-title')).map(
    el => el.textContent,
  );
  expect(titles).toEqual(['Zebra warning', 'Alpha warning']);
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
