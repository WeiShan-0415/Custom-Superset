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
// eslint-disable-next-line no-restricted-syntax
import * as d3 from 'd3';
import type { Polygon } from 'geojson';
import { rewindGeometry } from '../../src/geo/rewind';

// A small square, wound counter-clockwise in the (lon, lat) plane — the
// opposite of what RFC 7946 / d3-geo's right-hand rule expects for an
// exterior ring. This is the same winding the real district files use.
const backwardsSquare: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
  ],
};
const insidePoint: [number, number] = [0.5, 0.5];
const outsidePoint: [number, number] = [5, 5];

describe('rewindGeometry', () => {
  it('reproduces the bug: d3.geoContains is backwards for unrewound geometry', () => {
    expect(d3.geoContains(backwardsSquare, insidePoint)).toBe(false);
    expect(d3.geoContains(backwardsSquare, outsidePoint)).toBe(true);
  });

  it('fixes it: d3.geoContains matches real containment after rewinding', () => {
    const rewound = rewindGeometry(backwardsSquare) as Polygon;
    expect(d3.geoContains(rewound, insidePoint)).toBe(true);
    expect(d3.geoContains(rewound, outsidePoint)).toBe(false);
  });

  it('leaves already-correctly-wound geometry unchanged in behavior', () => {
    const alreadyClockwise: Polygon = {
      type: 'Polygon',
      coordinates: [[...backwardsSquare.coordinates[0]].reverse()],
    };
    const rewound = rewindGeometry(alreadyClockwise) as Polygon;
    expect(d3.geoContains(rewound, insidePoint)).toBe(true);
    expect(d3.geoContains(rewound, outsidePoint)).toBe(false);
  });
});
