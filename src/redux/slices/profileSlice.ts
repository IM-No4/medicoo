import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getProfileDetails } from '../../services/api/user.api';
import { loadProfileSummary, saveProfileSummary } from '../../services/storage/profileStorage';

// Just the user's name, cached on-device - exists purely so OfflineHomeHeader
// can show "Good morning, <name>" without any network call. The rest of the
// app already fetches the full profile itself wherever it's actually needed
// (ProfileScreen, EditProfileScreen, etc.) - this isn't meant to replace that.
interface ProfileState {
    name: string | null;
}

const initialState: ProfileState = {
    name: null,
};

export const loadProfileCache = createAsyncThunk('profile/loadCache', async () => {
    const summary = await loadProfileSummary();
    return summary?.name ?? null;
});

export const loadProfileFromServer = createAsyncThunk('profile/loadFromServer', async () => {
    const profile = await getProfileDetails();
    const name = profile?.name ?? null;
    await saveProfileSummary({ name });
    return name;
});

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loadProfileCache.fulfilled, (state, action) => {
                if (action.payload) state.name = action.payload;
            })
            .addCase(loadProfileFromServer.fulfilled, (state, action) => {
                state.name = action.payload;
            });
        // Deliberately no .rejected handling - a failed network fetch just
        // leaves whatever the cache (or nothing) already provided in place.
    },
});

export default profileSlice.reducer;
