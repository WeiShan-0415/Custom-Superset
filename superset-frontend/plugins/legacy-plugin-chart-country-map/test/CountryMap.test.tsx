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

import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import d3 from 'd3';
import ReactCountryMap from '../src/ReactCountryMap';

// d3 v3 APIs have loose types; cast to allow jest mock operations
const d3Any = d3 as any;

jest.spyOn(d3Any, 'json');

type Projection = ((...args: unknown[]) => void) & {
  scale: () => Projection;
  center: () => Projection;
  translate: () => Projection;
};

type PathFn = (() => string) & {
  projection: jest.Mock;
  bounds: jest.Mock<[[number, number], [number, number]]>;
  centroid: jest.Mock<[number, number]>;
};

const mockPath: PathFn = jest.fn(() => 'M10 10 L20 20') as unknown as PathFn;
mockPath.projection = jest.fn();
mockPath.bounds = jest.fn(() => [
  [0, 0],
  [100, 100],
]);
mockPath.centroid = jest.fn(() => [50, 50]);

jest.spyOn(d3Any.geo, 'path').mockImplementation(() => mockPath);

// Mock d3.geo.mercator
jest.spyOn(d3Any.geo, 'mercator').mockImplementation(() => {
  const proj = (() => {}) as Projection;
  proj.scale = () => proj;
  proj.center = () => proj;
  proj.translate = () => proj;
  return proj;
});

// Mock d3.mouse
jest.spyOn(d3Any, 'mouse').mockReturnValue([100, 50]);

const mockMapData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { ISO: 'CAN', NAME_1: 'Canada' },
      geometry: {},
    },
    {
      type: 'Feature',
      properties: { ISO: 'USA', NAME_1: 'United States' },
      geometry: {},
    },
  ],
};

type D3JsonCallback = (error: Error | null, data: unknown) => void;

