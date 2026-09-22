import { DataRecord, QueryFormData } from '@superset-ui/core';

export interface MalaysiaDisasterMapProps {
  data: DataRecord[];
  formData: QueryFormData;
  height: number;
  width: number;
}
