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
import {
  calculateShakingRadii,
  createShakingZone,
} from '../../src/geo/shakingZones';

test('shaking radii are ordered and increase with magnitude', () => {
  const magnitudeFive = calculateShakingRadii(5, 10);
  const magnitudeSix = calculateShakingRadii(6, 10);

  expect(magnitudeFive.strong).toBeLessThan(magnitudeFive.medium);
  expect(magnitudeFive.medium).toBeLessThan(magnitudeFive.light);
  expect(magnitudeSix.light).toBeGreaterThan(magnitudeFive.light);
});

test('deeper earthquakes have a smaller estimated surface extent', () => {
  expect(calculateShakingRadii(6, 150).light).toBeLessThan(
    calculateShakingRadii(6, 10).light,
  );
});

test('creates a closed geodesic polygon with radius metadata', () => {
  const zone = createShakingZone(110, 5, 75, 'light');
  const ring = zone.geometry.coordinates[0];

  expect(ring).toHaveLength(97);
  expect(ring[0]).toEqual(ring[ring.length - 1]);
  expect(zone.properties).toEqual({ level: 'light', radiusKm: 75 });
});

test('creates a non-overlapping shaking band when given an inner radius', () => {
  const band = createShakingZone(110, 5, 75, 'light', 45);

  expect(band.geometry.coordinates).toHaveLength(2);
  expect(band.geometry.coordinates[0]).toHaveLength(97);
  expect(band.geometry.coordinates[1]).toHaveLength(97);
});
