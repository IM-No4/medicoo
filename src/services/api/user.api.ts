import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';

export const getProfileDetails = async () => {
    const res = await apiClient.get('/api/user/get-profile');
    return res.data;
};

// Helper to identify local file URIs
const isLocalFile = (uri: string) =>
    uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:'));

export const updateProfile = async (formData: any) => {
    // See document.api.ts's uploadDocument for why this Content-Type must
    // be set explicitly (confirmed via a live device trace).
    const res = await apiClient.put('/api/user/save-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const sendEmailOtp = async (email: string) => {
    const res = await apiClient.post('/api/user/send-email-otp', { email });
    return res.data;
};

export const verifyEmailOtp = async (otp: string) => {
    const res = await apiClient.post('/api/user/verify-email-otp', { otp });
    return res.data;
};

// Doctor Profile APIs
export const getDoctorProfile = async () => {
    const res = await apiClient.get('/api/user/get-doctor-profile');
    return res.data;
};

export const updateDoctorDraft = async (formData: FormData) => {
    const res = await apiClient.put('/api/user/update-doctor-draft', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const applyAsDoctor = async (formData: FormData) => {
    const res = await apiClient.post('/api/user/apply-doctor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

// Update specific doctor settings (status, fees, availability, urgent
// surcharge) without full application flow
export const updateDoctorSettings = async (data: {
    isOnline?: boolean;
    consultationFees?: any;
    notificationSettings?: any;
    availability?: Record<string, { enabled: boolean; start: string; end: string }>;
    urgentSurchargePercent?: number;
}) => {
    const res = await apiClient.put('/api/user/update-doctor-settings', data);
    return res.data;
};

// Nearby Doctors API
export const getNearbyDoctors = async (params: {
    page?: number;
    query?: string;
    specialization?: string;
    sort?: 'price_low_to_high' | 'price_high_to_low' | 'rating_high_to_low' | 'rating_low_to_high' | 'responsiveness_high_to_low';
}) => {
    const res = await apiClient.get('/api/user/nearby-doctors', { params });
    return res.data.doctors || [];
};

// Favorite Doctors - same backend-first, AsyncStorage-fallback shape as
// pharmacy.api.ts's favorite-store helpers, kept consistent since the
// backend doesn't have either endpoint set implemented yet.
export const addFavoriteDoctor = async (doctorId: string) => {
    try {
        const response = await apiClient.post('/api/user/add-favorite-doctor', { doctorId });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            try {
                const stored = await AsyncStorage.getItem('favorite_doctors');
                const list = stored ? JSON.parse(stored) : [];
                if (!list.includes(doctorId)) {
                    list.push(doctorId);
                    await AsyncStorage.setItem('favorite_doctors', JSON.stringify(list));
                }
            } catch (storageError) {
                console.error('Failed to save favorite doctor in storage', storageError);
            }
        } else {
            console.warn('Failed to add favorite doctor:', error.message);
        }
        return null;
    }
};

export const removeFavoriteDoctor = async (doctorId: string) => {
    try {
        const response = await apiClient.post('/api/user/remove-favorite-doctor', { doctorId });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            try {
                const stored = await AsyncStorage.getItem('favorite_doctors');
                const list = stored ? JSON.parse(stored) : [];
                const updated = list.filter((id: string) => id !== doctorId);
                await AsyncStorage.setItem('favorite_doctors', JSON.stringify(updated));
            } catch (storageError) {
                console.error('Failed to remove favorite doctor in storage', storageError);
            }
        } else {
            console.warn('Failed to remove favorite doctor:', error.message);
        }
        return null;
    }
};

export const getFavoriteDoctors = async () => {
    try {
        const response = await apiClient.get('/api/user/favorite-doctors');
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            try {
                const stored = await AsyncStorage.getItem('favorite_doctors');
                const list = stored ? JSON.parse(stored) : [];
                return list.map((id: string) => ({ doctorId: id, id }));
            } catch {
                return [];
            }
        }
        return [];
    }
};
