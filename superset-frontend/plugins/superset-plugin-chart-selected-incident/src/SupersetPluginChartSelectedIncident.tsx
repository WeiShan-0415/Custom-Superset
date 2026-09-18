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
import { styled } from '@apache-superset/core/theme';
import { t } from '@apache-superset/core/translation';
import { Typography } from '@superset-ui/core/components/Typography';
import {
  SupersetPluginChartSelectedIncidentProps,
  SupersetPluginChartSelectedIncidentStylesProps,
} from './types';

const SEVERITY_RANKS: [values: string[], rank: number][] = [
  [['critical', 'severe', 'high', '3'], 3],
  [['warning', 'medium', '2'], 2],
  [['watch', 'low', '1'], 1],
];

function severityRank(severity: string): number {
  return SEVERITY_RANKS.find(([values]) => values.includes(severity))?.[1] ?? 0;
}

/* eslint-disable theme-colors/no-literal-colors */
const SEVERITY_COLORS: Record<number, string> = {
  3: '#cf1322',
  2: '#fa8c16',
  1: '#faad14',
  0: '#52c41a',
};
/* eslint-enable theme-colors/no-literal-colors */

const Card = styled.div<{ height: number; width: number }>`
  box-sizing: border-box;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: auto;
  padding: ${({ theme }) => theme.sizeUnit * 4}px;
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  background: ${({ theme }) => theme.colorBgContainer};
`;

const CardHeader = styled.div<{
  $boldText: boolean;
  $headerFontSize: SupersetPluginChartSelectedIncidentStylesProps['headerFontSize'];
}>`
  .ant-typography {
    margin-top: 0;
    font-weight: ${({ $boldText, theme }) =>
      $boldText ? theme.fontWeightStrong : 'normal'};
    font-size: ${({ $headerFontSize, theme }) =>
      theme[$headerFontSize] || theme.fontSizeHeading4}px;
  }
`;

/** Display the incident selected through the priority-alert cross-filter. */
export default function SupersetPluginChartSelectedIncident({
  data,
  hasSelection,
  height,
  width,
  headerText,
  boldText,
  headerFontSize,
}: SupersetPluginChartSelectedIncidentProps) {
  const incident = hasSelection ? data[0] : undefined;
  const severity = String(incident?.severity ?? '')
    .trim()
    .toLowerCase();

  return (
    <Card height={height} width={width}>
      <CardHeader $boldText={boldText} $headerFontSize={headerFontSize}>
        <Typography.Title level={4}>
          {headerText || t('Selected incident')}
        </Typography.Title>
      </CardHeader>
      {!incident ? (
        <Typography.Text type="secondary" role="status">
          {t('Select an incident from Priority alerts')}
        </Typography.Text>
      ) : (
        <>
          <Typography.Title
            level={3}
            style={{ color: SEVERITY_COLORS[severityRank(severity)] }}
          >
            {String(incident.title_en ?? t('Untitled incident'))}
            {incident.location ? ` — ${String(incident.location)}` : ''}
          </Typography.Title>
          <Typography.Paragraph>
            {String(incident.description ?? t('No description available.'))}
          </Typography.Paragraph>
        </>
      )}
    </Card>
  );
}
