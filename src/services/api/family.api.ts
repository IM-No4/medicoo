import { apiClient } from './client';

const BASE_URL = '/api/v1/family';

export const addFamilyMember = async (memberData: any) => {
    // See document.api.ts's uploadDocument for why this Content-Type must
    // be set explicitly for the FormData case (confirmed via a live device
    // trace).
    const isFormData = memberData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await apiClient.post(`${BASE_URL}/add-member`, memberData, config);
    return res.data;
};

export const getFamilyMembers = async () => {
    const res = await apiClient.get(`${BASE_URL}/members`);
    return res.data;
};

export const removeFamilyMember = async (memberId: string) => {
    const res = await apiClient.delete(`${BASE_URL}/member/${memberId}`);
    return res.data;
};

export const getIncomingRequests = async () => {
    const res = await apiClient.get(`${BASE_URL}/incoming-requests`);
    return res.data;
};

export const respondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    const res = await apiClient.post(`${BASE_URL}/respond-request`, { requestId, action });
    return res.data;
};

export const leaveFamily = async (memberId?: string) => {
    const res = await apiClient.post(`${BASE_URL}/leave-family`, { memberId });
    return res.data;
};
