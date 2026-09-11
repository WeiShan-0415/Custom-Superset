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
import { ChartProps, DataRecord, getColumnLabel } from '@superset-ui/core';
import { getAlertColumns, getOrderByLabels } from './columns';

/** Map selected query columns to the fields consumed by the alert table. */
export default function transformProps(chartProps: ChartProps) {
  const {
    width,
    height,
    formData,
    rawFormData,
    queriesData,
    hooks,
    emitCrossFilters,
    filterState,
  } = chartProps;
  const { boldText, headerFontSize, headerText } = formData;
  const columns = getAlertColumns(rawFormData);
  const mapRows = (rows: DataRecord[]) =>
    rows.map(row => {
      const mappedRow = { ...row };
      Object.entries(columns).forEach(([field, column]) => {
        if (column !== null && getColumnLabel(column) !== field) {
          mappedRow[field] = row[getColumnLabel(column)] ?? null;
        }
      });
      return mappedRow;
    });
  const data = mapRows((queriesData[0]?.data ?? []) as DataRecord[]);
  const orderByLabels = getOrderByLabels(rawFormData);
  const sortColumns =
    orderByLabels.length > 0
      ? orderByLabels
      : [{ field: 'event_date', ascending: false }];
  return {
    width,
    height,
    data,
    boldText,
    headerFontSize,
    headerText,
    emitCrossFilters,
    selectedWarningKeys: (filterState.selectedValues ?? []).map(String),
    setDataMask: hooks.setDataMask,
    sortColumns,
    warningKeyColumn: getColumnLabel(columns.warning_key),
  };
}
