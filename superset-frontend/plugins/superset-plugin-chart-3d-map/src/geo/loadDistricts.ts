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
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import states, { normalizeStateKey } from '../districts';
import { rewindGeometry } from './rewind';

export interface DistrictFeatureProps {
  state: string;
  district: string;
  stateKey: string;
}

export type DistrictFeature = Feature<Geometry, DistrictFeatureProps>;
export type AllDistrictsFeatureCollection = FeatureCollection<
  Geometry,
  DistrictFeatureProps
>;

let cache: Promise<AllDistrictsFeatureCollection> | null = null;

// Fetches every state's district-level GeoJSON in parallel and merges them
// into one FeatureCollection, tagging each feature with a normalized
// `stateKey` so map layers/click handlers don't need to re-derive it from
// the raw `state` label. Cached at module scope since the geodata is
// static and may be shared by multiple chart instances on a dashboard.
export function loadAllDistricts(): Promise<AllDistrictsFeatureCollection> {
  if (!cache) {
    cache = Promise.all(
      Object.entries(states).map(([stateKey, url]) =>
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to load district map for ${stateKey}`);
            }
            return response.json() as Promise<AllDistrictsFeatureCollection>;
          })
          .then(fc =>
            fc.features.map(
              (feature): DistrictFeature => ({
                ...feature,
                geometry: rewindGeometry(feature.geometry),
                properties: {
                  state: feature.properties?.state ?? '',
                  district: feature.properties?.district ?? '',
                  stateKey:
                    normalizeStateKey(feature.properties?.state ?? '') ??
                    stateKey,
                },
              }),
            ),
          ),
      ),
    ).then(featuresByState => ({
      type: 'FeatureCollection',
      features: featuresByState.flat(),
    }));
  }
  return cache;
}
