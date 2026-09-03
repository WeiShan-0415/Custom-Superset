import {
  MalaysiaDisasterChartProps,
  MalaysiaDisasterFormData,
} from '../types';

export default function transformProps(
  chartProps: MalaysiaDisasterChartProps,
): MalaysiaDisasterChartProps {
  const { width, height, formData } = chartProps;
  const disasterFormData = formData as MalaysiaDisasterFormData;

  return {
    ...chartProps,
    width,
    height,
    formData,
    mapUrl:
      disasterFormData.map_url ??
      '/static/map/malaysia-disaster-superset-plugin-v0.1.0/hosted-map/map-superset.html',
    showFrameBorder: Boolean(disasterFormData.show_frame_border),
    iframeTitle:
      disasterFormData.iframe_title ?? 'Malaysia Disaster Watch',
  };
}
