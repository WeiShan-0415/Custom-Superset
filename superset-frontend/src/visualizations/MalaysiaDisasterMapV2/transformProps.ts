import { ChartProps, DataRecord } from '@superset-ui/core';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, formData, queriesData } = chartProps;

  return {
    width,
    height,
    formData,
    data: (queriesData[0]?.data ?? []) as DataRecord[],
  };
}
