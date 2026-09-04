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
import { DataRecord, QueryFormData, QueryFormMetric } from '@superset-ui/core';

export interface SupersetPluginChartKpiCardStylesProps {
  height: number;
  width: number;
}

export interface SupersetPluginChartKpiCardCustomizeProps {
  icon: string;
  title: string;
  valueColumn: string;
  textColumn: string;
  statusColumn: string;
  severeColumn: string;
  warningColumn: string;
  watchColumn: string;
}

export type SupersetPluginChartKpiCardQueryFormData = QueryFormData & {
  icon?: string;
  title?: string;
  value_column?: QueryFormMetric | string;
  text_column?: string;
  status_column?: string;
  severe_column?: string;
  warning_column?: string;
  watch_column?: string;
  valueColumn?: string;
  textColumn?: string;
  statusColumn?: string;
  severeColumn?: string;
  warningColumn?: string;
  watchColumn?: string;
};

export type SupersetPluginChartKpiCardProps =
  SupersetPluginChartKpiCardStylesProps &
    SupersetPluginChartKpiCardCustomizeProps & {
      data: DataRecord[];
    };
