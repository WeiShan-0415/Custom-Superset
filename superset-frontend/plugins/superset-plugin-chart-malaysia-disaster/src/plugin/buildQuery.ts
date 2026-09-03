import { buildQueryContext } from '@superset-ui/core';
import { MalaysiaDisasterFormData } from '../types';

export default function buildQuery(formData: MalaysiaDisasterFormData) {
  return buildQueryContext(formData, baseQueryObject => [
    {
      ...baseQueryObject,
      columns: [],
      metrics: [
        {
          expressionType: 'SQL' as const,
          sqlExpression: 'COUNT(*)',
          label: '__iframe_row_count',
          hasCustomLabel: true,
        },
      ],
      row_limit: 1,
    },
  ]);
}