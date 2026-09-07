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
import { QueryFormColumn } from '@superset-ui/core';

export const alertColumnDefaults = {
  title_column: 'title_en',
  location_column: 'location',
  event_date_column: 'event_date',
  severity_column: 'severity',
  type_column: null,
  description_column: null,
} as const;

export type AlertColumnControls = Partial<
  Record<keyof typeof alertColumnDefaults, QueryFormColumn | null>
>;

export interface AlertSortControls {
  sort_column?: QueryFormColumn | null;
  sort_order?: 'asc' | 'desc';
}

/** Resolve selected columns while preserving the original dataset defaults. */
export function getAlertColumns(formData: AlertColumnControls) {
  return {
    title_en: formData.title_column ?? alertColumnDefaults.title_column,
    location: formData.location_column ?? alertColumnDefaults.location_column,
    event_date:
      formData.event_date_column ?? alertColumnDefaults.event_date_column,
    severity: formData.severity_column ?? alertColumnDefaults.severity_column,
    type: formData.type_column ?? null,
    description: formData.description_column ?? null,
  };
}
