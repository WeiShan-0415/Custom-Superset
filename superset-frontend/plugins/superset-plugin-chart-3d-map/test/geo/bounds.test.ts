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
import { computeStateBBoxes } from '../../src/geo/bounds';
import { AllDistrictsFeatureCollection } from '../../src/geo/loadDistricts';

const fixture: AllDistrictsFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { state: 'Selangor', district: 'A', stateKey: 'selangor' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [101, 3],
            [102, 3],
            [102, 4],
            [101, 4],
            [101, 3],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { state: 'Johor', district: 'B', stateKey: 'johor' },
      geometry: {
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
      },
    },
  ],
};

describe('computeStateBBoxes', () => {
  it('computes a per-state bounding box covering that state only', () => {
    const bboxes = computeStateBBoxes(fixture);
    expect(Object.keys(bboxes).sort()).toEqual(['johor', 'selangor']);
    expect(bboxes.selangor).toEqual([101, 3, 102, 4]);
    expect(bboxes.johor).toEqual([103, 1, 104, 2]);
  });
});
