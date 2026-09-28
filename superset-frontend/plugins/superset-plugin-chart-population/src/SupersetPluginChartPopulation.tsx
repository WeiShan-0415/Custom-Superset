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
import type { ReactNode } from 'react';
import { t } from '@apache-superset/core/translation';
import { styled } from '@apache-superset/core/theme';
import { Icons } from '@superset-ui/core/components';
import {
  PopulationCategory,
  SupersetPluginChartPopulationProps,
  SupersetPluginChartPopulationStylesProps,
} from './types';

const Styles = styled.div<SupersetPluginChartPopulationStylesProps>`
  box-sizing: border-box;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  min-height: 0;
  overflow: auto;
  padding: ${({ height, theme }) => theme.sizeUnit * (height < 420 ? 2 : 4)}px;
  color: ${({ theme }) => theme.colorText};
  background: ${({ theme }) => theme.colorBgContainer};
  border: 1px solid ${({ theme }) => theme.colorBorder};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;

  * {
    box-sizing: border-box;
  }

  .population-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ height, theme }) => theme.sizeUnit * (height < 420 ? 2 : 4)}px;
    margin-bottom: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 2 : 4)}px;
    flex-direction: ${({ width }) => (width < 440 ? 'column' : 'row')};
    align-items: ${({ width }) => (width < 440 ? 'flex-start' : 'center')};
  }

  .population-heading,
  .population-location {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
  }

  .population-heading-icon {
    display: grid;
    place-items: center;
    width: ${({ theme }) => theme.sizeUnit * 10}px;
    height: ${({ theme }) => theme.sizeUnit * 10}px;
    color: ${({ theme }) => theme.colorPrimary};
    background: ${({ theme }) => theme.colorPrimaryBg};
    border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  h2 {
    font-size: ${({ theme }) => theme.fontSizeXL}px;
  }

  h3 {
    font-size: ${({ theme }) => theme.fontSizeLG}px;
  }

  .population-location {
    color: ${({ theme }) => theme.colorTextSecondary};
    font-size: ${({ theme }) => theme.fontSizeLG}px;
  }

  .population-location svg {
    color: ${({ theme }) => theme.colorPrimary};
  }

  .population-summary {
    display: grid;
    grid-template-columns: repeat(
      ${({ width }) => (width >= 1000 ? 4 : width >= 500 ? 2 : 1)},
      minmax(0, 1fr)
    );
    gap: ${({ height, theme }) => theme.sizeUnit * (height < 420 ? 2 : 3)}px;
    margin-bottom: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 2 : 4)}px;
  }

  .population-card,
  .population-panel {
    background: ${({ theme }) => theme.colorFillAlter};
    border: 1px solid ${({ theme }) => theme.colorBorder};
    border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  }

  .population-card {
    display: flex;
    align-items: center;
    min-height: ${({ height }) => (height < 420 ? 72 : 108)}px;
    padding: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 2 : 4)}px;
    gap: ${({ height, theme }) => theme.sizeUnit * (height < 420 ? 2 : 3)}px;
  }

  .population-card-icon {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colorPrimary};
  }

  .population-card-value {
    font-size: ${({ width }) => Math.max(18, Math.min(28, width / 36))}px;
    font-weight: ${({ theme }) => theme.fontWeightStrong};
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  .population-card-label,
  .population-muted {
    margin-top: ${({ theme }) => theme.sizeUnit}px;
    color: ${({ theme }) => theme.colorTextSecondary};
  }

  .population-details {
    display: grid;
    grid-template-columns: ${({ width }) =>
      width >= 760 ? 'minmax(0, 3fr) minmax(280px, 2fr)' : 'minmax(0, 1fr)'};
    gap: ${({ height, theme }) => theme.sizeUnit * (height < 420 ? 2 : 4)}px;
  }

  .population-panel {
    min-height: ${({ height }) => (height < 420 ? 0 : 230)}px;
    padding: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 2 : 4)}px;
  }

  .population-breakdown-row {
    display: grid;
    grid-template-columns: ${({ width }) =>
      width >= 520
        ? 'minmax(135px, 0.9fr) minmax(100px, 2fr) minmax(80px, auto) 48px'
        : 'minmax(110px, 1fr) 78px 42px'};
    align-items: center;
    gap: ${({ height, theme }) => theme.sizeUnit * (height < 420 ? 2 : 3)}px;
    margin-top: ${({ height, theme }) =>
      theme.sizeUnit * (height < 420 ? 2 : 4)}px;
  }

  .population-category {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
    color: ${({ theme }) => theme.colorTextSecondary};
  }

  .population-category svg {
    color: ${({ theme }) => theme.colorPrimary};
  }

  .population-track {
    display: ${({ width }) => (width < 520 ? 'none' : 'block')};
    height: ${({ theme }) => theme.sizeUnit * 3}px;
    overflow: hidden;
    background: ${({ theme }) => theme.colorFillSecondary};
    border-radius: ${({ theme }) => theme.borderRadiusSM}px;
  }

  .population-bar {
    height: 100%;
    background: ${({ theme }) => theme.colorPrimary};
    border-radius: inherit;
  }

  .population-number,
  .population-percentage {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .population-districts {
    margin-top: ${({ theme }) => theme.sizeUnit * 2}px;
  }

  .population-district-row {
    display: grid;
    grid-template-columns: 28px minmax(90px, 1fr) auto 48px;
    align-items: center;
    gap: ${({ theme }) => theme.sizeUnit * 2}px;
    min-height: 35px;
    border-bottom: 1px solid ${({ theme }) => theme.colorSplit};
  }

  .population-rank {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colorPrimary};
    background: ${({ theme }) => theme.colorPrimaryBg};
    border-radius: ${({ theme }) => theme.borderRadiusSM}px;
  }

  .population-empty {
    display: grid;
    place-items: center;
    min-height: 160px;
    color: ${({ theme }) => theme.colorTextTertiary};
    text-align: center;
  }
`;

