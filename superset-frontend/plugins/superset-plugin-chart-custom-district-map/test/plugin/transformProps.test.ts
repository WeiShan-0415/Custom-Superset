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
import { ChartProps } from '@superset-ui/core';
import { supersetTheme } from '@apache-superset/core/theme';
import transformProps from '../../src/plugin/transformProps';

describe('SupersetPluginChartCustomDistrictMap transformProps', () => {
  const formData = {
    datasource: '3__table',
    granularity_sqla: 'ds',
    entity: 'district_name',
    metric: 'sum__num',
    selectState: 'selangor',
    linearColorScheme: 'blue_white_yellow',
    numberFormat: 'SMART_NUMBER',
    showDistrictLabels: true,
    sliceId: 42,
  };
  const setDataMask = jest.fn();
  const chartProps = new ChartProps({
    formData,
    width: 800,
    height: 600,
    theme: supersetTheme,
    hooks: { setDataMask },
    filterState: {},
    queriesData: [
      {
        data: [{ district_name: 'Petaling', sum__num: 1 }],
      },
    ],
  });

  it('should transform chart props for viz', () => {
    expect(transformProps(chartProps)).toEqual({
      width: 800,
      height: 600,
      data: [{ district_id: 'Petaling', metric: 1 }],
      selectState: 'selangor',
      entity: 'district_name',
      linearColorScheme: 'blue_white_yellow',
      numberFormat: 'SMART_NUMBER',
      showDistrictLabels: true,
      sliceId: 42,
      setDataMask,
      filterState: {},
      emitCrossFilters: false,
    });
  });

  it('should use the state derived from a single-state result over the default', () => {
    const filteredChartProps = new ChartProps({
      formData: { ...formData, state_column: 'state_name' },
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [
        {
          data: [
            {
              state_name: 'Kuala Lumpur',
              district_name: 'Petaling',
              sum__num: 1,
            },
          ],
        },
      ],
    });
    expect(transformProps(filteredChartProps).selectState).toBe('kuala_lumpur');
  });

  it('should fall back to the default state when the result spans multiple states', () => {
    const unfilteredChartProps = new ChartProps({
      formData: { ...formData, state_column: 'state_name' },
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [
        {
          data: [
            { state_name: 'Selangor', district_name: 'Petaling', sum__num: 1 },
            { state_name: 'Johor', district_name: 'Kluang', sum__num: 2 },
          ],
        },
      ],
    });
    expect(transformProps(unfilteredChartProps).selectState).toBe('selangor');
  });
});
