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
import { SupersetPluginChartKpiCardProps } from './types';

const BASE_CARD_WIDTH = 560;
const BASE_CARD_HEIGHT = 280;
const MIN_CARD_SCALE = 0.6;
const MIN_FONT_SCALE = 0.35;
const FONT_SCALE_BOOST = 1.1;

type ResponsiveCardProps = {
  $fontScale: number;
  $scale: number;
  height: number;
  width: number;
};

/** Keeps every visual element proportional when the chart is resized. */
const getCardScale = (width: number, height: number) =>
  Math.max(
    MIN_CARD_SCALE,
    Math.min(1, width / BASE_CARD_WIDTH, height / BASE_CARD_HEIGHT),
  );

/** Scales typography directly from the chart width. */
const getFontScale = (width: number) =>
  Math.max(MIN_FONT_SCALE, Math.min(1, width / BASE_CARD_WIDTH));

const Card = styled.div<ResponsiveCardProps>`
  --kpi-dot-size: ${({ $scale }) => 10 * $scale}px;
  --kpi-font-heading2: ${({ $fontScale, theme }) =>
    theme.fontSizeHeading2 * $fontScale * FONT_SCALE_BOOST}px;
  --kpi-font-heading4: ${({ $fontScale, theme }) =>
    theme.fontSizeHeading4 * $fontScale * FONT_SCALE_BOOST}px;
  --kpi-font-value: ${({ $fontScale, theme }) =>
    theme.fontSizeHeading1 * 1.25 * $fontScale * FONT_SCALE_BOOST}px;
  --kpi-icon-size: ${({ $scale }) => 52 * $scale}px;
  --kpi-radius: ${({ $scale, theme }) => theme.borderRadiusLG * $scale}px;
  --kpi-space-2: ${({ $scale, theme }) => theme.sizeUnit * 2 * $scale}px;
  --kpi-space-5: ${({ $scale, theme }) => theme.sizeUnit * 5 * $scale}px;
  --kpi-space-8: ${({ $scale, theme }) => theme.sizeUnit * 8 * $scale}px;

  align-items: center;
  background: ${({ theme }) => theme.colorBgContainer};
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: var(--kpi-radius);
  box-sizing: border-box;
  display: flex;
  gap: var(--kpi-space-2);
  height: ${({ height }) => height}px;
  overflow: hidden;
  padding: var(--kpi-space-5);
  width: ${({ width }) => width}px;
`;

const Icon = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.colorFillSecondary};
  border-radius: 50%;
  display: flex;
  flex: 0 0 auto;
  font-size: var(--kpi-font-heading2);
  height: var(--kpi-icon-size);
  justify-content: center;
  margin-block: var(--kpi-space-2);
  margin-inline-end: var(--kpi-space-2);
  margin-inline-start: 0;
  overflow: hidden;
  width: var(--kpi-icon-size);

  img {
    height: 60%;
    object-fit: contain;
    width: 60%;
  }
`;

const Content = styled.div`
  min-width: 0;
`;

const PrimarySection = styled.div`
  align-items: center;
  display: flex;
  flex: 1.1 1 0;
  gap: var(--kpi-space-5);
  justify-content: flex-start;
  min-width: 0;
`;

const Divider = styled.div`
  align-self: stretch;
  border-inline-start: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  flex: 0 0 auto;
  margin-inline-end: var(--kpi-space-8);
  margin-inline-start: var(--kpi-space-8);
`;

const Title = styled.div`
  color: ${({ theme }) => theme.colorTextSecondary};
  font-size: var(--kpi-font-heading4);
  overflow-wrap: anywhere;
  white-space: normal;
