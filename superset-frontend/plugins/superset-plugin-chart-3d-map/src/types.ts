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
  QueryFormColumn,
  QueryFormData,
  QueryFormMetric,
} from '@superset-ui/core';

export interface SupersetPluginChart3DMapStylesProps {
  height: number;
  width: number;
}

interface SupersetPluginChart3DMapCustomizeProps {
  stateColumn: QueryFormColumn;
  metric?: QueryFormMetric;
  showDistrictBorders: boolean;
}

export type SupersetPluginChart3DMapQueryFormData = QueryFormData &
  SupersetPluginChart3DMapStylesProps &
  SupersetPluginChart3DMapCustomizeProps;

export interface StateMapDataItem {
  state_key: string;
  raw_value: string;
  metric?: number;
}

export interface EarthquakeDataItem {
  latitude: number;
  longitude: number;
  magnitude?: number;
  depth?: number;
  location?: string;
  eventTime?: string;
  title?: string;
}

export type SupersetPluginChart3DMapProps =
  SupersetPluginChart3DMapStylesProps &
    Omit<SupersetPluginChart3DMapCustomizeProps, 'stateColumn' | 'metric'> & {
      data: StateMapDataItem[];
      earthquakes: EarthquakeDataItem[];
      activeStateKey: string | null;
      stateColumn: string;
      sliceId: number;
      setDataMask: (dataMask: Record<string, unknown>) => void;
      emitCrossFilters: boolean;
    };
