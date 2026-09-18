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

// eslint-disable-next-line storybook/prefer-pascal-case -- Runtime defaults, not a Storybook export.
export const incidentColumnDefaults = {
  warning_key_column: 'warning_key',
  title_column: 'title_en',
  location_column: 'location',
  severity_column: 'severity',
  description_column: 'description',
} as const;

export type IncidentColumnControls = Partial<
  Record<keyof typeof incidentColumnDefaults, QueryFormColumn>
>;

/** Resolve the dataset columns used by the selected-incident card. */
export function getIncidentColumns(formData: IncidentColumnControls) {
  return {
    warning_key:
      formData.warning_key_column ?? incidentColumnDefaults.warning_key_column,
    title_en: formData.title_column ?? incidentColumnDefaults.title_column,
    location:
      formData.location_column ?? incidentColumnDefaults.location_column,
    severity:
      formData.severity_column ?? incidentColumnDefaults.severity_column,
    description:
      formData.description_column ?? incidentColumnDefaults.description_column,
  };
}
