import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  acceptFriendRequest as acceptFriendRequestApi,
  FriendEntry,
  fetchFriends,
  fetchIncomingFriendRequests,
  FriendRequestEntry,
  rejectFriendRequest as rejectFriendRequestApi,
  removeFriend as removeFriendApi,
  sendFriendRequest as sendFriendRequestApi,
} from '../../services/api/friends.api';
import { fetchFriendsGoalProgress, FriendGoalGroup } from '../../services/api/goals.api';

interface FriendsState {
  friends: FriendEntry[];
  incomingRequests: FriendRequestEntry[];
  goalProgress: FriendGoalGroup[];
  loading: boolean;
  error: string | null;
}

const initialState: FriendsState = {
  friends: [],
  incomingRequests: [],
  goalProgress: [],
  loading: false,
  error: null,
};

/* =======================
   Thunks
======================= */

export const loadFriendsData = createAsyncThunk<
  { friends: FriendEntry[]; incomingRequests: FriendRequestEntry[]; goalProgress: FriendGoalGroup[] },
  void,
  { rejectValue: string }
>('friends/loadAll', async (_, { rejectWithValue }) => {
  try {
    const [friends, incomingRequests, goalProgress] = await Promise.all([
      fetchFriends(),
      fetchIncomingFriendRequests(),
      fetchFriendsGoalProgress(),
    ]);
    return { friends, incomingRequests, goalProgress };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || err?.message || 'Unable to load friends');
  }
});

export const sendFriendRequest = createAsyncThunk<
  { autoAccepted?: boolean },
  string,
  { rejectValue: string }
>('friends/sendRequest', async (medId, { dispatch, rejectWithValue }) => {
  try {
    const result = await sendFriendRequestApi(medId);
    if (result.autoAccepted) {
      dispatch(loadFriendsData());
    }
    return result;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to send friend request');
  }
});

export const acceptFriendRequest = createAsyncThunk<string, string, { rejectValue: string }>(
  'friends/acceptRequest',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await acceptFriendRequestApi(id);
      dispatch(loadFriendsData());
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to accept request');
    }
  }
);

export const rejectFriendRequest = createAsyncThunk<string, string, { rejectValue: string }>(
  'friends/rejectRequest',
  async (id, { rejectWithValue }) => {
    try {
      await rejectFriendRequestApi(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to reject request');
    }
  }
);

export const removeFriend = createAsyncThunk<string, string, { rejectValue: string }>(
  'friends/remove',
  async (friendId, { rejectWithValue }) => {
    try {
      await removeFriendApi(friendId);
      return friendId;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to remove friend');
    }
  }
);

/* =======================
   Slice
======================= */

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFriendsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadFriendsData.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload.friends;
        state.incomingRequests = action.payload.incomingRequests;
        state.goalProgress = action.payload.goalProgress;
      })
      .addCase(loadFriendsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load friends';
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        state.incomingRequests = state.incomingRequests.filter(r => r.id !== action.payload);
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(f => f.id !== action.payload);
        state.goalProgress = state.goalProgress
          .map(group => ({ ...group, entries: group.entries.filter(e => e.userId !== action.payload) }))
          .filter(group => group.entries.some(e => e.isSelf) && group.entries.length > 0);
      });
  },
});

export default friendsSlice.reducer;
