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
    }
};
