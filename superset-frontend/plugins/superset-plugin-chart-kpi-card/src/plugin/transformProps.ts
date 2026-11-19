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
import { ChartProps, DataRecord, getMetricLabel } from '@superset-ui/core';
import {
  KpiStatusItem,
  RgbaColor,
  SupersetPluginChartKpiCardProps,
  SupersetPluginChartKpiCardQueryFormData,
} from '../types';
import { renderSubtitleTemplate } from '../utils/subtitleTemplate';

const SEVERITY_LEVELS = [
  { key: 'severeColumn', label: 'Severe', status: 3 },
  { key: 'warningColumn', label: 'Warning', status: 2 },
  { key: 'watchColumn', label: 'Watch', status: 1 },
] as const;

const ACCENT_TINT_ALPHA = 0.18;

const isEmpty = (value: unknown) =>
  value === null || value === undefined || value === '';

const toRgba = ({ r, g, b, a = 1 }: RgbaColor, alpha = a) =>
  `rgba(${r}, ${g}, ${b}, ${alpha})`;

/**
 * Maps the chart response and form controls to KPI card props.
 *
 * Controls missing from older saved charts fall back to the original
 * alert-summary appearance so existing charts render unchanged.
 */
export default function transformProps(
  chartProps: ChartProps,
): SupersetPluginChartKpiCardProps {
  const { width, height, queriesData } = chartProps;
  const formData =
    chartProps.formData as SupersetPluginChartKpiCardQueryFormData;
  const {
    icon = '📊',
    title = 'KPI',
    valueColumn: valueMetric,
    subtitleTemplate = '',
    deriveSeveritySubtitle = true,
    iconStyle = 'circle',
    accentColor,
    valueColor = 'default',
    background = 'theme',
    showBorder = true,
  } = formData;
  const valueColumn = valueMetric ? getMetricLabel(valueMetric) : '';
  const row = (queriesData[0]?.data as DataRecord[] | undefined)?.[0];
  const value = valueColumn ? row?.[valueColumn] : undefined;

  const statusItems: KpiStatusItem[] = SEVERITY_LEVELS.filter(
    level => formData[level.key],
  ).map(level => ({
    label: level.label,
    status: level.status,
    value: row?.[formData[level.key] as string],
  }));

  let subtitle = subtitleTemplate.trim()
    ? renderSubtitleTemplate(subtitleTemplate, value, row)
    : '';
  let subtitleStatus: number | undefined;

  if (deriveSeveritySubtitle && !subtitle) {
    const priority = statusItems.find(item => Number(item.value) > 0);
    const label = priority ? priority.label.toLowerCase() : 'none';
    subtitleStatus = priority?.status ?? 0;
    subtitle = isEmpty(value) ? label : `${value} ${label}`;
  }

  return {
    width,
    height,
    icon,
    title,
    value,
    subtitle,
    subtitleStatus,
    statusItems,
    iconStyle,
    valueColor,
    background,
    showBorder,
    accentColor: accentColor ? toRgba(accentColor) : undefined,
    accentTint: accentColor
      ? toRgba(accentColor, ACCENT_TINT_ALPHA)
      : undefined,
  };
}
