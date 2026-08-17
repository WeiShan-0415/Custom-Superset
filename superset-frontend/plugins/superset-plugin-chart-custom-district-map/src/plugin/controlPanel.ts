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
  D3_FORMAT_OPTIONS,
  D3_FORMAT_DOCS,
  dndGroupByControl,
  getStandardizedControls,
} from '@superset-ui/chart-controls';
import { stateOptions } from '../districts';

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
              ...dndGroupByControl,
              label: t('State column'),
              multi: false,
              freeForm: false,
              validators: [],
              description: t(
                'Optional. Column containing the state name (e.g. "Selangor", "Kuala Lumpur"). ' +
                  'When set and a dashboard filter (or the query itself) narrows the data down ' +
                  "to a single state, that state's map is shown automatically instead of the " +
                  'default below.',
              ),
            },
          },
        ],
        [
          {
            name: 'select_state',
            config: {
              type: 'SelectControl',
              label: t('Default state'),
              default: 'selangor',
              choices: stateOptions,
              description: t(
                'Which Malaysian state to plot when the state column above is unset, or the ' +
                  'data spans more than one state.',
              ),
              validators: [validateNonEmpty],
            },
          },
        ],
        ['entity'],
        ['metric'],
        ['adhoc_filters'],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'show_district_labels',
            config: {
              type: 'CheckboxControl',
              label: t('Show district names'),
              renderTrigger: true,
              default: true,
              description: t('Label each district with its name on the map'),
            },
          },
        ],
        [
          {
            name: 'number_format',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: t('Number format'),
              renderTrigger: true,
              default: 'SMART_NUMBER',
              choices: D3_FORMAT_OPTIONS,
              description: D3_FORMAT_DOCS,
            },
          },
        ],
        ['linear_color_scheme'],
      ],
    },
  ],
  controlOverrides: {
    entity: {
      label: t('District'),
      description: t(
        'Column containing the district name in your table. Values should match the ' +
          "district names shown on the map (e.g. 'Petaling', 'Kuching').",
      ),
    },
    metric: {
      label: t('Metric'),
      description: t('Metric used to color each district'),
    },
    linear_color_scheme: {
      renderTrigger: false,
    },
  },
  formDataOverrides: formData => ({
    ...formData,
    entity: getStandardizedControls().shiftColumn(),
    metric: getStandardizedControls().shiftMetric(),
  }),
};

export default config;
