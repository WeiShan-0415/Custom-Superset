import { t } from '@apache-superset/core/translation';
import { ChartMetadata, ChartPlugin } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from './images/thumbnail.png';

export default class MalaysiaDisasterMapChartPlugin extends ChartPlugin {
  constructor() {
    const metadata = new ChartMetadata({
      category: t('Map'),
      description: t(
        'Interactive Malaysia weather warning, earthquake, tsunami, and local-area map.',
      ),
      name: t('Malaysia Disaster Map V2'),
      thumbnail,
      tags: [t('Map'), t('Malaysia'), t('Disaster')],
    });

    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('./MalaysiaDisasterMap'),
      metadata,
      transformProps,
    });
  }
}
