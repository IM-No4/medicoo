import { apiClient } from './client';

export const getConsultations = async () => {
    const res = await apiClient.get('/api/user/consultations');
    return res.data;
};

export const getConsultationDetail = async (id: string) => {
    const res = await apiClient.get(`/api/user/consultations/${id}`);
    return res.data;
};

export const getDoctorById = async (id: string) => {
    const res = await apiClient.get(`/api/user/doctor-details/${id}`);
    return res.data;
};

export const getPublicDoctorProfile = async (id: string) => {
    const res = await apiClient.get(`/api/user/public-doctor-profile/${id}`);
    return res.data;
};

export const submitDoctorFeedback = async (data: {
    doctorId: string,
    consultationId: string,
    rating: number,
    review: string
}) => {
    const res = await apiClient.post('/api/doctor/feedback', data);
    return res.data;
};

export const respondToAppointmentRequest = async (data: {
    requestId: string;
    status: 'approved' | 'rejected';
    remarks?: string;
}) => {
    const res = await apiClient.post(`/api/doctor/appointment-requests/${data.requestId}/respond`, {
        status: data.status,
        remarks: data.remarks,
    });
    return res.data;
};

export const getDoctorAppointmentRequests = async (params?: {
    status?: 'all' | 'requests' | 'upcoming' | 'history' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    page?: number;
    limit?: number;
}) => {
    const res = await apiClient.get('/api/doctor/appointment-requests', { params });
    return res.data;
};

// --- New Call & Consultation APIs ---

export const storePatientChannel = async (patientId: string, doctorId: string, channelName: string, slotId: string) => {
    // This endpoint should be implemented on backend to store the active call channel
    const res = await apiClient.post('/api/doctor/store-channel', { patientId, doctorId, channelName, slotId });
    return res.data;
};

export const fetchPatientReports = async (customerId: string) => {
    const res = await apiClient.get(`/api/doctor/patient-reports/${customerId}`);
    return res.data;
};

export const fetchMedicines = async (query: string) => {
    const res = await apiClient.get('/api/common/medicines', { params: { search: query } });
    return res.data;
};

export const fetchLabTests = async (query: string) => {
    const res = await apiClient.get('/api/common/lab-tests', { params: { search: query } });
    return res.data;
};

export const saveConsultationDetails = async (data: any) => {
    const res = await apiClient.post('/api/doctor/save-consultation', data);
    return res.data;
};
