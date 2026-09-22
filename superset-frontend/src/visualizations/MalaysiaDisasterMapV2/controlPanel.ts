import { ControlPanelConfig } from '@superset-ui/chart-controls';
import { t } from '@apache-superset/core/translation';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [['adhoc_filters'], ['row_limit']],
    },
    {
      label: t('Map'),
      expanded: true,
      controlSetRows: [],
    },
  ],
};

export default config;
