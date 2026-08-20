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
// d3 v7 has no default export; a namespace import is required for the
// Babel/CJS interop used to build this plugin's lib/esm output (see
// SupersetPluginChart3DMap.tsx for the same pattern).
// eslint-disable-next-line no-restricted-syntax
import * as d3 from 'd3';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type {
  AllDistrictsFeatureCollection,
  DistrictFeatureProps,
} from './loadDistricts';

// One representative point per state — the geographic centroid of all its
// districts combined — used to place the disaster-count badge somewhere
// sensibly inside the state rather than at, say, its bounding-box corner.
export function computeStateCentroids(
  fc: AllDistrictsFeatureCollection,
): Record<string, [number, number]> {
  const featuresByState = new Map<
    string,
    Feature<Geometry, DistrictFeatureProps>[]
  >();
  fc.features.forEach(feature => {
    const { stateKey } = feature.properties;
    if (!stateKey) return;
    const existing = featuresByState.get(stateKey);
    if (existing) existing.push(feature);
    else featuresByState.set(stateKey, [feature]);
  });

  const centroids: Record<string, [number, number]> = {};
  featuresByState.forEach((features, stateKey) => {
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };
    const [lng, lat] = d3.geoCentroid(collection);
    centroids[stateKey] = [lng, lat];
  });
  return centroids;
}
