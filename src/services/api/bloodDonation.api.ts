import { apiClient } from './client';

export interface BloodEligibilityData {
    age: number;
    weight: number;
    bloodGroup: string;
    lastDonationDate?: string;
    hasHealthIssues: boolean;
    isMedicated: boolean;
    hasRecentTattooOrPiercing: boolean;
}

export interface BloodDonorApplication {
    bloodGroup: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    availableForEmergency: boolean;
}

export interface DonorProfile {
    id: string;
    isEligible: boolean;
    bloodGroup?: string;
    totalDonations: number;
    points: number;
    badges: Badge[];
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
}

export type BloodUrgencyLevel = 'NORMAL' | 'HIGH' | 'CRITICAL';
export type BloodRequestStatus = 'OPEN' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';

export interface BloodRequestSubmission {
    patientName?: string;
    hospital: string;
    location: string;
    latitude: number;
    longitude: number;
    bloodGroup: string;
    unitsRequired?: number;
    urgencyLevel: BloodUrgencyLevel;
    contactNumber: string;
}

export interface BloodRequestSubmitResult {
    requestId: string;
    notifiedDonorCount: number;
    radiusKm: number;
}

export interface BloodRequestSummary {
    _id: string;
    patientName?: string;
    hospital: string;
    location: string;
    bloodGroup: string;
    unitsRequired?: number;
    urgencyLevel: BloodUrgencyLevel;
    status: BloodRequestStatus;
    requestTime: string;
    expiryTime?: string;
}

export interface BloodRequestDetail {
    id: string;
    patientName?: string;
    hospital: string;
    location: string;
    bloodGroup: string;
    unitsRequired?: number;
    urgencyLevel: BloodUrgencyLevel;
    contactNumber: string;
    status: BloodRequestStatus;
    requestTime: string;
    expiryTime?: string;
    isRequester: boolean;
    distanceKm: number | null;
    myResponse: 'ACCEPTED' | 'DECLINED' | 'TOO_LATE' | null;
    acceptedDonorId: string | null;
}

export const bloodDonationApi = {
    checkEligibility: async (data: BloodEligibilityData) => {
        const response = await apiClient.post('/api/blood-donation/check-eligibility', data);
        return response.data;
    },
    applyAsDonor: async (data: BloodDonorApplication) => {
        const response = await apiClient.post('/api/blood-donation/apply', data);
        return response.data;
    },
    getDonorProfile: async () => {
        const response = await apiClient.get<DonorProfile>('/api/blood-donation/profile');
        return response.data;
    },
    getDonationHistory: async () => {
        const response = await apiClient.get('/api/blood-donation/history');
        return response.data;
    },
    claimDonationPoints: async (donationId: string) => {
        const response = await apiClient.post(`/api/blood-donation/claim-points/${donationId}`);
        return response.data;
    },
    submitBloodRequest: async (data: BloodRequestSubmission) => {
        const response = await apiClient.post('/api/blood-donation/requests', data);
        return response.data.data as BloodRequestSubmitResult;
    },
    getMyBloodRequest: async () => {
        const response = await apiClient.get('/api/blood-donation/requests/mine');
        return response.data.data as BloodRequestSummary | null;
    },
    getBloodRequestById: async (id: string) => {
        const response = await apiClient.get(`/api/blood-donation/requests/${id}`);
        return response.data.data as BloodRequestDetail;
    },
    // A 409 (someone else already accepted) rejects like any other non-2xx
    // response - callers should catch it and read
    // error.response?.data?.code === 'ALREADY_FILLED', same as the redux
    // thunk below does via rejectWithValue.
    respondToBloodRequest: async (id: string, response: 'ACCEPT' | 'DECLINE') => {
        const res = await apiClient.post(`/api/blood-donation/requests/${id}/respond`, { response });
        return res.data.data as { status: BloodRequestStatus };
    }
};
