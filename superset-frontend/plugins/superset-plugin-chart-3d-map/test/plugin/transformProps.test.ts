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
        {
          state_key: 'selangor',
          raw_value: 'Selangor',
          eventType: '',
          metric: undefined,
        },
        {
          state_key: 'johor',
          raw_value: 'Johor',
          eventType: '',
          metric: undefined,
        },
      ],
      earthquakes: [],
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
      {
        state_key: 'selangor',
        raw_value: 'Selangor',
        eventType: '',
        metric: 3,
      },
    ]);
  });

  it('should preserve warning titles for map hazard filtering', () => {
    const chartProps = new ChartProps({
      formData,
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [
        {
          data: [
            {
              event_type: 'weather_warning',
              state_name: 'Terengganu',
              title: 'Strong Winds and Rough Seas Warning',
              event_time: '2026-08-18 00:00:00',
              severity: 1,
            },
          ],
        },
      ],
    });

    expect(transformProps(chartProps).data).toEqual([
      {
        state_key: 'terengganu',
        raw_value: 'Terengganu',
        eventType: 'weather_warning',
        title: 'strong winds and rough seas warning',
        eventTime: '2026-08-18 00:00:00',
        metric: 1,
      },
    ]);
  });

  it('should transform valid earthquake rows and ignore invalid coordinates', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-10-20T00:00:00Z'));
    const chartProps = new ChartProps({
      formData,
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [
        {
          data: [
            {
              event_type: 'earthquake',
              state_name: null,
              event_time: '2023-10-09 11:50:50',
              title: 'Earthquake M5.5',
              lat: 0.350031,
              lon: 122.238975,
              depth: 135,
              magnitude: 5.5,
              location: 'Minahassa Peninsula, Sulawesi',
            },
            {
              event_type: 'earthquake',
              state_name: null,
              lat: 100,
              lon: 122,
            },
          ],
        },
      ],
    });

    expect(transformProps(chartProps).earthquakes).toEqual([
      {
        latitude: 0.350031,
        longitude: 122.238975,
        magnitude: 5.5,
        depth: 135,
        location: 'Minahassa Peninsula, Sulawesi',
        eventTime: '2023-10-09 11:50:50',
        title: 'Earthquake M5.5',
      },
    ]);
    jest.useRealTimers();
  });

  it('should include only earthquakes from the current year', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-21T00:00:00Z'));
    const chartProps = new ChartProps({
      formData,
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [
        {
          data: [
            {
              event_type: 'earthquake',
              event_time: '2026-08-10T12:00:00',
              lat: 5,
              lon: 110,
            },
            {
              event_type: 'earthquake',
              event_time: '2025-12-31T23:59:59',
              lat: 6,
              lon: 111,
            },
          ],
        },
      ],
    });

    expect(transformProps(chartProps).earthquakes).toHaveLength(1);
    expect(transformProps(chartProps).earthquakes[0]).toMatchObject({
      latitude: 5,
      longitude: 110,
    });
    jest.useRealTimers();
  });

  it('should exclude earthquake rows from state data and the active state key', () => {
    const chartProps = new ChartProps({
      formData,
      width: 800,
      height: 600,
      theme: supersetTheme,
      hooks: { setDataMask },
      filterState: {},
      queriesData: [
        {
          data: [
            { event_type: 'weather_warning', state_name: 'Selangor' },
            {
              event_type: 'earthquake',
              state_name: null,
              lat: 0.350031,
              lon: 122.238975,
              severity: 2,
            },
          ],
        },
      ],
    });

    const result = transformProps(chartProps);
    expect(result.data).toEqual([
      {
        state_key: 'selangor',
        raw_value: 'Selangor',
        eventType: 'weather_warning',
        metric: undefined,
      },
    ]);
    expect(result.activeStateKey).toBe('selangor');
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
