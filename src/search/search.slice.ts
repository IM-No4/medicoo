import { saveRecentSearch } from '@/src/features/search/utils/recentSearches';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from '@/src/redux/store';
import { SearchResult } from './search.types';
import { globalSearch } from './SearchService';

const STORAGE_KEY = 'SEARCH_STATE_V1';

interface SearchState {
  query: string;
  loading: boolean;
  results: SearchResult[];
  error?: string;
  activeRequestId?: string;
  suggestions: SearchResult[];
  loadingSuggestions: boolean;
}

const initialState: SearchState = {
  query: '',
  loading: false,
  results: [],
  suggestions: [],
  loadingSuggestions: false,
};

/**
 * Async search thunk
 * - Debounce handled at UI layer
 * - Abort handled in SearchService
 */
export const executeGlobalSearch = createAsyncThunk<
  SearchResult[],
  { query: string; category?: string; type?: string; tags?: string[]; recordRecent?: boolean },
  { state: RootState, rejectValue: string }
>('search/execute', async ({ query, category, type, tags, recordRecent = true }, { getState, rejectWithValue }) => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const state = getState();
    const { selectedAddress } = state.address;
    const { currentLocation } = state.location;

    const lat = selectedAddress?.latitude || currentLocation?.latitude;
    const lng = selectedAddress?.longitude || currentLocation?.longitude;

    const results = await globalSearch(query.trim(), category, type, tags, lat, lng);

    if (recordRecent) {
      await saveRecentSearch(query.trim());

      // Persist successful search - simplified to just query for now or expand if needed
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          query: query.trim(),
          results,
        })
      );
    }

    return results;
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Search failed');
  }
});

export const fetchSearchSuggestions = createAsyncThunk<
  SearchResult[],
  { query: string },
  { state: RootState, rejectValue: string }
>('search/fetchSuggestions', async ({ query }, { getState, rejectWithValue }) => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const state = getState();
    const { selectedAddress } = state.address;
    const { currentLocation } = state.location;

    const lat = selectedAddress?.latitude || currentLocation?.latitude;
    const lng = selectedAddress?.longitude || currentLocation?.longitude;

    const results = await globalSearch(query.trim(), undefined, undefined, undefined, lat, lng);
    return results.slice(0, 6);
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Failed to fetch suggestions');
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
      state.suggestions = [];
      state.loadingSuggestions = false;
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
      })
      .addCase(fetchSearchSuggestions.pending, (state) => {
        state.loadingSuggestions = true;
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.loadingSuggestions = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchSearchSuggestions.rejected, (state) => {
        state.loadingSuggestions = false;
      });
  },
});

export const { setQuery, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
