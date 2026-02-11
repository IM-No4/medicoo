import { apiClient } from './client';

export const getMyOrders = async () => {
    const res = await apiClient.get('/api/user/orders');
    return res.data;
};

export const getOrderDetail = async (id: string) => {
    const res = await apiClient.get(`/api/user/orders/${id}`);
    return res.data;
};

export const cancelOrder = async (id: string) => {
    const res = await apiClient.post(`/api/user/orders/${id}/cancel`);
    return res.data;
};

export const trackOrder = async (id: string) => {
    const res = await apiClient.get(`/api/user/orders/${id}/track`);
    return res.data;
};
