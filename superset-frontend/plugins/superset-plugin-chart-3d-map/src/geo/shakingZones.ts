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
import type { Feature, Polygon } from 'geojson';

const EARTH_RADIUS_KM = 6371.0088;
const CIRCLE_STEPS = 96;
const DEFAULT_MAGNITUDE = 0;
const DEFAULT_DEPTH_KM = 10;
const MAX_LIGHT_RADIUS_KM = 800;
const MIN_LIGHT_RADIUS_KM = 5;

export type ShakingLevel = 'light' | 'medium' | 'strong';

export interface ShakingRadii {
  light: number;
  medium: number;
  strong: number;
}

export interface ShakingZoneProperties {
  level: ShakingLevel;
  radiusKm: number;
}

function createGeodesicRing(
  longitude: number,
  latitude: number,
  radiusKm: number,
): [number, number][] {
  const angularDistance = radiusKm / EARTH_RADIUS_KM;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const longitudeRadians = (longitude * Math.PI) / 180;
  const coordinates: [number, number][] = [];

  for (let step = 0; step <= CIRCLE_STEPS; step += 1) {
    const bearing = (step / CIRCLE_STEPS) * Math.PI * 2;
    const destinationLatitude = Math.asin(
      Math.sin(latitudeRadians) * Math.cos(angularDistance) +
        Math.cos(latitudeRadians) *
          Math.sin(angularDistance) *
          Math.cos(bearing),
    );
    const destinationLongitude =
      longitudeRadians +
      Math.atan2(
        Math.sin(bearing) *
          Math.sin(angularDistance) *
          Math.cos(latitudeRadians),
        Math.cos(angularDistance) -
          Math.sin(latitudeRadians) * Math.sin(destinationLatitude),
      );

    const longitudeDegrees = (destinationLongitude * 180) / Math.PI;
    const normalizedLongitude =
      ((((longitudeDegrees + 180) % 360) + 360) % 360) - 180;
    coordinates.push([
      normalizedLongitude,
      (destinationLatitude * 180) / Math.PI,
    ]);
  }

  return coordinates;
}

/**
 * Estimate display radii from the fields available in an earthquake row.
 * This is a visualization model, not a replacement for observed ShakeMap
 * contours: magnitude increases the radius logarithmically and focal depth
 * attenuates the surface extent.
 */
export function calculateShakingRadii(
  magnitude = DEFAULT_MAGNITUDE,
  depthKm = DEFAULT_DEPTH_KM,
): ShakingRadii {
  const safeMagnitude = Math.max(0, Math.min(10, magnitude));
  const safeDepthKm = Math.max(0, depthKm);
  const magnitudeDistanceKm = 10 ** (0.5 * safeMagnitude - 1);
  const depthAttenuation = 1 / Math.sqrt(1 + safeDepthKm / 70);
  const light = Math.min(
    MAX_LIGHT_RADIUS_KM,
    Math.max(MIN_LIGHT_RADIUS_KM, 2.5 * magnitudeDistanceKm * depthAttenuation),
  );

  return {
    light,
    medium: light * 0.6,
    strong: light * 0.3,
  };
}

/** Build a geodesic circle or hollow band around an epicentre. */
export function createShakingZone(
  longitude: number,
  latitude: number,
  radiusKm: number,
  level: ShakingLevel,
  innerRadiusKm?: number,
): Feature<Polygon, ShakingZoneProperties> {
  const rings = [
    createGeodesicRing(longitude, latitude, radiusKm),
    ...(innerRadiusKm
      ? [createGeodesicRing(longitude, latitude, innerRadiusKm).reverse()]
      : []),
  ];

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: rings },
    properties: { level, radiusKm },
  };
}
