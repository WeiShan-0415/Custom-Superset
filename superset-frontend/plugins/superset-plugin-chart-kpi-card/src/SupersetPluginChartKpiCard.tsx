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
import { css, styled, SupersetTheme } from '@apache-superset/core/theme';
import {
  KpiBackground,
  KpiIconStyle,
  KpiValueColor,
  SupersetPluginChartKpiCardProps,
} from './types';

/** Reference size of the alert-summary layout (with a breakdown list). */
const BASE_WIDE_WIDTH = 560;
/** Reference width of single-section layouts (no breakdown list). */
const BASE_COMPACT_WIDTH = 360;
const BASE_CARD_HEIGHT = 280;
/** Height the text block needs at scale 1, including card padding. */
const BASE_CONTENT_HEIGHT = 150;
const MIN_CARD_SCALE = 0.6;
const MIN_FONT_SCALE = 0.35;
const FONT_SCALE_BOOST = 1.1;

type ResponsiveCardProps = {
  $accent?: string;
  $accentTint?: string;
  $background: KpiBackground;
  $fontScale: number;
  $scale: number;
  $showBorder: boolean;
  height: number;
  width: number;
};

const clamp = (min: number, value: number) => Math.max(min, Math.min(1, value));

/** Keeps every visual element proportional when the chart is resized. */
const getCardScale = (width: number, height: number, baseWidth: number) =>
  clamp(MIN_CARD_SCALE, Math.min(width / baseWidth, height / BASE_CARD_HEIGHT));

/**
 * Scales typography from the chart width, capped by the height so short,
 * wide cards do not overflow vertically.
 */
const getFontScale = (width: number, height: number, baseWidth: number) =>
  clamp(
    MIN_FONT_SCALE,
    Math.min(width / baseWidth, height / BASE_CONTENT_HEIGHT),
  );

const Card = styled.div<ResponsiveCardProps>`
  --kpi-accent: ${({ $accent, theme }) => $accent ?? theme.colorPrimary};
  --kpi-accent-tint: ${({ $accentTint, theme }) =>
    $accentTint ?? theme.colorPrimaryBg};
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
  background: ${({ $background, theme }) =>
    $background === 'transparent' ? 'transparent' : theme.colorBgContainer};
  border: 1px solid
    ${({ $showBorder, theme }) =>
      $showBorder ? theme.colorBorderSecondary : 'transparent'};
  border-radius: var(--kpi-radius);
  box-sizing: border-box;
  display: flex;
  gap: var(--kpi-space-2);
  height: ${({ height }) => height}px;
  overflow: hidden;
  padding: var(--kpi-space-5);
  width: ${({ width }) => width}px;
`;

const Icon = styled.div<{ $iconStyle: KpiIconStyle }>`
  align-items: center;
  background: ${({ $iconStyle, theme }) =>
    $iconStyle === 'square'
      ? 'var(--kpi-accent-tint)'
      : theme.colorFillSecondary};
  border-radius: ${({ $iconStyle }) =>
    $iconStyle === 'square' ? 'var(--kpi-radius)' : '50%'};
  color: ${({ $iconStyle }) =>
    $iconStyle === 'square' ? 'var(--kpi-accent)' : 'inherit'};
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
  align-items: center;
  color: ${({ theme }) => theme.colorTextSecondary};
  display: flex;
  font-size: var(--kpi-font-heading4);
  gap: var(--kpi-space-2);
  overflow-wrap: anywhere;
  white-space: normal;
`;

const TitleDot = styled.span`
  background: var(--kpi-accent);
  border-radius: 50%;
  flex: 0 0 auto;
  height: var(--kpi-dot-size);
  width: var(--kpi-dot-size);
`;

const Value = styled.div<{ $valueColor: KpiValueColor }>`
  color: ${({ $valueColor, theme }) =>
    $valueColor === 'accent' ? 'var(--kpi-accent)' : theme.colorText};
  font-size: var(--kpi-font-value);
  font-weight: ${({ theme }) => theme.fontWeightStrong};
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const severityColors = ({ theme }: { theme: SupersetTheme }) => css`
  &.severity--severe {
    color: ${theme.colorError};
  }

  &.severity--warning {
    color: ${theme.colorWarningTextActive};
  }

  &.severity--watch {
    color: ${theme.colorWarning};
  }
`;

const SupportingText = styled.div`
  color: ${({ theme }) => theme.colorTextSecondary};
  font-size: var(--kpi-font-heading4);
  font-weight: ${({ theme }) => theme.fontWeightStrong};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${severityColors}
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

  ${severityColors}
`;

const SEVERITY_CLASSES: Record<number, string> = {
  1: 'severity--watch',
  2: 'severity--warning',
  3: 'severity--severe',
};

const isImageUrl = (icon: string) => /^(https?:|data:image\/)/i.test(icon);

const displayValue = (value: unknown) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

export default function SupersetPluginChartKpiCard({
  accentColor,
  accentTint,
  background,
  height,
  icon,
  iconStyle,
  showBorder,
  statusItems,
  subtitle,
  subtitleStatus,
  title,
  value,
  valueColor,
  width,
}: SupersetPluginChartKpiCardProps) {
  const hasBreakdown = statusItems.length > 0;
  const baseWidth = hasBreakdown ? BASE_WIDE_WIDTH : BASE_COMPACT_WIDTH;
  const fontScale = getFontScale(width, height, baseWidth);
  const scale = getCardScale(width, height, baseWidth);
  const showIconBox =
    (iconStyle === 'circle' || iconStyle === 'square') && icon;

  return (
    <Card
      $accent={accentColor}
      $accentTint={accentTint}
      $background={background}
      $fontScale={fontScale}
      $scale={scale}
      $showBorder={showBorder}
      height={height}
      width={width}
    >
      <PrimarySection>
        {showIconBox && (
          <Icon $iconStyle={iconStyle}>
            {isImageUrl(icon) ? <img alt="" src={icon} /> : <span>{icon}</span>}
          </Icon>
        )}
        <Content>
          <Title title={title}>
            {iconStyle === 'dot' && <TitleDot />}
            <span>{title}</span>
          </Title>
          <Value $valueColor={valueColor} title={displayValue(value)}>
            {displayValue(value)}
          </Value>
          {subtitle && (
            <SupportingText
              className={
                subtitleStatus ? SEVERITY_CLASSES[subtitleStatus] : undefined
              }
              title={subtitle}
            >
              {subtitle}
            </SupportingText>
          )}
        </Content>
      </PrimarySection>
      {hasBreakdown && (
        <>
          <Divider />
          <StatusList>
            {statusItems.map(item => {
              const rowText = `${displayValue(item.value)} ${item.label}`;

              return (
                <StatusItem key={item.status} title={rowText}>
                  <StatusDot className={SEVERITY_CLASSES[item.status]} />
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
