import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    bloodDonationApi,
    BloodDonorApplication,
    BloodEligibilityData,
    BloodRequestDetail,
    BloodRequestStatus,
    BloodRequestSubmission,
    BloodRequestSubmitResult,
    BloodRequestSummary,
    DonorProfile,
} from '../../services/api/bloodDonation.api';

interface BloodDonationState {
    profile: DonorProfile | null;
    loading: boolean;
    error: string | null;
    isEligible: boolean | null;

    // My own submitted request (as a requester)
    myRequest: BloodRequestSummary | null;
    myRequestLoading: boolean;
    submitResult: BloodRequestSubmitResult | null;
    submitLoading: boolean;
    submitError: string | null;

    // An incoming request I've been notified about (as a donor)
    currentRequestDetail: BloodRequestDetail | null;
    requestDetailLoading: boolean;
    respondStatus: 'idle' | 'loading' | 'success' | 'already_filled' | 'error';
    respondError: string | null;
}

const initialState: BloodDonationState = {
    profile: null,
    loading: false,
    error: null,
    isEligible: null,

    myRequest: null,
    myRequestLoading: false,
    submitResult: null,
    submitLoading: false,
    submitError: null,

    currentRequestDetail: null,
    requestDetailLoading: false,
    respondStatus: 'idle',
    respondError: null,
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

export const submitBloodRequest = createAsyncThunk(
    'bloodDonation/submitRequest',
    async (data: BloodRequestSubmission, { rejectWithValue }) => {
        try {
            return await bloodDonationApi.submitBloodRequest(data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchMyBloodRequest = createAsyncThunk(
    'bloodDonation/fetchMyRequest',
    async (_, { rejectWithValue }) => {
        try {
            return await bloodDonationApi.getMyBloodRequest();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchBloodRequestById = createAsyncThunk(
    'bloodDonation/fetchRequestById',
    async (requestId: string, { rejectWithValue }) => {
        try {
            return await bloodDonationApi.getBloodRequestById(requestId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Rejects with a structured payload so the UI can distinguish "another
// donor already accepted this" (409/ALREADY_FILLED) from a generic failure.
export const respondToBloodRequest = createAsyncThunk(
    'bloodDonation/respond',
    async ({ requestId, response }: { requestId: string; response: 'ACCEPT' | 'DECLINE' }, { rejectWithValue }) => {
        try {
            return await bloodDonationApi.respondToBloodRequest(requestId, response);
        } catch (error: any) {
            const code = error.response?.data?.code;
            const message = error.response?.data?.message || error.message;
            return rejectWithValue({ code, message });
        }
    }
);

const bloodDonationSlice = createSlice({
    name: 'bloodDonation',
    initialState,
    reducers: {
        resetEligibility: (state) => {
            state.isEligible = null;
        },
        resetRespondStatus: (state) => {
            state.respondStatus = 'idle';
            state.respondError = null;
        },
        resetSubmitResult: (state) => {
            state.submitResult = null;
            state.submitError = null;
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
            })
            .addCase(submitBloodRequest.pending, (state) => {
                state.submitLoading = true;
                state.submitError = null;
            })
            .addCase(submitBloodRequest.fulfilled, (state, action: PayloadAction<BloodRequestSubmitResult>) => {
                state.submitLoading = false;
                state.submitResult = action.payload;
            })
            .addCase(submitBloodRequest.rejected, (state, action) => {
                state.submitLoading = false;
                state.submitError = action.payload as string;
            })
            .addCase(fetchMyBloodRequest.pending, (state) => {
                state.myRequestLoading = true;
            })
            .addCase(fetchMyBloodRequest.fulfilled, (state, action: PayloadAction<BloodRequestSummary | null>) => {
                state.myRequestLoading = false;
                state.myRequest = action.payload;
            })
            .addCase(fetchMyBloodRequest.rejected, (state) => {
                state.myRequestLoading = false;
            })
            .addCase(fetchBloodRequestById.pending, (state) => {
                state.requestDetailLoading = true;
                state.respondStatus = 'idle';
                state.respondError = null;
            })
            .addCase(fetchBloodRequestById.fulfilled, (state, action: PayloadAction<BloodRequestDetail>) => {
                state.requestDetailLoading = false;
                state.currentRequestDetail = action.payload;
            })
            .addCase(fetchBloodRequestById.rejected, (state) => {
                state.requestDetailLoading = false;
                state.currentRequestDetail = null;
            })
            .addCase(respondToBloodRequest.pending, (state) => {
                state.respondStatus = 'loading';
                state.respondError = null;
            })
            .addCase(respondToBloodRequest.fulfilled, (state, action: PayloadAction<{ status: BloodRequestStatus }>) => {
                state.respondStatus = 'success';
                if (state.currentRequestDetail) {
                    state.currentRequestDetail.status = action.payload.status;
                }
            })
            .addCase(respondToBloodRequest.rejected, (state, action) => {
                const payload = action.payload as { code?: string; message?: string } | undefined;
                state.respondStatus = payload?.code === 'ALREADY_FILLED' ? 'already_filled' : 'error';
                state.respondError = payload?.message || 'Something went wrong. Please try again.';
            });
    },
});

export const { resetEligibility, resetRespondStatus, resetSubmitResult } = bloodDonationSlice.actions;
export default bloodDonationSlice.reducer;
