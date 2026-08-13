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
import React from 'react';
import * as d3 from 'd3';
import styled from '@emotion/styled';
import { t } from '@apache-superset/core/translation';
import {
  SupersetPluginChartHelloWorldProps,
  SupersetPluginChartHelloWorldStylesProps,
} from './types';
import { scaleBand } from 'd3-scale';

const Styles = styled.div<SupersetPluginChartHelloWorldStylesProps>`
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: hidden;

  .viz-root {
    color-scheme: light;
    --surface-1: #000000;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --text-muted: #898781;
    --track: #e1e0d9;
    --good: #0ca30c;
    --warning: #fab219;
    --serious: #ec835a;
    --critical: #d03b3b;
    height: 100%;
    width: 100%;
    background: var(--surface-1);
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme='light'])) & .viz-root {
      color-scheme: dark;
      --surface-1: #000000;
      --text-primary: #ffffff;
      --text-secondary: #c3c2b7;
      --text-muted: #898781;
      --track: #2c2c2a;
      /* status steps hold their hex in dark mode; already ≥3:1 on #1a1a19 */
    }
  }
  :root[data-theme='dark'] & .viz-root {
    color-scheme: dark;
    --surface-1: #000000;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --text-muted: #898781;
    --track: #2c2c2a;
  }

  .viz-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .viz-subtitle {
    margin: 2px 0 12px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .chart-container {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
  .bar-track {
    fill: var(--track);
  }
  .bar-label {
    fill: var(--text-primary);
    font-size: 12px;
  }
  .bar-value {
    fill: var(--text-primary);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .viz-tooltip {
    position: absolute;
    pointer-events: none;
    background: var(--surface-1);
    color: var(--text-primary);
    border: 1px solid var(--track);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 120ms ease;
  }
`;

// Score -> severity band. Tune the cut points to whatever your metric means.
function severityColor(value: number): string {
  if (value >= 80) return 'var(--critical)';
  if (value >= 55) return 'var(--serious)';
  if (value >= 25) return 'var(--warning)';
  return 'var(--good)';
}

interface Row {
  label: string;
  value: number;
}

// Adapts arbitrary query rows: first string-valued field is the label,
// first number-valued field is the score. Swap for explicit field names
// (e.g. row.hazard / row.risk_score) once you know your dataset's columns.
function toRows(data: Record<string, unknown>[]): Row[] {
  return data.map(row => {
    const labelKey = Object.keys(row).find(k => typeof row[k] === 'string');
    const valueKey = Object.keys(row).find(k => typeof row[k] === 'number');
    return {
      label: labelKey ? String(row[labelKey]) : '',
      value: valueKey ? Number(row[valueKey]) : 0,
    };
  });
}

// Rounded-rect path: square left edge (baseline), 4px-rounded right edge (data tip).
// Falls back to a plain rect when the bar is too short for the radius.
function roundedBarPath(w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h / 2);
  if (w <= 0) return '';
  if (radius <= 0) return `M0,0 H${w} V${h} H0 Z`;
  return `
    M0,0
    H${w - radius}
    A${radius},${radius} 0 0 1 ${w},${radius}
    V${h - radius}
    A${radius},${radius} 0 0 1 ${w - radius},${h}
    H0
    Z
  `;
}

export default function SupersetPluginChartHelloWorld(
  props: SupersetPluginChartHelloWorldProps,
) {
  const { data, height, width, headerText } = props;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    const tooltipEl = tooltipRef.current;
    if (!root || !tooltipEl) return;

    const rows = toRows(data as Record<string, unknown>[]).sort(
      (a, b) => b.value - a.value,
    );

    const containerWidth = root.clientWidth;
    const containerHeight = root.clientHeight;
    const longestLabelLength = Math.max(
      0,
      ...rows.map(row => row.label.length),
    );
    const longestValueLength = Math.max(
      1,
      ...rows.map(row => String(row.value).length),
    );
    const margin = {
      top: 4,
      right: Math.max(52, longestValueLength * 7 + 16),
      bottom: 4,
      left: Math.min(
        Math.max(130, longestLabelLength * 7 + 16),
        containerWidth * 0.35,
      ),
    };
    const chartHeight = Math.max(
      0,
      containerHeight - margin.top - margin.bottom,
    );
    const chartWidth = Math.max(0, containerWidth - margin.left - margin.right);

    const svgRoot = d3.select(root);
    svgRoot.selectAll('svg').remove();

    const svg = svgRoot
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([0, 100])
      .range([0, chartWidth])
      .clamp(true);

    const barThickness = Math.max(
      2,
      Math.min(24, chartHeight / Math.max(rows.length, 1) - 6),
    );
    const y = scaleBand<string>()
      .domain(rows.map(d => d.label))
      .range([0, chartHeight])
      .paddingInner(0.35);

    const row = svg
      .selectAll('g.bar-row')
      .data(rows)
      .join('g')
      .attr('class', 'bar-row')
      .attr(
        'transform',
        (d: RowDatum) =>
          `translate(0,${
            (y(d.label) ?? 0) + (y.bandwidth() - barThickness) / 2
          })`,
      );

    // track (full-width background)
    row
      .append('rect')
      .attr('class', 'bar-track')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', chartWidth)
      .attr('height', barThickness)
      .attr('rx', 4);

    // filled bar, rounded at the tip only (square at the baseline)
    type RowDatum = (typeof rows)[number];
    row
      .append('path')
      .attr('d', (d: RowDatum) =>
        roundedBarPath(x(d.value) ?? 0, barThickness, 4),
      )
      .attr('fill', (d: RowDatum) => severityColor(d.value))
      .on('mousemove', (event: MouseEvent, d: RowDatum) => {
        const [mx, my] = d3.pointer(event, root);
        d3.select(tooltipEl)
          .style('opacity', 1)
          .style('left', `${mx + 12}px`)
          .style('top', `${my - 8}px`)
          .text(`${d.label}: ${d.value}`);
      })
      .on('mouseleave', () => {
        d3.select(tooltipEl).style('opacity', 0);
      });

    // category label, left of the track
    svg
      .selectAll('text.bar-label')
      .data(rows)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', -8)
      .attr('y', (d: RowDatum) => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .text((d: RowDatum) => d.label);

    // value label, outside the full track on the right
    svg
      .selectAll('text.bar-value')
      .data(rows)
      .join('text')
      .attr('class', 'bar-value')
      .attr('x', chartWidth + 8)
      .attr('y', (d: RowDatum) => (y(d.label) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .text((d: RowDatum) => String(d.value));
  }, [data, height, width]);

  return (
    <Styles
      boldText={props.boldText}
      headerFontSize={props.headerFontSize}
      height={height}
      width={width}
    >
      <div className="viz-root" style={{ position: 'relative' }}>
        <h3 className="viz-title">
          {headerText || 'National hazard risk index'}
        </h3>
        <p className="viz-subtitle">
          {t('Composite 0–100 score per hazard, ranked')}
        </p>
        <div ref={rootRef} className="chart-container" />
        <div ref={tooltipRef} className="viz-tooltip" />
      </div>
    </Styles>
  );
}
