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
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from 'geojson';
import dunUrl from '../dun/malaysia.dun.geojson';

export interface DunFeatureProperties {
  state: string;
  dun: string;
  code_dun: string;
}

export type DunFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  DunFeatureProperties
>;

interface RawDunFeatureProperties {
  state?: string | null;
  dun?: string | null;
  code_dun?: string | null;
}

type RawDunFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  RawDunFeatureProperties
>;

let cache: Promise<DunFeatureCollection> | null = null;

export function loadDunBoundaries(): Promise<DunFeatureCollection> {
  if (!cache) {
    cache = fetch(dunUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load Malaysia DUN boundaries');
        }
        return response.json() as Promise<RawDunFeatureCollection>;
      })
      .then(data => ({
        type: 'FeatureCollection',
        // Federal territories have parliamentary records in this dataset but
        // no DUN constituencies, so only features with complete DUN metadata
        // belong in this layer.
        features: data.features.flatMap(
          (
            feature,
          ): Array<Feature<Polygon | MultiPolygon, DunFeatureProperties>> => {
            const { code_dun: codeDun, dun, state } = feature.properties ?? {};
            if (!codeDun || !dun || !state) return [];
            return [
              {
                ...feature,
                properties: { code_dun: codeDun, dun, state },
              },
            ];
          },
        ),
      }));
  }
  return cache;
}

export function formatDunLabel(properties: DunFeatureProperties): string {
  const rawCode = properties.code_dun || properties.dun.split(/\s+/, 1)[0];
  const code = rawCode.replace(/^N\.0*(\d+)$/i, 'N$1');
  const name = properties.dun.replace(/^N\.?\s*0*\d+\s*/i, '').trim();
  return [code, name, properties.state].filter(Boolean).join(' ');
}
