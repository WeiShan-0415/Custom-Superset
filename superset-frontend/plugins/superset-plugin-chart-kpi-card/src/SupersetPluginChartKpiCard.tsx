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

const Card = styled.div<{ height: number; width: number }>`
  align-items: center;
  background: ${({ theme }) => theme.colorBgContainer};
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  box-sizing: border-box;
  display: flex;
  gap: ${({ theme }) => theme.sizeUnit * 2}px;
  height: ${({ height }) => height}px;
  overflow: hidden;
  padding: ${({ theme }) => theme.sizeUnit * 5}px;
  width: ${({ width }) => width}px;
`;

const Icon = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.colorFillSecondary};
  border-radius: 50%;
  display: flex;
  flex: 0 0 auto;
  font-size: ${({ theme }) => theme.fontSizeHeading2}px;
  height: 52px;
  justify-content: center;
  margin-block: ${({ theme }) => theme.sizeUnit * 2}px;
  margin-inline-end: ${({ theme }) => theme.sizeUnit * 2}px;
  margin-inline-start: 0;
  overflow: hidden;
  width: 52px;

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
  gap: ${({ theme }) => theme.sizeUnit * 5}px;
  justify-content: flex-start;
  min-width: 0;
`;

const Divider = styled.div`
  align-self: stretch;
  border-inline-start: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  flex: 0 0 auto;
  margin-inline-end: ${({ theme }) => theme.sizeUnit * 8}px;
  margin-inline-start: ${({ theme }) => theme.sizeUnit * 8}px;
`;

const Title = styled.div`
  color: ${({ theme }) => theme.colorTextSecondary};
  font-size: ${({ theme }) => theme.fontSize}px;
  overflow-wrap: anywhere;
  white-space: normal;
`;

const Value = styled.div`
  color: ${({ theme }) => theme.colorText};
  font-size: ${({ theme }) => theme.fontSizeHeading1}px;
  font-weight: ${({ theme }) => theme.fontWeightStrong};
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SupportingText = styled.div`
  color: ${({ theme }) => theme.colorTextSecondary};
  font-size: ${({ theme }) => theme.fontSize}px;
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
  gap: ${({ theme }) => theme.sizeUnit * 2}px;
  min-width: 0;
`;

const StatusItem = styled.div`
  align-items: center;
  color: ${({ theme }) => theme.colorText};
  display: flex;
  font-size: ${({ theme }) => theme.fontSize}px;
  gap: ${({ theme }) => theme.sizeUnit * 2}px;
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
  height: 10px;
  width: 10px;

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
  const statusItems = [
    { column: severeColumn, label: 'Severe', status: 3 },
    { column: warningColumn, label: 'Warning', status: 2 },
    { column: watchColumn, label: 'Watch', status: 1 },
  ].filter(item => item.column);

  return (
    <Card height={height} width={width}>
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
