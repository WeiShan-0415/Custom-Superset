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
import { t } from '@apache-superset/core/translation';
import { validateNonEmpty } from '@superset-ui/core';
import {
  ControlPanelConfig,
  sharedControls,
} from '@superset-ui/chart-controls';
import { incidentColumnDefaults } from './columns';

const singleColumnControl = {
  ...sharedControls.groupby,
  multi: false,
  freeForm: false,
};

const columnControls = [
  {
    name: 'warning_key_column',
    label: t('Warning key column'),
    description: t('Unique identifier shared with the Priority alerts chart.'),
    defaultValue: incidentColumnDefaults.warning_key_column,
  },
  {
    name: 'title_column',
    label: t('Incident title column'),
    description: t('Column containing the incident title.'),
    defaultValue: incidentColumnDefaults.title_column,
  },
  {
    name: 'location_column',
    label: t('Location column'),
    description: t('Column containing the incident location.'),
    defaultValue: incidentColumnDefaults.location_column,
  },
  {
    name: 'severity_column',
    label: t('Severity column'),
    description: t('Column used to color the title and location.'),
    defaultValue: incidentColumnDefaults.severity_column,
  },
  {
    name: 'description_column',
    label: t('Description column'),
    description: t('Column containing the incident description.'),
    defaultValue: incidentColumnDefaults.description_column,
  },
] as const;

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        ...columnControls.map(({ name, label, description, defaultValue }) => [
          {
            name,
            config: {
              ...singleColumnControl,
              label,
              description,
              default: defaultValue,
              validators: [validateNonEmpty],
            },
          },
        ]),
        ['adhoc_filters'],
        [
          {
            name: 'row_limit',
            config: {
              ...sharedControls.row_limit,
              default: 1,
            },
          },
        ],
      ],
    },
    {
      label: t('Chart options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'header_text',
            config: {
              type: 'TextControl',
              default: 'Selected incident',
              renderTrigger: true,
              label: t('Header text'),
              description: t('Heading displayed above the selected incident.'),
            },
          },
        ],
        [
          {
            name: 'bold_text',
            config: {
              type: 'CheckboxControl',
              label: t('Bold header'),
              renderTrigger: true,
              default: true,
            },
          },
        ],
        [
          {
            name: 'header_font_size',
            config: {
              type: 'SelectControl',
              label: t('Header font size'),
              default: 'fontSizeHeading4',
              choices: [
                ['fontSize', t('Normal')],
                ['fontSizeLG', t('Large')],
                ['fontSizeHeading5', t('Heading 5')],
                ['fontSizeHeading4', t('Heading 4')],
                ['fontSizeHeading3', t('Heading 3')],
              ],
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
