
import { t } from '@apache-superset/core/translation';
import {
  ControlPanelConfig,
} from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Iframe Settings'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'url',
            config: {
              type: 'TextControl',
              label: t('Website URL'),
              default: 'https://example.com',
              renderTrigger: true,
              description: t(
                'Enter the website URL to embed',
              ),
            },
          },
        ],
      ],
    },
     {
      label: t('Query Settings'),
      expanded: false,
      controlSetRows: [
        ['metric'],
      ],
    },
  ],
};
export default config;