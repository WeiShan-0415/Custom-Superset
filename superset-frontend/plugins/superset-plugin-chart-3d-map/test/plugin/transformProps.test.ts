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

describe('SupersetPluginChart3DMap transformProps', () => {
  const formData = {
    datasource: '3__table',
    granularity_sqla: 'ds',
    state_column: 'state_name',
    showDistrictBorders: false,
    sliceId: 42,
  };
  const setDataMask = jest.fn();

  it('should transform chart props for viz, with no active state when rows span multiple states', () => {
    const chartProps = new ChartProps({
      formData,
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [
        {
          data: [{ state_name: 'Selangor' }, { state_name: 'Johor' }],
        },
      ],
    });

    expect(transformProps(chartProps)).toEqual({
      width: 800,
      height: 600,
      data: [
        { state_key: 'selangor', raw_value: 'Selangor', metric: undefined },
        { state_key: 'johor', raw_value: 'Johor', metric: undefined },
      ],
      activeStateKey: null,
      stateColumn: 'state_name',
      showDistrictBorders: false,
      sliceId: 42,
      setDataMask,
      emitCrossFilters: false,
    });
  });

  it('should include the metric on each row when a metric is set', () => {
    const chartProps = new ChartProps({
      formData: { ...formData, metric: 'disaster_count' },
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [{ data: [{ state_name: 'Selangor', disaster_count: 3 }] }],
    });
    expect(transformProps(chartProps).data).toEqual([
      { state_key: 'selangor', raw_value: 'Selangor', metric: 3 },
    ]);
  });

  it('should derive the active state from a single-state result when filterState is unset (native filter)', () => {
    const chartProps = new ChartProps({
      formData,
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [{ data: [{ state_name: 'Kuala Lumpur' }] }],
    });
    expect(transformProps(chartProps).activeStateKey).toBe('kuala_lumpur');
  });

  it('should ignore chart cross-filter state and use native-filtered rows', () => {
    const chartProps = new ChartProps({
      formData,
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: { selectedValues: ['Penang'] },
      queriesData: [
        {
          data: [{ state_name: 'Selangor' }, { state_name: 'Johor' }],
        },
      ],
    });
    expect(transformProps(chartProps).activeStateKey).toBeNull();
  });

  it('should derive the active state from rows when chart filterState is empty', () => {
    const chartProps = new ChartProps({
      formData,
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: { selectedValues: [] },
      queriesData: [{ data: [{ state_name: 'Sarawak' }] }],
    });
    expect(transformProps(chartProps).activeStateKey).toBe('sarawak');
  });
});
