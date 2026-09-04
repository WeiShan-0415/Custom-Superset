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

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Time'),
      expanded: true,
      description: t('Time-related query settings'),
      controlSetRows: [['granularity_sqla'], ['time_range']],
    },
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
              validators: [validateNonEmpty],
              description: t(
                'Column containing the Malaysian state/territory name (e.g. "Selangor", "Sabah"). ' +
                  'The combined dataset must also expose event_type, event_time, title, severity, ' +
                  'lat, lon, depth, magnitude, and location columns. ' +
                  'Clicking a state on the map filters this column; a dashboard filter that narrows ' +
                  'the data to one state flies the map into it.',
              ),
            },
          },
        ],
        [
          {
            name: 'metric',
            config: {
              ...sharedControls.metric,
              default: null,
              clearable: true,
              validators: [],
              description: t(
                'Optional. When set (e.g. a COUNT of disaster records), each state with at ' +
                  'least one row shows a colored count badge — yellow for 2 or fewer, red ' +
                  'for more than 2.',
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
      label: t('Chart Options'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'show_district_borders',
            config: {
              type: 'CheckboxControl',
              label: t('Show district borders'),
              renderTrigger: true,
              default: false,
              description: t('Draw district boundary lines within each state'),
            },
          },
        ],
      ],
    },
  ],
};

export default config;
