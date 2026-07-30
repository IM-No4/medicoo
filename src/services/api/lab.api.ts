import { apiClient } from './client';

export const getMyLabTests = async () => {
    try {
        const res = await apiClient.get('/api/user/lab-tests');
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return []; // Endpoint not yet available — show empty state
        }
        throw error;
    }
};

export const getLabTestDetail = async (id: string) => {
    const res = await apiClient.get(`/api/user/lab-tests/${id}`);
    return res.data;
};

export const downloadLabReport = async (id: string) => {
    const res = await apiClient.get(`/api/user/lab-tests/${id}/report`);
    return res.data;
};
