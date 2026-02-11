import { apiClient } from './client';

export interface CalendarResponse {
  date: string;
  appointments: any[];
  medicines: any[];
  progress: {
    taken: number;
    total: number;
  };
}

export const fetchCalendarData = async (
  date?: string
): Promise<CalendarResponse> => {

  const response = await apiClient.get('/api/user/calendar', {
    params: date ? { date } : undefined,
  });

  return {
    date: response.data?.date,
    appointments: response.data?.appointments ?? [],
    medicines: response.data?.medicines ?? [],
    progress: response.data?.progress ?? { taken: 0, total: 0 },
  };
};
