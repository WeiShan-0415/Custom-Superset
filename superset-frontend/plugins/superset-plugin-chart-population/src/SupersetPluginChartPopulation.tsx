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
import { t } from '@apache-superset/core/translation';
import { styled } from '@apache-superset/core/theme';
import { Icons } from '@superset-ui/core/components';
import {
  PopulationCategory,
  SupersetPluginChartPopulationProps,
  SupersetPluginChartPopulationStylesProps,
} from './types';

const Styles = styled.div<SupersetPluginChartPopulationStylesProps>`
  background: ${({ theme }) => theme.colorBgContainer};
  border: 1px solid ${({ theme }) => theme.colorBorder};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colorText};
  height: ${({ height }) => height}px;
  min-height: 0;
  overflow: auto;
  padding: ${({ height, theme }) => theme.sizeUnit * (height < 420 ? 3 : 4)}px;
  width: ${({ width }) => width}px;

  * {
    box-sizing: border-box;
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  .population-header {
    align-items: center;
    display: flex;
    flex-direction: ${({ width }) => (width < 480 ? 'column' : 'row')};
    gap: ${({ theme }) => theme.sizeUnit * 3}px;
    justify-content: space-between;
    margin-bottom: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 3 : 5)}px;
  }

  .population-heading {
    align-items: center;
    align-self: ${({ width }) => (width < 480 ? 'stretch' : 'auto')};
    display: flex;
    gap: ${({ theme }) => theme.sizeUnit * 3}px;
    min-width: 0;
  }

  .population-heading-icon {
    align-items: center;
    background: ${({ theme }) => theme.colorPrimaryBg};
    border: 1px solid ${({ theme }) => theme.colorPrimaryBorder};
    border-radius: ${({ theme }) => theme.borderRadiusLG}px;
    color: ${({ theme }) => theme.colorPrimary};
    display: flex;
    flex: 0 0 auto;
    height: ${({ theme }) => theme.sizeUnit * 11}px;
    justify-content: center;
    width: ${({ theme }) => theme.sizeUnit * 11}px;
  }

  .population-title {
    font-size: ${({ theme }) => theme.fontSizeXL}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    line-height: 1.25;
  }

  .population-subtitle {
    color: ${({ theme }) => theme.colorTextSecondary};
    font-size: ${({ theme }) => theme.fontSize}px;
    margin-top: ${({ theme }) => theme.sizeUnit}px;
  }

  .population-location {
    align-self: ${({ width }) => (width < 480 ? 'flex-start' : 'auto')};
    background: ${({ theme }) => theme.colorPrimaryBg};
    border: 1px solid ${({ theme }) => theme.colorPrimaryBorder};
    border-radius: ${({ theme }) => theme.borderRadiusLG * 2}px;
    color: ${({ theme }) => theme.colorText};
    flex: 0 0 auto;
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    max-width: 100%;
    overflow: hidden;
    padding: ${({ theme }) =>
      `${theme.sizeUnit + 1}px ${theme.sizeUnit * 3}px`};
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .population-summary {
    display: grid;
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
    grid-template-columns: ${({ width }) =>
      width >= 560 ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)'};
    margin-bottom: ${({ theme }) => theme.sizeUnit * 3}px;
  }

  .population-card,
  .population-panel {
    background: ${({ theme }) => theme.colorFillAlter};
    border: 1px solid ${({ theme }) => theme.colorBorder};
    border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  }

  .population-card {
    min-height: ${({ height }) => (height < 420 ? 88 : 116)}px;
    padding: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 3 : 4)}px;
  }

  .population-card--accent {
    background: ${({ theme }) => theme.colorPrimaryBg};
    border-color: ${({ theme }) => theme.colorPrimaryBorder};
  }

  .population-card-label {
    color: ${({ theme }) => theme.colorTextSecondary};
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    letter-spacing: 0.01em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .population-card-value {
    font-size: ${({ width }) => Math.max(22, Math.min(32, width / 21))}px;
    font-variant-numeric: tabular-nums;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    line-height: 1.15;
    margin-top: ${({ theme }) => theme.sizeUnit * 3}px;
  }

  .population-card-helper {
    color: ${({ theme }) => theme.colorTextSecondary};
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    line-height: 1.3;
  }

  .population-panel {
    padding: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 3 : 4)}px;
  }

  .population-panel-title {
    font-size: ${({ theme }) => theme.fontSize}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    line-height: 1.4;
  }

  .population-breakdown-row {
    align-items: center;
    display: grid;
    gap: ${({ theme }) => theme.sizeUnit * 4}px;
    grid-template-columns: ${({ width }) =>
      width >= 520
        ? 'minmax(150px, 0.9fr) minmax(120px, 1.5fr) minmax(64px, auto)'
        : 'minmax(0, 1fr) auto'};
    margin-top: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 3 : 4)}px;
  }

  .population-category-label,
  .population-category-age,
  .population-number,
  .population-percentage {
    display: block;
  }

  .population-category-label,
  .population-number {
    font-size: ${({ theme }) => theme.fontSize}px;
  }

  .population-category-age,
  .population-percentage {
    color: ${({ theme }) => theme.colorTextSecondary};
    font-size: ${({ theme }) => theme.fontSizeSM}px;
    margin-top: 2px;
  }

  .population-track {
    background: ${({ theme }) => theme.colorFillSecondary};
    border-radius: ${({ theme }) => theme.borderRadiusSM}px;
    grid-column: ${({ width }) => (width < 520 ? '1 / -1' : 'auto')};
    grid-row: ${({ width }) => (width < 520 ? '2' : 'auto')};
    height: ${({ theme }) => theme.sizeUnit * 2}px;
    overflow: hidden;
  }

  .population-bar {
    background: ${({ theme }) => theme.colorPrimary};
    border-radius: inherit;
    height: 100%;
    min-width: ${({ theme }) => theme.sizeUnit}px;
  }

  .population-stat {
    font-variant-numeric: tabular-nums;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    text-align: right;
  }
`;

