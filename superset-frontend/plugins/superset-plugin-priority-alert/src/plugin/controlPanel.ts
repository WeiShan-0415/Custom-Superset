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

import { alertColumnDefaults } from './columns';

const singleColumnControl = {
  ...sharedControls.groupby,
  multi: false,
  freeForm: false,
};

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Time'),
      expanded: true,
      description: t(
        'The time range filters the Today view using the selected event date column.',
      ),
      controlSetRows: [['time_range']],
    },
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'title_column',
            config: {
              ...singleColumnControl,
              label: t('Alert title column'),
              description: t('Column containing the alert title.'),
              default: alertColumnDefaults.title_column,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'location_column',
            config: {
              ...singleColumnControl,
              label: t('Location column'),
              description: t('Column containing the affected location.'),
              default: alertColumnDefaults.location_column,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'event_date_column',
            config: {
              ...singleColumnControl,
              label: t('Event date column'),
              description: t(
                'Date or timestamp filtered by the Superset time range and displayed on each alert.',
              ),
              default: alertColumnDefaults.event_date_column,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'severity_column',
            config: {
              ...singleColumnControl,
              label: t('Severity column'),
              description: t('Column used for the severity color and label.'),
              default: alertColumnDefaults.severity_column,
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'type_column',
            config: {
              ...singleColumnControl,
              label: t('Alert type column'),
              description: t(
                'Optional hazard type used to choose the icon. Uses the title when not selected.',
              ),
              default: alertColumnDefaults.type_column,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'description_column',
            config: {
              ...singleColumnControl,
              label: t('Description column'),
              description: t(
                'Optional details displayed when an alert is expanded.',
              ),
              default: alertColumnDefaults.description_column,
              validators: [],
            },
          },
        ],

        [
          {
            name: 'cols',
            config: {
              ...sharedControls.groupby,
              label: t('Additional columns'),
              description: t(
                'Optional extra columns, such as a unique alert identifier. Selected alert columns are included automatically.',
              ),
            },
          },
        ],
        [
          {
            name: 'sort_column',
            config: {
              ...singleColumnControl,
              label: t('Sort column'),
              description: t(
                'Column used to order the alert list. Defaults to the event date column.',
              ),
              default: null,
              validators: [],
            },
          },
        ],
        [
          {
            name: 'sort_order',
            config: {
              type: 'SelectControl',
              label: t('Sort order'),
              default: 'desc',
              choices: [
                ['asc', t('Ascending')],
                ['desc', t('Descending')],
              ],
              renderTrigger: true,
              description: t(
                'Order alerts ascending or descending by the sort column.',
              ),
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'row_limit',
            config: sharedControls.row_limit,
          },
        ],
      ],
    },
    {
      label: t('Alert options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'header_text',
            config: {
              type: 'TextControl',
              default: 'Priority alerts',
              renderTrigger: true,
              // ^ this makes it apply instantaneously, without triggering a "run query" button
              label: t('Header Text'),
              description: t('The text you want to see in the header'),
            },
          },
        ],
        [
          {
            name: 'bold_text',
            config: {
              type: 'CheckboxControl',
              label: t('Bold Text'),
              renderTrigger: true,
              default: true,
              description: t('Display a bold heading'),
            },
          },
        ],
        [
          {
            name: 'header_font_size',
            config: {
              type: 'SelectControl',
              label: t('Font Size'),
              default: 'fontSizeHeading4',
              choices: [
                // [value, label]
                ['fontSizeSM', 'xx-small'],
                ['fontSize', 'x-small'],
                ['fontSizeLG', 'small'],
                ['fontSizeHeading4', 'medium'],
                ['fontSizeHeading3', 'large'],
                ['fontSizeHeading2', 'x-large'],
                ['fontSizeHeading1', 'xx-large'],
              ],
              renderTrigger: true,
              description: t('The size of your header font'),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
