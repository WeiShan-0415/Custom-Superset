import { ChartProps, QueryFormData } from '@superset-ui/core';

export interface MalaysiaDisasterFormData extends QueryFormData {
  map_url?: string;
  show_frame_border?: boolean;
  iframe_title?: string;
}

export interface MalaysiaDisasterChartProps
  extends ChartProps<MalaysiaDisasterFormData> {
  mapUrl: string;
  showFrameBorder: boolean;
  iframeTitle: string;
}