const numberFormatter = new Intl.NumberFormat('en-MY', {
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat('en-MY', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const categoryLabels: Record<
  PopulationCategory['key'],
  { label: string; ageRange: string }
> = {
  children: { label: t('Children & youth'), ageRange: t('Ages 0–19') },
  adults: { label: t('Adults'), ageRange: t('Ages 20–59') },
  elderly: { label: t('Older people'), ageRange: t('Ages 60+') },
};

/** Renders one metric in the population summary. */
function SummaryCard({
  accent = false,
  helper,
  label,
  value,
}: {
  accent?: boolean;
  helper: string;
  label: string;
  value: number;
}) {
  return (
    <article
      className={`population-card${accent ? ' population-card--accent' : ''}`}
    >
      <div className="population-card-label">{label}</div>
      <div className="population-card-value">
        {numberFormatter.format(value)}
      </div>
      <div className="population-card-helper">{helper}</div>
    </article>
  );
}

/** Renders the population impact overview and demographic breakdown. */
export default function SupersetPluginChartPopulation({
  categories,
  height,
  location,
  totalPeople,
  width,
}: SupersetPluginChartPopulationProps) {
  const categoryByKey = new Map(
    categories.map(category => [category.key, category]),
  );
  const children = categoryByKey.get('children');
  const elderly = categoryByKey.get('elderly');

  return (
    <Styles height={height} width={width}>
      <header className="population-header">
        <div className="population-heading">
          <div className="population-heading-icon">
            <Icons.UsergroupAddOutlined iconSize="xl" />
          </div>
          <div>
            <h2 className="population-title">{t('Population impact')}</h2>
            <p className="population-subtitle">
              {t('Estimated population in the selected district')}
            </p>
          </div>
        </div>
        <div className="population-location" title={location}>
          {location}
        </div>
      </header>

      <section
        className="population-summary"
        aria-label={t('Population summary')}
      >
        <SummaryCard
          accent
          helper={t('people')}
          label={t('Total population')}
          value={totalPeople}
        />
        <SummaryCard
          helper={t('ages 0–19')}
          label={t('Children & youth')}
          value={children?.value ?? 0}
        />
        <SummaryCard
          helper={t('ages 60+')}
          label={t('Older people')}
          value={elderly?.value ?? 0}
        />
      </section>

      <section className="population-panel">
        <h3 className="population-panel-title">
          {t('Population breakdown')} · {numberFormatter.format(totalPeople)}
        </h3>
        {categories.map(category => {
          const copy = categoryLabels[category.key];

          return (
            <div className="population-breakdown-row" key={category.key}>
              <div>
                <span className="population-category-label">{copy.label}</span>
                <span className="population-category-age">{copy.ageRange}</span>
              </div>
              <div
                className="population-track"
                role="progressbar"
                aria-label={copy.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(category.percentage)}
              >
                <div
                  className="population-bar"
                  style={{ width: `${Math.min(100, category.percentage)}%` }}
                />
              </div>
              <div className="population-stat">
                <span className="population-number">
                  {numberFormatter.format(category.value)}
                </span>
                <span className="population-percentage">
                  {percentageFormatter.format(category.percentage)}%
                </span>
              </div>
            </div>
          );
        })}
      </section>
    </Styles>
  );
}
