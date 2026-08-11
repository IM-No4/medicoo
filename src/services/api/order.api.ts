import { apiClient } from './client';

export const getMyOrders = async () => {
    try {
        const res = await apiClient.get('/api/user/orders');
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return []; // Endpoint not yet available — show empty state
        }
        throw error;
    }
};

export const getOrderDetail = async (id: string) => {
    const res = await apiClient.get(`/api/user/orders/${id}`);
    return res.data;
};

export const cancelOrder = async (id: string) => {
    const res = await apiClient.post(`/api/user/orders/${id}/cancel`);
    return res.data;
};

export const getOrderChatOptions = async (orderId: string) => {
    const res = await apiClient.get(`/api/user/orders/${orderId}/chat/options`);
    return res.data;
};

export const sendOrderChatMessage = async (orderId: string, message: string) => {
    const res = await apiClient.post(`/api/user/orders/${orderId}/chat`, { message });
    return res.data;
};

export const getOrderChatHistory = async (orderId: string) => {
    const res = await apiClient.get(`/api/user/orders/${orderId}/chat/history`);
    return res.data;
};

export const restartOrderChat = async (orderId: string) => {
    const res = await apiClient.post(`/api/user/orders/${orderId}/chat/restart`);
    return res.data;
};
