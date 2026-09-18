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
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, supersetTheme } from '@apache-superset/core/theme';
import SupersetPluginChartSelectedIncident from '../src/SupersetPluginChartSelectedIncident';
import { SupersetPluginChartSelectedIncidentProps } from '../src/types';

const props: SupersetPluginChartSelectedIncidentProps = {
  width: 600,
  height: 300,
  headerText: 'Selected incident',
  headerFontSize: 'fontSizeHeading4',
  boldText: true,
  hasSelection: false,
  data: [],
};

function renderChart(
  overrides: Partial<SupersetPluginChartSelectedIncidentProps>,
) {
  return render(
    <ThemeProvider theme={supersetTheme}>
      <SupersetPluginChartSelectedIncident {...props} {...overrides} />
    </ThemeProvider>,
  );
}

test('prompts for an incident before a warning key is selected', () => {
  renderChart({});
  expect(
    screen.getByText('Select an incident from Priority alerts'),
  ).toBeInTheDocument();
});

test('renders the selected incident using its severity color', () => {
  renderChart({
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

  const heading = screen.getByRole('heading', {
    name: 'Severe rainfall — Kota Bharu',
  });
  expect(heading).toHaveStyle({ color: '#cf1322' });
  expect(screen.getByText('Heavy rain expected.')).toBeInTheDocument();
});
