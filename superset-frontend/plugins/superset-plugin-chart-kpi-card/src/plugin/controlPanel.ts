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
  dndGroupByControl,
  sharedControls,
} from '@superset-ui/chart-controls';

const singleColumnControl = {
  ...dndGroupByControl,
  multi: false,
  freeForm: false,
  validators: [validateNonEmpty],
};

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Time'),
      expanded: true,
      description: t(
        'Use a temporal column derived from the day-first event date for dashboard filtering.',
      ),
      controlSetRows: [
        [
          {
            name: 'time_column',
            config: {
              ...singleColumnControl,
              label: t('Time filter column'),
              validators: [],
              description: t(
                'Optional temporal column used by the Superset time-range filter. Leave empty for datasets without a time column.',
              ),
              default: 'event_time',
            },
          },
        ],
        ['time_range'],
      ],
    },
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'value_column',
            config: {
              ...sharedControls.metric,
              label: t('Value column'),
              description: t(
                'Metric used for the large KPI value. Select a column and an aggregation such as SUM.',
              ),
            },
          },
        ],
        [
          {
            name: 'severe_column',
            config: {
              ...singleColumnControl,
              label: t('Severe count column'),
              validators: [],
              description: t('Column containing the Severe count'),
            },
          },
        ],
        [
          {
            name: 'warning_column',
            config: {
              ...singleColumnControl,
              label: t('Warning count column'),
              validators: [],
              description: t('Column containing the Warning count'),
            },
          },
        ],
        [
          {
            name: 'watch_column',
            config: {
              ...singleColumnControl,
              label: t('Watch count column'),
              validators: [],
              description: t('Column containing the Watch count'),
            },
          },
        ],
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
      label: t('Chart Options'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'title',
            config: {
              type: 'TextControl',
              default: 'KPI',
              renderTrigger: true,
              label: t('Title'),
              description: t('Title shown above the KPI value'),
            },
          },
        ],
        [
          {
            name: 'subtitle_template',
            config: {
              type: 'TextControl',
              default: '',
              renderTrigger: true,
              label: t('Subtitle'),
              description: t(
                'Text shown below the value. Use {value} for the KPI value or {column} for any queried column/metric label, e.g. "{value} live station alerts".',
              ),
            },
          },
        ],
        [
          {
            name: 'derive_severity_subtitle',
            config: {
              type: 'CheckboxControl',
              default: false,
              renderTrigger: true,
              label: t('Derive subtitle from severity counts'),
              description: t(
                'When the subtitle is empty, show "<value> <highest severity>" colored by the highest non-zero Severe/Warning/Watch count',
              ),
            },
          },
        ],
        [
          {
            name: 'icon',
            config: {
              type: 'TextControl',
              default: '📊',
              renderTrigger: true,
              label: t('Icon'),
              description: t(
                'Enter an emoji, short text symbol, or an image URL',
              ),
            },
          },
        ],
        [
          {
            name: 'icon_style',
            config: {
              type: 'SelectControl',
              default: 'circle',
              renderTrigger: true,
              clearable: false,
              label: t('Icon style'),
              description: t('How the icon is displayed next to the KPI'),
              choices: [
                ['circle', t('Circle')],
                ['square', t('Rounded square (accent tint)')],
                ['dot', t('Dot before title')],
                ['none', t('None')],
              ],
            },
          },
        ],
        [
          {
            name: 'accent_color',
            config: {
              type: 'ColorPickerControl',
              renderTrigger: true,
              label: t('Accent color'),
              description: t(
                'Color of the dot, icon tile and (optionally) the value. Defaults to the theme primary color.',
              ),
            },
          },
          {
            name: 'value_color',
            config: {
              type: 'SelectControl',
              default: 'default',
              renderTrigger: true,
              clearable: false,
              label: t('Value color'),
              choices: [
                ['default', t('Default text')],
                ['accent', t('Accent color')],
              ],
            },
          },
        ],
        [
          {
            name: 'background',
            config: {
              type: 'SelectControl',
              default: 'theme',
              renderTrigger: true,
              clearable: false,
              label: t('Background'),
              description: t(
                'Transparent lets the dashboard background show through the card',
              ),
              choices: [
                ['theme', t('Theme')],
                ['transparent', t('Transparent')],
              ],
            },
          },
          {
            name: 'show_border',
            config: {
              type: 'CheckboxControl',
              default: true,
              renderTrigger: true,
              label: t('Show border'),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
