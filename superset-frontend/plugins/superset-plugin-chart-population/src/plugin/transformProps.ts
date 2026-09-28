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
  ChartProps,
  DataRecord,
  getColumnLabel,
  getMetricLabel,
} from '@superset-ui/core';
import {
  PopulationCategory,
  PopulationDistrict,
  SupersetPluginChartPopulationQueryFormData,
} from '../types';

const POPULATION_MULTIPLIER = 1000;

function numericValue(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(
    typeof value === 'string' ? value.replaceAll(',', '').trim() : value,
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

function filterTargetsColumn(
  filter: Record<string, unknown>,
  columnLabel: string,
): boolean {
  const filterColumn = filter.col ?? filter.subject;
  const value = filter.val ?? filter.comparator;
  const hasValue = Array.isArray(value)
    ? value.length > 0
    : value !== null && value !== undefined && value !== '';
  return String(filterColumn ?? '') === columnLabel && hasValue;
}

function hasFilterForColumn(
  formData: SupersetPluginChartPopulationQueryFormData,
  columnLabel: string,
): boolean {
  const nativeFilters = formData.extraFormData?.filters ?? [];
  const adhocFilters = formData.adhocFilters ?? [];
  return [...nativeFilters, ...adhocFilters].some(filter =>
    filterTargetsColumn(filter, columnLabel),
  );
}

export default function transformProps(chartProps: ChartProps) {
  const { width, height, queriesData } = chartProps;
  const formData =
    chartProps.formData as SupersetPluginChartPopulationQueryFormData;
  const {
    stateColumn,
    districtColumn,
    populationMetric,
    childrenMetric,
    adultMetric,
    elderlyMetric,
  } = formData;

  const stateLabel = stateColumn ? getColumnLabel(stateColumn) : '';
  const districtLabel = districtColumn ? getColumnLabel(districtColumn) : '';
  const populationLabel = populationMetric
    ? getMetricLabel(populationMetric)
    : '';
  const childrenLabel = childrenMetric ? getMetricLabel(childrenMetric) : '';
  const adultLabel = adultMetric ? getMetricLabel(adultMetric) : '';
  const elderlyLabel = elderlyMetric ? getMetricLabel(elderlyMetric) : '';
  const rows = (queriesData[0]?.data ?? []) as DataRecord[];

  const sumMetric = (metricLabel: string) =>
    rows.reduce((total, row) => total + numericValue(row[metricLabel]), 0) *
    POPULATION_MULTIPLIER;

  const totalPeople = sumMetric(populationLabel);
  const categoryValues = [
    {
      key: 'children' as const,
      label: 'Children',
      ageRange: '1–19',
      value: sumMetric(childrenLabel),
    },
    {
      key: 'adults' as const,
      label: 'Adults',
      ageRange: '20–59',
      value: sumMetric(adultLabel),
    },
    {
      key: 'elderly' as const,
      label: 'Elderly',
      ageRange: '60+',
      value: sumMetric(elderlyLabel),
    },
  ];
  const categories: PopulationCategory[] = categoryValues.map(category => ({
    ...category,
    percentage: totalPeople > 0 ? (category.value / totalPeople) * 100 : 0,
  }));

  const stateValues = Array.from(
    new Set(
      rows.map(row => String(row[stateLabel] ?? '').trim()).filter(Boolean),
    ),
  );
  const hasStateFilter =
    Boolean(stateLabel) &&
    hasFilterForColumn(formData, stateLabel) &&
    stateValues.length === 1;
  const location = hasStateFilter ? stateValues[0] : 'Malaysia';

  const districtTotals = new Map<string, number>();
  if (hasStateFilter && districtLabel && populationLabel) {
    rows.forEach(row => {
      const district = String(row[districtLabel] ?? '').trim();
      if (!district) return;
      const value = numericValue(row[populationLabel]) * POPULATION_MULTIPLIER;
      districtTotals.set(district, (districtTotals.get(district) ?? 0) + value);
    });
  }
  const districts: PopulationDistrict[] = Array.from(districtTotals)
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalPeople > 0 ? (value / totalPeople) * 100 : 0,
    }))
    .sort((first, second) => second.value - first.value)
    .slice(0, 5);

  return {
    width,
    height,
    location,
    totalPeople,
    categories,
    districts,
    hasStateFilter,
  };
}
