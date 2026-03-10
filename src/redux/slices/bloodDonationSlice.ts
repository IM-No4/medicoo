import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { bloodDonationApi, BloodDonorApplication, BloodEligibilityData, DonorProfile } from '../../services/api/bloodDonation.api';

interface BloodDonationState {
    profile: DonorProfile | null;
    loading: boolean;
    error: string | null;
    isEligible: boolean | null;
}

const initialState: BloodDonationState = {
    profile: null,
    loading: false,
    error: null,
    isEligible: null,
};

export const fetchDonorProfile = createAsyncThunk(
    'bloodDonation/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            return await bloodDonationApi.getDonorProfile();
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const checkEligibility = createAsyncThunk(
    'bloodDonation/checkEligibility',
    async (data: BloodEligibilityData, { rejectWithValue }) => {
        try {
            return await bloodDonationApi.checkEligibility(data);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const applyAsDonor = createAsyncThunk(
    'bloodDonation/applyAsDonor',
    async (data: BloodDonorApplication, { rejectWithValue }) => {
        try {
            return await bloodDonationApi.applyAsDonor(data);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const bloodDonationSlice = createSlice({
    name: 'bloodDonation',
    initialState,
    reducers: {
        resetEligibility: (state) => {
            state.isEligible = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDonorProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDonorProfile.fulfilled, (state, action: PayloadAction<DonorProfile>) => {
                state.loading = false;
                state.profile = action.payload;
                state.isEligible = action.payload.isEligible;
            })
            .addCase(fetchDonorProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(checkEligibility.fulfilled, (state, action) => {
                state.isEligible = action.payload.isEligible;
            })
            .addCase(applyAsDonor.fulfilled, (state, action) => {
                state.profile = action.payload; // Update profile with donor info
            });
    },
});

export const { resetEligibility } = bloodDonationSlice.actions;
export default bloodDonationSlice.reducer;