`;

const Value = styled.div`
  color: ${({ theme }) => theme.colorText};
  font-size: var(--kpi-font-value);
  font-weight: ${({ theme }) => theme.fontWeightStrong};
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SupportingText = styled.div`
  color: ${({ theme }) => theme.colorTextSecondary};
  font-size: var(--kpi-font-heading4);
  font-weight: ${({ theme }) => theme.fontWeightStrong};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.severity--severe {
    color: ${({ theme }) => theme.colorError};
  }

  &.severity--warning {
    color: ${({ theme }) => theme.colorWarningTextActive};
  }

  &.severity--watch {
    color: ${({ theme }) => theme.colorWarning};
  }
`;

const StatusList = styled.div`
  display: flex;
  flex: 0.9 1 0;
  flex-direction: column;
  gap: var(--kpi-space-2);
  min-width: 0;
`;

const StatusItem = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.colorText};
  display: flex;
  font-size: var(--kpi-font-heading4);
  gap: var(--kpi-space-2);
  overflow: hidden;
  white-space: nowrap;
  width: 100%;

  span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StatusDot = styled.span`
  background: currentColor;
  border-radius: 50%;
  flex: 0 0 auto;
  height: var(--kpi-dot-size);
  width: var(--kpi-dot-size);

  &.severity--severe {
    color: ${({ theme }) => theme.colorError};
  }

  &.severity--warning {
    color: ${({ theme }) => theme.colorWarningTextActive};
  }

  &.severity--watch {
    color: ${({ theme }) => theme.colorWarning};
  }
`;

const isImageUrl = (icon: string) => /^(https?:|data:image\/)/i.test(icon);

const displayValue = (value: unknown) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

const getSeverityClass = (status: unknown, supportingText: unknown) => {
  const numericSeverityClasses: Record<number, string> = {
    1: 'severity--watch',
    2: 'severity--warning',
    3: 'severity--severe',
  };

  if (status !== '' && status !== null && status !== undefined) {
    return numericSeverityClasses[Number(status)];
  }

  const normalizedValue = displayValue(supportingText).toLowerCase();
  const severityLevels = ['severe', 'warning', 'watch'];
  const severity = severityLevels.find(level =>
    normalizedValue.includes(level),
  );

  return severity ? `severity--${severity}` : undefined;
};

export default function SupersetPluginChartKpiCard({
  data,
  height,
  icon,
  severeColumn,
  statusColumn,
  textColumn,
  title,
  valueColumn,
  warningColumn,
  watchColumn,
  width,
}: SupersetPluginChartKpiCardProps) {
  const firstRow = data[0];
  const value = firstRow?.[valueColumn];
  const supportingText = firstRow?.[textColumn];
  const status = firstRow?.[statusColumn];
  const fontScale = getFontScale(width);
  const scale = getCardScale(width, height);
  const statusItems = [
    { column: severeColumn, label: 'Severe', status: 3 },
    { column: warningColumn, label: 'Warning', status: 2 },
    { column: watchColumn, label: 'Watch', status: 1 },
  ].filter(item => item.column);

  return (
    <Card $fontScale={fontScale} $scale={scale} height={height} width={width}>
      <PrimarySection>
        <Icon>
          {isImageUrl(icon) ? <img alt="" src={icon} /> : <span>{icon}</span>}
        </Icon>
        <Content>
          <Title title={title}>{title}</Title>
          <Value title={displayValue(value)}>{displayValue(value)}</Value>
          <SupportingText
            className={getSeverityClass(status, supportingText)}
            title={displayValue(supportingText)}
          >
            {displayValue(supportingText)}
          </SupportingText>
        </Content>
      </PrimarySection>
      {statusItems.length > 0 && (
        <>
          <Divider />
          <StatusList>
            {statusItems.map(item => {
              const rowText = `${displayValue(firstRow?.[item.column])} ${item.label}`;

              return (
                <StatusItem key={item.status} title={rowText}>
                  <StatusDot
                    className={getSeverityClass(item.status, rowText)}
                  />
                  <span>{rowText}</span>
                </StatusItem>
              );
            })}
          </StatusList>
        </>
      )}
    </Card>
  );
}
