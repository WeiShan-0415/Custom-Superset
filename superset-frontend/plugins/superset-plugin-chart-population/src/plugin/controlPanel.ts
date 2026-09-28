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

const dimensionControl = {
  ...dndGroupByControl,
  multi: false,
  freeForm: false,
  validators: [validateNonEmpty],
};

const metricControl = {
  ...sharedControls.metric,
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
            name: 'state_column',
            config: {
              ...dimensionControl,
              label: t('State column'),
              description: t(
                'Column containing the Malaysian state or federal territory.',
              ),
            },
          },
          {
            name: 'district_column',
            config: {
              ...dimensionControl,
              label: t('District column'),
              description: t('Column containing the district name.'),
            },
          },
        ],
        [
          {
            name: 'population_metric',
            config: {
              ...metricControl,
              label: t('Population'),
              description: t(
                'SUM of the population column. Values are displayed multiplied by 1,000.',
              ),
            },
          },
        ],
        [
          {
            name: 'children_metric',
            config: {
              ...metricControl,
              label: t('Children (1–19)'),
              description: t(
                'SUM of the table column containing the population aged 1–19.',
              ),
            },
          },
          {
            name: 'adult_metric',
            config: {
              ...metricControl,
              label: t('Adults (20–59)'),
              description: t(
                'SUM of the table column containing the population aged 20–59.',
              ),
            },
          },
        ],
        [
          {
            name: 'elderly_metric',
            config: {
              ...metricControl,
              label: t('Elderly (60+)'),
              description: t(
                'SUM of the table column containing the population aged 60 and above.',
              ),
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'row_limit',
            config: {
              ...sharedControls.row_limit,
              description: t(
                'Maximum number of district rows returned. Set this high enough to include every district.',
              ),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
