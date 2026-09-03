import { useMemo, useState } from 'react';
import { styled } from '@apache-superset/core/theme';
import { MalaysiaDisasterChartProps } from './types';

const FrameRoot = styled.div<{ height: number; width: number; bordered: boolean }>`
  position: relative;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  min-height: 320px;
  overflow: hidden;
  background: #091415;
  border: ${({ bordered }) => (bordered ? '1px solid #29433f' : '0')};

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #091415;
  }
`;

const Loading = styled.div`
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-items: center;
  color: #78e5d0;
  background: #091415;
  font: 11px monospace;
  letter-spacing: 0.12em;
`;

const ConfigurationError = styled.div`
  display: grid;
  height: 100%;
  place-items: center;
  padding: 24px;
  color: #f4f6f2;
  background: #091415;
  text-align: center;
  font: 13px/1.6 sans-serif;
`;

export default function MalaysiaDisasterMap({
  width,
  height,
  mapUrl,
  showFrameBorder,
  iframeTitle,
}: MalaysiaDisasterChartProps) {
  const [loaded, setLoaded] = useState(false);
  const normalizedUrl = useMemo(() => mapUrl?.trim(), [mapUrl]);

  if (!normalizedUrl) {
    return (
      <ConfigurationError>
        Set the hosted map URL in Explore → Customize → Map URL.
      </ConfigurationError>
    );
  }

  return (
    <FrameRoot width={width} height={height} bordered={showFrameBorder}>
      {!loaded && <Loading>LOADING MALAYSIA DISASTER MAP…</Loading>}
      <iframe
        src={normalizedUrl}
        title={iframeTitle}
        allow="fullscreen; geolocation"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoaded(true)}
      />
    </FrameRoot>
  );
}
