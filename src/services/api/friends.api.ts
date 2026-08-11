import { apiClient } from './client';

export interface FriendProfile {
  name: string;
  profileImage: string;
  medId: string;
}

export interface FriendEntry {
  id: string;
  profile: FriendProfile | null;
}

export interface FriendRequestEntry {
  id: string;
  requesterId: string;
  createdAt: string;
  profile: FriendProfile | null;
}

export const sendFriendRequest = async (medId: string): Promise<{ autoAccepted?: boolean }> => {
  const response = await apiClient.post('/api/user/friends/request', { med_id: medId });
  return response.data?.data ?? {};
};

export const fetchIncomingFriendRequests = async (): Promise<FriendRequestEntry[]> => {
  const response = await apiClient.get('/api/user/friends/requests');
  return response.data?.data ?? [];
};

export const acceptFriendRequest = async (id: string): Promise<void> => {
  await apiClient.post(`/api/user/friends/requests/${id}/accept`);
};

export const rejectFriendRequest = async (id: string): Promise<void> => {
  await apiClient.post(`/api/user/friends/requests/${id}/reject`);
};

export const fetchFriends = async (): Promise<FriendEntry[]> => {
  const response = await apiClient.get('/api/user/friends');
  return response.data?.data ?? [];
};

export const removeFriend = async (friendId: string): Promise<void> => {
  await apiClient.delete(`/api/user/friends/${friendId}`);
};
