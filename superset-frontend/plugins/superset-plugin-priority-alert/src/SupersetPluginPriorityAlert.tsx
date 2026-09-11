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
import { useState } from 'react';
import { styled } from '@apache-superset/core/theme';
import { t } from '@apache-superset/core/translation';
import { DataRecord } from '@superset-ui/core';
import {
  Empty,
  Flex,
  Pagination,
  Tabs,
  Typography,
} from '@superset-ui/core/components';
import { SupersetPluginPriorityAlertProps } from './types';

const SEVERITY_RANKS: [values: string[], rank: number][] = [
  [['critical', 'severe', 'high', '3'], 3],
  [['warning', 'medium', '2'], 2],
  [['watch', 'low', '1'], 1],
];

/** Rank severities so the highest-priority alerts can color first. */
function severityRank(severity: string): number {
  return SEVERITY_RANKS.find(([values]) => values.includes(severity))?.[1] ?? 0;
}

/** Fixed severity colors, independent of the active Superset theme. */
/* eslint-disable theme-colors/no-literal-colors */
const SEVERITY_COLORS: Record<number, string> = {
  3: '#cf1322',
  2: '#fa8c16',
  1: '#faad14',
  0: '#52c41a',
};
/* eslint-enable theme-colors/no-literal-colors */

const Container = styled.div<{ height: number; width: number }>`
  box-sizing: border-box;
  container-type: inline-size;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: auto;
  padding: ${({ theme }) => theme.sizeUnit * 3}px;
  background: ${({ theme }) => theme.colorBgContainer};
  color: ${({ theme }) => theme.colorText};
`;

const AlertList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${({ theme }) => theme.sizeUnit * 2}px 0 0;
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  overflow: hidden;
`;

const AlertItem = styled.li<{ severity: string }>`
  border-inline-start: 4px solid
    ${({ severity }) => SEVERITY_COLORS[severityRank(severity)]};
  font-size: ${({ theme }) => theme.fontSizeHeading5}px;
  font-size: clamp(
    ${({ theme }) => theme.fontSize}px,
    3cqw,
    ${({ theme }) => theme.fontSizeHeading5}px
  );
  & + & {
    border-top: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  }
  summary {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 3}px;
    padding: ${({ theme }) => theme.sizeUnit * 3}px;
    min-height: 70px;
    box-sizing: border-box;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colorPrimary};
    outline-offset: -2px;
  }
  summary:hover {
    background: ${({ theme }) => theme.colorFillQuaternary};
  }
  .alert-icon {
    font-size: 28px;
    flex: 0 0 32px;
    text-align: center;
  }
  .alert-content {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .alert-title {
    display: block;
    font-size: ${({ theme }) => theme.fontSizeHeading4}px;
    font-size: clamp(
      ${({ theme }) => theme.fontSizeHeading5}px,
      4cqw,
      ${({ theme }) => theme.fontSizeHeading4}px
    );
  }
  .alert-time {
    white-space: nowrap;
    font-size: ${({ theme }) => theme.fontSizeHeading5}px;
    font-size: clamp(
      ${({ theme }) => theme.fontSize}px,
      3cqw,
      ${({ theme }) => theme.fontSizeHeading5}px
    );
  }
  .alert-chevron {
    font-size: 24px;
    color: ${({ theme }) => theme.colorTextSecondary};
  }
  details[open] .alert-chevron {
    transform: rotate(90deg);
  }
  .alert-description {
    padding: 0 ${({ theme }) => theme.sizeUnit * 3}px
      ${({ theme }) => theme.sizeUnit * 3}px;
  }
  &.alert-selected {
    background: ${({ theme }) => theme.colorPrimaryBg};
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colorPrimary};
  }
