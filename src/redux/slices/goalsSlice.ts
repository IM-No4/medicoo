import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import {
  CreateGoalPayload,
  createGoal as createGoalApi,
  deleteGoal as deleteGoalApi,
  fetchGoals,
  GoalDto,
  updateGoal as updateGoalApi,
} from '../../services/api/goals.api';
import { loadGoals as loadGoalsCacheFromDisk, saveGoals as saveGoalsCacheToDisk } from '../../services/storage/goalsStorage';

export interface Goal {
  id: string;
  type: string;
  title: string;
  target: number;
  unit: string;
  current: number;
  color: string;
  enabled: boolean;
  frequency?: string;
  sharedWithFriends: boolean;
}

const mapDtoToGoal = (dto: GoalDto): Goal => ({
  id: dto._id,
  type: dto.type,
  title: dto.title,
  target: dto.target,
  unit: dto.unit,
  current: dto.current,
  color: dto.color,
  enabled: dto.enabled,
  frequency: dto.frequency,
  sharedWithFriends: dto.sharedWithFriends,
});

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
}

const initialState: GoalsState = {
  goals: [],
  loading: false,
  error: null,
};

/* =======================
   Thunks
======================= */

// Instant paint from the last known-good snapshot while loadGoalsFromServer
// resolves - same cache-then-refresh pattern as calendarSlice's
// loadCalendarCache/loadCalendarData.
export const loadGoalsCache = createAsyncThunk('goals/loadCache', async () => {
  return await loadGoalsCacheFromDisk();
});

// Goals now live on the backend (not just this device) so they can be
// shared with friends later - this is the authoritative source of truth.
export const loadGoalsFromServer = createAsyncThunk<Goal[], void, { rejectValue: string }>(
  'goals/loadFromServer',
  async (_, { rejectWithValue }) => {
    try {
      const dtos = await fetchGoals();
      const goals = dtos.map(mapDtoToGoal);
      await saveGoalsCacheToDisk(goals);
      return goals;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Unable to load goals');
    }
  }
);

export const addGoal = createAsyncThunk<Goal, CreateGoalPayload, { rejectValue: string }>(
  'goals/add',
  async (payload, { rejectWithValue }) => {
    try {
      const dto = await createGoalApi(payload);
      return mapDtoToGoal(dto);
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to create goal');
    }
  }
);

export const deleteGoal = createAsyncThunk<string, string, { rejectValue: string }>(
  'goals/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteGoalApi(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to delete goal');
    }
  }
);

export const toggleGoalEnabled = createAsyncThunk<
  { id: string; enabled: boolean },
  string,
  { rejectValue: string; state: { goals: GoalsState } }
>('goals/toggleEnabled', async (id, { getState, rejectWithValue }) => {
  const goal = getState().goals.goals.find(g => g.id === id);
  if (!goal) return rejectWithValue('Goal not found');
  const enabled = !goal.enabled;
  try {
    await updateGoalApi(id, { enabled });
    return { id, enabled };
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Failed to update goal');
  }
});

export const toggleGoalShared = createAsyncThunk<
  { id: string; sharedWithFriends: boolean },
  string,
  { rejectValue: string; state: { goals: GoalsState } }
>('goals/toggleShared', async (id, { getState, rejectWithValue }) => {
  const goal = getState().goals.goals.find(g => g.id === id);
  if (!goal) return rejectWithValue('Goal not found');
  const sharedWithFriends = !goal.sharedWithFriends;
  try {
    await updateGoalApi(id, { sharedWithFriends });
    return { id, sharedWithFriends };
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Failed to update goal');
  }
});

// Tap-to-increment progress - applied optimistically (see .pending below) so
// it feels instant; a failed sync is logged rather than rolled back, since a
// missed +0.25 water increment isn't worth jarring the user over.
export const updateGoalProgress = createAsyncThunk<
  { id: string; current: number },
  { id: string; current: number },
  { rejectValue: string }
>('goals/updateProgress', async (payload, { rejectWithValue }) => {
  try {
    await updateGoalApi(payload.id, { current: payload.current });
    return payload;
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Failed to update goal progress');
  }
});

/* =======================
   Slice
======================= */

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ---------- Cache ---------- */
      .addCase(loadGoalsCache.fulfilled, (state, action) => {
        if (action.payload.length > 0) state.goals = action.payload;
      })

      /* ---------- Load from server ---------- */
      .addCase(loadGoalsFromServer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadGoalsFromServer.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload;
      })
      .addCase(loadGoalsFromServer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load goals';
      })

      /* ---------- Add ---------- */
      .addCase(addGoal.fulfilled, (state, action) => {
        const incoming = action.payload;
        // Non-custom types are singletons - matches the backend's
        // update-in-place behavior for re-configuring the same goal type.
        if (incoming.type !== 'custom') {
          const index = state.goals.findIndex(g => g.type === incoming.type);
          if (index !== -1) {
            state.goals[index] = incoming;
            return;
          }
        }
        state.goals.push(incoming);
      })

      /* ---------- Delete ---------- */
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.goals = state.goals.filter(g => g.id !== action.payload);
      })

      /* ---------- Toggle enabled ---------- */
      .addCase(toggleGoalEnabled.fulfilled, (state, action) => {
        const goal = state.goals.find(g => g.id === action.payload.id);
        if (goal) goal.enabled = action.payload.enabled;
      })

      /* ---------- Toggle shared with friends ---------- */
      .addCase(toggleGoalShared.fulfilled, (state, action) => {
        const goal = state.goals.find(g => g.id === action.payload.id);
        if (goal) goal.sharedWithFriends = action.payload.sharedWithFriends;
      })

      /* ---------- Update progress (optimistic) ---------- */
      .addCase(updateGoalProgress.pending, (state, action) => {
        const goal = state.goals.find(g => g.id === action.meta.arg.id);
        if (goal) goal.current = action.meta.arg.current;
      });
  },
});

export const selectGoals = (state: { goals: GoalsState }) => state.goals.goals;

export const selectActiveGoals = createSelector(
  [selectGoals],
  (goals) => goals.filter(g => g.enabled === true || g.enabled === undefined)
);

export default goalsSlice.reducer;
