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
import { QueryFormData, DataRecord } from '@superset-ui/core';
import {
  AlertColumnControls,
  AlertSortControls,
  AlertTimeControls,
} from './plugin/columns';

export interface SupersetPluginPriorityAlertStylesProps {
  height: number;
  width: number;
  headerFontSize:
    | 'fontSizeSM'
    | 'fontSize'
    | 'fontSizeLG'
    | 'fontSizeXL'
    | 'fontSizeHeading1'
    | 'fontSizeHeading2'
    | 'fontSizeHeading3'
    | 'fontSizeHeading4'
    | 'fontSizeHeading5';
  boldText: boolean;
}

interface SupersetPluginPriorityAlertCustomizeProps {
  headerText: string;
}

export type SupersetPluginPriorityAlertQueryFormData = QueryFormData &
  AlertColumnControls &
  AlertSortControls &
  AlertTimeControls &
  SupersetPluginPriorityAlertStylesProps &
  SupersetPluginPriorityAlertCustomizeProps;

export type SupersetPluginPriorityAlertProps =
  SupersetPluginPriorityAlertStylesProps &
    SupersetPluginPriorityAlertCustomizeProps & {
      data: DataRecord[];
      emitCrossFilters: boolean;
      selectedWarningKeys: string[];
      setDataMask: (dataMask: Record<string, unknown>) => void;
      // Sort keys in priority order; the first entry breaks ties, then the
      // second, and so on.
      sortColumns: { field: string; ascending: boolean }[];
      warningKeyColumn: string;
    };
