import { apiClient } from './client';

export interface GoalDto {
  _id: string;
  patientId: string;
  type: string;
  title: string;
  target: number;
  unit: string;
  current: number;
  color: string;
  frequency?: string;
  enabled: boolean;
  sharedWithFriends: boolean;
}

export interface CreateGoalPayload {
  type: string;
  title: string;
  target: number;
  unit?: string;
  current?: number;
  color?: string;
  frequency?: string;
  enabled?: boolean;
  sharedWithFriends?: boolean;
}

export interface FriendProfile {
  name: string;
  profileImage: string;
  medId: string;
}

export interface FriendGoalEntry {
  userId: string;
  isSelf: boolean;
  profile: FriendProfile | null;
  current: number;
  target: number;
  progressPercent: number;
}

export interface FriendGoalGroup {
  key: string;
  type: string;
  title: string;
  unit: string;
  entries: FriendGoalEntry[];
}

export const fetchGoals = async (): Promise<GoalDto[]> => {
  const response = await apiClient.get('/api/user/goals');
  return response.data?.data ?? [];
};

export const createGoal = async (payload: CreateGoalPayload): Promise<GoalDto> => {
  const response = await apiClient.post('/api/user/goals', payload);
  return response.data.data;
};

export const updateGoal = async (
  id: string,
  payload: Partial<CreateGoalPayload>
): Promise<GoalDto> => {
  const response = await apiClient.put(`/api/user/goals/${id}`, payload);
  return response.data.data;
};

export const deleteGoal = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/user/goals/${id}`);
};

export const fetchFriendsGoalProgress = async (): Promise<FriendGoalGroup[]> => {
  const response = await apiClient.get('/api/user/goals/friends-progress');
  return response.data?.data ?? [];
};
