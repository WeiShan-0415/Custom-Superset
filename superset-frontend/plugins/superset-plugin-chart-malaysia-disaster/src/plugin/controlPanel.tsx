import { t } from '@apache-superset/core/translation';
import { validateNonEmpty } from '@superset-ui/core';
import { ControlPanelConfig } from '@superset-ui/chart-controls';

const controlPanel: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Hosted map'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'map_url',
            config: {
              type: 'TextControl',
              label: t('Map URL'),
              description: t(
                'Absolute URL of map-superset.html. Use HTTPS when Superset uses HTTPS.',
              ),
              default: '/static/map/malaysia-disaster-superset-plugin-v0.1.0/hosted-map/map-superset.html',
              validators: [validateNonEmpty],
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'iframe_title',
            config: {
              type: 'TextControl',
              label: t('Accessible frame title'),
              default: 'Malaysia Disaster Watch',
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Appearance'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'show_frame_border',
            config: {
              type: 'CheckboxControl',
              label: t('Show frame border'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default controlPanel;
