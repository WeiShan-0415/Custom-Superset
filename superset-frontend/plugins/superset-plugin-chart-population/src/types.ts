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

export type PopulationCategoryKey = 'children' | 'adults' | 'elderly';

export interface PopulationCategory {
  key: PopulationCategoryKey;
  label: string;
  ageRange: string;
  value: number;
  percentage: number;
}

export interface PopulationDistrict {
  name: string;
  value: number;
  percentage: number;
}

export interface SupersetPluginChartPopulationStylesProps {
  height: number;
  width: number;
}

export interface SupersetPluginChartPopulationQueryFormData extends QueryFormData {
  stateColumn?: QueryFormColumn;
  districtColumn?: QueryFormColumn;
  populationMetric?: QueryFormMetric;
  childrenMetric?: QueryFormMetric;
  adultMetric?: QueryFormMetric;
  elderlyMetric?: QueryFormMetric;
  adhocFilters?: Record<string, unknown>[];
  extraFormData?: {
    filters?: Record<string, unknown>[];
  };
}

export interface SupersetPluginChartPopulationProps extends SupersetPluginChartPopulationStylesProps {
  location: string;
  totalPeople: number;
  categories: PopulationCategory[];
  districts: PopulationDistrict[];
  hasStateFilter: boolean;
}
