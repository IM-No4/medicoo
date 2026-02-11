import { apiClient } from './client';

export interface CreateMedicinePayload {
  medicineName: string;
  dosage: string;
  shape?: string;
  color?: string;
  leftColor?: string;
  rightColor?: string;
  scheduleType: string;
  times?: string[];
  selectedDays?: number[];
  intervalValue?: number;
  intervalType?: string;
  cycleDaysOn?: number;
  cycleDaysOff?: number;
  startDate: Date;
  endDate?: Date | null;
  frequency?: string;
  medicineType?: string;
  familyVisible?: boolean;
  notes?: string;
}

export const createMedicineSchedule = async (
  payload: CreateMedicinePayload
) => {
  const response = await apiClient.post(
    '/api/user/medicine/schedule',
    payload
  );

  return response.data;
};

export const getMedicineSchedules = async (isActive?: boolean) => {
  const response = await apiClient.get('/api/user/medicine/schedules', {
    params: isActive !== undefined ? { isActive } : undefined,
  });
  return response.data;
};

export const getMedicineSchedule = async (id: string) => {
  const response = await apiClient.get(`/api/user/medicine/schedule/${id}`);
  return response.data;
};

export const updateMedicineSchedule = async (
  id: string,
  payload: Partial<CreateMedicinePayload>
) => {
  const response = await apiClient.put(
    `/api/user/medicine/schedule/${id}`,
    payload
  );
  return response.data;
};

export const deleteMedicineSchedule = async (id: string) => {
  const response = await apiClient.delete(`/api/user/medicine/schedule/${id}`);
  return response.data;
};

export const markMedicineIntake = async (payload: {
  scheduleId: string;
  date: string;
  time: string;
  status: 'taken' | 'missed' | 'skipped';
}) => {
  const response = await apiClient.post('/api/user/medicine/intake', payload);
  return response.data;
};
