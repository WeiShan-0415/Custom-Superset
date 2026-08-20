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
import type { Position } from 'geojson';
import type { AllDistrictsFeatureCollection } from './loadDistricts';

// [west, south, east, north], the 4-number form MapLibre's
// `LngLatBoundsLike` accepts directly.
export type BBox = [number, number, number, number];

// The demo's own maxBounds: Malaysia plus a small margin, used to restrict
// map panning and as the whole-country fitBounds target.
export const MALAYSIA_PAN_BOUNDS: BBox = [98.5, 0.5, 119.5, 7.5];

type NestedPosition = Position | NestedPosition[];

function walkCoordinates(
  coords: NestedPosition,
  visit: (position: Position) => void,
): void {
  if (typeof coords[0] === 'number') {
    visit(coords as Position);
    return;
  }
  (coords as NestedPosition[]).forEach(child => walkCoordinates(child, visit));
}

// Plain min/max coordinate walk, grouped by `stateKey` — no geometry
// library needed since we only need axis-aligned bounding boxes, not any
// polygon union/dissolve.
export function computeStateBBoxes(
  fc: AllDistrictsFeatureCollection,
): Record<string, BBox> {
  const bounds: Record<string, BBox> = {};
  fc.features.forEach(feature => {
    const { stateKey } = feature.properties;
    const { geometry } = feature;
    if (!stateKey) return;
    if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') return;
    const current = bounds[stateKey] ?? [
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
    ];
    walkCoordinates(geometry.coordinates as NestedPosition, ([lng, lat]) => {
      current[0] = Math.min(current[0], lng);
      current[1] = Math.min(current[1], lat);
      current[2] = Math.max(current[2], lng);
      current[3] = Math.max(current[3], lat);
    });
    bounds[stateKey] = current;
  });
  return bounds;
}
