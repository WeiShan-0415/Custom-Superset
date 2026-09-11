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
import { useEffect, useMemo } from 'react';
import { styled } from '@apache-superset/core/theme';
import { t } from '@apache-superset/core/translation';
import { DataRecordValue } from '@superset-ui/core';
import {
  HazardRiskOutlookDataRecord,
  SupersetPluginChartHazardRiskOutlookProps,
  SupersetPluginChartHazardRiskOutlookStylesProps,
} from './types';

const FORECAST_OFFSETS = [0, 6, 12, 18, 24] as const;
const DAY_FIRST_DATE_PATTERN =
  /^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T](\d{1,2})(?::(\d{2})(?::(\d{2}))?)?)?$/;
const ISO_DATE_ONLY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/** Fixed operational severity colors, independent of the active theme. */
/* eslint-disable theme-colors/no-literal-colors */
const SEVERITY_COLORS: Record<number, string> = {
  3: '#cf1322',
  2: '#fa8c16',
  1: '#faad14',
  0: '#52c41a',
};
/* eslint-enable theme-colors/no-literal-colors */

interface OutlookCell {
  severity: string | null;
  severityLevel: number;
}

interface OutlookRow {
  cells: OutlookCell[];
  hazard: string;
}

function localTimestamp(
  year: string,
  month: string,
  day: string,
  hour = '0',
  minute = '0',
  second = '0',
) {
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return parsedDate.getFullYear() === Number(year) &&
    parsedDate.getMonth() === Number(month) - 1 &&
    parsedDate.getDate() === Number(day)
    ? parsedDate.getTime()
    : Number.NaN;
}

function dayFirstTimestamp(value: string) {
  const match = DAY_FIRST_DATE_PATTERN.exec(value.trim());
  if (!match) {
    return Number.NaN;
  }
  const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
  return localTimestamp(year, month, day, hour, minute, second);
}

const severityDefinitions: Array<{
  rank: number;
  pattern: RegExp;
}> = [
  { rank: 3, pattern: /extreme|emergency|catastrophic/i },
  { rank: 3, pattern: /severe|critical|danger|red/i },
  { rank: 2, pattern: /high|warning|orange/i },
  { rank: 1, pattern: /moderate|watch|yellow|medium/i },
  { rank: 0, pattern: /low|safe|normal|green|minimal/i },
];

function timestampMilliseconds(value: DataRecordValue | undefined) {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return Number.NaN;
  }
  const isoDateOnly = ISO_DATE_ONLY_PATTERN.exec(value.trim());
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    return localTimestamp(year, month, day);
  }
  const dayFirstValue = dayFirstTimestamp(value);
  return Number.isFinite(dayFirstValue) ? dayFirstValue : Date.parse(value);
}

function severityDetails(value: DataRecordValue | undefined) {
  const label = value === null || value === undefined ? '' : String(value);
  const numericRank = Number(label);
  if (label.trim() && Number.isFinite(numericRank)) {
    const rank = Math.max(0, Math.min(3, Math.round(numericRank)));
    return { label, rank };
  }

  const definition = severityDefinitions.find(({ pattern }) =>
    pattern.test(label),
  );
  return definition ? { label, rank: definition.rank } : { label, rank: 0 };
}

