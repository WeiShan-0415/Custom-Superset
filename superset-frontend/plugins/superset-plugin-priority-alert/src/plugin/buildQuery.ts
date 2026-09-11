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
  buildQueryContext,
  getColumnLabel,
  QueryFormData,
} from '@superset-ui/core';
import {
  AlertColumnControls,
  AlertSortControls,
  AlertTimeControls,
  getAlertColumns,
  getOrderByColumns,
} from './columns';

/** Include every mapped alert field along with any extra grouping columns. */
export default function buildQuery(
  formData: QueryFormData &
    AlertColumnControls &
    AlertSortControls &
    AlertTimeControls,
) {
  const timeColumn = formData.time_column ?? 'event_time';
  const selectedColumns = Object.values(getAlertColumns(formData)).filter(
    column => column !== null,
  );
  const orderByColumns = getOrderByColumns(formData).map(
    ({ column }) => column,
  );
  return buildQueryContext(formData, baseQueryObject => {
    const columns = [
      ...selectedColumns,
      timeColumn,
      ...orderByColumns,
      ...(formData.cols ?? []),
      ...(baseQueryObject.columns ?? []),
    ];
    const uniqueColumns = [
      ...new Map(
        columns.map(column => [getColumnLabel(column), column]),
      ).values(),
    ];
    return [
      {
        ...baseQueryObject,
        columns: uniqueColumns,
        granularity: getColumnLabel(timeColumn),
      },
    ];
  });
}
