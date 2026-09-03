import { t } from '@apache-superset/core/translation';
import { ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.svg';
import {
  MalaysiaDisasterChartProps,
  MalaysiaDisasterFormData,
} from '../types';

const metadata = new ChartMetadata({
  name: t('Malaysia Disaster Watch'),
  description: t(
    'Pixel-matched hosted MapLibre/D3 disaster map with earthquake and tsunami interactions.',
  ),
  category: t('Map'),
  credits: ['MapLibre GL JS', 'D3.js', 'MET Malaysia', 'data.gov.my'],
  thumbnail,
  tags: [t('Map'), t('Malaysia'), t('Disaster')],
});

export default class MalaysiaDisasterChartPlugin extends ChartPlugin<
  MalaysiaDisasterFormData,
  MalaysiaDisasterChartProps
> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../MalaysiaDisasterMap'),
      metadata,
      transformProps,
    });
  }
}
