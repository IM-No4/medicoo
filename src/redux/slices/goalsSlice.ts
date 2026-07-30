import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

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
}

interface GoalsState {
  goals: Goal[];
}

const initialState: GoalsState = {
  goals: [], // Starts completely empty as requested!
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    addGoal: (state, action: PayloadAction<Goal>) => {
      // Avoid duplicate goals of the same type if not custom
      if (action.payload.type !== 'custom') {
        const index = state.goals.findIndex(g => g.type === action.payload.type);
        if (index !== -1) {
          state.goals[index] = action.payload;
          return;
        }
      }
      state.goals.push(action.payload);
    },
    deleteGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter(g => g.id !== action.payload);
    },
    toggleGoalEnabled: (state, action: PayloadAction<string>) => {
      const goal = state.goals.find(g => g.id === action.payload);
      if (goal) {
        goal.enabled = !goal.enabled;
      }
    },
    updateGoalProgress: (state, action: PayloadAction<{ id: string; current: number }>) => {
      const goal = state.goals.find(g => g.id === action.payload.id);
      if (goal) {
        goal.current = action.payload.current;
      }
    },
  },
});

export const { addGoal, deleteGoal, toggleGoalEnabled, updateGoalProgress } = goalsSlice.actions;

export const selectGoals = (state: { goals: GoalsState }) => state.goals.goals;

export const selectActiveGoals = createSelector(
  [selectGoals],
  (goals) => goals.filter(g => g.enabled === true || g.enabled === undefined)
);

export default goalsSlice.reducer;
