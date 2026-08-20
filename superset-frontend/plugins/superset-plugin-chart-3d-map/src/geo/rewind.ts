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
import type { Geometry, Position } from 'geojson';

function ringSignedArea(ring: Position[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

function rewindRing(ring: Position[], isExterior: boolean): Position[] {
  const isClockwise = ringSignedArea(ring) < 0;
  return isClockwise === isExterior ? ring : [...ring].reverse();
}

// d3-geo (spherical geometry: `d3.geoContains`, path rendering, etc.)
// follows RFC 7946's right-hand rule: exterior rings must be wound
// clockwise in the (longitude, latitude) plane, holes counter-clockwise.
// This source data uses the opposite convention, which makes d3-geo treat
// every polygon as its own complement — "everywhere except this district" —
// so a point-in-polygon test matches almost everywhere instead of the
// small area it should (see SupersetPluginChartCustomDistrictMap.tsx,
// which hit and documented the identical issue). MapLibre's own polygon
// fill rendering isn't winding-sensitive the same way, so rewinding here
// only matters for (and only needs to run before) d3-geo consumers.
export function rewindGeometry(geometry: Geometry): Geometry {
  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring, i) =>
        rewindRing(ring, i === 0),
      ),
    };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(polygon =>
        polygon.map((ring, i) => rewindRing(ring, i === 0)),
      ),
    };
  }
  return geometry;
}