`;

const ALERT_ROW_HEIGHT = 70;
const NON_LIST_HEIGHT = 151;
const ALL_EVENT_TYPES = '__all_event_types__';

/** Fit as many complete alert rows as possible within the chart height. */
export function calculatePageSize(height: number) {
  return Math.max(1, Math.floor((height - NON_LIST_HEIGHT) / ALERT_ROW_HEIGHT));
}

/** Parse complete timestamps without assigning undated alerts to today. */
function alertDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  if (typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(value))
    return undefined;
  const date = new Date(
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value,
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Compare two column values, treating dates and numbers appropriately. */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const dateA = alertDate(a);
  const dateB = alertDate(b);
  if (dateA && dateB) return dateA.getTime() - dateB.getTime();
  return String(a).localeCompare(String(b));
}

/** Compare two rows across every sort key, in priority order. */
function compareRows(
  a: DataRecord,
  b: DataRecord,
  sortColumns: { field: string; ascending: boolean }[],
): number {
  for (const { field, ascending } of sortColumns) {
    const cmp = compareValues(a[field], b[field]);
    if (cmp !== 0) return ascending ? cmp : -cmp;
  }
  return 0;
}

/** Return a normalized event type for grouping alerts into tabs. */
function eventType(row: DataRecord): string | undefined {
  if (row.event_type === null || row.event_type === undefined) return undefined;
  const value = String(row.event_type).trim();
  return value || undefined;
}

/** Make lower-case event types easier to scan without changing acronyms. */
function eventTypeLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/(^|\s)\S/g, character => character.toUpperCase());
}

/** Draw consistent outline icons for the supported hazard categories. */
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
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

/** Render query rows as expandable alerts using Superset's time-filtered data. */
export default function SupersetPluginPriorityAlert({
  data,
  height,
  width,
  headerText,
  boldText,
  headerFontSize,
  emitCrossFilters,
  selectedWarningKeys,
  setDataMask,
  sortColumns,
  warningKeyColumn,
}: SupersetPluginPriorityAlertProps) {
  const [page, setPage] = useState(1);
  const [activeEventType, setActiveEventType] = useState(ALL_EVENT_TYPES);
  const pageSize = calculatePageSize(height);
  const [paginationInputs, setPaginationInputs] = useState({
    data,
    pageSize,
  });
  if (
    data !== paginationInputs.data ||
    pageSize !== paginationInputs.pageSize
  ) {
    setPaginationInputs({ data, pageSize });
    setPage(1);
  }
  const eventTypes = Array.from(
    new Set(data.map(eventType).filter((value): value is string => !!value)),
  );
  const selectedEventType =
    activeEventType === ALL_EVENT_TYPES || eventTypes.includes(activeEventType)
      ? activeEventType
      : ALL_EVENT_TYPES;
  if (selectedEventType !== activeEventType) {
    setActiveEventType(selectedEventType);
    setPage(1);
  }
  const alerts = data
    .map((row, index) => ({
      row,
      index,
      date: alertDate(row.event_date),
      severity: String(row.severity ?? 'info')
        .trim()
        .toLowerCase(),
    }))
    .sort((a, b) => compareRows(a.row, b.row, sortColumns));
  const visibleAlerts =
    selectedEventType === ALL_EVENT_TYPES
      ? alerts
      : alerts.filter(({ row }) => eventType(row) === selectedEventType);
  const pagedAlerts = visibleAlerts.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const selectWarning = (warningKey: unknown) => {
    if (
      !emitCrossFilters ||
      warningKey === null ||
      warningKey === undefined ||
      warningKey === ''
    ) {
      return;
    }
    const selected = selectedWarningKeys.includes(String(warningKey));
    const values = selected ? [] : [warningKey];
    setDataMask({
      extraFormData: {
        filters: values.length
          ? [{ col: warningKeyColumn, op: 'IN', val: values }]
          : [],
      },
      filterState: {
        value: values.length ? values : null,
        selectedValues: values.length ? values : null,
      },
    });
  };

  return (
    <Container height={height} width={width}>
      <Typography.Title
        level={4}
        css={theme => {
          const maximumFontSize =
            theme[headerFontSize] || theme.fontSizeHeading4;
          return {
            marginTop: 0,
            fontWeight: boldText ? theme.fontWeightStrong : 'normal',
            fontSize: `clamp(${theme.fontSizeHeading5}px, 5cqw, ${maximumFontSize}px)`,
          };
        }}
      >
        {headerText || t('Priority alerts')}
      </Typography.Title>
      <Tabs
        activeKey={selectedEventType}
        onChange={key => {
          setActiveEventType(key);
          setPage(1);
        }}
        items={[
          { key: ALL_EVENT_TYPES, label: t('All') },
          ...eventTypes.map(value => ({
            key: value,
            label: eventTypeLabel(value),
          })),
        ]}
      />
      {visibleAlerts.length === 0 ? (
        <Empty description={t('No alerts today')} />
      ) : (
        <AlertList aria-label={t('Priority alerts')}>
          {pagedAlerts.map(({ row, index, date, severity }) => {
            const title = String(row.title_en ?? t('Untitled alert'));
            const warningKey = row.warning_key;
            const isSelected = selectedWarningKeys.includes(
              String(warningKey ?? ''),
            );
            return (
              <AlertItem
                className={isSelected ? 'alert-selected' : undefined}
                key={String(warningKey ?? index)}
                severity={severity}
              >
                <details>
                  <summary onClick={() => selectWarning(warningKey)}>
                    <span className="alert-icon" aria-hidden="true">
                      <AlertIcon value={String(row.type ?? title)} />
                    </span>
                    <span className="alert-content">
                      <Typography.Text strong className="alert-title">
                        {title}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        {String(row.location ?? '')}
                      </Typography.Text>
                    </span>
                    <time
                      className="alert-time"
                      dateTime={date?.toISOString()}
                      title={date?.toLocaleString()}
                    >
                      {date
                        ? date.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : '—'}
                    </time>
                    <span className="alert-chevron" aria-hidden="true">
                      ›
                    </span>
                  </summary>
                  <div className="alert-description">
                    <Typography.Text strong>
                      {t('Severity')}: {severity}
                    </Typography.Text>
                    <div>{date?.toLocaleString()}</div>
                    <div>
                      {String(
                        row.description ??
                          t('No additional details available.'),
                      )}
                    </div>
                  </div>
                </details>
              </AlertItem>
            );
          })}
        </AlertList>
      )}
      {visibleAlerts.length > pageSize && (
        <Flex
          justify="flex-end"
          css={theme => ({ marginTop: theme.sizeUnit * 3 })}
        >
          <Pagination
            size="small"
            current={page}
            pageSize={pageSize}
            total={visibleAlerts.length}
            onChange={setPage}
            showSizeChanger={false}
          />
        </Flex>
      )}
    </Container>
  );
}