const numberFormatter = new Intl.NumberFormat('en-MY', {
  maximumFractionDigits: 0,
});

function PopulationSvgIcon({
  paths,
  viewBox,
}: {
  paths: string[];
  viewBox: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={viewBox}
      width="32"
      height="32"
      fill="currentColor"
    >
      {paths.map(path => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}

function PersonCategoryIcon({ armsRaised = false }: { armsRaised?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={armsRaised ? '0 0 32 32' : '0 0 32 36'}
      width="32"
      height="32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3.5"
    >
      <circle cx="16" cy="6" r="3.25" fill="currentColor" stroke="none" />
      {armsRaised ? (
        <>
          <path d="M12.5 12h7L20.5 22h-9z" fill="currentColor" stroke="none" />
          <path d="m12.5 14-3-2.5L8 9.5M19.5 14l3-2.5L24 9.5" />
          <path d="M13.5 21v8M18.5 21v8" />
        </>
      ) : (
        <>
          <path d="M12.5 12h7L20.5 25h-9z" fill="currentColor" stroke="none" />
          <path d="m12.5 14-3 4.5L8 22M19.5 14l3 4.5L24 22" />
          <path d="M13.5 24v10M18.5 24v10" />
        </>
      )}
    </svg>
  );
}

const elderlyIconPaths = [
  'M 113.126 108.867 c 18.021 0 35.189 -9.18 45.23 -24.14 c 10.184 -15.173 12.021 -35.011 4.798 -51.8 c -7.037 -16.356 -22.074 -28.531 -39.559 -31.938 C 105.712 -2.495 86.893 3.36 74.167 16.394 C 61.433 29.437 56.031 48.425 59.965 66.227 c 3.842 17.382 16.376 32.113 32.891 38.742 C 99.287 107.55 106.198 108.867 113.126 108.867 Z',
  'M 175.833 243.58 C 177.044 240.222 175.75 242.782 175.833 243.58 L 175.833 243.58 Z',
  'M 214.27 226.528 c 0.876 -8.131 1.072 -16.292 1.195 -24.462 c -0.23 -7.293 -0.341 -14.681 -1.499 -21.902 c -1.409 -11.248 -4.061 -22.504 -8.318 -33.025 l -1.697 -4.179 c -1.973 -4.141 -4.053 -8.16 -6.293 -12.162 c -4.734 -7.704 -10.222 -14.786 -16.692 -21.113 c -2.128 -1.959 -4.196 -3.91 -6.379 -5.615 c -2.118 -1.789 -4.338 -3.322 -6.457 -4.855 c -2.749 -1.791 -5.497 -3.563 -8.379 -5.136 c -14.321 15.671 -36.05 23.164 -56.988 19.583 c -13.771 -2.355 -26.525 -9.417 -35.908 -19.758 c -0.767 0.414 -1.538 0.84 -2.31 1.303 c -2.123 1.178 -4.227 2.589 -6.413 4.011 c -2.121 1.533 -4.34 3.064 -6.461 4.852 c -2.185 1.704 -4.253 3.654 -6.383 5.612 c -6.478 6.325 -11.972 13.408 -16.706 21.115 c -2.243 4.001 -4.32 8.023 -6.295 12.164 l -1.697 4.18 c -4.257 10.524 -6.902 21.779 -8.314 33.028 c -1.158 7.221 -1.257 14.609 -1.494 21.901 c 0.103 6.432 0.322 12.821 0.732 19.241 c 0.295 4.625 0.904 9.232 1.41 13.839 c 0.953 8.431 8.572 14.881 17.049 14.374 c 8.474 -0.509 15.255 -7.792 15.18 -16.275 l -0.006 -0.775 c -0.033 -3.849 -0.187 -7.715 -0.045 -11.561 c 0.208 -5.672 0.552 -11.299 1.023 -16.955 c 0.77 -5.78 1.385 -11.707 2.944 -17.342 c 1.809 -7.949 4.452 -15.901 8.307 -23.104 l 1.39 -2.645 l 1.542 -2.491 c 0.961 -1.706 2.153 -3.181 3.214 -4.734 c 0.089 -0.114 0.179 -0.223 0.268 -0.337 l -12.574 87.878 c -2.104 15.251 1.359 30.963 9.93 43.777 l 8.331 175.673 c 0.468 9.25 7.901 17.056 17.14 17.887 c 9.102 0.818 17.721 -5.259 19.971 -14.124 c 0.316 -1.247 0.504 -2.526 0.562 -3.812 l 5.987 -133.52 l 6.221 133.553 c 0.461 9.25 7.887 17.062 17.125 17.9 c 9.101 0.826 17.727 -5.242 19.982 -14.106 c 0.317 -1.247 0.506 -2.526 0.564 -3.812 l 7.984 -174.789 c 5.609 -8.104 9.322 -17.53 10.637 -27.58 c 2.55 3.626 7.654 4.641 11.387 2.244 c 1.678 -1.078 2.941 -2.75 3.512 -4.663 c 0.309 -1.038 0.307 -2.056 0.369 -3.124 c 0.082 -1.4 0.405 -2.784 0.954 -4.075 c 6.55 2.313 13.97 0.109 18.202 -5.398 c 3.272 2.213 5.428 5.958 5.428 10.198 v 211.06 c 0 4.572 3.816 8.389 8.388 8.389 c 4.572 0 8.388 -3.816 8.388 -8.389 V 253.41 C 232.275 241.295 224.827 230.892 214.27 226.528 Z M 181.144 234.491 c -2.283 2.658 -4.099 5.729 -5.311 9.089 c -0.082 -0.798 -0.169 -1.597 -0.283 -2.397 l -12.449 -86.999 c 0.957 1.358 1.981 2.684 2.829 4.188 l 1.542 2.492 l 1.392 2.646 c 3.854 7.204 6.503 15.155 8.312 23.105 c 1.56 5.637 2.17 11.561 2.949 17.341 c 0.469 5.656 0.814 11.282 1.023 16.953 c 0.143 3.846 -0.011 7.712 -0.043 11.561 l -0.009 0.851 C 181.093 233.716 181.117 234.103 181.144 234.491 Z',
];

const totalPeopleIconPaths = [
  'M 11.98 5.373 c 0 -1.584 1.284 -2.869 2.869 -2.869 s 2.869 1.284 2.869 2.869 s -1.284 2.869 -2.869 2.869 S 11.98 6.957 11.98 5.373 Z M 15.716 15.621 c 0.616 -0.658 1.479 -1.075 2.575 -1.245 c 0.249 -0.038 0.513 -0.061 0.786 -0.077 c 0.088 -0.003 0.171 -0.012 0.259 -0.012 h 1.707 c -1.253 -0.521 -2.141 -1.761 -2.141 -3.203 c 0 -0.575 0.143 -1.12 0.394 -1.596 c -0.89 -0.325 -1.711 -0.32 -1.711 -0.32 h -5.753 c -0.643 0.015 -1.183 0.096 -1.636 0.23 c 0.281 0.5 0.442 1.076 0.442 1.686 c 0 1.442 -0.887 2.681 -2.142 3.203 h 1.412 c 0.017 -0.002 0.033 -0.002 0.051 -0.002 c 0.1 0 0.209 0.004 0.319 0.012 c 0.235 0.017 0.492 0.053 0.758 0.107 c 1.444 0.303 3.186 1.253 3.379 3.527 l 0.002 0.051 v 1.774 h 0.362 l 0.002 -1.774 C 14.779 17.957 14.729 16.675 15.716 15.621 Z M 6.993 13.983 c 1.582 0 2.869 -1.287 2.869 -2.871 S 8.575 8.243 6.993 8.243 c -1.584 0 -2.869 1.285 -2.869 2.869 C 4.124 12.695 5.41 13.983 6.993 13.983 Z M 9.728 14.908 H 3.976 c -4.118 0.076 -3.975 3.103 -3.975 3.103 L 0 25.067 h 0.004 c 0 0.017 -0.003 0.035 -0.003 0.05 c 0 0.67 0.545 1.211 1.213 1.211 c 0.669 0 1.209 -0.541 1.209 -1.211 c 0 -0.016 -0.002 -0.033 -0.005 -0.05 h 0.005 v -6.532 h 0.758 l -0.006 6.958 l 7.266 0.006 l -0.006 -6.996 h 0.786 v 6.563 h 0.004 c 0 0.003 0 0.006 0 0.01 c 0 0.669 0.541 1.211 1.207 1.211 c 0.669 0 1.211 -0.542 1.211 -1.211 c 0 -0.004 0 -0.007 0 -0.01 V 18.01 C 13.378 14.861 9.728 14.908 9.728 14.908 Z M 22.185 13.982 c 1.585 0 2.87 -1.285 2.87 -2.87 s -1.285 -2.87 -2.87 -2.87 s -2.87 1.285 -2.87 2.87 C 19.316 12.697 20.6 13.982 22.185 13.982 Z M 24.921 14.908 h -5.754 c -4.119 0.076 -3.973 3.103 -3.973 3.103 l -0.002 7.056 h 0.005 c 0 0.017 -0.003 0.035 -0.003 0.05 c 0 0.67 0.544 1.211 1.212 1.211 c 0.669 0 1.208 -0.541 1.208 -1.211 c 0 -0.016 -0.003 -0.033 -0.004 -0.05 h 0.004 v -6.532 h 0.76 l -0.009 6.958 l 7.266 0.006 l -0.006 -6.996 h 0.786 v 6.563 h 0.002 c 0 0.003 0 0.006 0 0.01 c 0 0.669 0.542 1.211 1.21 1.211 c 0.667 0 1.209 -0.542 1.209 -1.211 c 0 -0.004 0 -0.007 0 -0.01 V 18.01 C 28.57 14.861 24.921 14.908 24.921 14.908 Z',
];

function categoryIcon(category: PopulationCategory['key']) {
  if (category === 'children') {
    return <PersonCategoryIcon armsRaised />;
  }
  if (category === 'elderly') {
    return <PopulationSvgIcon paths={elderlyIconPaths} viewBox="0 0 233 501" />;
  }
  return <PersonCategoryIcon />;
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="population-card">
      <div className="population-card-icon">{icon}</div>
      <div>
        <div className="population-card-value">
          {numberFormatter.format(value)}
        </div>
        <div className="population-card-label">{label}</div>
      </div>
    </div>
  );
}

export default function SupersetPluginChartPopulation({
  categories,
  districts,
  hasStateFilter,
  height,
  location,
  totalPeople,
  width,
}: SupersetPluginChartPopulationProps) {
  return (
    <Styles height={height} width={width}>
      <header className="population-header">
        <div className="population-heading">
          <div className="population-heading-icon">
            <Icons.UsergroupAddOutlined iconSize="xl" />
          </div>
          <h2>{t('Population Impact')}</h2>
        </div>
        <div className="population-location">
          <Icons.PushpinFilled iconSize="m" />
          <span>
            {location === 'Malaysia' ? location : `${location}, Malaysia`}
          </span>
        </div>
      </header>

      <section
        className="population-summary"
        aria-label={t('Population summary')}
      >
        <SummaryCard
          icon={
            <PopulationSvgIcon
              paths={totalPeopleIconPaths}
              viewBox="0 0 29 27"
            />
          }
          value={totalPeople}
          label={t('people affected')}
        />
        {categories.map(category => (
          <SummaryCard
            key={category.key}
            icon={categoryIcon(category.key)}
            value={category.value}
            label={`${category.label.toLowerCase()} (${category.ageRange})`}
          />
        ))}
      </section>

      <section className="population-details">
        <div className="population-panel">
          <h3>
            {t('Population breakdown')} ({numberFormatter.format(totalPeople)})
          </h3>
          {categories.map(category => (
            <div className="population-breakdown-row" key={category.key}>
              <div className="population-category">
                {categoryIcon(category.key)}
                <span>
                  {category.label} ({category.ageRange})
                </span>
              </div>
              <div className="population-track">
                <div
                  className="population-bar"
                  style={{
                    width: `${Math.min(100, category.percentage)}%`,
                  }}
                />
              </div>
              <div className="population-number">
                {numberFormatter.format(category.value)}
              </div>
              <div className="population-percentage">
                {Math.round(category.percentage)}%
              </div>
            </div>
          ))}
        </div>

        <div className="population-panel">
          <h3>
            {hasStateFilter
              ? `${t('Top 5 affected districts')} (${location})`
              : t('Top 5 affected districts')}
          </h3>
          {districts.length > 0 ? (
            <div className="population-districts">
              {districts.map((district, index) => (
                <div className="population-district-row" key={district.name}>
                  <span className="population-rank">{index + 1}</span>
                  <span>{district.name}</span>
                  <span className="population-number">
                    {numberFormatter.format(district.value)}
                  </span>
                  <span className="population-percentage">
                    {Math.round(district.percentage)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="population-empty">
              {hasStateFilter
                ? t('No district population data')
                : t('Select a state to view affected districts')}
            </div>
          )}
        </div>
      </section>
    </Styles>
  );
}
