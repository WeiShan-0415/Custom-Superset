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
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'value_column',
            config: {
              ...singleColumnControl,
              label: t('Value column'),
              description: t('Column used for the large KPI value'),
            },
          },
        ],
        [
          {
            name: 'text_column',
            config: {
              ...singleColumnControl,
              label: t('Supporting text column'),
              description: t('Column displayed below the KPI value'),
            },
          },
        ],
        [
          {
            name: 'status_column',
            config: {
              ...singleColumnControl,
              label: t('Status color column'),
              validators: [],
              description: t(
                'Optional numeric column used for color: 3 red, 2 orange, 1 yellow, 0 green',
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
              default: 3,
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
      ],
    },
  ],
};

export default config;
