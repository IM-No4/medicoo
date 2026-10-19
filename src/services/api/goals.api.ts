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
  /** the friends it is shared with when it is not shared with everyone */
  sharedWith?: string[];
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
  /** whether this number was recorded today - a friend whose app has not synced yet is not the same as one who did nothing */
  syncedToday?: boolean;
  rank?: number;
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

export type ShareMode = 'all' | 'selected' | 'none';

/** Share a goal with every friend, only some of them, or nobody. */
export const setGoalSharing = async (id: string, mode: ShareMode, friendIds: string[] = []): Promise<GoalDto> => {
  const response = await apiClient.put(`/api/user/goals/${id}`, { shareMode: mode, friendIds });
  return response.data.data;
};

// ---- head to head with one friend ----

export interface CompareDay {
  date: string;
  me: number;
  friend: number;
  meTarget: number;
  friendTarget: number;
  winner: 'me' | 'friend' | 'tie';
}

export interface CompareSummary {
  today: { me: number; friend: number; gap: number; leader: 'me' | 'friend' | 'tie' };
  totals: { me: number; friend: number; gap: number };
  averages: { me: number; friend: number };
  bestDay: { me: number; friend: number };
  daysLed: { me: number; friend: number; tie: number };
  goalDays: { me: number; friend: number };
  streak: { me: number; friend: number };
}

export interface GoalComparison {
  key: string;
  type: string;
  title: string;
  unit: string;
  rangeDays: number;
  me: { userId: string; profile: FriendProfile | null; target: number };
  friend: { userId: string; profile: FriendProfile | null; target: number };
  days: CompareDay[];
  summary: CompareSummary;
}

export const fetchGoalComparison = async (friendId: string, key: string, days: number): Promise<GoalComparison> => {
  const response = await apiClient.get(`/api/user/goals/compare/${friendId}`, { params: { key, days } });
  return response.data.data;
};

// ---- badges ----

export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface EarnedBadge extends BadgeInfo {
  key: string;
  earnedAt: string;
  meta?: Record<string, any>;
}

export const fetchBadges = async (): Promise<{ earned: EarnedBadge[]; available: BadgeInfo[] }> => {
  const response = await apiClient.get('/api/user/goals/badges');
  return response.data?.data ?? { earned: [], available: [] };
};
