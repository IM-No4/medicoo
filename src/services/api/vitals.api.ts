import { apiClient } from './client';

export interface VitalRecordDto {
  _id: string;
  customerId: string;
  timestamp: string;
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  weight?: number;
  source: 'manual' | 'device';
  createdAt: string;
  updatedAt: string;
}

export interface VitalRecordPayload {
  timestamp?: string;
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  weight?: number;
}

export const fetchVitalRecords = async (limit?: number): Promise<VitalRecordDto[]> => {
  const response = await apiClient.get('/api/user/vitals', { params: limit ? { limit } : undefined });
  return response.data?.data ?? [];
};

export const createVitalRecord = async (payload: VitalRecordPayload): Promise<VitalRecordDto> => {
  const response = await apiClient.post('/api/user/vitals', payload);
  return response.data.data;
};

export const updateVitalRecord = async (
  id: string,
  payload: Partial<VitalRecordPayload>
): Promise<VitalRecordDto> => {
  const response = await apiClient.put(`/api/user/vitals/${id}`, payload);
  return response.data.data;
};

export const deleteVitalRecord = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/user/vitals/${id}`);
};
