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

export type KpiIconStyle = 'circle' | 'square' | 'dot' | 'none';
export type KpiValueColor = 'default' | 'accent';
export type KpiBackground = 'theme' | 'transparent';

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface KpiStatusItem {
  label: string;
  /** Severity level: 3 severe, 2 warning, 1 watch. */
  status: number;
  value: unknown;
}

export interface SupersetPluginChartKpiCardStylesProps {
  height: number;
  width: number;
}

export interface SupersetPluginChartKpiCardCustomizeProps {
  icon: string;
  title: string;
  value: unknown;
  subtitle: string;
  /** Severity level used to color the subtitle, when derived from counts. */
  subtitleStatus?: number;
  statusItems: KpiStatusItem[];
  iconStyle: KpiIconStyle;
  valueColor: KpiValueColor;
  background: KpiBackground;
  showBorder: boolean;
  /** CSS color for the accent; falls back to the theme primary color. */
  accentColor?: string;
  /** Translucent variant of the accent used for icon tiles. */
  accentTint?: string;
}

export type SupersetPluginChartKpiCardQueryFormData = QueryFormData & {
  icon?: string;
  title?: string;
  time_column?: QueryFormColumn | null;
  value_column?: QueryFormMetric | string;
  severe_column?: string;
  warning_column?: string;
  watch_column?: string;
  valueColumn?: QueryFormMetric | string;
  severeColumn?: string;
  warningColumn?: string;
  watchColumn?: string;
  timeColumn?: QueryFormColumn | null;
  subtitleTemplate?: string;
  deriveSeveritySubtitle?: boolean;
  iconStyle?: KpiIconStyle;
  accentColor?: RgbaColor | null;
  valueColor?: KpiValueColor;
  background?: KpiBackground;
  showBorder?: boolean;
};

export type SupersetPluginChartKpiCardProps =
  SupersetPluginChartKpiCardStylesProps &
    SupersetPluginChartKpiCardCustomizeProps;
