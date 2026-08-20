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
import { computeStateCentroids } from '../../src/geo/centroids';
import { rewindGeometry } from '../../src/geo/rewind';
import { AllDistrictsFeatureCollection } from '../../src/geo/loadDistricts';

// d3.geoCentroid, like d3.geoContains, is winding-sensitive (see
// rewind.test.ts) — in the real pipeline `loadAllDistricts()` always
// rewinds geometry before anything reaches d3-geo, so this fixture applies
// the same step, matching what `computeStateCentroids` actually receives.
const fixture: AllDistrictsFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { state: 'Selangor', district: 'A', stateKey: 'selangor' },
      geometry: rewindGeometry({
        type: 'Polygon',
        coordinates: [
          [
            [100, 2],
            [102, 2],
            [102, 4],
            [100, 4],
            [100, 2],
          ],
        ],
      }),
    },
    {
      type: 'Feature',
      properties: { state: 'Johor', district: 'B', stateKey: 'johor' },
      geometry: rewindGeometry({
        type: 'Polygon',
        coordinates: [
          [
            [103, 1],
            [104, 1],
            [104, 2],
            [103, 2],
            [103, 1],
          ],
        ],
      }),
    },
  ],
};

describe('computeStateCentroids', () => {
  it('computes one centroid per state, roughly centered within its geometry', () => {
    const centroids = computeStateCentroids(fixture);
    expect(Object.keys(centroids).sort()).toEqual(['johor', 'selangor']);

    const [selangorLng, selangorLat] = centroids.selangor;
    expect(selangorLng).toBeGreaterThan(100);
    expect(selangorLng).toBeLessThan(102);
    expect(selangorLat).toBeGreaterThan(2);
    expect(selangorLat).toBeLessThan(4);

    const [johorLng, johorLat] = centroids.johor;
    expect(johorLng).toBeGreaterThan(103);
    expect(johorLng).toBeLessThan(104);
    expect(johorLat).toBeGreaterThan(1);
    expect(johorLat).toBeLessThan(2);
  });
});
