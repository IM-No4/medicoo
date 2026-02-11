import { saveRecentSearch } from '@/src/features/search/utils/recentSearches';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { SearchResult } from './search.types';
import { globalSearch } from './SearchService';

const STORAGE_KEY = 'SEARCH_STATE_V1';

interface SearchState {
  query: string;
  loading: boolean;
  results: SearchResult[];
  error?: string;
  activeRequestId?: string;
}

const initialState: SearchState = {
  query: '',
  loading: false,
  results: [],
};

/**
 * Async search thunk
 * - Debounce handled at UI layer
 * - Abort handled in SearchService
 */
export const executeGlobalSearch = createAsyncThunk<
  SearchResult[],
  { query: string; category?: string; type?: string },
  { rejectValue: string }
>('search/execute', async ({ query, category, type }, { rejectWithValue }) => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const results = await globalSearch(query.trim(), category, type);

    await saveRecentSearch(query.trim());

    // Persist successful search - simplified to just query for now or expand if needed
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        query: query.trim(),
        results,
      })
    );

    return results;
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Search failed');
  }
});

export const hydrateSearch = createAsyncThunk<
  { query: string; results: SearchResult[] } | null
>('search/hydrate', async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
});

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    clearSearch(state) {
      state.query = '';
      state.results = [];
      state.loading = false;
      state.error = undefined;
      state.activeRequestId = undefined;
      AsyncStorage.removeItem(STORAGE_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(executeGlobalSearch.pending, (state, action) => {
        state.loading = true;
        state.error = undefined;
        state.activeRequestId = action.meta.requestId;
      })
      .addCase(executeGlobalSearch.fulfilled, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return;

        state.loading = false;
        state.results = action.payload;
      })
      .addCase(executeGlobalSearch.rejected, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) {
          return;
        }
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(hydrateSearch.fulfilled, (state, action) => {
        if (!action.payload) return;
        state.query = action.payload.query;
        state.results = action.payload.results;
        state.loading = false;
        state.error = undefined;
      });
  },
});

export const { setQuery, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
