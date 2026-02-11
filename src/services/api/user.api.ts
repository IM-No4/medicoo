import { apiClient } from './client';

export const getProfileDetails = async () => {
    const res = await apiClient.get('/api/user/get-profile');
    return res.data;
};

// Helper to identify local file URIs
const isLocalFile = (uri: string) =>
    uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:'));

export const updateProfile = async (formData: any) => {
    // We use 'multipart/form-data' which axios handles if we pass FormData
    const res = await apiClient.put('/api/user/save-profile', formData);
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
    const res = await apiClient.put(
        '/api/user/update-doctor-draft',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return res.data;
};

export const applyAsDoctor = async (formData: FormData) => {
    const res = await apiClient.post(
        '/api/user/apply-doctor',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    return res.data;
};

// Update specific doctor settings (status, fees) without full application flow
export const updateDoctorSettings = async (data: {
    isOnline?: boolean;
    consultationFees?: any;
    notificationSettings?: any;
}) => {
    const res = await apiClient.put('/api/user/update-doctor-settings', data);
    return res.data;
};

// Nearby Doctors API
export const getNearbyDoctors = async (params: {
    page?: number;
    query?: string;
    specialization?: string;
    sort?: 'price_low_to_high' | 'price_high_to_low' | 'rating_high_to_low' | 'rating_low_to_high';
}) => {
    const res = await apiClient.get('/api/user/nearby-doctors', { params });
    return res.data.doctors || [];
};