export function buildOutlookRows(
  data: HazardRiskOutlookDataRecord[],
  nowMilliseconds: number,
  columns: Pick<
    SupersetPluginChartHazardRiskOutlookProps,
    'hazardColumn' | 'severityColumn' | 'validFromColumn' | 'validToColumn'
  >,
): OutlookRow[] {
  const recordsByHazard = new Map<string, HazardRiskOutlookDataRecord[]>();
  data.forEach(record => {
    const hazard = String(record[columns.hazardColumn] ?? '').trim();
    if (!hazard) {
      return;
    }
    recordsByHazard.set(hazard, [
      ...(recordsByHazard.get(hazard) ?? []),
      record,
    ]);
  });

  return [...recordsByHazard].map(([hazard, records]) => ({
    hazard,
    cells: FORECAST_OFFSETS.map((offsetHours, index) => {
      const pointInTime = nowMilliseconds + offsetHours * 60 * 60 * 1000;
      const nextOffset = FORECAST_OFFSETS[index + 1];
      const windowEnd =
        nextOffset === undefined
          ? pointInTime
          : nowMilliseconds + nextOffset * 60 * 60 * 1000;
      const activeRecords = records.filter(record => {
        const validFrom = timestampMilliseconds(
          record[columns.validFromColumn],
        );
        const validTo = timestampMilliseconds(record[columns.validToColumn]);
        return nextOffset === undefined
          ? validFrom <= pointInTime && pointInTime <= validTo
          : validFrom < windowEnd && validTo > pointInTime;
      });
      const highestRisk = activeRecords
        .map(record => severityDetails(record[columns.severityColumn]))
        .sort((left, right) => right.rank - left.rank)[0];
      return highestRisk
        ? { severity: highestRisk.label, severityLevel: highestRisk.rank }
        : { severity: null, severityLevel: 0 };
    }),
  }));
}

