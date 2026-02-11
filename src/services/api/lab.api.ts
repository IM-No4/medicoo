import { apiClient } from './client';

export const getMyLabTests = async () => {
    const res = await apiClient.get('/api/user/lab-tests');
    return res.data;
};

export const getLabTestDetail = async (id: string) => {
    const res = await apiClient.get(`/api/user/lab-tests/${id}`);
    return res.data;
};

export const downloadLabReport = async (id: string) => {
    const res = await apiClient.get(`/api/user/lab-tests/${id}/report`);
    return res.data;
};