describe('CountryMap (legacy d3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders a map after d3.json loads data', async () => {
    d3Any.json.mockImplementation((_url: string, cb: D3JsonCallback) =>
      cb(null, mockMapData),
    );

    render(
      <ReactCountryMap
        width={500}
        height={300}
        data={[
          { country_id: 'CAN', metric: 100 },
          { country_id: 'USA', metric: 50 },
        ]}
        country="canada"
        linearColorScheme="bnbColors"
        colorScheme=""
        numberFormat=".2f"
      />,
    );

    expect(d3Any.json).toHaveBeenCalledTimes(1);

    const region = document.querySelector('path.region');
    expect(region).not.toBeNull();
  });

  test('shows tooltip on mouseenter/mousemove/mouseout', async () => {
    d3Any.json.mockImplementation((_url: string, cb: D3JsonCallback) =>
      cb(null, mockMapData),
    );

    render(
      <ReactCountryMap
        width={500}
        height={300}
        data={[
          { country_id: 'CAN', metric: 100 },
          { country_id: 'USA', metric: 50 },
        ]}
        country="canada"
        linearColorScheme="bnbColors"
        colorScheme=""
      />,
    );

    const region = document.querySelector('path.region');
    expect(region).not.toBeNull();

    const popup = document.querySelector('.hover-popup');
    expect(popup).not.toBeNull();

    fireEvent.mouseEnter(region!);
    expect(popup!).toHaveStyle({ display: 'block' });

    fireEvent.mouseOut(region!);
    expect(popup!).toHaveStyle({ display: 'none' });
  });

  test('removes colors for regions excluded by updated query data', () => {
    d3Any.json.mockImplementation((_url: string, cb: D3JsonCallback) =>
      cb(null, mockMapData),
    );

    const commonProps = {
      width: 500,
      height: 300,
      country: 'canada',
      linearColorScheme: 'bnbColors',
      colorScheme: '',
    };
    const { rerender } = render(
      <ReactCountryMap
        {...commonProps}
        data={[
          { country_id: 'CAN', metric: 100 },
          { country_id: 'USA', metric: 50 },
        ]}
      />,
    );

    rerender(
      <ReactCountryMap
        {...commonProps}
        data={[{ country_id: 'CAN', metric: 100 }]}
      />,
    );

    const regions = document.querySelectorAll<SVGPathElement>('path.region');
    expect(regions[0].style.fill).not.toBe('none');
    expect(regions[1].style.fill).toBe('none');
  });

  test('restores cached region colors while a cross-filter is clearing', () => {
    d3Any.json.mockImplementation((_url: string, cb: D3JsonCallback) =>
      cb(null, mockMapData),
    );

    const commonProps = {
      width: 500,
      height: 300,
      country: 'canada',
      linearColorScheme: 'bnbColors',
      colorScheme: '',
      sliceId: 9876,
    };
    const { rerender } = render(
      <ReactCountryMap
        {...commonProps}
        data={[
          { country_id: 'CAN', metric: 100 },
          { country_id: 'USA', metric: 50 },
        ]}
        filterState={{ selectedValues: [] }}
      />,
    );

    rerender(
      <ReactCountryMap
        {...commonProps}
        data={[{ country_id: 'CAN', metric: 100 }]}
        filterState={{ selectedValues: ['CAN'] }}
      />,
    );
    rerender(
      <ReactCountryMap
        {...commonProps}
        data={[{ country_id: 'CAN', metric: 100 }]}
        filterState={{ selectedValues: [] }}
      />,
    );

    const regions = document.querySelectorAll<SVGPathElement>('path.region');
    expect(regions[0].style.fill).not.toBe('none');
    expect(regions[1].style.fill).not.toBe('none');
  });

  test('applies a cross-filter when a region is clicked', async () => {
    d3Any.json.mockImplementation((_url: string, cb: D3JsonCallback) =>
      cb(null, mockMapData),
    );

    const setDataMask = jest.fn();

    render(
      <ReactCountryMap
        width={500}
        height={300}
        data={[
          { country_id: 'CAN', metric: 100 },
          { country_id: 'USA', metric: 50 },
        ]}
        country="canada"
        linearColorScheme="bnbColors"
        colorScheme=""
        entity="state_code"
        emitCrossFilters
        filterState={{ selectedValues: [] }}
        setDataMask={setDataMask}
      />,
    );

    const regions = document.querySelectorAll<SVGPathElement>('path.region');
    expect(regions).toHaveLength(2);

    fireEvent.click(regions[0]);

    expect(regions[0].style.fill).not.toBe('none');
    expect(regions[1].style.fill).toBe('none');
    expect(setDataMask).toHaveBeenCalledWith({
      extraFormData: {
        filters: [{ col: 'state_code', op: 'IN', val: ['CAN'] }],
      },
      filterState: {
        value: ['CAN'],
        selectedValues: ['CAN'],
      },
    });
  });

  test('clears the cross-filter when the map background is clicked', async () => {
    d3Any.json.mockImplementation((_url: string, cb: D3JsonCallback) =>
      cb(null, mockMapData),
    );

    const setDataMask = jest.fn();

    render(
      <ReactCountryMap
        width={500}
        height={300}
        data={[{ country_id: 'CAN', metric: 100 }]}
        country="canada"
        linearColorScheme="bnbColors"
        colorScheme=""
        entity="state_code"
        emitCrossFilters
        filterState={{ selectedValues: ['CAN'] }}
        setDataMask={setDataMask}
      />,
    );

    const background = document.querySelector('rect.background');
    const region = document.querySelector('path.region') as SVGPathElement;
    expect(background).not.toBeNull();
    expect(region).not.toBeNull();

    region.style.fill = 'rgb(1, 2, 3)';

    fireEvent.click(background!);

    expect(region.style.fill).not.toBe('rgb(1, 2, 3)');
    expect(setDataMask).toHaveBeenCalledWith({
      extraFormData: { filters: [] },
      filterState: {
        value: null,
        selectedValues: null,
      },
    });
  });
});