function AlertIcon({ value }: { value: string }) {
  let path = 'M16 3 2 29h28L16 3Zm0 9v8m0 4v1';
  if (/strong\s+winds?|rough\s+seas?/i.test(value)) {
    path =
      'M2 9h18a3 3 0 1 0-3-3M5 14h21a3 3 0 1 0-3-3M2 19h12a3 3 0 1 1-3 3M2 26q3-4 7 0t7 0t7 0t7 0M2 30q3-4 7 0t7 0t7 0t7 0';
  } else if (/rain/i.test(value)) {
    path =
      'M8 20a6 6 0 1 1 1-12 8 8 0 0 1 15 3 5 5 0 0 1 0 10H8m2 3-2 5m9-5-2 5m9-5-2 5';
  } else if (/flood/i.test(value)) {
    path =
      'M8 15v-3h4V8a4 4 0 0 1 8 0v4h4v3M2 20q4-4 8 0t8 0t12 0M2 25q4-4 8 0t8 0t12 0M2 30q4-4 8 0t8 0t12 0';
  } else if (/thunder|storm/i.test(value)) {
    path = 'M17 2 6 18h9l-2 12 13-19H16l1-9Z';
  } else if (/earthquake|seismic/i.test(value)) {
    path = 'M1 16h5l2-6 3 15 4-23 4 28 3-20 3 10 2-4h4';
  } else if (/landslide/i.test(value)) {
    path = 'M16 3 2 29h28L16 3Zm-2 7 3 3-3 4 3 3-3 5m8-5 2 2m-2 3 1 1M9 24l1-2';
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="32"
      viewBox="0 0 32 32"
      width="32"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

const RiskCell = styled.div<{ severityLevel: number }>`
  background: ${({ severityLevel }) => SEVERITY_COLORS[severityLevel]};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  min-height: 34px;
  transition: filter 0.15s ease;

  &:hover {
    filter: brightness(0.94);
  }
`;

const Styles = styled.div<SupersetPluginChartHazardRiskOutlookStylesProps>`
  background-color: ${({ theme }) => theme.colorBgContainer};
  padding: ${({ theme }) => theme.sizeUnit * 4}px;
  border-radius: ${({ theme }) => theme.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.colorBorder};
  box-sizing: border-box;
  height: ${({ height }) => height}px;
  min-height: 220px;
  overflow: auto;
  width: ${({ width }) => width}px;

  .outlook-title {
    color: ${({ theme }) => theme.colorText};
    font-size: ${({ theme }) => theme.fontSizeXL}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    margin: 0 0 ${({ theme }) => theme.sizeUnit * 3}px;
  }

  .outlook-grid {
    display: grid;
    gap: ${({ theme }) => theme.sizeUnit}px;
    grid-template-columns: minmax(150px, 1.25fr) repeat(5, minmax(64px, 1fr));
    min-width: 540px;
    position: relative;
  }

  .time-label {
    align-items: center;
    color: ${({ theme }) => theme.colorTextSecondary};
    display: flex;
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    justify-content: center;
    min-height: 24px;
  }

  .now-marker {
    background: ${({ theme }) => theme.colorText};
    bottom: 0;
    left: 28%;
    pointer-events: none;
    position: absolute;
    top: 22px;
    width: 2px;
    z-index: 2;
  }

  .hazard-label {
    align-items: center;
    color: ${({ theme }) => theme.colorText};
    display: flex;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
    min-height: 38px;
    overflow: hidden;
  }

  .hazard-icon {
    color: ${({ theme }) => theme.colorTextSecondary};
    flex: 0 0 28px;
  }

  .hazard-icon svg {
    display: block;
  }

  .hazard-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-state {
    color: ${({ theme }) => theme.colorTextSecondary};
    grid-column: 1 / -1;
    padding: ${({ theme }) => theme.sizeUnit * 6}px;
    text-align: center;
  }
`;

export default function SupersetPluginChartHazardRiskOutlook(
  props: SupersetPluginChartHazardRiskOutlookProps,
) {
  const {
    data,
    forecastStartMilliseconds,
    hazardColumn,
    height,
    severityColumn,
    validFromColumn,
    validToColumn,
    width,
  } = props;
  const outlookRows = useMemo(
    () =>
      buildOutlookRows(data, forecastStartMilliseconds, {
        hazardColumn,
        severityColumn,
        validFromColumn,
        validToColumn,
      }),
    [
      data,
      forecastStartMilliseconds,
      hazardColumn,
      severityColumn,
      validFromColumn,
      validToColumn,
    ],
  );

  useEffect(() => {
    const markerDate = new Date(forecastStartMilliseconds);
    // Intentional diagnostic for verifying the dashboard time-filter anchor.
    // eslint-disable-next-line no-console
    console.info('[HazardRiskOutlook] Now marker', {
      forecastStartMilliseconds,
      iso: markerDate.toISOString(),
      local: markerDate.toLocaleString(),
    });
  }, [forecastStartMilliseconds]);

  return (
    <Styles height={height} width={width}>
      <h3 className="outlook-title">{props.headerText}</h3>
      <div className="outlook-grid">
        <div aria-hidden="true" />
        {FORECAST_OFFSETS.map(offset => (
          <div
            className="time-label"
            key={offset}
            title={new Date(
              forecastStartMilliseconds + offset * 60 * 60 * 1000,
            ).toLocaleString()}
          >
            {offset === 0 ? t('Now') : t('+%sh', offset)}
          </div>
        ))}
        <div aria-hidden="true" className="now-marker" />
        {outlookRows.length === 0 ? (
          <div className="empty-state">
            {t('No hazard outlook records available')}
          </div>
        ) : (
          outlookRows.flatMap(row => [
            <div className="hazard-label" key={`${row.hazard}-label`}>
              <span aria-hidden="true" className="hazard-icon">
                <AlertIcon value={row.hazard} />
              </span>
              <span className="hazard-name" title={row.hazard}>
                {row.hazard}
              </span>
            </div>,
            ...row.cells.map((cell, index) => {
              const timeLabel = FORECAST_OFFSETS[index];
              const severityLabel = cell.severity ?? t('No active outlook');
              return (
                <RiskCell
                  aria-label={t(
                    '%s at +%s hours: %s',
                    row.hazard,
                    timeLabel,
                    severityLabel,
                  )}
                  key={`${row.hazard}-${timeLabel}`}
                  role="img"
                  severityLevel={cell.severityLevel}
                  title={severityLabel}
                />
              );
            }),
          ])
        )}
      </div>
    </Styles>
  );
}
